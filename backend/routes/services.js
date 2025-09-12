import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Merr të gjithë shërbimet
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('services')
      .select(`
        *,
        customer:customers(*),
        service_history:service_history(*)
      `)
      .order('created_at', { ascending: false });

    // Filtra
    if (status) {
      query = query.eq('status', status);
    }
    if (category) {
      query = query.eq('category', category);
    }

    // Paginimi
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    // Transform data to match frontend interface
    const transformedData = data.map(service => ({
      id: service.id,
      createdBy: service.created_by,
      assignedBy: service.assigned_by,
      customer: service.customer,
      orderId: service.order_id,
      relatedProducts: service.related_products || [],
      problemDescription: service.problem_description,
      status: service.status,
      category: service.category,
      assignedTo: service.assigned_to,
      warrantyInfo: service.warranty_info,
      serviceHistory: service.service_history || [],
      receptionPoint: service.reception_point,
      underWarranty: service.under_warranty,
      qrCode: service.qr_code,
      createdAt: service.created_at,
      updatedAt: service.updated_at,
      completedAt: service.completed_at,
      emailNotificationsSent: service.email_notifications_sent
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
    console.error('Gabim në marrjen e shërbimeve:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në marrjen e shërbimeve'
    });
  }
});

// Merr një shërbim specifik
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        customer:customers(*),
        service_history:service_history(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Shërbimi nuk u gjet'
      });
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Gabim në marrjen e shërbimit:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në marrjen e shërbimit'
    });
  }
});

// Krijon një shërbim të ri
router.post('/', authenticateUser, async (req, res) => {
  try {
    console.log('Service creation request body:', req.body);
    
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

    // Handle customer - create if doesn't exist or use existing
    let customerId = req.body.customer || req.body.customerId;
    
    // If customer is a string (name), try to find or create customer
    if (customerId && typeof customerId === 'string' && !customerId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      // Check if customer exists by name
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('name', customerId)
        .single();
      
      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        // Create new customer
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            name: customerId,
            email: `${customerId.toLowerCase().replace(/\s+/g, '')}@example.com`,
            phone: '+383 44 000 000'
          })
          .select('id')
          .single();
        
        if (customerError) {
          console.error('Error creating customer:', customerError);
          return res.status(500).json({
            success: false,
            error: 'Gabim në krijimin e klientit'
          });
        }
        
        customerId = newCustomer.id;
      }
    }

    // Generate SRV ID manually
    const currentYear = new Date().getFullYear().toString();
    const { data: lastService } = await supabase
      .from('services')
      .select('id')
      .like('id', `SRV-${currentYear}-%`)
      .order('id', { ascending: false })
      .limit(1)
      .single();

    let counter = 1;
    if (lastService && lastService.id) {
      const match = lastService.id.match(new RegExp(`^SRV-${currentYear}-(\\d+)$`));
      if (match) {
        counter = parseInt(match[1]) + 1;
      }
    }

    const serviceId = `SRV-${currentYear}-${counter.toString().padStart(3, '0')}`;

    const serviceData = {
      id: serviceId,
      problem_description: req.body.problem || req.body.problemDescription,
      status: req.body.status || 'received',
      assigned_to: req.body.assignedTo,
      warranty_info: req.body.warranty || req.body.warrantyInfo,
      customer_id: customerId,
      created_by: userName,
      assigned_by: req.body.assignedTo || userName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('services')
      .insert(serviceData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    // Add to history
    await supabase
      .from('service_history')
      .insert({
        service_id: data.id,
        action: 'Shërbimi u krijua',
        user_id: userId,
        user_name: userName,
        notes: `Shërbimi u krijua për klientin ${data.customer_id}`
      });

    res.status(201).json({
      success: true,
      data: {
        id: data.id,
        createdBy: data.created_by,
        assignedBy: data.assigned_by,
        customer: data.customer,
        orderId: data.order_id,
        relatedProducts: data.related_products || [],
        problemDescription: data.problem_description,
        status: data.status,
        category: data.category,
        assignedTo: data.assigned_to,
        warrantyInfo: data.warranty_info,
        serviceHistory: [],
        receptionPoint: data.reception_point,
        underWarranty: data.under_warranty,
        qrCode: data.qr_code,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        completedAt: data.completed_at,
        emailNotificationsSent: data.email_notifications_sent
      },
      message: 'Shërbimi u krijua me sukses'
    });
  } catch (error) {
    console.error('Gabim në krijimin e shërbimit:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Gabim në krijimin e shërbimit'
    });
  }
});

