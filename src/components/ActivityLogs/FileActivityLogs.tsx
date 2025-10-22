import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Activity, 
  BarChart3,
  RefreshCw,
  Clock,
  MapPin,
  User
} from 'lucide-react';
import { apiCall, apiConfig } from '../../config/api';
import { usePermissions } from '../../hooks/usePermissions';

interface FileActivityLog {
  timestamp: string;
  user_id: string;
  user_name: string;
  action: string;
  module: string;
  details?: any;
  ip_address?: string;
  method?: string;
  url?: string;
  status_code?: number;
  user_agent?: string;
}

interface LogStats {
  totalActions: number;
  actionsByModule: Record<string, number>;
  actionsByUser: Record<string, number>;
  actionsByDay: Record<string, number>;
  actionsByHour: Record<string, number>;
  topUsers: Array<{ user: string; count: number }>;
  topModules: Array<{ module: string; count: number }>;
  uniqueUsersCount: number;
  uniqueIPsCount: number;
}

const FileActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<FileActivityLog[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'logs' | 'stats'>('logs');
  
  // Filters
  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    userId: '',
    module: '',
    action: '',
    startDate: '',
    endDate: ''
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  const { canView } = usePermissions();

  // Fetch logs
  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      const response = await apiCall(`${apiConfig.baseURL}/api/file-activity/file-activity-logs?${params}`);
      
      if (response.success) {
        setLogs(response.data || []);
        setPagination(response.pagination || { page: 1, limit: 50, total: 0, pages: 0 });
      } else {
        setError('Gabim në ngarkimin e log-ave');
      }
    } catch (err) {
      console.error('Error fetching file logs:', err);
      setError('Gabim në ngarkimin e log-ave');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await apiCall(`${apiConfig.baseURL}/api/file-activity/file-activity-stats?${params}`);
      
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    if (canView('activity')) {
      fetchLogs();
    }
  }, [filters]);

  useEffect(() => {
    if (activeTab === 'stats' && canView('activity')) {
      fetchStats();
    }
  }, [activeTab, filters.startDate, filters.endDate]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await fetch(`${apiConfig.baseURL}/api/file-activity/export-file-logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Error exporting logs:', err);
    }
  };

  const getActionColor = (action: string) => {
    const colors = {
      'CREATE': 'bg-green-100 text-green-800',
      'UPDATE': 'bg-blue-100 text-blue-800',
      'DELETE': 'bg-red-100 text-red-800',
      'VIEW': 'bg-gray-100 text-gray-800',
      'LOGIN': 'bg-purple-100 text-purple-800',
      'LOGOUT': 'bg-orange-100 text-orange-800'
    };
    return colors[action as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getModuleColor = (module: string) => {
    const colors = {
      'USERS': 'bg-blue-100 text-blue-800',
      'ORDERS': 'bg-green-100 text-green-800',
      'PRODUCTS': 'bg-purple-100 text-purple-800',
      'TASKS': 'bg-orange-100 text-orange-800',
      'SERVICES': 'bg-indigo-100 text-indigo-800',
      'TICKETS': 'bg-pink-100 text-pink-800',
      'CUSTOMERS': 'bg-yellow-100 text-yellow-800'
    };
    return colors[module as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (!canView('activity')) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Nuk keni leje për të parë aktivitetin e përdoruesve.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Aktiviteti i Përdoruesve (File Logs)</h1>
              <p className="text-gray-600">Regjistrimi i aktivitetit në skedarë të përkohshëm</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLogs()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Rifresko
            </button>
            <button
              onClick={() => handleExport('json')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export JSON
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'logs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Activity className="w-4 h-4 inline mr-2" />
              Log-jet
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stats'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Statistikat
            </button>
          </nav>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Përdoruesi</label>
            <input
              type="text"
              value={filters.userId}
              onChange={(e) => handleFilterChange('userId', e.target.value)}
              placeholder="ID e përdoruesit"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Moduli</label>
            <select
              value={filters.module}
              onChange={(e) => handleFilterChange('module', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Të gjitha</option>
              <option value="USERS">Përdoruesit</option>
              <option value="ORDERS">Porositë</option>
              <option value="PRODUCTS">Produktet</option>
              <option value="TASKS">Taskat</option>
              <option value="SERVICES">Servisi</option>
              <option value="TICKETS">Tiketat</option>
              <option value="CUSTOMERS">Klientët</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Veprimi</label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Të gjitha</option>
              <option value="CREATE">Krijim</option>
              <option value="UPDATE">Përditësim</option>
              <option value="DELETE">Fshirje</option>
              <option value="VIEW">Shikim</option>
              <option value="LOGIN">Hyrje</option>
              <option value="LOGOUT">Dalje</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Duke ngarkuar log-jet...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-600">{error}</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Nuk ka log-je të regjistruara</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Përdoruesi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Veprimi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Moduli
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Detajet
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Koha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IP
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.map((log, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                              <User className="w-4 h-4 text-gray-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{log.user_name}</div>
                              <div className="text-sm text-gray-500">{log.user_id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getModuleColor(log.module)}`}>
                            {log.module}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {log.details ? (
                              <div className="max-w-xs truncate">
                                {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                          {log.url && (
                            <div className="text-xs text-gray-500 mt-1">
                              {log.method} {log.url}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Clock className="w-4 h-4 mr-1 text-gray-400" />
                            <div>
                              <div>{new Date(log.timestamp).toLocaleDateString('sq-AL')}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(log.timestamp).toLocaleTimeString('sq-AL')}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="w-4 h-4 mr-1" />
                            {log.ip_address || '-'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="px-6 py-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Duke treguar {((pagination.page - 1) * pagination.limit) + 1} deri në {Math.min(pagination.page * pagination.limit, pagination.total)} nga {pagination.total} rezultate
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Para
                      </button>
                      <span className="px-3 py-1 text-sm">
                        Faqja {pagination.page} nga {pagination.pages}
                      </span>
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Pas
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'stats' && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overview Stats */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Përmbledhje</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.totalActions}</div>
                <div className="text-sm text-blue-800">Veprime Totale</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.uniqueUsersCount}</div>
                <div className="text-sm text-green-800">Përdorues Unikë</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.uniqueIPsCount}</div>
                <div className="text-sm text-purple-800">IP Unikë</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{Object.keys(stats.actionsByModule).length}</div>
                <div className="text-sm text-orange-800">Module Aktive</div>
              </div>
            </div>
          </div>

          {/* Top Users */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Përdoruesit Më Aktivë</h3>
            <div className="space-y-3">
              {stats.topUsers.slice(0, 5).map((user, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{user.user}</span>
                  </div>
                  <span className="text-sm text-gray-600">{user.count} veprime</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Modules */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Module Më të Përdorura</h3>
            <div className="space-y-3">
              {stats.topModules.slice(0, 5).map((module, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getModuleColor(module.module)}`}>
                    {module.module}
                  </span>
                  <span className="text-sm text-gray-600">{module.count} veprime</span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity by Hour */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Aktiviteti sipas Orës</h3>
            <div className="space-y-2">
              {Object.entries(stats.actionsByHour)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([hour, count]) => (
                  <div key={hour} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{hour}:00</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(count / Math.max(...Object.values(stats.actionsByHour))) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-8">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileActivityLogs;
