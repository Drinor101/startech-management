import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Package, Settings, CheckSquare, Plus, ChevronDown } from 'lucide-react';
import { apiConfig } from '../../config/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import Modal from '../Common/Modal';
import ServiceForm from '../Services/ServiceForm';
import TaskForm from '../Tasks/TaskForm';
import TicketForm from '../Tickets/TicketForm';
import OrderForm from '../Orders/OrderForm';
import UserForm from '../Users/UserForm';
import CustomerForm from '../Customers/CustomerForm';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardProps {
  onNavigate?: (module: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [stats, setStats] = useState([
    { label: 'Servisi Aktivë', value: '0', icon: Settings, color: 'bg-blue-500' },
    { label: 'Taskat e Hapura', value: '0', icon: CheckSquare, color: 'bg-green-500' },
    { label: 'Porositë Sot', value: '0', icon: Package, color: 'bg-purple-500' },
    { label: 'Klientët', value: '0', icon: Users, color: 'bg-indigo-500' },
  ]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  
  // Modal states for forms
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Helper function to create readable activity text
  const getActivityText = (action: string, module: string, details: any, entityId?: string) => {
    const moduleNames: { [key: string]: string } = {
      'USERS': 'përdorues',
      'ORDERS': 'porosi',
      'PRODUCTS': 'produkt',
      'TASKS': 'task',
      'SERVICES': 'servis',
      'TICKETS': 'tiket',
      'CUSTOMERS': 'klient'
    };

    const actionNames: { [key: string]: string } = {
      'CREATE': 'u shtua',
      'UPDATE': 'u përditësua',
      'DELETE': 'u fshi',
      'VIEW': 'u shikua',
      'LOGIN': 'u kyç',
      'LOGOUT': 'u çkyç'
    };

    const moduleName = moduleNames[module] || module.toLowerCase();
    const actionName = actionNames[action] || action.toLowerCase();

    // Try to get more specific details from the details object
    let specificInfo = '';
    if (details && typeof details === 'object') {
      if (details.title) specificInfo = ` "${details.title}"`;
      else if (details.name) specificInfo = ` "${details.name}"`;
      else if (details.email) specificInfo = ` "${details.email}"`;
      else if (details.problem_description) specificInfo = ` "${details.problem_description.substring(0, 30)}..."`;
    }

    // Prefer showing entity ID when available
    const idPart = entityId || details?.entity_id;
    if (idPart) {
      specificInfo = ` ${idPart}`;
    }

    // Create more natural Albanian text
    if (action === 'CREATE') {
      if (module === 'CUSTOMERS') {
        return `klient i ri${specificInfo} u shtua`;
      } else if (module === 'TASKS') {
        return `task i ri${specificInfo} u shtua`;
      } else if (module === 'SERVICES') {
        return `servis i ri${specificInfo} u shtua`;
      } else if (module === 'ORDERS') {
        return `porosi e re${specificInfo} u shtua`;
      } else if (module === 'PRODUCTS') {
        return `produkt i ri${specificInfo} u shtua`;
      } else if (module === 'TICKETS') {
        return `tiket i ri${specificInfo} u shtua`;
      } else if (module === 'USERS') {
        return `përdorues i ri${specificInfo} u shtua`;
      } else {
        return `${moduleName} i ri${specificInfo} u shtua`;
      }
    } else if (action === 'UPDATE') {
      if (module === 'CUSTOMERS') {
        return `klient${specificInfo} u përditësua`;
      } else if (module === 'TASKS') {
        return `task${specificInfo} u përditësua`;
      } else if (module === 'SERVICES') {
        return `servis${specificInfo} u përditësua`;
      } else if (module === 'ORDERS') {
        return `porosi${specificInfo} u përditësua`;
      } else if (module === 'PRODUCTS') {
        return `produkt${specificInfo} u përditësua`;
      } else if (module === 'TICKETS') {
        return `tiket${specificInfo} u përditësua`;
      } else if (module === 'USERS') {
        return `përdorues${specificInfo} u përditësua`;
      } else {
        return `${moduleName}${specificInfo} u përditësua`;
      }
    } else if (action === 'DELETE') {
      if (module === 'CUSTOMERS') {
        return `klient${specificInfo} u fshi`;
      } else if (module === 'TASKS') {
        return `task${specificInfo} u fshi`;
      } else if (module === 'SERVICES') {
        return `servis${specificInfo} u fshi`;
      } else if (module === 'ORDERS') {
        return `porosi${specificInfo} u fshi`;
      } else if (module === 'PRODUCTS') {
        return `produkt${specificInfo} u fshi`;
      } else if (module === 'TICKETS') {
        return `tiket${specificInfo} u fshi`;
      } else if (module === 'USERS') {
        return `përdorues${specificInfo} u fshi`;
      } else {
        return `${moduleName}${specificInfo} u fshi`;
      }
    } else if (action === 'VIEW') {
      if (module === 'CUSTOMERS') {
        return `klient${specificInfo} u shikua`;
      } else if (module === 'TASKS') {
        return `task${specificInfo} u shikua`;
      } else if (module === 'SERVICES') {
        return `servis${specificInfo} u shikua`;
      } else if (module === 'ORDERS') {
        return `porosi${specificInfo} u shikua`;
      } else if (module === 'PRODUCTS') {
        return `produkt${specificInfo} u shikua`;
      } else if (module === 'TICKETS') {
        return `tiket${specificInfo} u shikua`;
      } else if (module === 'USERS') {
        return `përdorues${specificInfo} u shikua`;
      } else {
        return `${moduleName}${specificInfo} u shikua`;
      }
    } else {
      return `${actionName} ${moduleName}${specificInfo}`;
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const apiUrl = apiConfig.baseURL;
      
      // Get user ID for authentication (backend expects X-User-ID header)
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const headers = {
        'Content-Type': 'application/json',
        ...(user.id && { 'X-User-ID': user.id })
      };
      
      console.log('Dashboard Headers:', headers);
      console.log('User from localStorage:', user);
      
      // Fetch all data in parallel
      const [servicesRes, tasksRes, ticketsRes, ordersRes, customersRes, activitiesRes] = await Promise.all([
        fetch(`${apiUrl}/api/services`, { headers }),
        fetch(`${apiUrl}/api/tasks`, { headers }),
        fetch(`${apiUrl}/api/tickets`, { headers }),
        fetch(`${apiUrl}/api/orders`, { headers }),
        fetch(`${apiUrl}/api/customers`, { headers }),
        fetch(`${apiUrl}/api/activity/activity-logs?limit=10&order=desc`, { headers })
      ]);

      const [servicesData, tasksData, ticketsData, ordersData, customersData, activitiesData] = await Promise.all([
        servicesRes.ok ? servicesRes.json() : { data: [] },
        tasksRes.ok ? tasksRes.json() : { data: [] },
        ticketsRes.ok ? ticketsRes.json() : { data: [] },
        ordersRes.ok ? ordersRes.json() : { data: [] },
        customersRes.ok ? customersRes.json() : { data: [] },
        activitiesRes.ok ? activitiesRes.json() : { data: [] }
      ]);

      console.log('API Responses:', {
        services: servicesData,
        tasks: tasksData,
        tickets: ticketsData,
        orders: ordersData,
        customers: customersData,
        activities: activitiesData
      });

      const servicesDataArray = servicesData.data || servicesData || [];
      const tasksDataArray = tasksData.data || tasksData || [];
      const ticketsDataArray = ticketsData.data || ticketsData || [];
      const ordersDataArray = ordersData.data || ordersData || [];
      const customers = customersData.data || customersData || [];
      const activities = activitiesData.data || activitiesData || [];
      
      // Set state for chart data
      setServices(servicesDataArray);
      setTasks(tasksDataArray);
      setTickets(ticketsDataArray);
      setOrders(ordersDataArray);
      setCustomers(customers);

      // Update stats with real data
      const activeServices = servicesDataArray.filter((s: any) => s.status === 'in-progress');
      const openTasks = tasksDataArray.filter((t: any) => t.status === 'todo' || t.status === 'in-progress');
      
      console.log('Stats Calculation:', {
        totalServices: servicesDataArray.length,
        activeServices: activeServices.length,
        servicesStatuses: servicesDataArray.map(s => s.status),
        totalTasks: tasksDataArray.length,
        openTasks: openTasks.length,
        tasksStatuses: tasksDataArray.map(t => t.status)
      });

      setStats([
        { 
          label: 'Servisi Aktivë', 
          value: activeServices.length > 0 ? activeServices.length.toString() : servicesDataArray.length.toString(), 
          icon: Settings, 
          color: 'bg-blue-500'
        },
        { 
          label: 'Taskat e Hapura', 
          value: openTasks.length > 0 ? openTasks.length.toString() : tasksDataArray.length.toString(), 
          icon: CheckSquare, 
          color: 'bg-green-500'
        },
        { 
          label: 'Porositë Sot', 
          value: (() => {
            const today = new Date().toISOString().split('T')[0];
            const todayOrders = ordersDataArray.filter((o: any) => {
              const orderDate = o.created_at || o.createdAt;
              return orderDate && orderDate.startsWith(today);
            });
            console.log('Today Orders Debug:', {
              today,
              totalOrders: ordersDataArray.length,
              todayOrders: todayOrders.length,
              orderDates: ordersDataArray.map(o => o.created_at || o.createdAt)
            });
            return todayOrders.length > 0 ? todayOrders.length.toString() : ordersDataArray.length.toString();
          })(), 
          icon: Package, 
          color: 'bg-purple-500'
        },
        { 
          label: 'Klientët', 
          value: customers.length.toString(), 
          icon: Users, 
          color: 'bg-indigo-500'
        },
      ]);

      // Process recent activities from file logs
      const formattedActivities = activities.map((activity: any) => {
        const actionText = getActivityText(activity.action, activity.module, activity.details, activity.entity_id);
        return {
          id: activity.timestamp + activity.user_id,
          action: actionText,
          user: activity.user_name || 'Sistemi',
          time: new Date(activity.timestamp).toLocaleString('sq-AL'),
          module: activity.module,
          actionType: activity.action
        };
      });
      
      // If no activities, show a default message
      if (formattedActivities.length === 0) {
        setRecentActivities([{
          id: 'no-activity',
          action: 'Nuk ka aktivitet të fundit',
          user: 'Sistemi',
          time: new Date().toLocaleString('sq-AL')
        }]);
      } else {
        setRecentActivities(formattedActivities);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const newItemOptions = [
    { label: 'Servis i ri', icon: Settings, color: 'text-blue-600', action: () => openForm('service') },
    { label: 'Task i ri', icon: CheckSquare, color: 'text-green-600', action: () => openForm('task') },
    { label: 'Tiket i ri', icon: CheckSquare, color: 'text-purple-600', action: () => openForm('ticket') },
    { label: 'Porosi e re', icon: Package, color: 'text-purple-600', action: () => openForm('order') },
    { label: 'Përdorues i ri', icon: Users, color: 'text-orange-600', action: () => openForm('user') },
    { label: 'Klient i ri', icon: Users, color: 'text-blue-600', action: () => openForm('customer') },
  ];

  const openForm = (type: string) => {
    setFormType(type);
    setSelectedItem(null);
    setIsEditMode(false);
    setIsFormOpen(true);
    setShowNewMenu(false);
  };

  const getFormTitle = (type: string) => {
    const titles = {
      service: 'Servis',
      task: 'Task',
      ticket: 'Tiket',
      order: 'Porosi',
      user: 'Përdorues',
      customer: 'Klient'
    };
    return titles[type as keyof typeof titles] || 'Item';
  };

  const handleNewItem = (action: () => void) => {
    action();
    setShowNewMenu(false);
  };

  // Chart data for service requests trend (using real data)
  const generateChartData = (services: any[], tasks: any[], customers: any[]) => {
    const months = ['Jan', 'Shk', 'Mar', 'Pri', 'Maj', 'Qer', 'Kor', 'Gus', 'Sht', 'Tet', 'Nën', 'Dhj'];
    const currentMonth = new Date().getMonth();
     
    // Generate data for last 6 months
    const serviceData = [];
    const taskData = [];
    const customerData = [];
    
    for (let i = 5; i >= 0; i--) {
      const targetMonth = new Date();
      targetMonth.setMonth(currentMonth - i);
      const monthStart = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
      const monthEnd = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);
      
      const servicesInMonth = services.filter(s => {
        const createdDate = new Date(s.createdAt);
        return createdDate >= monthStart && createdDate <= monthEnd;
      }).length;
      
      const tasksInMonth = tasks.filter(t => {
        const createdDate = new Date(t.createdAt);
        return createdDate >= monthStart && createdDate <= monthEnd;
      }).length;
      
      const customersInMonth = customers.filter(c => {
        const createdDate = new Date(c.created_at || c.createdAt);
        return createdDate >= monthStart && createdDate <= monthEnd;
      }).length;
      
      serviceData.push(servicesInMonth);
      taskData.push(tasksInMonth);
      customerData.push(customersInMonth);
    }
    
    return {
      labels: months.slice(currentMonth - 5, currentMonth + 1),
      datasets: [
        {
          label: 'Servisi të Krijuar',
          data: serviceData,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Taskat e Krijuar',
          data: taskData,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Klientët e Regjistruar',
          data: customerData,
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.4,
          fill: true,
        }
      ],
    };
  };

  const chartData = generateChartData(services, tasks, customers);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        }
      },
      x: {
        grid: {
          display: false,
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
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
          <span className="text-lg text-gray-600">Po ngarkohen të dhënat...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with New Button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Përmbledhja</h1>
          <p className="text-sm text-gray-500 mt-1">Mirë se vini në Startech Management System</p>
        </div>
        
        {/* Hap të re Button */}
        <div className="relative">
          <button
            onClick={() => setShowNewMenu(!showNewMenu)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Hap të re</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showNewMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {showNewMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
              {newItemOptions.map((option, index) => {
                const Icon = option.icon;
                return (
                  <button
                    key={index}
                    onClick={() => handleNewItem(option.action)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors"
                  >
                    <Icon className={`w-4 h-4 ${option.color}`} />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Placeholder */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Tendenca e Kërkesave për Servis</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Aktivitetet e Fundit</h3>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    by {activity.user} • {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* Click outside to close dropdown */}
      {showNewMenu && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowNewMenu(false)}
        />
      )}

      {/* Modal Forms */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={`${isEditMode ? 'Modifiko' : 'Shto'} ${getFormTitle(formType)}`}
        size="lg"
      >
        {formType === 'service' && (
          <ServiceForm
            service={selectedItem}
            onClose={() => setIsFormOpen(false)}
            onSuccess={() => {
              setIsFormOpen(false);
              fetchDashboardData(); // Refresh data
            }}
          />
        )}
        {formType === 'task' && (
          <TaskForm
            task={selectedItem}
            onClose={() => setIsFormOpen(false)}
            onSuccess={() => {
              setIsFormOpen(false);
              fetchDashboardData(); // Refresh data
            }}
          />
        )}
        {formType === 'ticket' && (
          <TicketForm
            ticket={selectedItem}
            onClose={() => setIsFormOpen(false)}
            onSuccess={() => {
              setIsFormOpen(false);
              fetchDashboardData(); // Refresh data
            }}
          />
        )}
        {formType === 'order' && (
          <OrderForm
            order={selectedItem}
            onClose={() => setIsFormOpen(false)}
            onSuccess={() => {
              setIsFormOpen(false);
              fetchDashboardData(); // Refresh data
            }}
          />
        )}
        {formType === 'user' && (
          <UserForm
            user={selectedItem}
            onClose={() => setIsFormOpen(false)}
            onSuccess={() => {
              setIsFormOpen(false);
              fetchDashboardData(); // Refresh data
            }}
          />
        )}
        {formType === 'customer' && (
          <CustomerForm
            customer={selectedItem}
            onClose={() => setIsFormOpen(false)}
            onSuccess={() => {
              setIsFormOpen(false);
              fetchDashboardData(); // Refresh data
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;