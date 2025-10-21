import React, { useState } from 'react';
import { Save, ChevronDown } from 'lucide-react';
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
    supplier: product?.supplier || '',
    image: product?.image || '',
    wooCommerceCategory: product?.wooCommerceCategory || '',
    wooCommerceStatus: product?.wooCommerceStatus || 'active',
    source: 'Manual' // Always Manual for manually created products
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate final price
  const finalPrice = formData.basePrice;

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
        finalPrice: finalPrice,
        supplier: formData.supplier,
        image: formData.image,
        wooCommerceCategory: formData.wooCommerceCategory,
        wooCommerceStatus: formData.wooCommerceStatus,
        source: formData.source,
        lastSyncDate: new Date().toISOString()
      };

      console.log('ProductForm - Sending data:', productData);

      let response;
      if (product) {
        // Update existing product
        console.log('ProductForm - Updating existing product:', product.id);
        response = await apiCall(`${apiConfig.endpoints.products}/${product.id}`, {
          method: 'PUT',
          body: JSON.stringify(productData)
        });
      } else {
        // Create new product
        console.log('ProductForm - Creating new product');
        response = await apiCall(apiConfig.endpoints.products, {
          method: 'POST',
          body: JSON.stringify(productData)
        });
      }

      console.log('ProductForm - API Response:', response);
      console.log('ProductForm - Calling onSuccess()');
      
      // Call onSuccess - the parent component will handle closing the form
      onSuccess();
    } catch (err: any) {
      console.error('ProductForm - Error saving product:', err);
      console.error('ProductForm - Error details:', err.message);
      setError(err.message || 'Gabim në ruajtjen e produktit');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'basePrice' ? parseFloat(value) || 0 : value
    }));
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Title */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titulli i Produktit *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Shkruani titullin e produktit"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategoria *
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="P.sh. Laptops, Printers, etc."
              required
            />
          </div>

          {/* Supplier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Furnizuesi
            </label>
            <input
              type="text"
              name="supplier"
              value={formData.supplier}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="P.sh. Dell, HP, etc."
            />
          </div>

          {/* Base Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Çmimi Bazë (€) *
            </label>
            <input
              type="number"
              name="basePrice"
              value={formData.basePrice}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="0.00"
              required
            />
          </div>

          {/* Final Price Display */}
          <div className="md:col-span-2">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Çmimi Total:</span>
                <span className="text-lg font-semibold text-green-600">
                  €{finalPrice.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Çmimi Bazë
              </p>
            </div>
          </div>

          {/* Image URL */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL e Imazhit
            </label>
            <input
              type="url"
              name="image"
              value={formData.image}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* WooCommerce Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategoria WooCommerce
            </label>
            <input
              type="text"
              name="wooCommerceCategory"
              value={formData.wooCommerceCategory}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="P.sh. Computers, Electronics"
            />
          </div>

          {/* Product Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statusi i Produktit
            </label>
            <select
              name="wooCommerceStatus"
              value={formData.wooCommerceStatus}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="active">Aktiv - Gati për shitje</option>
              <option value="inactive">Joaktiv - Në magazinë</option>
              <option value="draft">Draft - Në zhvillim</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
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
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
