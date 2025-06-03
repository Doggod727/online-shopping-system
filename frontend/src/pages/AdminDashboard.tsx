import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent,
  CardActions,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  ExitToApp as LogoutIcon,
  People as PeopleIcon,
  ShoppingCart as ProductsIcon,
  Receipt as OrdersIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { RootState } from '../store';
import { orderApi } from '../utils/api';
import { OrderStatus } from '../types/order';
import { UserRole } from '../types/auth';
import { authApi } from '../utils/api';

const AdminDashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState<boolean>(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  
  // 如果用户未登录或不是管理员，重定向到登录页
  useEffect(() => {
    if (!user) {
      navigate('/');
    } else if (user.role !== UserRole.ADMIN) {
      navigate('/');
      // 使用Snackbar而不是alert
      showSnackbar('只有管理员可以访问此页面', 'error');
    }
  }, [user, navigate]);

  // 获取所有订单
  useEffect(() => {
    const fetchAllOrders = async () => {
      try {
        setLoading(true);
        const response = await orderApi.getAllOrders();
        
        // 处理不同的响应格式
        if (Array.isArray(response)) {
          setOrders(response);
        } else if ('orders' in response && Array.isArray(response.orders)) {
          setOrders(response.orders);
        } else {
          setOrders([]);
        }
        
        setError(null);
      } catch (err: any) {
        console.error('获取所有订单失败:', err);
        setError(err.message || '获取订单失败');
        showSnackbar('获取订单数据失败', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    if (user && user.role === UserRole.ADMIN) {
      fetchAllOrders();
    }
  }, [user]);

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

  // 根据订单状态返回对应的Chip颜色
  const getStatusColor = (status: OrderStatus) => {
    switch(status) {
      case OrderStatus.PENDING:
        return 'default';
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
  
  // 打开状态更新对话框
  const handleOpenStatusDialog = (order: any) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setStatusDialogOpen(true);
  };
  
  // 关闭状态更新对话框
  const handleCloseStatusDialog = () => {
    setStatusDialogOpen(false);
    setSelectedOrder(null);
  };
  
  // 更新订单状态
  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;
    
    try {
      console.log(`尝试更新订单 ${selectedOrder.id} 状态从 ${selectedOrder.status} 到 ${newStatus}`);
      
      // 确保用户有管理员权限
      if (user?.role !== UserRole.ADMIN) {
        console.error('非管理员用户尝试更新订单状态');
        showSnackbar('只有管理员可以更新订单状态', 'error');
        return;
      }
      
      const response = await orderApi.updateOrderStatus(selectedOrder.id, newStatus);
      console.log('订单状态更新成功:', response);
      
      // 更新本地状态
      setOrders(orders.map(order => 
        order.id === selectedOrder.id 
          ? { ...order, status: newStatus } 
          : order
      ));
      
      handleCloseStatusDialog();
      showSnackbar('订单状态更新成功', 'success');
    } catch (err: any) {
      console.error('更新订单状态失败:', err);
      console.error('错误详情:', err.response?.data);
      showSnackbar(`更新订单状态失败: ${err.response?.data?.message || err.message || '未知错误'}`, 'error');
    }
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
            管理员控制台
          </Typography>
          <Button 
            color="inherit" 
            startIcon={<OrdersIcon />}
            sx={{ mr: 2 }}
            onClick={() => navigate('/admin/orders')}
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
      
      <Container sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                系统概览
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        用户总数
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PeopleIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="h3">125</Typography>
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button size="small" startIcon={<PeopleIcon />}>
                        用户管理
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        产品总数
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ProductsIcon sx={{ mr: 1, color: 'secondary.main' }} />
                        <Typography variant="h3">438</Typography>
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button size="small" startIcon={<ProductsIcon />}>
                        产品管理
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        订单总数
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <OrdersIcon sx={{ mr: 1, color: 'info.main' }} />
                        <Typography variant="h3">{loading ? <CircularProgress size={30} /> : orders.length}</Typography>
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        variant="contained" 
                        color="primary"
                        startIcon={<OrdersIcon />}
                        onClick={() => navigate('/admin/orders')}
                      >
                        订单管理
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          {/* 最近订单 */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                最近订单
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error">{error}</Alert>
              ) : orders.length === 0 ? (
                <Typography variant="body1" color="textSecondary" sx={{ p: 2 }}>
                  暂无订单数据
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>订单ID</TableCell>
                        <TableCell>用户ID</TableCell>
                        <TableCell>总金额</TableCell>
                        <TableCell>状态</TableCell>
                        <TableCell>创建时间</TableCell>
                        <TableCell>操作</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orders.slice(0, 5).map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>{order.id}</TableCell>
                          <TableCell>{order.user_id}</TableCell>
                          <TableCell>¥{order.total.toFixed(2)}</TableCell>
                          <TableCell>
                            <Chip 
                              label={order.status} 
                              color={getStatusColor(order.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{formatDate(order.created_at)}</TableCell>
                          <TableCell>
                            <Button 
                              size="small" 
                              variant="outlined"
                              onClick={() => handleOpenStatusDialog(order)}
                            >
                              更新状态
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {orders.length > 5 && (
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                      <Button 
                        variant="text" 
                        onClick={() => navigate('/admin/orders')}
                      >
                        查看全部 {orders.length} 个订单
                      </Button>
                    </Box>
                  )}
                </TableContainer>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
      
      {/* 订单状态更新对话框 */}
      <Dialog open={statusDialogOpen} onClose={handleCloseStatusDialog}>
        <DialogTitle>更新订单状态</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }} id="admin-status-form-control">
            <InputLabel id="status-select-label">状态</InputLabel>
            <Select
              id="admin-status-select"
              name="admin-status-select"
              labelId="status-select-label"
              value={newStatus}
              label="状态"
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <MenuItem value={OrderStatus.PENDING}>待处理</MenuItem>
              <MenuItem value={OrderStatus.PROCESSING}>处理中</MenuItem>
              <MenuItem value={OrderStatus.SHIPPED}>已发货</MenuItem>
              <MenuItem value={OrderStatus.DELIVERED}>已送达</MenuItem>
              <MenuItem value={OrderStatus.CANCELLED}>已取消</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button id="admin-cancel-button" onClick={handleCloseStatusDialog}>取消</Button>
          <Button id="admin-update-button" onClick={handleUpdateStatus} variant="contained" color="primary">
            更新
          </Button>
        </DialogActions>
      </Dialog>
      
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

export default AdminDashboard; 