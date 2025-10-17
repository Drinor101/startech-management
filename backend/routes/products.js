import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Cache system for WooCommerce products with memory limits
let productsCache = {
  data: [],
  timestamp: null,
  expiry: 5 * 60 * 1000, // 5 minutes cache
  loading: false,
  loadingStartTime: null,
  lastError: null,
  errorCount: 0,
  maxCacheSize: 1000, // Limit cache to 1000 products max
  totalProducts: 0 // Track total products available
};

// Check if cache is valid
const isCacheValid = () => {
  if (!productsCache.timestamp) return false;
  return (Date.now() - productsCache.timestamp) < productsCache.expiry;
};

// Get cached products or fetch fresh ones
const getCachedProducts = async () => {
  // If cache is valid and has data, return it
  if (isCacheValid() && productsCache.data.length > 0) {
    console.log(`Using cached WooCommerce products (${productsCache.data.length} products)`);
    return productsCache.data;
  }

  // Debug: Log cache status
  console.log('Cache status:', {
    hasTimestamp: !!productsCache.timestamp,
    timestamp: productsCache.timestamp,
    expiry: productsCache.expiry,
    isValid: isCacheValid(),
    hasData: productsCache.data.length > 0,
    dataCount: productsCache.data.length,
    loading: productsCache.loading,
    errorCount: productsCache.errorCount,
    lastError: productsCache.lastError
  });

  // If cache is being loaded, wait a bit and return cached data if available
  if (productsCache.loading) {
    const loadingDuration = Date.now() - (productsCache.loadingStartTime || 0);
    if (loadingDuration > 60000) { // Increased to 60s timeout
      console.log('Cache loading timeout, resetting and trying again');
      productsCache.loading = false;
      productsCache.loadingStartTime = null;
      productsCache.errorCount++;
    } else {
      console.log('Cache is being loaded, returning cached data if available');
      // Return cached data even if expired, if available
      if (productsCache.data.length > 0) {
        console.log(`Returning ${productsCache.data.length} cached products while loading`);
        return productsCache.data;
      }
      return [];
    }
  }

  // If we have too many consecutive errors, use cached data even if expired
  if (productsCache.errorCount >= 3 && productsCache.data.length > 0) {
    console.log(`Too many errors (${productsCache.errorCount}), using expired cache`);
    return productsCache.data;
  }

  console.log('Cache expired or empty, fetching fresh WooCommerce products...');
  productsCache.loading = true;
  productsCache.loadingStartTime = Date.now();
  
  try {
    const wooCommerceConfig = {
      url: process.env.WOOCOMMERCE_URL || 'https://startech24.com',
      consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY || 'ck_f2afc9ece7b63c49738ca46ab52b54eceaa05ca2',
      consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET || 'cs_92042ff7390d319db6fab44226a2af804ca27e9e'
    };

    const freshProducts = await fetchWooCommerceProducts(wooCommerceConfig);
    
      if (freshProducts && freshProducts.length > 0) {
        const transformedProducts = freshProducts.map(product => ({
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
          source: 'WooCommerce'
        }));

        // Limit cache size to prevent memory issues
        const limitedProducts = transformedProducts.slice(0, productsCache.maxCacheSize);
        
        productsCache.data = limitedProducts;
        productsCache.timestamp = Date.now();
        productsCache.lastError = null;
        productsCache.errorCount = 0; // Reset error count on success
        productsCache.totalProducts = freshProducts.length; // Store total count
        
        console.log(`Successfully cached ${limitedProducts.length} WooCommerce products (${freshProducts.length} total available)`);
        
        // Force garbage collection after large data processing
        if (global.gc && freshProducts.length > 1000) {
          console.log('Triggering GC after large product transformation');
          global.gc();
        }
        
        return limitedProducts;
      }
    
    console.log('No products returned from WooCommerce API');
    return [];
  } catch (error) {
    console.error('Error fetching WooCommerce products:', error);
    productsCache.lastError = error.message;
    productsCache.errorCount++;
    
    // Return cached data if available, even if expired
    if (productsCache.data && productsCache.data.length > 0) {
      console.log(`Returning ${productsCache.data.length} expired cached products due to API error`);
      return productsCache.data;
    }
    
    console.log('No cached data available, returning empty array');
    return [];
  } finally {
    productsCache.loading = false;
    productsCache.loadingStartTime = null;
  }
};

