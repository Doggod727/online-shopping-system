import { createAsyncThunk } from '@reduxjs/toolkit';
import { loginSuccess, loginFailure } from '../slices/authSlice';
import { authApi } from '../../utils/api';
import { UserRole } from '../../types/auth';

// 从sessionStorage恢复认证状态
export const restoreAuthState = createAsyncThunk(
  'auth/restoreState',
  async (_, { dispatch }) => {
    const token = sessionStorage.getItem('token');
    console.log('尝试恢复认证状态，token存在:', token ? '是' : '否');
    
    if (token) {
      try {
        console.log('解析token...');
        // 解析token以获取基本信息
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            console.log('Token解析结果:', {
              sub: payload.sub,
              email: payload.email,
              role: payload.role,
              exp: new Date(payload.exp * 1000).toLocaleString(),
              iat: new Date(payload.iat * 1000).toLocaleString()
            });
          }
        } catch (e) {
          console.error('解析token失败:', e);
        }
        
        // 使用token获取当前用户信息
        console.log('使用token获取当前用户信息...');
        const userResponse = await authApi.getCurrentUser();
        
        // 确保token在sessionStorage中
        if (!sessionStorage.getItem('token')) {
          console.log('重新保存token到sessionStorage');
          sessionStorage.setItem('token', token);
        }
        
        // 直接从响应中提取用户数据
        const userData = userResponse.data || userResponse;
        const user = userData.user || userData;
        
        // 检查用户角色类型
        console.log('用户角色:', user.role);
        console.log('用户角色类型:', typeof user.role);
        
        // 更新Redux状态
        dispatch(loginSuccess({
          user: user,
          token: token
        }));
        
        console.log('认证状态已恢复，用户ID:', user.id, '角色:', user.role);
        return userResponse;
      } catch (error: any) {
        // 如果获取用户信息失败，清除sessionStorage中的token
        console.error('恢复认证状态失败:', error);
        console.error('错误详情:', error.response?.data || error.message);
        sessionStorage.removeItem('token');
        dispatch(loginFailure(error.response?.data?.message || '会话已过期，请重新登录'));
      }
    } else {
      console.log('没有找到token，用户未登录');
    }
  }
);

// 登录用户
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { dispatch }) => {
    try {
      dispatch(loginSuccess);
      const response = await authApi.login({ email, password });
      return response;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '登录失败，请检查您的输入';
      dispatch(loginFailure(errorMessage));
      throw error;
    }
  }
);

// 注册用户
export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ email, password, role }: { email: string; password: string; role: UserRole }, { dispatch }) => {
    try {
      dispatch(loginSuccess);
      const response = await authApi.register({ email, password, role });
      return response;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '注册失败，请检查您的输入';
      dispatch(loginFailure(errorMessage));
      throw error;
    }
  }
);