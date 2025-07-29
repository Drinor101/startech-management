import React, { useState } from 'react';
import { BarChart3, Download, Filter, Calendar, FileText, TrendingUp } from 'lucide-react';

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState('services');
  const [dateRange, setDateRange] = useState('this-month');

  const tabs = [
    { id: 'services', label: 'Services' },
    { id: 'tasks', label: 'Tasks & Tickets' },
    { id: 'orders', label: 'Orders' },
    { id: 'products', label: 'Products' },
  ];

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
    }
  };

  const currentData = mockReportData[activeTab as keyof typeof mockReportData];

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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="today">Today</option>
              <option value="this-week">This Week</option>
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="this-year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export to CSV
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
              <h3 className="font-medium text-blue-900">Export Options</h3>
              <p className="text-sm text-blue-700">
                Export filtered data to CSV with all selected criteria applied. 
                Date range: <strong>{dateRange.replace('-', ' ')}</strong>
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
                <h3 className="text-sm font-medium text-gray-500">Total Services</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">{currentData.total}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Completed</h3>
                <p className="text-2xl font-bold text-green-600 mt-1">{currentData.completed}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">In Progress</h3>
                <p className="text-2xl font-bold text-blue-600 mt-1">{currentData.inProgress}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Pending</h3>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{currentData.pending}</p>
              </div>
            </>
          )}

          {activeTab === 'tasks' && (
            <>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Total Tasks</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">{currentData.total}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Completed</h3>
                <p className="text-2xl font-bold text-green-600 mt-1">{currentData.completed}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">In Progress</h3>
                <p className="text-2xl font-bold text-blue-600 mt-1">{currentData.inProgress}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Pending</h3>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{currentData.pending}</p>
              </div>
            </>
          )}

          {activeTab === 'orders' && (
            <>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">{currentData.total}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Total Value</h3>
                <p className="text-2xl font-bold text-green-600 mt-1">${currentData.totalValue.toLocaleString()}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Average Order</h3>
                <p className="text-2xl font-bold text-blue-600 mt-1">${currentData.averageValue}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Delivered</h3>
                <p className="text-2xl font-bold text-purple-600 mt-1">{currentData.delivered}</p>
              </div>
            </>
          )}

          {activeTab === 'products' && (
            <>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Total Products</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">{currentData.total}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Active</h3>
                <p className="text-2xl font-bold text-green-600 mt-1">{currentData.active}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Inactive</h3>
                <p className="text-2xl font-bold text-red-600 mt-1">{currentData.inactive}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-500">Suppliers</h3>
                <p className="text-2xl font-bold text-blue-600 mt-1">3</p>
              </div>
            </>
          )}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Distribution</h3>
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Chart visualization would be here</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Breakdown</h3>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;