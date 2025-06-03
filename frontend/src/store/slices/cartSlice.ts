import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { 
  CartState, 
  CartItemType, 
  AddToCartPayload, 
  UpdateCartItemPayload, 
  RemoveFromCartPayload,
  CartResponse 
} from '../../types/cart';
import { API_BASE_URL } from '../../config';
import { orderApi } from '../../utils/api';
import { RootState } from '..';
import { UserRole } from '../../types/auth';
import { productApi } from '../../utils/api';
import { cartApi } from '../../utils/api';

const initialState: CartState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
  isLoading: false,
  error: null,
};

// 异步操作：获取购物车
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = sessionStorage.getItem('token');
      const userStr = sessionStorage.getItem('user');
      
      if (!token || !userStr) {
        return rejectWithValue('未登录');
      }

      // 检查用户角色
      const state = getState() as RootState;
      const user = state.auth.user;
      
      if (!user) {
        return rejectWithValue('未找到用户信息');
      }
      
      // 如果是管理员，不获取购物车
      if (user.role.toUpperCase() === UserRole.ADMIN.toUpperCase()) {
        return rejectWithValue('管理员不能使用购物车功能');
      }
      
      try {
        // 调用后端API获取购物车数据
        const backendCart = await cartApi.getCart();
        console.log('从后端获取购物车数据:', backendCart);
        
        if (!backendCart || !backendCart.items) {
          console.log('后端返回的购物车为空');
          
          return {
            items: [],
            total: 0
          };
        }
        
        // 转换购物车数据格式
        const cartItems: CartItemType[] = backendCart.items.map(item => ({
          id: item.id, // 使用后端返回的ID
          productId: item.product_id,
          name: item.product_name,
          price: item.product_price,
          quantity: item.quantity,
          image_url: item.image_url
        }));
        
        console.log('购物车数据已同步');
        
        return {
          items: cartItems,
          total: backendCart.total
        };
      } catch (error) {
        console.error('从后端获取购物车数据失败:', error);
        
        // 返回空购物车
        return {
          items: [],
          total: 0
        };
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '获取购物车失败');
    }
  }
);

// 异步操作：添加商品到购物车
export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async (payload: AddToCartPayload, { rejectWithValue, dispatch, getState }) => {
    try {
      const userStr = sessionStorage.getItem('user');
      if (!userStr) {
        return rejectWithValue('未登录');
      }

      // 检查用户角色
      const state = getState() as RootState;
      const user = state.auth.user;
      
      if (!user) {
        return rejectWithValue('未找到用户信息');
      }
      
      // 如果是管理员，不添加到购物车
      if (user.role.toUpperCase() === UserRole.ADMIN.toUpperCase()) {
        return rejectWithValue('管理员不能使用购物车功能');
      }
      
      // 添加到后端数据库
      try {
        console.log(`向后端添加商品：ID=${payload.productId}, 数量=${payload.quantity}`);
        // 使用cartApi将商品添加到后端购物车
        await cartApi.addToCart(payload.productId, payload.quantity);
        console.log('商品已成功添加到后端购物车');
        
        // 重新获取购物车数据，确保数据一致性
        await dispatch(fetchCart()).unwrap();
        
        return { success: true };
      } catch (error: any) {
        console.error('添加到购物车失败:', error);
        console.error('错误详情:', error.response?.data || error.message);
        
        // 如果出现错误，尝试重新获取购物车
        try {
          await dispatch(fetchCart()).unwrap();
        } catch (fetchError) {
          console.error('重新获取购物车失败:', fetchError);
        }
        
        return rejectWithValue(error.response?.data?.message || '添加到购物车失败');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '添加到购物车失败');
    }
  }
);

// 异步操作：更新购物车商品数量
export const updateCartItemAsync = createAsyncThunk(
  'cart/updateCartItem',
  async (payload: UpdateCartItemPayload, { rejectWithValue, dispatch, getState }) => {
    try {
      const userStr = sessionStorage.getItem('user');
      if (!userStr) {
        return rejectWithValue('未登录');
      }

      // 检查用户角色
      const state = getState() as RootState;
      const user = state.auth.user;
      
      if (!user) {
        return rejectWithValue('未找到用户信息');
      }
      
      // 如果是管理员，不更新购物车
      if (user.role.toUpperCase() === UserRole.ADMIN.toUpperCase()) {
        return rejectWithValue('管理员不能使用购物车功能');
      }
      
      // 尝试直接调用后端API更新，不依赖本地购物车
      try {
        console.log(`直接向后端发送更新请求：购物车项目ID=${payload.id}，数量=${payload.quantity}`);
        // 使用购物车项目ID，而不是产品ID
        await cartApi.updateCartItem(payload.id, payload.quantity);
        console.log('后端购物车商品数量已更新');
        
        // 重新获取购物车数据，确保数据一致性
        await dispatch(fetchCart()).unwrap();
        
        return { success: true };
      } catch (error: any) {
        console.error('更新购物车失败:', error);
        console.error('错误详情:', error.response?.data || error.message);
        
        // 如果出现错误，尝试重新获取购物车
        try {
          await dispatch(fetchCart()).unwrap();
        } catch (fetchError) {
          console.error('重新获取购物车失败:', fetchError);
        }
        
        if (error.message) {
          return rejectWithValue(error.message);
        }
        return rejectWithValue(error.response?.data?.message || '更新购物车失败');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '更新购物车失败');
    }
  }
);

