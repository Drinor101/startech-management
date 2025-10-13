// Konfigurimi i API-së për backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://startech-management.onrender.com';
export const apiConfig = {
  baseURL: API_BASE_URL,
  endpoints: {
    users: '/api/users',
    products: '/api/products',
    orders: '/api/orders',
    services: '/api/services',
    tasks: '/api/tasks',
    tickets: '/api/tickets', // Tickets have their own endpoint
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

  try {
    const response = await fetch(`${apiConfig.baseURL}${endpoint}`, config);
    
    console.log('API Call - Response status:', response.status, response.statusText);
    console.log('API Call - Response ok:', response.ok);
    
    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    const responseData = await response.json();
    console.log('API Call - Response data:', responseData);
    return responseData;
  } catch (error) {
    console.error('API Call - Network Error:', error);
    
    // If it's a network error, try to wake up the backend
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.log('Attempting to wake up backend...');
      try {
        await fetch(`${apiConfig.baseURL}/api/health`, { method: 'GET' });
        console.log('Backend wake-up call sent');
      } catch (wakeUpError) {
        console.error('Backend wake-up failed:', wakeUpError);
      }
    }
    
    throw error;
  }
};
