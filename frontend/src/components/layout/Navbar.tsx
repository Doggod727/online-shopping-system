import React from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Avatar, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  Divider, 
  Box, 
  Badge 
} from '@mui/material';
import {
  Person as PersonIcon,
  ShoppingCart as ShoppingCartIcon,
  Assignment as AssignmentIcon,
  Dashboard as DashboardIcon,
  AdminPanelSettings as AdminIcon,
  Inventory as InventoryIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';

import { RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { UserRole } from '../../types/auth';
import { authApi } from '../../utils/api';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const { items } = useSelector((state: RootState) => state.cart);
  
  // 用户菜单
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = () => {
    console.log('Navbar: 用户点击退出登录');
    handleCloseMenu();
    dispatch(logout());
    authApi.logout();
  };
  
  // 获取购物车商品总数
  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0);
  
  // 根据用户角色返回对应的订单页面链接
  const getOrdersLink = (): string => {
    if (!user) return '/orders';
    
    switch (user.role) {
      case UserRole.ADMIN:
        return '/admin/orders';
      case UserRole.VENDOR:
        return '/vendor/orders';
      default:
        return '/orders';
    }
  };
  
  // 获取订单页面标题
  const getOrdersTitle = (): string => {
    if (!user) return '我的订单';
    
    switch (user.role) {
      case UserRole.ADMIN:
        return '订单管理';
      case UserRole.VENDOR:
        return '供应商订单';
      default:
        return '我的订单';
    }
  };
  
  return (
    <AppBar position="static">
      <Toolbar>
        {/* 网站Logo */}
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{ 
            flexGrow: 1, 
            textDecoration: 'none', 
            color: 'inherit',
            fontWeight: 'bold'
          }}
        >
          在线购物系统
        </Typography>
        
        {/* 导航链接 */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {isAuthenticated ? (
            <>
              {/* 商品链接 */}
              <Button 
                color="inherit" 
                component={RouterLink} 
                to="/products"
                sx={{ mr: 1 }}
              >
                商品
              </Button>
              
              {/* 订单链接 - 根据角色显示不同的链接 */}
              <Button 
                color="inherit" 
                component={RouterLink} 
                to={getOrdersLink()}
                sx={{ mr: 1 }}
              >
                {getOrdersTitle()}
              </Button>
              
              {/* 购物车按钮 - 仅对普通用户显示 */}
              {user?.role === UserRole.CUSTOMER && (
                <IconButton 
                  color="inherit" 
                  component={RouterLink} 
                  to="/cart"
                  sx={{ mr: 1 }}
                >
                  <Badge badgeContent={cartItemCount} color="error">
                    <ShoppingCartIcon />
                  </Badge>
                </IconButton>
              )}
              
              {/* 用户头像和菜单 */}
              <IconButton
                onClick={handleOpenMenu}
                color="inherit"
                sx={{ ml: 1 }}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                  {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </Avatar>
              </IconButton>
              
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleCloseMenu}
                onClick={handleCloseMenu}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem>
                  <ListItemIcon>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  {user?.email || '用户'}
                  {user?.role === UserRole.ADMIN && ' (管理员)'}
                  {user?.role === UserRole.VENDOR && ' (供应商)'}
                </MenuItem>
                
                <Divider />
                
                {/* 根据角色显示不同的仪表盘选项 */}
                {user?.role === UserRole.ADMIN && (
                  <MenuItem component={RouterLink} to="/admin">
                    <ListItemIcon>
                      <AdminIcon fontSize="small" />
                    </ListItemIcon>
                    管理员仪表盘
                  </MenuItem>
                )}
                
                {user?.role === UserRole.VENDOR && (
                  <>
                    <MenuItem component={RouterLink} to="/vendor">
                      <ListItemIcon>
                        <DashboardIcon fontSize="small" />
                      </ListItemIcon>
                      供应商仪表盘
                    </MenuItem>
                    <MenuItem component={RouterLink} to="/vendor/products">
                      <ListItemIcon>
                        <InventoryIcon fontSize="small" />
                      </ListItemIcon>
                      管理产品
                    </MenuItem>
                  </>
                )}
                
                {/* 订单链接 */}
                <MenuItem component={RouterLink} to={getOrdersLink()}>
                  <ListItemIcon>
                    <AssignmentIcon fontSize="small" />
                  </ListItemIcon>
                  {getOrdersTitle()}
                </MenuItem>
                
                {/* 仅对普通用户显示购物车选项 */}
                {user?.role === UserRole.CUSTOMER && (
                  <MenuItem component={RouterLink} to="/cart">
                    <ListItemIcon>
                      <Badge badgeContent={cartItemCount} color="error">
                        <ShoppingCartIcon fontSize="small" />
                      </Badge>
                    </ListItemIcon>
                    购物车
                  </MenuItem>
                )}
                
                <Divider />
                
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  退出登录
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button color="inherit" component={RouterLink} to="/login">
                登录
              </Button>
              <Button color="inherit" component={RouterLink} to="/register">
                注册
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;