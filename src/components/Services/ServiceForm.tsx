import React, { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import { apiCall, apiConfig } from '../../config/api';

interface ServiceFormProps {
  onClose: () => void;
  onSuccess?: () => void;
  service?: any; // For editing existing service
}

const ServiceForm: React.FC<ServiceFormProps> = ({ onClose, onSuccess, service }) => {
  const [formData, setFormData] = useState({
    customer_id: service?.customer_id || '',
    order_id: service?.order_id || '',
    problem_description: service?.problem_description || '',
    category: service?.category || '',
    assigned_to: service?.assigned_to || '',
    reception_point: service?.reception_point || '',
    under_warranty: service?.under_warranty || false,
    email_notifications_sent: service?.email_notifications_sent || true
  });
  const [customers, setCustomers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  // Fetch customers and orders
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersResponse, ordersResponse] = await Promise.all([
          apiCall(apiConfig.endpoints.customers),
          apiCall(apiConfig.endpoints.orders)
        ]);
        setCustomers(customersResponse.data || []);
        setOrders(ordersResponse.data || []);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (service) {
        // Update existing service
        await apiCall(`${apiConfig.endpoints.services}/${service.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        // Create new service
        await apiCall(apiConfig.endpoints.services, {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : service ? 'Gabim në përditësimin e shërbimit' : 'Gabim në krijimin e shërbimit');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleNewCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewCustomerData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateNewCustomer = async () => {
    if (!newCustomerData.name || !newCustomerData.email) {
      alert('Emri dhe emaili janë të detyrueshëm');
      return;
    }

    try {
      const response = await apiCall(apiConfig.endpoints.customers, {
        method: 'POST',
        body: JSON.stringify(newCustomerData)
      });

      if (response.success) {
        // Shto klientin e ri në listën e klientëve
        setCustomers(prev => [...prev, response.data]);
        // Zgjidh klientin e ri automatikisht
        setFormData(prev => ({
          ...prev,
          customer_id: response.data.id
        }));
        // Fshij formën e klientit të ri
        setNewCustomerData({
          name: '',
          email: '',
          phone: '',
          address: ''
        });
        setShowNewCustomerForm(false);
      }
    } catch (err) {
      console.error('Error creating customer:', err);
      alert('Gabim në krijimin e klientit');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Klienti</label>
          <div className="space-y-2">
            <select
              name="customer_id"
              value={formData.customer_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Zgjidh Klientin</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>{customer.name}</option>
              ))}
            </select>
            
            <button
              type="button"
              onClick={() => setShowNewCustomerForm(!showNewCustomerForm)}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              {showNewCustomerForm ? 'Anulo' : '+ Shto Klient të Ri'}
            </button>
          </div>
          
          {showNewCustomerForm && (
            <div className="mt-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Klient i Ri</h4>
              <div className="space-y-2">
                <input
                  type="text"
                  name="name"
                  placeholder="Emri i plotë"
                  value={newCustomerData.name}
                  onChange={handleNewCustomerChange}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={newCustomerData.email}
                  onChange={handleNewCustomerChange}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Telefoni (opsionale)"
                  value={newCustomerData.phone}
                  onChange={handleNewCustomerChange}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  name="address"
                  placeholder="Adresa (opsionale)"
                  value={newCustomerData.address}
                  onChange={handleNewCustomerChange}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleCreateNewCustomer}
                  className="w-full px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Krijo Klient
                </button>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Porosia e Lidhur (Opsionale)</label>
          <select
            name="order_id"
            value={formData.order_id}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Zgjidh Porosinë</option>
            {orders.map(order => (
              <option key={order.id} value={order.id}>{order.id} - {order.customer_name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Përshkrimi i Problemit</label>
        <textarea
          name="problem_description"
          value={formData.problem_description}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kategoria</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Zgjidh Kategorinë</option>
            <option value="Repair">Riparim</option>
            <option value="Replacement">Zëvendësim</option>
            <option value="Quality Issue">Problemi i Cilësisë</option>
            <option value="Installation">Instalim</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cakto Për</label>
          <select
            name="assigned_to"
            value={formData.assigned_to}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Zgjidh Teknici</option>
            <option value="admin">Admin</option>
            <option value="technician">Teknik</option>
            <option value="support">Mbështetje</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Pika e Pranimit</label>
        <input
          type="text"
          name="reception_point"
          value={formData.reception_point}
          onChange={handleChange}
          placeholder="Pika e Pranimit"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center">
          <input
            type="checkbox"
            name="under_warranty"
            checked={formData.under_warranty}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-900">Produkti në garanci</label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            name="email_notifications_sent"
            checked={formData.email_notifications_sent}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-900">Dërgo notifikime në email</label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Shtesa (Opsionale)</label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Kliko për të ngarkuar skedarë apo ngjitni dhe lëshoni</p>
          <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF deri në 10MB</p>
          <input
            type="file"
            multiple
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => console.log('Files selected:', e.target.files)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Anulo
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Duke ruajtur...' : (service ? 'Përditëso Shërbim' : 'Krijo Shërbim')}
        </button>
      </div>
    </form>
  );
};

export default ServiceForm;