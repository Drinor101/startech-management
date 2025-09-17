import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Filter, Calendar, FileText, TrendingUp, Users, Euro, Activity, Shield, UserX } from 'lucide-react';
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
  const [selectedUser, setSelectedUser] = useState<string>('');

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
        
        const response = await apiCall(`${apiConfig.endpoints.reports}/dashboard`);
        console.log('Reports API response:', response);
        
        if (response.success) {
          setReportData(response.data);
        } else {
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

  // Fetch user activity
  useEffect(() => {
    const fetchUserActivity = async () => {
      try {
        const params = new URLSearchParams();
        if (selectedUser) {
          params.append('userId', selectedUser);
        }
        const response = await apiCall(`/api/reports/users/activity?${params.toString()}`);
        if (response.success) {
          setUserActivity(response.data || []);
        }
      } catch (err) {
        console.error('Error fetching user activity:', err);
      }
    };

    if (activeTab === 'users') {
      fetchUserActivity();
    }
  }, [activeTab, selectedUser]);

  const mockReportData = {
    services: {
      total: 47,
      completed: 32,
      inProgress: 12,
      pending: 3,
      categories: [
        { name: 'Repair', count: 28, percentage: 59.6 },
        { name: 'Replacement', count: 12, percentage: 25.5 },
        { name: 'Quality Issue', count: 7, percentage: 14.9 }
      ]
    },
    tasks: {
      total: 156,
      completed: 89,
      inProgress: 45,
      pending: 22,
      byPriority: [
        { name: 'High', count: 34, percentage: 21.8 },
        { name: 'Medium', count: 78, percentage: 50.0 },
        { name: 'Low', count: 44, percentage: 28.2 }
      ]
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
      inactive: 13,
      bySupplier: [
        { name: 'TechCorp', count: 67, percentage: 46.2 },
        { name: 'AccessoryPlus', count: 45, percentage: 31.0 },
        { name: 'OfficeSupply', count: 33, percentage: 22.8 }
      ]
    },
  };

  // Transform real data to match expected structure
  const getCurrentData = () => {
    if (!reportData) return mockReportData[activeTab as keyof typeof mockReportData];
    
    const realData = reportData[activeTab];
    if (!realData) return mockReportData[activeTab as keyof typeof mockReportData];
    
    // Transform real data to match frontend expectations
    switch (activeTab) {
      case 'services':
        return {
          total: realData.total || 0,
          completed: realData.completed || 0,
          inProgress: realData.inProgress || 0,
          pending: realData.received || 0,
          categories: mockReportData.services.categories // Keep mock categories for now
        };
      case 'tasks':
        return {
          total: realData.total || 0,
          completed: realData.done || 0,
          inProgress: realData.inProgress || 0,
          pending: realData.todo || 0,
          byPriority: mockReportData.tasks.byPriority // Keep mock priority for now
        };
      case 'orders':
        return {
          total: realData.total || 0,
          delivered: realData.delivered || 0,
          processing: realData.processing || 0,
          pending: realData.pending || 0,
          totalValue: realData.totalRevenue || 0,
          averageValue: realData.total > 0 ? (realData.totalRevenue / realData.total) : 0
        };
      case 'products':
        return {
          total: realData.total || 0,
          active: realData.active || 0,
          inactive: realData.inactive || 0,
          bySupplier: mockReportData.products.bySupplier // Keep mock supplier for now
        };
      case 'users':
        return {
          total: realData.total || 0,
          active: realData.active || 0,
          inactive: realData.inactive || 0,
          byRole: realData.byRole || []
        };
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
      'this-year': 'Këtë Vit',
      'custom': 'Gama e Personalizuar'
    };
    return translations[range] || range;
  };

  // Chart data for reports
  const getChartData = () => {
    const labels = ['Jan', 'Shk', 'Mar', 'Pri', 'Maj', 'Qer', 'Kor', 'Gus', 'Sht', 'Tet', 'Nën', 'Dhj'];
    
    switch (activeTab) {
      case 'services':
        return {
          labels,
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
      case 'tasks':
        return {
          labels,
          datasets: [
            {
              label: 'Taskat e Krijuar',
              data: [8, 12, 10, 18, 15, 22, 20, 28, 25, 32, 30, 38],
              borderColor: 'rgb(168, 85, 247)',
              backgroundColor: 'rgba(168, 85, 247, 0.1)',
              tension: 0.4,
              fill: true,
            },
            {
              label: 'Taskat e Përfunduar',
              data: [6, 10, 8, 15, 12, 18, 16, 24, 22, 28, 26, 32],
              borderColor: 'rgb(34, 197, 94)',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              tension: 0.4,
              fill: true,
            }
          ],
        };
      case 'orders':
        return {
          labels,
          datasets: [
            {
              label: 'Porositë e Marra',
              data: [15, 22, 18, 30, 25, 35, 32, 42, 38, 48, 45, 55],
              borderColor: 'rgb(245, 158, 11)',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              tension: 0.4,
              fill: true,
            },
            {
              label: 'Porositë e Dërguara',
              data: [12, 18, 15, 25, 22, 30, 28, 38, 35, 42, 40, 48],
              borderColor: 'rgb(34, 197, 94)',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              tension: 0.4,
              fill: true,
            }
          ],
        };
      case 'products':
        return {
          labels,
          datasets: [
            {
              label: 'Produktet e Shtuar',
              data: [5, 8, 6, 12, 10, 15, 13, 18, 16, 22, 20, 25],
              borderColor: 'rgb(239, 68, 68)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              tension: 0.4,
              fill: true,
            },
            {
              label: 'Produktet Aktive',
              data: [4, 7, 5, 10, 8, 12, 11, 15, 14, 18, 17, 20],
              borderColor: 'rgb(34, 197, 94)',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              tension: 0.4,
              fill: true,
            }
          ],
        };
      case 'users':
        return {
          labels,
          datasets: [
            {
              label: 'Përdorues të Regjistruar',
              data: [2, 3, 2, 4, 3, 5, 4, 6, 5, 7, 6, 8],
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.4,
              fill: true,
            },
            {
              label: 'Përdorues Aktivë',
              data: [1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7],
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

  const handleExport = () => {
    console.log(`Exporting ${activeTab} report for ${dateRange}`);
    // Mock CSV export
    const filename = `${activeTab}_report_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`;
    
    // Create mock CSV content
    let csvContent = '';
    if (activeTab === 'services') {
      csvContent = 'Service ID,Customer,Problem,Status,Category,Assigned To,Created Date,Warranty\n';
      csvContent += 'SRV001,Alice Johnson,Headphones not charging,in-progress,Repair,Mike Tech,2024-01-15,Yes\n';
      csvContent += 'SRV002,Bob Smith,Laptop stand wobbling,completed,Quality Issue,Mike Tech,2024-01-14,No\n';
    } else if (activeTab === 'tasks') {
      csvContent = 'Task ID,Type,Title,Priority,Status,Assigned To,Category,Created Date\n';
      csvContent += 'TASK001,task,Update product catalog,medium,in-progress,Alex Ecommerce,System Maintenance,2024-01-15\n';
      csvContent += 'TICK001,ticket,Customer complaint,high,todo,Lisa Support,Customer Service,2024-01-15\n';
    } else if (activeTab === 'orders') {
      csvContent = 'Order ID,Customer,Status,Total,Products,Created Date,Shipping Method\n';
      csvContent += 'ORD001,Alice Johnson,processing,$169.97,2,2024-01-15,Standard Post\n';
      csvContent += 'ORD002,Bob Smith,shipped,$57.99,1,2024-01-14,Express Post\n';
    } else if (activeTab === 'products') {
      csvContent = 'Product ID,Title,Category,Supplier,Base Price,Final Price,WC Status,Last Sync\n';
      csvContent += '1,Wireless Headphones Pro,Electronics,TechCorp,$99.99,$109.99,active,2024-01-15\n';
      csvContent += '2,Premium Smartphone Case,Accessories,AccessoryPlus,$24.99,$29.99,active,2024-01-15\n';
    } else if (activeTab === 'users') {
      csvContent = 'User ID,Name,Email,Role,Status,Total Actions\n';
      if (currentData.byRole && currentData.byRole.length > 0) {
        currentData.byRole.forEach((role, index) => {
          csvContent += `${index + 1},User ${index + 1},user${index + 1}@company.com,${role.name},Active,${role.count}\n`;
        });
      } else {
        csvContent += '1,Sample User,sample@company.com,User,Active,0\n';
      }
    }
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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
          {reportData ? (
            <p className="text-sm text-green-600 mt-1">📊 Të dhëna reale nga database</p>
          ) : (
            <p className="text-sm text-yellow-600 mt-1">⚠️ Të dhëna demo (API nuk është i disponueshëm)</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="today">Sot</option>
              <option value="this-week">Këtë Javë</option>
              <option value="this-month">Këtë Muaj</option>
              <option value="last-month">Muajin e Kaluar</option>
              <option value="this-year">Këtë Vit</option>
              <option value="custom">Gama e Personalizuar</option>
            </select>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tendenca</h3>
            <div className="h-64">
              <Line data={getChartData()} options={chartOptions} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Ndarja</h3>
            <div className="space-y-4">
              {activeTab === 'services' && currentData.categories.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{category.name}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12 text-right">
                      {category.count}
                    </span>
                  </div>
                </div>
              ))}

              {activeTab === 'tasks' && currentData.byPriority.map((priority, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{priority.name} Priority</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${priority.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12 text-right">
                      {priority.count}
                    </span>
                  </div>
                </div>
              ))}

              {activeTab === 'products' && currentData.bySupplier.map((supplier, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{supplier.name}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${supplier.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12 text-right">
                      {supplier.count}
                    </span>
                  </div>
                </div>
              ))}

              {activeTab === 'users' && currentData.byRole.map((role, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{role.name}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(role.count / currentData.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12 text-right">
                      {role.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Activity Reports */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Aktiviteti i Përdoruesve</h3>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Filtro sipas përdoruesit:</label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Të gjithë përdoruesit</option>
                    {/* Add user options here if needed */}
                  </select>
                </div>
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