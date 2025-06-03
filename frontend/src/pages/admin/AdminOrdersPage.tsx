import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
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
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Card,
  CardContent,
  Alert,
  Snackbar,
  ButtonGroup,
  List,
  ListItem,
  ListItemText,
  Divider,
  InputAdornment
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  ShoppingBag as ShoppingBagIcon
} from '@mui/icons-material';
import { RootState } from '../../store';
import { orderApi } from '../../utils/api';
import { OrderStatus } from '../../types/order';
import { UserRole } from '../../types/auth';

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
  status: OrderStatus;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

const AdminOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  // 订单详情对话框状态
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState<boolean>(false);
  
  // 订单状态修改对话框状态
  const [statusDialogOpen, setStatusDialogOpen] = useState<boolean>(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>(OrderStatus.PENDING);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState<boolean>(false);
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState<boolean>(false);
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null);
  
  // 筛选状态
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 成功提示状态
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');

  // 确保用户是管理员
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (String(user.role).toLowerCase() !== 'admin') {
      navigate('/');
      alert('只有管理员可以访问此页面');
    }
  }, [user, navigate]);

  // 获取订单数据
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('开始获取管理员订单');
      const response = await orderApi.getAllOrders();
      
      // 正确处理响应类型
      if (Array.isArray(response)) {
        // 如果response是数组，直接使用
        console.log(`获取到 ${response.length} 个订单`);
        setOrders(response);
        setFilteredOrders(response);
      }
      // 如果response是对象且有orders属性
      else if ('orders' in response && Array.isArray(response.orders)) {
        console.log(`获取到 ${response.orders.length} 个订单`);
        setOrders(response.orders);
        setFilteredOrders(response.orders);
      } 
      else {
        console.log('未获取到订单数据');
        setOrders([]);
        setFilteredOrders([]);
      }
    } catch (err: any) {
      console.error('获取订单失败:', err);
      setError(err.message || '获取订单失败');
      setOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
  };
  
  // 刷新订单数据（添加延迟确保获取最新数据）
  const refreshOrders = async () => {
    // 添加短暂延迟，确保服务器处理完成
    await new Promise(resolve => setTimeout(resolve, 300));
    await fetchOrders();
  };

  // 初始加载订单
  useEffect(() => {
    if (user && String(user.role).toLowerCase() === 'admin') {
      fetchOrders();
    }
  }, [user]);

  // 应用筛选器
  useEffect(() => {
    if (!orders.length) return;
    
    let result = [...orders];
    
    // 按状态筛选
    if (filterStatus !== 'all') {
      console.log('筛选状态:', filterStatus);
      console.log('订单状态示例:', result.length > 0 ? result[0].status : '无订单');
      result = result.filter(order => {
        // 转换为小写进行比较，确保不区分大小写
        const orderStatusLower = String(order.status).toLowerCase();
        const filterStatusLower = String(filterStatus).toLowerCase();
        console.log(`比较: 订单状态=${order.status}(${orderStatusLower}), 筛选条件=${filterStatus}(${filterStatusLower}), 结果=${orderStatusLower === filterStatusLower}`);
        return orderStatusLower === filterStatusLower;
      });
    }
    
    // 按搜索词筛选（订单ID或用户ID）
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(order => 
        order.id.toLowerCase().includes(query) || 
        order.user_id.toLowerCase().includes(query)
      );
    }
    
    console.log('筛选后订单数量:', result.length);
    setFilteredOrders(result);
  }, [orders, filterStatus, searchQuery]);

  // 刷新订单列表
  const handleRefresh = () => {
    setRefreshing(true);
    refreshOrders();
  };

  // 打开订单详情对话框
  const handleOpenDetailDialog = (order: Order) => {
    setSelectedOrder(order);
    setDetailDialogOpen(true);
  };

  // 关闭订单详情对话框
  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);
    setSelectedOrder(null);
  };

  // 打开状态修改对话框
  const handleOpenStatusDialog = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setStatusDialogOpen(true);
    setStatusUpdateError(null);
    setStatusUpdateSuccess(false);
  };

  // 关闭状态修改对话框
  const handleCloseStatusDialog = () => {
    setStatusDialogOpen(false);
    setSelectedOrder(null);
    setStatusUpdateError(null);
    setStatusUpdateSuccess(false);
  };

  // 快速更新订单状态
  const handleQuickUpdateStatus = async (order: Order, status: OrderStatus) => {
    try {
      console.log(`快速更新订单 ${order.id} 状态为 ${status}`);
      
      // 调用API更新状态
      await orderApi.updateOrderStatus(order.id, status);
      
      // 更新本地状态
      const updatedOrders = orders.map(o => 
        o.id === order.id 
          ? { ...o, status } 
          : o
      );
      
      setOrders(updatedOrders);
      setFilteredOrders(updatedOrders.filter(o => 
        filterStatus === 'all' || o.status === filterStatus
      ));
      
      // 显示成功消息
      setSnackbarMessage(`订单 ${order.id} 状态已更新为 ${status}`);
      setSnackbarOpen(true);
      
      // 刷新订单列表，确保数据与数据库同步
      refreshOrders();
    } catch (err: any) {
      console.error('更新订单状态失败:', err);
      
      // 显示错误消息
      setSnackbarMessage(`更新失败: ${err.message || '未知错误'}`);
      setSnackbarOpen(true);
    }
  };

  // 更新订单状态
  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    
    try {
      setStatusUpdateLoading(true);
      setStatusUpdateError(null);
      
      console.log(`更新订单 ${selectedOrder.id} 状态为 ${newStatus}`);
      
      // 调用API更新状态
      await orderApi.updateOrderStatus(selectedOrder.id, newStatus);
      
      // 更新本地状态
      const updatedOrders = orders.map(order => 
        order.id === selectedOrder.id 
          ? { ...order, status: newStatus } 
          : order
      );
      
      setOrders(updatedOrders);
      setFilteredOrders(updatedOrders.filter(order => 
        filterStatus === 'all' || order.status === filterStatus
      ));
      
      // 设置成功状态
      setStatusUpdateSuccess(true);
      
      // 显示成功消息
      setSnackbarMessage(`订单 ${selectedOrder.id} 状态已更新为 ${newStatus}`);
      setSnackbarOpen(true);
      
      // 刷新订单列表，确保数据与数据库同步
      refreshOrders();
      
      // 关闭对话框
      setTimeout(() => {
        handleCloseStatusDialog();
      }, 1500);
    } catch (err: any) {
      console.error('更新订单状态失败:', err);
      
      // 设置错误状态
      setStatusUpdateError(err.message || '更新失败，请重试');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // 获取状态芯片颜色
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return 'warning';
      case OrderStatus.PROCESSING:
        return 'primary';
      case OrderStatus.SHIPPED:
        return 'info';
      case OrderStatus.DELIVERED:
        return 'success';
      case OrderStatus.CANCELLED:
        return 'error';
      default:
        return 'default';
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
    console.log('计算订单统计数据，总订单数:', orders.length);
    if (orders.length > 0) {
      console.log('订单状态示例:', orders[0].status, '类型:', typeof orders[0].status);
    }
    
    const stats = {
      total: orders.length,
      pending: orders.filter(order => {
        const match = String(order.status).toLowerCase() === OrderStatus.PENDING.toLowerCase();
        return match;
      }).length,
      processing: orders.filter(order => {
        const match = String(order.status).toLowerCase() === OrderStatus.PROCESSING.toLowerCase();
        return match;
      }).length,
      shipped: orders.filter(order => {
        const match = String(order.status).toLowerCase() === OrderStatus.SHIPPED.toLowerCase();
        return match;
      }).length,
      delivered: orders.filter(order => {
        const match = String(order.status).toLowerCase() === OrderStatus.DELIVERED.toLowerCase();
        return match;
      }).length,
      cancelled: orders.filter(order => {
        const match = String(order.status).toLowerCase() === OrderStatus.CANCELLED.toLowerCase();
        return match;
      }).length,
    };
    
    console.log('订单统计结果:', stats);
    return stats;
  };

  // 关闭提示条
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // 如果正在加载，显示加载指示器
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  const stats = getOrderStats();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        订单管理
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
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              id="order-search"
              fullWidth
              placeholder="搜索订单号或用户ID"
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={5}>
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel id="status-filter-label">订单状态</InputLabel>
              <Select
                id="status-filter"
                labelId="status-filter-label"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="订单状态"
                startAdornment={
                  <InputAdornment position="start">
                    <FilterIcon />
                  </InputAdornment>
                }
              >
                <MenuItem value="all">全部状态</MenuItem>
                <MenuItem value={OrderStatus.PENDING}>待处理</MenuItem>
                <MenuItem value={OrderStatus.PROCESSING}>处理中</MenuItem>
                <MenuItem value={OrderStatus.SHIPPED}>已发货</MenuItem>
                <MenuItem value={OrderStatus.DELIVERED}>已完成</MenuItem>
                <MenuItem value={OrderStatus.CANCELLED}>已取消</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              id="refresh-button"
              fullWidth
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? '刷新中...' : '刷新'}
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* 错误提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* 订单列表 */}
      {filteredOrders.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 5 }}>
          <ShoppingBagIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            暂无订单
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {searchQuery || filterStatus !== 'all' 
              ? '没有符合筛选条件的订单，请尝试其他筛选条件' 
              : '系统中还没有任何订单'}
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
                    <Chip 
                      size="small" 
                      label={order.status} 
                      color={getStatusColor(order.status) as any}
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    用户ID: {order.user_id}
                  </Typography>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <List disablePadding>
                    {order.items.slice(0, 3).map((item) => (
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
                    {order.items.length > 3 && (
                      <ListItem disablePadding sx={{ py: 1 }}>
                        <ListItemText
                          primary={`还有 ${order.items.length - 3} 个商品...`}
                          primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
                        />
                      </ListItem>
                    )}
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
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2, pt: 0 }}>
                  <ButtonGroup size="small">
                    <Button
                      id={`view-order-${order.id}`}
                      variant="outlined"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleOpenDetailDialog(order)}
                    >
                      查看详情
                    </Button>
                    <Button
                      id={`edit-order-${order.id}`}
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenStatusDialog(order)}
                    >
                      修改状态
                    </Button>
                  </ButtonGroup>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* 订单详情对话框 */}
      <Dialog 
        open={detailDialogOpen} 
        onClose={handleCloseDetailDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedOrder && (
          <>
            <DialogTitle>
              订单详情 - {selectedOrder.id}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">订单信息</Typography>
                  <Typography variant="body1">订单号: {selectedOrder.id}</Typography>
                  <Typography variant="body1">用户ID: {selectedOrder.user_id}</Typography>
                  <Typography variant="body1">
                    状态: 
                    <Chip 
                      size="small" 
                      label={selectedOrder.status} 
                      color={getStatusColor(selectedOrder.status) as any}
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                  <Typography variant="body1">下单时间: {formatDate(selectedOrder.created_at)}</Typography>
                  <Typography variant="body1">更新时间: {formatDate(selectedOrder.updated_at)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">订单金额</Typography>
                  <Typography variant="h6">¥{selectedOrder.total.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>商品列表</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>商品ID</TableCell>
                          <TableCell>单价</TableCell>
                          <TableCell>数量</TableCell>
                          <TableCell align="right">小计</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedOrder.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.product_id}</TableCell>
                            <TableCell>¥{item.price.toFixed(2)}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell align="right">¥{(item.price * item.quantity).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button id="close-detail-dialog" onClick={handleCloseDetailDialog}>关闭</Button>
              <Button 
                id="edit-status-button"
                color="primary" 
                variant="contained"
                onClick={() => {
                  handleCloseDetailDialog();
                  handleOpenStatusDialog(selectedOrder);
                }}
              >
                修改状态
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      
      {/* 修改状态对话框 */}
      <Dialog 
        open={statusDialogOpen} 
        onClose={handleCloseStatusDialog}
      >
        {selectedOrder && (
          <>
            <DialogTitle>
              修改订单状态
            </DialogTitle>
            <DialogContent>
              <DialogContentText sx={{ mb: 2 }}>
                请为订单 {selectedOrder.id} 选择新状态:
              </DialogContentText>
              
              {statusUpdateError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {statusUpdateError}
                </Alert>
              )}
              
              {statusUpdateSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  订单状态已成功更新!
                </Alert>
              )}
              
              <FormControl fullWidth>
                <InputLabel id="new-status-label">订单状态</InputLabel>
                <Select
                  id="new-status-select"
                  labelId="new-status-label"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                  label="订单状态"
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
              <Button id="cancel-status-update" onClick={handleCloseStatusDialog}>取消</Button>
              <Button 
                id="confirm-status-update"
                onClick={handleUpdateStatus}
                color="primary"
                disabled={statusUpdateLoading || statusUpdateSuccess || newStatus === selectedOrder.status}
              >
                {statusUpdateLoading ? '更新中...' : '更新'}
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
    </Box>
  );
};

export default AdminOrdersPage; 