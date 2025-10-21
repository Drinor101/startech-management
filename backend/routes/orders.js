import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Merr të gjithë porositë
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, source, search } = req.query;
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
      
      // Validate that product exists
      console.log(`=== VALIDATING PRODUCT ${item.productId} ===`);
      console.log(`ProductId type: ${typeof item.productId}`);
      console.log(`ProductId value: ${item.productId}`);
      
      // Try to find product by ID (could be UUID or numeric)
      let existingProduct, productError;
      
      // First try exact match
      const { data: exactMatch, error: exactError } = await supabase
        .from('products')
        .select('id, title, final_price, source')
        .eq('id', item.productId)
        .single();
      
      if (exactMatch && !exactError) {
        existingProduct = exactMatch;
        productError = null;
        console.log(`✅ Found product by exact ID match`);
      } else {
        // If not found by exact match, try to find by WooCommerce ID
        console.log(`❌ Product not found by exact ID, trying WooCommerce ID...`);
        const { data: wooMatch, error: wooError } = await supabase
          .from('products')
          .select('id, title, final_price, source')
          .eq('woo_commerce_id', item.productId)
          .single();
        
        if (wooMatch && !wooError) {
          existingProduct = wooMatch;
          productError = null;
          console.log(`✅ Found product by WooCommerce ID match`);
        } else {
          existingProduct = null;
          productError = wooError || exactError;
          console.log(`❌ Product not found by WooCommerce ID either`);
        }
      }
      
      console.log(`Supabase query result:`, {
        data: existingProduct,
        error: productError,
        hasData: !!existingProduct,
        hasError: !!productError
      });
      
      if (productError || !existingProduct) {
        console.error(`❌ Product with ID ${item.productId} not found:`, productError);
        console.error(`ProductError details:`, {
          message: productError?.message,
          code: productError?.code,
          details: productError?.details,
          hint: productError?.hint
        });
        return res.status(400).json({
          success: false,
          error: 'Produkti nuk u gjet',
          details: `Product with ID ${item.productId} does not exist`,
          productError: productError?.message
        });
      }
      
      console.log(`✅ Product ${item.productId} validated: ${existingProduct.title} - €${existingProduct.final_price} (${existingProduct.source})`);
      console.log(`=== END VALIDATION FOR PRODUCT ${item.productId} ===`);
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
      console.log(`=== VALIDATING CUSTOMER ${customerId} ===`);
      console.log(`CustomerId type: ${typeof customerId}`);
      console.log(`CustomerId value: ${customerId}`);
      
      const { data: existingCustomerById, error: customerByIdError } = await supabase
        .from('customers')
        .select('id, name')
        .eq('id', customerId)
        .single();
      
      console.log(`Supabase customer query result:`, {
        data: existingCustomerById,
        error: customerByIdError,
        hasData: !!existingCustomerById,
        hasError: !!customerByIdError
      });
      
      if (customerByIdError || !existingCustomerById) {
        console.error(`❌ Customer with ID ${customerId} not found:`, customerByIdError);
        console.error(`CustomerError details:`, {
          message: customerByIdError?.message,
          code: customerByIdError?.code,
          details: customerByIdError?.details,
          hint: customerByIdError?.hint
        });
        return res.status(400).json({
          success: false,
          error: 'Klienti nuk u gjet',
          details: `Customer with ID ${customerId} does not exist`,
          customerError: customerByIdError?.message
        });
      }
      
      finalCustomerId = customerId;
      console.log(`✅ Using provided customerId: ${finalCustomerId} (${existingCustomerById.name})`);
      console.log(`=== END CUSTOMER VALIDATION ===`);
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
    
    // Fetch product details (from Database or WooCommerce)
    console.log('=== FETCHING PRODUCT DETAILS ===');
    console.log('Fetching product details for items:', JSON.stringify(items, null, 2));
    const productDetails = [];
    let hasWooCommerceProducts = false;
    
    console.log('=== DEBUGGING WOOCOMMERCE DETECTION ===');
    
    for (const item of items) {
      try {
        console.log(`Fetching product ${item.productId}...`);
        
        // First, try to get from database (for manual products)
        const { data: manualProduct, error: manualError } = await supabase
          .from('products')
          .select('*')
          .or(`id.eq.${item.productId},woo_commerce_id.eq.${item.productId}`)
          .single();
        
        if (manualProduct && !manualError) {
          console.log(`Product ${item.productId} found in database:`, {
            id: manualProduct.id,
            title: manualProduct.title,
            final_price: manualProduct.final_price,
            source: manualProduct.source,
            woo_commerce_id: manualProduct.woo_commerce_id
          });
          
          // Check if this is a WooCommerce product
          console.log(`Checking if product ${item.productId} is WooCommerce:`);
          console.log(`- source: ${manualProduct.source}`);
          console.log(`- woo_commerce_id: ${manualProduct.woo_commerce_id}`);
          console.log(`- source === 'WooCommerce': ${manualProduct.source === 'WooCommerce'}`);
          console.log(`- woo_commerce_id exists: ${!!manualProduct.woo_commerce_id}`);
          
          if (manualProduct.source === 'WooCommerce' || manualProduct.source === 'Woo' || manualProduct.woo_commerce_id) {
            hasWooCommerceProducts = true;
            console.log(`✅ Product ${item.productId} is a WooCommerce product - setting hasWooCommerceProducts = true`);
          } else {
            console.log(`❌ Product ${item.productId} is NOT a WooCommerce product`);
          }
          
          productDetails.push({
            id: manualProduct.id,
            price: parseFloat(manualProduct.final_price || 0),
            name: manualProduct.title || 'Unknown Product'
          });
        } else {
          // If not found in database, try WooCommerce API
          console.log(`Product ${item.productId} not found in database, trying WooCommerce API...`);
          
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
          
          console.log(`WooCommerce response for product ${item.productId}:`, response.status, response.statusText);
          
          if (response.ok) {
            const product = await response.json();
            console.log(`Product ${item.productId} fetched from WooCommerce:`, {
              id: product.id,
              name: product.name,
              price: product.price
            });
            
            productDetails.push({
              id: product.id.toString(),
              price: parseFloat(product.price || 0),
              name: product.name || 'Unknown Product'
            });
            hasWooCommerceProducts = true;
          } else {
            console.error(`Failed to fetch product ${item.productId} from WooCommerce: ${response.status}`);
            throw new Error(`Product ${item.productId} not found in database or WooCommerce`);
          }
        }
      } catch (error) {
        console.error(`Error fetching product ${item.productId}:`, error);
        throw new Error(`Failed to fetch product details for ${item.productId}: ${error.message}`);
      }
    }
    
    console.log('=== WOOCOMMERCE API CALL COMPLETED ===');
    console.log('Final product details:', JSON.stringify(productDetails, null, 2));
    
    const total = items.reduce((sum, item) => {
      const product = productDetails.find(p => p.id === item.productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);

    console.log('=== FINAL ORDER SOURCE DETERMINATION ===');
    console.log(`hasWooCommerceProducts: ${hasWooCommerceProducts}`);
    console.log(`Final order source will be: ${hasWooCommerceProducts ? 'WooCommerce' : 'Manual'}`);

    const orderData = {
      id: orderId,
      customer_id: finalCustomerId,
      status: 'pending',
      source: hasWooCommerceProducts ? 'WooCommerce' : 'Manual',
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

    // Insert order products - sync products to database if not found
    const orderProducts = [];
    console.log('Processing order items:', items);
    console.log('Product details from WooCommerce:', productDetails);
    
    for (const item of items) {
      console.log(`Processing item: ${item.productId}, quantity: ${item.quantity}`);
      const product = productDetails.find(p => p.id === item.productId);
      console.log(`Found product in WooCommerce details:`, product);
      
      // Find the product UUID in our database by WooCommerce ID
      console.log(`Looking for product ${item.productId} in database...`);
      let { data: dbProduct, error: dbError } = await supabase
        .from('products')
        .select('id')
        .eq('woo_commerce_id', parseInt(item.productId))
        .single();
      
      console.log(`Database lookup result:`, { dbProduct, dbError });
      
      // If product not found in database, create it
      if (!dbProduct) {
        console.log(`Product ${item.productId} not found in database, creating it...`);
        
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
        
        console.log(`Creating product with data:`, productData);
        
        const { data: newProduct, error: insertError } = await supabase
          .from('products')
          .insert(productData)
          .select('id')
          .single();
        
        console.log(`Product creation result:`, { newProduct, insertError });
        
        if (insertError) {
          console.error(`Error creating product ${item.productId}:`, insertError);
          console.error(`Insert error details:`, {
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
            code: insertError.code
          });
          continue;
        }
        
        dbProduct = newProduct;
        console.log(`Product ${item.productId} created in database with UUID: ${dbProduct.id}`);
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
router.patch('/:id', authenticateUser, async (req, res) => {
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

// Përditëson një porosi (PUT - alias për PATCH)
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
router.delete('/:id', authenticateUser, async (req, res) => {
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

