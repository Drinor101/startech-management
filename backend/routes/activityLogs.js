import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Merr aktivitetet e përdoruesve nga user_actions tabela
router.get('/activity-logs', authenticateUser, async (req, res) => {
  try {
    const { page = 1, limit = 50, userId, module, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('user_actions')
      .select('*')
      .order('timestamp', { ascending: false });

    // Filtro sipas përdoruesit
    if (userId) {
      query = query.eq('user_id', userId);
    }

    // Filtro sipas modulit
    if (module) {
      query = query.eq('module', module);
    }

    // Filtro sipas datës
    if (startDate) {
      query = query.gte('timestamp', startDate);
    }
    if (endDate) {
      query = query.lte('timestamp', endDate);
    }

    // Merr totalin për pagination
    const { count } = await query.select('*', { count: 'exact', head: true });

    // Merr të dhënat me pagination
    const { data, error } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Gabim në marrjen e activity logs:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në marrjen e activity logs'
    });
  }
});

// Merr aktivitetet e një përdoruesi specifik
router.get('/activity-logs/:userId', authenticateUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;

    const { data, error } = await supabase
      .from('user_actions')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(parseInt(limit));

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Gabim në marrjen e aktivitetit të përdoruesit:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në marrjen e aktivitetit të përdoruesit'
    });
  }
});

// Merr statistikat e aktivitetit
router.get('/activity-stats', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = supabase
      .from('user_actions')
      .select('*');

    if (startDate) {
      query = query.gte('timestamp', startDate);
    }
    if (endDate) {
      query = query.lte('timestamp', endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Llogarit statistikat
    const stats = {
      totalActions: data?.length || 0,
      actionsByModule: {},
      actionsByUser: {},
      actionsByDay: {},
      topUsers: [],
      topModules: []
    };

    if (data) {
      data.forEach(action => {
        // Statistikat sipas modulit
        stats.actionsByModule[action.module] = (stats.actionsByModule[action.module] || 0) + 1;
        
        // Statistikat sipas përdoruesit
        stats.actionsByUser[action.user_name] = (stats.actionsByUser[action.user_name] || 0) + 1;
        
        // Statistikat sipas ditës
        const day = new Date(action.timestamp).toISOString().split('T')[0];
        stats.actionsByDay[day] = (stats.actionsByDay[day] || 0) + 1;
      });

      // Top përdoruesit
      stats.topUsers = Object.entries(stats.actionsByUser)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([user, count]) => ({ user, count }));

      // Top modulet
      stats.topModules = Object.entries(stats.actionsByModule)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([module, count]) => ({ module, count }));
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Gabim në marrjen e statistikave të aktivitetit:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në marrjen e statistikave të aktivitetit'
    });
  }
});

export default router;
