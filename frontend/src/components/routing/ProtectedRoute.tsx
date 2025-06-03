import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { RootState } from '../../store';
import { UserRole } from '../../types/auth';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  redirectPath?: string;
}

/**
 * 受保护的路由组件
 * 用于保护需要登录才能访问的页面，并根据用户角色进行权限控制
 * 
 * @param allowedRoles 允许访问的用户角色列表，如果为空则表示所有已登录用户都可以访问
 * @param redirectPath 未授权时重定向的路径，默认为登录页面
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  redirectPath = '/login'
}) => {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  
  console.log('ProtectedRoute - 当前路径:', location.pathname);
  console.log('ProtectedRoute - 允许角色:', allowedRoles);
  console.log('ProtectedRoute - 用户信息:', user);
  console.log('ProtectedRoute - 认证状态:', isAuthenticated);
  
  // 检查用户是否已登录
  if (!isAuthenticated || !user) {
    console.log('ProtectedRoute - 用户未登录，重定向到:', redirectPath);
    // 将用户重定向到登录页面，并记住他们试图访问的页面
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }
  
  // 将用户角色转为小写字符串
  const userRole = String(user.role).toLowerCase();
  console.log('ProtectedRoute - 用户角色:', user.role, '(', userRole, ')');
  
  // 如果指定了允许的角色，则检查用户角色是否在允许列表中
  if (allowedRoles && allowedRoles.length > 0) {
    // 将允许的角色列表转为小写
    const lowerCaseAllowedRoles = allowedRoles.map(role => String(role).toLowerCase());
    console.log('ProtectedRoute - 转换后的允许角色列表:', lowerCaseAllowedRoles);
    
    const hasAccess = lowerCaseAllowedRoles.includes(userRole);
    console.log('ProtectedRoute - 用户是否有权限:', hasAccess);
    
    if (!hasAccess) {
      // 根据用户角色重定向到对应的首页
      let redirectTo = '/products'; // 默认重定向到产品页面
      
      if (userRole === 'admin') {
        redirectTo = '/admin';
        console.log('ProtectedRoute - 管理员用户，重定向到管理员首页');
      } else if (userRole === 'vendor') {
        redirectTo = '/vendor';
        console.log('ProtectedRoute - 供应商用户，重定向到供应商首页');
      } else {
        redirectTo = '/products';
        console.log('ProtectedRoute - 普通用户，重定向到产品页面');
      }
      
      // 特殊处理：如果用户访问的是 /orders 路径，根据角色重定向到对应的订单页面
      if (location.pathname === '/orders') {
        if (userRole === 'admin') {
          redirectTo = '/admin/orders';
          console.log('ProtectedRoute - 管理员访问订单页面，重定向到管理员订单页面');
        } else if (userRole === 'vendor') {
          redirectTo = '/vendor/orders';
          console.log('ProtectedRoute - 供应商访问订单页面，重定向到供应商订单页面');
        }
        // 普通用户访问 /orders 是正确的，不需要重定向
      }
      
      console.log('ProtectedRoute - 无权限访问，重定向到:', redirectTo);
      return <Navigate to={redirectTo} replace />;
    }
  }
  
  // 用户已登录且有权限访问，渲染子路由
  console.log('ProtectedRoute - 用户已登录且有权限访问，渲染子路由');
  return <Outlet />;
};

export default ProtectedRoute; 