import React, { useState } from 'react';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Divider,
  IconButton,
  Container,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Paper,
  Tooltip,
  useTheme,
  alpha,
  Chip,
  Button,
  Breadcrumbs,
  Link as MuiLink
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  ShoppingBag as OrdersIcon,
  Inventory as ProductsIcon,
  BarChart as StatisticsIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Add as AddIcon,
  Storefront as StoreIcon,
  Home as HomeIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { logout } from '../store/slices/authSlice';
import { authApi } from '../utils/api';

const drawerWidth = 260;

interface VendorLayoutProps {
  children: React.ReactNode;
}

const VendorLayout: React.FC<VendorLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationCount] = useState(3); // 模拟通知数量
  
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
    console.log('VendorLayout: 用户点击退出登录');
    handleProfileMenuClose();
    // 先调用Redux action
    dispatch(logout());
    // 然后调用API方法确保清除所有数据
    authApi.logout();
  };
  
  // 供应商菜单项
  const menuItems = [
    { text: '首页', icon: <DashboardIcon />, path: '/vendor', description: '查看销售概况和关键指标' },
    { text: '商品管理', icon: <ProductsIcon />, path: '/vendor/products', description: '管理您的所有商品' },
    { text: '订单管理', icon: <OrdersIcon />, path: '/vendor/orders', description: '查看和处理客户订单' },
    { text: '销售统计', icon: <StatisticsIcon />, path: '/vendor/statistics', description: '查看详细销售数据和趋势' },
    { text: '店铺设置', icon: <SettingsIcon />, path: '/vendor/settings', description: '管理您的店铺设置' },
  ];

  // 生成面包屑
  const generateBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter(x => x);
    
    // 如果是根路径，不显示面包屑
    if (pathnames.length <= 1) return null;
    
    const breadcrumbItems: React.ReactNode[] = [];
    
    // 添加首页
    breadcrumbItems.push(
      <MuiLink 
        key="home" 
        component={Link} 
        to="/vendor" 
        color="inherit" 
        sx={{ 
          display: 'flex', 
          alignItems: 'center',
          '&:hover': { color: theme.palette.secondary.main }
        }}
      >
        <HomeIcon sx={{ mr: 0.5, fontSize: '0.9rem' }} />
        首页
      </MuiLink>
    );
    
    // 添加其他路径
    let path = '';
    pathnames.slice(1).forEach((name, index) => {
      path += `/${name}`;
      
      // 获取对应的菜单项文本
      const menuItem = menuItems.find(item => item.path === `/vendor${path}`);
      const itemText = menuItem ? menuItem.text : name.charAt(0).toUpperCase() + name.slice(1);
      
      const isLast = index === pathnames.slice(1).length - 1;
      
      breadcrumbItems.push(
        isLast ? (
          <Typography key={name} color="text.primary" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
            {itemText}
          </Typography>
        ) : (
          <MuiLink 
            key={name} 
            component={Link} 
            to={`/vendor${path}`} 
            color="inherit" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              '&:hover': { color: theme.palette.secondary.main }
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
    if (path === '/vendor' && location.pathname === '/vendor') {
      return true;
    }
    return location.pathname.startsWith(path) && path !== '/vendor';
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
        bgcolor: alpha(theme.palette.secondary.main, 0.1)
      }}>
        <Avatar 
          sx={{ 
            bgcolor: theme.palette.secondary.main,
            width: 40,
            height: 40,
            mr: 2
          }}
        >
          <StoreIcon />
        </Avatar>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            供应商中心
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.email || '供应商账户'}
          </Typography>
        </Box>
      </Box>
      
      <Divider />
      
      <Box sx={{ p: 2 }}>
        <Button
          variant="contained"
          color="secondary"
          fullWidth
          startIcon={<AddIcon />}
          onClick={() => navigate('/vendor/products/new')}
          sx={{ 
            borderRadius: 2,
            py: 1
          }}
        >
          添加新商品
        </Button>
      </Box>
      
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        <List>
          {menuItems.map((item) => (
            <Tooltip 
              key={item.text}
              title={item.description} 
              placement="right"
              arrow
            >
              <ListItem 
                button 
                component={Link} 
                to={item.path}
                selected={isPathActive(item.path)}
                sx={{
                  mb: 1,
                  borderRadius: 1,
                  '&.Mui-selected': {
                    bgcolor: alpha(theme.palette.secondary.main, 0.15),
                    '&:hover': {
                      bgcolor: alpha(theme.palette.secondary.main, 0.25),
                    },
                    borderLeft: `3px solid ${theme.palette.secondary.main}`
                  },
                  '&:hover': {
                    bgcolor: alpha(theme.palette.secondary.main, 0.08),
                  }
                }}
              >
                <ListItemIcon sx={{ 
                  color: isPathActive(item.path)
                    ? theme.palette.secondary.main 
                    : theme.palette.text.secondary,
                  minWidth: 40
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ 
                    fontWeight: isPathActive(item.path) ? 600 : 400,
                    fontSize: '0.95rem'
                  }} 
                />
                {item.path === '/vendor/orders' && (
                  <Chip 
                    label="3" 
                    color="secondary" 
                    size="small" 
                    sx={{ height: 20, fontSize: '0.75rem' }} 
                  />
                )}
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
            bgcolor: alpha(theme.palette.secondary.main, 0.08),
            borderRadius: 2
          }}
        >
          <Typography variant="body2" component="div" sx={{ mb: 1 }}>
            店铺状态: <Chip label="营业中" color="success" size="small" />
          </Typography>
          <Typography variant="caption" color="text.secondary">
            上次更新: {new Date().toLocaleDateString()}
          </Typography>
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
          
          {/* 顶部导航栏 */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Button
              component={Link}
              to="/vendor"
              color="inherit"
              startIcon={<HomeIcon />}
              sx={{ 
                mr: 2,
                fontWeight: location.pathname === '/vendor' ? 600 : 400,
                color: location.pathname === '/vendor' ? 'secondary.main' : 'inherit',
                position: 'relative',
                '&:after': location.pathname === '/vendor' ? {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '100%',
                  height: '2px',
                  bgcolor: 'secondary.main'
                } : {}
              }}
            >
              首页
            </Button>
            
            <Button
              component={Link}
              to="/vendor/products"
              color="inherit"
              startIcon={<ProductsIcon />}
              sx={{ 
                mr: 2,
                fontWeight: location.pathname.startsWith('/vendor/products') ? 600 : 400,
                color: location.pathname.startsWith('/vendor/products') ? 'secondary.main' : 'inherit',
                position: 'relative',
                '&:after': location.pathname.startsWith('/vendor/products') ? {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '100%',
                  height: '2px',
                  bgcolor: 'secondary.main'
                } : {}
              }}
            >
              商品管理
            </Button>

            <Button
              component={Link}
              to="/vendor/orders"
              color="inherit"
              startIcon={<OrdersIcon />}
              sx={{ 
                mr: 2,
                fontWeight: location.pathname.startsWith('/vendor/orders') ? 600 : 400,
                color: location.pathname.startsWith('/vendor/orders') ? 'secondary.main' : 'inherit',
                position: 'relative',
                '&:after': location.pathname.startsWith('/vendor/orders') ? {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '100%',
                  height: '2px',
                  bgcolor: 'secondary.main'
                } : {}
              }}
            >
              订单管理
            </Button>
          </Box>
          
          <Tooltip title="通知">
            <IconButton color="inherit" sx={{ mr: 1 }}>
              <Badge badgeContent={notificationCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          <Tooltip title="个人资料">
            <IconButton
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: theme.palette.secondary.main,
                  fontSize: '0.875rem'
                }}
              >
                {user?.email ? user.email.charAt(0).toUpperCase() : 'V'}
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
              {user?.email || '供应商'}
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => {
              handleProfileMenuClose();
              navigate('/vendor/settings');
            }}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              店铺设置
            </MenuItem>
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
          bgcolor: alpha(theme.palette.secondary.main, 0.02)
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
          <Typography variant="body2" component="div" color="text.secondary">
            © {new Date().getFullYear()} 在线购物系统 - 供应商中心
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default VendorLayout; 