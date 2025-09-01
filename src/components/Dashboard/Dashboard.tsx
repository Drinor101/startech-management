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

const Dashboard: React.FC = () => {
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [stats, setStats] = useState([
    { label: 'Servisi Aktivë', value: '0', icon: Settings, color: 'bg-blue-500', change: '+0%' },
    { label: 'Taskat e Hapura', value: '0', icon: CheckSquare, color: 'bg-green-500', change: '+0%' },
    { label: 'Porositë Sot', value: '0', icon: Package, color: 'bg-purple-500', change: '+0%' },
    { label: 'Klientët', value: '0', icon: Users, color: 'bg-orange-500', change: '+0%' },
  ]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'https://startech-management-production.up.railway.app';
      
      // Fetch all data in parallel
      const [servicesRes, tasksRes, ordersRes, customersRes, reportsRes] = await Promise.all([
        fetch(`${apiUrl}/api/services`),
        fetch(`${apiUrl}/api/tasks`),
        fetch(`${apiUrl}/api/orders`),
        fetch(`${apiUrl}/api/customers`),
        fetch(`${apiUrl}/api/reports`)
      ]);

      const [services, tasks, orders, customers, reports] = await Promise.all([
        servicesRes.ok ? servicesRes.json() : [],
        tasksRes.ok ? tasksRes.json() : [],
        ordersRes.ok ? ordersRes.json() : [],
        customersRes.ok ? customersRes.json() : [],
        reportsRes.ok ? reportsRes.json() : []
      ]);

      // Update stats with real data
      setStats([
        { 
          label: 'Servisi Aktivë', 
          value: services.filter((s: any) => s.status === 'in-progress').length.toString(), 
          icon: Settings, 
          color: 'bg-blue-500', 
          change: '+12%' 
        },
        { 
          label: 'Taskat e Hapura', 
          value: tasks.filter((t: any) => t.status === 'todo' || t.status === 'in-progress').length.toString(), 
          icon: CheckSquare, 
          color: 'bg-green-500', 
          change: '+8%' 
        },
        { 
          label: 'Porositë Sot', 
          value: orders.filter((o: any) => {
            const today = new Date().toISOString().split('T')[0];
            return o.created_at?.startsWith(today);
          }).length.toString(), 
          icon: Package, 
          color: 'bg-purple-500', 
          change: '+15%' 
        },
        { 
          label: 'Klientët', 
          value: customers.length.toString(), 
          icon: Users, 
          color: 'bg-orange-500', 
          change: '+5%' 
        },
      ]);

      // Set recent activities (you can customize this based on your needs)
      setRecentActivities([
        { id: 1, action: 'Kërkesë e re për servis u krijua', user: 'Sistemi', time: '2 min më parë' },
        { id: 2, action: 'Porosi e re u regjistrua', user: 'Sistemi', time: '15 min më parë' },
        { id: 3, action: 'Task i ri u krijuar', user: 'Sistemi', time: '1 orë më parë' },
        { id: 4, action: 'Klient i ri u regjistrua', user: 'Sistemi', time: '2 orë më parë' },
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const newItemOptions = [
    { label: 'Servis i ri', icon: Settings, color: 'text-blue-600', action: () => console.log('New Service') },
    { label: 'Task i ri', icon: CheckSquare, color: 'text-green-600', action: () => console.log('New Task') },
    { label: 'Tiket i ri', icon: CheckSquare, color: 'text-purple-600', action: () => console.log('New Ticket') },
    { label: 'Porosi e re', icon: Package, color: 'text-purple-600', action: () => console.log('New Order') },
    { label: 'Produkt i ri', icon: Package, color: 'text-orange-600', action: () => console.log('New Product') },
    { label: 'Përdorues i ri', icon: Users, color: 'text-orange-600', action: () => console.log('New User') },
  ];

  const handleNewItem = (action: () => void) => {
    action();
    setShowNewMenu(false);
  };

  // Chart data for service requests trend
  const chartData = {
    labels: ['Jan', 'Shk', 'Mar', 'Pri', 'Maj', 'Qer', 'Kor', 'Gus', 'Sht', 'Tet', 'Nën', 'Dhj'],
    datasets: [
      {
        label: 'Kërkesat për Servis',
        data: [12, 19, 15, 25, 22, 30, 28, 35, 32, 40, 38, 45],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Servisi të Përfunduar',
        data: [10, 15, 12, 20, 18, 25, 23, 30, 28, 35, 32, 40],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ],
  };

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

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Veprime të Shpejta</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 text-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Settings className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <span className="text-sm font-medium">Servis i Ri</span>
          </button>
          <button className="p-4 text-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <CheckSquare className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <span className="text-sm font-medium">Krijo Task</span>
          </button>
          <button className="p-4 text-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Package className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <span className="text-sm font-medium">Porosi e Re</span>
          </button>
          <button className="p-4 text-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Users className="w-6 h-6 text-orange-600 mx-auto mb-2" />
            <span className="text-sm font-medium">Shto Klient</span>
          </button>
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