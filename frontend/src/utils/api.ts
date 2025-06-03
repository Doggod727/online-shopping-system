import axios from 'axios';
import { LoginDto, AuthResponse, RegisterDto, UserRole } from '../types/auth';
import { Product, CreateProductDto, UpdateProductDto } from '../types/product';
import { OrderStatus } from '../types/order';
import { CartResponse } from '../types/cart';

// 创建一个axios实例
const api = axios.create({
  baseURL: 'http://127.0.0.1:8080/api', // 使用127.0.0.1而不是localhost
  timeout: 10000, // 增加请求超时时间到10秒
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：在请求发送前处理
api.interceptors.request.use(
  (config) => {
    // 从sessionStorage获取token (替代localStorage)
    const token = sessionStorage.getItem('token');
    
    // 如果有token，添加到请求头
    if (token) {
      // 确保Authorization头格式正确
      config.headers.Authorization = `Bearer ${token}`;
      console.log('请求添加授权头:', config.url, '| Token前20字符:', token.substring(0, 20) + '...');
    } else {
      console.warn('请求缺少授权头:', config.url);
    }
    
    return config;
  },
  (error) => {
    console.error('请求拦截器错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器：处理响应数据或错误
api.interceptors.response.use(
  (response) => {
    // 如果响应成功，直接返回数据
    return response.data;
  },
  (error) => {
    // 记录详细的错误信息
    if (error.response) {
      console.error(`请求失败: ${error.config.url}, 状态码: ${error.response.status}`);
      console.error('错误详情:', error.response.data);
      console.error('完整错误信息:', error);
      
      // 处理401错误（未授权）
      if (error.response.status === 401) {
        console.error('401未授权错误，清除token并重定向到登录页面');
        // 清除token
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        
        // 重定向到登录页面
        window.location.href = '/login';
      }
    } else if (error.request) {
      console.error('请求未收到响应:', error.request);
    } else {
      console.error('请求配置错误:', error.message);
    }
    
    // 返回错误信息
    return Promise.reject(error);
  }
);

// 认证相关API
export const authApi = {
  // 登录
  login: async (data: LoginDto): Promise<AuthResponse> => {
    try {
      const response = await api.post<any, AuthResponse>('auth/login', data);
      // 保存token到sessionStorage
      sessionStorage.setItem('token', response.token);
      // 保存完整用户信息到sessionStorage
      sessionStorage.setItem('user', JSON.stringify(response.user));
      return response;
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  },
  
  // 注册
  register: async (data: RegisterDto): Promise<AuthResponse> => {
    try {
      const response = await api.post<any, AuthResponse>('auth/register', data);
      // 保存token到sessionStorage
      sessionStorage.setItem('token', response.token);
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // 获取当前用户信息
  getCurrentUser: async () => {
    try {
      // 确保发送请求时带有token
      const token = sessionStorage.getItem('token');
      
      if (!token) {
        console.error('getCurrentUser: 未找到认证token');
        throw new Error('未找到认证token');
      }
      
      // 获取用户信息
      return await api.get('auth/me');
    } catch (error: any) {
      console.error('getCurrentUser: 获取当前用户信息失败:', error);
      
      // 如果是401错误，清除token
      if (error.response && error.response.status === 401) {
        console.error('getCurrentUser: 401未授权错误，清除token');
        sessionStorage.removeItem('token');
      }
      
      throw error;
    }
  },
  
  // 登出
  logout: () => {
    console.log('执行登出操作，清除所有用户数据');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    window.location.href = '/login';
  }
};

// 产品相关API
export interface ProductsResponse {
  products: Product[];
  total: number;
}

export const productApi = {
  // 获取所有产品
  getAllProducts: async (page = 1, pageSize = 100): Promise<ProductsResponse> => {
    try {
      const response = await api.get<any, any>('products', {
        params: {
          limit: pageSize,
          page: page
        }
      });
      
      // 确保返回的结构正确
      if (response && Array.isArray(response.products)) {
        console.log(`获取到产品数组(从response.products)，数量: ${response.products.length}，总数: ${response.total || 'unknown'}`);
        return {
          products: response.products,
          total: response.total || response.products.length
        };
      } else if (Array.isArray(response)) {
        console.log('获取到产品数组，数量:', response.length);
        return {
          products: response,
          total: response.length
        };
      } else {
        console.error('API返回的产品数据不是预期格式:', response);
        return {
          products: [],
          total: 0
        };
      }
    } catch (error) {
      console.error('获取产品列表失败:', error);
      throw error;
    }
  },
  
  // 获取所有产品（分页获取全部）
  getAllProductsWithPagination: async (): Promise<ProductsResponse> => {
    try {
      // 先获取第一页和总数
      const firstPageResponse = await productApi.getAllProducts(1, 100);
      const totalProducts = firstPageResponse.total;
      let allProducts = [...firstPageResponse.products];
      
      // 如果总数大于已获取的数量，继续获取剩余页面
      if (totalProducts > allProducts.length) {
        const totalPages = Math.ceil(totalProducts / 100);
        console.log(`产品总数: ${totalProducts}, 总页数: ${totalPages}, 继续获取剩余页面...`);
        
        // 并行获取剩余页面
        const remainingPagesPromises: Promise<ProductsResponse>[] = [];
        for (let page = 2; page <= totalPages; page++) {
          remainingPagesPromises.push(productApi.getAllProducts(page, 100));
        }
        
        const remainingPagesResults = await Promise.all(remainingPagesPromises);
        
        // 合并所有页面的产品
        for (const pageResult of remainingPagesResults) {
          allProducts = [...allProducts, ...pageResult.products];
        }
        
        console.log(`成功获取所有 ${allProducts.length} 个产品`);
      }
      
      return {
        products: allProducts,
        total: totalProducts
      };
    } catch (error) {
      console.error('获取所有产品失败:', error);
      throw error;
    }
  },
  
  // 获取单个产品
  getProductById: async (id: string): Promise<Product> => {
    try {
      console.log(`正在请求产品详情: ${id}`);
      const response = await api.get<any, Product>(`products/${id}`);
      console.log(`成功获取产品详情:`, response);
      
      // 确保响应数据包含所有必要字段
      if (!response.description) {
        console.warn('API返回的产品详情缺少描述字段:', response);
        response.description = '暂无描述';
      }
      
      if (!response.rating) {
        response.rating = 0;
      }
      
      if (!response.rating_count) {
        response.rating_count = 0;
      }
      
      return response;
    } catch (error) {
      console.error(`获取产品详情失败: ${id}`, error);
      throw error;
    }
  },
  
  // 创建产品（供应商）
  createProduct: async (data: CreateProductDto): Promise<Product> => {
    try {
      return await api.post<any, Product>('products', data);
    } catch (error) {
      throw error;
    }
  },
  
  // 更新产品（供应商）
  updateProduct: async (id: string, data: UpdateProductDto): Promise<Product> => {
    try {
      return await api.put<any, Product>(`products/${id}`, data);
    } catch (error) {
      throw error;
    }
  },
  
  // 删除产品（供应商）
  deleteProduct: async (id: string): Promise<void> => {
    try {
      await api.delete(`products/${id}`);
    } catch (error) {
      throw error;
    }
  },
  
  // 获取供应商自己的产品
  getVendorProducts: async (): Promise<Product[]> => {
    try {
      console.log('获取供应商商品列表');
      const response = await api.get<any, Product[]>('products/vendor');
      console.log('获取供应商商品成功:', response);
      return response;
    } catch (error) {
      console.error('获取供应商商品列表失败:', error);
      throw error;
    }
  }
};

// 订单相关接口
export interface OrderItem {
  id: string;
  product_id: string;
  price: number;
  quantity: number;
  name?: string;
  image_url?: string;
}

export interface Order {
  id: string;
  user_id: string;
  total: number;
  status: OrderStatus;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
  address?: string;
  payment_method?: string;
}

export interface OrdersResponse {
  orders: Order[];
}

export interface OrderResponse {
  order: Order;
}

// 订单相关API
export const orderApi = {
  // 获取用户订单
  getUserOrders: async (): Promise<OrdersResponse | Order[]> => {
    try {
      console.log('发送获取订单请求');
      return await api.get('orders');
    } catch (error) {
      console.error('获取订单失败:', error);
      throw error;
    }
  },
  
  // 获取订单详情
  getOrderById: async (id: string): Promise<OrderResponse | Order> => {
    try {
      console.log(`获取订单详情, ID: ${id}`);
      return await api.get(`orders/${id}`);
    } catch (error) {
      console.error('获取订单详情失败:', error);
      throw error;
    }
  },
  
  // 获取所有订单（管理员专用）
  getAllOrders: async (): Promise<OrdersResponse | Order[]> => {
    try {
      console.log('管理员获取所有订单');
      return await api.get('orders/all');
    } catch (error) {
      console.error('获取所有订单失败:', error);
      throw error;
    }
  },
  
  // 获取供应商订单
  getVendorOrders: async (): Promise<OrdersResponse | Order[]> => {
    try {
      console.log('供应商获取订单');
      return await api.get('orders/vendor');
    } catch (error) {
      console.error('获取供应商订单失败:', error);
      throw error;
    }
  },
  
  // 更新订单状态
  updateOrderStatus: async (orderId: string, status: string): Promise<Order> => {
    try {
      console.log(`更新订单 ${orderId} 状态为 ${status}`);
      return await api.put(`orders/${orderId}/status`, { status });
    } catch (error) {
      console.error('更新订单状态失败:', error);
      throw error;
    }
  },
  
  // 结账 - 将购物车转换为订单
  checkout: async (): Promise<Order> => {
    try {
      console.log('发送结账请求');
      return await api.post('cart/checkout');
    } catch (error: any) {
      console.error('结账失败:', error);
      if (error.response && error.response.data) {
        // 如果有详细错误信息，重新抛出包含错误信息的错误
        throw new Error(error.response.data.message || '结账失败，服务器返回错误');
      }
      throw error;
    }
  }
};

// 收藏夹相关接口
export interface FavoriteItem {
  id: string;
  product_id: string;
  user_id: string;
  created_at: string;
}

export interface FavoritesResponse {
  favorites: FavoriteItem[];
}

// 定义检查收藏状态的响应接口
export interface CheckFavoriteResponse {
  favorited: boolean;
}

// 收藏夹相关API
export const favoriteApi = {
  // 获取用户收藏列表
  getUserFavorites: async (): Promise<FavoritesResponse> => {
    try {
      console.log('获取用户收藏列表');
      return await api.get('favorites');
    } catch (error) {
      console.error('获取收藏列表失败:', error);
      throw error;
    }
  },
  
  // 添加商品到收藏夹
  addToFavorites: async (productId: string) => {
    try {
      console.log('添加商品到收藏夹:', productId);
      return await api.post('favorites', { product_id: productId });
    } catch (error) {
      console.error('添加收藏失败:', error);
      throw error;
    }
  },
  
  // 从收藏夹移除商品
  removeFromFavorites: async (productId: string) => {
    try {
      console.log('从收藏夹移除商品:', productId);
      return await api.delete(`favorites/${productId}`);
    } catch (error) {
      console.error('移除收藏失败:', error);
      throw error;
    }
  },
  
  // 检查商品是否已收藏
  isProductFavorited: async (productId: string): Promise<boolean> => {
    try {
      console.log('检查商品是否已收藏:', productId);
      const response = await api.get<any, CheckFavoriteResponse>(`favorites/check/${productId}`);
      return response.favorited;
    } catch (error) {
      console.error('检查收藏状态失败:', error);
      return false;
    }
  }
};

// 购物车相关API
export const cartApi = {
  // 获取购物车
  getCart: async (): Promise<CartResponse> => {
    try {
      return await api.get('cart');
    } catch (error) {
      console.error('获取购物车失败:', error);
      throw error;
    }
  },
  
  // 添加商品到购物车
  addToCart: async (productId: string, quantity: number) => {
    try {
      return await api.post('cart/add', { product_id: productId, quantity });
    } catch (error) {
      console.error('添加商品到购物车失败:', error);
      throw error;
    }
  },
  
  // 更新购物车商品数量
  updateCartItem: async (productId: string, quantity: number) => {
    try {
      console.log(`正在更新购物车商品: ID=${productId}, 数量=${quantity}`);
      // 这里需要使用购物车项目ID，而不是产品ID
      return await api.put(`cart/${productId}`, { quantity });
    } catch (error) {
      console.error('更新购物车商品数量失败:', error);
      throw error;
    }
  },
  
  // 从购物车移除商品
  removeFromCart: async (productId: string) => {
    try {
      console.log(`正在从购物车移除商品: ID=${productId}`);
      // 这里需要使用购物车项目ID，而不是产品ID
      return await api.delete(`cart/${productId}`);
    } catch (error) {
      console.error('从购物车移除商品失败:', error);
      throw error;
    }
  },
  
  // 清空购物车
  clearCart: async () => {
    try {
      return await api.delete('cart');
    } catch (error) {
      console.error('清空购物车失败:', error);
      throw error;
    }
  }
};

// 用户详细信息接口
export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  username?: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
  gender?: string;
  birth_date?: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateUserProfileDto {
  username?: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
  gender?: string;
  birth_date?: string;
}

// 用户详细信息相关API
export const profileApi = {
  // 获取用户详细信息
  getUserProfile: async (): Promise<UserProfile> => {
    try {
      console.log('获取用户详细信息，URL:', api.defaults.baseURL + '/profile');
      const response = await api.get<any, UserProfile>('/profile');
      console.log('获取用户详细信息成功:', response);
      return response;
    } catch (error: any) {
      console.error('获取用户详细信息失败:', error);
      // 更详细的错误日志
      if (error.response) {
        console.error('错误状态码:', error.response.status);
        console.error('错误数据:', error.response.data);
        console.error('错误头信息:', error.response.headers);
      } else if (error.request) {
        console.error('请求已发送但未收到响应:', error.request);
      } else {
        console.error('请求设置时发生错误:', error.message);
      }
      throw error;
    }
  },
  
  // 更新用户详细信息
  updateUserProfile: async (profileData: UpdateUserProfileDto): Promise<UserProfile> => {
    try {
      console.log('更新用户详细信息:', profileData);
      console.log('更新URL:', api.defaults.baseURL + '/profile');
      const response = await api.put<any, UserProfile>('/profile', profileData);
      console.log('更新用户详细信息成功:', response);
      return response;
    } catch (error: any) {
      console.error('更新用户详细信息失败:', error);
      // 更详细的错误日志
      if (error.response) {
        console.error('错误状态码:', error.response.status);
        console.error('错误数据:', error.response.data);
      }
      throw error;
    }
  },
  
  // 修改密码
  changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    try {
      console.log('修改密码');
      console.log('修改密码URL:', api.defaults.baseURL + '/auth/password');
      console.log('修改密码参数:', { old_password: oldPassword, new_password: newPassword });
      await api.put('/auth/password', { old_password: oldPassword, new_password: newPassword });
      console.log('修改密码成功');
    } catch (error: any) {
      console.error('修改密码失败:', error);
      if (error.response) {
        console.error('错误状态码:', error.response.status);
        console.error('错误数据:', error.response.data);
        if (error.response.data && error.response.data.message) {
          throw new Error(error.response.data.message);
        }
      }
      throw error;
    }
  }
};

// 供应商详情相关API
export interface VendorProfile {
  id: string;
  vendor_id: string;
  email: string;
  store_name?: string;
  store_description?: string;
  contact_email?: string;
  contact_phone?: string;
  store_address?: string;
  store_logo_url?: string;
  store_banner_url?: string;
  business_hours?: string;
  accepts_returns: boolean;
  return_policy?: string;
  shipping_methods?: string;
  payment_methods?: string;
  notification_settings?: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateVendorProfileDto {
  store_name?: string;
  store_description?: string;
  contact_email?: string;
  contact_phone?: string;
  store_address?: string;
  store_logo_url?: string;
  store_banner_url?: string;
  business_hours?: string;
  accepts_returns?: boolean;
  return_policy?: string;
  shipping_methods?: string;
  payment_methods?: string;
  notification_settings?: string;
}

export const vendorProfileApi = {
  // 获取供应商详情
  getVendorProfile: async (): Promise<VendorProfile> => {
    try {
      console.log('获取供应商详情，URL:', api.defaults.baseURL + '/vendor/profile');
      const response = await api.get<any, VendorProfile>('/vendor/profile');
      console.log('获取供应商详情成功:', response);
      return response;
    } catch (error: any) {
      console.error('获取供应商详情失败:', error);
      // 更详细的错误日志
      if (error.response) {
        console.error('错误状态码:', error.response.status);
        console.error('错误数据:', error.response.data);
        console.error('错误头信息:', error.response.headers);
      } else if (error.request) {
        console.error('请求已发送但未收到响应:', error.request);
      } else {
        console.error('请求设置时发生错误:', error.message);
      }
      throw error;
    }
  },
  
  // 更新供应商详情
  updateVendorProfile: async (profileData: UpdateVendorProfileDto): Promise<VendorProfile> => {
    try {
      console.log('更新供应商详情:', profileData);
      console.log('更新URL:', api.defaults.baseURL + '/vendor/profile');
      const response = await api.put<any, VendorProfile>('/vendor/profile', profileData);
      console.log('更新供应商详情成功:', response);
      return response;
    } catch (error: any) {
      console.error('更新供应商详情失败:', error);
      // 更详细的错误日志
      if (error.response) {
        console.error('错误状态码:', error.response.status);
        console.error('错误数据:', error.response.data);
      }
      throw error;
    }
  }
};

// 用户管理接口
export interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  status?: string;
}

export interface UpdateUserDto {
  role?: string;
  status?: string;
  password?: string;
}

// 用户管理API
export const userManagementApi = {
  // 获取所有用户
  getAllUsers: async (): Promise<User[]> => {
    try {
      console.log('获取所有用户');
      const response = await api.get<any, User[]>('admin/users');
      return response;
    } catch (error) {
      console.error('获取所有用户失败:', error);
      throw error;
    }
  },
  
  // 获取单个用户
  getUserById: async (userId: string): Promise<User> => {
    try {
      console.log(`获取用户详情: ${userId}`);
      const response = await api.get<any, User>(`admin/users/${userId}`);
      return response;
    } catch (error) {
      console.error('获取用户详情失败:', error);
      throw error;
    }
  },
  
  // 更新用户信息
  updateUser: async (userId: string, userData: UpdateUserDto): Promise<User> => {
    try {
      console.log(`更新用户: ${userId}`, userData);
      const response = await api.put<any, User>(`admin/users/${userId}`, userData);
      return response;
    } catch (error) {
      console.error('更新用户失败:', error);
      throw error;
    }
  },
  
  // 删除用户
  deleteUser: async (userId: string): Promise<void> => {
    try {
      console.log(`删除用户: ${userId}`);
      await api.delete(`admin/users/${userId}`);
    } catch (error) {
      console.error('删除用户失败:', error);
      throw error;
    }
  },
  
  // 创建新用户
  createUser: async (userData: { email: string; password: string; role: string }): Promise<User> => {
    try {
      console.log('创建新用户:', userData.email);
      const response = await api.post<any, User>('admin/users', userData);
      return response;
    } catch (error) {
      console.error('创建用户失败:', error);
      throw error;
    }
  }
};

// 数据分析API
export interface AnalyticsParams {
  start_date?: string;
  end_date?: string;
  time_period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface AnalyticsSummary {
  total_users: number;
  total_orders: number;
  total_revenue: number;
  total_products: number;
  average_order_value: number;
  new_users_count: number;
  conversion_rate: number;
}

export interface TimeSeriesData {
  label: string;
  value: number;
}

export interface CategoryData {
  category: string;
  count: number;
  value: number;
}

export interface AnalyticsResponse {
  summary: AnalyticsSummary;
  sales_over_time: TimeSeriesData[];
  orders_over_time: TimeSeriesData[];
  top_products: CategoryData[];
  revenue_by_category: CategoryData[];
  users_by_role: CategoryData[];
}

export const analyticsApi = {
  // 获取数据分析摘要
  getAnalyticsSummary: async (params?: AnalyticsParams): Promise<AnalyticsResponse> => {
    try {
      console.log('获取数据分析摘要，参数:', params);
      const response = await api.get<any, AnalyticsResponse>('admin/analytics', { params });
      console.log('获取数据分析摘要成功:', response);
      return response;
    } catch (error) {
      console.error('获取数据分析摘要失败:', error);
      throw error;
    }
  }
};

export default api; 