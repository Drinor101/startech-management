import React, { useState } from 'react';
import { Eye, Edit, QrCode, Clock, User, Package, Mail, Grid3X3, List } from 'lucide-react';
import { Service } from '../../types';
import { mockServices } from '../../data/mockData';
import Modal from '../Common/Modal';
import ServiceForm from './ServiceForm';
import KanbanBoard from '../Common/KanbanBoard';
import { ViewMode } from '../../types';

const ServicesList: React.FC = () => {
  const [services] = useState<Service[]>(mockServices);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const getStatusColor = (status: string) => {
    const colors = {
      'received': 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      'waiting-parts': 'bg-orange-100 text-orange-800',
      'completed': 'bg-green-100 text-green-800',
      'delivered': 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleViewService = (service: Service) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  // Kanban columns for services
  const kanbanColumns = [
    {
      id: 'received',
      title: 'Received',
      items: services.filter(service => service.status === 'received'),
      color: 'bg-blue-400'
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      items: services.filter(service => service.status === 'in-progress'),
      color: 'bg-yellow-400'
    },
    {
      id: 'waiting-parts',
      title: 'Waiting Parts',
      items: services.filter(service => service.status === 'waiting-parts'),
      color: 'bg-orange-400'
    },
    {
      id: 'completed',
      title: 'Completed',
      items: services.filter(service => service.status === 'completed'),
      color: 'bg-green-400'
    },
    {
      id: 'delivered',
      title: 'Delivered',
      items: services.filter(service => service.status === 'delivered'),
      color: 'bg-gray-400'
    }
  ];

  const renderServiceCard = (service: Service) => (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium text-gray-900 text-sm">{service.id}</h4>
          <p className="text-xs text-gray-600">{service.customer.name}</p>
        </div>
        <div className="flex items-center gap-1">
          <QrCode className="w-3 h-3 text-gray-400" />
          {service.underWarranty && (
            <span className="inline-flex px-1 py-0.5 text-xs font-semibold rounded bg-green-100 text-green-800">
              Warranty
            </span>
          )}
        </div>
      </div>
      
      <p className="text-sm text-gray-600 line-clamp-2">{service.problemDescription}</p>
      
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
      
      <div className="flex items-center justify-between">
        <span className="inline-flex px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
          {service.category}
        </span>
        <div className="flex items-center gap-1">
          {service.emailNotificationsSent && (
            <Mail className="w-3 h-3 text-green-500" title="Email notifications sent" />
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Services</h2>
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
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            New Service
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
                  Service ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Problem
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Warranty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notifications
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
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
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {service.problemDescription}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(service.status)}`}>
                      {service.status.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{service.assignedTo}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      service.underWarranty ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {service.underWarranty ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Mail className={`w-4 h-4 ${service.emailNotificationsSent ? 'text-green-500' : 'text-gray-400'}`} />
                      <span className="text-sm text-gray-600">
                        {service.emailNotificationsSent ? 'Sent' : 'Pending'}
                      </span>
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
          onAddItem={(columnId) => console.log('Add service to', columnId)}
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service ID</label>
                <p className="text-sm text-gray-900">{selectedService.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">QR Code</label>
                <p className="text-sm text-gray-900">{selectedService.qrCode}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Information</label>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium">{selectedService.customer.name}</p>
                <p className="text-sm text-gray-600">{selectedService.customer.email}</p>
                <p className="text-sm text-gray-600">{selectedService.customer.phone}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Problem Description</label>
              <p className="text-sm text-gray-900">{selectedService.problemDescription}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedService.status)}`}>
                  {selectedService.status.replace('-', ' ')}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <p className="text-sm text-gray-900">{selectedService.category}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service History</label>
              <div className="space-y-2">
                {selectedService.serviceHistory.map((entry) => (
                  <div key={entry.id} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium">{entry.action}</span>
                      <span className="text-xs text-gray-500 ml-auto">{entry.date}</span>
                    </div>
                    <p className="text-sm text-gray-600">{entry.notes}</p>
                    <p className="text-xs text-gray-500 mt-1">by {entry.userName}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Service Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="New Service Request"
        size="lg"
      >
        <ServiceForm onClose={() => setIsFormOpen(false)} />
      </Modal>
    </div>
  );
};

export default ServicesList;