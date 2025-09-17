import React, { useState } from 'react';
import { X, Save, Package } from 'lucide-react';
import { Product } from '../../types';
import { apiCall, apiConfig } from '../../config/api';

interface ProductFormProps {
  product?: Product | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ product, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: product?.title || '',
    category: product?.category || '',
    basePrice: product?.basePrice || 0,
    additionalCost: product?.additionalCost || 0,
    supplier: product?.supplier || '',
    image: product?.image || '',
    wooCommerceCategory: product?.wooCommerceCategory || '',
    wooCommerceStatus: product?.wooCommerceStatus || 'active',
    source: 'Manual' // Always Manual for manually created products
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate final price
  const finalPrice = formData.basePrice + formData.additionalCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Titulli është i detyrueshëm');
      return;
    }

    if (!formData.category.trim()) {
      setError('Kategoria është e detyrueshme');
      return;
    }

    if (formData.basePrice <= 0) {
      setError('Çmimi bazë duhet të jetë më i madh se 0');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const productData = {
        title: formData.title,
        category: formData.category,
        basePrice: formData.basePrice,
        additionalCost: formData.additionalCost,
        finalPrice: finalPrice,
        supplier: formData.supplier,
        image: formData.image,
        wooCommerceCategory: formData.wooCommerceCategory,
        wooCommerceStatus: formData.wooCommerceStatus,
        source: formData.source,
        lastSyncDate: new Date().toISOString()
      };

      if (product) {
        // Update existing product
        await apiCall(`${apiConfig.endpoints.products}/${product.id}`, {
          method: 'PUT',
          body: JSON.stringify(productData)
        });
      } else {
        // Create new product
        await apiCall(apiConfig.endpoints.products, {
          method: 'POST',
          body: JSON.stringify(productData)
        });
      }

      onSuccess();
    } catch (err: any) {
      console.error('Error saving product:', err);
      setError(err.message || 'Gabim në ruajtjen e produktit');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'basePrice' || name === 'additionalCost' ? parseFloat(value) || 0 : value
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {product ? 'Modifiko Produktin' : 'Shto Produkt të Ri'}
            </h2>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titulli i Produktit *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Shkruani titullin e produktit"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategoria *
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="P.sh. Laptops, Printers, etc."
              required
            />
          </div>

          {/* Supplier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Furnizuesi
            </label>
            <input
              type="text"
              name="supplier"
              value={formData.supplier}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="P.sh. Dell, HP, etc."
            />
          </div>

          {/* Base Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Çmimi Bazë (€) *
            </label>
            <input
              type="number"
              name="basePrice"
              value={formData.basePrice}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
              required
            />
          </div>

          {/* Additional Cost */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kosto Shtesë (€)
            </label>
            <input
              type="number"
              name="additionalCost"
              value={formData.additionalCost}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
            />
          </div>

          {/* Final Price Display */}
          <div className="md:col-span-2">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Çmimi Final:</span>
                <span className="text-lg font-semibold text-green-600">
                  €{finalPrice.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Çmimi Bazë + Kosto Shtesë
              </p>
            </div>
          </div>

          {/* Image URL */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL e Imazhit
            </label>
            <input
              type="url"
              name="image"
              value={formData.image}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* WooCommerce Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategoria WooCommerce
            </label>
            <input
              type="text"
              name="wooCommerceCategory"
              value={formData.wooCommerceCategory}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="P.sh. Computers, Electronics"
            />
          </div>

          {/* WooCommerce Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statusi WooCommerce
            </label>
            <select
              name="wooCommerceStatus"
              value={formData.wooCommerceStatus}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Anulo
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Duke ruajtur...' : (product ? 'Modifiko' : 'Krijo')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
