import React, { useState, useEffect } from 'react';
import { Upload, X } from 'lucide-react';
import { apiCall, apiConfig } from '../../config/api';

interface TaskFormProps {
  onClose: () => void;
  onSuccess?: () => void;
  task?: any; // For editing existing task
}

const TaskForm: React.FC<TaskFormProps> = ({ onClose, onSuccess, task }) => {
  const [formData, setFormData] = useState({
    type: task?.type || 'task' as 'task' | 'ticket',
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    assigned_to: task?.assigned_to || '',
    category: task?.category || '',
    customer_id: task?.customer_id || '',
    related_order_id: task?.related_order_id || '',
    source: task?.source || '',
    department: task?.department || '',
    due_date: task?.due_date || '' // Temporarily disabled until database is updated
  });

  const [customers, setCustomers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

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
      // Remove due_date from formData until database is updated
      const { due_date, ...taskData } = formData;
      
      if (task) {
        // Update existing task
        await apiCall(`${apiConfig.endpoints.tasks}/${task.id}`, {
          method: 'PUT',
          body: JSON.stringify(taskData)
        });
      } else {
        // Create new task
        await apiCall(apiConfig.endpoints.tasks, {
          method: 'POST',
          body: JSON.stringify(taskData)
        });
      }
      
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : task ? 'Gabim në përditësimin e taskut' : 'Gabim në krijimin e taskut');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipi</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="task">Task</option>
            <option value="ticket">Tiket</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prioriteti</label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="low">Ulët</option>
            <option value="medium">Mesatar</option>
            <option value="high">Lartë</option>
            <option value="urgent">Urgjent</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {formData.type === 'task' ? 'Titulli i Taskut' : 'Titulli i Kërkesës'}
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Përshkrimi</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cakto Për</label>
          <select
            name="assigned_to"
            value={formData.assigned_to}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Zgjidh Përdoruesin</option>
            <option value="admin">Admin</option>
            <option value="technician">Teknik</option>
            <option value="support">Mbështetje</option>
          </select>
        </div>

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
            <option value="System Maintenance">Mirëmbajtja e Sistemit</option>
            <option value="Customer Service">Shërbimi i Klientit</option>
            <option value="Development">Zhvillimi</option>
            <option value="Design">Dizajni</option>
            <option value="Marketing">Marketingu</option>
            <option value="Support">Mbështetja</option>
          </select>
        </div>
      </div>

      {formData.type === 'ticket' && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Klienti (Opsionale)</label>
              <select
                name="customer_id"
                value={formData.customer_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Zgjidh Klientin</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>{customer.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Porosia e Lidhur (Opsionale)</label>
              <select
                name="related_order_id"
                value={formData.related_order_id}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Burimi</label>
            <select
              name="source"
              value={formData.source}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Zgjidh Burimin</option>
              <option value="Email">Email</option>
              <option value="Phone">Telefon</option>
              <option value="Website">Website</option>
              <option value="Social Media">Rrjetet Sociale</option>
              <option value="In Person">Personalisht</option>
            </select>
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Departamenti</label>
          <select
            name="department"
            value={formData.department}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Zgjidh Departamentin</option>
            <option value="IT">IT</option>
            <option value="Marketing">Marketing</option>
            <option value="Sales">Shitje</option>
            <option value="Support">Mbështetje</option>
          </select>
        </div>

        {/* Temporarily disabled until database is updated
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data e Afatit</label>
          <input
            type="date"
            name="due_date"
            value={formData.due_date}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        */}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Shtesa</label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Kliko për të ngarkuar skedarë apo ngjitni dhe lëshoni</p>
          <p className="text-xs text-gray-500 mt-1">Imazhe, dokumente deri në 10MB secili</p>
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="mt-2 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
          >
            Zgjidh Skedarët
          </label>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Skedarët e Zgjedhur</label>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
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
          {loading ? 'Duke ruajtur...' : (task ? (formData.type === 'task' ? 'Përditëso Task' : 'Përditëso Tiket') : (formData.type === 'task' ? 'Krijo Task' : 'Krijo Tiket'))}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;