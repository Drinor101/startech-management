import React, { useState } from 'react';
import { X, Save, AlertCircle, ChevronDown } from 'lucide-react';
import { apiCall } from '../../config/api';

interface TaskFormProps {
  onClose: () => void;
  onSuccess: () => void;
  task?: any; // For editing existing task
}

const TaskForm: React.FC<TaskFormProps> = ({ onClose, onSuccess, task }) => {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    assignedTo: task?.assignedTo || '',
    assignedBy: task?.assignedBy || '',
    department: task?.department || '',
    priority: task?.priority || 'medium',
    status: task?.status || 'pending',
    description: task?.description || '',
    customerId: task?.customerId || '',
    relatedOrderId: task?.relatedOrderId || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = task ? `/api/tasks/${task.id}` : '/api/tasks';
      const method = task ? 'PUT' : 'POST';

      await apiCall(endpoint, {
        method,
        body: JSON.stringify(formData)
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving task:', err);
      setError('Gabim në ruajtjen e taskut');
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
            {task ? 'Modifiko Taskun' : 'Task i Ri'}
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

          {/* Titulli */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Titulli *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Shkruani titullin e taskut"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Caktuar për */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Caktuar për *</label>
              <input
                type="text"
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleChange}
                className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm font-medium text-gray-700 appearance-none cursor-pointer hover:border-gray-400 transition-colors"
                placeholder="Emri i përdoruesit"
                required
              />
            </div>

            {/* Caktuar nga */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Caktuar nga *</label>
              <input
                type="text"
                name="assignedBy"
                value={formData.assignedBy}
                onChange={handleChange}
                className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm font-medium text-gray-700 appearance-none cursor-pointer hover:border-gray-400 transition-colors"
                placeholder="Emri i përdoruesit që caktoi"
                required
              />
            </div>

            {/* Departamenti */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Departamenti *</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm font-medium text-gray-700 appearance-none cursor-pointer hover:border-gray-400 transition-colors"
                required
              >
                <option value="">Zgjidh Departamentin</option>
                <option value="IT">IT</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Shitje</option>
                <option value="Support">Mbështetje</option>
                <option value="Design">Dizajn</option>
                <option value="Management">Menaxhment</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Prioriteti */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Prioriteti *</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm font-medium text-gray-700 appearance-none cursor-pointer hover:border-gray-400 transition-colors"
                required
              >
                <option value="low">I Ulët</option>
                <option value="medium">Mesatar</option>
                <option value="high">I Lartë</option>
                <option value="urgent">Urgjent</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Statusi */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Statusi *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm font-medium text-gray-700 appearance-none cursor-pointer hover:border-gray-400 transition-colors"
                required
              >
                <option value="pending">Në Pritje</option>
                <option value="in-progress">Në Progres</option>
                <option value="completed">Përfunduar</option>
                <option value="cancelled">Anuluar</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* ID e Klientit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ID e Klientit</label>
              <input
                type="text"
                name="customerId"
                value={formData.customerId}
                onChange={handleChange}
                className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm font-medium text-gray-700 appearance-none cursor-pointer hover:border-gray-400 transition-colors"
                placeholder="ID e klientit (opsionale)"
              />
            </div>
          </div>

          {/* Përshkrimi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Përshkrimi *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Përshkruani detajet e taskut..."
              required
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
              {task ? 'Përditëso' : 'Krijo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;
