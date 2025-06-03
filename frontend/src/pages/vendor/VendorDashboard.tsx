import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  Paper, 
  Box,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Dashboard as DashboardIcon,
  Inventory as ProductsIcon,
  ShoppingCart as OrdersIcon,
  BarChart as StatsIcon,
  ExitToApp as LogoutIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { RootState } from '../../store';
import { UserRole } from '../../types/auth';
import { Order } from '../../types/order';
import { authApi, productApi, orderApi } from '../../utils/api';

const VendorDashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  
  // 统计数据
  const [productCount, setProductCount] = useState<number>(0);
  const [pendingOrderCount, setPendingOrderCount] = useState<number>(0);
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
  
  // 确保用户是供应商
  useEffect(() => {
    if (!user) {
      navigate('/');
    } else if (String(user.role).toLowerCase() !== 'vendor') {
      navigate('/');
      showSnackbar('只有供应商可以访问此页面', 'error');
    }
  }, [user, navigate]);

  // 获取统计数据
  useEffect(() => {
    fetchStats();
  }, []);
  
  // 获取统计数据
  const fetchStats = async () => {
    setLoading(true);
    try {
      // 获取商品数量
      const products = await productApi.getVendorProducts();
      setProductCount(Array.isArray(products) ? products.length : 0);
      
      // 获取订单数据
      const ordersData = await orderApi.getVendorOrders();
      
      // 处理订单数据
      let orders: Order[] = [];
      if (Array.isArray(ordersData)) {
        orders = ordersData as Order[];
      } else if (ordersData && typeof ordersData === 'object' && 'orders' in ordersData) {
        orders = (ordersData as { orders: Order[] }).orders;
      }
      
      // 计算待处理订单数量
      const pendingOrders = orders.filter(order => 
        String(order.status).toLowerCase() === 'pending'
      );
      setPendingOrderCount(pendingOrders.length);
      
      // 计算本月收入
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const thisMonthOrders = orders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate.getMonth() === currentMonth && 
               orderDate.getFullYear() === currentYear;
      });
      
      const income = thisMonthOrders.reduce((total, order) => total + order.total, 0);
      setMonthlyIncome(income);
      
    } catch (error) {
      console.error('获取统计数据失败:', error);
      showSnackbar('获取统计数据失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authApi.logout();
  };
  
  // 显示Snackbar消息
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // 关闭Snackbar
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };
  
  if (!user) {
    return <CircularProgress />;
  }
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <DashboardIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            供应商控制台
          </Typography>
          <Button 
            color="inherit" 
            startIcon={<ProductsIcon />}
            sx={{ mr: 2 }}
            onClick={() => navigate('/vendor/products')}
          >
            我的产品
          </Button>
          <Button 
            color="inherit" 
            startIcon={<OrdersIcon />}
            sx={{ mr: 2 }}
            onClick={() => navigate('/vendor/orders')}
          >
            订单管理
          </Button>
          <Typography variant="body1" sx={{ mr: 2 }}>
            {user.email}
          </Typography>
          <IconButton color="inherit" onClick={handleLogout} title="登出">
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {/* 欢迎卡片 */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h5" gutterBottom>
                欢迎回来，{user?.email}
              </Typography>
              <Typography variant="body1">
                在这里您可以管理您的产品和查看订单信息。
              </Typography>
            </Paper>
          </Grid>
          
          {/* 快速访问卡片 */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardHeader title="快速访问" />
              <CardContent>
                <List>
                  <ListItem button onClick={() => navigate('/vendor/products')}>
                    <ListItemIcon>
                      <ProductsIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="管理产品" />
                  </ListItem>
                  <Divider />
                  <ListItem button onClick={() => navigate('/vendor/orders')}>
                    <ListItemIcon>
                      <OrdersIcon color="secondary" />
                    </ListItemIcon>
                    <ListItemText primary="查看订单" />
                  </ListItem>
                </List>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  variant="contained" 
                  color="primary"
                  startIcon={<ProductsIcon />}
                  onClick={() => navigate('/vendor/products')}
                  fullWidth
                >
                  添加新产品
                </Button>
              </CardActions>
            </Card>
          </Grid>
          
          {/* 统计信息卡片 */}
          <Grid item xs={12} md={8}>
            <Card sx={{ height: '100%' }}>
              <CardHeader 
                title="统计信息" 
                action={
                  <IconButton aria-label="刷新" onClick={fetchStats} disabled={loading}>
                    {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                  </IconButton>
                }
              />
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 3 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4">{productCount}</Typography>
                    <Typography variant="body2" color="text.secondary">产品总数</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4">{pendingOrderCount}</Typography>
                    <Typography variant="body2" color="text.secondary">待处理订单</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4">¥{monthlyIncome.toFixed(2)}</Typography>
                    <Typography variant="body2" color="text.secondary">本月收入</Typography>
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                  {loading ? '正在加载统计数据...' : '最后更新时间: ' + new Date().toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
      
      {/* 消息提示 */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VendorDashboard; 