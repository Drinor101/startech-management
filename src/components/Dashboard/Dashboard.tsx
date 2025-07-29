import React from 'react';
import { BarChart3, TrendingUp, Users, Package, Settings, CheckSquare } from 'lucide-react';

const Dashboard: React.FC = () => {
  const stats = [
    { label: 'Active Services', value: '23', icon: Settings, color: 'bg-blue-500', change: '+12%' },
    { label: 'Open Tasks', value: '15', icon: CheckSquare, color: 'bg-green-500', change: '+8%' },
    { label: 'Orders Today', value: '8', icon: Package, color: 'bg-purple-500', change: '+15%' },
    { label: 'Customers', value: '156', icon: Users, color: 'bg-orange-500', change: '+5%' },
  ];

  const recentActivities = [
    { id: 1, action: 'New service request created', user: 'Mike Tech', time: '2 minutes ago' },
    { id: 2, action: 'Order ORD001 marked as shipped', user: 'Sarah Manager', time: '15 minutes ago' },
    { id: 3, action: 'Task TASK001 completed', user: 'Lisa Support', time: '1 hour ago' },
    { id: 4, action: 'New customer registered', user: 'System', time: '2 hours ago' },
  ];

  return (
    <div className="p-6 space-y-6">
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
                <span className="text-sm text-gray-500 ml-1">vs last month</span>
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
            <h3 className="text-lg font-medium text-gray-900">Service Requests Trend</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Chart visualization would be here</p>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activities</h3>
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
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 text-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Settings className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <span className="text-sm font-medium">New Service</span>
          </button>
          <button className="p-4 text-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <CheckSquare className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <span className="text-sm font-medium">Create Task</span>
          </button>
          <button className="p-4 text-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Package className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <span className="text-sm font-medium">New Order</span>
          </button>
          <button className="p-4 text-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Users className="w-6 h-6 text-orange-600 mx-auto mb-2" />
            <span className="text-sm font-medium">Add Customer</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;