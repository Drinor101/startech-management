import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Merr raportin e përgjithshëm të dashboard-it
router.get('/dashboard', authenticateUser, async (req, res) => {
  try {
    // Merr statistikat e porosive
    const { data: orders } = await supabase
      .from('orders')
      .select('status, total, created_at');

    // Merr statistikat e shërbimeve
    const { data: services } = await supabase
      .from('services')
      .select('status, created_at');

    // Merr statistikat e taskave
    const { data: tasks } = await supabase
      .from('tasks')
      .select('type, status, created_at');

    // Merr statistikat e klientëve
    const { data: customers } = await supabase
      .from('customers')
      .select('source, created_at');

    // Merr statistikat e produkteve
    const { data: products } = await supabase
      .from('products')
      .select('woo_commerce_status, created_at');

    const dashboardStats = {
      orders: {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        processing: orders.filter(o => o.status === 'processing').length,
        shipped: orders.filter(o => o.status === 'shipped').length,
        delivered: orders.filter(o => o.status === 'delivered').length,
        totalRevenue: orders.reduce((sum, o) => sum + (o.total || 0), 0)
      },
      services: {
        total: services.length,
        received: services.filter(s => s.status === 'received').length,
        inProgress: services.filter(s => s.status === 'in-progress').length,
        completed: services.filter(s => s.status === 'completed').length
      },
      tasks: {
        total: tasks.length,
        tasks: tasks.filter(t => t.type === 'task').length,
        tickets: tasks.filter(t => t.type === 'ticket').length,
        todo: tasks.filter(t => t.status === 'todo').length,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        done: tasks.filter(t => t.status === 'done').length
      },
      customers: {
        total: customers.length,
        wooCommerce: customers.filter(c => c.source === 'WooCommerce').length,
        internal: customers.filter(c => c.source === 'Internal').length
      },
      products: {
        total: products.length,
        active: products.filter(p => p.woo_commerce_status === 'active').length,
        inactive: products.filter(p => p.woo_commerce_status === 'inactive').length,
        draft: products.filter(p => p.woo_commerce_status === 'draft').length
      }
    };

    res.json({
      success: true,
      data: dashboardStats
    });
  } catch (error) {
    console.error('Gabim në marrjen e raportit të dashboard-it:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në marrjen e raportit të dashboard-it'
    });
  }
});

// Merr raportin e porosive
router.get('/orders', authenticateUser, async (req, res) => {
  try {
    const { startDate, endDate, status, source } = req.query;

    let query = supabase
      .from('orders')
      .select(`
        *,
        customer:customers(*)
      `)
      .order('created_at', { ascending: false });

    // Filtra
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (source) {
      query = query.eq('source', source);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data,
      count: data.length
    });
  } catch (error) {
    console.error('Gabim në marrjen e raportit të porosive:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në marrjen e raportit të porosive'
    });
  }
});

// Merr raportin e shërbimeve
router.get('/services', authenticateUser, async (req, res) => {
  try {
    const { startDate, endDate, status, category } = req.query;

    let query = supabase
      .from('services')
      .select(`
        *,
        customer:customers(*)
      `)
      .order('created_at', { ascending: false });

    // Filtra
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data,
      count: data.length
    });
  } catch (error) {
    console.error('Gabim në marrjen e raportit të shërbimeve:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në marrjen e raportit të shërbimeve'
    });
  }
});

// Merr raportin e taskave
router.get('/tasks', authenticateUser, async (req, res) => {
  try {
    const { startDate, endDate, type, status, priority } = req.query;

    let query = supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    // Filtra
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    if (type) {
      query = query.eq('type', type);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data,
      count: data.length
    });
  } catch (error) {
    console.error('Gabim në marrjen e raportit të taskave:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në marrjen e raportit të taskave'
    });
  }
});

// Merr raportin e klientëve
router.get('/customers', authenticateUser, async (req, res) => {
  try {
    const { startDate, endDate, source } = req.query;

    let query = supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    // Filtra
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    if (source) {
      query = query.eq('source', source);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data,
      count: data.length
    });
  } catch (error) {
    console.error('Gabim në marrjen e raportit të klientëve:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në marrjen e raportit të klientëve'
    });
  }
});

// Merr raportin e produkteve
router.get('/products', authenticateUser, async (req, res) => {
  try {
    const { startDate, endDate, category, status } = req.query;

    let query = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    // Filtra
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (status) {
      query = query.eq('woo_commerce_status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data,
      count: data.length
    });
  } catch (error) {
    console.error('Gabim në marrjen e raportit të produkteve:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në marrjen e raportit të produkteve'
    });
  }
});

export default router;

