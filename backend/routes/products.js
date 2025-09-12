import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Merr të gjithë produktet direkt nga WooCommerce
router.get('/', authenticateUser, async (req, res) => {
  try {
    console.log('Fetching products directly from WooCommerce...');
    
    const { page = 1, limit = 100, category, status } = req.query;

    // WooCommerce API configuration
    const wooCommerceConfig = {
      url: process.env.WOOCOMMERCE_URL || 'https://startech24.com',
      consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY || 'ck_0856cd7f00ed0c6faef27c9a64256bcf7430d414',
      consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET || 'cs_7c882c8e16979743e2dd63fb113759254d47d0aa'
    };

    // Fetch products directly from WooCommerce
    const wooCommerceProducts = await fetchWooCommerceProducts(wooCommerceConfig);
    
    if (!wooCommerceProducts || wooCommerceProducts.length === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0
        },
        message: 'No products found in WooCommerce store'
      });
    }

    console.log(`Found ${wooCommerceProducts.length} products from WooCommerce`);

    // Apply filters
    let filteredProducts = wooCommerceProducts;
    
    if (category) {
      filteredProducts = filteredProducts.filter(product => 
        product.categories && product.categories.some(cat => cat.name === category)
      );
    }
    
    if (status) {
      filteredProducts = filteredProducts.filter(product => product.status === status);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    const paginatedProducts = filteredProducts.slice(offset, offset + parseInt(limit));

    // Transform WooCommerce products to match frontend expectations
    const transformedData = paginatedProducts.map(product => ({
      id: product.id.toString(),
      image: product.images && product.images.length > 0 ? product.images[0].src : '',
      title: product.name || 'Untitled Product',
      category: product.categories && product.categories.length > 0 ? product.categories[0].name : 'Uncategorized',
      basePrice: parseFloat(product.price || 0),
      additionalCost: 0,
      finalPrice: parseFloat(product.price || 0),
      supplier: 'WooCommerce',
      wooCommerceStatus: product.status || 'draft',
      wooCommerceCategory: product.categories && product.categories.length > 0 ? product.categories[0].name : '',
      lastSyncDate: new Date().toISOString(),
      description: product.description || '',
      shortDescription: product.short_description || '',
      sku: product.sku || '',
      stockStatus: product.stock_status || 'instock',
      stockQuantity: product.stock_quantity || 0,
      weight: product.weight || '',
      dimensions: product.dimensions || {}
    }));

    res.json({
      success: true,
      data: transformedData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredProducts.length,
        pages: Math.ceil(filteredProducts.length / limit)
      },
      message: 'Products fetched directly from WooCommerce'
    });

  } catch (error) {
    console.error('Gabim në marrjen e produkteve nga WooCommerce:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në marrjen e produkteve nga WooCommerce',
      details: error.message
    });
  }
});

// Merr një produkt specifik
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Produkti nuk u gjet'
      });
    }

    // Transform the data to match frontend expectations
    const transformedData = {
      id: data.id,
      image: data.image || '',
      title: data.title || '',
      category: data.category || '',
      basePrice: parseFloat(data.base_price || 0),
      additionalCost: parseFloat(data.additional_cost || 0),
      finalPrice: parseFloat(data.final_price || 0),
      supplier: data.supplier || '',
      wooCommerceStatus: data.woo_commerce_status || 'draft',
      wooCommerceCategory: data.woo_commerce_category || '',
      lastSyncDate: data.last_sync_date || new Date().toISOString()
    };

    res.json({
      success: true,
      data: transformedData
    });
  } catch (error) {
    console.error('Gabim në marrjen e produktit:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në marrjen e produktit'
    });
  }
});

// Krijon një produkt të ri (vetëm admin)
router.post('/', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const productData = {
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      success: true,
      data: data,
      message: 'Produkti u krijua me sukses'
    });
  } catch (error) {
    console.error('Gabim në krijimin e produktit:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në krijimin e produktit'
    });
  }
});

// Përditëson një produkt (vetëm admin)
router.put('/:id', authenticateUser, requireAdmin, async (req, res) => {
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
      .from('products')
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
      message: 'Produkti u përditësua me sukses'
    });
  } catch (error) {
    console.error('Gabim në përditësimin e produktit:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në përditësimin e produktit'
    });
  }
});

// Fshin një produkt (vetëm admin)
router.delete('/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Produkti u fshi me sukses'
    });
  } catch (error) {
    console.error('Gabim në fshirjen e produktit:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në fshirjen e produktit'
    });
  }
});

