import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// 定义用户角色类型
export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
  VENDOR = 'vendor',
}

// 定义认证状态接口
interface AuthState {
  isAuthenticated: boolean;
  user: {
    id: string;
    email: string;
    role: string;
  } | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

// 初始状态
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  error: null,
};

// 创建认证切片
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<{ user: AuthState['user']; token: string }>) => {
      console.log('loginSuccess action被调用，用户数据:', action.payload.user);
      
      // 确保用户角色是字符串
      if (action.payload.user && action.payload.user.role) {
        action.payload.user.role = String(action.payload.user.role);
        console.log('处理后的用户角色:', action.payload.user.role);
        console.log('用户角色类型:', typeof action.payload.user.role);
      }
      
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.loading = false;
      state.error = null;
      
      console.log('认证状态已更新，用户:', state.user);
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      console.log('Redux logout action被调用，清除认证状态');
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = null;
      
      // 同时清除sessionStorage
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
    },
  },
});

// 导出actions和reducer
export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;
export default authSlice.reducer; 