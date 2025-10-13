import React, { useState, useEffect } from 'react';
import { Download, Filter, Calendar, FileText, TrendingUp, Users, Shield, UserX, ChevronDown } from 'lucide-react';
import { apiCall, apiConfig } from '../../config/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState('services');
  const [dateRange, setDateRange] = useState('this-month');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userActivity, setUserActivity] = useState<any[]>([]);
  // const [selectedUser, setSelectedUser] = useState<string>('');
  // const [users, setUsers] = useState<any[]>([]);

  const tabs = [
    { id: 'services', label: 'Servisi' },
    { id: 'tasks', label: 'Taskat & Tiketat' },
    { id: 'orders', label: 'Porositë' },
    { id: 'products', label: 'Produktet' },
    { id: 'users', label: 'Përdoruesit' },
  ];

  // Fetch real report data
  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiCall(`${apiConfig.endpoints.reports}/dashboard?startDate=${getDateRangeStart()}&endDate=${getDateRangeEnd()}`);
        console.log('Reports API response:', response);
        
        if (response.success) {
          console.log('Dashboard data received:', response.data);
          setReportData(response.data);
        } else {
          console.error('Failed to fetch dashboard data:', response.error);
          setError('Gabim në ngarkimin e raporteve');
        }
      } catch (err) {
        console.error('Error fetching reports:', err);
        setError('Gabim në ngarkimin e raporteve');
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [dateRange]);

  // Fetch users list
  // useEffect(() => {
  //   const fetchUsers = async () => {
  //     try {
  //       const response = await apiCall('/api/users');
  //       console.log('Users API response:', response);
  //       if (response.success) {
  //         setUsers(response.data || []);
  //       }
  //     } catch (err) {
  //       console.error('Error fetching users:', err);
  //     }
  //   };

  //   if (activeTab === 'users') {
  //     fetchUsers();
  //   }
  // }, [activeTab]);

  // Fetch user activity
  useEffect(() => {
    const fetchUserActivity = async () => {
      try {
        const params = new URLSearchParams();
        params.append('limit', '50');
        // if (selectedUser) {
        //   params.append('userId', selectedUser);
        // }
        console.log('Fetching user activity with params:', params.toString());
        const response = await apiCall(`/api/activity/activity-logs?${params.toString()}`);
        console.log('User activity response:', response);
        if (response.success) {
          setUserActivity(response.data || []);
        } else {
          console.error('Failed to fetch user activity:', response.error);
          setUserActivity([]);
        }
      } catch (err) {
        console.error('Error fetching user activity:', err);
        setUserActivity([]);
      }
    };

    if (activeTab === 'users') {
      fetchUserActivity();
    }
  }, [activeTab]);

  const mockReportData = {
    services: {
      total: 47,
      completed: 32,
      inProgress: 12,
      pending: 3
    },
    tasks: {
      total: 156,
      completed: 89,
      inProgress: 45,
      pending: 22
    },
    orders: {
      total: 234,
      delivered: 198,
      processing: 24,
      pending: 12,
      totalValue: 45678.90,
      averageValue: 195.21
    },
    products: {
      total: 145,
      active: 132,
      inactive: 13
    },
  };

  // Transform real data to match expected structure
  const getCurrentData = () => {
    console.log('getCurrentData called for tab:', activeTab);
    console.log('reportData:', reportData);
    
    if (!reportData) {
      console.log('No reportData, using mock data');
      return mockReportData[activeTab as keyof typeof mockReportData];
    }
    
    const realData = reportData[activeTab];
    console.log('Real data for', activeTab, ':', realData);
    
    if (!realData) {
      console.log('No real data for', activeTab, ', using mock data');
      return mockReportData[activeTab as keyof typeof mockReportData];
    }
    
    // Transform real data to match frontend expectations
    switch (activeTab) {
      case 'services':
        const servicesData = {
          total: realData.total || 0,
          completed: realData.completed || 0,
          inProgress: realData.inProgress || 0,
          pending: realData.received || 0
        };
        console.log('Services data transformed:', servicesData);
        return servicesData;
      case 'tasks':
        const tasksData = {
          total: realData.total || 0,
          completed: realData.done || 0,
          inProgress: realData.inProgress || 0,
          pending: realData.todo || 0
        };
        console.log('Tasks data transformed:', tasksData);
        return tasksData;
      case 'orders':
        const ordersData = {
          total: realData.total || 0,
          delivered: realData.delivered || 0,
          processing: realData.processing || 0,
          pending: realData.pending || 0,
          totalValue: realData.totalRevenue || 0,
          averageValue: realData.total > 0 ? (realData.totalRevenue / realData.total) : 0
        };
        console.log('Orders data transformed:', ordersData);
        return ordersData;
      case 'products':
        const productsData = {
          total: realData.total || 0,
          active: realData.active || 0,
          inactive: realData.inactive || 0
        };
        console.log('Products data transformed:', productsData);
        return productsData;
      case 'users':
        const usersData = {
          total: realData.total || 0,
          active: realData.active || 0,
          inactive: realData.inactive || 0,
          byRole: realData.byRole || []
        };
        console.log('Users data transformed:', usersData);
        return usersData;
      default:
        return realData;
    }
  };

  const currentData = getCurrentData();

  // Function to translate date range values to Albanian
  const translateDateRange = (range: string) => {
    const translations: { [key: string]: string } = {
      'today': 'Sot',
      'this-week': 'Këtë Javë',
      'this-month': 'Këtë Muaj',
      'last-month': 'Muajin e Kaluar',
      'this-year': 'Këtë Vit'
    };
    return translations[range] || range;
  };

  // Helper functions for date range calculation
  const getDateRangeStart = () => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      case 'this-week':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        return startOfWeek.toISOString();
      case 'this-month':
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      case 'last-month':
        return new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      case 'this-year':
        return new Date(now.getFullYear(), 0, 1).toISOString();
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    }
  };

  const getDateRangeEnd = () => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
      case 'this-week':
        const endOfWeek = new Date(now);
        endOfWeek.setDate(now.getDate() - now.getDay() + 6);
        endOfWeek.setHours(23, 59, 59);
        return endOfWeek.toISOString();
      case 'this-month':
        return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
      case 'last-month':
        return new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
      case 'this-year':
        return new Date(now.getFullYear(), 11, 31, 23, 59, 59).toISOString();
      default:
        return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    }
  };

  // Chart data for reports - using real filtered data
  const getChartData = () => {
    const labels = ['Jan', 'Shk', 'Mar', 'Pri', 'Maj', 'Qer', 'Kor', 'Gus', 'Sht', 'Tet', 'Nën', 'Dhj'];
    
    // Generate data based on current date range and active tab
    const generateMonthlyData = (data: any[], statusField: string, statusValue?: string) => {
      const months = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]; // 0-11 for months
      const currentYear = new Date().getFullYear();
      
      return months.map(month => {
        const monthStart = new Date(currentYear, month, 1);
        const monthEnd = new Date(currentYear, month + 1, 0);
        
        return data.filter(item => {
          const itemDate = new Date(item.created_at);
          const isInMonth = itemDate >= monthStart && itemDate <= monthEnd;
          const matchesStatus = statusValue ? item[statusField] === statusValue : true;
          return isInMonth && matchesStatus;
        }).length;
      });
    };
    
    switch (activeTab) {
      case 'services':
        if (!reportData?.services) {
          return { labels, datasets: [] };
        }
        
        return {
          labels,
          datasets: [
            {
              label: 'Kërkesat për Servis',
              data: generateMonthlyData(reportData.services.all || [], 'status'),
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.4,
              fill: true,
            },
            {
              label: 'Servisi të Përfunduar',
              data: generateMonthlyData(reportData.services.all || [], 'status', 'completed'),
              borderColor: 'rgb(34, 197, 94)',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              tension: 0.4,
              fill: true,
            }
          ],
        };
      case 'tasks':
        if (!reportData?.tasks) {
          return { labels, datasets: [] };
        }
        
        return {
          labels,
          datasets: [
            {
              label: 'Taskat e Krijuar',
              data: generateMonthlyData(reportData.tasks.all || [], 'status'),
              borderColor: 'rgb(168, 85, 247)',
              backgroundColor: 'rgba(168, 85, 247, 0.1)',
              tension: 0.4,
              fill: true,
            },
            {
              label: 'Taskat e Përfunduar',
              data: generateMonthlyData(reportData.tasks.all || [], 'status', 'done'),
              borderColor: 'rgb(34, 197, 94)',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              tension: 0.4,
              fill: true,
            }
          ],
        };
      case 'orders':
        if (!reportData?.orders) {
          return { labels, datasets: [] };
        }
        
        return {
          labels,
          datasets: [
            {
              label: 'Porositë e Marra',
              data: generateMonthlyData(reportData.orders.all || [], 'status'),
              borderColor: 'rgb(245, 158, 11)',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              tension: 0.4,
              fill: true,
            },
            {
              label: 'Porositë e Dërguara',
              data: generateMonthlyData(reportData.orders.all || [], 'status', 'delivered'),
              borderColor: 'rgb(34, 197, 94)',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              tension: 0.4,
              fill: true,
            }
          ],
        };
      case 'products':
        if (!reportData?.products) {
          return { labels, datasets: [] };
        }
        
        return {
          labels,
          datasets: [
            {
              label: 'Produktet e Shtuar',
              data: generateMonthlyData(reportData.products.all || [], 'woo_commerce_status'),
              borderColor: 'rgb(239, 68, 68)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              tension: 0.4,
              fill: true,
            },
            {
              label: 'Produktet Aktive',
              data: generateMonthlyData(reportData.products.all || [], 'woo_commerce_status', 'active'),
              borderColor: 'rgb(34, 197, 94)',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              tension: 0.4,
              fill: true,
            }
          ],
        };
      case 'users':
        if (!reportData?.users) {
          return { labels, datasets: [] };
        }
        
        return {
          labels,
          datasets: [
            {
              label: 'Përdorues të Regjistruar',
              data: generateMonthlyData(reportData.users.all || [], 'role'),
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.4,
              fill: true,
            },
            {
              label: 'Përdorues Aktivë',
              data: generateMonthlyData(reportData.users.all || [], 'role'),
              borderColor: 'rgb(34, 197, 94)',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              tension: 0.4,
              fill: true,
            }
          ],
        };
      default:
        return {
          labels,
          datasets: [],
        };
    }
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

  const handleExport = async () => {
    try {
      console.log('Exporting ' + activeTab + ' report for ' + dateRange);
      const filename = activeTab + '_report_' + dateRange + '_' + new Date().toISOString().split('T')[0] + '.csv';
      
      // Fetch real data for export with proper date filtering
      let csvContent = '';
      let response;
      
      // Helper function to format dates safely
      const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-US');
      };
      
      // Helper function to clean Albanian characters
      const cleanText = (text: string) => {
        return (text || 'N/A')
          .replace(/ë/g, 'e')
          .replace(/ç/g, 'c')
          .replace(/Ç/g, 'C')
          .replace(/Ë/g, 'E');
      };
      
      switch (activeTab) {
        case 'services':
          response = await apiCall('/api/reports/services?startDate=' + getDateRangeStart() + '&endDate=' + getDateRangeEnd());
          if (response.success && response.data) {
            csvContent = 'ID;Krijuar nga;Percaktuar per;Klienti;Problemi;Statusi;Garancioni;Data\n';
            response.data.forEach((service: any) => {
              const customerName = cleanText(service.customer?.name);
              const problem = cleanText(service.problem_description || service.problem);
              const warranty = cleanText(service.warranty_info);
              const createdBy = cleanText(service.created_by);
              const assignedTo = cleanText(service.assigned_to);
              const date = formatDate(service.created_at);
              csvContent += `"${service.id}";"${createdBy}";"${assignedTo}";"${customerName}";"${problem}";"${service.status}";"${warranty}";"${date}"\n`;
            });
          }
          break;
          
        case 'tasks':
          response = await apiCall('/api/reports/tasks?startDate=' + getDateRangeStart() + '&endDate=' + getDateRangeEnd());
          if (response.success && response.data) {
            csvContent = 'ID;Krijuar nga;Percaktuar per;Titulli;Prioriteti;Statusi;Data\n';
            response.data.forEach((task: any) => {
              const title = cleanText(task.title);
              const priority = cleanText(task.priority);
              const createdBy = cleanText(task.created_by);
              const assignedTo = cleanText(task.assigned_to);
              const date = formatDate(task.created_at);
              csvContent += `"${task.id}";"${createdBy}";"${assignedTo}";"${title}";"${priority}";"${task.status}";"${date}"\n`;
            });
          }
          
          // Add tickets to CSV
          const ticketsResponse = await apiCall('/api/reports/tickets?startDate=' + getDateRangeStart() + '&endDate=' + getDateRangeEnd());
          if (ticketsResponse.success && ticketsResponse.data) {
            csvContent += '\n\nTIKETAT\n';
            csvContent += 'ID;Krijuar nga;Percaktuar per;Titulli;Prioriteti;Statusi;Data\n';
            ticketsResponse.data.forEach((ticket: any) => {
              const title = cleanText(ticket.title);
              const priority = cleanText(ticket.priority);
              const createdBy = cleanText(ticket.created_by);
              const assignedTo = cleanText(ticket.assigned_to);
              const date = formatDate(ticket.created_at);
              csvContent += `"${ticket.id}";"${createdBy}";"${assignedTo}";"${title}";"${priority}";"${ticket.status}";"${date}"\n`;
            });
          }
          break;
          
        case 'orders':
          response = await apiCall('/api/reports/orders?startDate=' + getDateRangeStart() + '&endDate=' + getDateRangeEnd());
          if (response.success && response.data) {
            csvContent = 'ID;Klienti;Statusi;Totali;Data\n';
            response.data.forEach((order: any) => {
              const customerName = cleanText(order.customer?.name);
              const total = order.total || 0;
              const date = formatDate(order.created_at);
              csvContent += `"${order.id}";"${customerName}";"${order.status}";"${total}";"${date}"\n`;
            });
          }
          break;
          
        case 'products':
          response = await apiCall('/api/reports/products?startDate=' + getDateRangeStart() + '&endDate=' + getDateRangeEnd());
          if (response.success && response.data) {
            csvContent = 'ID;Titulli;Kategoria;Cmimi Baze;Cmimi Final;Statusi WC;Data\n';
            response.data.forEach((product: any) => {
              const title = cleanText(product.title);
              const category = cleanText(product.category);
              const basePrice = product.base_price || 0;
              const finalPrice = product.final_price || 0;
              const wcStatus = product.woo_commerce_status || 'N/A';
              const date = formatDate(product.created_at);
              csvContent += `"${product.id}";"${title}";"${category}";"${basePrice}";"${finalPrice}";"${wcStatus}";"${date}"\n`;
            });
          }
          break;
          
        case 'users':
          response = await apiCall('/api/reports/users?startDate=' + getDateRangeStart() + '&endDate=' + getDateRangeEnd());
          if (response.success && response.data) {
            csvContent = 'ID;Emri;Email;Roli;Data\n';
            response.data.forEach((user: any) => {
              const name = cleanText(user.name);
              const role = cleanText(user.role);
              const date = formatDate(user.created_at);
              csvContent += `"${user.id}";"${name}";"${user.email}";"${role}";"${date}"\n`;
            });
          }
          break;
          
        default:
          csvContent = 'No data available\n';
      }
      
      // Create and download file
      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Gabim në eksportimin e të dhënave');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Duke ngarkuar raportet...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Raportet</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm font-medium text-gray-700 appearance-none cursor-pointer hover:border-gray-400 transition-colors"
            >
              <option value="today">Sot</option>
              <option value="this-week">Këtë Javë</option>
              <option value="this-month">Këtë Muaj</option>
              <option value="last-month">Muajin e Kaluar</option>
              <option value="this-year">Këtë Vit</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="w-4 h-4" />
            Filtret
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Eksporto në CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Report Content */}
      <div className="space-y-6">
        {/* Export Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-medium text-blue-900">Opsionet e Eksportit</h3>
              <p className="text-sm text-blue-700">
                Eksporto të dhënat e filtruara në CSV me të gjitha kriteret e zgjedhura të aplikuara. 
                Periudha e datës: <strong>{translateDateRange(dateRange)}</strong>
              </p>
            </div>
            <div className="ml-auto">
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {activeTab === 'services' && (
            <>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Totali i Shërbimeve</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">{currentData.total}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Përfunduar</h3>
                <p className="text-2xl font-bold text-green-600 mt-1">{currentData.completed}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Në Progres</h3>
                <p className="text-2xl font-bold text-blue-600 mt-1">{currentData.inProgress}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Në Pritje</h3>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{currentData.pending}</p>
              </div>
            </>
          )}

          {activeTab === 'tasks' && (
            <>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Totali i Taskave</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">{currentData.total}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Përfunduar</h3>
                <p className="text-2xl font-bold text-green-600 mt-1">{currentData.completed}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Në Progres</h3>
                <p className="text-2xl font-bold text-blue-600 mt-1">{currentData.inProgress}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Në Pritje</h3>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{currentData.pending}</p>
              </div>
            </>
          )}

          {activeTab === 'orders' && (
            <>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Totali i Porosive</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">{currentData.total}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Vlera Totale</h3>
                <p className="text-2xl font-bold text-green-600 mt-1">${currentData.totalValue.toLocaleString()}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Mesatarja e Porosive</h3>
                <p className="text-2xl font-bold text-blue-600 mt-1">${currentData.averageValue}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Dërguar</h3>
                <p className="text-2xl font-bold text-purple-600 mt-1">{currentData.delivered}</p>
              </div>
            </>
          )}

          {activeTab === 'products' && (
            <>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Totali i Produkteve</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">{currentData.total}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Aktivë</h3>
                <p className="text-2xl font-bold text-green-600 mt-1">{currentData.active}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Pasivë</h3>
                <p className="text-2xl font-bold text-red-600 mt-1">{currentData.inactive}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Furnizuesit</h3>
                <p className="text-2xl font-bold text-blue-600 mt-1">3</p>
              </div>
            </>
          )}

          {activeTab === 'users' && (
            <>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-400" />
                  <h3 className="text-sm font-medium text-gray-500">Totali i Përdoruesve</h3>
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-1">{currentData.total}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <h3 className="text-sm font-medium text-gray-500">Përdoruesit Aktivë</h3>
                </div>
                <p className="text-2xl font-bold text-blue-600 mt-1">{currentData.active}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center gap-2">
                  <UserX className="w-5 h-5 text-gray-400" />
                  <h3 className="text-sm font-medium text-gray-500">Përdoruesit Joaktivë</h3>
                </div>
                <p className="text-2xl font-bold text-red-600 mt-1">{currentData.inactive}</p>
              </div>
            </>
          )}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tendenca</h3>
            <div className="h-64">
              <Line data={getChartData()} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* User Activity Reports */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Aktiviteti i Përdoruesve</h3>
                {/* <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Filtro sipas përdoruesit:</label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                    disabled={users.length === 0}
                  >
                    <option value="">Të gjithë përdoruesit</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.email}
                      </option>
                    ))}
                  </select>
                  {users.length === 0 && (
                    <span className="text-xs text-gray-400">Duke ngarkuar...</span>
                  )}
                </div> */}
              </div>
              
              <div className="space-y-3">
                {userActivity.length > 0 ? (
                  userActivity.map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.type === 'order' ? 'bg-blue-500' :
                        activity.type === 'service' ? 'bg-green-500' :
                        activity.type === 'task' ? 'bg-purple-500' :
                        activity.type === 'customer' ? 'bg-orange-500' :
                        activity.type === 'product' ? 'bg-red-500' :
                        'bg-gray-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.user || 'Unknown User'}
                        </p>
                        <p className="text-xs text-gray-500">{activity.action}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-400">Moduli: {activity.module}</p>
                          {activity.userRole && (
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                              {activity.userRole}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-400">
                          {new Date(activity.timestamp).toLocaleDateString('sq-AL')}
                        </span>
                        <br />
                        <span className="text-xs text-gray-400">
                          {new Date(activity.timestamp).toLocaleTimeString('sq-AL')}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Nuk ka aktivitet të regjistruar</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
