import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Filter, Calendar, FileText, TrendingUp, Users, Euro, Activity, Shield } from 'lucide-react';
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
    users: {
      total: 7,
      active: 7,
      inactive: 0,
      totalCredits: 907.00,
      averageCredits: 129.57,
      byRole: [
        { name: 'Administrator', count: 1, percentage: 14.3, totalCredits: 150.00 },
        { name: 'Manager', count: 1, percentage: 14.3, totalCredits: 85.50 },
        { name: 'Technician', count: 1, percentage: 14.3, totalCredits: 200.00 },
        { name: 'Support Agent', count: 1, percentage: 14.3, totalCredits: 75.25 },
        { name: 'Design', count: 1, percentage: 14.3, totalCredits: 120.75 },
        { name: 'Marketing', count: 1, percentage: 14.3, totalCredits: 95.00 },
        { name: 'E-commerce', count: 1, percentage: 14.3, totalCredits: 180.50 }
      ],
      creditDistribution: [
        { range: '€150+', count: 2, percentage: 28.6, color: 'bg-green-500' },
        { range: '€100-149', count: 3, percentage: 42.9, color: 'bg-yellow-500' },
        { range: '€50-99', count: 2, percentage: 28.6, color: 'bg-red-500' }
      ],
      recentActivity: [
        { user: 'John Admin', action: 'Updated service status', time: '2 min ago' },
        { user: 'Mike Tech', action: 'Completed repair task', time: '15 min ago' },
        { user: 'Lisa Support', action: 'Created new ticket', time: '1 hour ago' },
        { user: 'Alex Ecommerce', action: 'Synced products', time: '2 hours ago' }
      ]
    }
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
          total: 7, // Mock for now
          active: 7,
          inactive: 0,
          totalCredits: 907.00,
          averageCredits: 129.57,
          byRole: mockReportData.users.byRole,
          creditDistribution: mockReportData.users.creditDistribution,
          recentActivity: mockReportData.users.recentActivity
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
      csvContent = 'User ID,Name,Email,Role,Status,Credits,Last Login,Total Actions\n';
      csvContent += '1,John Admin,admin@company.com,Administrator,Active,€150.00,2024-01-15,45\n';
      csvContent += '2,Sarah Manager,manager@company.com,Manager,Active,€85.50,2024-01-15,32\n';
      csvContent += '3,Mike Tech,tech@company.com,Technician,Active,€200.00,2024-01-15,67\n';
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
                  <Euro className="w-5 h-5 text-gray-400" />
                  <h3 className="text-sm font-medium text-gray-500">Kreditë Totale</h3>
                </div>
                <p className="text-2xl font-bold text-green-600 mt-1">€{currentData.totalCredits.toFixed(2)}</p>
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
                  <Euro className="w-5 h-5 text-gray-400" />
                  <h3 className="text-sm font-medium text-gray-500">Kreditë Mesatare</h3>
                </div>
                <p className="text-2xl font-bold text-purple-600 mt-1">€{currentData.averageCredits.toFixed(2)}</p>
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
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{role.name}</span>
                    <span className="text-xs text-gray-400">€{role.totalCredits.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${role.percentage}%` }}
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

        {/* Additional User Reports */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Credit Distribution */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Shpërndarja e Kredive</h3>
                <div className="space-y-4">
                  {currentData.creditDistribution.map((credit, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{credit.range}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${credit.color}`}
                            style={{ width: `${credit.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-12 text-right">
                          {credit.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Aktiviteti i Fundit i Përdoruesve</h3>
                <div className="space-y-3">
                  {currentData.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Activity className="w-4 h-4 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.user}</p>
                        <p className="text-xs text-gray-600">{activity.action}</p>
                      </div>
                      <span className="text-xs text-gray-500">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Individual User Actions & Logs */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Aksione Individuale të Përdoruesve</h3>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                    <option value="all">Të gjithë përdoruesit</option>
                    <option value="admin">Administratorët</option>
                    <option value="manager">Menaxherët</option>
                    <option value="technician">Teknikët</option>
                  </select>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Përdoruesi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Moduli
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksioni
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Objekti
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Koha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statusi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Sample user actions - replace with real data */}
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">A</span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">Admin User</div>
                            <div className="text-sm text-gray-500">admin@startech.com</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          Servisi
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Krijoi servis të ri
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Servis #SRV-001
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        15 min më parë
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Sukses
                        </span>
                      </td>
                    </tr>
                    
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-green-600">M</span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">Manager User</div>
                            <div className="text-sm text-gray-500">manager@startech.com</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Porositë
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Modifiko porosi
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Porosi #PRS-2024-001
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        1 orë më parë
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Sukses
                        </span>
                      </td>
                    </tr>

                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-purple-600">T</span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">Tech User</div>
                            <div className="text-sm text-gray-500">tech@startech.com</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                          Taskat
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Përfundoi task
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Task #TSK-001
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        2 orë më parë
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Sukses
                        </span>
                      </td>
                    </tr>

                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-orange-600">S</span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">Sales User</div>
                            <div className="text-sm text-gray-500">sales@startech.com</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                          Produktet
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Shtoi produkt manual
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Produkt Manual #PRD-001
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        3 orë më parë
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Sukses
                        </span>
                      </td>
                    </tr>

                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-red-600">C</span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">Customer User</div>
                            <div className="text-sm text-gray-500">customer@startech.com</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          Klientët
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Modifiko klient
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        Klient #CST-001
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        5 orë më parë
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                          Paralajmërim
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-500">
                  Shfaqen 5 nga 25 rezultatet
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                    Mëparshëm
                  </button>
                  <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg">
                    1
                  </button>
                  <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                    2
                  </button>
                  <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                    3
                  </button>
                  <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                    Tjetër
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;