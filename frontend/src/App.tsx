import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { zhCN } from '@mui/material/locale';
import './App.css';

// 页面
import LoginPage from './pages/LoginPage';
import Register from './pages/Register';
import ProductsPage from './pages/products/ProductsPage';
import ProductDetailPage from './pages/products/ProductDetailPage';
import CartPage from './pages/cart/CartPage';
import TokenDebugger from './pages/debug/TokenDebugger';
import TokenTest from './pages/debug/TokenTest';
import OrderRoutingTest from './pages/debug/OrderRoutingTest';
import OrderDetailPage from './pages/OrderDetailPage';

// 角色专属页面
import AdminDashboard from './features/admin/AdminDashboard';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorOrdersPage from './pages/vendor/VendorOrdersPage';
import VendorProductsPage from './pages/vendor/VendorProductsPage';
import VendorStatisticsPage from './pages/vendor/VendorStatisticsPage';
import VendorSettingsPage from './pages/vendor/VendorSettingsPage';
import CustomerOrdersPage from './features/customer/CustomerOrdersPage';
import FavoritesPage from './features/customer/FavoritesPage';
import ProfilePage from './features/customer/ProfilePage';

// 布局
import LayoutSelector from './layouts/LayoutSelector';

// 权限控制
import { RootState } from './store';
import { loginSuccess } from './store/slices/authSlice';
import { UserRole } from './types/auth';

// 创建主题
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
  },
}, zhCN);

// 角色路由保护
interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  redirectPath?: string;
  children?: React.ReactNode;
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
  
  if (!isAuthenticated) {
    console.log('ProtectedRoute: 用户未认证，重定向到登录页面');
    return <Navigate to={redirectPath} replace />;
  }
  
  // 确保user.role是有效的UserRole类型
  if (user && user.role) {
    // 转换为字符串并比较
    const userRole = String(user.role).toLowerCase();
    const matchesRole = allowedRoles.some(role => 
      String(role).toLowerCase() === userRole
    );
    
    console.log('ProtectedRoute: 用户角色:', userRole);
    console.log('ProtectedRoute: 角色匹配结果:', matchesRole);
    
    if (!matchesRole) {
      console.log('ProtectedRoute: 用户角色不匹配，重定向到主页');
      return <Navigate to="/" replace />;
    }
  }
  
  return <>{children}</>;
};

// 自动重定向到角色对应的主页
const RoleBasedRedirect: React.FC = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  
  console.log('RoleBasedRedirect: 检查用户状态');
  console.log('RoleBasedRedirect: 用户认证状态:', isAuthenticated);
  console.log('RoleBasedRedirect: 用户信息:', user);
  
  if (!isAuthenticated || !user) {
    console.log('RoleBasedRedirect: 未登录或无用户信息，重定向到登录页面');
    return <Navigate to="/login" replace />;
  }
  
  // 确保角色是字符串并转为小写
  const userRole = String(user.role).toLowerCase();
  console.log('RoleBasedRedirect: 根据角色重定向，当前角色:', userRole);
  
  switch (userRole) {
    case 'admin':
      console.log('RoleBasedRedirect: 重定向到管理员主页');
      return <Navigate to="/admin" replace />;
    case 'vendor':
      console.log('RoleBasedRedirect: 重定向到供应商主页');
      return <Navigate to="/vendor" replace />;
    case 'customer':
      console.log('RoleBasedRedirect: 重定向到顾客主页');
      return <Navigate to="/customer/orders" replace />;
    default:
      console.log('RoleBasedRedirect: 未知角色，重定向到登录页面');
      return <Navigate to="/login" replace />;
  }
};

// 临时组件，用于替代尚未创建的组件
const PlaceholderComponent: React.FC<{title: string}> = ({title}) => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <h2>{title}</h2>
    <p>此页面正在开发中...</p>
  </div>
);

// 404页面
const NotFoundPage: React.FC = () => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <h2>404 - 页面不存在</h2>
    <p>您访问的页面不存在或已被移除。</p>
  </div>
);

// 布局包装器
const LayoutWrapper: React.FC = () => {
  const location = useLocation();
  
  console.log('LayoutWrapper: 当前路径:', location.pathname);
  
  return <Outlet />;
};

// 从sessionStorage恢复认证状态
const restoreAuthState = () => {
  const token = sessionStorage.getItem('token');
  const userStr = sessionStorage.getItem('user');
  
  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      console.log('从sessionStorage恢复的用户信息:', user);
      console.log('从sessionStorage恢复的token:', token.substring(0, 20) + '...');
      return { user, token };
    } catch (e) {
      console.error('恢复用户状态失败:', e);
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
    }
  } else {
    console.log('sessionStorage中没有找到用户信息或token');
  }
  return null;
};

