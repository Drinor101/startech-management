import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  Grid3X3,
  List,
  Calendar,
  Filter,
  ChevronDown
} from 'lucide-react';
import { Ticket, ViewMode } from '../../types';
import { apiCall, apiConfig } from '../../config/api';
import TicketForm from './TicketForm';
import Modal from '../Common/Modal';
import KanbanBoard from '../Common/KanbanBoard';
import CalendarView from '../Common/CalendarView';
import Notification from '../Common/Notification';
import ConfirmationModal from '../Common/ConfirmationModal';
import { usePermissions } from '../../hooks/usePermissions';

const TicketsList: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { canDelete } = usePermissions();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
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
    ticket: Ticket | null;
  }>({
    isOpen: false,
    ticket: null
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall(apiConfig.endpoints.tickets);
      console.log('Tickets API response:', response);
      
      const data = response.success ? response.data : [];
      setTickets(data || []);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Gabim në ngarkimin e tiketave');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'in-progress':
        return <Play className="h-4 w-4 text-yellow-500" />;
      case 'waiting-customer':
        return <Pause className="h-4 w-4 text-orange-500" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'closed':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'waiting-customer':
        return 'bg-orange-100 text-orange-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    
    return matchesStatus && matchesPriority;
  });

  const getStatusText = (status: string) => {
    const statusMap = {
      'open': 'Hapur',
      'in-progress': 'Në progres',
      'waiting-customer': 'Në pritje të klientit',
      'resolved': 'Zgjidhur',
      'closed': 'Mbyllur'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getPriorityText = (priority: string) => {
    const priorityMap = {
      'urgent': 'Urgjent',
      'high': 'I lartë',
      'medium': 'Mesatar',
      'low': 'I ulët'
    };
    return priorityMap[priority as keyof typeof priorityMap] || priority;
  };

  const getSourceText = (source: string) => {
    const sourceMap = {
      'Email': 'Email',
      'Phone': 'Telefon',
      'Website': 'Website',
      'Social Media': 'Rrjetet Sociale',
      'In Person': 'Në person',
      'Internal': 'I brendshëm'
    };
    return sourceMap[source as keyof typeof sourceMap] || source;
  };

  const handleViewTicket = (ticket: Ticket) => {
    console.log('Selected ticket data:', ticket);
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  const handleEditTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  // Kanban columns for tickets
  const getKanbanColumns = () => {
    const columns = [
      {
        id: 'open',
        title: 'Hapur',
        items: filteredTickets.filter(ticket => ticket.status === 'open'),
        color: 'bg-blue-500'
      },
      {
        id: 'in-progress',
        title: 'Në progres',
        items: filteredTickets.filter(ticket => ticket.status === 'in-progress'),
        color: 'bg-yellow-500'
      },
      {
        id: 'waiting-customer',
        title: 'Në pritje të klientit',
        items: filteredTickets.filter(ticket => ticket.status === 'waiting-customer'),
        color: 'bg-orange-500'
      },
      {
        id: 'resolved',
        title: 'Zgjidhur',
        items: filteredTickets.filter(ticket => ticket.status === 'resolved'),
        color: 'bg-green-500'
      },
      {
        id: 'closed',
        title: 'Mbyllur',
        items: filteredTickets.filter(ticket => ticket.status === 'closed'),
        color: 'bg-gray-500'
      }
    ];
    return columns;
  };

  // Render ticket card for kanban
  const renderTicketCard = (ticket: Ticket) => (
    <div className="space-y-2">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 truncate">{ticket.title}</h4>
          <p className="text-xs text-gray-500 mt-1">{ticket.id}</p>
        </div>
        <div className="flex items-center gap-1">
          <AlertCircle className="w-3 h-3 text-gray-400" />
          <span className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
            {getPriorityText(ticket.priority)}
          </span>
        </div>
      </div>
      
      {ticket.description && (
        <p className="text-xs text-gray-600 line-clamp-2">{ticket.description}</p>
      )}
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{ticket.createdBy || 'N/A'}</span>
        <span>{new Date(ticket.createdAt).toLocaleDateString('sq-AL')}</span>
      </div>
      
      <div className="flex items-center gap-2 pt-2">
        <button
          onClick={() => handleViewTicket(ticket)}
          className="text-blue-600 hover:text-blue-900 p-1"
          title="Shih"
        >
          <Eye className="w-3 h-3" />
        </button>
        <button
          onClick={() => handleEditTicket(ticket)}
          className="text-green-600 hover:text-green-900 p-1"
          title="Modifiko"
        >
          <Edit className="w-3 h-3" />
        </button>
        {canDelete('tickets') && (
          <button
            onClick={() => handleDeleteTicket(ticket)}
            className="text-red-600 hover:text-red-900 p-1"
            title="Fshij"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );

  const handleDeleteTicket = (ticket: Ticket) => {
    setConfirmationModal({
      isOpen: true,
      ticket: ticket
    });
  };

  const confirmDeleteTicket = async () => {
    if (!confirmationModal.ticket) return;
    
    try {
      await apiCall(`${apiConfig.endpoints.tickets}/${confirmationModal.ticket.id}`, {
        method: 'DELETE'
      });
      
      // Refresh the tickets list
      await fetchTickets();
      setNotification({
        type: 'success',
        message: 'Tiketa u fshi me sukses',
        isVisible: true
      });
    } catch (error) {
      console.error('Error deleting ticket:', error);
      setNotification({
        type: 'error',
        message: 'Gabim në fshirjen e tiketës',
        isVisible: true
      });
    } finally {
      setConfirmationModal({
        isOpen: false,
        ticket: null
      });
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      await apiCall(`${apiConfig.endpoints.tickets}/${ticketId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      fetchTickets(); // Refresh the list
    } catch (err) {
      console.error('Error updating ticket status:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-lg text-gray-600">Po ngarkohen tiketat...</span>
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
          <div className="flex bg-gray-100 rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                viewMode === 'list' 
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <List className="w-4 h-4" />
              Lista
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                viewMode === 'kanban' 
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                viewMode === 'calendar' 
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Kalendar
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm font-medium text-gray-700 appearance-none cursor-pointer hover:border-gray-400 transition-colors min-w-[180px]"
              >
                <option value="all">Të gjitha statuset</option>
                <option value="open">Hapur</option>
                <option value="in-progress">Në progres</option>
                <option value="waiting-customer">Në pritje të klientit</option>
                <option value="resolved">Zgjidhur</option>
                <option value="closed">Mbyllur</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <AlertCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm font-medium text-gray-700 appearance-none cursor-pointer hover:border-gray-400 transition-colors min-w-[180px]"
              >
                <option value="all">Të gjitha prioritetet</option>
                <option value="urgent">Urgjent</option>
                <option value="high">I lartë</option>
                <option value="medium">Mesatar</option>
                <option value="low">I ulët</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <button 
            onClick={() => {
              setSelectedTicket(null);
              setIsEditMode(false);
              setIsFormOpen(true);
            }}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md font-medium"
          >
            <Plus className="w-4 h-4" />
            Tiketë e Re
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Burimi
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Krijuar nga
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
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          Tiketë
                        </span>
                        <span className="text-sm font-medium text-gray-900">{ticket.id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{ticket.title}</div>
                      {ticket.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {ticket.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{getSourceText(ticket.source)}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{ticket.createdBy || 'N/A'}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <AlertCircle className="w-4 h-4 text-gray-400" />
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                          {getPriorityText(ticket.priority)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(ticket.status)}
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                          {getStatusText(ticket.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {new Date(ticket.createdAt).toLocaleDateString('sq-AL')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewTicket(ticket)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Shih"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditTicket(ticket)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Modifiko"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
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
      ) : viewMode === 'kanban' ? (
        <KanbanBoard
          columns={getKanbanColumns()}
          renderCard={renderTicketCard}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <CalendarView
          items={filteredTickets.map(ticket => ({
            id: ticket.id,
            title: ticket.title,
            status: ticket.status,
            priority: ticket.priority,
            type: 'ticket' as const,
            assignedTo: ticket.assignedTo || ticket.assigned_to,
            createdAt: ticket.createdAt,
            dueDate: ticket.dueDate,
            completedAt: ticket.resolvedAt
          }))}
          onItemClick={handleViewTicket}
          onStatusChange={handleStatusChange}
          type="tickets"
        />
      )}

      {/* Ticket Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Detajet e Tiketës"
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
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  Tiketë
                </span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedTicket.priority)}`}>
                  {getPriorityText(selectedTicket.priority)}
                </span>
              </div>
            </div>

            {selectedTicket.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Përshkrimi</label>
                <p className="text-sm text-gray-900">{selectedTicket.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statusi</label>
                <div className="flex items-center gap-2">
                  {getStatusIcon(selectedTicket.status)}
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTicket.status)}`}>
                    {getStatusText(selectedTicket.status)}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Burimi</label>
                <p className="text-sm text-gray-900">{getSourceText(selectedTicket.source)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Krijuar nga</label>
                <p className="text-sm text-gray-900">{selectedTicket.createdBy || selectedTicket.created_by || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Caktuar për</label>
                <p className="text-sm text-gray-900">{selectedTicket.assignedTo || selectedTicket.assigned_to || 'N/A'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Krijuar më</label>
                <p className="text-sm text-gray-900">{new Date(selectedTicket.createdAt).toLocaleString('sq-AL')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Përditësuar më</label>
                <p className="text-sm text-gray-900">{new Date(selectedTicket.updatedAt).toLocaleString('sq-AL')}</p>
              </div>
            </div>

            {selectedTicket.resolvedAt && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zgjidhur më</label>
                <p className="text-sm text-gray-900">{new Date(selectedTicket.resolvedAt).toLocaleString('sq-AL')}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Ticket Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setIsEditMode(false);
          setSelectedTicket(null);
        }}
        title={isEditMode ? "Modifiko Tiketën" : "Tiketë e Re"}
        size="lg"
      >
        <TicketForm 
          ticket={isEditMode ? selectedTicket : undefined}
          onClose={() => {
            setIsFormOpen(false);
            setIsEditMode(false);
            setSelectedTicket(null);
          }}
          onSuccess={() => {
            setIsFormOpen(false);
            setIsEditMode(false);
            setSelectedTicket(null);
            fetchTickets();
          }}
        />
      </Modal>

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
        onClose={() => setConfirmationModal({ isOpen: false, ticket: null })}
        onConfirm={confirmDeleteTicket}
        title="Konfirmo Fshirjen"
        message={`A jeni të sigurt që doni të fshini tiketën "${confirmationModal.ticket?.id}"?`}
        confirmText="Po, fshij"
        cancelText="Anulo"
      />
    </div>
  );
};

export default TicketsList;
