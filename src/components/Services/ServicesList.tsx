import React, { useState, useEffect } from 'react';
import { Grid3X3, List, Eye, Edit, Trash2, AlertCircle, Clock, User, QrCode, Mail, Calendar } from 'lucide-react';
import { Service, ViewMode } from '../../types';
import { apiCall, apiConfig } from '../../config/api';
import KanbanBoard from '../Common/KanbanBoard';
import CalendarView from '../Common/CalendarView';
import Modal from '../Common/Modal';
import ServiceForm from './ServiceForm';
import { usePermissions } from '../../hooks/usePermissions';
import Notification from '../Common/Notification';
import ConfirmationModal from '../Common/ConfirmationModal';

const ServicesList: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { canCreate, canEdit, canDelete } = usePermissions();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
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
    service: Service | null;
  }>({
    isOpen: false,
    service: null
  });

  // Fetch services from API
  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall(apiConfig.endpoints.services);
      setServices(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gabim në marrjen e shërbimeve');
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const getStatusColor = (status: string) => {
    const colors = {
      'received': 'bg-gray-100 text-gray-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'waiting-parts': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'delivered': 'bg-purple-100 text-purple-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Function to translate status values to Albanian
  const translateStatus = (status: string) => {
    const translations: { [key: string]: string } = {
      'received': 'Marrë',
      'in-progress': 'Në Progres',
      'waiting-parts': 'Duke Pritur Pjesët',
      'completed': 'Përfunduar',
      'delivered': 'Dërguar'
    };
    return translations[status] || status;
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

  const handleViewService = (service: Service | any) => {
    console.log('Selected service data:', service);
    
    // If it's from CalendarView, find the original service
    if (service.description && !service.problemDescription) {
      const originalService = services.find(s => s.id === service.id);
      if (originalService) {
        setSelectedService(originalService);
      } else {
        setSelectedService(service);
      }
    } else {
      setSelectedService(service);
    }
    
    setIsModalOpen(true);
  };

  const handleEditService = (service: Service) => {
    setSelectedService(service);
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  const handleDeleteService = (service: Service) => {
    setConfirmationModal({
      isOpen: true,
      service: service
    });
  };


  const confirmDeleteService = async () => {
    if (!confirmationModal.service) return;
    
    try {
      await apiCall(`${apiConfig.endpoints.services}/${confirmationModal.service.id}`, {
        method: 'DELETE'
      });
      
      // Refresh the services list
      await fetchServices();
      setNotification({
        type: 'success',
        message: 'Shërbimi u fshi me sukses',
        isVisible: true
      });
    } catch (error) {
      console.error('Error deleting service:', error);
      setNotification({
        type: 'error',
        message: 'Gabim në fshirjen e shërbimit',
        isVisible: true
      });
    } finally {
      setConfirmationModal({
        isOpen: false,
        service: null
      });
    }
  };

  const handleStatusChange = async (serviceId: string, newStatus: string) => {
    try {
      await apiCall(`${apiConfig.endpoints.services}/${serviceId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      
      // Refresh the services list
      fetchServices();
    } catch (err) {
      console.error('Error updating service status:', err);
      alert('Gabim në përditësimin e statusit');
    }
  };

  // Kanban columns
  const kanbanColumns = [
    {
      id: 'received',
      title: 'Marrë',
      items: services.filter(service => service.status === 'received'),
      color: 'bg-gray-400'
    },
    {
      id: 'in-progress',
      title: 'Në Progres',
      items: services.filter(service => service.status === 'in-progress'),
      color: 'bg-blue-400'
    },
    {
      id: 'waiting-parts',
      title: 'Duke Pritur Pjesët',
      items: services.filter(service => service.status === 'waiting-parts'),
      color: 'bg-yellow-400'
    },
    {
      id: 'completed',
      title: 'Përfunduar',
      items: services.filter(service => service.status === 'completed'),
      color: 'bg-green-400'
    },
    {
      id: 'delivered',
      title: 'Dërguar',
      items: services.filter(service => service.status === 'delivered'),
      color: 'bg-purple-400'
    }
  ];

  const renderServiceCard = (service: Service) => (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <h4 className="font-medium text-gray-900 text-sm">{service.id}</h4>
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(service.status)}`}>
          {translateStatus(service.status)}
        </span>
      </div>
      
             <div>
         <p className="text-sm font-medium text-gray-900">{service.customer.name}</p>
         <p className="text-sm text-gray-600">{service.problemDescription || 'N/A'}</p>
       </div>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
                 <div className="flex items-center gap-1">
           <User className="w-3 h-3" />
           <span>{service.assigned_to || 'N/A'}</span>
         </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{new Date(service.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${service.underWarranty ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {service.underWarranty ? 'Garanci' : 'Pa Garanci'}
        </span>
        <div className="flex items-center gap-1">
          {service.emailNotificationsSent && (
            <Mail className="w-3 h-3 text-green-500" />
          )}
          <button
            onClick={() => handleViewService(service)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <Eye className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Duke ngarkuar shërbimet...</span>
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
              <h3 className="text-sm font-medium text-red-800">Gabim në ngarkimin e shërbimeve</h3>
              <p className="text-sm text-red-600 mt-1">{error}</p>
              <button
                onClick={fetchServices}
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
        <h2 className="text-2xl font-bold text-gray-900">Servisi ({services.length})</h2>
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
          {canCreate('services') && (
            <button 
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Servis i Ri
            </button>
          )}
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Krijuar nga
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Përcaktuar për
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Klienti
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Problemi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statusi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Garancioni
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Veprimet
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {services.map((service) => (
                <tr key={service.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        SRV
                      </span>
                      <span className="text-sm font-medium text-gray-900">{service.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{service.createdBy || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {service.assignedTo || service.assigned_to || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{service.customer.name}</div>
                        <div className="text-sm text-gray-500">{service.customer.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <p className="text-sm text-gray-900 truncate">
                        {service.problemDescription || 'Nuk ka përshkrim'}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span 
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(service.status)}`}
                        title={service.status === 'completed' && service.completedAt ? `Përfunduar më: ${formatCompletionTime(service.completedAt)}` : undefined}
                      >
                        {translateStatus(service.status)}
                      </span>
                      {service.status === 'completed' && service.completedAt && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>{formatCompletionTime(service.completedAt)}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="max-w-xs">
                      <p className="text-sm text-gray-900 truncate">{service.warrantyInfo || 'N/A'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {new Date(service.createdAt).toLocaleDateString('sq-AL')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewService(service)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Shih"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {canEdit('services') && (
                        <button 
                          onClick={() => handleEditService(service)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Modifiko"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete('services') && (
                        <button
                          onClick={() => handleDeleteService(service)}
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
          renderCard={renderServiceCard}
          onAddItem={(columnId) => console.log('Add item to', columnId)}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <CalendarView
          items={services.map(service => {
            // Get description with fallback logic
            const description = service.problemDescription;
            const displayDescription = description && description.trim() !== '' ? description : 'Nuk ka përshkrim';
            
            return {
              id: service.id,
              title: service.problemDescription || 'Servis',
              description: displayDescription,
              status: service.status,
              type: 'service' as const,
              assignedTo: service.assignedTo || service.assigned_to,
              createdBy: service.createdBy || service.created_by,
              createdAt: service.createdAt,
              updatedAt: service.updatedAt,
              completedAt: service.completedAt,
              warrantyInfo: service.warrantyInfo || service.warranty_info || 'N/A',
              customerName: service.customer?.name || service.customer || 'N/A'
            };
          })}
          onItemClick={handleViewService}
          onStatusChange={handleStatusChange}
          type="services"
        />
      )}

      {/* Service Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Service Details"
        size="lg"
      >
        {selectedService && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{selectedService.id}</h3>
                <p className="text-sm text-gray-500 mt-1">Klienti: {selectedService.customer?.name || selectedService.customer || 'N/A'}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedService.status)}`}>
                  {translateStatus(selectedService.status)}
                </span>
                {selectedService.status === 'completed' && selectedService.completedAt && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>Përfunduar: {formatCompletionTime(selectedService.completedAt)}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Përshkrimi</label>
              <p className="text-sm text-gray-900">
                {selectedService.problemDescription || selectedService.description || 'Nuk ka përshkrim'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Përcaktuar për</label>
                <p className="text-sm text-gray-900">
                  {selectedService.assignedTo || selectedService.assigned_to || 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Krijuar nga</label>
                <p className="text-sm text-gray-900">
                  {selectedService.createdBy || selectedService.created_by || 'N/A'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Krijuar më</label>
                <p className="text-sm text-gray-900">{new Date(selectedService.createdAt).toLocaleString('sq-AL')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Përditësuar më</label>
                <p className="text-sm text-gray-900">{selectedService.updatedAt ? new Date(selectedService.updatedAt).toLocaleString('sq-AL') : 'N/A'}</p>
              </div>
            </div>

            {selectedService.completedAt && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Përfunduar më</label>
                <p className="text-sm text-gray-900">{formatCompletionTime(selectedService.completedAt)}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Garancioni</label>
              <p className="text-sm text-gray-900">
                {selectedService.warrantyInfo || 'N/A'}
              </p>
            </div>

            {selectedService.comments && selectedService.comments.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Komentet</label>
                <div className="space-y-3">
                  {selectedService.comments.map((comment) => (
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

            {selectedService.serviceHistory && selectedService.serviceHistory.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Historiku i Shërbimit</label>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {selectedService.serviceHistory.map((entry) => (
                    <div key={entry.id} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{entry.action}</span>
                        <span className="text-xs text-gray-500">{new Date(entry.date).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-gray-700">{entry.notes}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">nga {entry.userName}</span>
                        {entry.emailSent && (
                          <Mail className="w-3 h-3 text-green-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Service Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setIsEditMode(false);
          setSelectedService(null);
        }}
        title={isEditMode ? "Modifiko Shërbimin" : "Shërbim i Ri"}
        size="lg"
      >
        <ServiceForm 
          service={isEditMode ? selectedService : undefined}
          onClose={() => {
            setIsFormOpen(false);
            setIsEditMode(false);
            setSelectedService(null);
          }}
          onSuccess={() => {
            setIsFormOpen(false);
            setIsEditMode(false);
            setSelectedService(null);
            fetchServices();
          }}
        />
      </Modal>

      {/* Service Form Modal */}
      {showForm && (
        <ServiceForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            fetchServices();
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
        onClose={() => setConfirmationModal({ isOpen: false, service: null })}
        onConfirm={confirmDeleteService}
        title="Konfirmo Fshirjen"
        message={`A jeni të sigurt që doni të fshini shërbimin "${confirmationModal.service?.id}"?`}
        confirmText="Po, fshij"
        cancelText="Anulo"
      />
    </div>
  );
};

export default ServicesList;