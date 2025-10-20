import React, { useState } from 'react';
import { 
  Home, 
  Settings, 
  CheckSquare, 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Users, 
  Zap,
  ChevronRight,
  ChevronDown,
  Grid3X3,
  Wrench,
  MessageSquare,
  List,
  LogOut,
  MessageCircle
} from 'lucide-react';
import { User } from '../../types';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentUser: User;
  activeModule: string;
  onModuleChange: (module: string) => void;
  collapsed: boolean;
}

const menuItems = [
  { id: 'dashboard', label: 'Përmbledhja', icon: Home, module: 'dashboard' },
  { 
    id: 'detyra', 
    label: 'Detyra', 
    icon: CheckSquare, 
    module: 'tasks',
    subItems: [
      { id: 'all-tasks', label: 'Të gjitha', icon: List, module: 'tasks' },
      { id: 'services', label: 'Servisi', icon: Wrench, module: 'services' },
      { id: 'tasks', label: 'Taskat', icon: Grid3X3, module: 'tasks' },
      { id: 'tickets', label: 'Tiketat', icon: MessageSquare, module: 'tickets' }
    ]
  },
  { id: 'orders', label: 'Porositë', icon: ShoppingCart, module: 'orders' },
  { id: 'products', label: 'Produktet', icon: Package, module: 'products' },
  { id: 'customers', label: 'Klientët', icon: Users, module: 'customers' },
  { id: 'comments', label: 'Komentet', icon: MessageCircle, module: 'comments' },
  { id: 'reports', label: 'Raportet', icon: BarChart3, module: 'reports' },
  { id: 'users', label: 'Përdoruesit', icon: Users, module: 'users' },
  { id: 'settings', label: 'Cilësimet', icon: Settings, module: 'settings' },
];

const Sidebar: React.FC<SidebarProps> = ({ currentUser, activeModule, onModuleChange, collapsed }) => {
  const [expandedItems, setExpandedItems] = useState<string[]>(['detyra']);
  const { canView } = usePermissions();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const availableItems = menuItems.filter(item => {
    if (item.id === 'dashboard') return true; // Dashboard is always available
    if (item.subItems) {
      // For parent items with sub-items, check if any sub-item is accessible
      return item.subItems.some(subItem => canView(subItem.module));
    }
    return canView(item.module);
  });

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isItemActive = (itemId: string) => {
    if (itemId === 'detyra') {
      return ['all-tasks', 'services', 'tasks', 'tickets'].includes(activeModule);
    }
    return activeModule === itemId;
  };

  const isSubItemActive = (subItemId: string) => {
    return activeModule === subItemId;
  };

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
              <p className="text-xs text-gray-400">Sistemi i Menaxhimit</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {availableItems.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item.id);
            const isExpanded = expandedItems.includes(item.id);
            
            return (
              <div key={item.id}>
                <button
                  onClick={() => {
                    if (item.subItems) {
                      toggleExpanded(item.id);
                    } else {
                      onModuleChange(item.id);
                    }
                  }}
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
                      {item.subItems && (
                        isExpanded ? <ChevronDown className="w-4 h-4 ml-auto" /> : <ChevronRight className="w-4 h-4 ml-auto" />
                      )}
                      {!item.subItems && isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                    </>
                  )}
                </button>

                {/* Sub-items */}
                {item.subItems && !collapsed && isExpanded && (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.subItems
                      .filter(subItem => canView(subItem.module))
                      .map((subItem) => (
                        <button
                          key={subItem.id}
                          onClick={() => onModuleChange(subItem.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                            isSubItemActive(subItem.id)
                              ? 'bg-blue-500 text-white' 
                              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                          }`}
                        >
                          <subItem.icon className="w-4 h-4" />
                          <span>{subItem.label}</span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-3 mb-3">
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
        
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-gray-300 hover:bg-gray-800 hover:text-white ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Dil' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium">Dil</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;