// Sinkronizon produktet me WooCommerce (vetëm admin)
router.post('/sync-woocommerce', authenticateUser, requireAdmin, async (req, res) => {
  try {
    console.log('Starting WooCommerce sync...');
    
    // WooCommerce API configuration
    const wooCommerceConfig = {
      url: process.env.WOOCOMMERCE_URL || 'https://startech24.com',
      consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY || 'ck_0856cd7f00ed0c6faef27c9a64256bcf7430d414',
      consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET || 'cs_7c882c8e16979743e2dd63fb113759254d47d0aa'
    };

    if (!wooCommerceConfig.consumerKey || !wooCommerceConfig.consumerSecret) {
      return res.status(400).json({
        success: false,
        error: 'WooCommerce credentials not configured'
      });
    }

    // Fetch products from WooCommerce API (limit to 100 for sync)
    const wooCommerceProducts = await fetchWooCommerceProducts(wooCommerceConfig, 100);
    
    if (!wooCommerceProducts || wooCommerceProducts.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No products found in WooCommerce store'
      });
    }

    // Sync products to database
    const syncedProducts = await syncProductsToDatabase(wooCommerceProducts);
    
    res.json({
      success: true,
      message: `Successfully synced ${syncedProducts.length} products from WooCommerce`,
      data: {
        synced_at: new Date().toISOString(),
        products_synced: syncedProducts.length,
        products: syncedProducts.slice(0, 5) // Return first 5 products as sample
      }
    });

  } catch (error) {
    console.error('WooCommerce sync error:', error);
    res.status(500).json({
      success: false,
      error: 'WooCommerce sync failed',
      details: error.message
    });
  }
});

// Fetch products from WooCommerce API
async function fetchWooCommerceProducts(config, maxProducts = 100) {
  try {
    console.log(`Fetching products from WooCommerce (max ${maxProducts})...`);
    const products = [];
    let page = 1;
    const perPage = 100;
    
    while (products.length < maxProducts) {
      const url = `${config.url}/wp-json/wc/v3/products?per_page=${perPage}&page=${page}&status=publish`;
      const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');
      
      console.log(`Fetching page ${page} from: ${url}`);
      
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

      const pageProducts = await response.json();
      
      if (pageProducts.length === 0) {
        break; // No more products
      }
      
      // Add only up to maxProducts
      const remainingSlots = maxProducts - products.length;
      const productsToAdd = pageProducts.slice(0, remainingSlots);
      products.push(...productsToAdd);
      
      // If we've added all products from this page and reached our limit, stop
      if (productsToAdd.length < pageProducts.length || products.length >= maxProducts) {
        break;
      }
      
      page++;
      
      // Safety limit to prevent infinite loops
      if (page > 10) {
        console.log('Reached page limit (10), stopping...');
        break;
      }
    }
    
    console.log(`Fetched ${products.length} products from WooCommerce`);
    return products;
    
  } catch (error) {
    console.error('Error fetching WooCommerce products:', error);
    throw error;
  }
}

// Sync WooCommerce products to database
async function syncProductsToDatabase(wooCommerceProducts) {
  try {
    console.log('Syncing products to database...');
    const syncedProducts = [];
    
    for (const wcProduct of wooCommerceProducts) {
      try {
        // Transform WooCommerce product to our database schema
        const productData = {
          title: wcProduct.name || 'Untitled Product',
          description: wcProduct.description || '',
          image: wcProduct.images && wcProduct.images.length > 0 ? wcProduct.images[0].src : '',
          category: wcProduct.categories && wcProduct.categories.length > 0 ? wcProduct.categories[0].name : 'Uncategorized',
          base_price: parseFloat(wcProduct.price || 0),
          additional_cost: 0,
          final_price: parseFloat(wcProduct.price || 0),
          supplier: 'WooCommerce',
          woo_commerce_status: wcProduct.status || 'draft',
          woo_commerce_category: wcProduct.categories && wcProduct.categories.length > 0 ? wcProduct.categories[0].name : '',
          last_sync_date: new Date().toISOString(),
          woo_commerce_id: wcProduct.id
        };

        // Check if product already exists by WooCommerce ID
        const { data: existingProduct } = await supabase
          .from('products')
          .select('id')
          .eq('woo_commerce_id', wcProduct.id)
          .single();

        if (existingProduct) {
          // Update existing product
          const { data: updatedProduct, error: updateError } = await supabase
            .from('products')
            .update(productData)
            .eq('woo_commerce_id', wcProduct.id)
            .select()
            .single();

          if (updateError) {
            console.error(`Error updating product ${wcProduct.id}:`, updateError);
            continue;
          }
          
          syncedProducts.push(updatedProduct);
        } else {
          // Insert new product
          const { data: newProduct, error: insertError } = await supabase
            .from('products')
            .insert(productData)
            .select()
            .single();

          if (insertError) {
            console.error(`Error inserting product ${wcProduct.id}:`, insertError);
            continue;
          }
          
          syncedProducts.push(newProduct);
        }
        
      } catch (productError) {
        console.error(`Error processing product ${wcProduct.id}:`, productError);
        continue;
      }
    }
    
    console.log(`Successfully synced ${syncedProducts.length} products to database`);
    return syncedProducts;
    
  } catch (error) {
    console.error('Error syncing products to database:', error);
    throw error;
  }
}

export default router;

