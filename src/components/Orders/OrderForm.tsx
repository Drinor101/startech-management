import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { mockCustomers, mockProducts } from '../../data/mockData';

interface OrderFormProps {
  onClose: () => void;
}

interface OrderItem {
  productId: string;
  quantity: number;
}

const OrderForm: React.FC<OrderFormProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    customerId: '',
    items: [{ productId: '', quantity: 1 }] as OrderItem[],
    shippingAddress: '',
    shippingCity: '',
    shippingZipCode: '',
    shippingMethod: 'Standard Post',
    notes: '',
    emailNotifications: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Order form data:', formData);
    onClose();
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
      const product = mockProducts.find(p => p.id === item.productId);
      return total + (product ? product.finalPrice * item.quantity : 0);
    }, 0);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
        <select
          name="customerId"
          value={formData.customerId}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="">Select Customer</option>
          {mockCustomers.map(customer => (
            <option key={customer.id} value={customer.id}>{customer.name}</option>
          ))}
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">Products</label>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Product
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
                  <option value="">Select Product</option>
                  {mockProducts.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.title} - ${product.finalPrice}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-3">
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Qty"
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
        <label className="block text-sm font-medium text-gray-700 mb-2">Shipping Information</label>
        <div className="space-y-3">
          <input
            type="text"
            name="shippingAddress"
            value={formData.shippingAddress}
            onChange={handleChange}
            placeholder="Street Address"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              name="shippingCity"
              value={formData.shippingCity}
              onChange={handleChange}
              placeholder="City"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <input
              type="text"
              name="shippingZipCode"
              value={formData.shippingZipCode}
              onChange={handleChange}
              placeholder="ZIP Code"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Method</label>
          <select
            name="shippingMethod"
            value={formData.shippingMethod}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="Standard Post">Standard Post</option>
            <option value="Express Post">Express Post</option>
            <option value="Overnight">Overnight</option>
            <option value="Pickup">Customer Pickup</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Additional notes or special instructions..."
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          name="emailNotifications"
          checked={formData.emailNotifications}
          onChange={handleChange}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label className="ml-2 block text-sm text-gray-900">Send email notifications to customer</label>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-lg font-medium text-gray-900">Total</span>
          <span className="text-lg font-bold text-gray-900">${calculateTotal().toFixed(2)}</span>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Create Order
        </button>
      </div>
    </form>
  );
};

export default OrderForm;