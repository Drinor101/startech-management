import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Mail, Phone, MapPin, Users, Activity, AlertCircle } from 'lucide-react';
import { apiCall, apiConfig } from '../../config/api';
import Modal from '../Common/Modal';
import CustomerForm from './CustomerForm';
import ConfirmationModal from '../Common/ConfirmationModal';
import { usePermissions } from '../../hooks/usePermissions';
import Notification from '../Common/Notification';

const CustomersList: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    customer: any | null;
  }>({
    isOpen: false,
    customer: null
  });
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    isVisible: boolean;
  }>({
    type: 'success',
    message: '',
    isVisible: false
  });
  const { canCreate, canEdit, canDelete } = usePermissions();

  // Fetch customers from API
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall(apiConfig.endpoints.customers);
      setCustomers(response.data || []);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Gabim në ngarkimin e klientëve');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const getSourceColor = (source: string) => {
    const colors = {
      'Internal': 'bg-blue-100 text-blue-800',
      'WooCommerce': 'bg-green-100 text-green-800',
      'Website': 'bg-purple-100 text-purple-800',
      'Social Media': 'bg-pink-100 text-pink-800',
      'Referral': 'bg-orange-100 text-orange-800'
    };
    return colors[source as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleViewCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setIsCustomerModalOpen(true);
  };

  const handleEditCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  const handleDeleteCustomer = (customer: any) => {
    setConfirmationModal({
      isOpen: true,
      customer: customer
    });
  };

  const confirmDeleteCustomer = async () => {
    if (!confirmationModal.customer) return;
    
    try {
      await apiCall(`${apiConfig.endpoints.customers}/${confirmationModal.customer.id}`, {
        method: 'DELETE'
      });
      
      // Refresh the customers list
      await fetchCustomers();
      
      setNotification({
        type: 'success',
        message: 'Klienti u fshi me sukses',
        isVisible: true
      });
      
      setConfirmationModal({ isOpen: false, customer: null });
    } catch (err) {
      console.error('Error deleting customer:', err);
      setNotification({
        type: 'error',
        message: 'Gabim në fshirjen e klientit',
        isVisible: true
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Po ngarkohen klientët...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Menaxhimi i Klientëve</h2>
          <p className="text-sm text-gray-500 mt-1">Menaxho klientët dhe të dhënat e tyre</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowStats(!showStats)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Activity className="w-4 h-4" />
            Statistikat
          </button>
          {canCreate('customers') && (
            <button 
              onClick={() => {
                setSelectedCustomer(null);
                setIsEditMode(false);
                setIsFormOpen(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Shto Klient
            </button>
          )}
        </div>
      </div>

      {showStats && (
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Statistikat e Klientëve</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{customers.length}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {customers.filter(c => c.source === 'Internal').length}
              </div>
              <div className="text-sm text-gray-600">Internal</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {customers.filter(c => c.source === 'WooCommerce').length}
              </div>
              <div className="text-sm text-gray-600">WooCommerce</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-600">
                {customers.filter(c => c.source === 'Website').length}
              </div>
              <div className="text-sm text-gray-600">Website</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {customers.filter(c => c.source === 'Social Media').length}
              </div>
              <div className="text-sm text-gray-600">Social Media</div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Klienti
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kontakt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Burimi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data e Krijimit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Veprimet
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {customer.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                        <div className="text-sm text-gray-500">ID: {customer.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-900">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {customer.email}
                      </div>
                      {customer.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {customer.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSourceColor(customer.source)}`}>
                      {customer.source}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleViewCustomer(customer)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Users className="w-4 h-4" />
                      </button>
                      {canEdit('customers') && (
                        <button 
                          onClick={() => handleEditCustomer(customer)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Modifiko"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete('customers') && (
                        <button
                          onClick={() => handleDeleteCustomer(customer)}
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

      {/* Customer Details Modal */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="Detajet e Klientit"
        size="lg"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-xl font-medium text-gray-700">
                  {selectedCustomer.name.charAt(0)}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">{selectedCustomer.name}</h3>
                <p className="text-sm text-gray-600">{selectedCustomer.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSourceColor(selectedCustomer.source)}`}>
                    {selectedCustomer.source}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefoni</label>
                <p className="text-sm text-gray-900">
                  {selectedCustomer.phone || 'N/A'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data e Krijimit</label>
              <p className="text-sm text-gray-900">
                {selectedCustomer.created_at ? new Date(selectedCustomer.created_at).toLocaleString() : 'N/A'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Porositë dhe Shërbimet</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                <p className="text-sm text-gray-500 text-center py-4">
                  Informacioni për porositë dhe shërbimet do të shfaqet këtu
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Customer Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setIsEditMode(false);
          setSelectedCustomer(null);
        }}
        title={isEditMode ? "Modifiko Klientin" : "Shto Klient të Ri"}
        size="md"
      >
        <CustomerForm 
          customer={isEditMode ? selectedCustomer : undefined}
          onClose={() => {
            setIsFormOpen(false);
            setIsEditMode(false);
            setSelectedCustomer(null);
          }}
          onSuccess={() => {
            setIsFormOpen(false);
            setIsEditMode(false);
            setSelectedCustomer(null);
            fetchCustomers();
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
        onClose={() => setConfirmationModal({ isOpen: false, customer: null })}
        onConfirm={confirmDeleteCustomer}
        title="Konfirmo Fshirjen"
        message={`A jeni të sigurt që doni të fshini klientin "${confirmationModal.customer?.name}"?`}
        confirmText="Po, fshij"
        cancelText="Anulo"
      />
    </div>
  );
};

export default CustomersList;
