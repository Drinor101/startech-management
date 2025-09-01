import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Merr të gjithë taskat
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { page = 1, limit = 10, type, status, priority } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('tasks')
      .select(`
        *,
        comments:task_comments(*),
        history:task_history(*)
      `)
      .order('created_at', { ascending: false });

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

    res.json({
      success: true,
      data: data,
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
        comments:task_comments(*),
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
router.post('/', authenticateUser, async (req, res) => {
  try {
    const taskData = {
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert(taskData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      success: true,
      data: data,
      message: 'Tasku u krijua me sukses'
    });
  } catch (error) {
    console.error('Gabim në krijimin e taskut:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në krijimin e taskut'
    });
  }
});

// Përditëson një task
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {
      ...req.body,
      updated_at: new Date().toISOString()
    };

    // Heq fushët që nuk duhet të përditësohen
    delete updates.id;
    delete updates.created_at;

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data,
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
router.delete('/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

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
    const comment = {
      ...req.body,
      task_id: id,
      user_id: req.user.id,
      user_name: req.user.email.split('@')[0],
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('task_comments')
      .insert(comment)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Përditëson datën e përditësimit të taskut
    await supabase
      .from('tasks')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id);

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

