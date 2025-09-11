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

// Sinkronizon porositë me WooCommerce (vetëm admin)
router.post('/sync-woocommerce', authenticateUser, requireAdmin, async (req, res) => {
  try {
    console.log('Starting WooCommerce orders sync...');
    
    // WooCommerce API configuration
    const wooCommerceConfig = {
      url: process.env.WOOCOMMERCE_URL || 'https://your-store.com',
      consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY || 'ck_0856cd7f00ed0c6faef27c9a64256bcf7430d414',
      consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET || 'cs_7c882c8e16979743e2dd63fb113759254d47d0aa'
    };

    if (!wooCommerceConfig.consumerKey || !wooCommerceConfig.consumerSecret) {
      return res.status(400).json({
        success: false,
        error: 'WooCommerce credentials not configured'
      });
    }

    // Fetch orders from WooCommerce API
    const wooCommerceOrders = await fetchWooCommerceOrders(wooCommerceConfig);
    
    if (!wooCommerceOrders || wooCommerceOrders.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No orders found in WooCommerce store'
      });
    }

    // Sync orders to database
    const syncedOrders = await syncOrdersToDatabase(wooCommerceOrders);
    
    res.json({
      success: true,
      message: `Successfully synced ${syncedOrders.length} orders from WooCommerce`,
      data: {
        synced_at: new Date().toISOString(),
        orders_synced: syncedOrders.length,
        orders: syncedOrders.slice(0, 5) // Return first 5 orders as sample
      }
    });

  } catch (error) {
    console.error('WooCommerce orders sync error:', error);
    res.status(500).json({
      success: false,
      error: 'WooCommerce orders sync failed',
      details: error.message
    });
  }
});

