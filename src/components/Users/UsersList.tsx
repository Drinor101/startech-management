import React, { useState, useEffect } from 'react';
import { Plus, Edit, Shield, Mail, Phone, Clock, Activity, AlertCircle, Euro } from 'lucide-react';
import { apiCall, apiConfig } from '../../config/api';
import Modal from '../Common/Modal';
import UserForm from './UserForm';
import { usePermissions } from '../../hooks/usePermissions';

const UsersList: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { canCreate, canEdit, canDelete } = usePermissions();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [showUserActions, setShowUserActions] = useState(false);

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiCall(apiConfig.endpoints.users);
        setUsers(response.data || []);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Gabim në ngarkimin e përdoruesve');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const getRoleColor = (role: string) => {
    const colors = {
      'Administrator': 'bg-red-100 text-red-800',
      'Menaxher': 'bg-purple-100 text-purple-800',
      'Marketer': 'bg-orange-100 text-orange-800',
      'Dizajner': 'bg-pink-100 text-pink-800',
      'Agjent shitjeje': 'bg-blue-100 text-blue-800',
      'Agjent mbështetje': 'bg-yellow-100 text-yellow-800',
      'Serviser': 'bg-green-100 text-green-800'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getCreditsColor = (credits: number) => {
    if (credits >= 150) return 'bg-green-100 text-green-800';
    if (credits >= 100) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };



  const handleViewUser = (user: any) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  const getUserActions = (userId: string) => {
    // For now, return empty array since we don't have user actions API
    return [];
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Po ngarkohen përdoruesit...</p>
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
          <h2 className="text-2xl font-bold text-gray-900">Menaxhimi i Përdoruesve</h2>
          <p className="text-sm text-gray-500 mt-1">Menaxho përdoruesit, rolet dhe lejet</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowUserActions(!showUserActions)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Activity className="w-4 h-4" />
            Veprimet e Përdoruesve
          </button>
          {canCreate('users') && (
            <button 
              onClick={() => setIsFormOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Shto Përdorues
            </button>
          )}
        </div>
      </div>

      {showUserActions && (
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Veprimet e Fundit të Përdoruesve</h3>
          <div className="space-y-2">
            <p className="text-sm text-gray-500 text-center py-4">Nuk ka veprime të fundit të gjetur</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Përdoruesi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Roli
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kontakt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Telefoni
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
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {(user.name || user.email?.split('@')[0] || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.name || user.email?.split('@')[0] || 'Përdorues'}
                        </div>
                        <div className="text-sm text-gray-500">ID: {user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-900">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {user.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {user.phone || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleViewUser(user)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                      {canEdit('users') && (
                        <button className="text-gray-600 hover:text-gray-900">
                          <Edit className="w-4 h-4" />
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

      {/* User Details Modal */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title="User Details & Actions"
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-xl font-medium text-gray-700">
                  {(selectedUser.name || selectedUser.email?.split('@')[0] || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedUser.name || selectedUser.email?.split('@')[0] || 'Përdorues'}
                </h3>
                <p className="text-sm text-gray-600">{selectedUser.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(selectedUser.role)}`}>
                    {selectedUser.role}
                  </span>
                  <span className="text-sm text-gray-600">
                    {selectedUser.department || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statusi</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  selectedUser.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {selectedUser.isActive ? 'Aktiv' : 'Pasiv'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kredite</label>
                <div className="flex items-center gap-2">
                  <Euro className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">€{selectedUser.credits.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hyrja e Fundit</label>
                <p className="text-sm text-gray-900">
                  {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : 'Nuk ka kaluar ndonjë kohë'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statusi i Kredive</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCreditsColor(selectedUser.credits)}`}>
                  {selectedUser.credits >= 150 ? 'Shumë' : selectedUser.credits >= 100 ? 'Mesatare' : 'Ulëte'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Veprimet e Fundit</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {getUserActions(selectedUser.id).map((action) => (
                  <div key={action.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{action.action}</span>
                      <span className="text-xs text-gray-500">{new Date(action.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-600">{action.details}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">Moduli: {action.module}</span>
                      {action.ipAddress && (
                        <span className="text-xs text-gray-500">IP: {action.ipAddress}</span>
                      )}
                    </div>
                  </div>
                ))}
                {getUserActions(selectedUser.id).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">Nuk ka veprimet të fundit të gjetur</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* User Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Shto Përdorues të Ri"
        size="md"
      >
        <UserForm 
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => {
            setIsFormOpen(false);
            // Refresh the users list
            window.location.reload();
          }}
        />
      </Modal>
    </div>
  );
};

export default UsersList;