// Merr të gjithë produktet (WooCommerce + Manual) with memory optimization
router.get('/', authenticateUser, async (req, res) => {
  try {
    console.log('Fetching products from WooCommerce API and Manual DB...');
    
    const { page = 1, limit = 25, source, search, forceRefresh } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    // Enforce reasonable limits to prevent memory issues
    const maxLimit = 100; // Maximum products per request
    const safeLimit = Math.min(limitNum, maxLimit);
    
    console.log(`Request: page=${pageNum}, limit=${safeLimit}, source=${source || 'all'}`);

    let allProducts = [];

    // 1. Fetch WooCommerce products if source is 'all' or 'WooCommerce'
    if (!source || source === 'all' || source === 'WooCommerce') {
      try {
        console.log('Attempting to fetch WooCommerce products...');
        
        // Force refresh if requested
        if (forceRefresh === 'true') {
          console.log('Force refresh requested, clearing cache...');
          productsCache.data = [];
          productsCache.timestamp = null;
          productsCache.loading = false;
          productsCache.loadingStartTime = null;
          productsCache.lastError = null;
          productsCache.errorCount = 0;
          productsCache.totalProducts = 0;
        }
        
        const cachedProducts = await getCachedProducts();
        
        if (cachedProducts && cachedProducts.length > 0) {
          allProducts = [...allProducts, ...cachedProducts];
          console.log(`Added ${cachedProducts.length} cached WooCommerce products`);
        } else {
          console.log('No WooCommerce products available');
        }
      } catch (wooError) {
        console.error('Error fetching WooCommerce products:', wooError);
        // Continue with manual products even if WooCommerce fails
      }
    }

    // 2. Fetch Manual products if source is 'all' or 'Manual'
    if (!source || source === 'all' || source === 'Manual') {
      try {
        let query = supabase.from('products').select('*');

        const { data: manualProducts, error } = await query;

        if (error) {
          throw error;
        }

        if (manualProducts && manualProducts.length > 0) {
          const transformedManualProducts = manualProducts.map(product => ({
            id: product.id,
            image: product.image || '',
            title: product.title || 'Untitled Product',
            category: product.category || 'Uncategorized',
            basePrice: parseFloat(product.base_price || 0),
            additionalCost: parseFloat(product.additional_cost || 0),
            finalPrice: parseFloat(product.final_price || 0),
            supplier: product.supplier || 'Unknown',
            wooCommerceStatus: product.woo_commerce_status || 'draft',
            wooCommerceCategory: product.woo_commerce_category || '',
            lastSyncDate: product.last_sync_date || new Date().toISOString(),
            source: 'Manual'
          }));
          
          allProducts = [...allProducts, ...transformedManualProducts];
          console.log(`Added ${transformedManualProducts.length} Manual products`);
        }
      } catch (manualError) {
        console.error('Error fetching Manual products:', manualError);
      }
    }

    // 3. Apply source filter to combined results
    if (source && source !== 'all') {
      allProducts = allProducts.filter(product => product.source === source);
    }

    // 4. Apply search filter to combined results
    if (search) {
      const searchLower = search.toLowerCase();
      allProducts = allProducts.filter(product => 
        product.title.toLowerCase().includes(searchLower) ||
        product.id.toLowerCase().includes(searchLower) ||
        (product.category && product.category.toLowerCase().includes(searchLower))
      );
    }

    // 5. Apply pagination with memory-safe limits
    const startIndex = (pageNum - 1) * safeLimit;
    const endIndex = startIndex + safeLimit;
    const finalProducts = allProducts.slice(startIndex, endIndex);
    
    const paginationInfo = {
      page: pageNum,
      limit: safeLimit,
      total: allProducts.length,
      pages: Math.ceil(allProducts.length / safeLimit)
    };

    console.log(`Total products found: ${allProducts.length}, returning: ${finalProducts.length} (paginated)`);

    // Force garbage collection if memory usage is high
    if (global.gc && allProducts.length > 500) {
      console.log('Triggering garbage collection due to large dataset');
      global.gc();
    }

    res.json({
      success: true,
      data: finalProducts,
      pagination: paginationInfo,
      message: `Found ${finalProducts.length} products (${allProducts.length} total)`
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në ngarkimin e produkteve',
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
      title: req.body.title,
      category: req.body.category,
      base_price: req.body.basePrice,
      additional_cost: req.body.additionalCost,
      final_price: req.body.finalPrice,
      supplier: req.body.supplier,
      image: req.body.image,
      woo_commerce_category: req.body.wooCommerceCategory,
      woo_commerce_status: req.body.wooCommerceStatus || 'active',
      source: req.body.source || 'Manual',
      last_sync_date: req.body.lastSyncDate || new Date().toISOString(),
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
      error: 'Gabim në krijimin e produktit',
      details: error.message
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

// Clear products cache endpoint
router.post('/clear-cache', authenticateUser, requireAdmin, async (req, res) => {
  try {
    productsCache.data = [];
    productsCache.timestamp = null;
    productsCache.loading = false;
    productsCache.loadingStartTime = null;
    productsCache.lastError = null;
    productsCache.errorCount = 0;
    console.log('Products cache cleared');
    res.json({ success: true, message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ success: false, error: 'Failed to clear cache' });
  }
});

// Cache status endpoint
router.get('/cache-status', authenticateUser, async (req, res) => {
  try {
    const cacheAge = productsCache.timestamp ? Date.now() - productsCache.timestamp : null;
    const isValid = isCacheValid();
    
    res.json({
      success: true,
      data: {
        hasData: productsCache.data.length > 0,
        dataCount: productsCache.data.length,
        isValid: isValid,
        cacheAge: cacheAge,
        expiry: productsCache.expiry,
        loading: productsCache.loading,
        loadingDuration: productsCache.loadingStartTime ? Date.now() - productsCache.loadingStartTime : null,
        lastError: productsCache.lastError,
        errorCount: productsCache.errorCount,
        timestamp: productsCache.timestamp
      }
    });
  } catch (error) {
    console.error('Error getting cache status:', error);
    res.status(500).json({ success: false, error: 'Failed to get cache status' });
  }
});

// Test WooCommerce API endpoint
router.get('/test-woocommerce', authenticateUser, async (req, res) => {
  try {
    console.log('Testing WooCommerce API connection...');
    
    const wooCommerceConfig = {
      url: process.env.WOOCOMMERCE_URL || 'https://startech24.com',
      consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY || 'ck_f2afc9ece7b63c49738ca46ab52b54eceaa05ca2',
      consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET || 'cs_92042ff7390d319db6fab44226a2af804ca27e9e'
    };

    // Test with a simple API call
    const testUrl = `${wooCommerceConfig.url}/wp-json/wc/v3/products?per_page=1&page=1&status=publish`;
    const auth = Buffer.from(`${wooCommerceConfig.consumerKey}:${wooCommerceConfig.consumerSecret}`).toString('base64');
    
    console.log('Testing URL:', testUrl);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`WooCommerce API Error: ${response.status} ${response.statusText}`);
    }

    const testProducts = await response.json();
    
    res.json({
      success: true,
      message: 'WooCommerce API is working',
      data: {
        url: testUrl,
        status: response.status,
        productsFound: testProducts.length,
        sampleProduct: testProducts[0] || null,
        config: {
          url: wooCommerceConfig.url,
          hasConsumerKey: !!wooCommerceConfig.consumerKey,
          hasConsumerSecret: !!wooCommerceConfig.consumerSecret
        }
      }
    });
  } catch (error) {
    console.error('WooCommerce API test failed:', error);
    res.status(500).json({
      success: false,
      error: 'WooCommerce API test failed',
      details: error.message
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
      consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY || 'ck_f2afc9ece7b63c49738ca46ab52b54eceaa05ca2',
      consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET || 'cs_92042ff7390d319db6fab44226a2af804ca27e9e'
    };

    if (!wooCommerceConfig.consumerKey || !wooCommerceConfig.consumerSecret) {
      return res.status(400).json({
        success: false,
        error: 'WooCommerce credentials not configured'
      });
    }

    // Fetch products from WooCommerce API for sync
    const wooCommerceProducts = await fetchWooCommerceProducts(wooCommerceConfig);
    
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

// Fetch products from WooCommerce API with memory optimization and limits
async function fetchWooCommerceProducts(config, retryCount = 0) {
  const maxRetries = 2;
  const timeout = 10000; // Reduced to 10s
  const maxProducts = 2000; // Limit total products to prevent memory issues
  const perPage = 50; // Reduced from 100 to 50
  
  try {
    console.log(`Fetching WooCommerce products with memory limits... (attempt ${retryCount + 1})`);
    const products = [];
    let page = 1;
    let totalFetched = 0;
    
    while (totalFetched < maxProducts) {
      const url = `${config.url}/wp-json/wc/v3/products?per_page=${perPage}&page=${page}&status=publish`;
      const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');
      
      console.log(`Fetching page ${page} (${totalFetched}/${maxProducts} products)...`);
      
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

        const pageProducts = await response.json();
        
        if (pageProducts.length === 0) {
          console.log('No more products available');
          break; // No more products
        }
        
        // Add products with memory check
        products.push(...pageProducts);
        totalFetched += pageProducts.length;
        page++;
        
        // Memory management: force GC every 500 products
        if (totalFetched % 500 === 0 && global.gc) {
          console.log(`Memory management: processed ${totalFetched} products, triggering GC`);
          global.gc();
        }
        
        // Safety limit to prevent infinite loops
        if (page > 50) { // Reduced from 500 to 50 pages
          console.log('Reached page limit (50), stopping...');
          break;
        }
        
        // Small delay to prevent overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    }
    
    console.log(`Fetched ${products.length} products from WooCommerce (limited to ${maxProducts})`);
    
    // Update cache with total count
    productsCache.totalProducts = products.length;
    
    return products;
    
  } catch (error) {
    console.error(`Error fetching WooCommerce products (attempt ${retryCount + 1}):`, error);
    
    // Retry logic with shorter delays
    if (retryCount < maxRetries) {
      const delay = Math.pow(2, retryCount) * 500; // 500ms, 1s
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWooCommerceProducts(config, retryCount + 1);
    }
    
    throw error;
  }
}

// Sync WooCommerce products to database
async function syncProductsToDatabase(wooCommerceProducts) {
  try {
    console.log('Syncing products to database...');
    const syncedProducts = [];
    
    // Process products in batches of 50 for better performance
    const batchSize = 50;
    const batches = [];
    
    for (let i = 0; i < wooCommerceProducts.length; i += batchSize) {
      batches.push(wooCommerceProducts.slice(i, i + batchSize));
    }
    
    console.log(`Processing ${batches.length} batches of ${batchSize} products each`);
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} products)`);
      
      // Process batch in parallel
      const batchPromises = batch.map(async (wcProduct) => {
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
              return null;
            }
            
            return updatedProduct;
          } else {
            // Insert new product
            const { data: newProduct, error: insertError } = await supabase
              .from('products')
              .insert(productData)
              .select()
              .single();

            if (insertError) {
              console.error(`Error inserting product ${wcProduct.id}:`, insertError);
              return null;
            }
            
            return newProduct;
          }
          
        } catch (productError) {
          console.error(`Error processing product ${wcProduct.id}:`, productError);
          return null;
        }
      });
      
      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises);
      const validResults = batchResults.filter(result => result !== null);
      syncedProducts.push(...validResults);
      
      console.log(`Batch ${batchIndex + 1} completed: ${validResults.length}/${batch.length} products synced`);
    }
    
    console.log(`Successfully synced ${syncedProducts.length} products to database`);
    return syncedProducts;
    
  } catch (error) {
    console.error('Error syncing products to database:', error);
    throw error;
  }
}

export default router;

