import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Box,
  Chip,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  Grid,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Tabs,
  Tab,
  ButtonGroup,
  Snackbar
} from '@mui/material';
import { 
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { OrderStatus } from '../../types/order';
import { orderApi } from '../../utils/api';
import { productApi } from '../../utils/api';

// 简化的产品类型
interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
}

// 订单项类型
interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
}

// 订单类型
interface Order {
  id: string;
  user_id: string;
  total: number;
  status: string; // 改为string类型，避免枚举转换问题
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

const VendorOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [newStatus, setNewStatus] = useState<string>("pending");
  const [statusUpdating, setStatusUpdating] = useState<boolean>(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusSuccess, setStatusSuccess] = useState<boolean>(false);
  const [tabValue, setTabValue] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  
  // 获取供应商订单
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await orderApi.getVendorOrders();
      
      console.log('获取供应商订单API原始响应:', response);
      
      // 处理API响应
      let fetchedOrders: Order[] = [];
      if (Array.isArray(response)) {
        fetchedOrders = response;
      } else if (response && typeof response === 'object' && 'orders' in response && Array.isArray(response.orders)) {
        fetchedOrders = response.orders;
      }
      
      // 订单数据调试
      if (fetchedOrders.length > 0) {
        console.log('第一个订单数据示例:', fetchedOrders[0]);
        console.log('第一个订单的状态:', fetchedOrders[0].status, '类型:', typeof fetchedOrders[0].status);
      }
      
      console.log('成功获取到 ' + fetchedOrders.length + ' 个订单');
      
