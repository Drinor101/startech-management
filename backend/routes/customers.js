import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Merr të gjithë klientët
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { page = 1, limit = 10, source } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    // Filtra
    if (source) {
      query = query.eq('source', source);
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
    console.error('Gabim në marrjen e klientëve:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në marrjen e klientëve'
    });
  }
});

// Merr një klient specifik
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Klienti nuk u gjet'
      });
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Gabim në marrjen e klientit:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në marrjen e klientit'
    });
  }
});

// Krijon një klient të ri
router.post('/', authenticateUser, async (req, res) => {
  try {
    const customerData = {
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('customers')
      .insert(customerData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      success: true,
      data: data,
      message: 'Klienti u krijua me sukses'
    });
  } catch (error) {
    console.error('Gabim në krijimin e klientit:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në krijimin e klientit'
    });
  }
});

// Përditëson një klient
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
      .from('customers')
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
      message: 'Klienti u përditësua me sukses'
    });
  } catch (error) {
    console.error('Gabim në përditësimin e klientit:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në përditësimin e klientit'
    });
  }
});

// Fshin një klient (vetëm admin)
router.delete('/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Klienti u fshi me sukses'
    });
  } catch (error) {
    console.error('Gabim në fshirjen e klientit:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në fshirjen e klientit'
    });
  }
});

// Merr porositë e një klienti
router.get('/:id/orders', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_products:order_products(
          *,
          product:products(*)
        )
      `)
      .eq('customer_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Gabim në marrjen e porosive të klientit:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në marrjen e porosive të klientit'
    });
  }
});

// Merr shërbimet e një klienti
router.get('/:id/services', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        service_history:service_history(*)
      `)
      .eq('customer_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Gabim në marrjen e shërbimeve të klientit:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në marrjen e shërbimeve të klientit'
    });
  }
});

// Merr statistikat e klientëve
router.get('/stats/overview', authenticateUser, async (req, res) => {
  try {
    const { data: customers, error } = await supabase
      .from('customers')
      .select('source, created_at');

    if (error) {
      throw error;
    }

    // Llogarit statistikat
    const stats = {
      total: customers.length,
      wooCommerce: customers.filter(c => c.source === 'WooCommerce').length,
      internal: customers.filter(c => c.source === 'Internal').length
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

