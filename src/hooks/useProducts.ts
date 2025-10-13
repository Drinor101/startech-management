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

// Fetch products with React Query
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
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

// WooCommerce sync mutation
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