import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { apiCall } from '../../config/api';
import { Product } from '../../types';

interface OrderFormProps {
  order?: any;
  onClose: () => void;
  onSuccess?: () => void;
}

interface OrderItem {
  productId: string;
  quantity: number;
}

const OrderForm: React.FC<OrderFormProps> = ({ order, onClose, onSuccess }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    customer: order?.customer?.name || '',
    items: order?.products?.map(p => ({ productId: p.id, quantity: p.quantity })) || [{ productId: '', quantity: 1 }] as OrderItem[],
    shippingAddress: order?.shippingInfo?.address || '',
    shippingCity: order?.shippingInfo?.city || '',
    shippingZipCode: order?.shippingInfo?.zipCode || '',
    shippingMethod: order?.shippingInfo?.method || 'Standard Post',
    notes: order?.notes || '',
    teamNotes: order?.teamNotes || ''
  });

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await apiCall('/api/products');
        console.log('OrderForm Products API response:', response);
        
        // Handle the correct API response structure
        const data = response.success ? response.data : [];
        setProducts(data || []);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = order ? `/api/orders/${order.id}` : '/api/orders';
      const method = order ? 'PUT' : 'POST';
      
      const response = await apiCall(url, {
        method,
        body: JSON.stringify(formData)
      });
      
      if (response.success) {
        console.log('Order saved successfully:', response);
        onSuccess?.();
      } else {
        console.error('Error saving order:', response.error);
      }
    } catch (error) {
      console.error('Error saving order:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (index: number, field: keyof OrderItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', quantity: 1 }]
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateTotal = () => {
    return formData.items.reduce((total, item) => {
      const product = products.find(p => p.id === item.productId);
      return total + (product ? (product.finalPrice || 0) * (item.quantity || 0) : 0);
    }, 0);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Klienti *</label>
        <input
          type="text"
          name="customer"
          value={formData.customer || ''}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Emri i klientit"
          required
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">Produktet</label>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            <Plus className="w-4 h-4" />
            Shto Produkt
          </button>
        </div>
        
        <div className="space-y-3">
          {formData.items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-7">
                <select
                  value={item.productId}
                  onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Zgjidh Produktin</option>
                  {loading ? (
                    <option disabled>Duke ngarkuar...</option>
                  ) : (
                    products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.title} - ${(product.finalPrice || 0).toFixed(2)}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="col-span-3">
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Sasi"
                />
              </div>
              <div className="col-span-2">
                {formData.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Informacioni i Dërgimit</label>
        <div className="space-y-3">
          <input
            type="text"
            name="shippingAddress"
            value={formData.shippingAddress}
            onChange={handleChange}
            placeholder="Adresa e Rrugës"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              name="shippingCity"
              value={formData.shippingCity}
              onChange={handleChange}
              placeholder="Qyteti"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <input
              type="text"
              name="shippingZipCode"
              value={formData.shippingZipCode}
              onChange={handleChange}
              placeholder="Kodi Postar"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Metoda e Dërgimit</label>
          <select
            name="shippingMethod"
            value={formData.shippingMethod}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="Standard Post">Posta Standarde</option>
            <option value="Express Post">Posta e Shpejtë</option>
            <option value="Overnight">Gjatë Natës</option>
            <option value="Pickup">Marrja nga Klienti</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Shënime (Opsionale)</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Shënime shtesë ose udhëzime të veçanta..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Shënim shtesë (për ekipin)</label>
        <textarea
          name="teamNotes"
          value={formData.teamNotes}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Shënime të veçanta për ekipin e punës..."
        />
      </div>

      {order && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Statusi</label>
          <select
            name="status"
            value={formData.status || order.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="pending">Në Pritje</option>
            <option value="processing">Në Procesim</option>
            <option value="shipped">Dërguar</option>
            <option value="delivered">Dërguar</option>
            <option value="cancelled">Anuluar</option>
          </select>
        </div>
      )}


      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-lg font-medium text-gray-900">Totali</span>
          <span className="text-lg font-bold text-gray-900">${calculateTotal().toFixed(2)}</span>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Anulo
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {order ? 'Përditëso Porosinë' : 'Krijo Porosi'}
        </button>
      </div>
    </form>
  );
};

export default OrderForm;