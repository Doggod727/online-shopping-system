import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { RootState } from '../../store';
import { UserRole } from '../../types/auth';

/**
 * 订单重定向组件
 * 根据用户角色将用户重定向到对应的订单页面
 */
const OrdersRedirect: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  
  useEffect(() => {
    console.log('OrdersRedirect组件加载，用户信息:', user);
  }, [user]);
  
  if (!user) {
    // 如果用户未登录，重定向到登录页面
    console.log('用户未登录，重定向到登录页面');
    return <Navigate to="/login" replace />;
  }
  
  // 根据用户角色重定向到对应的订单页面
  console.log('用户角色:', user.role);
  console.log('用户角色类型:', typeof user.role);
  console.log('UserRole枚举值:', UserRole);
  
  // 将角色转为字符串进行比较
  const role = String(user.role).toLowerCase();
  
  if (role === 'admin') {
    console.log('管理员用户，重定向到管理员订单页面');
    return <Navigate to="/admin/orders" replace />;
  } else if (role === 'vendor') {
    console.log('供应商用户，重定向到供应商订单页面');
    return <Navigate to="/vendor/orders" replace />;
  } else {
    console.log('普通用户，重定向到用户订单页面');
    return <Navigate to="/customer/orders" replace />;
  }
};

export default OrdersRedirect; 