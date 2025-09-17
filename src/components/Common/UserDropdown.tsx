import React, { useState, useEffect } from 'react';
import { ChevronDown, Search, User } from 'lucide-react';
import { apiCall, apiConfig, getCurrentUser } from '../../config/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface UserDropdownProps {
  value: string;
  onChange: (userId: string, userName: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  filterRole?: string; // Optional role filter
  excludeCurrentUser?: boolean; // Exclude current logged-in user from options
}

const UserDropdown: React.FC<UserDropdownProps> = ({
  value,
  onChange,
  placeholder = "Zgjidhni përdoruesin",
  required = false,
  className = "",
  filterRole,
  excludeCurrentUser = false
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await apiCall(apiConfig.endpoints.users);
        let usersData = response.data || [];
        
        // Filter by role if specified
        if (filterRole) {
          usersData = usersData.filter((user: User) => user.role === filterRole);
        }
        
        // Exclude current user if specified
        if (excludeCurrentUser) {
          const currentUser = getCurrentUser();
          if (currentUser) {
            usersData = usersData.filter((user: User) => 
              user.id !== currentUser.id && 
              user.email !== currentUser.email &&
              user.name !== currentUser.name
            );
          }
        }
        
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [filterRole, excludeCurrentUser]);

  // Find selected user when value changes
  useEffect(() => {
    if (value && users.length > 0) {
      const user = users.find(u => u.id === value || u.name === value);
      setSelectedUser(user || null);
    } else {
      setSelectedUser(null);
    }
  }, [value, users]);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    onChange(user.id, user.name);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    setSelectedUser(null);
    onChange('', '');
    setIsOpen(false);
    setSearchTerm('');
  };

  const getRoleColor = (role: string) => {
    const colors = {
      'admin': 'bg-red-100 text-red-800',
      'manager': 'bg-blue-100 text-blue-800',
      'technician': 'bg-green-100 text-green-800',
      'user': 'bg-gray-100 text-gray-800'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={`relative ${className}`}>
      <div
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer bg-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <span className={selectedUser ? "text-gray-900" : "text-gray-500"}>
              {selectedUser ? selectedUser.name : placeholder}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Kërko përdoruesin..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
          </div>

          {/* User list */}
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="p-3 text-center text-gray-500">
                Po ngarkohen përdoruesit...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-3 text-center text-gray-500">
                {searchTerm ? 'Nuk u gjet asnjë përdorues' : 'Nuk ka përdorues'}
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => handleSelectUser(user)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </div>
                    </div>
                    {selectedUser?.id === user.id && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Clear button */}
          {selectedUser && (
            <div className="p-2 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClear}
                className="w-full text-sm text-red-600 hover:text-red-800 py-1"
              >
                Fshi zgjedhjen
              </button>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default UserDropdown;
