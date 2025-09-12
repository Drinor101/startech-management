import React, { useState, useEffect } from 'react';
import { Grid3X3, List, Plus, Eye, Edit, Trash2, AlertCircle, Clock, User, MessageCircle } from 'lucide-react';
import { Task, ViewMode } from '../../types';
import { apiCall, apiConfig } from '../../config/api';
import KanbanBoard from '../Common/KanbanBoard';
import Modal from '../Common/Modal';
import TaskForm from './TaskForm';
import { usePermissions } from '../../hooks/usePermissions';

const TicketsList: React.FC = () => {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { canCreate, canEdit, canDelete } = usePermissions();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTicket, setSelectedTicket] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Fetch tasks from API
  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall(apiConfig.endpoints.tasks);
      setAllTasks(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gabim në marrjen e tiketave');
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Filter only tickets (not tasks)
  const tickets = allTasks.filter(task => task.type === 'ticket');

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
      'done': 'bg-green-100 text-green-800',
      'resolved': 'bg-green-100 text-green-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Function to translate status values to Albanian
  const translateStatus = (status: string) => {
    const translations: { [key: string]: string } = {
      'todo': 'Hapur',
      'in-progress': 'Në progres',
      'review': 'Në rishikim',
      'done': 'Zgjidhur',
      'resolved': 'Zgjidhur',
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

  const handleViewTicket = (ticket: Task) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  const handleEditTicket = (ticket: Task) => {
    setSelectedTicket(ticket);
    setIsFormOpen(true);
  };

  const handleDeleteTicket = async (ticket: Task) => {
    console.log('handleDeleteTicket called for ticket:', ticket.id);
    console.log('User permissions:', { canDelete: canDelete('tickets') });
    
    if (window.confirm(`A jeni të sigurt që doni të fshini tiketën "${ticket.title}"?`)) {
      try {
        console.log('Attempting to delete ticket:', ticket.id);
        const response = await apiCall(`${apiConfig.endpoints.tasks}/${ticket.id}`, {
          method: 'DELETE'
        });
        console.log('Delete response:', response);
        
        // Refresh the tickets list
        await fetchTickets();
        alert('Tiketa u fshi me sukses');
      } catch (error) {
        console.error('Error deleting ticket:', error);
        alert('Gabim në fshirjen e tiketës: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }
  };

  // Kanban columns for tickets
  const kanbanColumns = [
    {
      id: 'todo',
      title: 'Hapur',
      items: tickets.filter(ticket => ticket.status === 'todo'),
      color: 'bg-gray-400'
    },
    {
      id: 'in-progress',
      title: 'Në progres',
      items: tickets.filter(ticket => ticket.status === 'in-progress'),
      color: 'bg-blue-400'
    },
    {
      id: 'review',
      title: 'Në rishikim',
      items: tickets.filter(ticket => ticket.status === 'review'),
      color: 'bg-purple-400'
    },
    {
      id: 'resolved',
      title: 'Zgjidhur',
      items: tickets.filter(ticket => ticket.status === 'done'),
      color: 'bg-green-400'
    }
  ];

  const renderTicketCard = (ticket: Task) => (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <h4 className="font-medium text-gray-900 text-sm">{ticket.title}</h4>
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
          {translatePriority(ticket.priority)}
        </span>
      </div>
      
      {ticket.description && (
        <p className="text-sm text-gray-600 line-clamp-2">{ticket.description}</p>
      )}
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <User className="w-3 h-3" />
          <span>{ticket.assignedTo}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="inline-flex px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
          Tiket
        </span>
        {ticket.status === 'done' && ticket.completedAt && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>Zgjidhur: {new Date(ticket.completedAt).toLocaleDateString()}</span>
          </div>
        )}
        {ticket.source && (
          <span className="inline-flex px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
            {ticket.source}
          </span>
        )}
        <button
          onClick={() => handleViewTicket(ticket)}
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
          <span className="ml-2 text-gray-600">Duke ngarkuar tiketat...</span>
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
              <h3 className="text-sm font-medium text-red-800">Gabim në ngarkimin e tiketave</h3>
              <p className="text-sm text-red-600 mt-1">{error}</p>
              <button
                onClick={fetchTickets}
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
        <h2 className="text-2xl font-bold text-gray-900">Tiketat ({tickets.length})</h2>
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
          </div>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tiket i Ri
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
                    Titulli
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prioriteti
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statusi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Përshkrues
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Burimi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Krijuar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Veprimet
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                          Tiket
                        </span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{ticket.title}</div>
                          <div className="text-sm text-gray-500">{ticket.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <AlertCircle className="w-4 h-4 text-gray-400" />
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                          {translatePriority(ticket.priority)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                        {translateStatus(ticket.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{ticket.assignedTo}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{ticket.source || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewTicket(ticket)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Shih"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canEdit('tickets') && (
                          <button 
                            onClick={() => handleEditTicket(ticket)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Modifiko"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete('tickets') && (
                          <button
                            onClick={() => handleDeleteTicket(ticket)}
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
      ) : (
        <KanbanBoard
          columns={kanbanColumns}
          renderCard={renderTicketCard}
          onAddItem={(columnId) => console.log('Add item to', columnId)}
        />
      )}

      {/* Ticket Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Ticket Details"
        size="lg"
      >
        {selectedTicket && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{selectedTicket.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{selectedTicket.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                  Tiket
                </span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedTicket.priority)}`}>
                  {translatePriority(selectedTicket.priority)}
                </span>
              </div>
            </div>

            {selectedTicket.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <p className="text-sm text-gray-900">{selectedTicket.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTicket.status)}`}>
                  {translateStatus(selectedTicket.status)}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                <p className="text-sm text-gray-900">{selectedTicket.source || 'N/A'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                <p className="text-sm text-gray-900">{selectedTicket.assignedTo}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                <p className="text-sm text-gray-900">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
              </div>
            </div>

            {selectedTicket.customerId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer ID</label>
                <p className="text-sm text-gray-900">{selectedTicket.customerId}</p>
              </div>
            )}

            {selectedTicket.relatedOrderId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Related Order</label>
                <p className="text-sm text-gray-900">{selectedTicket.relatedOrderId}</p>
              </div>
            )}

            {selectedTicket.comments.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Comments</label>
                <div className="space-y-3">
                  {selectedTicket.comments.map((comment) => (
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

      {/* Ticket Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="New Ticket"
        size="lg"
      >
        <TaskForm 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={fetchTickets}
        />
      </Modal>
    </div>
  );
};

export default TicketsList; 