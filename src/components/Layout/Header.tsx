import React, { useState, useEffect, useRef } from 'react';
import { Menu, Search } from 'lucide-react';
import { apiCall, apiConfig } from '../../config/api';

interface HeaderProps {
  onToggleSidebar: () => void;
  title: string;
  onModuleChange?: (module: string) => void;
}

interface SearchResult {
  id: string;
  title: string;
  type: 'task' | 'ticket' | 'service' | 'order' | 'product' | 'customer';
  status?: string;
  priority?: string;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, title, onModuleChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      // Search across all entities with improved error handling
      const [tasksRes, ticketsRes, servicesRes, ordersRes, productsRes, customersRes] = await Promise.all([
        apiCall(`${apiConfig.endpoints.tasks}?search=${encodeURIComponent(query)}`).catch((err) => {
          console.error('Tasks search error:', err);
          return { data: [] };
        }),
        apiCall(`${apiConfig.endpoints.tickets}?search=${encodeURIComponent(query)}`).catch((err) => {
          console.error('Tickets search error:', err);
          return { data: [] };
        }),
        apiCall(`${apiConfig.endpoints.services}?search=${encodeURIComponent(query)}`).catch((err) => {
          console.error('Services search error:', err);
          return { data: [] };
        }),
        apiCall(`${apiConfig.endpoints.orders}?search=${encodeURIComponent(query)}`).catch((err) => {
          console.error('Orders search error:', err);
          return { data: [] };
        }),
        apiCall(`${apiConfig.endpoints.products}?search=${encodeURIComponent(query)}`).catch((err) => {
          console.error('Products search error:', err);
          return { data: [] };
        }),
        apiCall(`${apiConfig.endpoints.customers}?search=${encodeURIComponent(query)}`).catch((err) => {
          console.error('Customers search error:', err);
          return { data: [] };
        })
      ]);

      const results: SearchResult[] = [
        // Tasks with improved title mapping
        ...(tasksRes.data || []).map((item: any) => ({ 
          ...item, 
          type: 'task' as const,
          title: item.title || `Task ${item.id}`,
          status: item.status,
          priority: item.priority
        })),
        // Tickets with improved title mapping
        ...(ticketsRes.data || []).map((item: any) => ({ 
          ...item, 
          type: 'ticket' as const,
          title: item.title || `Tiket ${item.id}`,
          status: item.status,
          priority: item.priority
        })),
        // Services with improved title mapping
        ...(servicesRes.data || []).map((item: any) => ({ 
          ...item, 
          type: 'service' as const,
          title: item.problem_description || `Shërbim ${item.id}`,
          status: item.status
        })),
        // Orders
        ...(ordersRes.data || []).map((item: any) => ({ 
          ...item, 
          type: 'order' as const,
          title: `Porosi ${item.id}`,
          status: item.status
        })),
        // Products
        ...(productsRes.data || []).map((item: any) => ({ 
          ...item, 
          type: 'product' as const,
          title: item.title || item.name || `Produkt ${item.id}`
        })),
        // Customers
        ...(customersRes.data || []).map((item: any) => ({ 
          ...item, 
          type: 'customer' as const,
          title: item.name || item.email || `Klient ${item.id}`
        }))
      ];

      // Sort results by relevance (exact matches first, then partial matches)
      const sortedResults = results.sort((a, b) => {
        const aExact = a.id.toLowerCase().includes(query.toLowerCase()) || a.title.toLowerCase().includes(query.toLowerCase());
        const bExact = b.id.toLowerCase().includes(query.toLowerCase()) || b.title.toLowerCase().includes(query.toLowerCase());
        
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return 0;
      });

      setSearchResults(sortedResults.slice(0, 20)); // Limit to 20 results for performance
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(value);
    }, 300);
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      task: 'Task',
      ticket: 'Tiket',
      service: 'Shërbim',
      order: 'Porosi',
      product: 'Produkt',
      customer: 'Klient'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      task: 'bg-blue-100 text-blue-800',
      ticket: 'bg-orange-100 text-orange-800',
      service: 'bg-green-100 text-green-800',
      order: 'bg-purple-100 text-purple-800',
      product: 'bg-indigo-100 text-indigo-800',
      customer: 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleItemClick = (result: SearchResult) => {
    setShowResults(false);
    setSearchQuery('');
    
    // Navigate to the appropriate module based on type
    if (onModuleChange) {
      switch (result.type) {
        case 'task':
          onModuleChange('tasks');
          break;
        case 'ticket':
          onModuleChange('tickets');
          break;
        case 'service':
          onModuleChange('services');
          break;
        case 'order':
          onModuleChange('orders');
          break;
        case 'product':
          onModuleChange('products');
          break;
        case 'customer':
          onModuleChange('customers');
          break;
        default:
          console.log('Unknown type:', result.type);
      }
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative" ref={searchRef}>
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Kërko me ID (TSK-2024-001), titull, përshkrim, emër, email..."
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={() => setShowResults(searchResults.length > 0)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm shadow-sm hover:border-gray-400 transition-colors min-w-[400px] w-[500px]"
            />
            
            {/* Search Results Dropdown */}
            {showResults && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                {isSearching ? (
                  <div className="p-4 text-center text-gray-500">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Duke kërkuar...
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((result) => (
                      <div
                        key={`${result.type}-${result.id}`}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => handleItemClick(result)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm">
                              {result.title}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              ID: {result.id}
                              {result.priority && (
                                <span className="ml-2 px-1 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800">
                                  {result.priority}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(result.type)}`}>
                              {getTypeLabel(result.type)}
                            </span>
                            {result.status && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                {result.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    <div className="text-sm mb-2">Nuk u gjet asgjë për "{searchQuery}"</div>
                    <div className="text-xs text-gray-400">
                      Provo të kërkosh me: ID (TSK-2024-001, SRV-2024-001, TIK-2024-001), titull, përshkrim, emër, email, telefon
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;