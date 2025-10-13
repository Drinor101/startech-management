import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, AlertCircle } from 'lucide-react';

interface CalendarItem {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  type: 'task' | 'service' | 'ticket';
  assignedTo?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
  dueDate?: string;
  completedAt?: string;
  warrantyInfo?: string;
  customerName?: string;
}

interface CalendarViewProps {
  items: CalendarItem[];
  onItemClick?: (item: CalendarItem) => void;
  onStatusChange?: (itemId: string, newStatus: string) => void;
  type: 'tasks' | 'services' | 'tickets';
}

const CalendarView: React.FC<CalendarViewProps> = ({ 
  items, 
  onItemClick, 
  onStatusChange, 
  type 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  // Get calendar days for current month/week
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    if (viewMode === 'month') {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay());
      
      const days = [];
      const current = new Date(startDate);
      
      for (let i = 0; i < 42; i++) {
        days.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      
      return days;
    } else {
      // Week view
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(startOfWeek.getDate() - currentDate.getDay());
      
      const days = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(day.getDate() + i);
        days.push(day);
      }
      
      return days;
    }
  }, [currentDate, viewMode]);

  // Get items for a specific date
  const getItemsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return items.filter(item => {
      const itemDate = new Date(item.createdAt).toISOString().split('T')[0];
      const dueDate = item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : null;
      return itemDate === dateStr || dueDate === dateStr;
    });
  };

  // Navigate calendar
  const navigateCalendar = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (viewMode === 'month') {
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
      } else {
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
      }
      return newDate;
    });
  };

  // Get status color
  const getStatusColor = (status: string, priority?: string) => {
    if (status === 'completed' || status === 'done') return 'bg-green-100 text-green-800 border-green-200';
    if (status === 'in-progress') return 'bg-blue-100 text-blue-800 border-blue-200';
    if (status === 'todo' || status === 'received') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (priority === 'high') return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Get type icon
  const getTypeIcon = (type: 'task' | 'service' | 'ticket') => {
    if (type === 'task') return Clock;
    if (type === 'service') return AlertCircle;
    return AlertCircle; // Default for ticket
  };

  const monthNames = [
    'Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor',
    'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor'
  ];

  const dayNames = ['Di', 'Hë', 'Ma', 'Më', 'En', 'Pr', 'Sh'];

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <CalendarIcon className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            {viewMode === 'month' 
              ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              : `Java e ${currentDate.getDate()}-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`
            }
          </h3>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'month' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Muaj
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'week' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Java
            </button>
          </div>
          
          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigateCalendar('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Sot
            </button>
            <button
              onClick={() => navigateCalendar('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {viewMode === 'month' ? (
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {dayNames.map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {calendarDays.map((day, index) => {
              const dayItems = getItemsForDate(day);
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const isToday = day.toDateString() === new Date().toDateString();
              
              return (
                <div
                  key={index}
                  className={`min-h-[100px] p-2 border border-gray-200 ${
                    isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                  } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  } ${isToday ? 'text-blue-600' : ''}`}>
                    {day.getDate()}
                  </div>
                  
                  <div className="space-y-1">
                    {dayItems.slice(0, 3).map(item => {
                      const Icon = getTypeIcon(item.type);
                      return (
                        <div
                          key={item.id}
                          onClick={() => onItemClick?.(item)}
                          className={`p-1 rounded text-xs cursor-pointer hover:shadow-sm transition-shadow ${getStatusColor(item.status, item.priority)}`}
                        >
                          <div className="flex items-center gap-1">
                            <Icon className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{item.title}</span>
                          </div>
                          {item.description && (
                            <div className="text-xs text-gray-700 mt-1 truncate">
                              {item.description}
                            </div>
                          )}
                          {item.customerName && item.customerName !== 'N/A' && (
                            <div className="text-xs text-blue-600 mt-1 truncate">
                              Klienti: {item.customerName}
                            </div>
                          )}
                          {item.warrantyInfo && item.warrantyInfo !== 'N/A' && (
                            <div className="text-xs text-green-600 mt-1 truncate">
                              Garancioni: {item.warrantyInfo}
                            </div>
                          )}
                          {item.assignedTo && (
                            <div className="flex items-center gap-1 mt-1">
                              <User className="w-2 h-2" />
                              <span className="text-xs truncate">{item.assignedTo}</span>
                            </div>
                          )}
                          {item.createdBy && (
                            <div className="text-xs text-gray-600 mt-1 truncate">
                              Krijuar nga: {item.createdBy}
                            </div>
                          )}
                          {item.updatedAt && (
                            <div className="text-xs text-gray-500 mt-1 truncate">
                              Përditësuar: {new Date(item.updatedAt).toLocaleDateString('sq-AL')}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {dayItems.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayItems.length - 3} më shumë
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Week view
          <div className="grid grid-cols-7 gap-4">
            {calendarDays.map((day, index) => {
              const dayItems = getItemsForDate(day);
              const isToday = day.toDateString() === new Date().toDateString();
              
              return (
                <div key={index} className="min-h-[200px]">
                  <div className={`text-center p-2 border-b ${
                    isToday ? 'bg-blue-50 text-blue-900 font-semibold' : 'text-gray-700'
                  }`}>
                    <div className="text-sm">{dayNames[day.getDay()]}</div>
                    <div className="text-lg">{day.getDate()}</div>
                  </div>
                  
                  <div className="p-2 space-y-2">
                    {dayItems.map(item => {
                      const Icon = getTypeIcon(item.type);
                      return (
                        <div
                          key={item.id}
                          onClick={() => onItemClick?.(item)}
                          className={`p-2 rounded text-sm cursor-pointer hover:shadow-sm transition-shadow ${getStatusColor(item.status, item.priority)}`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{item.title}</div>
                              {item.description && (
                                <div className="text-xs text-gray-700 mt-1 truncate">
                                  {item.description}
                                </div>
                              )}
                              {item.customerName && item.customerName !== 'N/A' && (
                                <div className="text-xs text-blue-600 mt-1 truncate">
                                  Klienti: {item.customerName}
                                </div>
                              )}
                              {item.warrantyInfo && item.warrantyInfo !== 'N/A' && (
                                <div className="text-xs text-green-600 mt-1 truncate">
                                  Garancioni: {item.warrantyInfo}
                                </div>
                              )}
                              {item.assignedTo && (
                                <div className="flex items-center gap-1 mt-1">
                                  <User className="w-3 h-3" />
                                  <span className="text-xs truncate">{item.assignedTo}</span>
                                </div>
                              )}
                              {item.createdBy && (
                                <div className="text-xs text-gray-600 mt-1 truncate">
                                  Krijuar nga: {item.createdBy}
                                </div>
                              )}
                              {item.updatedAt && (
                                <div className="text-xs text-gray-500 mt-1 truncate">
                                  Përditësuar: {new Date(item.updatedAt).toLocaleDateString('sq-AL')}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarView;
