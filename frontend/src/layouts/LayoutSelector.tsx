import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { RootState } from '../store';
import { UserRole } from '../types/auth';

// 布局组件
import AdminLayout from './AdminLayout';
import VendorLayout from './VendorLayout';
import CustomerLayout from './CustomerLayout';

// 布局选择器组件
const LayoutSelector: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  
  useEffect(() => {
    if (user) {
      console.log('LayoutSelector: 当前用户角色:', user.role, '类型:', typeof user.role);
      console.log('LayoutSelector: 当前路径:', location.pathname);
      console.log('LayoutSelector: children类型:', React.Children.count(children), '个子元素');
      console.log('LayoutSelector: children内容:', children);
    } else {
      console.log('LayoutSelector: 用户未登录或用户信息不完整');
    }
  }, [user, location, children]);
  
  if (!isAuthenticated || !user) {
    console.log('LayoutSelector: 用户未认证，不应该到达这里');
    return <>{children}</>;
  }
  
  // 确保用户角色是字符串并转为小写
  const userRole = String(user.role).toLowerCase();
  console.log('LayoutSelector: 处理后的用户角色:', userRole);
  
  // 根据用户角色选择布局
  switch (userRole) {
    case 'admin':
      console.log('LayoutSelector: 使用管理员布局');
      return <AdminLayout>{children}</AdminLayout>;
    case 'vendor':
      console.log('LayoutSelector: 使用供应商布局');
      return <VendorLayout>{children}</VendorLayout>;
    case 'customer':
      console.log('LayoutSelector: 使用顾客布局');
      return <CustomerLayout>{children}</CustomerLayout>;
    default:
      console.log('LayoutSelector: 未知角色，使用默认布局');
      return <>{children}</>;
  }
};

export default LayoutSelector; 