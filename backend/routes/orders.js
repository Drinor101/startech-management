import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';
import { logUserActivityAfter } from '../middleware/activityLogger.js';

const router = express.Router();

// Fetch orders from WooCommerce API
async function fetchWooCommerceOrders(config, retryCount = 0, page = 1, limit = 100, status = null) {
  const maxRetries = 2;
  const timeout = 15000;
  const perPage = Math.min(limit, 100); // Max 100 per page
  
  try {
    console.log(`Fetching WooCommerce orders page ${page} (${perPage} orders)${status ? ` with status: "${status}"` : ''}...`);
    
    // Build WooCommerce API URL
    let url = `${config.url}/wp-json/wc/v3/orders?per_page=${perPage}&page=${page}`;
    if (status) {
      url += `&status=${encodeURIComponent(status)}`;
    }
    
    const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`WooCommerce API Error: ${response.status} ${response.statusText}`);
      }

      const orders = await response.json();
      
      console.log(`Fetched ${orders.length} orders from WooCommerce page ${page}`);
      
      return orders;
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
    
  } catch (error) {
    console.error(`Error fetching WooCommerce orders page ${page} (attempt ${retryCount + 1}):`, error);
    
    // Retry logic
    if (retryCount < maxRetries) {
      const delay = Math.pow(2, retryCount) * 500; // 500ms, 1s
      console.log(`Retrying page ${page} in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWooCommerceOrders(config, retryCount + 1, page, limit, status);
    }
    
    throw error;
  }
}

// Map WooCommerce order status to our status format
function mapWooCommerceStatus(wcStatus) {
  const statusMap = {
    'pending': 'pending',
    'processing': 'processing',
    'on-hold': 'pending',
    'completed': 'delivered',
    'cancelled': 'cancelled',
    'refunded': 'cancelled',
    'failed': 'cancelled'
  };
  return statusMap[wcStatus] || 'pending';
}

// Map our status format to WooCommerce status format
function mapToWooCommerceStatus(ourStatus) {
  const statusMap = {
    'pending': 'pending',
    'processing': 'processing',
    'shipped': 'processing', // WooCommerce doesn't have 'shipped', use 'processing'
    'delivered': 'completed',
    'cancelled': 'cancelled',
    'accepted': 'processing' // WooCommerce doesn't have 'accepted', use 'processing'
  };
  return statusMap[ourStatus] || 'pending';
}

// Update WooCommerce order via API
async function updateWooCommerceOrder(config, orderId, updateData) {
  const timeout = 15000;
  
  try {
    console.log(`Updating WooCommerce order ${orderId} with data:`, updateData);
    
    const url = `${config.url}/wp-json/wc/v3/orders/${orderId}`;
    const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`WooCommerce API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const updatedOrder = await response.json();
      console.log(`Successfully updated WooCommerce order ${orderId}`);
      
      return updatedOrder;
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
    
  } catch (error) {
    console.error(`Error updating WooCommerce order ${orderId}:`, error);
    throw error;
  }
}

// Transform WooCommerce order to our format
function transformWooCommerceOrder(wcOrder) {
  return {
    id: wcOrder.id.toString(),
    customerId: wcOrder.customer_id ? wcOrder.customer_id.toString() : null,
    customer: {
      id: wcOrder.customer_id ? wcOrder.customer_id.toString() : null,
      name: `${wcOrder.billing.first_name} ${wcOrder.billing.last_name}`.trim() || wcOrder.billing.company || 'Klient i panjohur',
      email: wcOrder.billing.email || '',
      phone: wcOrder.billing.phone || ''
    },
    products: wcOrder.line_items?.map(item => ({
      id: item.product_id.toString(),
      title: item.name,
      quantity: item.quantity,
      finalPrice: parseFloat(item.price || 0),
      subtotal: parseFloat(item.total || 0),
      image: item.image?.src || '',
      category: item.categories?.map(cat => cat.name).join(', ') || 'Uncategorized'
    })) || [],
    status: mapWooCommerceStatus(wcOrder.status),
    source: 'WooCommerce',
    shippingInfo: {
      address: wcOrder.shipping.address_1 || wcOrder.billing.address_1 || '',
      city: wcOrder.shipping.city || wcOrder.billing.city || '',
      zipCode: wcOrder.shipping.postcode || wcOrder.billing.postcode || '',
      method: wcOrder.shipping_lines?.map(s => s.method_title).join(', ') || 'Standard'
    },
    total: parseFloat(wcOrder.total || 0),
    createdAt: wcOrder.date_created || new Date().toISOString(),
    updatedAt: wcOrder.date_modified || new Date().toISOString(),
    isEditable: false, // WooCommerce orders are not editable
    notes: wcOrder.customer_note || '',
    teamNotes: wcOrder.status_note || ''
  };
}

// Merr të gjithë porositë
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, source, search } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const maxLimit = 100;
    const safeLimit = Math.min(limitNum, maxLimit);

    // If source is WooCommerce, fetch from WooCommerce API
    if (source === 'WooCommerce') {
      try {
        const wooCommerceConfig = {
          url: process.env.WOOCOMMERCE_URL || 'https://startech24.com',
          consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY || 'ck_f2afc9ece7b63c49738ca46ab52b54eceaa05ca2',
          consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET || 'cs_92042ff7390d319db6fab44226a2af804ca27e9e'
        };

        console.log('Fetching WooCommerce orders from API...');
        const wooOrders = await fetchWooCommerceOrders(wooCommerceConfig, 0, pageNum, safeLimit, status || null);
        
        // Transform WooCommerce orders to our format
        let transformedOrders = wooOrders.map(transformWooCommerceOrder);
        
        // Apply search filter if provided
        if (search) {
          const searchLower = search.toLowerCase();
          transformedOrders = transformedOrders.filter(order => 
            order.id.toLowerCase().includes(searchLower) ||
            order.customer.name.toLowerCase().includes(searchLower) ||
            order.customer.email.toLowerCase().includes(searchLower) ||
            order.notes.toLowerCase().includes(searchLower) ||
            order.shippingInfo.address.toLowerCase().includes(searchLower)
          );
        }
        
        // Get total count from WooCommerce API headers for pagination
        let totalCount = transformedOrders.length;
        try {
          const totalCountUrl = `${wooCommerceConfig.url}/wp-json/wc/v3/orders?per_page=1&page=1${status ? `&status=${status}` : ''}`;
          const auth = Buffer.from(`${wooCommerceConfig.consumerKey}:${wooCommerceConfig.consumerSecret}`).toString('base64');
          const totalCountResponse = await fetch(totalCountUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (totalCountResponse.ok) {
            const total = totalCountResponse.headers.get('X-WP-Total') || 
                          totalCountResponse.headers.get('x-wp-total');
            if (total) {
              totalCount = parseInt(total);
              console.log(`✅ Total WooCommerce orders: ${totalCount}`);
            }
          }
        } catch (totalCountError) {
          console.log('⚠️ Could not get total count, using fetched count');
        }

        return res.json({
          success: true,
          data: transformedOrders,
          pagination: {
            page: pageNum,
            limit: safeLimit,
            total: totalCount,
            pages: Math.ceil(totalCount / safeLimit)
          }
        });
      } catch (wooError) {
        console.error('Error fetching WooCommerce orders:', wooError);
        // Fallback to empty array if WooCommerce fetch fails
        return res.json({
          success: true,
          data: [],
          pagination: {
            page: pageNum,
            limit: safeLimit,
            total: 0,
            pages: 0
          }
        });
      }
    }

    // For Manual orders, fetch from database
    const offset = (pageNum - 1) * safeLimit;

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

    // If source is specified and not WooCommerce, filter by source
    if (source && source !== 'WooCommerce') {
      query = query.eq('source', source);
    }

    // Search functionality
    if (search) {
      try {
        const searchTerm = `%${search}%`;
        // Only search in ID field for exact prefix matching (PRS, etc.)
        if (search.match(/^[A-Z]{3}/)) {
          query = query.ilike('id', searchTerm);
        } else {
          // For other searches, search in all fields
          query = query.or(`id.ilike.${searchTerm},notes.ilike.${searchTerm},shipping_address.ilike.${searchTerm},customer.name.ilike.${searchTerm},customer.email.ilike.${searchTerm}`);
        }
      } catch (searchError) {
        console.error('Orders search query error:', searchError);
        // Continue without search if query fails
      }
    }

    // Status filter
    if (status) {
      query = query.eq('status', status);
    }

    // Paginimi
    query = query.range(offset, offset + safeLimit - 1);

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
        page: pageNum,
        limit: safeLimit,
        total: count || 0,
        pages: Math.ceil((count || 0) / safeLimit)
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
router.post('/', authenticateUser, logUserActivityAfter('CREATE', 'ORDERS'), async (req, res) => {
  try {
    console.log('Creating new order with data:', req.body);
    const { customerId, customerName, customer, items, shippingAddress, shippingCity, shippingZipCode, shippingMethod, notes, teamNotes } = req.body;
    
    const userId = req.user.id;
    const userName = req.user.name || req.user.email?.split('@')[0] || 'Unknown';
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID mungon'
      });
    }

    // Validate required fields
    if (!customerId && !customerName && !customer) {
      return res.status(400).json({
        success: false,
        error: 'Klienti është i detyrueshëm',
        details: 'Customer information is required'
      });
    }

    // Validate customerId format if provided
    if (customerId && typeof customerId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'ID e klientit nuk është e vlefshme',
        details: 'Customer ID must be a valid string'
      });
    }

    // Validate UUID format for customerId
    if (customerId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(customerId)) {
      return res.status(400).json({
        success: false,
        error: 'ID e klientit nuk është në formatin e duhur',
        details: 'Customer ID must be a valid UUID'
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Të paktën një produkt është i detyrueshëm',
        details: 'At least one product is required'
      });
    }

    // Validate each item
    for (const item of items) {
      if (!item.productId) {
        return res.status(400).json({
          success: false,
          error: 'ID e produktit është e detyrueshme',
          details: 'Product ID is required for all items'
        });
      }
      if (!item.quantity || item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Sasia duhet të jetë më e madhe se 0',
          details: 'Quantity must be greater than 0'
        });
      }
    }
    
    console.log('Order data parsed:', {
      customerId,
      customerName,
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
    
    // Use customerId if provided, otherwise create or find customer by name
    let finalCustomerId;
    
    if (customerId) {
      // Validate that customer exists
      const { data: existingCustomerById, error: customerByIdError } = await supabase
        .from('customers')
        .select('id, name')
        .eq('id', customerId)
        .single();
      
      if (customerByIdError || !existingCustomerById) {
        return res.status(400).json({
          success: false,
          error: 'Klienti nuk u gjet',
          details: `Customer with ID ${customerId} does not exist`
        });
      }
      
      finalCustomerId = customerId;
    } else {
      // Fallback to old logic for backward compatibility
      const finalCustomerName = customerName || customer;
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('name', finalCustomerName)
        .single();
      
      if (existingCustomer) {
        finalCustomerId = existingCustomer.id;
      } else {
        // Create new customer
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            name: finalCustomerName,
            email: `${finalCustomerName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
            source: 'Internal'
          })
          .select('id')
          .single();
        
        if (customerError) {
          throw customerError;
        }
        finalCustomerId = newCustomer.id;
      }
    }
    
    // Use the validated products from earlier validation
    const productDetails = [];
    let hasWooCommerceProducts = false;
    
    // We already validated products above, so we can use that data
    for (const item of items) {
      try {
        // Get the product we already validated (could be by ID or WooCommerce ID)
        let validatedProduct, validatedError;
        
        // First try by exact ID
        const { data: exactMatch, error: exactError } = await supabase
          .from('products')
          .select('*')
          .eq('id', item.productId)
          .single();
        
        if (exactMatch && !exactError) {
          validatedProduct = exactMatch;
          validatedError = null;
        } else {
          // If not found by exact match, try to find by WooCommerce ID
          const { data: wooMatch, error: wooError } = await supabase
            .from('products')
            .select('*')
            .eq('woo_commerce_id', item.productId)
            .single();
          
          if (wooMatch && !wooError) {
            validatedProduct = wooMatch;
            validatedError = null;
          } else {
            validatedProduct = null;
            validatedError = wooError || exactError;
          }
        }
        
        if (validatedProduct && !validatedError) {
          // Check if this is a WooCommerce product
          if (validatedProduct.source === 'WooCommerce' || validatedProduct.source === 'Woo' || validatedProduct.woo_commerce_id) {
            hasWooCommerceProducts = true;
          }
          
          productDetails.push({
            id: validatedProduct.id,
            price: parseFloat(validatedProduct.final_price || 0),
            name: validatedProduct.title || 'Unknown Product'
          });
        } else {
          // Product not found in database - try to fetch from WooCommerce API
          try {
            const wooCommerceConfig = {
              url: process.env.WOOCOMMERCE_URL || 'https://startech24.com',
              consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY || 'ck_f2afc9ece7b63c49738ca46ab52b54eceaa05ca2',
              consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET || 'cs_92042ff7390d319db6fab44226a2af804ca27e9e'
            };
            
            const response = await fetch(`${wooCommerceConfig.url}/wp-json/wc/v3/products/${item.productId}`, {
              method: 'GET',
              headers: {
                'Authorization': `Basic ${Buffer.from(`${wooCommerceConfig.consumerKey}:${wooCommerceConfig.consumerSecret}`).toString('base64')}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              const wooProduct = await response.json();
              
              // Add to productDetails for order creation
              productDetails.push({
                id: wooProduct.id.toString(),
                price: parseFloat(wooProduct.price || 0),
                name: wooProduct.name || 'Unknown Product'
              });
              
              hasWooCommerceProducts = true;
            } else {
              return res.status(400).json({
                success: false,
                error: 'Produkti nuk u gjet',
                details: `Product with ID ${item.productId} not found in database or WooCommerce`
              });
            }
          } catch (wooError) {
            return res.status(400).json({
              success: false,
              error: 'Gabim në marrjen e produktit',
              details: `Failed to fetch product ${item.productId} from WooCommerce: ${wooError.message}`
            });
          }
        }
      } catch (error) {
        console.error(`Error fetching product ${item.productId}:`, error);
        throw new Error(`Failed to fetch product details for ${item.productId}: ${error.message}`);
      }
    }
    
    const total = items.reduce((sum, item) => {
      const product = productDetails.find(p => p.id === item.productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);

    const orderData = {
      id: orderId,
      customer_id: finalCustomerId,
      status: 'pending',
      source: 'Manual', // Orders created through the form are always Manual, regardless of product source
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

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      throw orderError;
    }

    // Insert order products - sync products to database if not found
    const orderProducts = [];
    
    for (const item of items) {
      const product = productDetails.find(p => p.id === item.productId);
      
      // Find the product UUID in our database by WooCommerce ID
      let { data: dbProduct, error: dbError } = await supabase
        .from('products')
        .select('id')
        .eq('woo_commerce_id', parseInt(item.productId))
        .single();
      
      console.log(`Database lookup result:`, { dbProduct, dbError });
      
      // If product not found in database, create it
      if (!dbProduct) {
        const productData = {
          title: product ? product.name : `Product ${item.productId}`,
          image: '',
          category: 'WooCommerce',
          base_price: product ? parseFloat(product.price || 0) : 100,
          additional_cost: 0,
          final_price: product ? parseFloat(product.price || 0) : 100,
          supplier: 'WooCommerce',
          woo_commerce_status: 'active',
          woo_commerce_category: '',
          last_sync_date: new Date().toISOString(),
          woo_commerce_id: parseInt(item.productId),
          source: 'WooCommerce',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { data: newProduct, error: insertError } = await supabase
          .from('products')
          .insert(productData)
          .select('id')
          .single();
        
        if (insertError) {
          throw insertError;
        }
        
        dbProduct = newProduct;
      }
      
      if (dbProduct) {
        const orderProduct = {
          order_id: orderId,
          product_id: dbProduct.id, // Use database UUID
          quantity: item.quantity,
          subtotal: product ? product.price * item.quantity : 0
        };
        console.log(`Adding order product:`, orderProduct);
        orderProducts.push(orderProduct);
      } else {
        console.warn(`Product ${item.productId} could not be created, skipping...`);
      }
    }

    console.log('Order products to insert:', orderProducts);
    console.log('Order products count:', orderProducts.length);

    if (orderProducts.length === 0) {
      console.error('No order products to insert! Debug info:');
      console.error('- Items:', items);
      console.error('- Product details:', productDetails);
      console.error('- Order products array:', orderProducts);
      throw new Error('No valid products found or created in database');
    }

    const { error: productsError } = await supabase
      .from('order_products')
      .insert(orderProducts);

    if (productsError) {
      console.error('Database error inserting order products:', productsError);
      throw productsError;
    }

    console.log('Order products inserted successfully');

    // Provide activity metadata for middleware logger
    res.locals.activityDetails = {
      entity_type: 'ORDER',
      entity_id: orderId,
      title: orderId
    };

    res.status(201).json({
      success: true,
      data: order,
      message: 'Porosia u krijua me sukses'
    });
  } catch (error) {
    console.error('=== ERROR IN ORDER CREATION ===');
    console.error('Gabim në krijimin e porosisë:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    console.error('Request body was:', req.body);
    console.error('User info:', {
      id: req.user?.id,
      name: req.user?.name,
      email: req.user?.email
    });
    console.error('=== END ERROR DETAILS ===');
    
    res.status(500).json({
      success: false,
      error: 'Gabim në krijimin e porosisë',
      details: error.message,
      code: error.code,
      hint: error.hint
    });
  }
});

// Përditëson një porosi
router.patch('/:id', authenticateUser, logUserActivityAfter('UPDATE', 'ORDERS'), async (req, res) => {
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

    // Check if this is a WooCommerce order (numeric ID) or Manual order (PRS-YYYY-NNN format)
    const isWooCommerceOrder = /^\d+$/.test(id);
    
    if (isWooCommerceOrder) {
      // Update WooCommerce order via API
      try {
        const wooCommerceConfig = {
          url: process.env.WOOCOMMERCE_URL || 'https://startech24.com',
          consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY || 'ck_f2afc9ece7b63c49738ca46ab52b54eceaa05ca2',
          consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET || 'cs_92042ff7390d319db6fab44226a2af804ca27e9e'
        };

        // Build WooCommerce update data
        const wooUpdateData = {};
        
        if (status) {
          wooUpdateData.status = mapToWooCommerceStatus(status);
        }
        
        if (shippingAddress || shippingCity || shippingZipCode) {
          wooUpdateData.shipping = {};
          if (shippingAddress) wooUpdateData.shipping.address_1 = shippingAddress;
          if (shippingCity) wooUpdateData.shipping.city = shippingCity;
          if (shippingZipCode) wooUpdateData.shipping.postcode = shippingZipCode;
        }
        
        if (notes) {
          wooUpdateData.customer_note = notes;
        }
        
        if (shippingMethod) {
          // WooCommerce stores shipping method in shipping_lines
          // This would require a more complex update, for now we'll skip it
          // or add it as a note
          if (!wooUpdateData.customer_note) {
            wooUpdateData.customer_note = '';
          }
          wooUpdateData.customer_note += (wooUpdateData.customer_note ? '\n' : '') + `Shipping Method: ${shippingMethod}`;
        }

        // Update WooCommerce order
        const updatedWooOrder = await updateWooCommerceOrder(wooCommerceConfig, id, wooUpdateData);
        
        // Transform the response to match our format
        const transformedOrder = transformWooCommerceOrder(updatedWooOrder);

        // Provide activity metadata for middleware logger
        res.locals.activityDetails = {
          entity_type: 'ORDER',
          entity_id: id,
          title: `WooCommerce Order ${id}`
        };

        return res.json({
          success: true,
          data: transformedOrder,
          message: 'Porosia WooCommerce u përditësua me sukses'
        });
      } catch (wooError) {
        console.error('Error updating WooCommerce order:', wooError);
        return res.status(500).json({
          success: false,
          error: 'Gabim në përditësimin e porosisë WooCommerce',
          details: wooError.message
        });
      }
    }

    // Handle Manual orders (database orders)
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

    // Provide activity metadata for middleware logger
    res.locals.activityDetails = {
      entity_type: 'ORDER',
      entity_id: id,
      title: id
    };

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

// Përditëson një porosi (PUT - alias për PATCH)
// Note: PUT uses the same logic as PATCH, so we'll just call the PATCH handler logic
router.put('/:id', authenticateUser, logUserActivityAfter('UPDATE', 'ORDERS'), async (req, res) => {
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

    // Check if this is a WooCommerce order (numeric ID) or Manual order (PRS-YYYY-NNN format)
    const isWooCommerceOrder = /^\d+$/.test(id);
    
    if (isWooCommerceOrder) {
      // Update WooCommerce order via API
      try {
        const wooCommerceConfig = {
          url: process.env.WOOCOMMERCE_URL || 'https://startech24.com',
          consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY || 'ck_f2afc9ece7b63c49738ca46ab52b54eceaa05ca2',
          consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET || 'cs_92042ff7390d319db6fab44226a2af804ca27e9e'
        };

        // Build WooCommerce update data
        const wooUpdateData = {};
        
        if (status) {
          wooUpdateData.status = mapToWooCommerceStatus(status);
        }
        
        if (shippingAddress || shippingCity || shippingZipCode) {
          wooUpdateData.shipping = {};
          if (shippingAddress) wooUpdateData.shipping.address_1 = shippingAddress;
          if (shippingCity) wooUpdateData.shipping.city = shippingCity;
          if (shippingZipCode) wooUpdateData.shipping.postcode = shippingZipCode;
        }
        
        if (notes) {
          wooUpdateData.customer_note = notes;
        }
        
        if (shippingMethod) {
          if (!wooUpdateData.customer_note) {
            wooUpdateData.customer_note = '';
          }
          wooUpdateData.customer_note += (wooUpdateData.customer_note ? '\n' : '') + `Shipping Method: ${shippingMethod}`;
        }

        // Update WooCommerce order
        const updatedWooOrder = await updateWooCommerceOrder(wooCommerceConfig, id, wooUpdateData);
        
        // Transform the response to match our format
        const transformedOrder = transformWooCommerceOrder(updatedWooOrder);

        // Provide activity metadata for middleware logger
        res.locals.activityDetails = {
          entity_type: 'ORDER',
          entity_id: id,
          title: `WooCommerce Order ${id}`
        };

        return res.json({
          success: true,
          data: transformedOrder,
          message: 'Porosia WooCommerce u përditësua me sukses'
        });
      } catch (wooError) {
        console.error('Error updating WooCommerce order:', wooError);
        return res.status(500).json({
          success: false,
          error: 'Gabim në përditësimin e porosisë WooCommerce',
          details: wooError.message
        });
      }
    }

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
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('name', customer)
        .single();
      
      if (existingCustomer) {
        updateData.customer_id = existingCustomer.id;
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
        updateData.customer_id = newCustomer.id;
      }
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        customer:customers(*),
        order_products:order_products(
          *,
          product:products(*)
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    // Update order products if items are provided
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

    // Provide activity metadata for middleware logger
    res.locals.activityDetails = {
      entity_type: 'ORDER',
      entity_id: id,
      title: id
    };

    res.json({
      success: true,
      data: data,
      message: 'Porosia u përditësua me sukses'
    });
  } catch (error) {
    console.error('PUT route - Gabim në përditësimin e porosisë:', error);
    console.error('PUT route - Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    res.status(500).json({
      success: false,
      error: 'Gabim në përditësimin e porosisë',
      details: error.message
    });
  }
});

// Fshin një porosi
router.delete('/:id', authenticateUser, logUserActivityAfter('DELETE', 'ORDERS'), async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    // Provide activity metadata for middleware logger
    res.locals.activityDetails = {
      entity_type: 'ORDER',
      entity_id: id,
      title: id
    };

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
      accepted: orders.filter(o => o.status === 'accepted').length,
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