// 异步操作：从购物车中移除商品
export const removeFromCartAsync = createAsyncThunk(
  'cart/removeFromCart',
  async (payload: RemoveFromCartPayload, { rejectWithValue, dispatch, getState }) => {
    try {
      const userStr = sessionStorage.getItem('user');
      if (!userStr) {
        return rejectWithValue('未登录');
      }

      // 检查用户角色
      const state = getState() as RootState;
      const user = state.auth.user;
      
      if (!user) {
        return rejectWithValue('未找到用户信息');
      }
      
      // 如果是管理员，不操作购物车
      if (user.role.toUpperCase() === UserRole.ADMIN.toUpperCase()) {
        return rejectWithValue('管理员不能使用购物车功能');
      }
      
      // 尝试直接调用后端API删除，不依赖本地购物车
      try {
        console.log(`直接向后端发送删除请求：购物车项目ID=${payload.id}`);
        // 使用购物车项目ID，而不是产品ID
        await cartApi.removeFromCart(payload.id);
        console.log('已从后端删除购物车项目:', payload.id);
        
        // 重新获取购物车数据，确保数据一致性
        await dispatch(fetchCart()).unwrap();
        
        return payload.id;
      } catch (error: any) {
        console.error('从购物车中删除商品失败:', error);
        console.error('错误详情:', error.response?.data || error.message);
        
        // 如果出现错误，尝试重新获取购物车
        try {
          await dispatch(fetchCart()).unwrap();
        } catch (fetchError) {
          console.error('重新获取购物车失败:', fetchError);
        }
        
        if (error.message) {
          return rejectWithValue(error.message);
        }
        return rejectWithValue(error.response?.data?.message || '从购物车中移除商品失败');
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '从购物车中移除商品失败');
    }
  }
);

// 异步操作：结账
export const checkout = createAsyncThunk(
  'cart/checkout',
  async (_, { rejectWithValue, getState, dispatch }) => {
    try {
      const token = sessionStorage.getItem('token');
      const userStr = sessionStorage.getItem('user');
      
      if (!token || !userStr) {
        return rejectWithValue('未登录');
      }

      // 检查用户角色
      const state = getState() as RootState;
      const user = state.auth.user;
      
      if (!user) {
        return rejectWithValue('未找到用户信息');
      }
      
      // 如果是管理员，不允许结账
      if (user.role.toUpperCase() === UserRole.ADMIN.toUpperCase()) {
        return rejectWithValue('管理员不能使用购物车功能');
      }
      
      // 获取当前购物车
      const { items } = state.cart;
      
      if (items.length === 0) {
        return rejectWithValue('购物车为空');
      }
      
      // 先获取后端购物车数据，检查是否为空
      try {
        const backendCart = await cartApi.getCart();
        console.log('获取后端购物车数据:', backendCart);
        
        // 如果后端购物车为空但前端有商品，同步前端商品到后端
        if (!backendCart || !backendCart.items || backendCart.items.length === 0) {
          console.log('后端购物车为空，同步前端购物车到后端');
          
          // 同步每个商品到后端
          for (const item of items) {
            try {
              await cartApi.addToCart(item.productId, item.quantity);
              console.log(`商品 ${item.productId} 已同步到后端，数量: ${item.quantity}`);
            } catch (error) {
              console.error(`同步商品 ${item.productId} 失败:`, error);
            }
          }
        }
      } catch (error) {
        console.error('获取后端购物车失败:', error);
      }
      
      // 调用结算API
      try {
        const order = await orderApi.checkout();
        console.log('结算成功:', order);
        
        return order;
      } catch (error: any) {
        // 提取错误信息
        let errorMessage = '结算失败，请稍后重试';
        if (error.response && error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        return rejectWithValue(errorMessage);
      }
    } catch (error: any) {
      console.error('结算操作失败:', error);
      return rejectWithValue(error.message || '结算失败');
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // 本地更新购物车商品数量
    updateCartItem: (state, action: PayloadAction<UpdateCartItemPayload>) => {
      const { id, quantity } = action.payload;
      const itemIndex = state.items.findIndex(item => item.id === id);
      
      if (itemIndex !== -1) {
        state.items[itemIndex].quantity = quantity;
        
        // 更新总价和总数量
        state.totalItems = state.items.reduce((total, item) => total + item.quantity, 0);
        state.totalPrice = state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
      }
    },
    
    // 本地从购物车中移除商品
    removeFromCart: (state, action: PayloadAction<RemoveFromCartPayload>) => {
      const { id } = action.payload;
      state.items = state.items.filter(item => item.id !== id);
      
      // 更新总价和总数量
      state.totalItems = state.items.reduce((total, item) => total + item.quantity, 0);
      state.totalPrice = state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    },
    
    // 清空购物车
    clearCart: (state) => {
      state.items = [];
      state.totalItems = 0;
      state.totalPrice = 0;
    },
  },
  extraReducers: (builder) => {
    // 获取购物车
    builder.addCase(fetchCart.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchCart.fulfilled, (state, action) => {
      state.isLoading = false;
      state.items = action.payload.items;
      state.totalPrice = action.payload.total;
      state.totalItems = state.items.reduce((total, item) => total + item.quantity, 0);
    });
    builder.addCase(fetchCart.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // 添加到购物车
    builder.addCase(addToCart.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(addToCart.fulfilled, (state) => {
      state.isLoading = false;
      // 添加成功后，通过fetchCart重新获取购物车
    });
    builder.addCase(addToCart.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
    
    // 结账
    builder.addCase(checkout.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(checkout.fulfilled, (state) => {
      state.isLoading = false;
      state.items = [];
      state.totalItems = 0;
      state.totalPrice = 0;
    });
    builder.addCase(checkout.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { updateCartItem, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;