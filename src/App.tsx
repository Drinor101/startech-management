import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { apiConfig } from './config/api';
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
import FileActivityLogs from './components/ActivityLogs/FileActivityLogs';

// New component for "Të gjitha" (All Tasks) - Uses real data like Dashboard
const AllTasks: React.FC = () => {
  const [stats, setStats] = useState({
    services: { total: 0, inProgress: 0, completed: 0 },
    tasks: { total: 0, inProgress: 0, completed: 0 },
    tickets: { total: 0, open: 0, closed: 0 }
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllTasksData();
  }, []);

  const fetchAllTasksData = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const headers = {
        'Content-Type': 'application/json',
        ...(user.id && { 'X-User-ID': user.id })
      };

      // Fetch all data in parallel
      const [servicesRes, tasksRes, ticketsRes] = await Promise.all([
        fetch(`${apiConfig.baseURL}/api/services`, { headers }),
        fetch(`${apiConfig.baseURL}/api/tasks`, { headers }),
        fetch(`${apiConfig.baseURL}/api/tickets`, { headers })
      ]);

      const [servicesData, tasksData, ticketsData] = await Promise.all([
        servicesRes.json(),
        tasksRes.json(),
        ticketsRes.json()
      ]);

      const services = servicesData.success ? servicesData.data : [];
      const tasks = tasksData.success ? tasksData.data : [];
      const tickets = ticketsData.success ? ticketsData.data : [];

      // Calculate statistics
      const activeServices = services.filter((s: any) => s.status === 'in-progress');
      const completedServices = services.filter((s: any) => s.status === 'completed');
      
      const inProgressTasks = tasks.filter((t: any) => t.status === 'in-progress');
      const completedTasks = tasks.filter((t: any) => t.status === 'completed');
      
      const openTickets = tickets.filter((t: any) => t.status === 'open');
      const closedTickets = tickets.filter((t: any) => t.status === 'closed');

      setStats({
        services: {
          total: services.length,
          inProgress: activeServices.length,
          completed: completedServices.length
        },
        tasks: {
          total: tasks.length,
          inProgress: inProgressTasks.length,
          completed: completedTasks.length
        },
        tickets: {
          total: tickets.length,
          open: openTickets.length,
          closed: closedTickets.length
        }
      });

      // Create recent activities
      const allActivities = [
        ...services.slice(0, 2).map((s: any) => ({
          type: 'service',
          message: 'Servis i ri u shtua',
          details: s.problem_description || 'Servis i ri',
          time: s.created_at || s.createdAt,
          color: 'bg-blue-600'
        })),
        ...tasks.slice(0, 2).map((t: any) => ({
          type: 'task',
          message: 'Task i ri u shtua',
          details: t.title || 'Task i ri',
          time: t.created_at || t.createdAt,
          color: 'bg-green-600'
        })),
        ...tickets.slice(0, 2).map((t: any) => ({
          type: 'ticket',
          message: 'Tiket i ri u shtua',
          details: t.subject || 'Tiket i ri',
          time: t.created_at || t.createdAt,
          color: 'bg-yellow-600'
        }))
      ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 6);

      setRecentActivities(allActivities);

    } catch (error) {
      console.error('Error fetching all tasks data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

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
              <span className="font-medium">{stats.services.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Në progres</span>
              <span className="font-medium text-blue-600">{stats.services.inProgress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Përfunduar</span>
              <span className="font-medium text-green-600">{stats.services.completed}</span>
            </div>
          </div>
        </div>

        {/* Tasks Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Taskat</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total</span>
              <span className="font-medium">{stats.tasks.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Në progres</span>
              <span className="font-medium text-blue-600">{stats.tasks.inProgress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Përfunduar</span>
              <span className="font-medium text-green-600">{stats.tasks.completed}</span>
            </div>
          </div>
        </div>

        {/* Tickets Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tiketat</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total</span>
              <span className="font-medium">{stats.tickets.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Hapur</span>
              <span className="font-medium text-yellow-600">{stats.tickets.open}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Mbyllur</span>
              <span className="font-medium text-green-600">{stats.tickets.closed}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Aktiviteti i fundit</h3>
        <div className="space-y-4">
          {recentActivities.length > 0 ? (
            recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 ${activity.color} rounded-full`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.message}</p>
                  <p className="text-xs text-gray-500">{activity.details}</p>
                </div>
                <span className="text-xs text-gray-400">
                  {activity.time ? new Date(activity.time).toLocaleString('sq-AL') : 'Së fundmi'}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              Nuk ka aktivitet të fundit
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const [activeModule, setActiveModule] = useState(() => {
    // Get the current module from URL or localStorage, default to dashboard
    const urlModule = window.location.pathname.replace('/', '') || 'dashboard';
    const savedModule = localStorage.getItem('activeModule') || 'dashboard';
    return urlModule !== 'dashboard' ? urlModule : savedModule;
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, loading } = useAuth();

  // Save active module to localStorage and update URL
  useEffect(() => {
    localStorage.setItem('activeModule', activeModule);
    // Update URL without causing a page reload
    window.history.replaceState({}, '', `/${activeModule}`);
  }, [activeModule]);

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
      'file-activity-logs': 'File Activity Logs',
      'activity-logs': 'Database Activity Logs',
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
      case 'file-activity-logs':
        return <FileActivityLogs />;
      case 'activity-logs':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Database Activity Logs</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <p className="text-gray-600">Database activity logs will be implemented here.</p>
            </div>
          </div>
        );
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
    name: user.name || user.email.split('@')[0], // Use name or email prefix as name
    email: user.email,
    role: user.role, // Use the actual role from database
    avatar: `https://ui-avatars.com/api/?name=${user.name || user.email.split('@')[0]}&background=3b82f6&color=fff`,
    isActive: true,
    credits: 0, // Default credits for new users
    lastLogin: new Date().toISOString()
  } : {
    id: '',
    name: 'Guest',
    email: '',
    role: 'guest',
    isActive: false,
    credits: 0,
    lastLogin: new Date().toISOString()
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
          onModuleChange={setActiveModule}
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