import React, { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { apiCall } from '../../config/api';
import Notification from '../Common/Notification';

interface ServiceFormProps {
  onClose: () => void;
  onSuccess: () => void;
  service?: any; // For editing existing service
}

const ServiceForm: React.FC<ServiceFormProps> = ({ onClose, onSuccess, service }) => {
  const [formData, setFormData] = useState({
    createdBy: service?.createdBy || '',
    assignedTo: service?.assignedTo || '',
    customer: service?.customer?.name || service?.customer || '',
    problem: service?.problemDescription || service?.problem || '',
    status: service?.status || 'received',
    warranty: service?.warrantyInfo || service?.warranty || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    isVisible: boolean;
  }>({
    type: 'success',
    message: '',
    isVisible: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = service ? `/api/services/${service.id}` : '/api/services';
      const method = service ? 'PUT' : 'POST';

      await apiCall(endpoint, {
        method,
        body: JSON.stringify(formData)
      });

      onSuccess();
      setNotification({
        type: 'success',
        message: service ? 'Shërbimi u përditësua me sukses' : 'Shërbimi u shtua me sukses',
        isVisible: true
      });
      onClose(); // Close modal immediately
    } catch (err) {
      console.error('Error saving service:', err);
      setError('Gabim në ruajtjen e shërbimit');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {service ? 'Modifiko Shërbimin' : 'Shërbim i Ri'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Krijuar nga */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Krijuar nga *</label>
            <input
              type="text"
              name="createdBy"
              value={formData.createdBy}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Emri i përdoruesit që krijoi"
              required
            />
          </div>

          {/* Përcaktuar për */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Përcaktuar për *</label>
            <input
              type="text"
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Emri i përdoruesit që do të merret me shërbimin"
              required
            />
          </div>

          {/* Klienti */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Klienti *</label>
            <input
              type="text"
              name="customer"
              value={formData.customer}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Emri i klientit"
              required
            />
          </div>

          {/* Problemi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Problemi *</label>
            <textarea
              name="problem"
              value={formData.problem}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Përshkruani problemin ose kërkesën..."
              required
            />
          </div>

          {/* Statusi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Statusi *</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="received">Marrë</option>
              <option value="in-progress">Në Progres</option>
              <option value="waiting-parts">Duke Pritur Pjesët</option>
              <option value="completed">Përfunduar</option>
              <option value="delivered">Dërguar</option>
            </select>
          </div>

          {/* Garancioni */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Garancioni</label>
            <input
              type="text"
              name="warranty"
              value={formData.warranty}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Informacione për garancinë"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Anulo
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {service ? 'Përditëso' : 'Krijo'}
            </button>
          </div>
        </form>
      </div>

      {/* Notification */}
      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={() => setNotification(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
};

export default ServiceForm;