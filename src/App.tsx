import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginForm from './components/LoginForm';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './components/Dashboard/Dashboard';
import ServicesList from './components/Services/ServicesList';
import TasksList from './components/Tasks/TasksList';
import TicketsList from './components/Tickets/TicketsList';
import OrdersList from './components/Orders/OrdersList';
import ProductsList from './components/Products/ProductsList';
import Reports from './components/Reports/Reports';
import UsersList from './components/Users/UsersList';
import CustomersList from './components/Customers/CustomersList';
import { mockUsers } from './data/mockData';

// New component for "Të gjitha" (All Tasks)
const AllTasks: React.FC = () => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Të gjitha Detyrat</h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Services Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Servisi</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total</span>
              <span className="font-medium">47</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Në progres</span>
              <span className="font-medium text-blue-600">12</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Përfunduar</span>
              <span className="font-medium text-green-600">32</span>
            </div>
          </div>
        </div>

        {/* Tasks Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Taskat</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total</span>
              <span className="font-medium">156</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Në progres</span>
              <span className="font-medium text-blue-600">45</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Përfunduar</span>
              <span className="font-medium text-green-600">89</span>
            </div>
          </div>
        </div>

        {/* Tickets Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tiketat</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total</span>
              <span className="font-medium">89</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Hapur</span>
              <span className="font-medium text-yellow-600">23</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Mbyllur</span>
              <span className="font-medium text-green-600">66</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Aktiviteti i fundit</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium">Servis i ri u shtua</p>
              <p className="text-xs text-gray-500">Repair laptop - Alice Johnson</p>
            </div>
            <span className="text-xs text-gray-400">2 min më parë</span>
          </div>
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium">Task u përfundua</p>
              <p className="text-xs text-gray-500">Update product catalog</p>
            </div>
            <span className="text-xs text-gray-400">15 min më parë</span>
          </div>
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium">Tiket i ri</p>
              <p className="text-xs text-gray-500">Customer complaint - Bob Smith</p>
            </div>
            <span className="text-xs text-gray-400">1 orë më parë</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, loading } = useAuth();

  console.log('AppContent render:', { 
    user: user?.id, 
    userEmail: user?.email,
    loading,
    hasUser: !!user,
    userRole: user?.role
  });

  // Show login form if no user
  if (!user) {
    console.log('No user, showing login form');
    return <LoginForm />;
  }

  // Show loading spinner if loading
  if (loading) {
    console.log('Loading, showing spinner');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <svg
            className="animate-spin h-8 w-8 text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span className="text-lg text-gray-600">Po ngarkohet...</span>
        </div>
      </div>
    );
  }

  console.log('User authenticated, showing app');

  const getModuleTitle = (module: string) => {
    const titles = {
      dashboard: 'Përmbledhja',
      'all-tasks': 'Të gjitha Detyrat',
      services: 'Servisi',
      tasks: 'Taskat',
      tickets: 'Tiketat',
      orders: 'Porositë',
      products: 'Produktet',
      reports: 'Raportet',
      users: 'Përdoruesit',
      customers: 'Klientët',
      settings: 'Cilësimet'
    };
    return titles[module as keyof typeof titles] || 'Startech';
  };

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveModule} />;
      case 'all-tasks':
        return <AllTasks />;
      case 'services':
        return <ServicesList />;
      case 'tasks':
        return <TasksList />;
      case 'tickets':
        return <TicketsList />;
      case 'orders':
        return <OrdersList />;
      case 'products':
        return <ProductsList />;
      case 'reports':
        return <Reports />;
      case 'users':
        return <UsersList />;
      case 'customers':
        return <CustomersList />;
      case 'settings':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Cilësimet</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <p className="text-gray-600">Moduli i cilësimeve do të implementohet këtu.</p>
            </div>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  // Convert user to the format expected by Sidebar
  const currentUser = user ? {
    id: user.id,
    name: user.email.split('@')[0], // Use email prefix as name
    email: user.email,
    role: (user.role === 'admin' ? 'Administrator' : 'Support Agent') as 'Administrator' | 'Manager' | 'E-commerce' | 'Technician' | 'Marketing' | 'Design' | 'Support Agent' | 'Customer',
    avatar: `https://ui-avatars.com/api/?name=${user.email.split('@')[0]}&background=3b82f6&color=fff`,
    isActive: true,
    credits: 0, // Default credits for new users
    lastLogin: new Date().toISOString()
  } : mockUsers[0];

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        currentUser={currentUser}
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        collapsed={sidebarCollapsed}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={getModuleTitle(activeModule)}
        />
        
        <main className="flex-1 overflow-y-auto">
          {renderActiveModule()}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;