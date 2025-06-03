import React, { useEffect, useState } from 'react';
import { 
  Typography, 
  Grid, 
  Paper, 
  Box, 
  Card, 
  CardContent, 
  CardHeader,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  IconButton,
  Chip,
  Avatar,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  ShoppingBag as OrderIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { orderApi, Order, OrdersResponse } from '../../utils/api';
import { productApi } from '../../utils/api';
import { OrderStatus } from '../../types/order';

// 销售数据结构
interface SalesData {
  name: string;
  销售额: number;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0
  });
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  
  // 获取仪表盘数据
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 获取订单数据
        const ordersResponse = await orderApi.getAllOrders();
        let orders: Order[] = [];
        
        // 处理响应数据
        if (Array.isArray(ordersResponse)) {
          orders = ordersResponse;
        } else if ('orders' in ordersResponse && Array.isArray(ordersResponse.orders)) {
          orders = ordersResponse.orders;
        }
        
        // 获取产品数据
        const products = await productApi.getAllProductsWithPagination();
        
        // 计算总销售额
        const totalSales = orders.reduce((sum, order) => sum + (order.total || 0), 0);
        
        // 计算用户数量（通过订单中的不同用户ID）
        const uniqueUserIds = new Set(orders.map(order => order.user_id));
        
        // 准备最近的5个订单
        const latestOrders = [...orders]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);
        
        // 生成月度销售数据
        const monthlySales = generateMonthlySalesData(orders);
        
        // 更新状态
        setStats({
          totalSales,
          totalOrders: orders.length,
          totalUsers: uniqueUserIds.size,
          totalProducts: Array.isArray(products) ? products.length : 0
        });
        
        setSalesData(monthlySales);
        setRecentOrders(latestOrders);
        
        console.log('仪表盘数据加载完成:', {
          orders: orders.length,
          products: Array.isArray(products) ? products.length : 0,
          sales: totalSales,
          users: uniqueUserIds.size
        });
      } catch (err: any) {
        console.error('获取仪表盘数据失败:', err);
        setError(err.message || '获取数据失败');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  // 生成月度销售数据
  const generateMonthlySalesData = (orders: Order[]): SalesData[] => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const currentYear = new Date().getFullYear();
    
    // 初始化每月销售额为0
    const monthlySales = months.map(name => ({ name, 销售额: 0 }));
    
    // 计算每月销售额
    orders.forEach(order => {
      const orderDate = new Date(order.created_at);
      // 只统计今年的订单
      if (orderDate.getFullYear() === currentYear) {
        const month = orderDate.getMonth(); // 0-11
        monthlySales[month].销售额 += order.total || 0;
      }
    });
    
    return monthlySales;
  };
  
  // 状态标签样式
  const getStatusChip = (status: OrderStatus) => {
    let color: 'success' | 'warning' | 'error' | 'default' | 'primary' | 'secondary' | 'info' = 'default';
    
    switch (status) {
      case OrderStatus.DELIVERED:
        color = 'success';
        break;
      case OrderStatus.PROCESSING:
        color = 'primary';
        break;
      case OrderStatus.SHIPPED:
        color = 'info';
        break;
      case OrderStatus.PENDING:
        color = 'warning';
        break;
      case OrderStatus.CANCELLED:
        color = 'error';
        break;
      default:
        color = 'default';
    }
    
    // 转换状态为中文显示
    let displayStatus: string = status;
    switch (status) {
      case OrderStatus.DELIVERED:
        displayStatus = '已完成';
        break;
      case OrderStatus.PROCESSING:
        displayStatus = '处理中';
        break;
      case OrderStatus.SHIPPED:
        displayStatus = '已发货';
        break;
      case OrderStatus.PENDING:
        displayStatus = '待处理';
        break;
      case OrderStatus.CANCELLED:
        displayStatus = '已取消';
        break;
    }
    
    return <Chip size="small" label={displayStatus} color={color} />;
  };
  
  // 格式化日期
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN');
    } catch (e) {
      return dateString;
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        加载仪表盘数据失败: {error}
      </Alert>
    );
  }
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        控制面板
      </Typography>
      
      {/* 快捷操作按钮 */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<InventoryIcon />}
          onClick={() => navigate('/admin/products')}
        >
          商品管理
        </Button>
        <Button 
          variant="outlined" 
          color="primary"
          startIcon={<OrderIcon />}
          onClick={() => navigate('/admin/orders')}
        >
          订单管理
        </Button>
        <Button 
          variant="outlined" 
          color="primary"
          startIcon={<PeopleIcon />}
          onClick={() => navigate('/admin/users')}
        >
          用户管理
        </Button>
      </Box>
      
      {/* 统计卡片 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column',
              height: 140,
              bgcolor: 'primary.light',
              color: 'primary.contrastText'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography component="h2" variant="h6" gutterBottom>
                总销售额
              </Typography>
              <TrendingUpIcon />
            </Box>
            <Typography component="div" variant="h4">
              ¥{stats.totalSales.toLocaleString()}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              截至今日
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column',
              height: 140,
              bgcolor: 'secondary.light',
              color: 'secondary.contrastText'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography component="h2" variant="h6" gutterBottom>
                订单数
              </Typography>
              <OrderIcon />
            </Box>
            <Typography component="div" variant="h4">
              {stats.totalOrders}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              总订单数量
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column',
              height: 140,
              bgcolor: 'success.light',
              color: 'success.contrastText'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography component="h2" variant="h6" gutterBottom>
                用户数
              </Typography>
              <PeopleIcon />
            </Box>
            <Typography component="div" variant="h4">
              {stats.totalUsers}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              下单用户总数
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2, 
              display: 'flex', 
              flexDirection: 'column',
              height: 140,
              bgcolor: 'info.light',
              color: 'info.contrastText'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography component="h2" variant="h6" gutterBottom>
                商品数
              </Typography>
              <InventoryIcon />
            </Box>
            <Typography component="div" variant="h4">
              {stats.totalProducts}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              系统商品总数
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      {/* 图表和最近订单 */}
      <Grid container spacing={3}>
        {/* 销售图表 */}
        <Grid item xs={12} md={8}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 400,
            }}
          >
            <Typography variant="h6" gutterBottom>
              月度销售趋势
            </Typography>
            {salesData && salesData.length > 0 ? (
              <Box sx={{ 
                width: '100%', 
                height: '300px', 
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                alignItems: 'stretch',
                mt: 2
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  height: '250px',
                  alignItems: 'flex-end',
                  justifyContent: 'space-around',
                  px: 2
                }}>
                  {salesData.map((item, index) => {
                    // 找出最大销售额，用于计算比例
                    const maxSale = Math.max(...salesData.map(d => d.销售额));
                    const height = maxSale > 0 ? (item.销售额 / maxSale) * 200 : 0;
                    
                    return (
                      <Box 
                        key={index}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          width: `${80 / salesData.length}%`,
                          minWidth: '20px'
                        }}
                      >
                        <Box 
                          sx={{ 
                            height: `${height}px`, 
                            width: '80%',
                            backgroundColor: '#8884d8',
                            borderRadius: '4px 4px 0 0',
                            minHeight: '4px',
                            transition: 'height 0.3s ease'
                          }} 
                        />
                        <Typography variant="caption" sx={{ mt: 1 }}>
                          {item.name}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                          ¥{item.销售额.toLocaleString()}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
                <Typography variant="body1" color="text.secondary">
                  暂无销售数据
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* 最近订单 */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 400,
              overflow: 'auto'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                最近订单
              </Typography>
              <Button 
                size="small" 
                onClick={() => navigate('/admin/orders')}
              >
                查看全部
              </Button>
            </Box>
            {recentOrders.length > 0 ? (
              <List>
                {recentOrders.map((order, index) => (
                  <React.Fragment key={order.id}>
                    <ListItem
                      secondaryAction={
                        <IconButton edge="end" onClick={() => navigate(`/admin/orders/${order.id}`)}>
                          <ViewIcon />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography component="span" variant="body1" fontWeight="bold">
                              {order.id.substring(0, 8)}...
                            </Typography>
                            {getStatusChip(order.status)}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography component="span" variant="body2">
                              用户ID: {order.user_id.substring(0, 8)}...
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography component="span" variant="body2">
                                {formatDate(order.created_at)}
                              </Typography>
                              <Typography component="span" variant="body2" fontWeight="bold">
                                ¥{order.total.toFixed(2)}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < recentOrders.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
                <Typography variant="body1" color="text.secondary">
                  暂无订单数据
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard; 