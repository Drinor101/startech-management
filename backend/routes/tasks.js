import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';
import { logUserActivity, logUserActivityAfter, logActivity } from '../middleware/activityLogger.js';

const router = express.Router();

// Merr të gjithë taskat
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { page = 1, limit = 10, type, status, priority, search } = req.query;
    const offset = (page - 1) * limit;
    const currentUser = req.user; // Përdoruesi i loguar

    let query = supabase
      .from('tasks')
      .select(`
        *,
        history:task_history(*)
      `)
      .order('created_at', { ascending: false });

    // Search functionality - improved search across multiple fields
    if (search) {
      try {
        const searchTerm = `%${search}%`;
        // Only search in ID field for exact prefix matching (TSK, TIK, etc.)
        if (search.match(/^[A-Z]{3}/)) {
          query = query.ilike('id', searchTerm);
        } else {
          // For other searches, search in all fields
          query = query.or(`title.ilike.${searchTerm},description.ilike.${searchTerm},id.ilike.${searchTerm},assigned_to.ilike.${searchTerm},category.ilike.${searchTerm},department.ilike.${searchTerm},source.ilike.${searchTerm}`);
        }
      } catch (searchError) {
        console.error('Tasks search query error:', searchError);
        // Continue without search if query fails
      }
    }

    // Filtri për taskat e përcaktuar për atë përdorues
    // Administrator dhe Menaxher shohin të gjitha taskat
    console.log('Current user role:', currentUser.role);
    console.log('Current user name:', currentUser.name);
    
    // Kontrollo rolin (case insensitive)
    const userRole = currentUser.role?.toLowerCase();
    const isAdmin = userRole === 'administrator' || userRole === 'admin';
    const isManager = userRole === 'menaxher' || userRole === 'manager';
    
    if (!isAdmin && !isManager) {
      // Të tjerët shohin vetëm taskat e përcaktuar për ta ose që kanë krijuar vetë
      console.log('Applying filter for user:', currentUser.name);
      const userName = currentUser.name.replace(/"/g, '\\"'); // Escape quotes
      query = query.or(`assigned_to.eq."${userName}",created_by.eq."${userName}"`);
    } else {
      console.log('No filter applied - user is Admin or Manager');
    }

    // Filtra
    if (type) {
      query = query.eq('type', type);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }

    // Paginimi
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    // Transform data to match frontend interface
    const transformedData = data.map(task => ({
      id: task.id,
      type: task.type,
      title: task.title,
      description: task.description,
      priority: task.priority,
      assignedTo: task.assigned_to,
      assignedBy: task.assigned_by,
      createdBy: task.created_by,
      visibleTo: task.visible_to || [],
      category: task.category,
      department: task.department,
      status: task.status,
      attachments: task.attachments || [],
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      completedAt: task.completed_at,
      customerId: task.customer_id,
      relatedOrderId: task.related_order_id,
      source: task.source,
      comments: Array.isArray(task.comments) ? task.comments : (task.comments ? JSON.parse(task.comments) : []),
      history: Array.isArray(task.history) ? task.history : (task.history ? JSON.parse(task.history) : [])
    }));

    res.json({
      success: true,
      data: transformedData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Gabim në marrjen e taskave:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në marrjen e taskave'
    });
  }
});

// Merr një task specifik
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        history:task_history(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Tasku nuk u gjet'
      });
    }

    // Check role access
    const currentUser = req.user;
    const userRole = currentUser.role?.toLowerCase();
    const isAdmin = userRole === 'administrator' || userRole === 'admin';
    const isManager = userRole === 'menaxher' || userRole === 'manager';
    
    if (!isAdmin && !isManager) {
      // Check if user can see this task
      const canSee = data.assigned_to === currentUser.name || 
                    (data.visible_to && data.visible_to.includes(currentUser.name)) ||
                    data.created_by === currentUser.name;
      
      if (!canSee) {
        return res.status(403).json({
          success: false,
          error: 'Nuk keni të drejtë të shikoni këtë task'
        });
      }
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Gabim në marrjen e taskut:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në marrjen e taskut'
    });
  }
});

