import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, ChevronDown } from 'lucide-react';
import { apiCall, getCurrentUser, apiConfig } from '../../config/api';
import Notification from '../Common/Notification';
import UserDropdown from '../Common/UserDropdown';

interface TaskFormProps {
  onClose: () => void;
  onSuccess: () => void;
  task?: any; // For editing existing task
}

const TaskForm: React.FC<TaskFormProps> = ({ onClose, onSuccess, task }) => {
  const currentUser = getCurrentUser();
  
  const [formData, setFormData] = useState({
    title: task?.title || '',
    assignedToId: '', // Will be set when users are loaded
    assignedToName: task?.assignedTo?.name || task?.assignedTo || task?.assigned_to || '',
    assignedBy: task?.assignedBy || task?.assigned_by || currentUser?.name || currentUser?.email || '',
    priority: task?.priority || 'medium',
    status: task?.status || 'todo',
    description: task?.description || ''
  });
  
  console.log('TaskForm initialized with task:', task);
  console.log('Initial formData:', formData);
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

  // Load users and find the correct assignedToId when editing
  useEffect(() => {
    const loadUsersAndSetAssignedTo = async () => {
      if (task?.assignedTo || task?.assigned_to) {
        try {
          console.log('Loading users for task:', task);
          const response = await apiCall(apiConfig.endpoints.users);
          const usersData = response.data || [];
          console.log('Users data:', usersData);
          
          // Find the user by name
          const assignedUser = usersData.find((user: any) => 
            user.name === (task.assignedTo || task.assigned_to) || 
            user.email === (task.assignedTo || task.assigned_to) ||
            user.id === (task.assignedTo || task.assigned_to)
          );
          
          console.log('Found assigned user:', assignedUser);
          
          if (assignedUser) {
            setFormData(prev => ({
              ...prev,
              assignedToId: assignedUser.id,
              assignedToName: assignedUser.name
            }));
          }
        } catch (error) {
          console.error('Error loading users:', error);
        }
      }
    };

    loadUsersAndSetAssignedTo();
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = task ? `/api/tasks/${task.id}` : '/api/tasks';
      const method = task ? 'PUT' : 'POST';

      // Transform data for backend
      const taskData = {
        ...formData,
        assignedToName: formData.assignedToName,
        assignedToId: formData.assignedToId
      };

      await apiCall(endpoint, {
        method,
        body: JSON.stringify(taskData)
      });

      setNotification({
        type: 'success',
        message: task ? 'Tasku u përditësua me sukses' : 'Tasku u shtua me sukses',
        isVisible: true
      });
      
      // Call onSuccess after a short delay to show the notification
      setTimeout(() => {
        onSuccess?.();
      }, 1000);
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

  const handleAssignedToChange = (userId: string, userName: string) => {
    setFormData(prev => ({
      ...prev,
      assignedToId: userId,
      assignedToName: userName
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            {task ? 'Modifiko Taskun' : 'Task i Ri'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Titulli */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titulli *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Shkruani titullin e taskut"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Caktuar për */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Caktuar për *</label>
        <UserDropdown
          value={formData.assignedToId}
          onChange={handleAssignedToChange}
          placeholder="Zgjidhni përdoruesin"
          required
          excludeCurrentUser={true}
        />
            </div>

            {/* Caktuar nga */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Caktuar nga *</label>
              <input
                type="text"
                name="assignedBy"
                value={formData.assignedBy}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Emri i përdoruesit që caktoi"
                required
              />
            </div>


            {/* Prioriteti */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioriteti *</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm appearance-none cursor-pointer"
                required
              >
                <option value="low">I Ulët</option>
                <option value="medium">Mesatar</option>
                <option value="high">I Lartë</option>
                <option value="urgent">Urgjent</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Statusi */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Statusi *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm appearance-none cursor-pointer"
                required
              >
                <option value="todo">Për të bërë</option>
                <option value="in-progress">Në Progres</option>
                <option value="review">Rishikim</option>
                <option value="done">Përfunduar</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

          </div>

          {/* Përshkrimi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Përshkrimi *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
              placeholder="Përshkruani detajet e taskut..."
              required
            />
          </div>

          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
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
              {task ? 'Përditëso' : 'Krijo'}
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

export default TaskForm;
