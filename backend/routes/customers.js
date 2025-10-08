import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// Merr të gjithë klientët
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { page = 1, limit = 10, source, search } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    // Search functionality
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,address.ilike.%${search}%,city.ilike.%${search}%,neighborhood.ilike.%${search}%,id.ilike.%${search}%`);
    }

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
      .select(`
        *,
        orders:orders(*),
        services:services(*)
      `)
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
    const { name, email, phone, address, city, neighborhood, source } = req.body;

    // Validimi i të dhënave
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Emri dhe emaili janë të detyrueshëm'
      });
    }

    // Kontrollo nëse emaili ekziston
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', email)
      .single();

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        error: 'Emaili tashmë ekziston'
      });
    }

    const customerData = {
      name,
      email,
      phone: phone || null,
      address: address || null,
      city: city || null,
      neighborhood: neighborhood || null,
      source: source || 'Internal',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('customers')
      .insert(customerData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
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
      error: error.message || 'Gabim në krijimin e klientit'
    });
  }
});

// Përditëson një klient
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, city, neighborhood, source } = req.body;

    const updates = {
      name,
      email,
      phone: phone || null,
      address: address || null,
      city: city || null,
      neighborhood: neighborhood || null,
      source: source || 'Internal',
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

// Fshin një klient
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    // Kontrollo nëse klienti ka porosi ose shërbime
    const { data: orders } = await supabase
      .from('orders')
      .select('id')
      .eq('customer_id', id);

    const { data: services } = await supabase
      .from('services')
      .select('id')
      .eq('customer_id', id);

    if (orders && orders.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Nuk mund të fshihet klienti pasi ka porosi të lidhura'
      });
    }

    if (services && services.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Nuk mund të fshihet klienti pasi ka shërbime të lidhura'
      });
    }

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
      internal: customers.filter(c => c.source === 'Internal').length,
      woocommerce: customers.filter(c => c.source === 'WooCommerce').length,
      website: customers.filter(c => c.source === 'Website').length,
      socialMedia: customers.filter(c => c.source === 'Social Media').length,
      referral: customers.filter(c => c.source === 'Referral').length
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

