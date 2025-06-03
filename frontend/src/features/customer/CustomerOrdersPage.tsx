import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  Chip, 
  Divider,
  TextField,
  InputAdornment,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ShoppingBag as ShoppingBagIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { orderApi, Order, OrdersResponse } from '../../utils/api';
import { OrderStatus } from '../../types/order';

const CustomerOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取订单数据
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('开始获取用户订单...');
        const response = await orderApi.getUserOrders();
        console.log('获取用户订单API响应:', response);
        
        // 正确处理响应数据类型
        if (Array.isArray(response)) {
          // 如果response是数组，直接使用
          console.log(`成功获取到 ${response.length} 个订单`);
          setOrders(response);
        } 
        // 如果response有orders属性
        else if ('orders' in response && Array.isArray(response.orders)) {
          console.log(`成功获取到 ${response.orders.length} 个订单`);
          setOrders(response.orders);
        } 
        // 其他情况
        else {
          console.warn('API响应中没有找到订单数据:', response);
          setOrders([]);
        }
      } catch (err: any) {
        console.error('获取订单失败:', err);
        const errorMessage = err.response?.data?.message || err.message || '获取订单失败，请重试';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, []);

  // 处理标签页变化
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 处理搜索
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // 获取状态芯片样式
  const getStatusChip = (status: OrderStatus) => {
    let color: 'success' | 'warning' | 'error' | 'default' | 'primary' | 'secondary' | 'info' = 'default';
    
    switch (status) {
      case OrderStatus.PENDING:
        color = 'warning';
        break;
      case OrderStatus.PROCESSING:
        color = 'primary';
        break;
      case OrderStatus.SHIPPED:
        color = 'info';
        break;
      case OrderStatus.DELIVERED:
        color = 'success';
        break;
      case OrderStatus.CANCELLED:
        color = 'error';
        break;
      default:
        color = 'default';
    }
    
    return (
      <Chip 
        size="small" 
        label={status} 
        color={color}
      />
    );
  };

  // 获取操作按钮
  const getActionButtons = (order: Order) => {
    switch (order.status) {
      case OrderStatus.PENDING:
        return (
          <>
            <Button 
              size="small" 
              variant="contained" 
              color="primary"
              onClick={() => navigate(`/payment/${order.id}`)}
              sx={{ mr: 1 }}
            >
              立即付款
            </Button>
            <Button 
              size="small" 
              variant="outlined" 
              color="error"
              onClick={() => handleCancelOrder(order.id)}
            >
              取消订单
            </Button>
          </>
        );
      case OrderStatus.PROCESSING:
        return (
          <Button 
            size="small" 
            variant="outlined" 
            color="primary"
            onClick={() => navigate(`/customer/orders/${order.id}`)}
          >
            查看详情
          </Button>
        );
      case OrderStatus.SHIPPED:
        return (
          <>
            <Button 
              size="small" 
              variant="contained" 
              color="success"
              onClick={() => handleConfirmReceipt(order.id)}
              sx={{ mr: 1 }}
            >
              确认收货
            </Button>
            <Button 
              size="small" 
              variant="outlined" 
              color="primary"
              onClick={() => navigate(`/logistics/${order.id}`)}
            >
              查看物流
            </Button>
          </>
        );
      case OrderStatus.DELIVERED:
        return (
          <>
            <Button 
              size="small" 
              variant="contained" 
              color="primary"
              onClick={() => navigate(`/review/${order.id}`)}
              sx={{ mr: 1 }}
            >
              评价
            </Button>
            <Button 
              size="small" 
              variant="outlined" 
              color="primary"
              onClick={() => handleBuyAgain(order.id)}
            >
              再次购买
            </Button>
          </>
        );
      default:
        return (
          <Button 
            size="small" 
            variant="outlined" 
            onClick={() => navigate(`/customer/orders/${order.id}`)}
          >
            查看详情
          </Button>
        );
    }
  };

  // 处理取消订单
  const handleCancelOrder = (orderId: string) => {
    console.log(`取消订单: ${orderId}`);
    // 在实际应用中，这里会调用API取消订单
    alert(`订单 ${orderId} 已取消`);
  };

  // 处理确认收货
  const handleConfirmReceipt = (orderId: string) => {
    console.log(`确认收货: ${orderId}`);
    // 在实际应用中，这里会调用API确认收货
    alert(`订单 ${orderId} 已确认收货`);
  };

  // 处理再次购买
  const handleBuyAgain = (orderId: string) => {
    console.log(`再次购买: ${orderId}`);
    // 在实际应用中，这里会将订单中的商品添加到购物车
    alert(`订单 ${orderId} 中的商品已添加到购物车`);
  };

  // 筛选订单
  const filteredOrders = orders.filter(order => {
    // 搜索过滤
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 标签页过滤
    let matchesTab = true;
    switch (tabValue) {
      case 0: // 全部
        matchesTab = true;
        break;
      case 1: // 待付款
        matchesTab = order.status.toLowerCase() === OrderStatus.PENDING.toLowerCase();
        break;
      case 2: // 待发货
        matchesTab = order.status.toLowerCase() === OrderStatus.PROCESSING.toLowerCase();
        break;
      case 3: // 已发货
        matchesTab = order.status.toLowerCase() === OrderStatus.SHIPPED.toLowerCase();
        break;
      case 4: // 已完成
        matchesTab = order.status.toLowerCase() === OrderStatus.DELIVERED.toLowerCase();
        break;
      case 5: // 已取消
        matchesTab = order.status.toLowerCase() === OrderStatus.CANCELLED.toLowerCase();
        break;
      default:
        matchesTab = true;
    }
    
    console.log(`订单ID: ${order.id}, 状态: ${order.status}, 标签值: ${tabValue}, 匹配标签: ${matchesTab}`);
    
    return matchesSearch && matchesTab;
  });

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box m={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        我的订单
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            placeholder="搜索订单"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="全部" />
          <Tab label="待付款" />
          <Tab label="待发货" />
          <Tab label="已发货" />
          <Tab label="已完成" />
          <Tab label="已取消" />
        </Tabs>
      </Paper>
      
      {filteredOrders.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 5 }}>
          <ShoppingBagIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            暂无订单
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            sx={{ mt: 2 }}
            onClick={() => navigate('/products')}
          >
            去购物
          </Button>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filteredOrders.map((order) => (
            <Grid item xs={12} key={order.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      订单号: {order.id}
                    </Typography>
                    {getStatusChip(order.status)}
                  </Box>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <List disablePadding>
                    {order.items.map((item) => (
                      <ListItem key={item.id} disablePadding sx={{ py: 1 }}>
                        <ListItemText
                          primary={item.product_id}
                          secondary={`¥${item.price.toFixed(2)} × ${item.quantity}`}
                        />
                        <Typography variant="body2" fontWeight="bold">
                          ¥{(item.price * item.quantity).toFixed(2)}
                        </Typography>
                      </ListItem>
                    ))}
                  </List>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      下单时间: {formatDate(order.created_at)}
                    </Typography>
                    <Typography variant="subtitle1" fontWeight="bold">
                      总计: ¥{order.total.toFixed(2)}
                    </Typography>
                  </Box>
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                  {getActionButtons(order)}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default CustomerOrdersPage; 