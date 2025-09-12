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
        finalPrice: op.product?.final_price || 0,
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
      notes: order.notes,
      teamNotes: order.team_notes
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
        finalPrice: op.product?.final_price || 0,
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
      notes: data.notes,
      teamNotes: data.team_notes
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
    console.log('Creating new order with data:', req.body);
    const { customer, items, shippingAddress, shippingCity, shippingZipCode, shippingMethod, notes, teamNotes } = req.body;
    
    console.log('Order data parsed:', {
      customer,
      items,
      shippingAddress,
      shippingCity,
      shippingZipCode,
      shippingMethod,
      notes,
      teamNotes
    });
    
    // Generate PRS-YYYY-NNN ID
    const currentYear = new Date().getFullYear();
    const { data: lastOrder } = await supabase
      .from('orders')
      .select('id')
      .like('id', `PRS-${currentYear}-%`)
      .order('id', { ascending: false })
      .limit(1)
      .single();
    
    let orderNumber = 1;
    if (lastOrder?.id) {
      const lastNumber = parseInt(lastOrder.id.split('-')[2]);
      orderNumber = lastNumber + 1;
    }
    
    const orderId = `PRS-${currentYear}-${orderNumber.toString().padStart(3, '0')}`;
    
    // Create or find customer
    let customerId;
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('name', customer)
      .single();
    
    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      // Create new customer
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          name: customer,
          email: `${customer.toLowerCase().replace(/\s+/g, '.')}@example.com`,
          source: 'Internal'
        })
        .select('id')
        .single();
      
      if (customerError) {
        throw customerError;
      }
      customerId = newCustomer.id;
    }
    
    // Calculate total from WooCommerce products
    const wooCommerceConfig = {
      url: process.env.WOOCOMMERCE_URL || 'https://startech24.com',
      consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY || 'ck_0856cd7f00ed0c6faef27c9a64256bcf7430d414',
      consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET || 'cs_7c882c8e16979743e2dd63fb113759254d47d0aa'
    };

    // Fetch product details from WooCommerce
    console.log('Fetching product details for items:', items);
    const productDetails = [];
    for (const item of items) {
      try {
        console.log(`Fetching product ${item.productId} from WooCommerce...`);
        const response = await fetch(`${wooCommerceConfig.url}/wp-json/wc/v3/products/${item.productId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${wooCommerceConfig.consumerKey}:${wooCommerceConfig.consumerSecret}`).toString('base64')}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`WooCommerce response for product ${item.productId}:`, response.status, response.statusText);
        
        if (response.ok) {
          const product = await response.json();
          productDetails.push({
            id: product.id.toString(),
            price: parseFloat(product.price || 0),
            name: product.name || 'Unknown Product'
          });
        } else {
          console.error(`Failed to fetch product ${item.productId}: ${response.status}`);
          // Use default price if product not found
          productDetails.push({
            id: item.productId,
            price: 0,
            name: 'Unknown Product'
          });
        }
      } catch (error) {
        console.error(`Error fetching product ${item.productId}:`, error);
        productDetails.push({
          id: item.productId,
          price: 0,
          name: 'Unknown Product'
        });
      }
    }
    
    const total = items.reduce((sum, item) => {
      const product = productDetails.find(p => p.id === item.productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);

    const orderData = {
      id: orderId,
      customer_id: customerId,
      status: 'pending',
      source: 'Manual',
      shipping_address: shippingAddress,
      shipping_city: shippingCity,
      shipping_zip_code: shippingZipCode,
      shipping_method: shippingMethod,
      total: total,
      notes: notes,
      team_notes: teamNotes,
      is_editable: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Order data to insert:', orderData);
    console.log('Total calculated:', total);
    console.log('Customer ID:', customerId);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error('Database error inserting order:', orderError);
      throw orderError;
    }

    console.log('Order inserted successfully:', order);

    // Insert order products
    const orderProducts = items.map(item => {
      const product = productDetails.find(p => p.id === item.productId);
      return {
        order_id: orderId,
        product_id: item.productId,
        quantity: item.quantity,
        subtotal: product ? product.price * item.quantity : 0
      };
    });

    console.log('Order products to insert:', orderProducts);

    const { error: productsError } = await supabase
      .from('order_products')
      .insert(orderProducts);

    if (productsError) {
      console.error('Database error inserting order products:', productsError);
      throw productsError;
    }

    console.log('Order products inserted successfully');

    res.status(201).json({
      success: true,
      data: order,
      message: 'Porosia u krijua me sukses'
    });
  } catch (error) {
    console.error('Gabim në krijimin e porosisë:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      success: false,
      error: 'Gabim në krijimin e porosisë',
      details: error.message
    });
  }
});

// Përditëson një porosi
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      customer, 
      status, 
      shippingAddress, 
      shippingCity, 
      shippingZipCode, 
      shippingMethod, 
      notes, 
      teamNotes,
      items 
    } = req.body;

    let updateData = {
      status: status,
      shipping_address: shippingAddress,
      shipping_city: shippingCity,
      shipping_zip_code: shippingZipCode,
      shipping_method: shippingMethod,
      notes: notes,
      team_notes: teamNotes,
      updated_at: new Date().toISOString()
    };

    // Handle customer update if provided
    if (customer) {
      // Create or find customer
      let customerId;
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('name', customer)
        .single();
      
      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        // Create new customer
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            name: customer,
            email: `${customer.toLowerCase().replace(/\s+/g, '.')}@example.com`,
            source: 'Internal'
          })
          .select('id')
          .single();
        
        if (customerError) {
          throw customerError;
        }
        customerId = newCustomer.id;
      }
      
      updateData.customer_id = customerId;
    }

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // If items are provided, update order products
    if (items && items.length > 0) {
      // Delete existing order products
      await supabase
        .from('order_products')
        .delete()
        .eq('order_id', id);

      // Get product prices
      const { data: products } = await supabase
        .from('products')
        .select('id, final_price')
        .in('id', items.map(item => item.productId));

      // Insert new order products
      const orderProducts = items.map(item => ({
        order_id: id,
        product_id: item.productId,
        quantity: item.quantity,
        subtotal: products?.find(p => p.id === item.productId)?.final_price * item.quantity || 0
      }));

      await supabase
        .from('order_products')
        .insert(orderProducts);

      // Recalculate total
      const total = items.reduce((sum, item) => {
        const product = products?.find(p => p.id === item.productId);
        return sum + (product ? product.final_price * item.quantity : 0);
      }, 0);

      await supabase
        .from('orders')
        .update({ total: total })
        .eq('id', id);
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

