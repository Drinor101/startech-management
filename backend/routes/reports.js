import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Merr raportin e përgjithshëm të dashboard-it
router.get('/dashboard', authenticateUser, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filter
    let dateFilter = {};
    if (startDate) {
      dateFilter.gte = startDate;
    }
    if (endDate) {
      dateFilter.lte = endDate;
    }

    // Merr statistikat e porosive
    let ordersQuery = supabase
      .from('orders')
      .select('status, total, created_at');
    
    if (Object.keys(dateFilter).length > 0) {
      ordersQuery = ordersQuery.gte('created_at', dateFilter.gte || '1900-01-01');
      if (dateFilter.lte) {
        ordersQuery = ordersQuery.lte('created_at', dateFilter.lte);
      }
    }
    
    const { data: orders } = await ordersQuery;

    // Merr statistikat e shërbimeve
    let servicesQuery = supabase
      .from('services')
      .select('status, created_at');
    
    if (Object.keys(dateFilter).length > 0) {
      servicesQuery = servicesQuery.gte('created_at', dateFilter.gte || '1900-01-01');
      if (dateFilter.lte) {
        servicesQuery = servicesQuery.lte('created_at', dateFilter.lte);
      }
    }
    
    const { data: services } = await servicesQuery;

    // Merr statistikat e taskave
    let tasksQuery = supabase
      .from('tasks')
      .select('type, status, created_at');
    
    if (Object.keys(dateFilter).length > 0) {
      tasksQuery = tasksQuery.gte('created_at', dateFilter.gte || '1900-01-01');
      if (dateFilter.lte) {
        tasksQuery = tasksQuery.lte('created_at', dateFilter.lte);
      }
    }
    
    const { data: tasks } = await tasksQuery;

    // Merr statistikat e klientëve
    let customersQuery = supabase
      .from('customers')
      .select('source, created_at');
    
    if (Object.keys(dateFilter).length > 0) {
      customersQuery = customersQuery.gte('created_at', dateFilter.gte || '1900-01-01');
      if (dateFilter.lte) {
        customersQuery = customersQuery.lte('created_at', dateFilter.lte);
      }
    }
    
    const { data: customers } = await customersQuery;

    // Merr statistikat e produkteve
    let productsQuery = supabase
      .from('products')
      .select('woo_commerce_status, created_at');
    
    if (Object.keys(dateFilter).length > 0) {
      productsQuery = productsQuery.gte('created_at', dateFilter.gte || '1900-01-01');
      if (dateFilter.lte) {
        productsQuery = productsQuery.lte('created_at', dateFilter.lte);
      }
    }
    
    const { data: products } = await productsQuery;

    // Merr statistikat e përdoruesve
    let usersQuery = supabase
      .from('users')
      .select('role, created_at');
    
    if (Object.keys(dateFilter).length > 0) {
      usersQuery = usersQuery.gte('created_at', dateFilter.gte || '1900-01-01');
      if (dateFilter.lte) {
        usersQuery = usersQuery.lte('created_at', dateFilter.lte);
      }
    }
    
    const { data: users } = await usersQuery;

    const dashboardStats = {
      orders: {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        processing: orders.filter(o => o.status === 'processing').length,
        shipped: orders.filter(o => o.status === 'shipped').length,
        delivered: orders.filter(o => o.status === 'delivered').length,
        totalRevenue: orders.reduce((sum, o) => sum + (o.total || 0), 0),
        all: orders // Add raw data for charts
      },
      services: {
        total: services.length,
        received: services.filter(s => s.status === 'received').length,
        inProgress: services.filter(s => s.status === 'in-progress').length,
        completed: services.filter(s => s.status === 'completed').length,
        all: services // Add raw data for charts
      },
      tasks: {
        total: tasks.length,
        tasks: tasks.filter(t => t.type === 'task').length,
        tickets: tasks.filter(t => t.type === 'ticket').length,
        todo: tasks.filter(t => t.status === 'todo').length,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        done: tasks.filter(t => t.status === 'done').length,
        all: tasks // Add raw data for charts
      },
      customers: {
        total: customers.length,
        wooCommerce: customers.filter(c => c.source === 'WooCommerce').length,
        internal: customers.filter(c => c.source === 'Internal').length,
        all: customers // Add raw data for charts
      },
      products: {
        total: products.length,
        active: products.filter(p => p.woo_commerce_status === 'active').length,
        inactive: products.filter(p => p.woo_commerce_status === 'inactive').length,
        draft: products.filter(p => p.woo_commerce_status === 'draft').length,
        all: products // Add raw data for charts
      },
      users: {
        total: users.length,
        active: users.length, // All users are considered active
        inactive: 0,
        byRole: users.reduce((acc, user) => {
          const role = user.role || 'Unknown';
          const existing = acc.find(r => r.name === role);
          if (existing) {
            existing.count++;
          } else {
            acc.push({ name: role, count: 1 });
          }
          return acc;
        }, []),
        all: users // Add raw data for charts
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

// Merr raportin e tiketave
router.get('/tickets', authenticateUser, async (req, res) => {
  try {
    const { startDate, endDate, status, priority, source } = req.query;

    let query = supabase
      .from('tickets')
      .select('*')
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
    if (priority) {
      query = query.eq('priority', priority);
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
      data: data || []
    });
  } catch (error) {
    console.error('Gabim në marrjen e raportit të tiketave:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në marrjen e raportit të tiketave'
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

// Merr aktivitetin e përdoruesve
router.get('/users/activity', authenticateUser, async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (userId) {
      // Merr aktivitetin për një përdorues specifik
      const activities = [];
      
      // Merr porositë e krijuara nga përdoruesi
      const { data: orders } = await supabase
        .from('orders')
        .select('id, status, created_at')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (orders) {
        orders.forEach(order => {
          activities.push({
            id: `order-${order.id}`,
            type: 'order',
            action: `Krijoi porosinë #${order.id}`,
            status: order.status,
            timestamp: order.created_at,
            module: 'orders'
          });
        });
      }
      
      // Merr shërbimet e krijuara nga përdoruesi
      const { data: services } = await supabase
        .from('services')
        .select('id, status, created_at')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (services) {
        services.forEach(service => {
          activities.push({
            id: `service-${service.id}`,
            type: 'service',
            action: `Krijoi shërbimin #${service.id}`,
            status: service.status,
            timestamp: service.created_at,
            module: 'services'
          });
        });
      }
      
      // Merr taskat e krijuara nga përdoruesi
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, status, type, created_at')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (tasks) {
        tasks.forEach(task => {
          activities.push({
            id: `task-${task.id}`,
            type: 'task',
            action: `Krijoi ${task.type === 'ticket' ? 'tiket' : 'task'} #${task.id}`,
            status: task.status,
            timestamp: task.created_at,
            module: 'tasks'
          });
        });
      }
      
      // Merr klientët e krijuar nga përdoruesi
      const { data: customers } = await supabase
        .from('customers')
        .select('id, name, created_at')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (customers) {
        customers.forEach(customer => {
          activities.push({
            id: `customer-${customer.id}`,
            type: 'customer',
            action: `Krijoi klientin "${customer.name}"`,
            status: 'active',
            timestamp: customer.created_at,
            module: 'customers'
          });
        });
      }
      
      // Merr produktet e krijuar nga përdoruesi
      const { data: products } = await supabase
        .from('products')
        .select('id, title, created_at')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (products) {
        products.forEach(product => {
          activities.push({
            id: `product-${product.id}`,
            type: 'product',
            action: `Krijoi produktin "${product.title}"`,
            status: 'active',
            timestamp: product.created_at,
            module: 'products'
          });
        });
      }
      
      // Sorto aktivitetin sipas kohës
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      res.json({
        success: true,
        data: activities.slice(0, 20) // Merr vetëm 20 aktivitetet e fundit
      });
    } else {
      // Merr aktivitetin e të gjithë përdoruesve
      const activities = [];
      
      // Merr të gjitha aktivitetet nga të gjitha modulet
      const { data: orders } = await supabase
        .from('orders')
        .select('id, status, created_at, created_by')
        .order('created_at', { ascending: false })
        .limit(50);
      
      const { data: services } = await supabase
        .from('services')
        .select('id, status, created_at, created_by')
        .order('created_at', { ascending: false })
        .limit(50);
      
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, status, type, created_at, created_by')
        .order('created_at', { ascending: false })
        .limit(50);
      
      const { data: customers } = await supabase
        .from('customers')
        .select('id, name, created_at, created_by')
        .order('created_at', { ascending: false })
        .limit(50);
      
      const { data: products } = await supabase
        .from('products')
        .select('id, title, created_at, created_by')
        .order('created_at', { ascending: false })
        .limit(50);
      
      // Merr emrat e përdoruesve
      const { data: users } = await supabase
        .from('users')
        .select('id, name, email, role');
      
      const userMap = users?.reduce((acc, user) => {
        const userName = user.name || user.email;
        acc[user.id] = userName;
        acc[user.name] = userName;
        acc[user.email] = userName;
        return acc;
      }, {}) || {};
      
      // Create role map for additional info
      const roleMap = users?.reduce((acc, user) => {
        const userName = user.name || user.email;
        acc[userName] = user.role || 'User';
        return acc;
      }, {}) || {};
      
      // Shto aktivitetet e porosive
      if (orders) {
        orders.forEach(order => {
          const userName = userMap[order.created_by] || 'Unknown User';
          activities.push({
            id: `order-${order.id}`,
            type: 'order',
            action: `Krijoi porosinë #${order.id}`,
            status: order.status,
            timestamp: order.created_at,
            module: 'orders',
            user: userName,
            userRole: roleMap[userName] || 'User'
          });
        });
      }
      
      // Shto aktivitetet e shërbimeve
      if (services) {
        services.forEach(service => {
          const userName = userMap[service.created_by] || 'Unknown User';
          activities.push({
            id: `service-${service.id}`,
            type: 'service',
            action: `Krijoi shërbimin #${service.id}`,
            status: service.status,
            timestamp: service.created_at,
            module: 'services',
            user: userName,
            userRole: roleMap[userName] || 'User'
          });
        });
      }
      
      // Shto aktivitetet e taskave
      if (tasks) {
        tasks.forEach(task => {
          const userName = userMap[task.created_by] || 'Unknown User';
          activities.push({
            id: `task-${task.id}`,
            type: 'task',
            action: `Krijoi ${task.type === 'ticket' ? 'tiket' : 'task'} #${task.id}`,
            status: task.status,
            timestamp: task.created_at,
            module: 'tasks',
            user: userName,
            userRole: roleMap[userName] || 'User'
          });
        });
      }
      
      // Shto aktivitetet e klientëve
      if (customers) {
        customers.forEach(customer => {
          const userName = userMap[customer.created_by] || 'Unknown User';
          activities.push({
            id: `customer-${customer.id}`,
            type: 'customer',
            action: `Krijoi klientin "${customer.name}"`,
            status: 'active',
            timestamp: customer.created_at,
            module: 'customers',
            user: userName,
            userRole: roleMap[userName] || 'User'
          });
        });
      }
      
      // Shto aktivitetet e produkteve
      if (products) {
        products.forEach(product => {
          const userName = userMap[product.created_by] || 'Unknown User';
          activities.push({
            id: `product-${product.id}`,
            type: 'product',
            action: `Krijoi produktin "${product.title}"`,
            status: 'active',
            timestamp: product.created_at,
            module: 'products',
            user: userName,
            userRole: roleMap[userName] || 'User'
          });
        });
      }
      
      // Sorto aktivitetin sipas kohës
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      res.json({
        success: true,
        data: activities.slice(0, 50) // Merr vetëm 50 aktivitetet e fundit
      });
    }
  } catch (error) {
    console.error('Gabim në marrjen e aktivitetit të përdoruesve:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në marrjen e aktivitetit të përdoruesve'
    });
  }
});

export default router;

