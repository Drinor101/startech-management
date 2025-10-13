import React, { useState } from 'react';
import { Package, Euro, Building, FolderSync as Sync, Clock, CheckCircle, AlertCircle, Filter, Plus, ChevronDown } from 'lucide-react';
import { Product } from '../../types';
import { useProducts, useWooCommerceSync, useCreateProduct, useUpdateProduct, useDeleteProduct } from '../../hooks/useProducts';
import Modal from '../Common/Modal';
import ProductForm from './ProductForm';
import { usePermissions } from '../../hooks/usePermissions';

const ProductsList: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const { canCreate, canEdit, canDelete } = usePermissions();

  // React Query hooks
  const { 
    data: productsData, 
    isLoading: loading, 
    error: queryError,
    refetch 
  } = useProducts({
    page: currentPage,
    limit: pageSize,
    source: selectedSource,
    search: searchTerm
  });

  const wooCommerceSyncMutation = useWooCommerceSync();
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();

  // Extract data from query result
  const products = productsData?.data || [];
  const totalProducts = productsData?.pagination?.total || 0;
  const totalPages = productsData?.pagination?.pages || 1;
  const lastSync = productsData?.data?.[0]?.lastSyncDate || '';
  const error = queryError ? 'Gabim në ngarkimin e produkteve' : null;

  // Handle WooCommerce sync
  const handleWooCommerceSync = async () => {
    await wooCommerceSyncMutation.mutateAsync();
  };

  // Handle product creation
  const handleCreateProduct = async (productData: Partial<Product>) => {
    await createProductMutation.mutateAsync(productData);
    setIsFormOpen(false);
  };

  // Handle product update
  const handleUpdateProduct = async (productData: Partial<Product>) => {
    if (selectedProduct) {
      await updateProductMutation.mutateAsync({ id: selectedProduct.id, ...productData });
      setIsFormOpen(false);
      setSelectedProduct(null);
      setIsEditMode(false);
    }
  };

  // Handle product deletion
  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('A jeni të sigurt që dëshironi të fshini këtë produkt?')) {
      await deleteProductMutation.mutateAsync(id);
    }
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsEditMode(false);
    setIsFormOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsEditMode(false);
    setIsFormOpen(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSourceChange = (source: string) => {
    setSelectedSource(source);
    setCurrentPage(1);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  // Group products by category for display
  const groupedProducts = products.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

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
            <div className={`w-2 h-2 rounded-full ${wooCommerceSyncMutation.isPending ? 'bg-blue-400 animate-pulse' : 'bg-green-400'}`}></div>
            <span className="text-xs text-gray-500">
              {wooCommerceSyncMutation.isPending ? 'Duke sinkronizuar...' : 'Gati për sinkronizim'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Source Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={selectedSource}
              onChange={(e) => handleSourceChange(e.target.value)}
              className="pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm font-medium text-gray-700 appearance-none cursor-pointer hover:border-gray-400 transition-colors min-w-[180px]"
            >
              <option value="all">Të gjitha produktet</option>
              <option value="WooCommerce">Vetëm WooCommerce</option>
              <option value="Manual">Vetëm Manuale</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Add Product Button */}
          {canCreate('products') && (
            <button
              onClick={handleAddProduct}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md font-medium"
            >
              <Plus className="w-4 h-4" />
              Shto Produkt
            </button>
          )}
          <button 
            onClick={handleWooCommerceSync}
            disabled={wooCommerceSyncMutation.isPending}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sync className={`w-4 h-4 ${wooCommerceSyncMutation.isPending ? 'animate-spin' : ''}`} />
            {wooCommerceSyncMutation.isPending ? 'Duke sinkronizuar...' : 
             wooCommerceSyncMutation.isSuccess ? 'Sinkronizimi u përfundua!' :
             wooCommerceSyncMutation.isError ? 'Gabim në sinkronizim' :
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
              Duke shfaqur produktet në kategorinë: <strong>{selectedCategory}</strong> ({products.length} produkte)
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

      {wooCommerceSyncMutation.isSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-800">Products synchronized successfully!</span>
          </div>
        </div>
      )}

      {wooCommerceSyncMutation.isError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-800">Error synchronizing products. Please try again.</span>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
          <div key={category} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900">{category}</h3>
                <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                  {categoryProducts.length} produkte
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                      Produkti
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Çmimi Bazë
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Kostoja Shtesë
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Çmimi Final
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      Statusi WC
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Kategoria WC
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                      Sinkronizimi i Fundit
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categoryProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img 
                            src={product.image} 
                            alt={product.title}
                            className="w-10 h-10 object-cover rounded-lg"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium text-gray-900 truncate">{product.title}</div>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                product.source === 'WooCommerce' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {product.source}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">ID: {product.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Euro className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{product.basePrice.toFixed(2)} €</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Euro className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{product.additionalCost.toFixed(2)} €</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Euro className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-bold text-gray-900">{product.finalPrice.toFixed(2)} €</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
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
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{product.wooCommerceCategory}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
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
              onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
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
                    onClick={() => handlePageChange(pageNum)}
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
              onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
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
            Nuk ka produkte të disponueshme
          </p>
        </div>
      )}

      {/* Product Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        size="lg"
      >
        <ProductForm
          product={selectedProduct}
          onClose={() => setIsFormOpen(false)}
          onSuccess={isEditMode ? handleUpdateProduct : handleCreateProduct}
          isEditMode={isEditMode}
        />
      </Modal>
    </div>
  );
};

export default ProductsList;
