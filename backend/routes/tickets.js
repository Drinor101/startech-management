import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';
import { logActivity } from '../middleware/activityLogger.js';

const router = express.Router();

// Merr të gjitha tiketat
router.get('/', authenticateUser, async (req, res) => {
  try {
    console.log('Fetching tickets...');
    const { search } = req.query;
    const currentUser = req.user; // Përdoruesi i loguar
    
    let query = supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });

    // Search functionality - improved search across multiple fields
    if (search) {
      const searchTerm = `%${search}%`;
      query = query.or(`title.ilike.${searchTerm},description.ilike.${searchTerm},id.ilike.${searchTerm},created_by.ilike.${searchTerm},assigned_to.ilike.${searchTerm},source.ilike.${searchTerm}`);
    }

    // Filtri për tiketat e përcaktuar për atë përdorues
    // Administrator dhe Menaxher shohin të gjitha tiketat
    console.log('Tickets - Current user role:', currentUser.role);
    console.log('Tickets - Current user name:', currentUser.name);
    
    // Kontrollo rolin (case insensitive)
    const userRole = currentUser.role?.toLowerCase();
    const isAdmin = userRole === 'administrator' || userRole === 'admin';
    const isManager = userRole === 'menaxher' || userRole === 'manager';
    
    if (!isAdmin && !isManager) {
      // Të tjerët shohin vetëm tiketat e përcaktuar për ta
      console.log('Tickets - Applying filter for user:', currentUser.name);
      query = query.eq('assigned_to', currentUser.name);
    } else {
      console.log('Tickets - No filter applied - user is Admin or Manager');
    }
    
    const { data, error } = await query;

    if (error) {
      console.error('Error fetching tickets:', error);
      return res.status(500).json({
        success: false,
        error: 'Gabim në ngarkimin e tiketave'
      });
    }

    // Transform data to match frontend interface
    const transformedData = data.map(ticket => ({
      id: ticket.id,
      title: ticket.title,
      source: ticket.source,
      createdBy: ticket.created_by,
      priority: ticket.priority,
      status: ticket.status,
      description: ticket.description,
      assignedTo: ticket.assigned_to,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
      resolvedAt: ticket.resolved_at,
      comments: [], // Will be loaded separately if needed
      history: [] // Will be loaded separately if needed
    }));

    res.json({
      success: true,
      data: transformedData,
      pagination: {
        total: transformedData.length,
        page: 1,
        limit: 100
      }
    });
  } catch (error) {
    console.error('Gabim në marrjen e tiketave:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në marrjen e tiketave: ' + error.message
    });
  }
});

// Merr një tiketë specifike
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single();

    if (ticketError) {
      console.error('Error fetching ticket:', ticketError);
      return res.status(404).json({
        success: false,
        error: 'Tiketa nuk u gjet'
      });
    }

    // Fetch comments
    const { data: comments } = await supabase
      .from('ticket_comments')
      .select('*')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true });

    // Fetch history
    const { data: history } = await supabase
      .from('ticket_history')
      .select('*')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true });

    const transformedTicket = {
      id: ticket.id,
      title: ticket.title,
      source: ticket.source,
      createdBy: ticket.created_by,
      priority: ticket.priority,
      status: ticket.status,
      description: ticket.description,
      assignedTo: ticket.assigned_to,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
      resolvedAt: ticket.resolved_at,
      comments: comments || [],
      history: history || []
    };

    res.json({
      success: true,
      data: transformedTicket
    });
  } catch (error) {
    console.error('Gabim në marrjen e tiketës:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në marrjen e tiketës: ' + error.message
    });
  }
});

// Krijon një tiketë të re
router.post('/', authenticateUser, async (req, res) => {
  try {
    const {
      title,
      source,
      priority = 'medium',
      description,
      assignedTo
    } = req.body;

    const userId = req.headers['x-user-id'];
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

    const createdBy = userData?.name || userData?.email || 'Unknown';

    // Generate TIK ID manually
    const currentYear = new Date().getFullYear().toString();
    const { data: lastTicket } = await supabase
      .from('tickets')
      .select('id')
      .like('id', `TIK-${currentYear}-%`)
      .order('id', { ascending: false })
      .limit(1)
      .single();

    let counter = 1;
    if (lastTicket && lastTicket.id) {
      const match = lastTicket.id.match(new RegExp(`^TIK-${currentYear}-(\\d+)$`));
      if (match) {
        counter = parseInt(match[1]) + 1;
      }
    }

    const ticketId = `TIK-${currentYear}-${counter.toString().padStart(3, '0')}`;

    const { data, error } = await supabase
      .from('tickets')
      .insert({
        id: ticketId,
        title,
        source,
        created_by: createdBy,
        priority,
        status: 'open',
        description,
        assigned_to: assignedTo
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating ticket:', error);
      return res.status(500).json({
        success: false,
        error: 'Gabim në krijimin e tiketës'
      });
    }

    // Add to history
    await supabase
      .from('ticket_history')
      .insert({
        ticket_id: data.id,
        action: 'Tiketa u krijua',
        user_id: userId,
        user_name: createdBy,
        details: `Tiketa "${title}" u krijua me prioritet ${priority}`
      });

    // Log user activity
    await logActivity(
      userId,
      createdBy,
      `Krijoi tiket ${data.id}`,
      'tickets',
      `Tiketa "${title}" u krijua me prioritet ${priority}`,
      req.ip
    );

    res.status(201).json({
      success: true,
      data: {
        id: data.id,
        title: data.title,
        source: data.source,
        createdBy: data.created_by,
        priority: data.priority,
        status: data.status,
        description: data.description,
        assignedTo: data.assigned_to,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        comments: [],
        history: []
      }
    });
  } catch (error) {
    console.error('Gabim në krijimin e tiketës:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në krijimin e tiketës: ' + error.message
    });
  }
});