const App: React.FC = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  // 手动清除登录信息的函数
  const clearLoginInfo = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    console.log('已手动清除sessionStorage中的登录信息');
    window.location.href = '/login';
  };
  
  // 在应用启动时恢复认证状态
  useEffect(() => {
    console.log('App组件初始化，检查sessionStorage中的登录信息');
    console.log('当前认证状态:', isAuthenticated);
    
    // 尝试从sessionStorage恢复认证状态
    try {
      const token = sessionStorage.getItem('token');
      const userStr = sessionStorage.getItem('user');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        
        // 验证用户数据是否完整
        if (user && user.id && user.email && user.role) {
          console.log('从sessionStorage恢复用户状态:', user);
          console.log('用户角色:', user.role, '类型:', typeof user.role);
          
          // 确保用户角色是字符串类型
          const updatedUser = {
            ...user,
            role: String(user.role)
          };
          
          // 更新Redux状态
          if (!isAuthenticated) {
            dispatch(loginSuccess({
              user: updatedUser,
              token: token
            }));
          }
        } else {
          console.error('sessionStorage中的用户数据不完整:', user);
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
        }
      } else {
        console.log('sessionStorage中没有找到用户信息或token');
      }
    } catch (error) {
      console.error('恢复用户状态时出错:', error);
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
    }
  }, [dispatch, isAuthenticated]);
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* 调试按钮 - 仅在开发环境显示 */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          position: 'fixed', 
          bottom: '10px', 
          right: '10px', 
          zIndex: 9999 
        }}>
          <button 
            onClick={clearLoginInfo}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ff4d4f',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            清除登录信息
          </button>
        </div>
      )}
      <Routes>
        {/* 公共路由 */}
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
        } />
        <Route path="/register" element={
          isAuthenticated ? <Navigate to="/" replace /> : <Register />
        } />
        
        {/* 根路径重定向 */}
        <Route path="/" element={
          isAuthenticated ? <Navigate to={
            (() => {
              // 根据用户角色决定重定向到哪个页面
              const userStr = sessionStorage.getItem('user');
              if (userStr) {
                try {
                  const user = JSON.parse(userStr);
                  const role = String(user.role).toLowerCase();
                  console.log('根路径重定向，用户角色:', role);
                  
                  if (role === 'admin') return '/admin';
                  if (role === 'vendor') return '/vendor';
                  if (role === 'customer') return '/customer/orders';
                } catch (e) {
                  console.error('解析用户信息失败:', e);
                }
              }
              return '/login'; // 默认重定向到登录页面
            })()
          } replace /> : <Navigate to="/login" replace />
        } />
        
        {/* 布局包装器 */}
        <Route element={<LayoutWrapper />}>
          {/* 管理员路由 */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]} redirectPath="/login">
              <LayoutSelector>
                <Outlet />
              </LayoutSelector>
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
          
          {/* 供应商路由 */}
          <Route path="/vendor" element={
            <ProtectedRoute allowedRoles={[UserRole.VENDOR]} redirectPath="/login">
              <LayoutSelector>
                <Outlet />
              </LayoutSelector>
            </ProtectedRoute>
          }>
            <Route index element={<VendorDashboard />} />
            <Route path="products" element={<VendorProductsPage />} />
            <Route path="products/new" element={<PlaceholderComponent title="添加新商品" />} />
            <Route path="products/:id" element={<PlaceholderComponent title="编辑商品" />} />
            <Route path="orders" element={<VendorOrdersPage />} />
            <Route path="statistics" element={<VendorStatisticsPage />} />
            <Route path="settings" element={<VendorSettingsPage />} />
          </Route>
          
          {/* 顾客路由 */}
          <Route path="/products" element={
            <LayoutSelector>
              <ProductsPage />
            </LayoutSelector>
          } />
          
          <Route path="/products/search" element={
            <LayoutSelector>
              <ProductsPage />
            </LayoutSelector>
          } />
          
          <Route path="/products/:id" element={
            <LayoutSelector>
              <ProductDetailPage />
            </LayoutSelector>
          } />
          
          <Route path="/customer" element={
            <ProtectedRoute allowedRoles={[UserRole.CUSTOMER]} redirectPath="/login">
              <LayoutSelector>
                <Outlet />
              </LayoutSelector>
            </ProtectedRoute>
          }>
            <Route index element={<CustomerOrdersPage />} />
            <Route path="orders" element={<CustomerOrdersPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="favorites" element={<FavoritesPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="products/search" element={<ProductsPage />} />
            <Route path="products/:id" element={<ProductDetailPage />} />
          </Route>
          
          <Route path="/cart" element={
            <ProtectedRoute allowedRoles={[UserRole.CUSTOMER]} redirectPath="/login">
              <LayoutSelector>
                <CartPage />
              </LayoutSelector>
            </ProtectedRoute>
          } />
        </Route>
        
        {/* 调试路由 */}
        <Route path="/debug">
          <Route path="token" element={<TokenDebugger />} />
          <Route path="token-test" element={<TokenTest />} />
          <Route path="order-routing" element={<OrderRoutingTest />} />
        </Route>
        
        {/* 404页面 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ThemeProvider>
  );
};

export default App; 