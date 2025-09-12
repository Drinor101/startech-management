// Konfigurimi i API-së për backend
const API_BASE_URL = 'https://startech-management-production.up.railway.app';
export const apiConfig = {
  baseURL: API_BASE_URL,
  endpoints: {
    users: '/api/users',
    products: '/api/products',
    orders: '/api/orders',
    services: '/api/services',
    tasks: '/api/tasks',
    tickets: '/api/tasks', // Tickets use the same endpoint as tasks
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
  
  console.log('API Call - User from localStorage:', user);
  console.log('API Call - User ID:', user?.id);
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(user && user.id && { 'X-User-ID': user.id }),
      ...options.headers,
    },
  };

  console.log('API Call - Headers:', config.headers);

  const response = await fetch(`${apiConfig.baseURL}${endpoint}`, config);
  
  if (!response.ok) {
    console.error(`API Error: ${response.status} ${response.statusText}`);
    const errorText = await response.text();
    console.error('API Error Response:', errorText);
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};
