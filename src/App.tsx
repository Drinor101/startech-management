import React, { useState } from 'react';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './components/Dashboard/Dashboard';
import ServicesList from './components/Services/ServicesList';
import TasksList from './components/Tasks/TasksList';
import OrdersList from './components/Orders/OrdersList';
import ProductsList from './components/Products/ProductsList';
import Reports from './components/Reports/Reports';
import UsersList from './components/Users/UsersList';
import { mockUsers } from './data/mockData';

function App() {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentUser] = useState(mockUsers[0]); // Administrator

  const getModuleTitle = (module: string) => {
    const titles = {
      dashboard: 'Dashboard',
      services: 'Services',
      tasks: 'Tasks & Tickets',
      orders: 'Orders',
      products: 'Products',
      reports: 'Reports',
      users: 'Users',
      settings: 'Settings'
    };
    return titles[module as keyof typeof titles] || 'Startech';
  };

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard />;
      case 'services':
        return <ServicesList />;
      case 'tasks':
        return <TasksList />;
      case 'orders':
        return <OrdersList />;
      case 'products':
        return <ProductsList />;
      case 'reports':
        return <Reports />;
      case 'users':
        return <UsersList />;
      case 'settings':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <p className="text-gray-600">Settings module would be implemented here.</p>
            </div>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

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

export default App;