      setOrders(fetchedOrders);
    } catch (err: any) {
      console.error('获取供应商订单失败:', err);
      setError(err.response?.data?.message || '获取供应商订单失败');
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // 获取供应商产品
  const fetchProducts = async () => {
    try {
      const productsData = await productApi.getVendorProducts();
      const productsMap: Record<string, Product> = {};
      productsData.forEach((product: Product) => {
        productsMap[product.id] = product;
      });
      setProducts(productsMap);
    } catch (err) {
      console.error('获取产品失败:', err);
    }
  };
  
  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);
  
  // 刷新订单
  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };
  
  // 处理标签页变化
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 处理搜索
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  
  // 打开订单详情对话框
  const handleOpenDetail = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setIsDetailOpen(true);
    setStatusError(null);
    setStatusSuccess(false);
  };
  
  // 关闭订单详情对话框
  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedOrder(null);
  };
  
  // 更新订单状态
  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    
    try {
      setStatusUpdating(true);
      setStatusError(null);
      setStatusSuccess(false);
      
      await orderApi.updateOrderStatus(selectedOrder.id, newStatus as OrderStatus);
      
      // 更新本地订单状态
      const updatedOrder = { ...selectedOrder, status: newStatus };
      
      // 更新订单列表
      const updatedOrders = orders.map(order => 
        order.id === selectedOrder.id ? updatedOrder : order
      );
      
      setOrders(updatedOrders);
      setSelectedOrder(updatedOrder);
      setStatusSuccess(true);
      
      // 显示成功消息
      setSnackbarMessage(`订单 ${selectedOrder.id.substring(0, 8)}... 状态已更新为 ${getStatusLabel(newStatus)}`);
      setSnackbarOpen(true);
      
      // 自动关闭对话框
      setTimeout(() => {
        handleCloseDetail();
      }, 1500);
    } catch (err: any) {
      console.error('更新订单状态失败:', err);
      setStatusError(err.response?.data?.message || '更新订单状态失败');
    } finally {
      setStatusUpdating(false);
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
  
  // 根据订单状态返回对应的Chip颜色
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    
    switch(statusLower) {
      case 'pending':
        return 'warning';
      case 'processing':
        return 'primary';
      case 'shipped':
        return 'info';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };
  
  // 获取产品名称
  const getProductName = (productId: string) => {
    return products[productId]?.name || '未知产品';
  };
  
  // 获取状态的中文名称
  const getStatusLabel = (status: string): string => {
    const statusLower = status.toLowerCase();
    
    switch(statusLower) {
      case 'pending':
        return '待处理';
      case 'processing':
        return '处理中';
      case 'shipped':
        return '已发货';
      case 'delivered':
        return '已完成';
      case 'cancelled':
        return '已取消';
      default:
        return status;
    }
  };
  
  // 获取订单统计数据
  const getOrderStats = () => {
    return {
      total: orders.length,
      pending: orders.filter(o => o.status.toLowerCase() === 'pending').length,
      processing: orders.filter(o => o.status.toLowerCase() === 'processing').length,
      shipped: orders.filter(o => o.status.toLowerCase() === 'shipped').length,
      delivered: orders.filter(o => o.status.toLowerCase() === 'delivered').length,
      cancelled: orders.filter(o => o.status.toLowerCase() === 'cancelled').length,
    };
  };
  
  // 关闭提示条
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };
  
  // 标签值对应的状态字符串映射
  const getStatusByTabValue = (tab: number): string => {
    switch(tab) {
      case 1: return 'pending';
      case 2: return 'processing'; 
      case 3: return 'shipped';
      case 4: return 'delivered';
      case 5: return 'cancelled';
      default: return '';
    }
  };
  
  // 筛选订单 - 不使用额外的状态变量，直接计算
  const filteredOrders = orders.filter(order => {
    // 搜索过滤
    const matchesSearch = !searchTerm.trim() || 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 标签页过滤
    const matchesTab = tabValue === 0 || 
      order.status.toLowerCase() === getStatusByTabValue(tabValue);
    
    // 调试输出
    console.log(`订单筛选: ID=${order.id}, 状态=${order.status}, 标签值=${tabValue}, 匹配结果=${matchesSearch && matchesTab}`);
    
    return matchesSearch && matchesTab;
  });
  
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }
  
  const stats = getOrderStats();
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
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
                onChange={handleSearch}
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
                onClick={handleRefresh}
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
        <Paper sx={{ p: 3, textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="text.secondary">
            {searchTerm || tabValue !== 0 
              ? '没有符合筛选条件的订单' 
              : '暂无订单记录'}
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>订单编号</TableCell>
                <TableCell>客户ID</TableCell>
                <TableCell>下单日期</TableCell>
                <TableCell>金额</TableCell>
                <TableCell>状态</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders.map(order => (
                <TableRow key={order.id}>
                  <TableCell>{order.id.substring(0, 8)}...</TableCell>
                  <TableCell>{order.user_id}</TableCell>
                  <TableCell>{formatDate(order.created_at)}</TableCell>
                  <TableCell>¥{order.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={getStatusLabel(order.status)} 
                      color={getStatusColor(order.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <ButtonGroup size="small">
                      <Button 
                        variant="outlined" 
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleOpenDetail(order)}
                      >
                        查看详情
                      </Button>
                      <Button 
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenDetail(order)}
                      >
                        修改状态
                      </Button>
                    </ButtonGroup>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* 订单详情对话框 */}
      <Dialog open={isDetailOpen} onClose={handleCloseDetail} maxWidth="md" fullWidth>
        {selectedOrder && (
          <>
            <DialogTitle>
              订单详情
              <Chip 
                label={getStatusLabel(selectedOrder.status)} 
                color={getStatusColor(selectedOrder.status) as any}
                size="small"
                sx={{ ml: 2 }}
              />
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    订单编号
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedOrder.id}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    客户ID
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedOrder.user_id}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    下单时间
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatDate(selectedOrder.created_at)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    最后更新时间
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatDate(selectedOrder.updated_at)}
                  </Typography>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                订单商品
              </Typography>
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>商品名称</TableCell>
                      <TableCell align="right">单价</TableCell>
                      <TableCell align="right">数量</TableCell>
                      <TableCell align="right">小计</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedOrder.items.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>{getProductName(item.product_id)}</TableCell>
                        <TableCell align="right">¥{item.price.toFixed(2)}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">¥{(item.price * item.quantity).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                        总计:
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        ¥{selectedOrder.total.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                更新订单状态
              </Typography>
              
              {statusSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  订单状态更新成功
                </Alert>
              )}
              
              {statusError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {statusError}
                </Alert>
              )}
              
              <FormControl fullWidth>
                <InputLabel>订单状态</InputLabel>
                <Select
                  value={newStatus}
                  label="订单状态"
                  onChange={(e) => setNewStatus(e.target.value)}
                  disabled={statusUpdating}
                >
                  <MenuItem value="pending">待处理</MenuItem>
                  <MenuItem value="processing">处理中</MenuItem>
                  <MenuItem value="shipped">已发货</MenuItem>
                  <MenuItem value="delivered">已完成</MenuItem>
                  <MenuItem value="cancelled">已取消</MenuItem>
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDetail}>关闭</Button>
              <Button 
                onClick={handleUpdateStatus} 
                variant="contained" 
                disabled={statusUpdating || newStatus === selectedOrder.status}
              >
                {statusUpdating ? '更新中...' : '更新状态'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      
      {/* 提示消息 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
      />
    </Container>
  );
};

export default VendorOrdersPage; 