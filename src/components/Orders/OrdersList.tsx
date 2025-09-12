import React, { useState, useEffect } from 'react';
import { Eye, Edit, Trash2, Package, User, Calendar, DollarSign, Globe, ShoppingCart, AlertCircle, Plus } from 'lucide-react';
import { Order } from '../../types';
import { apiCall, apiConfig } from '../../config/api';
import Modal from '../Common/Modal';
import OrderForm from './OrderForm';
import { usePermissions } from '../../hooks/usePermissions';
import Notification from '../Common/Notification';

const OrdersList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const { canCreate, canEdit, canDelete } = usePermissions();
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    isVisible: boolean;
  }>({
    type: 'success',
    message: '',
    isVisible: false
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
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleDeleteOrder = async (order: Order) => {
    if (window.confirm(`A jeni të sigurt që doni të fshini porosinë "${order.id}"?`)) {
      try {
        await apiCall(`${apiConfig.endpoints.orders}/${order.id}`, {
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
      }
    }
  };

  // Function to translate status values to Albanian
  const translateStatus = (status: string) => {
    const translations: { [key: string]: string } = {
      'pending': 'Në Pritje',
      'processing': 'Në Procesim',
      'shipped': 'Dërguar',
      'delivered': 'Dërguar',
      'cancelled': 'Anuluar'
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
        <button 
          onClick={() => {
            setSelectedOrder(null);
            setIsEditMode(false);
            setIsFormOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Porosi e Re
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Klienti
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produktet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Adresa e dërgimit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Totali
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statusi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shënim shtesë
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
              {orders.map((order) => {
                const SourceIcon = getSourceIcon(order.source);
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          PRS
                        </span>
                        <span className="text-sm font-medium text-gray-900">{order.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{order.customer.name}</div>
                          <div className="text-sm text-gray-500">{order.customer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.products?.length || 0} item{(order.products?.length || 0) > 1 ? 's' : ''}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.products?.map(p => p?.title || 'Produkt i panjohur').join(', ').substring(0, 50) || 'N/A'}
                        {(order.products?.map(p => p?.title || 'Produkt i panjohur').join(', ').length || 0) > 50 ? '...' : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.shippingInfo.address || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.shippingInfo.city}, {order.shippingInfo.zipCode}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">${(order.total || 0).toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {translateStatus(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {order.teamNotes || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {new Date(order.createdAt).toLocaleDateString('sq-AL')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
                      <p className="font-medium text-gray-900">${(product?.finalPrice || 0).toFixed(2)}</p>
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
    </div>
  );
};

export default OrdersList;