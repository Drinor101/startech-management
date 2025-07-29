import React, { useState } from 'react';
import { Grid3X3, List, Plus, Eye, Edit, AlertCircle, Clock, User } from 'lucide-react';
import { Task, ViewMode } from '../../types';
import { mockTasks } from '../../data/mockData';
import KanbanBoard from '../Common/KanbanBoard';
import Modal from '../Common/Modal';
import TaskForm from './TaskForm';

const TasksList: React.FC = () => {
  const [tasks] = useState<Task[]>(mockTasks);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

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

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  // Kanban columns
  const kanbanColumns = [
    {
      id: 'todo',
      title: 'To Do',
      items: tasks.filter(task => task.status === 'todo'),
      color: 'bg-gray-400'
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      items: tasks.filter(task => task.status === 'in-progress'),
      color: 'bg-blue-400'
    },
    {
      id: 'review',
      title: 'Review',
      items: tasks.filter(task => task.status === 'review'),
      color: 'bg-purple-400'
    },
    {
      id: 'done',
      title: 'Done',
      items: tasks.filter(task => task.status === 'done'),
      color: 'bg-green-400'
    }
  ];

  const renderTaskCard = (task: Task) => (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
          {task.priority}
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
        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${task.type === 'task' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
          {task.type}
        </span>
        <button
          onClick={() => handleViewTask(task)}
          className="ml-auto p-1 hover:bg-gray-100 rounded"
        >
          <Eye className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Tasks & Tickets</h2>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
              List
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
          </div>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type & Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          task.type === 'task' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {task.type}
                        </span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{task.title}</div>
                          <div className="text-sm text-gray-500">{task.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <AlertCircle className="w-4 h-4 text-gray-400" />
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                        {task.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{task.assignedTo}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{task.category}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {new Date(task.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewTask(task)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <KanbanBoard
          columns={kanbanColumns}
          renderCard={renderTaskCard}
          onAddItem={(columnId) => console.log('Add item to', columnId)}
        />
      )}

      {/* Task Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Task Details"
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
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  selectedTask.type === 'task' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                }`}>
                  {selectedTask.type}
                </span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedTask.priority)}`}>
                  {selectedTask.priority}
                </span>
              </div>
            </div>

            {selectedTask.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <p className="text-sm text-gray-900">{selectedTask.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTask.status)}`}>
                  {selectedTask.status.replace('-', ' ')}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <p className="text-sm text-gray-900">{selectedTask.category}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                <p className="text-sm text-gray-900">{selectedTask.assignedTo}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                <p className="text-sm text-gray-900">{new Date(selectedTask.createdAt).toLocaleString()}</p>
              </div>
            </div>

            {selectedTask.comments.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Comments</label>
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
        onClose={() => setIsFormOpen(false)}
        title="New Task"
        size="lg"
      >
        <TaskForm onClose={() => setIsFormOpen(false)} />
      </Modal>
    </div>
  );
};

export default TasksList;