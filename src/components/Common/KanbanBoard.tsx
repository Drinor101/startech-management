import React from 'react';
import { Plus } from 'lucide-react';

interface KanbanColumn {
  id: string;
  title: string;
  items: any[];
  color: string;
}

interface KanbanBoardProps {
  columns: KanbanColumn[];
  renderCard: (item: any) => React.ReactNode;
  onAddItem?: (columnId: string) => void;
  onStatusChange?: (itemId: string, newStatus: string) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ columns, renderCard, onAddItem, onStatusChange }) => {
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
                      <select
                        value={item.status || column.id}
                        onChange={(e) => onStatusChange(item.id, e.target.value)}
                        className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {item.type === 'task' ? (
                          // Task status options
                          <>
                            <option value="todo">Për të bërë</option>
                            <option value="in-progress">Në Progres</option>
                            <option value="review">Rishikim</option>
                            <option value="done">Përfunduar</option>
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