// Fetch orders from WooCommerce API
async function fetchWooCommerceOrders(config) {
  try {
    console.log('Fetching orders from WooCommerce...');
    const orders = [];
    let page = 1;
    const perPage = 100;
    
    while (true) {
      const url = `${config.url}/wp-json/wc/v3/orders?per_page=${perPage}&page=${page}&status=any`;
      const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');
      
      console.log(`Fetching orders page ${page} from: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`WooCommerce API Error: ${response.status} ${response.statusText}`);
      }

      const pageOrders = await response.json();
      
      if (pageOrders.length === 0) {
        break; // No more orders
      }
      
      orders.push(...pageOrders);
      page++;
      
      // Safety limit to prevent infinite loops
      if (page > 50) {
        console.log('Reached page limit (50), stopping...');
        break;
      }
    }
    
    console.log(`Fetched ${orders.length} orders from WooCommerce`);
    return orders;
    
  } catch (error) {
    console.error('Error fetching WooCommerce orders:', error);
    throw error;
  }
}

// Sync WooCommerce orders to database
async function syncOrdersToDatabase(wooCommerceOrders) {
  try {
    console.log('Syncing orders to database...');
    const syncedOrders = [];
    
    for (const wcOrder of wooCommerceOrders) {
      try {
        // First, create or find customer
        let customerId = null;
        
        if (wcOrder.billing && wcOrder.billing.email) {
          // Check if customer exists
          const { data: existingCustomer } = await supabase
            .from('customers')
            .select('id')
            .eq('email', wcOrder.billing.email)
            .single();

          if (existingCustomer) {
            customerId = existingCustomer.id;
          } else {
            // Create new customer
            const customerData = {
              name: `${wcOrder.billing.first_name || ''} ${wcOrder.billing.last_name || ''}`.trim() || 'WooCommerce Customer',
              email: wcOrder.billing.email,
              phone: wcOrder.billing.phone || '',
              address: wcOrder.billing.address_1 || '',
              city: wcOrder.billing.city || '',
              zip_code: wcOrder.billing.postcode || '',
              country: wcOrder.billing.country || '',
              source: 'WooCommerce'
            };

            const { data: newCustomer, error: customerError } = await supabase
              .from('customers')
              .insert(customerData)
              .select()
              .single();

            if (customerError) {
              console.error(`Error creating customer for order ${wcOrder.id}:`, customerError);
              continue;
            }
            
            customerId = newCustomer.id;
          }
        }

        // Transform WooCommerce order to our database schema
        const orderData = {
          customer_id: customerId,
          status: mapWooCommerceStatus(wcOrder.status),
          source: 'WooCommerce',
          shipping_address: wcOrder.shipping?.address_1 || '',
          shipping_city: wcOrder.shipping?.city || '',
          shipping_zip_code: wcOrder.shipping?.postcode || '',
          shipping_method: wcOrder.shipping_lines?.[0]?.method_title || 'Standard Shipping',
          total: parseFloat(wcOrder.total || 0),
          is_editable: false, // WooCommerce orders are not editable
          notes: wcOrder.customer_note || '',
          woo_commerce_id: wcOrder.id,
          woo_commerce_status: wcOrder.status,
          last_sync_date: new Date().toISOString()
        };

        // Check if order already exists by WooCommerce ID
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('id')
          .eq('woo_commerce_id', wcOrder.id)
          .single();

        let orderId;
        if (existingOrder) {
          // Update existing order
          const { data: updatedOrder, error: updateError } = await supabase
            .from('orders')
            .update(orderData)
            .eq('woo_commerce_id', wcOrder.id)
            .select()
            .single();

          if (updateError) {
            console.error(`Error updating order ${wcOrder.id}:`, updateError);
            continue;
          }
          
          orderId = updatedOrder.id;
          syncedOrders.push(updatedOrder);
        } else {
          // Insert new order
          const { data: newOrder, error: insertError } = await supabase
            .from('orders')
            .insert(orderData)
            .select()
            .single();

          if (insertError) {
            console.error(`Error inserting order ${wcOrder.id}:`, insertError);
            continue;
          }
          
          orderId = newOrder.id;
          syncedOrders.push(newOrder);
        }

        // Sync order products
        if (wcOrder.line_items && wcOrder.line_items.length > 0) {
          await syncOrderProducts(orderId, wcOrder.line_items);
        }
        
      } catch (orderError) {
        console.error(`Error processing order ${wcOrder.id}:`, orderError);
        continue;
      }
    }
    
    console.log(`Successfully synced ${syncedOrders.length} orders to database`);
    return syncedOrders;
    
  } catch (error) {
    console.error('Error syncing orders to database:', error);
    throw error;
  }
}

// Sync order products
async function syncOrderProducts(orderId, lineItems) {
  try {
    // First, delete existing order products for this order
    await supabase
      .from('order_products')
      .delete()
      .eq('order_id', orderId);

    for (const item of lineItems) {
      // Find product by WooCommerce ID or create a placeholder
      let productId = null;
      
      if (item.product_id) {
        const { data: existingProduct } = await supabase
          .from('products')
          .select('id')
          .eq('woo_commerce_id', item.product_id)
          .single();

        if (existingProduct) {
          productId = existingProduct.id;
        }
      }

      // If product not found, create a placeholder
      if (!productId) {
        const productData = {
          title: item.name || 'Unknown Product',
          base_price: parseFloat(item.price || 0),
          final_price: parseFloat(item.price || 0),
          supplier: 'WooCommerce',
          woo_commerce_id: item.product_id,
          woo_commerce_status: 'draft'
        };

        const { data: newProduct, error: productError } = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single();

        if (!productError && newProduct) {
          productId = newProduct.id;
        }
      }

      if (productId) {
        // Insert order product
        const orderProductData = {
          order_id: orderId,
          product_id: productId,
          quantity: item.quantity || 1,
          subtotal: parseFloat(item.total || 0)
        };

        await supabase
          .from('order_products')
          .insert(orderProductData);
      }
    }
  } catch (error) {
    console.error('Error syncing order products:', error);
  }
}

// Map WooCommerce status to our status
function mapWooCommerceStatus(wcStatus) {
  const statusMap = {
    'pending': 'pending',
    'processing': 'processing',
    'on-hold': 'pending',
    'completed': 'completed',
    'cancelled': 'cancelled',
    'refunded': 'cancelled',
    'failed': 'cancelled'
  };
  
  return statusMap[wcStatus] || 'pending';
}

export default router;

