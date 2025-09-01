import React, { useState, useEffect } from 'react';
import { Grid3X3, List, Eye, Edit, AlertCircle, Clock, User, QrCode, Mail, Calendar } from 'lucide-react';
import { Service, ViewMode } from '../../types';
import { apiCall, apiConfig } from '../../config/api';
import KanbanBoard from '../Common/KanbanBoard';
import Modal from '../Common/Modal';
import ServiceForm from './ServiceForm';

const ServicesList: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

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

  const handleViewService = (service: Service) => {
    setSelectedService(service);
    setIsModalOpen(true);
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
        <p className="text-sm text-gray-600">{service.problemDescription}</p>
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <User className="w-3 h-3" />
          <span>{service.assignedTo}</span>
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
          </div>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Servis i Ri
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
                  Servis ID
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
                  Caktuar për
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Garanci
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Njoftimet
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
                      <QrCode className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{service.id}</span>
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
                      <p className="text-sm text-gray-900 truncate">{service.problemDescription}</p>
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
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{service.assignedTo}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${service.underWarranty ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {service.underWarranty ? 'Po' : 'Jo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {service.emailNotificationsSent ? (
                        <Mail className="w-4 h-4 text-green-500" />
                      ) : (
                        <Mail className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewService(service)}
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
          renderCard={renderServiceCard}
          onAddItem={(columnId) => console.log('Add item to', columnId)}
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
                <p className="text-sm text-gray-500 mt-1">Klienti: {selectedService.customer.name}</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Pershkrimi i Problemit</label>
              <p className="text-sm text-gray-900">{selectedService.problemDescription}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategoria</label>
                <p className="text-sm text-gray-900">{selectedService.category}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Përshkruar nga</label>
                <p className="text-sm text-gray-900">{selectedService.assignedTo}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Krijuar</label>
                <p className="text-sm text-gray-900">{new Date(selectedService.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Përditësuar më</label>
                <p className="text-sm text-gray-900">{new Date(selectedService.updatedAt).toLocaleString()}</p>
              </div>
            </div>

            {selectedService.completedAt && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Përfunduar më</label>
                <p className="text-sm text-gray-900">{formatCompletionTime(selectedService.completedAt)}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Garanci</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${selectedService.underWarranty ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {selectedService.underWarranty ? 'Garanci' : 'Pa Garanci'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Punkti i Pranueshmërisë</label>
                <p className="text-sm text-gray-900">{selectedService.receptionPoint}</p>
              </div>
            </div>

            {selectedService.serviceHistory.length > 0 && (
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
        onClose={() => setIsFormOpen(false)}
        title="Shërbim i Ri"
        size="lg"
      >
        <ServiceForm 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={fetchServices}
        />
      </Modal>
    </div>
  );
};

export default ServicesList;