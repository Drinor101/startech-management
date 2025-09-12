import React, { useState, useEffect } from 'react';
import { Package, DollarSign, Tag, Building, FolderSync as Sync, Clock, CheckCircle, AlertCircle, Filter } from 'lucide-react';
import { Product } from '../../types';
import { apiCall, apiConfig } from '../../config/api';

const ProductsList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string>('');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [pageSize] = useState(25);

  // Manual WooCommerce sync function
  const handleWooCommerceSync = async () => {
    try {
      setSyncStatus('syncing');
      console.log('Starting manual WooCommerce sync...');
      
      const response = await apiCall('/api/products/sync-woocommerce', {
        method: 'POST'
      });
      
      console.log('WooCommerce sync response:', response);
      
      if (response.success) {
        setSyncStatus('success');
        // Refresh products after successful sync
        const productsResponse = await apiCall(apiConfig.endpoints.products);
        const data = productsResponse.success ? productsResponse.data : productsResponse.data || [];
        setProducts(data || []);
        
        // Reset status after 3 seconds
        setTimeout(() => setSyncStatus('idle'), 3000);
      } else {
        setSyncStatus('error');
        setTimeout(() => setSyncStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('WooCommerce sync error:', error);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Fetch products from API with pagination
  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching products page ${page}...`);
      
      // Fetch products with pagination
      const response = await apiCall(`${apiConfig.endpoints.products}?page=${page}&limit=${pageSize}`);
      console.log('Products API response:', response);
      
      // Handle the correct API response structure
      const data = response.success ? response.data : response.data || [];
      setProducts(data || []);
      
      // Update pagination info
      if (response.pagination) {
        setTotalPages(response.pagination.pages || 1);
        setTotalProducts(response.pagination.total || 0);
      }
      
      // Set last sync time
      setLastSync(new Date().toISOString());
      
      console.log(`Products loaded: ${data?.length || 0} of ${response.pagination?.total || 0}`);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Gabim në ngarkimin e produkteve');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(currentPage);git p
  }, [currentPage]);

  // Get unique categories from products
  const categories = ['all', ...Array.from(new Set(products.map(product => product.category)))];

  // Filter products by selected category
  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(product => product.category === selectedCategory);

  const groupedProducts = filteredProducts.reduce((acc, product) => {
    if (!acc[product.supplier]) {
      acc[product.supplier] = [];
    }
    acc[product.supplier].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  const handleSync = async () => {
    setSyncStatus('syncing');
    try {
      console.log('Starting WooCommerce sync...');
      const response = await apiCall('/api/products/sync-woocommerce', {
        method: 'POST'
      });
      
      console.log('WooCommerce sync response:', response);
      
      if (response.success) {
        setSyncStatus('success');
        // Refresh products after successful sync
        const productsResponse = await apiCall(apiConfig.endpoints.products);
        const data = productsResponse.success ? productsResponse.data : [];
        setProducts(data || []);
        
        setTimeout(() => setSyncStatus('idle'), 3000);
      } else {
        setSyncStatus('error');
        setTimeout(() => setSyncStatus('idle'), 5000);
      }
    } catch (err) {
      console.error('WooCommerce sync error:', err);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 5000);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'inactive':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'draft':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Po ngarkohen produktet...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Produktet</h2>
          <p className="text-sm text-gray-500 mt-1">
            {lastSync ? `Sinkronizimi i fundit: ${new Date(lastSync).toLocaleString()}` : 'Nuk ka të dhëna për sinkronizimin'}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-2 h-2 rounded-full ${syncStatus === 'syncing' ? 'bg-blue-400 animate-pulse' : 'bg-green-400'}`}></div>
            <span className="text-xs text-gray-500">
              {syncStatus === 'syncing' ? 'Duke sinkronizuar...' : 'Gati për sinkronizim'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === 'all' ? 'Të gjitha kategoritë' : category}
                </option>
              ))}
            </select>
          </div>
          <button 
            onClick={handleWooCommerceSync}
            disabled={syncStatus === 'syncing'}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sync className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            {syncStatus === 'syncing' ? 'Duke sinkronizuar...' : 
             syncStatus === 'success' ? 'Sinkronizimi u përfundua!' :
             syncStatus === 'error' ? 'Gabim në sinkronizim' :
             'Sinkronizo me WooCommerce'}
          </button>
        </div>
      </div>

      {/* Filter Summary */}
      {selectedCategory !== 'all' && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-800">
              Duke shfaqur produktet në kategorinë: <strong>{selectedCategory}</strong> ({filteredProducts.length} produkte)
            </span>
            <button
              onClick={() => setSelectedCategory('all')}
              className="ml-auto text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Fshij filtrin
            </button>
          </div>
        </div>
      )}

      {syncStatus === 'success' && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-800">Products synchronized successfully!</span>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {Object.entries(groupedProducts).map(([supplier, supplierProducts]) => (
          <div key={supplier} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900">{supplier}</h3>
                <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                  {supplierProducts.length} produkte
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produkti
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kategoria
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Çmimi Bazë
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kostoja Shtesë
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Çmimi Final
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statusi WC
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kategoria WC
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sinkronizimi i Fundit
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {supplierProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={product.image} 
                            alt={product.title}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{product.title}</div>
                            <div className="text-sm text-gray-500">ID: {product.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Tag className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{product.category}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">${product.basePrice.toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">${product.additionalCost.toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-bold text-gray-900">${product.finalPrice.toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(product.wooCommerceStatus)}
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            product.wooCommerceStatus === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : product.wooCommerceStatus === 'draft'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {product.wooCommerceStatus}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{product.wooCommerceCategory}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {new Date(product.lastSyncDate).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 px-4 py-3 bg-white border-t border-gray-200">
          <div className="flex items-center text-sm text-gray-700">
            <span>
              Duke shfaqur {((currentPage - 1) * pageSize) + 1} deri {Math.min(currentPage * pageSize, totalProducts)} 
              nga {totalProducts} produkte
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Mëparshëm
            </button>
            
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tjetër
            </button>
          </div>
        </div>
      )}

      {/* No results message */}
      {Object.keys(groupedProducts).length === 0 && !loading && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nuk u gjetën produkte</h3>
          <p className="text-gray-500">
            {selectedCategory !== 'all' 
              ? `Nuk u gjetën produkte në kategorinë "${selectedCategory}"`
              : 'Nuk ka produkte të disponueshme'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductsList;