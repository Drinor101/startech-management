import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Package, Settings, CheckSquare, Plus, ChevronDown } from 'lucide-react';
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
    { label: 'Servisi Aktivë', value: '0', icon: Settings, color: 'bg-blue-500', change: '+0%' },
    { label: 'Taskat e Hapura', value: '0', icon: CheckSquare, color: 'bg-green-500', change: '+0%' },
    { label: 'Porositë Sot', value: '0', icon: Package, color: 'bg-purple-500', change: '+0%' },
    { label: 'Produktet', value: '0', icon: Package, color: 'bg-indigo-500', change: '+0%' },
  ]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'https://startech-management-production.up.railway.app';
      
      // Get user ID for authentication (backend expects X-User-ID header)
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const headers = {
        'Content-Type': 'application/json',
        ...(user.id && { 'X-User-ID': user.id })
      };
      
      console.log('Dashboard Headers:', headers);
      console.log('User from localStorage:', user);
      
      // Fetch all data in parallel
      const [servicesRes, tasksRes, ticketsRes, ordersRes, customersRes, productsRes] = await Promise.all([
        fetch(`${apiUrl}/api/services`, { headers }),
        fetch(`${apiUrl}/api/tasks`, { headers }),
        fetch(`${apiUrl}/api/tickets`, { headers }),
        fetch(`${apiUrl}/api/orders`, { headers }),
        fetch(`${apiUrl}/api/customers`, { headers }),
        fetch(`${apiUrl}/api/products?page=1&limit=10`, { headers })
      ]);

      const [servicesData, tasksData, ticketsData, ordersData, customersData, productsData] = await Promise.all([
        servicesRes.ok ? servicesRes.json() : { data: [] },
        tasksRes.ok ? tasksRes.json() : { data: [] },
        ticketsRes.ok ? ticketsRes.json() : { data: [] },
        ordersRes.ok ? ordersRes.json() : { data: [] },
        customersRes.ok ? customersRes.json() : { data: [] },
        productsRes.ok ? productsRes.json() : { data: [] }
      ]);

      console.log('API Responses:', {
        services: servicesData,
        tasks: tasksData,
        tickets: ticketsData,
        orders: ordersData,
        customers: customersData,
        products: productsData
      });

      const servicesDataArray = servicesData.data || servicesData || [];
      const tasksDataArray = tasksData.data || tasksData || [];
      const ticketsDataArray = ticketsData.data || ticketsData || [];
      const ordersDataArray = ordersData.data || ordersData || [];
      const customers = customersData.data || customersData || [];
      const products = productsData.data || productsData || [];
      
      // Set state for chart data
      setServices(servicesDataArray);
      setTasks(tasksDataArray);
      setTickets(ticketsDataArray);
      setOrders(ordersDataArray);
      setProducts(products);

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
          color: 'bg-blue-500', 
          change: '+12%' 
        },
        { 
          label: 'Taskat e Hapura', 
          value: openTasks.length > 0 ? openTasks.length.toString() : tasksDataArray.length.toString(), 
          icon: CheckSquare, 
          color: 'bg-green-500', 
          change: '+8%' 
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
          color: 'bg-purple-500', 
          change: '+15%' 
        },
        { 
          label: 'Produktet', 
          value: products.length.toString(), 
          icon: Package, 
          color: 'bg-indigo-500', 
          change: '+5%' 
        },
      ]);

      // Set recent activities based on real data
      const recentActivities = [];
      
      console.log('Dashboard Data:', {
        services: servicesDataArray.length,
        tasks: tasksDataArray.length,
        tickets: ticketsDataArray.length,
        orders: ordersDataArray.length
      });
      
      // Add recent services (latest 2)
      const recentServices = servicesDataArray
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 2);
      
      recentServices.forEach((service) => {
        recentActivities.push({
          id: `service-${service.id}`,
          action: `Servis i ri u krijua: ${service.id}`,
          user: service.createdBy || 'Sistemi',
          time: new Date(service.createdAt).toLocaleString('sq-AL')
        });
      });
      
      // Add recent tasks (latest 2)
      const recentTasks = tasksDataArray
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 2);
      
      recentTasks.forEach((task) => {
        recentActivities.push({
          id: `task-${task.id}`,
          action: `Task i ri u krijua: ${task.title}`,
          user: task.createdBy || 'Sistemi',
          time: new Date(task.createdAt).toLocaleString('sq-AL')
        });
      });
      
      // Add recent tickets (latest 1)
      const recentTickets = ticketsDataArray
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 1);
      
      recentTickets.forEach((ticket) => {
        recentActivities.push({
          id: `ticket-${ticket.id}`,
          action: `Tiket i ri u krijua: ${ticket.id}`,
          user: ticket.createdBy || 'Sistemi',
          time: new Date(ticket.createdAt).toLocaleString('sq-AL')
        });
      });
      
      // Add recent orders (latest 1)
      const recentOrders = ordersDataArray
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 1);
      
      recentOrders.forEach((order) => {
        recentActivities.push({
          id: `order-${order.id}`,
          action: `Porosi e re u regjistrua: ${order.id}`,
          user: 'Sistemi',
          time: new Date(order.createdAt).toLocaleString('sq-AL')
        });
      });
      
      // Add recent products (latest 1)
      const recentProducts = products
        .sort((a, b) => new Date(b.lastSyncDate || b.createdAt) - new Date(a.lastSyncDate || a.createdAt))
        .slice(0, 1);
      
      recentProducts.forEach((product) => {
        recentActivities.push({
          id: `product-${product.id}`,
          action: `Produkt i ri u shtua: ${product.title}`,
          user: 'WooCommerce',
          time: new Date(product.lastSyncDate || product.createdAt).toLocaleString('sq-AL')
        });
      });
      
      // Sort by creation time and take latest 4
      recentActivities.sort((a, b) => new Date(b.time) - new Date(a.time));
      console.log('Recent Activities:', recentActivities);
      
      // If no activities, show a default message
      if (recentActivities.length === 0) {
        setRecentActivities([
          {
            id: 'no-activities',
            action: 'Nuk ka aktivitete të reja',
            user: 'Sistemi',
            time: 'Tani'
          }
        ]);
      } else {
        setRecentActivities(recentActivities.slice(0, 4));
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const newItemOptions = [
    { label: 'Servis i ri', icon: Settings, color: 'text-blue-600', action: () => onNavigate?.('services') },
    { label: 'Task i ri', icon: CheckSquare, color: 'text-green-600', action: () => onNavigate?.('tasks') },
    { label: 'Tiket i ri', icon: CheckSquare, color: 'text-purple-600', action: () => onNavigate?.('tickets') },
    { label: 'Porosi e re', icon: Package, color: 'text-purple-600', action: () => onNavigate?.('orders') },
    { label: 'Produkt i ri', icon: Package, color: 'text-orange-600', action: () => onNavigate?.('products') },
    { label: 'Përdorues i ri', icon: Users, color: 'text-orange-600', action: () => onNavigate?.('users') },
    { label: 'Klient i ri', icon: Users, color: 'text-blue-600', action: () => onNavigate?.('customers') },
  ];

  const handleNewItem = (action: () => void) => {
    action();
    setShowNewMenu(false);
  };

  // Chart data for service requests trend (using real data)
  const generateChartData = (services: any[], tasks: any[], products: any[]) => {
    const months = ['Jan', 'Shk', 'Mar', 'Pri', 'Maj', 'Qer', 'Kor', 'Gus', 'Sht', 'Tet', 'Nën', 'Dhj'];
    const currentMonth = new Date().getMonth();
     
    // Generate data for last 6 months
    const serviceData = [];
    const taskData = [];
    const productData = [];
    
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
      
      const productsInMonth = products.filter(p => {
        const createdDate = new Date(p.lastSyncDate || p.createdAt);
        return createdDate >= monthStart && createdDate <= monthEnd;
      }).length;
      
      serviceData.push(servicesInMonth);
      taskData.push(tasksInMonth);
      productData.push(productsInMonth);
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
          label: 'Produktet e Sinkronizuar',
          data: productData,
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.4,
          fill: true,
        }
      ],
    };
  };

  const chartData = generateChartData(services, tasks, products);

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
              <div className="flex items-center mt-4">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 font-medium">{stat.change}</span>
                <span className="text-sm text-gray-500 ml-1">krahasuar me muajin e kaluar</span>
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
    </div>
  );
};

export default Dashboard;