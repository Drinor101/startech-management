import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { apiCall, apiConfig } from '../../config/api';

interface CustomerFormProps {
  onClose: () => void;
  onSuccess?: () => void;
  customer?: any; // For editing existing customer
}

const CustomerForm: React.FC<CustomerFormProps> = ({ onClose, onSuccess, customer }) => {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    source: customer?.source || 'Internal'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (customer) {
        // Update existing customer
        await apiCall(`${apiConfig.endpoints.customers}/${customer.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        // Create new customer
        await apiCall(apiConfig.endpoints.customers, {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gabim në ruajtjen e klientit');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Emri i Plotë</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm font-medium text-gray-700 appearance-none cursor-pointer hover:border-gray-400 transition-colors"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm font-medium text-gray-700 appearance-none cursor-pointer hover:border-gray-400 transition-colors"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Telefoni</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm font-medium text-gray-700 appearance-none cursor-pointer hover:border-gray-400 transition-colors"
          placeholder="+383 44 123 456"
        />
      </div>


      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Burimi</label>
        <select 
          name="source"
          value={formData.source}
          onChange={handleChange}
          className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm font-medium text-gray-700 appearance-none cursor-pointer hover:border-gray-400 transition-colors"
        >
          <option value="Internal">Internal</option>
          <option value="WooCommerce">WooCommerce</option>
          <option value="Website">Website</option>
          <option value="Social Media">Social Media</option>
          <option value="Referral">Referral</option>
        </select>
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
        >
          Anulo
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Duke ruajtur...' : (customer ? 'Përditëso' : 'Krijo Klient')}
        </button>
      </div>
    </form>
  );
};

export default CustomerForm;
