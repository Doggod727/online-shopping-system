import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { UserRole } from '../../types/auth';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  redirectPath?: string;
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  allowedRoles, 
  redirectPath = '/login',
  children 
}) => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  
  console.log('ProtectedRoute: 检查权限');
  console.log('ProtectedRoute: 允许的角色:', allowedRoles);
  console.log('ProtectedRoute: 用户认证状态:', isAuthenticated);
  console.log('ProtectedRoute: 用户信息:', user);
  
  // 检查sessionStorage中的信息
  const token = sessionStorage.getItem('token');
  const userStr = sessionStorage.getItem('user');
  console.log('ProtectedRoute: sessionStorage中的token:', token ? '存在' : '不存在');
  console.log('ProtectedRoute: sessionStorage中的user:', userStr ? '存在' : '不存在');
  
  if (!isAuthenticated && !token) {
    console.log('ProtectedRoute: 用户未认证，重定向到登录页面');
    return <Navigate to={redirectPath} replace />;
  }
  
  // 尝试从sessionStorage中获取用户角色
  let matchesRole = false;
  if (user && user.role) {
    // 从Redux获取角色
    const userRole = String(user.role).toLowerCase();
    matchesRole = allowedRoles.some(role => 
      String(role).toLowerCase() === userRole
    );
    console.log('ProtectedRoute: 从Redux中获取用户角色:', userRole);
  } else if (userStr) {
    // 从sessionStorage获取角色
    try {
      const sessionUser = JSON.parse(userStr);
      const sessionUserRole = String(sessionUser.role).toLowerCase();
      matchesRole = allowedRoles.some(role => 
        String(role).toLowerCase() === sessionUserRole
      );
      console.log('ProtectedRoute: 从sessionStorage中获取用户角色:', sessionUserRole);
    } catch (e) {
      console.error('ProtectedRoute: 解析sessionStorage中的用户信息失败:', e);
    }
  }
  
  console.log('ProtectedRoute: 角色匹配结果:', matchesRole);
  
  if (!matchesRole) {
    console.log('ProtectedRoute: 用户角色不匹配，重定向到主页');
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;