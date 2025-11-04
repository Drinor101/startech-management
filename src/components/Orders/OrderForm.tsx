import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, ChevronDown } from 'lucide-react';
import { apiCall, apiConfig } from '../../config/api';
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
  const [wooCommerceProducts, setWooCommerceProducts] = useState<Product[]>([]);
  const [wooCommerceProductsLoaded, setWooCommerceProductsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [productSourceFilter, setProductSourceFilter] = useState<string>('Manual'); // Only show manual products for orders
  const [openDropdowns, setOpenDropdowns] = useState<{ [key: number]: boolean }>({});
  const [productSearchTerms, setProductSearchTerms] = useState<{ [key: number]: string }>({});
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

  // Fetch Manual products from API with caching
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        // Check if we already have products cached
        if (products.length > 0) {
          setLoading(false);
          return;
        }
        
        const params = new URLSearchParams();
        // Get Manual products by default
        params.append('source', 'Manual');
        
        console.log('Fetching Manual products for OrderForm...');
        const response = await apiCall(`${apiConfig.endpoints.products}?${params.toString()}`);
        console.log('OrderForm Products API response:', response);
        
        // Handle the correct API response structure
        const data = response.success ? response.data : [];
        setProducts(data || []);
        
        console.log(`Loaded ${data?.length || 0} Manual products for OrderForm`);
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
  }, [order]);

  // Fetch WooCommerce products when user searches - using backend search API
  // This searches based on the longest/most specific search term from any dropdown
  useEffect(() => {
    // Get all search terms and find the longest one (most specific)
    const searchTerms = Object.values(productSearchTerms) as string[];
    const activeSearchTerm = searchTerms
      .filter(term => term && term.trim().length > 0)
      .sort((a, b) => b.length - a.length)[0]; // Use longest search term

    // Only fetch if there's a search term
    if (!activeSearchTerm || activeSearchTerm.trim().length === 0) {
      setWooCommerceProducts([]);
      setWooCommerceProductsLoaded(false);
      return;
    }

    // Debounce search - wait 300ms after user stops typing
    const timeoutId = setTimeout(async () => {
      try {
        console.log(`🔍 Searching WooCommerce API for: "${activeSearchTerm}"`);
        
        // Fetch only matching products from WooCommerce API (search is done on backend)
        const params = new URLSearchParams();
        params.append('source', 'WooCommerce');
        params.append('search', activeSearchTerm.trim());
        params.append('page', '1');
        params.append('limit', '100'); // Get up to 100 matching results
        
        const response = await apiCall(`${apiConfig.endpoints.products}?${params.toString()}`);
        
        if (response.success && response.data) {
          setWooCommerceProducts(response.data);
          setWooCommerceProductsLoaded(true);
          console.log(`✅ Found ${response.data.length} WooCommerce products matching "${activeSearchTerm}"`);
        } else {
          setWooCommerceProducts([]);
          setWooCommerceProductsLoaded(false);
        }
      } catch (err) {
        console.error('Error searching WooCommerce products:', err);
        setWooCommerceProducts([]);
        setWooCommerceProductsLoaded(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [productSearchTerms]);

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

  // Update formData when order changes
  useEffect(() => {
    if (order?.products) {
      setFormData(prev => ({
        ...prev,
        items: order.products.map(p => ({ productId: p.id, quantity: p.quantity || 1 }))
      }));
    }
  }, [order]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Check if this is an existing order with a valid ID
      const isExistingOrder = order && order.id && order.id !== undefined;
      const url = isExistingOrder ? `/api/orders/${order.id}` : '/api/orders';
      const method = isExistingOrder ? 'PATCH' : 'POST';
      
      console.log('OrderForm - Submitting order:', formData);
      console.log('OrderForm - URL:', url, 'Method:', method);
      console.log('OrderForm - Is existing order:', isExistingOrder);
      
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
          message: isExistingOrder ? 'Porosia u përditësua me sukses' : 'Porosia u shtua me sukses',
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
      setProductSearchTerms(prev => ({
        ...prev,
        [index]: ''
      }));
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
    // First try to find in products array (Manual products)
    let product = products.find(p => p.id === productId);
    
    // If not found, check WooCommerce products
    if (!product) {
      product = wooCommerceProducts.find(p => p.id === productId);
    }
    
    // If still not found, check if it's a WooCommerce product from order
    if (!product && order?.products) {
      product = order.products.find(p => p.id === productId);
    }
    
    return product;
  };

  // Filter products based on search term and source filter
  const getFilteredProducts = (index: number) => {
    const searchTerm = productSearchTerms[index] || '';
    
    // If there's a search term, include both Manual and WooCommerce products
    if (searchTerm) {
      // WooCommerce products are already filtered by the backend API search
      // Manual products need to be filtered on the frontend
      const filteredManual = products.filter(p => 
        p.source === productSourceFilter &&
        (p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
         p.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      
      // Combine filtered Manual products with WooCommerce products (already filtered by API)
      return [...filteredManual, ...wooCommerceProducts];
    }
    
    // No search term - show only Manual products (default behavior)
    return products.filter(p => p.source === productSourceFilter);
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
      // First try to find in products array (Manual products)
      let product = products.find(p => p.id === item.productId);
      
      // If not found, check WooCommerce products
      if (!product) {
        product = wooCommerceProducts.find(p => p.id === item.productId);
      }
      
      // If still not found, check if it's a WooCommerce product from order
      if (!product && order?.products) {
        product = order.products.find(p => p.id === item.productId);
      }
      
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
            {!(order?.source === 'WooCommerce') && (
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-4 h-4" />
                Shto Produkt
              </button>
            )}
            {order?.source === 'WooCommerce' && (
              <span className="text-xs text-gray-500 italic">
                Produktet e porosive WooCommerce nuk mund të modifikohen
              </span>
            )}
          </div>
        </div>
        
        <div className="space-y-3">
          {formData.items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-7 relative dropdown-container">
                <button
                  type="button"
                  onClick={() => !(order?.source === 'WooCommerce') && toggleDropdown(index)}
                  disabled={order?.source === 'WooCommerce'}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-left flex items-center justify-between ${
                    order?.source === 'WooCommerce' 
                      ? 'bg-gray-100 cursor-not-allowed' 
                      : 'bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {item.productId && getSelectedProduct(item.productId)?.image && (
                      <img 
                        src={getSelectedProduct(item.productId)?.image} 
                        alt={getSelectedProduct(item.productId)?.title}
                        className="w-8 h-8 object-cover rounded"
                      />
                    )}
                    <span className="truncate">
                      {item.productId ? 
                        `${getSelectedProduct(item.productId)?.title || 'Produkt i zgjedhur'} - €${(getSelectedProduct(item.productId)?.finalPrice || 0).toFixed(2)}` 
                        : 'Zgjidh Produktin'
                      }
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openDropdowns[index] ? 'rotate-180' : ''}`} />
                </button>
                
                {openDropdowns[index] && !(order?.source === 'WooCommerce') && (
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
                            value={productSearchTerms[index] || ''}
                            onChange={(e) => setProductSearchTerms(prev => ({
                              ...prev,
                              [index]: e.target.value
                            }))}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                        </div>
                        
                        {/* Products list */}
                        <div className="max-h-48 overflow-y-auto">
                          {getFilteredProducts(index).length > 0 ? (
                            getFilteredProducts(index).map(product => (
                              <button
                                key={product.id}
                                type="button"
                                onClick={() => selectProduct(index, product.id)}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 hover:text-blue-700 border-b border-gray-100 last:border-b-0 flex items-center justify-between"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  {product.image && (
                                    <img 
                                      src={product.image} 
                                      alt={product.title}
                                      className="w-8 h-8 object-cover rounded"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{product.title}</div>
                                    <div className="text-xs text-gray-500 truncate">
                                      {product.category} - €{(product.finalPrice || 0).toFixed(2)} ({product.source})
                                    </div>
                                  </div>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-gray-500">
                              {productSearchTerms[index] ? 'Nuk u gjetën produkte që përputhen me kërkesën' : 'Nuk ka produkte të disponueshme'}
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
                  disabled={order?.source === 'WooCommerce'}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                    order?.source === 'WooCommerce' ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  placeholder="Sasi"
                />
              </div>
              <div className="col-span-2">
                {formData.items.length > 1 && !(order?.source === 'WooCommerce') && (
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