// Përditëson një tiketë
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      source,
      priority,
      status,
      description,
      assignedTo
    } = req.body;

    const userId = req.headers['x-user-id'];
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

    const userName = userData?.name || userData?.email || 'Unknown';

    const updateData = {
      title,
      source,
      priority,
      status,
      description,
      assigned_to: assignedTo,
      updated_at: new Date().toISOString()
    };

    // If status is resolved, set resolved_at
    if (status === 'resolved' || status === 'closed') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating ticket:', error);
      return res.status(500).json({
        success: false,
        error: 'Gabim në përditësimin e tiketës'
      });
    }

    // Add to history
    await supabase
      .from('ticket_history')
      .insert({
        ticket_id: id,
        action: 'Tiketa u përditësua',
        user_id: userId,
        user_name: userName,
        details: `Tiketa u përditësua nga ${userName}`
      });

    res.json({
      success: true,
      data: {
        id: data.id,
        title: data.title,
        source: data.source,
        createdBy: data.created_by,
        priority: data.priority,
        status: data.status,
        description: data.description,
        assignedTo: data.assigned_to,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        resolvedAt: data.resolved_at
      }
    });
  } catch (error) {
    console.error('Gabim në përditësimin e tiketës:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në përditësimin e tiketës: ' + error.message
    });
  }
});

// Fshin një tiketë (vetëm admin)
router.delete('/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting ticket:', error);
      return res.status(500).json({
        success: false,
        error: 'Gabim në fshirjen e tiketës'
      });
    }

    res.json({
      success: true,
      message: 'Tiketa u fshi me sukses'
    });
  } catch (error) {
    console.error('Gabim në fshirjen e tiketës:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në fshirjen e tiketës: ' + error.message
    });
  }
});

// Shton koment në tiketë
router.post('/:id/comments', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const userId = req.headers['x-user-id'];
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

    const userName = userData?.name || userData?.email || 'Unknown';

    const { data, error } = await supabase
      .from('ticket_comments')
      .insert({
        ticket_id: id,
        user_id: userId,
        user_name: userName,
        message
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding comment:', error);
      return res.status(500).json({
        success: false,
        error: 'Gabim në shtimin e komentit'
      });
    }

    res.status(201).json({
      success: true,
      data: {
        id: data.id,
        ticketId: data.ticket_id,
        userId: data.user_id,
        userName: data.user_name,
        message: data.message,
        createdAt: data.created_at
      }
    });
  } catch (error) {
    console.error('Gabim në shtimin e komentit:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në shtimin e komentit: ' + error.message
    });
  }
});

// Merr statistikat e tiketave
router.get('/stats/overview', authenticateUser, async (req, res) => {
  try {
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('status, priority, created_at');

    if (error) {
      console.error('Error fetching ticket stats:', error);
      return res.status(500).json({
        success: false,
        error: 'Gabim në marrjen e statistikave'
      });
    }

    const stats = {
      total: tickets.length,
      byStatus: {
        open: tickets.filter(t => t.status === 'open').length,
        'in-progress': tickets.filter(t => t.status === 'in-progress').length,
        'waiting-customer': tickets.filter(t => t.status === 'waiting-customer').length,
        resolved: tickets.filter(t => t.status === 'resolved').length,
        closed: tickets.filter(t => t.status === 'closed').length
      },
      byPriority: {
        urgent: tickets.filter(t => t.priority === 'urgent').length,
        high: tickets.filter(t => t.priority === 'high').length,
        medium: tickets.filter(t => t.priority === 'medium').length,
        low: tickets.filter(t => t.priority === 'low').length
      },
      recent: tickets
        .filter(t => new Date(t.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        .length
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Gabim në marrjen e statistikave:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në marrjen e statistikave: ' + error.message
    });
  }
});

export default router;
