import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { 
  Product, 
  ProductsState, 
  ProductFilters, 
  ProductsResponse,
  CreateProductDto,
  UpdateProductDto
} from '../../types/product';
import { API_BASE_URL } from '../../config';
import { getMockProducts, getMockProductById } from '../../mocks/products';
import { productApi } from '../../utils/api';

// 是否使用模拟数据
const USE_MOCK_DATA = false;

const initialState: ProductsState = {
  items: [],
  selectedProduct: null,
  isLoading: false,
  error: null,
  totalCount: 0,
  currentPage: 1,
  itemsPerPage: 12
};

// 异步操作：获取产品列表
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (filters: ProductFilters, { rejectWithValue }) => {
    try {
      // 如果使用模拟数据，直接返回模拟数据
      if (USE_MOCK_DATA) {
        console.log('使用模拟产品数据', filters);
        return getMockProducts(filters);
      }

      // 构建查询参数
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.minPrice) params.append('min_price', filters.minPrice.toString());
      if (filters.maxPrice) params.append('max_price', filters.maxPrice.toString());
      if (filters.sortBy) params.append('sort_by', filters.sortBy);
      if (filters.sortDirection) params.append('sort_direction', filters.sortDirection);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      
      console.log(`请求API: ${API_BASE_URL}/products?${params.toString()}`);
      
      const response = await axios.get(
        `${API_BASE_URL}/products?${params.toString()}`
      );
      
      // 检查API返回的数据格式
      console.log('API返回数据:', response.data);
      
      // 如果API返回的是产品数组而不是预期的ProductsResponse对象
      if (Array.isArray(response.data)) {
        return {
          products: response.data,
          total: response.data.length
        };
      }
      
      // 否则假定它是ProductsResponse格式
      return response.data;
    } catch (error: any) {
      console.error('获取产品列表失败，使用模拟数据', error);
      // 如果API请求失败，使用模拟数据
      return getMockProducts(filters);
    }
  }
);

// 异步操作：获取单个产品详情
export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (productId: string, { rejectWithValue }) => {
    try {
      // 尝试从API获取产品详情
      console.log(`尝试从API获取产品详情，ID: ${productId}`);
      console.log(`API请求URL: ${API_BASE_URL}/products/${productId}`);
      
      const response = await axios.get<Product>(`${API_BASE_URL}/products/${productId}`);
      console.log('从API获取到产品详情:', response.data);
      
      // 确保响应数据包含所有必要字段
      if (!response.data.description) {
        console.warn('API返回的产品详情缺少描述字段:', response.data);
        response.data.description = '暂无描述';
      }
      
      if (!response.data.rating) {
        response.data.rating = 0;
      }
      
      if (!response.data.rating_count) {
        response.data.rating_count = 0;
      }
      
      return response.data;
    } catch (error: any) {
      console.error('从API获取产品详情失败:', error);
      console.error('错误状态码:', error.response?.status);
      console.error('错误详情:', error.response?.data);
      
      // 尝试使用productApi获取
      try {
        console.log('尝试使用productApi获取产品详情');
        const product = await productApi.getProductById(productId);
        console.log('从productApi获取到产品详情:', product);
        
        // 确保产品数据包含所有必要字段
        if (!product.description) {
          console.warn('productApi返回的产品详情缺少描述字段:', product);
          product.description = '暂无描述';
        }
        
        if (!product.rating) {
          product.rating = 0;
        }
        
        if (!product.rating_count) {
          product.rating_count = 0;
        }
        
        return product;
      } catch (apiError: any) {
        console.error('从productApi获取产品详情失败:', apiError);
        console.error('错误状态码:', apiError.response?.status);
        console.error('错误详情:', apiError.response?.data);
        
        // 如果API请求失败，尝试使用模拟数据
        const product = getMockProductById(productId);
        if (product) {
          console.log('使用模拟数据:', product);
          return product;
        }
        
        return rejectWithValue(error.response?.data?.message || '获取产品详情失败');
      }
    }
  }
);

// 异步操作：创建新产品（供应商/管理员功能）
export const createProduct = createAsyncThunk(
  'products/createProduct',
  async (productData: CreateProductDto, { rejectWithValue }) => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        return rejectWithValue('未登录');
      }

      const response = await axios.post<Product>(
        `${API_BASE_URL}/products`, 
        productData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '创建产品失败');
    }
  }
);

// 异步操作：更新产品（供应商/管理员功能）
export const updateProduct = createAsyncThunk(
  'products/updateProduct',
  async ({ productId, productData }: { productId: string; productData: UpdateProductDto }, { rejectWithValue }) => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        return rejectWithValue('未登录');
      }

      const response = await axios.put<Product>(
        `${API_BASE_URL}/products/${productId}`, 
        productData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '更新产品失败');
    }
  }
);

// 异步操作：删除产品（供应商/管理员功能）
export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async (productId: string, { rejectWithValue }) => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        return rejectWithValue('未登录');
      }

      await axios.delete(`${API_BASE_URL}/products/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      return productId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '删除产品失败');
    }
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearSelectedProduct: (state) => {
      state.selectedProduct = null;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    setItemsPerPage: (state, action: PayloadAction<number>) => {
      state.itemsPerPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    // 获取产品列表
    builder.addCase(fetchProducts.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchProducts.fulfilled, (state, action) => {
      state.isLoading = false;
      state.items = action.payload.products;
      state.totalCount = action.payload.total;
      state.currentPage = action.meta.arg.page || 1;
    });
    builder.addCase(fetchProducts.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // 获取单个产品详情
    builder.addCase(fetchProductById.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchProductById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.selectedProduct = action.payload;
    });
    builder.addCase(fetchProductById.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // 创建产品
    builder.addCase(createProduct.fulfilled, (state, action) => {
      state.items.push(action.payload);
      state.totalCount += 1;
    });
    
    // 更新产品
    builder.addCase(updateProduct.fulfilled, (state, action) => {
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
      if (state.selectedProduct?.id === action.payload.id) {
        state.selectedProduct = action.payload;
      }
    });
    
    // 删除产品
    builder.addCase(deleteProduct.fulfilled, (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload);
      state.totalCount -= 1;
      if (state.selectedProduct?.id === action.payload) {
        state.selectedProduct = null;
      }
    });
  },
});

export const { clearSelectedProduct, setCurrentPage, setItemsPerPage } = productsSlice.actions;
export default productsSlice.reducer; 