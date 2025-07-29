import React, { useState } from 'react';
import { Plus, Edit, Shield, Mail, Phone, Key, Clock, Activity } from 'lucide-react';
import { User } from '../../types';
import { mockUsers, mockUserActions } from '../../data/mockData';
import Modal from '../Common/Modal';

const UsersList: React.FC = () => {
  const [users] = useState<User[]>(mockUsers);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [showUserActions, setShowUserActions] = useState(false);

  const getRoleColor = (role: string) => {
    const colors = {
      'Administrator': 'bg-red-100 text-red-800',
      'Manager': 'bg-purple-100 text-purple-800',
      'E-commerce': 'bg-blue-100 text-blue-800',
      'Technician': 'bg-green-100 text-green-800',
      'Marketing': 'bg-orange-100 text-orange-800',
      'Design': 'bg-pink-100 text-pink-800',
      'Support Agent': 'bg-yellow-100 text-yellow-800',
      'Customer': 'bg-gray-100 text-gray-800'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  const getUserActions = (userId: string) => {
    return mockUserActions.filter(action => action.userId === userId);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-sm text-gray-500 mt-1">Manage users, roles, and permissions</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowUserActions(!showUserActions)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Activity className="w-4 h-4" />
            User Actions
          </button>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      {showUserActions && (
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Recent User Actions</h3>
          <div className="space-y-2">
            {mockUserActions.slice(0, 5).map((action) => (
              <div key={action.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Activity className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-sm font-medium text-gray-900">{action.userName}</span>
                    <span className="text-sm text-gray-600 ml-2">{action.action}</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(action.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  2FA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
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
                          {user.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
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
                      <Key className={`w-4 h-4 ${user.twoFactorEnabled ? 'text-green-500' : 'text-gray-400'}`} />
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.twoFactorEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleViewUser(user)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Shield className="w-4 h-4" />
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
                  {selectedUser.name.charAt(0)}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">{selectedUser.name}</h3>
                <p className="text-sm text-gray-600">{selectedUser.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(selectedUser.role)}`}>
                    {selectedUser.role}
                  </span>
                  {selectedUser.twoFactorEnabled && (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      2FA Enabled
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  selectedUser.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {selectedUser.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Login</label>
                <p className="text-sm text-gray-900">
                  {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : 'Never logged in'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Recent Actions</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {getUserActions(selectedUser.id).map((action) => (
                  <div key={action.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{action.action}</span>
                      <span className="text-xs text-gray-500">{new Date(action.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-600">{action.details}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">Module: {action.module}</span>
                      {action.ipAddress && (
                        <span className="text-xs text-gray-500">IP: {action.ipAddress}</span>
                      )}
                    </div>
                  </div>
                ))}
                {getUserActions(selectedUser.id).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No recent actions found</p>
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
        title="Add New User"
        size="md"
      >
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Role</option>
              <option value="Technician">Technician</option>
              <option value="Support Agent">Support Agent</option>
              <option value="E-commerce">E-commerce</option>
              <option value="Marketing">Marketing</option>
              <option value="Design">Design</option>
              <option value="Manager">Manager</option>
              <option value="Administrator">Administrator</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                defaultChecked
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">Active user</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="twoFactor"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="twoFactor" className="ml-2 block text-sm text-gray-900">Enable 2FA</label>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700"
            >
              Create User
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UsersList;