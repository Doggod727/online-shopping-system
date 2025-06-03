import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Chip,
  Button,
  Divider,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Stack
} from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  LocalShipping as ShippingIcon,
  Receipt as ReceiptIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { orderApi, Order, OrderResponse } from '../utils/api';
import { OrderStatus } from '../types/order';

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  
  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!id) {
        setError('订单ID不存在');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        console.log(`获取订单详情，ID: ${id}`);
        
        const response = await orderApi.getOrderById(id);
        console.log('订单详情响应:', response);
        
        // 检查响应格式并正确处理
        if ('id' in response && 'status' in response) {
          // 如果response本身就是订单对象
          setOrder(response);
        } else if ('order' in response && response.order) {
          // 如果response中包含order属性
          setOrder(response.order);
        } else {
          setError('订单数据格式不正确');
        }
      } catch (err: any) {
        console.error('获取订单详情失败:', err);
        setError(err.response?.data?.message || '获取订单详情失败');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetail();
  }, [id]);
  
  // 获取状态芯片颜色
  const getStatusColor = (status: OrderStatus): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch(status) {
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
  
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ my: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ my: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          variant="outlined"
          onClick={() => navigate('/customer/orders')}
        >
          返回订单列表
        </Button>
      </Container>
    );
  }
  
  if (!order) {
    return (
      <Container maxWidth="lg" sx={{ my: 4 }}>
        <Alert severity="warning">
          没有找到订单信息
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          variant="outlined"
          onClick={() => navigate('/customer/orders')}
          sx={{ mt: 2 }}
        >
          返回订单列表
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        variant="outlined"
        onClick={() => navigate('/customer/orders')}
        sx={{ mb: 3 }}
      >
        返回订单列表
      </Button>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">
            订单详情
          </Typography>
          <Chip 
            label={order.status} 
            color={getStatusColor(order.status)}
            size="medium"
          />
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              <strong>订单编号:</strong> {order.id}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>订单状态:</strong> {order.status}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>订单总额:</strong> ¥{order.total.toFixed(2)}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <AccessTimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body1">
                <strong>下单时间:</strong> {formatDate(order.created_at)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <AccessTimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body1">
                <strong>更新时间:</strong> {formatDate(order.updated_at)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            商品清单
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>商品ID</TableCell>
                  <TableCell>数量</TableCell>
                  <TableCell>单价</TableCell>
                  <TableCell align="right">小计</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {order.items.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.product_id}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>¥{item.price.toFixed(2)}</TableCell>
                    <TableCell align="right">¥{(item.price * item.quantity).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} align="right">
                    <Typography variant="subtitle1">总计:</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle1">¥{order.total.toFixed(2)}</Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
      
      <Stack direction="row" spacing={2} justifyContent="center">
        {order.status === OrderStatus.PENDING && (
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate(`/payment/${order.id}`)}
          >
            立即付款
          </Button>
        )}
        
        {order.status === OrderStatus.SHIPPED && (
          <Button 
            variant="contained" 
            color="success"
            onClick={() => {
              // 此处应该实现确认收货逻辑
              alert('确认收货功能待实现');
            }}
          >
            确认收货
          </Button>
        )}
        
        {order.status === OrderStatus.PENDING && (
          <Button 
            variant="outlined" 
            color="error"
            onClick={() => {
              // 此处应该实现取消订单逻辑
              alert('取消订单功能待实现');
            }}
          >
            取消订单
          </Button>
        )}
      </Stack>
    </Container>
  );
};

export default OrderDetailPage; 