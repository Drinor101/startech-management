// Konfigurimi i API-së për backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://startech-management-production.up.railway.app';

export const apiConfig = {
  baseURL: API_BASE_URL,
  endpoints: {
    users: '/api/users',
    products: '/api/products',
    orders: '/api/orders',
    services: '/api/services',
    tasks: '/api/tasks',
    customers: '/api/customers',
    reports: '/api/reports',
    health: '/api/health'
  }
};

// Funksioni për të marrë user-in nga localStorage
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Funksioni për të bërë API calls
export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const user = getCurrentUser();
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(user && { 'X-User-ID': user.id }),
      ...options.headers,
    },
  };

  const response = await fetch(`${apiConfig.baseURL}${endpoint}`, config);
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};
