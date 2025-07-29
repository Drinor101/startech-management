import React, { useState } from 'react';
import { Package, DollarSign, Tag, Building, FolderSync as Sync, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Product } from '../../types';
import { mockProducts } from '../../data/mockData';

const ProductsList: React.FC = () => {
  const [products] = useState<Product[]>(mockProducts);
  const [lastSync] = useState('2024-01-15T12:00:00Z');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  const groupedProducts = products.reduce((acc, product) => {
    if (!acc[product.supplier]) {
      acc[product.supplier] = [];
    }
    acc[product.supplier].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  const handleSync = async () => {
    setSyncStatus('syncing');
    // Simulate sync process
    setTimeout(() => {
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }, 2000);
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Products</h2>
          <p className="text-sm text-gray-500 mt-1">
            Last sync: {new Date(lastSync).toLocaleString()}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-500">Auto-sync every 30 minutes</span>
          </div>
        </div>
        <button 
          onClick={handleSync}
          disabled={syncStatus === 'syncing'}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sync className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
          {syncStatus === 'syncing' ? 'Syncing...' : 'Sync with WooCommerce'}
        </button>
      </div>

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
                  {supplierProducts.length} products
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Base Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Additional Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Final Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      WC Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      WC Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Sync
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
    </div>
  );
};

export default ProductsList;