// Krijon një task të ri
router.post('/', authenticateUser, logUserActivityAfter('CREATE', 'TASKS'), async (req, res) => {
  try {
    console.log('Task creation request body:', req.body);
    
    const userId = req.user.id;
    let userName = req.user.name || req.user.email?.split('@')[0] || 'Unknown';
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID mungon'
      });
    }

    // Get user info
    const { data: userData } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', userId)
      .single();

    // Update userName with actual user data if available
    if (userData?.name || userData?.email) {
      userName = userData.name || userData.email || userName;
    }

    // Generate TSK ID manually
    const currentYear = new Date().getFullYear().toString();
    const { data: lastTask } = await supabase
      .from('tasks')
      .select('id')
      .like('id', `TSK-${currentYear}-%`)
      .order('id', { ascending: false })
      .limit(1)
      .single();

    let counter = 1;
    if (lastTask && lastTask.id) {
      const match = lastTask.id.match(new RegExp(`^TSK-${currentYear}-(\\d+)$`));
      if (match) {
        counter = parseInt(match[1]) + 1;
      }
    }

    const taskId = `TSK-${currentYear}-${counter.toString().padStart(3, '0')}`;
    
    const taskData = {
      id: taskId,
      type: req.body.type || 'task',
      title: req.body.title,
      description: req.body.description,
      priority: req.body.priority || 'medium',
      status: req.body.status || 'todo',
      assigned_to: req.body.assignedToName || req.body.assignedTo || userName, // Default to creator if not specified
      assigned_by: req.body.assignedBy || userName,
      created_by: userName,
      department: req.body.department,
      visible_to: req.body.visibleTo || [userName], // Include creator in visible_to
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert(taskData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    // Add to history
    await supabase
      .from('task_history')
      .insert({
        task_id: data.id,
        action: 'Tasku u krijua',
        user_id: userId,
        user_name: userName,
        details: `Tasku "${data.title}" u krijua me prioritet ${data.priority}`
      });

    // Provide activity metadata for middleware logger
    res.locals.activityDetails = {
      entity_type: 'TASK',
      entity_id: data.id,
      title: data.title
    };

    res.status(201).json({
      success: true,
      data: {
        id: data.id,
        type: data.type,
        title: data.title,
        description: data.description,
        priority: data.priority,
        assignedTo: data.assigned_to,
        assignedBy: data.assigned_by,
        createdBy: data.created_by,
        department: data.department,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        completedAt: data.completed_at,
        comments: [],
        history: []
      },
      message: 'Tasku u krijua me sukses'
    });
  } catch (error) {
    console.error('Gabim në krijimin e taskut:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Gabim në krijimin e taskut'
    });
  }
});

// Përditëson një task
router.put('/:id', authenticateUser, logUserActivityAfter('UPDATE', 'TASKS'), async (req, res) => {
  try {
    console.log('Task update request body:', req.body);
    
    const { id } = req.params;
    const userId = req.user.id;
    let userName = req.user.name || req.user.email?.split('@')[0] || 'Unknown';
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID mungon'
      });
    }

    // Get user info
    const { data: userData } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', userId)
      .single();

    // Update userName with actual user data if available
    if (userData?.name || userData?.email) {
      userName = userData.name || userData.email || userName;
    }

    // Check role access
    const currentUser = req.user;
    const userRole = currentUser.role?.toLowerCase();
    const isAdmin = userRole === 'administrator' || userRole === 'admin';
    const isManager = userRole === 'menaxher' || userRole === 'manager';
    
    if (!isAdmin && !isManager) {
      // Check if user can update this task
      const { data: existingTask } = await supabase
        .from('tasks')
        .select('assigned_to, visible_to, created_by')
        .eq('id', id)
        .single();
      
      if (existingTask) {
        const canUpdate = existingTask.assigned_to === currentUser.name || 
                         (existingTask.visible_to && existingTask.visible_to.includes(currentUser.name)) ||
                         existingTask.created_by === currentUser.name;
        
        if (!canUpdate) {
          return res.status(403).json({
            success: false,
            error: 'Nuk keni të drejtë të përditësoni këtë task'
          });
        }
      }
    }

    const updates = {
      title: req.body.title,
      description: req.body.description,
      priority: req.body.priority,
      status: req.body.status,
      assigned_to: req.body.assignedToName || req.body.assignedTo,
      assigned_by: req.body.assignedBy,
      department: req.body.department,
      updated_at: new Date().toISOString()
    };

    // Heq fushët që nuk duhet të përditësohen
    delete updates.id;
    delete updates.created_at;
    delete updates.created_by;

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Add to history
    await supabase
      .from('task_history')
      .insert({
        task_id: id,
        action: 'Tasku u përditësua',
        user_id: userId,
        user_name: userName,
        details: `Tasku "${data.title}" u përditësua`
      });

    // Transform response data to camelCase
    const transformedData = {
      id: data.id,
      type: data.type,
      title: data.title,
      description: data.description,
      priority: data.priority,
      assignedTo: data.assigned_to,
      assignedBy: data.assigned_by,
      createdBy: data.created_by,
      department: data.department,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      completedAt: data.completed_at
    };

    // Provide activity metadata for middleware logger
    res.locals.activityDetails = {
      entity_type: 'TASK',
      entity_id: data.id,
      title: data.title
    };

    res.json({
      success: true,
      data: transformedData,
      message: 'Tasku u përditësua me sukses'
    });
  } catch (error) {
    console.error('Gabim në përditësimin e taskut:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në përditësimin e taskut'
    });
  }
});

