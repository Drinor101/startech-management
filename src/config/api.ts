// Import Supabase për getAuthToken
import { supabase } from './supabase';

// Konfigurimi i API-së për backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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

// Funksioni për të marrë token-in nga Supabase
export const getAuthToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
};

// Funksioni për të bërë API calls me autentifikim
export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = await getAuthToken();
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${apiConfig.baseURL}${endpoint}`, config);
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};
