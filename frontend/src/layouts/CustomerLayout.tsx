import React, { useState } from 'react';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  Container, 
  Button, 
  IconButton, 
  Badge, 
  Avatar, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  Divider, 
  Paper,
  InputBase,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  useTheme,
  alpha,
  Tooltip,
  Breadcrumbs,
  Link as MuiLink,
  Grid,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import { 
  Home as HomeIcon,
  Search as SearchIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Assignment as OrdersIcon,
  Favorite as FavoriteIcon,
  ShoppingCart as CartIcon,
  Category as CategoryIcon,
  LocalOffer as OfferIcon,
  ChevronRight as ChevronRightIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { logout } from '../store/slices/authSlice';
import { authApi } from '../utils/api';

interface CustomerLayoutProps {
  children: React.ReactNode;
}

const drawerWidth = 240;

const CustomerLayout: React.FC<CustomerLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { items } = useSelector((state: RootState) => state.cart);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationCount] = useState(2); // 模拟通知数量
  
  // 导航链接
  const navLinks = [
    { text: '首页', path: '/customer/products', icon: <HomeIcon />, description: '浏览所有商品' },
    { text: '我的订单', path: '/customer/orders', icon: <OrdersIcon />, description: '查看您的所有订单' },
    { text: '我的收藏', path: '/customer/favorites', icon: <FavoriteIcon />, description: '查看您收藏的商品' },
    { text: '购物车', path: '/cart', icon: <CartIcon />, description: '查看您的购物车' },
    { text: '个人资料', path: '/customer/profile', icon: <PersonIcon />, description: '管理您的个人信息' }
  ];
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = () => {
    console.log('CustomerLayout: 用户点击退出登录');
    handleProfileMenuClose();
    // 先调用Redux action
    dispatch(logout());
    // 然后调用API方法确保清除所有数据
    authApi.logout();
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/customer/products/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };
  
  // 获取购物车商品总数
  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0);
  
  // 生成面包屑
  const generateBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter(x => x);
    
    // 如果是首页，不显示面包屑
    if (pathnames.length === 0 || (pathnames.length === 1 && pathnames[0] === 'products')) {
      return null;
    }
    
    const breadcrumbItems: React.ReactNode[] = [];
    
    // 添加首页
    breadcrumbItems.push(
      <MuiLink 
        key="home" 
        component={Link} 
        to="/customer/products" 
        color="inherit" 
        sx={{ 
          display: 'flex', 
          alignItems: 'center',
          '&:hover': { color: theme.palette.primary.main }
        }}
      >
        <HomeIcon sx={{ mr: 0.5, fontSize: '0.9rem' }} />
        首页
      </MuiLink>
    );
    
    // 添加其他路径
    let path = '';
    pathnames.forEach((name, index) => {
      path += `/${name}`;
      
      // 特殊处理一些路径
      let itemText = name.charAt(0).toUpperCase() + name.slice(1);
      
      if (name === 'products') return; // 跳过products路径，因为已经作为首页添加
      if (name === 'customer') return; // 跳过customer路径
      
      if (name === 'orders') itemText = '我的订单';
      if (name === 'profile') itemText = '个人资料';
      if (name === 'search') itemText = '搜索结果';
      if (name === 'cart') itemText = '购物车';
      
      const isLast = index === pathnames.length - 1;
      
      if (path.includes('customer')) {
        path = path.replace('/customer', ''); // 调整路径
      }
      
      breadcrumbItems.push(
        isLast ? (
          <Typography key={name} color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
            {itemText}
          </Typography>
        ) : (
          <MuiLink 
            key={name} 
            component={Link} 
            to={path} 
            color="inherit" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              '&:hover': { color: theme.palette.primary.main }
            }}
          >
            {itemText}
          </MuiLink>
        )
      );
    });
    
    return (
      <Breadcrumbs 
        separator={<ChevronRightIcon fontSize="small" />} 
        aria-label="breadcrumb"
        sx={{ 
          mb: 2, 
          '& .MuiBreadcrumbs-separator': { mx: 1 } 
        }}
      >
        {breadcrumbItems}
      </Breadcrumbs>
    );
  };
  
  // 判断当前路径是否匹配菜单项路径
  const isPathActive = (path: string) => {
    if (path === '/customer/products' && (location.pathname === '/customer/products' || location.pathname === '/')) {
      return true;
    }
    return location.pathname.startsWith(path) && path !== '/customer/products';
  };
  
  const drawer = (
    <Box sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: theme.palette.background.default
    }}>
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center',
        bgcolor: alpha(theme.palette.primary.main, 0.1)
      }}>
        <Avatar 
          sx={{ 
            bgcolor: theme.palette.primary.main,
            width: 40,
            height: 40,
            mr: 2
          }}
        >
          {user?.email ? user.email.charAt(0).toUpperCase() : 'C'}
        </Avatar>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {user?.email || '顾客'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            欢迎回来
          </Typography>
        </Box>
      </Box>
      
      <Divider />
      
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        <List>
          {navLinks.map((item) => (
            <Tooltip 
              key={item.text}
              title={item.description} 
              placement="right"
              arrow
            >
              <ListItem 
                disablePadding
                sx={{ mb: 1 }}
              >
                <ListItemButton
                  component={Link}
                  to={item.path}
                  selected={isPathActive(item.path)}
                  sx={{
                    borderRadius: 1,
                    '&.Mui-selected': {
                      bgcolor: alpha(theme.palette.primary.main, 0.15),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.25),
                      },
                      borderLeft: `3px solid ${theme.palette.primary.main}`
                    },
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                    }
                  }}
                >
                  <ListItemIcon sx={{ 
                    color: isPathActive(item.path) 
                      ? theme.palette.primary.main 
                      : theme.palette.text.secondary,
                    minWidth: 40
                  }}>
                    {item.icon}
                    {item.path === '/cart' && cartItemCount > 0 && (
                      <Badge 
                        color="error" 
                        badgeContent={cartItemCount} 
                        sx={{ 
                          position: 'absolute',
                          top: 0,
                          right: -8
                        }}
                      />
                    )}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ 
                      fontWeight: isPathActive(item.path) ? 600 : 400,
                      fontSize: '0.95rem'
                    }} 
                  />
                </ListItemButton>
              </ListItem>
            </Tooltip>
          ))}
        </List>
      </Box>
      
      <Box sx={{ p: 2 }}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 2, 
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            borderRadius: 2
          }}
        >
          <Typography variant="body2" sx={{ mb: 1 }}>
            客户服务
          </Typography>
          <Typography variant="caption" color="text.secondary">
            如有问题，请联系客服
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Button
              variant="outlined"
              size="small"
              color="primary"
              fullWidth
            >
              联系客服
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
  
  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        elevation={1}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* 搜索框 */}
          <Paper
            component="form"
            onSubmit={handleSearch}
            sx={{ 
              p: '2px 4px', 
              display: 'flex', 
              alignItems: 'center', 
              width: { xs: '100%', sm: '50%', md: '40%' },
              borderRadius: 20,
              border: `1px solid ${theme.palette.divider}`,
              '&:hover': {
                boxShadow: '0 1px 6px rgba(32, 33, 36, 0.28)'
              },
              mr: { xs: 1, sm: 2 }
            }}
          >
            <InputBase
              sx={{ ml: 1, flex: 1 }}
              placeholder="搜索商品..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <IconButton type="submit" sx={{ p: '10px' }}>
              <SearchIcon />
            </IconButton>
          </Paper>
          
          {/* 顶部导航栏 */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', flexGrow: 1, justifyContent: 'flex-end' }}>
            <Button
              component={Link}
              to="/products"
              color="inherit"
              startIcon={<HomeIcon />}
              sx={{ 
                mr: 2,
                fontWeight: isPathActive('/products') ? 600 : 400,
                color: isPathActive('/products') ? 'primary.main' : 'inherit',
                position: 'relative',
                '&:after': isPathActive('/products') ? {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '100%',
                  height: '2px',
                  bgcolor: 'primary.main'
                } : {}
              }}
            >
              首页
            </Button>
            
            <Button
              component={Link}
              to="/customer/orders"
              color="inherit"
              startIcon={<OrdersIcon />}
              sx={{ 
                mr: 2,
                fontWeight: isPathActive('/customer/orders') ? 600 : 400,
                color: isPathActive('/customer/orders') ? 'primary.main' : 'inherit',
                position: 'relative',
                '&:after': isPathActive('/customer/orders') ? {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '100%',
                  height: '2px',
                  bgcolor: 'primary.main'
                } : {}
              }}
            >
              我的订单
            </Button>
          </Box>
          
          {/* 购物车图标 */}
          <Tooltip title="购物车">
            <IconButton 
              color="inherit" 
              component={Link} 
              to="/cart"
              sx={{ mr: 1 }}
            >
              <Badge badgeContent={cartItemCount} color="error">
                <CartIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          {/* 通知图标 */}
          <Tooltip title="通知">
            <IconButton color="inherit" sx={{ mr: 1 }}>
              <Badge badgeContent={notificationCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          {/* 用户头像和菜单 */}
          <Tooltip title="个人资料">
            <IconButton
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: theme.palette.primary.main,
                  fontSize: '0.875rem'
                }}
              >
                {user?.email ? user.email.charAt(0).toUpperCase() : 'C'}
              </Avatar>
            </IconButton>
          </Tooltip>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              elevation: 2,
              sx: { 
                mt: 1.5,
                minWidth: 180,
                borderRadius: 1
              }
            }}
          >
            <MenuItem>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              {user?.email || '顾客'}
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => {
              handleProfileMenuClose();
              navigate('/customer/profile');
            }}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              个人资料
            </MenuItem>
            <MenuItem onClick={() => {
              handleProfileMenuClose();
              navigate('/customer/orders');
            }}>
              <ListItemIcon>
                <OrdersIcon fontSize="small" />
              </ListItemIcon>
              我的订单
            </MenuItem>
            <MenuItem component={Link} to="/cart">
              <ListItemIcon>
                <Badge badgeContent={cartItemCount} color="error">
                  <CartIcon fontSize="small" />
                </Badge>
              </ListItemIcon>
              购物车
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              退出登录
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* 移动端抽屉 */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // 提高移动设备上的性能
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: `1px solid ${theme.palette.divider}`
            },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* 桌面端抽屉 */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: `1px solid ${theme.palette.divider}`
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: alpha(theme.palette.primary.main, 0.02)
        }}
      >
        <Toolbar /> {/* 为AppBar留出空间 */}
        
        <Container maxWidth="lg" sx={{ flexGrow: 1, py: 2 }}>
          {/* 面包屑导航 */}
          {generateBreadcrumbs()}
          
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: 2,
              minHeight: '80vh',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
            }}
          >
            {children}
          </Paper>
        </Container>
        
        <Box
          component="footer"
          sx={{
            py: 2,
            px: 2,
            mt: 'auto',
            textAlign: 'center'
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} 在线购物系统 - 顾客服务
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default CustomerLayout; 