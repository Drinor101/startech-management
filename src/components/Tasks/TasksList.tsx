import React, { useState, useEffect } from 'react';
import { Grid3X3, List, Plus, Eye, Edit, Trash2, AlertCircle, Clock, User, Calendar, Filter, ChevronDown } from 'lucide-react';
import { Task, ViewMode } from '../../types';
import { apiCall, apiConfig } from '../../config/api';
import KanbanBoard from '../Common/KanbanBoard';
import CalendarView from '../Common/CalendarView';
import Modal from '../Common/Modal';
import TaskForm from './TaskForm';
import { usePermissions } from '../../hooks/usePermissions';
import Notification from '../Common/Notification';
import ConfirmationModal from '../Common/ConfirmationModal';

const TasksList: React.FC = () => {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { canCreate, canEdit, canDelete } = usePermissions();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    isVisible: boolean;
  }>({
    type: 'success',
    message: '',
    isVisible: false
  });
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    task: Task | null;
  }>({
    isOpen: false,
    task: null
  });
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Fetch tasks from API
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall(apiConfig.endpoints.tasks);
      setAllTasks(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gabim në marrjen e taskave');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Filter only tasks (not tickets)
  const tasks = allTasks.filter(task => task.type === 'task');
  
  // Apply department filter
  const filteredTasks = departmentFilter === 'all' 
    ? tasks 
    : tasks.filter(task => task.department === departmentFilter);
  
  // Get unique departments for filter dropdown
  const departments = ['all', ...Array.from(new Set(tasks.map(task => task.department)))];

  const getPriorityColor = (priority: string) => {
    const colors = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-orange-100 text-orange-800',
      'urgent': 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'todo': 'bg-gray-100 text-gray-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'review': 'bg-purple-100 text-purple-800',
      'done': 'bg-green-100 text-green-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Function to translate status values to Albanian
  const translateStatus = (status: string) => {
    const translations: { [key: string]: string } = {
      'todo': 'Për të bërë',
      'in-progress': 'Në Progres',
      'review': 'Rishikim',
      'done': 'Përfunduar',
      'received': 'Marrë'
    };
    return translations[status] || status;
  };

  // Function to translate priority values to Albanian
  const translatePriority = (priority: string) => {
    const translations: { [key: string]: string } = {
      'low': 'Ulët',
      'medium': 'Mesatar',
      'high': 'I Lartë',
      'urgent': 'Urgjent'
    };
    return translations[priority] || priority;
  };

  const formatCompletionTime = (completedAt: string) => {
    const date = new Date(completedAt);
    return date.toLocaleDateString('sq-AL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewTask = (task: Task) => {
    console.log('Selected task data:', task);
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  const handleDeleteTask = (task: Task) => {
    setConfirmationModal({
      isOpen: true,
      task: task
    });
  };


  const confirmDeleteTask = async () => {
    if (!confirmationModal.task) return;
    
    try {
      await apiCall(`${apiConfig.endpoints.tasks}/${confirmationModal.task.id}`, {
        method: 'DELETE'
      });
      
      // Refresh the tasks list
      await fetchTasks();
      setNotification({
        type: 'success',
        message: 'Tasku u fshi me sukses',
        isVisible: true
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      setNotification({
        type: 'error',
        message: 'Gabim në fshirjen e taskut',
        isVisible: true
      });
    } finally {
      setConfirmationModal({
        isOpen: false,
        task: null
      });
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await apiCall(`${apiConfig.endpoints.tasks}/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      
      // Refresh the tasks list
      fetchTasks();
    } catch (err) {
      console.error('Error updating task status:', err);
      alert('Gabim në përditësimin e statusit');
    }
  };

  // Kanban columns
  const kanbanColumns = [
    {
      id: 'todo',
      title: 'Për të bërë',
      items: filteredTasks.filter(task => task.status === 'todo'),
      color: 'bg-gray-400'
    },
    {
      id: 'in-progress',
      title: 'Në Progres',
      items: filteredTasks.filter(task => task.status === 'in-progress'),
      color: 'bg-blue-400'
    },
    {
      id: 'review',
      title: 'Rishikim',
      items: filteredTasks.filter(task => task.status === 'review'),
      color: 'bg-purple-400'
    },
    {
      id: 'done',
      title: 'Përfunduar',
      items: filteredTasks.filter(task => task.status === 'done'),
      color: 'bg-green-400'
    }
  ];

  const renderTaskCard = (task: Task) => (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
          {translatePriority(task.priority)}
        </span>
      </div>
      
      {task.description && (
        <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
      )}
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <User className="w-3 h-3" />
          <span>{task.assignedTo}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{new Date(task.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="inline-flex px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
          Task
        </span>
        {task.status === 'done' && task.completedAt && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>Përfunduar: {formatCompletionTime(task.completedAt)}</span>
          </div>
        )}
        <button
          onClick={() => handleViewTask(task)}
          className="ml-auto p-1 hover:bg-gray-100 rounded"
        >
          <Eye className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Duke ngarkuar taskat...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Gabim në ngarkimin e taskave</h3>
              <p className="text-sm text-red-600 mt-1">{error}</p>
              <button
                onClick={fetchTasks}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Provo përsëri
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Taskat ({tasks.length})</h2>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
              Lista
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Kalendar
            </button>
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm font-medium text-gray-700 appearance-none cursor-pointer hover:border-gray-400 transition-colors min-w-[180px]"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === 'all' ? 'Të gjitha departamentet' : dept}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <button 
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md font-medium"
          >
            <Plus className="w-4 h-4" />
            Task i Ri
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                    Titulli
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Caktuar për
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Caktuar nga
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Departamenti
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Prioriteti
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Statusi
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Data
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Veprimet
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          Task
                        </span>
                        <span className="text-sm font-medium text-gray-900">{task.id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{task.title}</div>
                      {task.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {task.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {task.assignedTo || task.assigned_to || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{task.assignedBy || 'N/A'}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{task.department}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <AlertCircle className="w-4 h-4 text-gray-400" />
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                          {translatePriority(task.priority)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span 
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}
                          title={task.status === 'done' && task.completedAt ? `Përfunduar më: ${formatCompletionTime(task.completedAt)}` : undefined}
                        >
                          {translateStatus(task.status)}
                        </span>
                        {task.status === 'done' && task.completedAt && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>{formatCompletionTime(task.completedAt)}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {new Date(task.createdAt).toLocaleDateString('sq-AL')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewTask(task)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Shih"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEditTask(task)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Modifiko"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {canDelete('tasks') && (
                          <button
                            onClick={() => handleDeleteTask(task)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Fshij"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === 'kanban' ? (
        <KanbanBoard
          columns={kanbanColumns}
          renderCard={renderTaskCard}
          onAddItem={(columnId) => console.log('Add item to', columnId)}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <CalendarView
          items={filteredTasks.map(task => ({
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            type: 'task' as const,
            assignedTo: task.assignedTo,
            assignedBy: task.assignedBy,
            createdBy: task.createdBy,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
            dueDate: task.dueDate,
            completedAt: task.completedAt
          }))}
          onItemClick={handleViewTask}
          onStatusChange={handleStatusChange}
          type="tasks"
        />
      )}

      {/* Task Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Detajet e Taskut"
        size="lg"
      >
        {selectedTask && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{selectedTask.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{selectedTask.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  Task
                </span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedTask.priority)}`}>
                  {translatePriority(selectedTask.priority)}
                </span>
              </div>
            </div>

            {selectedTask.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Përshkrimi</label>
                <p className="text-sm text-gray-900">{selectedTask.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statusi</label>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTask.status)}`}>
                    {translateStatus(selectedTask.status)}
                  </span>
                  {selectedTask.status === 'done' && selectedTask.completedAt && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>Përfunduar: {formatCompletionTime(selectedTask.completedAt)}</span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Departamenti</label>
                <p className="text-sm text-gray-900">{selectedTask.department}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Caktuar për</label>
                <p className="text-sm text-gray-900">{selectedTask.assignedTo || selectedTask.assigned_to || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Caktuar nga</label>
                <p className="text-sm text-gray-900">{selectedTask.assignedBy || selectedTask.assigned_by || 'N/A'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Krijuar më</label>
                <p className="text-sm text-gray-900">{new Date(selectedTask.createdAt).toLocaleString('sq-AL')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Përditësuar më</label>
                <p className="text-sm text-gray-900">{selectedTask.updatedAt ? new Date(selectedTask.updatedAt).toLocaleString('sq-AL') : 'N/A'}</p>
              </div>
            </div>

            {selectedTask.completedAt && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Përfunduar më</label>
                <p className="text-sm text-gray-900">{formatCompletionTime(selectedTask.completedAt)}</p>
              </div>
            )}

            {selectedTask.comments && selectedTask.comments.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Komentet</label>
                <div className="space-y-3">
                  {selectedTask.comments.map((comment) => (
                    <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{comment.userName}</span>
                        <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Task Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setIsEditMode(false);
          setSelectedTask(null);
        }}
        title={isEditMode ? "Modifiko Taskun" : "Task i Ri"}
        size="lg"
      >
        <TaskForm 
          task={isEditMode ? selectedTask : undefined}
          onClose={() => {
            setIsFormOpen(false);
            setIsEditMode(false);
            setSelectedTask(null);
          }}
          onSuccess={() => {
            setIsFormOpen(false);
            setIsEditMode(false);
            setSelectedTask(null);
            fetchTasks();
          }}
        />
      </Modal>

      {/* Task Form Modal */}
      {showForm && (
        <TaskForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            fetchTasks();
          }}
        />
      )}

      {/* Notification */}
      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={() => setNotification(prev => ({ ...prev, isVisible: false }))}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal({ isOpen: false, task: null })}
        onConfirm={confirmDeleteTask}
        title="Konfirmo Fshirjen"
        message={`A jeni të sigurt që doni të fshini taskun "${confirmationModal.task?.title}"?`}
        confirmText="Po, fshij"
        cancelText="Anulo"
      />
    </div>
  );
};

export default TasksList;