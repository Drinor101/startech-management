import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, ChevronDown } from 'lucide-react';
import { apiCall } from '../../config/api';
import { Product } from '../../types';
import Notification from '../Common/Notification';
import CustomerDropdown from '../Common/CustomerDropdown';

interface OrderFormProps {
  order?: any;
  onClose: () => void;
  onSuccess?: () => void;
}

interface OrderItem {
  productId: string;
  quantity: number;
}

const OrderForm: React.FC<OrderFormProps> = ({ order, onClose, onSuccess }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [productSourceFilter, setProductSourceFilter] = useState<string>('Manual'); // Only show manual products for orders
  const [openDropdowns, setOpenDropdowns] = useState<{ [key: number]: boolean }>({});
  const [productSearchTerm, setProductSearchTerm] = useState<string>('');
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    isVisible: boolean;
  }>({
    type: 'success',
    message: '',
    isVisible: false
  });
  const [formData, setFormData] = useState({
    customerId: order?.customer?.id || order?.customerId || '',
    customerName: order?.customer?.name || '',
    items: order?.products?.map(p => ({ productId: p.id, quantity: p.quantity })) || [{ productId: '', quantity: 1 }] as OrderItem[],
    shippingAddress: order?.shippingInfo?.address || '',
    shippingCity: order?.shippingInfo?.city || '',
    shippingZipCode: order?.shippingInfo?.zipCode || '',
    shippingMethod: order?.shippingInfo?.method || 'Standard Post',
    notes: order?.notes || '',
    teamNotes: order?.teamNotes || ''
  });

  // Fetch products from API with caching
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        // Check if we already have products cached
        if (products.length > 0 && productSourceFilter === 'all') {
          setLoading(false);
          return;
        }
        
        const params = new URLSearchParams();
        // Get all products without limit
        if (productSourceFilter !== 'all') {
          params.append('source', productSourceFilter);
        }
        
        console.log('Fetching products for OrderForm...');
        const response = await apiCall(`/api/products?${params.toString()}`);
        console.log('OrderForm Products API response:', response);
        
        // Handle the correct API response structure
        const data = response.success ? response.data : [];
        setProducts(data || []);
        
        console.log(`Loaded ${data?.length || 0} products for OrderForm`);
      } catch (err) {
        console.error('Error fetching products:', err);
        // Keep existing products if API fails
        if (products.length === 0) {
          setProducts([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [productSourceFilter]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setOpenDropdowns({});
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = order ? `/api/orders/${order.id}` : '/api/orders';
      const method = order ? 'PATCH' : 'POST';
      
      console.log('OrderForm - Submitting order:', formData);
      console.log('OrderForm - URL:', url, 'Method:', method);
      
      const response = await apiCall(url, {
        method,
        body: JSON.stringify(formData)
      });
      
      console.log('OrderForm - API Response:', response);
      
      if (response.success) {
        console.log('Order saved successfully:', response);
        setShowSuccess(true);
        setNotification({
          type: 'success',
          message: order ? 'Porosia u përditësua me sukses' : 'Porosia u shtua me sukses',
          isVisible: true
        });
        
        // Call onSuccess after a short delay to show the notification
        setTimeout(() => {
          onSuccess?.();
        }, 1000);
      } else {
        console.error('Error saving order:', response.error);
        setNotification({
          type: 'error',
          message: `Gabim në krijimin e porosisë: ${response.error}`,
          isVisible: true
        });
      }
    } catch (error) {
      console.error('Error saving order:', error);
      setNotification({
        type: 'error',
        message: `Gabim në krijimin e porosisë: ${error.message}`,
        isVisible: true
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCustomerChange = (customerId: string, customerName: string) => {
    setFormData(prev => ({
      ...prev,
      customerId,
      customerName
    }));
  };

  const handleItemChange = (index: number, field: keyof OrderItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const toggleDropdown = (index: number) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
    
    // Reset search when opening dropdown
    if (!openDropdowns[index]) {
      setProductSearchTerm('');
    }
  };

  const selectProduct = (index: number, productId: string) => {
    handleItemChange(index, 'productId', productId);
    setOpenDropdowns(prev => ({
      ...prev,
      [index]: false
    }));
  };

  const getSelectedProduct = (productId: string) => {
    return products.find(p => p.id === productId);
  };

  // Filter products based on search term and source filter
  const getFilteredProducts = () => {
    let filtered = products;
    
    // Apply source filter
    if (productSourceFilter !== 'all') {
      filtered = filtered.filter(p => p.source === productSourceFilter);
    }
    
    // Apply search filter
    if (productSearchTerm) {
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(productSearchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', quantity: 1 }]
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateTotal = () => {
    return formData.items.reduce((total, item) => {
      const product = products.find(p => p.id === item.productId);
      return total + (product ? (product.finalPrice || 0) * (item.quantity || 0) : 0);
    }, 0);
  };

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Klienti *</label>
        <CustomerDropdown
          value={formData.customerId}
          onChange={handleCustomerChange}
          placeholder="Zgjidhni klientin"
          required
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">Produktet</label>
          <div className="flex items-center gap-3">
            {/* Product Source Filter */}
            <div className="relative">
              <select
                value={productSourceFilter}
                onChange={(e) => setProductSourceFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">Të gjitha produktet</option>
                <option value="WooCommerce">Vetëm WooCommerce</option>
                <option value="Manual">Vetëm Manuale</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-4 h-4" />
              Shto Produkt
            </button>
          </div>
        </div>
        
        <div className="space-y-3">
          {formData.items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-7 relative dropdown-container">
                <button
                  type="button"
                  onClick={() => toggleDropdown(index)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-left bg-white flex items-center justify-between"
                >
                  <span className="truncate">
                    {item.productId ? 
                      `${getSelectedProduct(item.productId)?.title || 'Produkt i zgjedhur'} - €${(getSelectedProduct(item.productId)?.finalPrice || 0).toFixed(2)}` 
                      : 'Zgjidh Produktin'
                    }
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openDropdowns[index] ? 'rotate-180' : ''}`} />
                </button>
                
                {openDropdowns[index] && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {loading ? (
                      <div className="px-3 py-2 text-sm text-gray-500 flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        Duke ngarkuar produktet...
                      </div>
                    ) : (
                      <>
                        {/* Search input */}
                        <div className="p-2 border-b border-gray-200">
                          <input
                            type="text"
                            placeholder="Kërko produktet..."
                            value={productSearchTerm}
                            onChange={(e) => setProductSearchTerm(e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        
                        {/* Products list */}
                        <div className="max-h-48 overflow-y-auto">
                          {getFilteredProducts().length > 0 ? (
                            getFilteredProducts().map(product => (
                              <button
                                key={product.id}
                                type="button"
                                onClick={() => selectProduct(index, product.id)}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 hover:text-blue-700 border-b border-gray-100 last:border-b-0 flex items-center justify-between"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">{product.title}</div>
                                  <div className="text-xs text-gray-500 truncate">
                                    {product.category} - €{(product.finalPrice || 0).toFixed(2)} ({product.source})
                                  </div>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-gray-500">
                              {productSearchTerm ? 'Nuk u gjetën produkte që përputhen me kërkesën' : 'Nuk ka produkte të disponueshme'}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="col-span-3">
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Sasi"
                />
              </div>
              <div className="col-span-2">
                {formData.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Informacioni i Dërgimit</label>
        <div className="space-y-3">
          <input
            type="text"
            name="shippingAddress"
            value={formData.shippingAddress}
            onChange={handleChange}
            placeholder="Adresa e Rrugës"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              name="shippingCity"
              value={formData.shippingCity}
              onChange={handleChange}
              placeholder="Qyteti"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              required
            />
            <input
              type="text"
              name="shippingZipCode"
              value={formData.shippingZipCode}
              onChange={handleChange}
              placeholder="Kodi Postar"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Metoda e Dërgimit</label>
          <select
            name="shippingMethod"
            value={formData.shippingMethod}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="Standard Post">Posta Standarde</option>
            <option value="Express Post">Posta e Shpejtë</option>
            <option value="Overnight">Gjatë Natës</option>
            <option value="Pickup">Marrja nga Klienti</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Shënime (Opsionale)</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Shënime shtesë ose udhëzime të veçanta..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Shënim shtesë (për ekipin)</label>
        <textarea
          name="teamNotes"
          value={formData.teamNotes}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Shënime të veçanta për ekipin e punës..."
        />
      </div>

      {order && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Statusi</label>
          <select
            name="status"
            value={formData.status || order.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="pending">Në Pritje</option>
            <option value="accepted">Pranuar</option>
            <option value="processing">Në Procesim</option>
            <option value="shipped">Dërguar</option>
            <option value="delivered">Dorëzuar</option>
            <option value="cancelled">Anuluar</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      )}


      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-lg font-medium text-gray-900">Totali</span>
          <span className="text-lg font-bold text-gray-900">{calculateTotal().toFixed(2)} €</span>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Anulo
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {order ? 'Përditëso Porosinë' : 'Krijo Porosi'}
        </button>
      </div>
    </form>

    {/* Success Notification */}
    <Notification
      type="success"
      message={order ? 'Porosia u përditësua me sukses!' : 'Porosia u shtua me sukses!'}
      isVisible={showSuccess}
      onClose={() => setShowSuccess(false)}
    />

    {/* Error Notification */}
    <Notification
      type={notification.type}
      message={notification.message}
      isVisible={notification.isVisible}
      onClose={() => setNotification(prev => ({ ...prev, isVisible: false }))}
    />
    </>
  );
};

export default OrderForm;