import React, { useState, useEffect } from 'react';
import { ChevronDown, Search, User } from 'lucide-react';
import { apiCall, apiConfig } from '../../config/api';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface CustomerDropdownProps {
  value: string;
  onChange: (customerId: string, customerName: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

const CustomerDropdown: React.FC<CustomerDropdownProps> = ({
  value,
  onChange,
  placeholder = "Zgjidhni klientin",
  required = false,
  className = ""
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Fetch customers on component mount
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const response = await apiCall(apiConfig.endpoints.customers);
        setCustomers(response.data || []);
      } catch (error) {
        console.error('Error fetching customers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // Find selected customer when value changes
  useEffect(() => {
    if (value && customers.length > 0) {
      const customer = customers.find(c => c.id === value || c.name === value);
      setSelectedCustomer(customer || null);
    } else {
      setSelectedCustomer(null);
    }
  }, [value, customers]);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    onChange(customer.id, customer.name);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    setSelectedCustomer(null);
    onChange('', '');
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`}>
      <div
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer bg-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <span className={selectedCustomer ? "text-gray-900" : "text-gray-500"}>
              {selectedCustomer ? selectedCustomer.name : placeholder}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Kërko klientin..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
          </div>

          {/* Customer list */}
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="p-3 text-center text-gray-500">
                Po ngarkohen klientët...
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="p-3 text-center text-gray-500">
                {searchTerm ? 'Nuk u gjet asnjë klient' : 'Nuk ka klientë'}
              </div>
            ) : (
              filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => handleSelectCustomer(customer)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-500">{customer.email}</div>
                      {customer.phone && (
                        <div className="text-xs text-gray-400">{customer.phone}</div>
                      )}
                    </div>
                    {selectedCustomer?.id === customer.id && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Clear button */}
          {selectedCustomer && (
            <div className="p-2 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClear}
                className="w-full text-sm text-red-600 hover:text-red-800 py-1"
              >
                Fshi zgjedhjen
              </button>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default CustomerDropdown;
