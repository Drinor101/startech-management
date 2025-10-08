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

      setNotification({
        type: 'success',
        message: ticket ? 'Tiketa u përditësua me sukses' : 'Tiketa u shtua me sukses',
        isVisible: true
      });
      
      // Call onSuccess after a short delay to show the notification
      setTimeout(() => {
        onSuccess?.();
      }, 1000);
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
      <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titulli *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Shkruani titullin e tiketës"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Burimi *
              </label>
              <div className="relative">
                <select
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  required
                  className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm appearance-none cursor-pointer"
                >
                  <option value="Email">Email</option>
                  <option value="Phone">Telefon</option>
                  <option value="Website">Website</option>
                  <option value="Social Media">Social Media</option>
                  <option value="In Person">Në Person</option>
                  <option value="Internal">I Brendshëm</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Krijuar nga *
              </label>
              <input
                type="text"
                name="createdBy"
                value={formData.createdBy}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Emri i përdoruesit që krijoi"
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prioriteti
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm appearance-none cursor-pointer"
              >
                <option value="low">I Ulët</option>
                <option value="medium">Mesatar</option>
                <option value="high">I Lartë</option>
                <option value="urgent">Urgjent</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statusi
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm appearance-none cursor-pointer"
              >
                <option value="open">Hapur</option>
                <option value="in-progress">Në Progres</option>
                <option value="waiting-customer">Duke Pritur Klientin</option>
                <option value="resolved">Zgjidhur</option>
                <option value="closed">Mbyllur</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Përshkrimi *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                placeholder="Përshkruani problemin ose kërkesën..."
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Anulo
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
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
