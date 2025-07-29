import React from 'react';
import { 
  Home, 
  Settings, 
  CheckSquare, 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Users, 
  Zap,
  ChevronRight
} from 'lucide-react';
import { User } from '../../types';

interface SidebarProps {
  currentUser: User;
  activeModule: string;
  onModuleChange: (module: string) => void;
  collapsed: boolean;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, roles: ['Administrator', 'Manager'] },
  { id: 'services', label: 'Services', icon: Settings, roles: ['Administrator', 'Manager', 'Technician', 'Support Agent'] },
  { id: 'tasks', label: 'Tasks & Tickets', icon: CheckSquare, roles: ['Administrator', 'Manager', 'Technician', 'Support Agent', 'Design', 'Marketing'] },
  { id: 'orders', label: 'Orders', icon: ShoppingCart, roles: ['Administrator', 'Manager', 'E-commerce', 'Support Agent'] },
  { id: 'products', label: 'Products', icon: Package, roles: ['Administrator', 'Manager', 'E-commerce'] },
  { id: 'reports', label: 'Reports', icon: BarChart3, roles: ['Administrator', 'Manager'] },
  { id: 'users', label: 'Users', icon: Users, roles: ['Administrator'] },
  { id: 'settings', label: 'Settings', icon: Settings, roles: ['Administrator', 'Manager'] },
];

const Sidebar: React.FC<SidebarProps> = ({ currentUser, activeModule, onModuleChange, collapsed }) => {
  const availableItems = menuItems.filter(item => 
    item.roles.includes(currentUser.role)
  );

  return (
    <div className={`bg-gray-900 text-white transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'} flex flex-col`}>
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-lg">Startech</h1>
              <p className="text-xs text-gray-400">Management System</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {availableItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onModuleChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="font-medium">{item.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">{currentUser.name.charAt(0)}</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{currentUser.name}</p>
              <p className="text-xs text-gray-400 truncate">{currentUser.role}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;