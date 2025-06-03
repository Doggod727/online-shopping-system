import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
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
  CircularProgress
} from '@mui/material';
import { RootState } from '../store';
import { orderApi } from '../utils/api';
import { Order, OrderStatus } from '../types/order';

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const { isAuthenticated, token, user } = useSelector((state: RootState) => state.auth);
  
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // 确保sessionStorage中有token
        const localToken = sessionStorage.getItem('token');
        
        // 检查token是否存在
        if (!localToken) {
          console.error('获取订单失败: 未找到token');
          setError('请先登录');
          return;
        }
        
        console.log('使用token获取订单:', localToken.substring(0, 20) + '...');
        
        // 检查token格式是否正确
        const parts = localToken.split('.');
        if (parts.length !== 3) {
          console.error('Token格式不正确:', localToken);
          setError('登录信息无效，请重新登录');
          return;
        }
        
        // 尝试解析token
        try {
          const payload = JSON.parse(atob(parts[1]));
          console.log('Token payload:', payload);
        } catch (e) {
          console.error('解析token失败:', e);
        }
        
        setLoading(true);
        const response = await orderApi.getUserOrders();
        console.log('获取订单成功:', response);
        
        // 正确处理响应类型
        if (Array.isArray(response)) {
          setOrders(response);
        } else if ('orders' in response && Array.isArray(response.orders)) {
          setOrders(response.orders);
        } else {
          setOrders([]);
        }
        
        setError(null);
      } catch (err: any) {
        console.error('获取订单失败:', err);
        
        // 如果是401错误，提示用户重新登录
        if (err.response && err.response.status === 401) {
          console.error('401错误详情:', err.response.data);
          setError('登录已过期或无效，请重新登录');
          // 清除token并重定向到登录页
          sessionStorage.removeItem('token');
        } else {
          setError(err.response?.data?.message || '获取订单失败');
        }
      } finally {
        setLoading(false);
      }
    };
    
    // 直接从sessionStorage获取token，不依赖Redux状态
    const localToken = sessionStorage.getItem('token');
    
    if (localToken) {
      console.log('尝试获取用户订单，使用sessionStorage中的token');
      fetchOrders();
    } else if (isAuthenticated && token) {
      // 如果Redux中有token但sessionStorage中没有，则保存到sessionStorage
      sessionStorage.setItem('token', token);
      console.log('将Redux中的token保存到sessionStorage:', token);
      fetchOrders();
    } else {
      console.log('未找到token，无法获取订单');
      setError('请先登录');
    }
  }, [isAuthenticated, token]);
  
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
        <Typography color="error" variant="h6" align="center">
          {error}
        </Typography>
      </Container>
    );
  }
  
  if (orders.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h6" align="center">
          您还没有订单记录
        </Typography>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        我的订单
      </Typography>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>订单编号</TableCell>
              <TableCell>下单日期</TableCell>
              <TableCell>总金额</TableCell>
              <TableCell>订单状态</TableCell>
              <TableCell>商品数量</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{order.id}</TableCell>
                <TableCell>{formatDate(order.created_at)}</TableCell>
                <TableCell>¥{order.total.toFixed(2)}</TableCell>
                <TableCell>
                  <Chip 
                    label={order.status} 
                    color={getStatusColor(order.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>{order.items.length}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default OrdersPage;