import React, { useState } from 'react';
import { Save, AlertCircle, ChevronDown } from 'lucide-react';
import { apiCall, getCurrentUser } from '../../config/api';
import Notification from '../Common/Notification';
import UserDropdown from '../Common/UserDropdown';

interface TicketFormProps {
  onClose: () => void;
  onSuccess: () => void;
  ticket?: any; // For editing existing ticket
}

const TicketForm: React.FC<TicketFormProps> = ({ onClose, onSuccess, ticket }) => {
  const currentUser = getCurrentUser();
  const [formData, setFormData] = useState({
    title: ticket?.title || '',
    source: ticket?.source || 'Email',
    createdBy: ticket?.createdBy || ticket?.created_by || currentUser?.name || currentUser?.email || '',
    priority: ticket?.priority || 'medium',
    status: ticket?.status || 'open',
    description: ticket?.description || '',
    assignedToId: ticket?.assignedTo?.id || ticket?.assignedToId || '',
    assignedToName: ticket?.assignedTo?.name || ticket?.assignedTo || ticket?.assigned_to || ''
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
      const endpoint = ticket ? `/api/tickets/${ticket.id}` : '/api/tickets';
      const method = ticket ? 'PUT' : 'POST';

      // Transform data for backend
      const ticketData = {
        ...formData,
        assignedTo: formData.assignedToName, // Send name to backend
        assigned_to: formData.assignedToName // Alternative field name
      };
      
      // Remove frontend-only fields
      delete ticketData.assignedToId;
      delete ticketData.assignedToName;

      await apiCall(endpoint, {
        method,
        body: JSON.stringify(ticketData)
      });

      onSuccess();
      setNotification({
        type: 'success',
        message: ticket ? 'Tiketa u përditësua me sukses' : 'Tiketa u shtua me sukses',
        isVisible: true
      });
      onClose(); // Close modal immediately
    } catch (err) {
      console.error('Error saving ticket:', err);
      setNotification({
        type: 'error',
        message: 'Gabim në ruajtjen e tiketës',
        isVisible: true
      });
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

  const handleAssignedToChange = (userId: string, userName: string) => {
    setFormData(prev => ({
      ...prev,
      assignedToId: userId,
      assignedToName: userName
    }));
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titulli *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm font-medium text-gray-700 appearance-none cursor-pointer hover:border-gray-400 transition-colors"
                placeholder="Shkruani titullin e tiketës"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Burimi *
              </label>
              <select
                name="source"
                value={formData.source}
                onChange={handleChange}
                required
                className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm font-medium text-gray-700 appearance-none cursor-pointer hover:border-gray-400 transition-colors"
              >
                <option value="Email">Email</option>
                <option value="Phone">Telefon</option>
                <option value="Website">Website</option>
                <option value="Social Media">Social Media</option>
                <option value="In Person">Në Person</option>
                <option value="Internal">I Brendshëm</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Krijuar nga *
              </label>
              <input
                type="text"
                name="createdBy"
                value={formData.createdBy}
                onChange={handleChange}
                required
                className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm font-medium text-gray-700 appearance-none cursor-pointer hover:border-gray-400 transition-colors"
                placeholder="Emri i përdoruesit që krijoi"
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioriteti
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm font-medium text-gray-700 appearance-none cursor-pointer hover:border-gray-400 transition-colors"
              >
                <option value="low">I Ulët</option>
                <option value="medium">Mesatar</option>
                <option value="high">I Lartë</option>
                <option value="urgent">Urgjent</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statusi
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm font-medium text-gray-700 appearance-none cursor-pointer hover:border-gray-400 transition-colors"
              >
                <option value="open">Hapur</option>
                <option value="in-progress">Në Progres</option>
                <option value="waiting-customer">Duke Pritur Klientin</option>
                <option value="resolved">Zgjidhur</option>
                <option value="closed">Mbyllur</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Caktuar për
              </label>
              <UserDropdown
                value={formData.assignedToId}
                onChange={handleAssignedToChange}
                placeholder="Zgjidhni përdoruesin"
                required
                excludeCurrentUser={true}
              />
            </div>


            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Përshkrimi *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm font-medium text-gray-700 appearance-none cursor-pointer hover:border-gray-400 transition-colors"
                placeholder="Përshkruani problemin ose kërkesën..."
              />
            </div>
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
              {ticket ? 'Përditëso' : 'Krijo'}
            </button>
          </div>
        </form>

      {/* Notification */}
      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={() => setNotification(prev => ({ ...prev, isVisible: false }))}
      />
    </>
  );
};

export default TicketForm;
