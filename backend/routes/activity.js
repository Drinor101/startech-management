import express from 'express';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// GET /api/activity/activity-logs
// Lexon historikun nga tabela user_actions me filtra dhe pagination
router.get('/activity-logs', authenticateUser, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      userId,
      module,
      action,
      startDate,
      endDate,
      order = 'desc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    let query = supabase
      .from('activity_logs')
      .select('id,user_id,user_name,user_email,action,module,entity_type,entity_id,details,ip_address,user_agent,method,url,timestamp:created_at', { count: 'exact' })
      .order('created_at', { ascending: String(order).toLowerCase() === 'asc' });

    if (userId) query = query.eq('user_id', userId);
    if (module) query = query.eq('module', module);
    if (action) query = query.eq('action', action);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) {
      console.error('Error fetching activity logs from DB:', error);
      return res.status(500).json({ success: false, error: 'Gabim në marrjen e historikut' });
    }

    return res.json({
      success: true,
      data: data || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        pages: Math.ceil((count || 0) / limitNum)
      }
    });
  } catch (err) {
    console.error('Unhandled error in activity-logs:', err);
    return res.status(500).json({ success: false, error: 'Gabim i brendshëm' });
  }
});

// GET /api/activity/activity-stats
// Statistika bazike nga user_actions (vetëm për admin)
router.get('/activity-stats', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let base = supabase.from('user_actions').select('action,module,user_id,timestamp');
    if (startDate) base = base.gte('timestamp', startDate);
    if (endDate) base = base.lte('timestamp', endDate);

    const { data, error } = await base.limit(10000);
    if (error) {
      console.error('Error fetching activity stats:', error);
      return res.status(500).json({ success: false, error: 'Gabim në marrjen e statistikave' });
    }

    const stats = {
      totalActions: data.length,
      actionsByModule: {},
      actionsByUser: {},
      actionsByDay: {},
      actionsByHour: {},
      topUsers: [],
      topModules: []
    };

    for (const log of data) {
      stats.actionsByModule[log.module] = (stats.actionsByModule[log.module] || 0) + 1;
      stats.actionsByUser[log.user_id] = (stats.actionsByUser[log.user_id] || 0) + 1;
      const day = new Date(log.timestamp).toISOString().split('T')[0];
      stats.actionsByDay[day] = (stats.actionsByDay[day] || 0) + 1;
      const hour = new Date(log.timestamp).getHours();
      stats.actionsByHour[hour] = (stats.actionsByHour[hour] || 0) + 1;
    }

    stats.topUsers = Object.entries(stats.actionsByUser)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([userId, count]) => ({ userId, count }));

    stats.topModules = Object.entries(stats.actionsByModule)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([module, count]) => ({ module, count }));

    return res.json({ success: true, data: stats });
  } catch (err) {
    console.error('Unhandled error in activity-stats:', err);
    return res.status(500).json({ success: false, error: 'Gabim i brendshëm' });
  }
});

export default router;


