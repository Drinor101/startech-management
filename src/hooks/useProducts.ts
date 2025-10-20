import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiCall } from '../config/api';
import { apiConfig } from '../config/api';

export interface Product {
  id: string;
  image: string;
  title: string;
  category: string;
  basePrice: number;
  additionalCost: number;
  finalPrice: number;
  supplier: string;
  wooCommerceStatus: 'active' | 'inactive' | 'draft';
  wooCommerceCategory: string;
  lastSyncDate: string;
  source: 'WooCommerce' | 'Manual';
}

interface ProductsResponse {
  success: boolean;
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  message: string;
}

interface UseProductsParams {
  page?: number;
  limit?: number;
  source?: string;
  search?: string;
}

// Enhanced products fetch with React Query for better stability
export const useProducts = (params: UseProductsParams = {}) => {
  const {
    page = 1,
    limit = 25,
    source = 'all',
    search
  } = params;

  return useQuery<ProductsResponse>({
    queryKey: ['products', page, limit, source, search],
    queryFn: async (): Promise<ProductsResponse> => {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      if (source !== 'all') {
        queryParams.append('source', source);
      }

      if (search) {
        queryParams.append('search', search);
      }

      const response = await apiCall(`${apiConfig.endpoints.products}?${queryParams.toString()}`);
      return response as ProductsResponse;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
    gcTime: 15 * 60 * 1000, // 15 minutes - keep in cache longer
    retry: 3, // Retry 3 times on failure
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: true, // Refetch when reconnecting
    refetchOnMount: true, // Always refetch on component mount
    networkMode: 'online', // Only run when online
  });
};

// Enhanced WooCommerce sync mutation with better error handling
export const useWooCommerceSync = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiCall('/api/products/sync-woocommerce', {
        method: 'POST'
      });
      return response;
    },
    onSuccess: () => {
      // Invalidate and refetch products queries
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error) => {
      console.error('WooCommerce sync failed:', error);
    },
    retry: 2, // Retry sync on failure
    retryDelay: 2000, // 2 second delay between retries
  });
};

// Clear cache mutation
export const useClearCache = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiCall('/api/products/clear-cache', {
        method: 'POST'
      });
      return response;
    },
    onSuccess: () => {
      // Invalidate and refetch products queries
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

// Force refresh mutation
export const useForceRefresh = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiCall('/api/products/force-refresh', {
        method: 'POST'
      });
      return response;
    },
    onSuccess: () => {
      // Invalidate and refetch products queries
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

// Create product mutation
export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productData: Partial<Product>) => {
      const response = await apiCall(apiConfig.endpoints.products, {
        method: 'POST',
        body: JSON.stringify(productData)
      });
      return response;
    },
    onSuccess: () => {
      // Invalidate and refetch products queries
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

// Update product mutation
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...productData }: { id: string } & Partial<Product>) => {
      const response = await apiCall(`${apiConfig.endpoints.products}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData)
      });
      return response;
    },
    onSuccess: () => {
      // Invalidate and refetch products queries
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

// Delete product mutation
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiCall(`${apiConfig.endpoints.products}/${id}`, {
        method: 'DELETE'
      });
      return response;
    },
    onSuccess: () => {
      // Invalidate and refetch products queries
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};