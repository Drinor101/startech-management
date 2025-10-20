import React, { useState, useEffect } from 'react';
import { Eye, Edit, Trash2, User, Calendar, Euro, Globe, ShoppingCart, AlertCircle, Plus, List, Grid3X3, ArrowRight } from 'lucide-react';
import { Order } from '../../types';
import { apiCall, apiConfig, getCurrentUser } from '../../config/api';
import Modal from '../Common/Modal';
import OrderForm from './OrderForm';
import { usePermissions } from '../../hooks/usePermissions';
import Notification from '../Common/Notification';
import KanbanBoard from '../Common/KanbanBoard';
import ConfirmationModal from '../Common/ConfirmationModal';

const OrdersList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const { canCreate, canEdit, canDelete } = usePermissions();

  // Check if there's a selected order from search
  useEffect(() => {
    const selectedOrderId = sessionStorage.getItem('selectedOrderId');
    if (selectedOrderId && orders.length > 0) {
      const order = orders.find(o => o.id === selectedOrderId);
      if (order) {
        setSelectedOrder(order);
        setIsEditMode(false);
        setIsModalOpen(true);
        // Clear the selected order ID from session storage
        sessionStorage.removeItem('selectedOrderId');
      }
    }
  }, [orders]);

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
    order: Order | null;
  }>({
    isOpen: false,
    order: null
  });
  const [delegateModal, setDelegateModal] = useState<{
    isOpen: boolean;
    order: Order | null;
  }>({
    isOpen: false,
    order: null
  });

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall(apiConfig.endpoints.orders);
      console.log('Orders API response:', response);
      
      // Handle the correct API response structure
      const data = response.success ? response.data : [];
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Gabim në ngarkimin e porosive');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusColor = (status: string) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'processing': 'bg-blue-100 text-blue-800',
      'shipped': 'bg-purple-100 text-purple-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'accepted': 'bg-indigo-100 text-indigo-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleDeleteOrder = (order: Order) => {
    setConfirmationModal({
      isOpen: true,
      order: order
    });
  };

  const handleDelegateOrder = (order: Order) => {
    setDelegateModal({
      isOpen: true,
      order: order
    });
  };

  const delegateToService = async (order: Order) => {
    try {
      const serviceData = {
        customerId: order.customerId,
        customerName: order.customer?.name || 'Klient i panjohur',
        problem: `Servis për porosinë ${order.id}`,
        status: 'received',
        assignedToName: '', // Mund të vendoset manualisht
        warranty: ''
      };

      await apiCall('/api/services', {
        method: 'POST',
        body: JSON.stringify(serviceData)
      });

      setNotification({
        type: 'success',
        message: `Porosia ${order.id} u delegua në servis me sukses`,
        isVisible: true
      });
    } catch (error) {
      console.error('Error delegating to service:', error);
      setNotification({
        type: 'error',
        message: 'Gabim në delegimin e porosisë në servis',
        isVisible: true
      });
    }
  };

  const delegateToTask = async (order: Order) => {
    try {
      const taskData = {
        title: `Task për porosinë ${order.id}`,
        description: `Menaxhimi i porosisë ${order.id} - ${order.customer?.name || 'Klient i panjohur'}`,
        priority: 'medium',
        status: 'todo',
        assignedToName: '', // Mund të vendoset manualisht
        assignedBy: getCurrentUser()?.name || getCurrentUser()?.email || 'Sistemi',
        department: '',
        type: 'task'
      };

      await apiCall('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData)
      });

      setNotification({
        type: 'success',
        message: `Porosia ${order.id} u delegua në task me sukses`,
        isVisible: true
      });
    } catch (error) {
      console.error('Error delegating to task:', error);
      setNotification({
        type: 'error',
        message: 'Gabim në delegimin e porosisë në task',
        isVisible: true
      });
    }
  };

  const confirmDeleteOrder = async () => {
    if (!confirmationModal.order) return;
    
    try {
      await apiCall(`${apiConfig.endpoints.orders}/${confirmationModal.order.id}`, {
        method: 'DELETE'
      });
      
      // Refresh the orders list
      await fetchOrders();
      setNotification({
        type: 'success',
        message: 'Porosia u fshi me sukses',
        isVisible: true
      });
    } catch (error) {
      console.error('Error deleting order:', error);
      setNotification({
        type: 'error',
        message: 'Gabim në fshirjen e porosisë',
        isVisible: true
      });
    } finally {
      setConfirmationModal({
        isOpen: false,
        order: null
      });
    }
  };

  // Function to translate status values to Albanian
  const translateStatus = (status: string) => {
    const translations: { [key: string]: string } = {
      'pending': 'Në Pritje',
      'processing': 'Në Procesim',
      'shipped': 'Dërguar',
      'delivered': 'Dorëzuar',
      'cancelled': 'Anuluar',
      'accepted': 'Pranuar'
    };
    return translations[status] || status;
  };

  const getSourceColor = (source: string) => {
    const colors = {
      'Manual': 'bg-orange-100 text-orange-800',
      'Woo': 'bg-blue-100 text-blue-800'
    };
    return colors[source as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getSourceIcon = (source: string) => {
    return source === 'Woo' ? Globe : ShoppingCart;
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await apiCall(`${apiConfig.endpoints.orders}/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });

      // Refresh orders
      await fetchOrders();
      
      setNotification({
        type: 'success',
        message: 'Statusi i porosisë u përditësua me sukses',
        isVisible: true
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      setNotification({
        type: 'error',
        message: 'Gabim në përditësimin e statusit',
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
            <p className="text-gray-600">Po ngarkohen porositë...</p>
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
        <h2 className="text-2xl font-bold text-gray-900">Porositë ({orders.length})</h2>
        <div className="flex items-center gap-4">
          {/* View Mode Buttons */}
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
          </div>
          
          <button 
            onClick={() => {
              setSelectedOrder(null);
              setIsEditMode(false);
              setIsFormOpen(true);
            }}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md font-medium"
          >
            <Plus className="w-4 h-4" />
            Porosi e Re
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    Klienti
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    Produktet
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                    Adresa e dërgimit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Totali
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Statusi
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Shënim shtesë
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
              {orders.map((order) => {
                const SourceIcon = getSourceIcon(order.source);
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          PRS
                        </span>
                        <span className="text-sm font-medium text-gray-900">{order.id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{order.customer.name}</div>
                          <div className="text-sm text-gray-500">{order.customer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">
                        {order.products?.length || 0} item{(order.products?.length || 0) > 1 ? 's' : ''}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.products?.map(p => p?.title || 'Produkt i panjohur').join(', ').substring(0, 50) || 'N/A'}
                        {(order.products?.map(p => p?.title || 'Produkt i panjohur').join(', ').length || 0) > 50 ? '...' : ''}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">
                        {order.shippingInfo.address || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.shippingInfo.city}, {order.shippingInfo.zipCode}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Euro className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{(order.total || 0).toFixed(2)} €</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {translateStatus(order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {order.teamNotes || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {new Date(order.createdAt).toLocaleDateString('sq-AL')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleViewOrder(order);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Shih"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canEdit('orders') && (
                          <button 
                            onClick={() => handleEditOrder(order)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Modifiko"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelegateOrder(order)}
                          className="text-purple-600 hover:text-purple-900 p-1"
                          title="Delego në Servis/Task"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        {canDelete('orders') && (
                          <button
                            onClick={() => handleDeleteOrder(order)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Fshij"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      ) : (
        <KanbanBoard
          items={orders.map(order => ({
            id: order.id,
            title: order.id,
            description: `${order.customer?.name || 'Klient i panjohur'} - ${order.products?.length || 0} produkte`,
            status: order.status,
            priority: 'medium',
            assignedTo: order.customer?.name || 'N/A',
            createdAt: order.createdAt || new Date().toISOString(),
            updatedAt: order.updatedAt || new Date().toISOString(),
            type: 'order'
          }))}
          onStatusChange={handleStatusChange}
          statusConfig={{
            'pending': { label: 'Në Pritje', color: 'yellow' },
            'accepted': { label: 'Pranuar', color: 'indigo' },
            'processing': { label: 'Në Procesim', color: 'blue' },
            'shipped': { label: 'Dërguar', color: 'purple' },
            'delivered': { label: 'Dorëzuar', color: 'green' },
            'cancelled': { label: 'Anuluar', color: 'red' }
          }}
        />
      )}

      {/* Order Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Detajet e Porosisë"
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{selectedOrder.id}</h3>
                <p className="text-sm text-gray-500 mt-1">Porosi</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  PRS
                </span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                  {translateStatus(selectedOrder.status)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Klienti</label>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium">{selectedOrder.customer.name}</p>
                  <p className="text-sm text-gray-600">{selectedOrder.customer.email}</p>
                  <p className="text-sm text-gray-600">{selectedOrder.customer.phone}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Burimi</label>
                <div className="flex items-center gap-2">
                  {(() => {
                    const SourceIcon = getSourceIcon(selectedOrder.source);
                    return <SourceIcon className="w-4 h-4 text-gray-400" />;
                  })()}
                  <span className="text-sm text-gray-900">{selectedOrder.source}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Produktet</label>
              <div className="space-y-2">
                {selectedOrder.products?.map((product) => (
                  <div key={product?.id || Math.random()} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <img 
                      src={product?.image || '/placeholder-product.png'} 
                      alt={product?.title || 'Produkt'}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{product?.title || 'Produkt i panjohur'}</p>
                      <p className="text-sm text-gray-600">{product?.category || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">€{(product?.finalPrice || 0).toFixed(2)}</p>
                      <p className="text-sm text-gray-500">Sasi: {product?.quantity || 0}</p>
                    </div>
                  </div>
                )) || []}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresa e dërgimit</label>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-900">{selectedOrder.shippingInfo.address}</p>
                <p className="text-sm text-gray-900">{selectedOrder.shippingInfo.city}, {selectedOrder.shippingInfo.zipCode}</p>
                <p className="text-sm text-gray-600 mt-1">Metoda: {selectedOrder.shippingInfo.method}</p>
              </div>
            </div>

            {selectedOrder.teamNotes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shënim shtesë (për ekipin)</label>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-900">{selectedOrder.teamNotes}</p>
                </div>
              </div>
            )}

            {selectedOrder.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shënime</label>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-900">{selectedOrder.notes}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Krijuar më</label>
                <p className="text-sm text-gray-900">{new Date(selectedOrder.createdAt).toLocaleString('sq-AL')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Përditësuar më</label>
                <p className="text-sm text-gray-900">{new Date(selectedOrder.updatedAt).toLocaleString('sq-AL')}</p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <span className="text-lg font-medium text-gray-900">Totali</span>
              <span className="text-lg font-bold text-gray-900">${(selectedOrder.total || 0).toFixed(2)}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* Order Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setIsEditMode(false);
          setSelectedOrder(null);
        }}
        title={isEditMode ? "Modifiko Porosinë" : "Porosi e Re"}
        size="xl"
      >
        <OrderForm 
          order={isEditMode ? selectedOrder : undefined}
          onClose={() => {
            setIsFormOpen(false);
            setIsEditMode(false);
            setSelectedOrder(null);
          }}
          onSuccess={() => {
            setIsFormOpen(false);
            setIsEditMode(false);
            setSelectedOrder(null);
            fetchOrders();
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

      {/* Delegate Modal */}
      <Modal
        isOpen={delegateModal.isOpen}
        onClose={() => setDelegateModal({ isOpen: false, order: null })}
        title="Delego Porosinë"
        size="md"
      >
        {delegateModal.order && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Porosia <span className="font-medium">{delegateModal.order.id}</span> do të deleguhet në:
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  if (delegateModal.order) {
                    delegateToService(delegateModal.order);
                    setDelegateModal({ isOpen: false, order: null });
                  }
                }}
                className="w-full flex items-center justify-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Servis</div>
                  <div className="text-sm text-gray-500">Krijo një servis të ri për këtë porosi</div>
                </div>
              </button>

              <button
                onClick={() => {
                  if (delegateModal.order) {
                    delegateToTask(delegateModal.order);
                    setDelegateModal({ isOpen: false, order: null });
                  }
                }}
                className="w-full flex items-center justify-center gap-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Task</div>
                  <div className="text-sm text-gray-500">Krijo një task të ri për këtë porosi</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal({ isOpen: false, order: null })}
        onConfirm={confirmDeleteOrder}
        title="Konfirmo Fshirjen"
        message={`A jeni të sigurt që doni të fshini porosinë "${confirmationModal.order?.id}"?`}
        confirmText="Po, fshij"
        cancelText="Anulo"
      />
    </div>
  );
};

export default OrdersList;