// Fshin një task (vetëm admin)
router.delete('/:id', authenticateUser, logUserActivityAfter('DELETE', 'TASKS'), async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    // Check role access
    const userRole = currentUser.role?.toLowerCase();
    const isAdmin = userRole === 'administrator' || userRole === 'admin';
    const isManager = userRole === 'menaxher' || userRole === 'manager';
    
    if (!isAdmin && !isManager) {
      // Check if user can delete this task
      const { data: existingTask } = await supabase
        .from('tasks')
        .select('assigned_to, visible_to, created_by')
        .eq('id', id)
        .single();
      
      if (existingTask) {
        const canDelete = existingTask.assigned_to === currentUser.name || 
                         (existingTask.visible_to && existingTask.visible_to.includes(currentUser.name)) ||
                         existingTask.created_by === currentUser.name;
        
        if (!canDelete) {
          return res.status(403).json({
            success: false,
            error: 'Nuk keni të drejtë të fshini këtë task'
          });
        }
      }
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    // Provide activity metadata for middleware logger
    res.locals.activityDetails = {
      entity_type: 'TASK',
      entity_id: id,
      title: id
    };

    res.json({
      success: true,
      message: 'Tasku u fshi me sukses'
    });
  } catch (error) {
    console.error('Gabim në fshirjen e taskut:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në fshirjen e taskut'
    });
  }
});

// Shton një koment në task
router.post('/:id/comments', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    // Shto komentin në kolonën comments të task-ut
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .select('comments')
      .eq('id', id)
      .single();

    if (taskError) {
      throw taskError;
    }

    // Parse komentet ekzistuese ose krijo array të ri
    let comments = [];
    if (taskData.comments) {
      try {
        comments = JSON.parse(taskData.comments);
      } catch (e) {
        comments = [];
      }
    }

    // Shto komentin e ri
    const newComment = {
      id: Date.now().toString(), // ID i thjeshtë për frontend
      message: req.body.message,
      user_id: req.user.id,
      user_name: req.user.email.split('@')[0],
      created_at: new Date().toISOString()
    };

    comments.push(newComment);

    // Përditëso task-un me komentet e reja
    const { data, error } = await supabase
      .from('tasks')
      .update({ 
        comments: JSON.stringify(comments),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      success: true,
      data: data,
      message: 'Komenti u shtua me sukses'
    });
  } catch (error) {
    console.error('Gabim në shtimin e komentit:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në shtimin e komentit'
    });
  }
});

// Merr statistikat e taskave
router.get('/stats/overview', authenticateUser, async (req, res) => {
  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('type, status, priority, created_at');

    if (error) {
      throw error;
    }

    // Llogarit statistikat
    const stats = {
      total: tasks.length,
      tasks: tasks.filter(t => t.type === 'task').length,
      tickets: tasks.filter(t => t.type === 'ticket').length,
      todo: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      review: tasks.filter(t => t.status === 'review').length,
      done: tasks.filter(t => t.status === 'done').length
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Gabim në marrjen e statistikave:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në marrjen e statistikave'
    });
  }
});

export default router;

