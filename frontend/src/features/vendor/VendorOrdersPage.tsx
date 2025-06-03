import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip,
  Button,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  SelectChangeEvent,
  Tabs,
  Tab
} from '@mui/material';
import { 
  Search as SearchIcon,
  FilterList as FilterIcon,
  LocalShipping as ShippingIcon,
  Check as CheckIcon,
  ShoppingBag as ShoppingBagIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { RootState } from '../../store';
import { orderApi, Order, OrdersResponse, OrderItem } from '../../utils/api';
import { OrderStatus } from '../../types/order';
import { UserRole } from '../../types/auth';

// 定义一个类型转换函数，确保字符串可以安全地转换为OrderStatus
const toOrderStatus = (status: string): OrderStatus => {
  const statusLower = status.toLowerCase();
  switch (statusLower) {
    case 'pending':
      return OrderStatus.PENDING;
    case 'processing':
      return OrderStatus.PROCESSING;
    case 'shipped':
      return OrderStatus.SHIPPED;
    case 'delivered':
    case 'completed':
      return OrderStatus.DELIVERED;
    case 'cancelled':
    case 'canceled':
      return OrderStatus.CANCELLED;
    default:
      console.warn('未知订单状态:', status);
      return OrderStatus.PENDING;
  }
};

const VendorOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [tabValue, setTabValue] = useState<number>(0);
  
  // 状态更新对话框
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>(OrderStatus.PENDING);
  const [updateLoading, setUpdateLoading] = useState<boolean>(false);
  
  // 获取订单函数
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('开始获取供应商订单...');
      const response = await orderApi.getVendorOrders();
      console.log('获取供应商订单API响应:', response);
      console.log('响应类型:', typeof response);
      
      // 正确处理响应数据类型
      let fetchedOrders: Order[] = [];
      if (Array.isArray(response)) {
        // 如果response是数组，直接使用
        fetchedOrders = response;
        console.log('响应是数组类型');
      } 
      // 如果response有orders属性
      else if (response && typeof response === 'object' && 'orders' in response && Array.isArray(response.orders)) {
        fetchedOrders = response.orders;
        console.log('响应是对象类型，包含orders数组');
      } 
      
      // 订单数据调试
      if (fetchedOrders.length > 0) {
        console.log('第一个订单数据示例:', fetchedOrders[0]);
        console.log('第一个订单的状态:', fetchedOrders[0].status, '类型:', typeof fetchedOrders[0].status);
      }
      
      console.log(`成功获取到 ${fetchedOrders.length} 个订单`);
      setOrders(fetchedOrders);
    } catch (err: any) {
      console.error('获取订单失败:', err);
      const errorMessage = err.response?.data?.message || err.message || '获取订单失败，请重试';
      setError(errorMessage);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // 刷新订单数据
  const refreshOrders = async () => {
    setRefreshing(true);
    await fetchOrders();
  };
  
  // 确保用户是供应商
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (String(user.role).toLowerCase() !== 'vendor') {
      navigate('/');
      alert('只有供应商可以访问此页面');
    }
  }, [user, navigate]);

  // 获取订单
  useEffect(() => {
    if (user && String(user.role).toLowerCase() === 'vendor') {
      fetchOrders();
    }
  }, [user]);

  // 处理搜索
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // 处理标签页变化
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    console.log('切换到标签页:', newValue);
  };

  // 打开状态更新对话框
  const handleOpenDialog = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(toOrderStatus(String(order.status)));
    setDialogOpen(true);
  };

  // 关闭状态更新对话框
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedOrder(null);
    setNewStatus(OrderStatus.PENDING);
  };

  // 更新订单状态
  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;
    
    try {
      setUpdateLoading(true);
      
      console.log(`更新订单 ${selectedOrder.id} 状态为 ${newStatus}`);
      await orderApi.updateOrderStatus(selectedOrder.id, newStatus);
      
      // 更新本地状态
      const updatedOrders = orders.map(order => 
        order.id === selectedOrder.id 
          ? { ...order, status: newStatus } 
          : order
      );
      
      setOrders(updatedOrders);
      
      handleCloseDialog();
      alert(`订单 ${selectedOrder.id} 状态已更新为 ${newStatus}`);
      
      // 刷新订单列表，确保数据与数据库同步
      refreshOrders();
    } catch (err: any) {
      console.error('更新订单状态失败:', err);
      alert(`更新失败: ${err.message || '未知错误'}`);
    } finally {
      setUpdateLoading(false);
    }
  };

  // 处理快速发货
  const handleShipOrder = async (orderId: string) => {
    try {
      console.log(`发货订单: ${orderId}`);
      await orderApi.updateOrderStatus(orderId, OrderStatus.SHIPPED);
      
      // 更新本地状态
      const updatedOrders = orders.map(order => 
        order.id === orderId 
          ? { ...order, status: OrderStatus.SHIPPED } 
          : order
      );
      
      setOrders(updatedOrders);
      
      alert(`订单 ${orderId} 已发货`);
      
      // 刷新订单列表，确保数据与数据库同步
      refreshOrders();
    } catch (err: any) {
      console.error('发货失败:', err);
      alert(`发货失败: ${err.message || '未知错误'}`);
    }
  };

  // 处理快速接单
  const handleProcessOrder = async (orderId: string) => {
    try {
      console.log(`接单: ${orderId}`);
      await orderApi.updateOrderStatus(orderId, OrderStatus.PROCESSING);
      
      // 更新本地状态
      const updatedOrders = orders.map(order => 
        order.id === orderId 
          ? { ...order, status: OrderStatus.PROCESSING } 
          : order
      );
      
      setOrders(updatedOrders);
      
      alert(`订单 ${orderId} 已接单`);
      
      // 刷新订单列表，确保数据与数据库同步
      refreshOrders();
    } catch (err: any) {
      console.error('接单失败:', err);
      alert(`接单失败: ${err.message || '未知错误'}`);
    }
  };

  // 获取状态芯片
  const getStatusChip = (status: OrderStatus | string) => {
    let color: 'success' | 'warning' | 'error' | 'default' | 'primary' | 'secondary' | 'info' = 'default';
    let label = '未知状态';
    
    // 转换为小写进行比较
    const statusLower = String(status).toLowerCase();
    
    switch (statusLower) {
      case 'pending':
        color = 'warning';
        label = '待处理';
        break;
      case 'processing':
        color = 'primary';
        label = '处理中';
        break;
      case 'shipped':
        color = 'info';
        label = '已发货';
        break;
      case 'delivered':
        color = 'success';
        label = '已完成';
        break;
      case 'cancelled':
        color = 'error';
        label = '已取消';
        break;
      default:
        color = 'default';
        label = String(status);
    }
    
    return (
      <Chip 
        size="small" 
        label={label} 
        color={color}
      />
    );
  };

  // 获取操作按钮
  const getActionButtons = (order: Order) => {
    // 转换为小写进行比较
    const statusLower = String(order.status).toLowerCase();
    
    switch (statusLower) {
      case 'pending':
        return (
          <Button 
            size="small" 
            variant="contained" 
            color="primary"
            startIcon={<CheckIcon />}
            onClick={() => handleProcessOrder(order.id)}
            sx={{ mr: 1 }}
          >
            接单
          </Button>
        );
      case 'processing':
        return (
          <Button 
            size="small" 
            variant="contained" 
            color="info"
            startIcon={<ShippingIcon />}
            onClick={() => handleShipOrder(order.id)}
          >
            发货
          </Button>
        );
      default:
        return (
          <Button 
            size="small" 
            variant="outlined" 
            onClick={() => handleOpenDialog(order)}
          >
            更新状态
          </Button>
        );
    }
  };

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
  
  // 获取订单统计数据
  const getOrderStats = () => {
    return {
      total: orders.length,
      pending: orders.filter(o => String(o.status).toLowerCase() === 'pending').length,
      processing: orders.filter(o => String(o.status).toLowerCase() === 'processing').length,
      shipped: orders.filter(o => String(o.status).toLowerCase() === 'shipped').length,
      delivered: orders.filter(o => String(o.status).toLowerCase() === 'delivered').length,
      cancelled: orders.filter(o => String(o.status).toLowerCase() === 'cancelled').length,
    };
  };
  
  // 筛选订单 - 采用CustomerOrdersPage的实现方式
  const filteredOrders = orders.filter(order => {
    // 搜索过滤
    const matchesSearch = !searchTerm.trim() || 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 标签页过滤
    let matchesTab = true;
    const orderStatusLower = String(order.status).toLowerCase();
    
    console.log(`订单筛选: ID=${order.id}, 状态=${order.status}, 转换后=${orderStatusLower}, 标签值=${tabValue}`);
    
    switch (tabValue) {
      case 0: // 全部
        matchesTab = true;
        break;
      case 1: // 待处理
        matchesTab = orderStatusLower === 'pending';
        break;
      case 2: // 处理中
        matchesTab = orderStatusLower === 'processing';
        break;
      case 3: // 已发货
        matchesTab = orderStatusLower === 'shipped';
        break;
      case 4: // 已完成
        matchesTab = orderStatusLower === 'delivered';
        break;
      case 5: // 已取消
        matchesTab = orderStatusLower === 'cancelled';
        break;
      default:
        matchesTab = true;
    }
    
    console.log(`订单匹配结果: ID=${order.id}, 匹配搜索=${matchesSearch}, 匹配标签=${matchesTab}`);
    
    return matchesSearch && matchesTab;
  });

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

  const stats = getOrderStats();
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        供应商订单管理
      </Typography>
      
      {/* 订单统计卡片 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">所有订单</Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={4} lg={2}>
          <Card sx={{ bgcolor: 'warning.light' }}>
            <CardContent>
              <Typography variant="subtitle2">待处理</Typography>
              <Typography variant="h4">{stats.pending}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={4} lg={2}>
          <Card sx={{ bgcolor: 'primary.light' }}>
            <CardContent>
              <Typography variant="subtitle2">处理中</Typography>
              <Typography variant="h4">{stats.processing}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={4} lg={2}>
          <Card sx={{ bgcolor: 'info.light' }}>
            <CardContent>
              <Typography variant="subtitle2">已发货</Typography>
              <Typography variant="h4">{stats.shipped}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={4} lg={2}>
          <Card sx={{ bgcolor: 'success.light' }}>
            <CardContent>
              <Typography variant="subtitle2">已完成</Typography>
              <Typography variant="h4">{stats.delivered}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={6} md={4} lg={2}>
          <Card sx={{ bgcolor: 'error.light' }}>
            <CardContent>
              <Typography variant="subtitle2">已取消</Typography>
              <Typography variant="h4">{stats.cancelled}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* 筛选工具栏 */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={9}>
              <TextField
                fullWidth
                placeholder="搜索订单号或客户ID"
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={refreshOrders}
                disabled={refreshing}
              >
                {refreshing ? '刷新中...' : '刷新订单'}
              </Button>
            </Grid>
          </Grid>
        </Box>
        
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="全部订单" />
          <Tab label="待处理" />
          <Tab label="处理中" />
          <Tab label="已发货" />
          <Tab label="已完成" />
          <Tab label="已取消" />
        </Tabs>
      </Paper>
      
      {filteredOrders.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 5 }}>
          <ShoppingBagIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {searchTerm || tabValue !== 0 
              ? '没有符合筛选条件的订单' 
              : '暂无订单记录'}
          </Typography>
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
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    客户ID: {order.user_id}
                  </Typography>
                  <Box>
                    {getActionButtons(order)}
                    <Button 
                      size="small" 
                      variant="outlined"
                      onClick={() => handleOpenDialog(order)}
                      sx={{ ml: 1 }}
                    >
                      修改状态
                    </Button>
                  </Box>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* 订单状态更新对话框 */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>更新订单状态</DialogTitle>
        <DialogContent>
          <DialogContentText>
            请为订单 {selectedOrder?.id} 选择新状态:
          </DialogContentText>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>订单状态</InputLabel>
            <Select
              value={newStatus}
              label="订单状态"
              onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
            >
              <MenuItem value={OrderStatus.PENDING}>待处理</MenuItem>
              <MenuItem value={OrderStatus.PROCESSING}>处理中</MenuItem>
              <MenuItem value={OrderStatus.SHIPPED}>已发货</MenuItem>
              <MenuItem value={OrderStatus.DELIVERED}>已完成</MenuItem>
              <MenuItem value={OrderStatus.CANCELLED}>已取消</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button 
            onClick={handleUpdateStatus} 
            disabled={!selectedOrder || updateLoading || newStatus === toOrderStatus(String(selectedOrder.status))}
          >
            {updateLoading ? '更新中...' : '更新'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VendorOrdersPage; 