// Përditëson një shërbim
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'];
    
    // Get user info
    const { data: userData } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', userId)
      .single();

    const userName = userData?.name || userData?.email || 'Unknown';

    // Handle customer - create if doesn't exist or use existing
    let customerId = req.body.customer || req.body.customerId;
    
    // If customer is a string (name), try to find or create customer
    if (customerId && typeof customerId === 'string' && !customerId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      // Check if customer exists by name
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('name', customerId)
        .single();
      
      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        // Create new customer
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            name: customerId,
            email: `${customerId.toLowerCase().replace(/\s+/g, '')}@example.com`,
            phone: '+383 44 000 000'
          })
          .select('id')
          .single();
        
        if (customerError) {
          console.error('Error creating customer:', customerError);
          return res.status(500).json({
            success: false,
            error: 'Gabim në krijimin e klientit'
          });
        }
        
        customerId = newCustomer.id;
      }
    }

    // Map frontend fields to database fields
    const updates = {
      problem_description: req.body.problem || req.body.problemDescription,
      status: req.body.status,
      assigned_to: req.body.assignedTo,
      warranty_info: req.body.warranty || req.body.warrantyInfo,
      customer_id: customerId,
      assigned_by: req.body.assignedTo || userName,
      updated_at: new Date().toISOString()
    };

    // Remove undefined values
    Object.keys(updates).forEach(key => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });

    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        customer:customers(name, email, phone)
      `)
      .single();

    if (error) {
      throw error;
    }

    // Add to history
    await supabase
      .from('service_history')
      .insert({
        service_id: data.id,
        action: 'Shërbimi u përditësua',
        user_id: userId,
        user_name: userName,
        notes: `Shërbimi u përditësua nga ${userName}`
      });

    // Transform response data to camelCase
    const transformedData = {
      id: data.id,
      createdBy: data.created_by,
      assignedBy: data.assigned_by,
      assignedTo: data.assigned_to,
      customer: data.customer,
      problemDescription: data.problem_description,
      status: data.status,
      warrantyInfo: data.warranty_info,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      completedAt: data.completed_at
    };

    res.json({
      success: true,
      data: transformedData,
      message: 'Shërbimi u përditësua me sukses'
    });
  } catch (error) {
    console.error('Gabim në përditësimin e shërbimit:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në përditësimin e shërbimit'
    });
  }
});

// Fshin një shërbim (vetëm admin)
router.delete('/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Shërbimi u fshi me sukses'
    });
  } catch (error) {
    console.error('Gabim në fshirjen e shërbimit:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në fshirjen e shërbimit'
    });
  }
});

// Shton një hyrje në historinë e shërbimit
router.post('/:id/history', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const historyEntry = {
      ...req.body,
      service_id: id,
      user_id: req.user.id,
      user_name: req.user.email.split('@')[0],
      date: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('service_history')
      .insert(historyEntry)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Përditëson datën e përditësimit të shërbimit
    await supabase
      .from('services')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id);

    res.status(201).json({
      success: true,
      data: data,
      message: 'Hyrja në histori u shtua me sukses'
    });
  } catch (error) {
    console.error('Gabim në shtimin e historisë:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në shtimin e historisë'
    });
  }
});

// Merr statistikat e shërbimeve
router.get('/stats/overview', authenticateUser, async (req, res) => {
  try {
    const { data: services, error } = await supabase
      .from('services')
      .select('status, category, created_at');

    if (error) {
      throw error;
    }

    // Llogarit statistikat
    const stats = {
      total: services.length,
      received: services.filter(s => s.status === 'received').length,
      inProgress: services.filter(s => s.status === 'in-progress').length,
      waitingParts: services.filter(s => s.status === 'waiting-parts').length,
      completed: services.filter(s => s.status === 'completed').length,
      delivered: services.filter(s => s.status === 'delivered').length
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

