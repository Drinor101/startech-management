import React from 'react';
import { Plus, ChevronDown } from 'lucide-react';

interface KanbanColumn {
  id: string;
  title: string;
  items: any[];
  color: string;
}

interface KanbanBoardProps {
  columns?: KanbanColumn[];
  items?: any[];
  renderCard?: (item: any) => React.ReactNode;
  onAddItem?: (columnId: string) => void;
  onStatusChange?: (itemId: string, newStatus: string) => void;
  statusConfig?: { [key: string]: { label: string; color: string } };
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ columns, items, renderCard, onAddItem, onStatusChange, statusConfig }) => {
  // If items are provided, create columns from statusConfig
  if (items && statusConfig) {
    const statusColumns = Object.entries(statusConfig).map(([status, config]) => ({
      id: status,
      title: config.label,
      items: items.filter(item => item.status === status),
      color: `bg-${config.color}-100`
    }));

    return (
      <div className="flex gap-6 overflow-x-auto pb-4">
        {statusColumns.map((column) => (
          <div key={column.id} className="flex-shrink-0 w-80">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${column.color}`} />
                  <h3 className="font-medium text-gray-900">{column.title}</h3>
                  <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                    {column.items.length}
                  </span>
                </div>
                {onAddItem && (
                  <button
                    onClick={() => onAddItem(column.id)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="space-y-3">
                {column.items.map((item, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">{item.title}</h4>
                        <span className="text-xs text-gray-500">{item.id}</span>
                      </div>
                      <p className="text-sm text-gray-600">{item.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{item.assignedTo || 'N/A'}</span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {onStatusChange && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="relative">
                          <select
                            value={item.status || column.id}
                            onChange={(e) => onStatusChange(item.id, e.target.value)}
                            className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm font-medium text-gray-700 appearance-none cursor-pointer hover:border-gray-400 transition-colors"
                          >
                            {item.type === 'task' ? (
                              // Task status options
                              <>
                                <option value="todo">Për të bërë</option>
                                <option value="in-progress">Në Progres</option>
                                <option value="review">Rishikim</option>
                                <option value="done">Përfunduar</option>
                              </>
                            ) : item.type === 'order' ? (
                              // Order status options
                              <>
                                <option value="pending">Në Pritje</option>
                                <option value="accepted">Pranuar</option>
                                <option value="processing">Në Procesim</option>
                                <option value="shipped">Dërguar</option>
                                <option value="delivered">Dorëzuar</option>
                                <option value="cancelled">Anuluar</option>
                              </>
                            ) : (
                              // Service status options
                              <>
                                <option value="received">Marrë</option>
                                <option value="in-progress">Në Progres</option>
                                <option value="waiting-parts">Duke Pritur Pjesët</option>
                                <option value="completed">Përfunduar</option>
                                <option value="delivered">Dërguar</option>
                              </>
                            )}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Original columns-based implementation
  if (!columns) return null;
  
  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {columns.map((column) => (
        <div key={column.id} className="flex-shrink-0 w-80">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${column.color}`} />
                <h3 className="font-medium text-gray-900">{column.title}</h3>
                <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                  {column.items.length}
                </span>
              </div>
              {onAddItem && (
                <button
                  onClick={() => onAddItem(column.id)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="space-y-3">
              {column.items.map((item, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow">
                  {renderCard(item)}
                  {onStatusChange && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="relative">
                        <select
                          value={item.status || column.id}
                          onChange={(e) => onStatusChange(item.id, e.target.value)}
                          className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm font-medium text-gray-700 appearance-none cursor-pointer hover:border-gray-400 transition-colors"
                        >
                          {item.type === 'task' ? (
                            // Task status options
                            <>
                              <option value="todo">Për të bërë</option>
                              <option value="in-progress">Në Progres</option>
                              <option value="review">Rishikim</option>
                              <option value="done">Përfunduar</option>
                            </>
                          ) : item.type === 'order' ? (
                            // Order status options
                            <>
                              <option value="pending">Në Pritje</option>
                              <option value="accepted">Pranuar</option>
                              <option value="processing">Në Procesim</option>
                              <option value="shipped">Dërguar</option>
                              <option value="delivered">Dorëzuar</option>
                              <option value="cancelled">Anuluar</option>
                            </>
                          ) : (
                            // Service status options
                            <>
                              <option value="received">Marrë</option>
                              <option value="in-progress">Në Progres</option>
                              <option value="waiting-parts">Duke Pritur Pjesët</option>
                              <option value="completed">Përfunduar</option>
                              <option value="delivered">Dërguar</option>
                            </>
                          )}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanBoard;