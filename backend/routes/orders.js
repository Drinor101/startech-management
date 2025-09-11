import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Merr të gjithë porositë
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, source } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('orders')
      .select(`
        *,
        customer:customers(*),
        order_products:order_products(
          *,
          product:products(*)
        )
      `)
      .order('created_at', { ascending: false });

    // Filtra
    if (status) {
      query = query.eq('status', status);
    }
    if (source) {
      query = query.eq('source', source);
    }

    // Paginimi
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    // Transform the data to match frontend expectations
    const transformedData = data.map(order => ({
      id: order.id,
      customerId: order.customer_id,
      customer: order.customer,
      products: order.order_products?.map(op => ({
        ...op.product,
        quantity: op.quantity,
        subtotal: op.subtotal
      })) || [],
      status: order.status,
      source: order.source,
      shippingInfo: {
        address: order.shipping_address || '',
        city: order.shipping_city || '',
        zipCode: order.shipping_zip_code || '',
        method: order.shipping_method || ''
      },
      total: parseFloat(order.total),
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      isEditable: order.is_editable,
      notes: order.notes
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
    console.error('Gabim në marrjen e porosive:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në marrjen e porosive'
    });
  }
});

// Merr një porosi specifike
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers(*),
        order_products:order_products(
          *,
          product:products(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Porosia nuk u gjet'
      });
    }

    // Transform the data to match frontend expectations
    const transformedData = {
      id: data.id,
      customerId: data.customer_id,
      customer: data.customer,
      products: data.order_products?.map(op => ({
        ...op.product,
        quantity: op.quantity,
        subtotal: op.subtotal
      })) || [],
      status: data.status,
      source: data.source,
      shippingInfo: {
        address: data.shipping_address || '',
        city: data.shipping_city || '',
        zipCode: data.shipping_zip_code || '',
        method: data.shipping_method || ''
      },
      total: parseFloat(data.total),
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      isEditable: data.is_editable,
      notes: data.notes
    };

    res.json({
      success: true,
      data: transformedData
    });
  } catch (error) {
    console.error('Gabim në marrjen e porosisë:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në marrjen e porosisë'
    });
  }
});

// Krijon një porosi të re
router.post('/', authenticateUser, async (req, res) => {
  try {
    const orderData = {
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      success: true,
      data: data,
      message: 'Porosia u krijua me sukses'
    });
  } catch (error) {
    console.error('Gabim në krijimin e porosisë:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në krijimin e porosisë'
    });
  }
});

// Përditëson një porosi
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
      .from('orders')
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
      message: 'Porosia u përditësua me sukses'
    });
  } catch (error) {
    console.error('Gabim në përditësimin e porosisë:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në përditësimin e porosisë'
    });
  }
});

// Fshin një porosi (vetëm admin)
router.delete('/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Porosia u fshi me sukses'
    });
  } catch (error) {
    console.error('Gabim në fshirjen e porosisë:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në fshirjen e porosisë'
    });
  }
});

// Merr statistikat e porosive
router.get('/stats/overview', authenticateUser, async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('status, total, created_at');

    if (error) {
      throw error;
    }

    // Llogarit statistikat
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      totalRevenue: orders.reduce((sum, o) => sum + (o.total || 0), 0)
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

