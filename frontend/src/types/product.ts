export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  in_stock: boolean;
  category?: string;
  vendor_id: string;
  created_at: string;
  updated_at: string;
  rating?: number;
  rating_count?: number;
  image_url?: string;
}

export interface ProductsState {
  items: Product[];
  selectedProduct: Product | null;
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  itemsPerPage: number;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CreateProductDto {
  name: string;
  description: string;
  price: number;
  stock: number;
  category?: string;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  category?: string;
}