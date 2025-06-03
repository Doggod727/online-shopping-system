// 用户角色枚举
export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
  VENDOR = 'vendor',
}

// 用户信息接口
export interface User {
  id: string;
  email: string;
  role: UserRole;
}

// 登录请求数据接口
export interface LoginDto {
  email: string;
  password: string;
}

// 注册请求数据接口
export interface RegisterDto {
  email: string;
  password: string;
  role: UserRole;
}

// 认证响应接口
export interface AuthResponse {
  user: User;
  token: string;
} 