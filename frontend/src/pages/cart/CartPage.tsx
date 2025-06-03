import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  IconButton,
  Divider,
  TextField,
  Card,
  CardMedia,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Snackbar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useTheme,
  alpha,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingCart as CartIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { orderApi, cartApi } from '../../utils/api';
import { fetchCart, updateCartItemAsync, removeFromCartAsync, clearCart } from '../../store/slices/cartSlice';
import { AppDispatch } from '../../store';

// 处理购物车操作
const CartPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { items, isLoading } = useSelector((state: RootState) => state.cart);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<string | null>(null);
  
  // 首次加载时获取购物车数据
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart());
    }
  }, [isAuthenticated, dispatch]);
  
  // 计算购物车总价
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // 处理数量变更
  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    if (newQuantity > 99) newQuantity = 99;
    
    // 从items中找到对应的商品
    const cartItem = items.find(item => item.id === id);
    if (!cartItem) {
      setErrorMessage('找不到购物车商品，正在重新获取购物车数据...');
      dispatch(fetchCart())
        .then(() => {
          setSuccessMessage('购物车数据已更新');
        })
        .catch(() => {
          setErrorMessage('获取购物车数据失败');
        });
      return;
    }
    
    // 使用购物车项目ID作为API调用的参数，而不是productId
    dispatch(updateCartItemAsync({ id, productId: id, quantity: newQuantity }))
      .unwrap()
      .then(() => {
        // 成功更新
        setSuccessMessage('购物车商品数量已更新');
      })
      .catch((error) => {
        // 更新失败
        console.error('更新购物车数量失败:', error);
        
        // 如果更新失败，尝试重新获取购物车数据
        if (error === '商品不在购物车中') {
          dispatch(fetchCart()).catch(() => {});
        }
        
        setErrorMessage(typeof error === 'string' ? error : '更新购物车数量失败，请重试');
      });
  };
  
  // 处理移除商品
  const handleRemoveItem = (id: string) => {
    setItemToRemove(id);
    setOpenDialog(true);
  };
  
  // 确认移除商品
  const confirmRemove = () => {
    if (itemToRemove) {
      // 从items中找到对应的商品
      const cartItem = items.find(item => item.id === itemToRemove);
      if (!cartItem) {
        setErrorMessage('找不到购物车商品，正在重新获取购物车数据...');
        dispatch(fetchCart())
          .then(() => {
            setSuccessMessage('购物车数据已更新');
          })
          .catch(() => {
            setErrorMessage('获取购物车数据失败');
          });
        setOpenDialog(false);
        setItemToRemove(null);
        return;
      }
      
      // 使用购物车项目ID作为API调用的参数，而不是productId
      dispatch(removeFromCartAsync({ id: itemToRemove, productId: itemToRemove }))
        .unwrap()
        .then(() => {
          setSuccessMessage('商品已从购物车中移除');
        })
        .catch((error) => {
          console.error('移除商品失败:', error);
          
          // 如果移除失败，尝试重新获取购物车数据
          if (error === '商品不在购物车中') {
            dispatch(fetchCart()).catch(() => {});
          }
          
          setErrorMessage(typeof error === 'string' ? error : '移除商品失败，请重试');
        });
    }
    setOpenDialog(false);
    setItemToRemove(null);
  };
  
  // 处理结算
  const handleCheckout = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/cart' } });
      return;
    }
    
    if (items.length === 0) {
      setErrorMessage('购物车为空，无法结算');
      return;
    }
    
    setCheckoutLoading(true);
    
    try {
      // 显示结算中状态
      setSuccessMessage('正在处理您的订单...');
      
      // 调用结算API
      await orderApi.checkout();
      
      // 更新成功消息
      setSuccessMessage('订单创建成功！即将跳转到订单页面...');
      
      // 清空购物车
      dispatch(clearCart());
      
      // 延迟跳转到订单页面
      setTimeout(() => {
        navigate('/customer/orders');
      }, 2000);
    } catch (error: any) {
      console.error('结算失败:', error);
      
      // 显示更详细的错误信息
      if (error.response && error.response.data && error.response.data.message) {
        // 处理服务器返回的具体错误信息
        const errorMsg = error.response.data.message;
        
        // 检查是否是库存不足的错误
        if (errorMsg.includes('库存不足') || errorMsg.includes('unavailable_products')) {
          setErrorMessage('部分商品库存不足，请调整购物车');
        } else if (errorMsg.includes('购物车为空')) {
          setErrorMessage('购物车为空，请添加商品后再结算');
        } else {
          setErrorMessage(errorMsg);
        }
      } else if (error.response && error.response.status === 400) {
        setErrorMessage('结算失败：请检查购物车商品是否有效或库存是否充足');
      } else if (error.message) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('结算失败，请稍后重试');
      }
    } finally {
      setCheckoutLoading(false);
    }
  };
  
  return (
    <Box>
      <Typography variant="h5" component="h1" fontWeight="bold" gutterBottom>
        购物车
      </Typography>
      
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/products')}
        sx={{ mb: 3 }}
      >
        继续购物
      </Button>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : items.length === 0 ? (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          <CartIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            您的购物车是空的
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            浏览我们的商品并添加到购物车
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/products')}
          >
            浏览商品
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <TableContainer 
              component={Paper} 
              elevation={0}
              sx={{ 
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`
              }}
            >
              <Table>
                <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                  <TableRow>
                    <TableCell>商品</TableCell>
                    <TableCell align="center">单价</TableCell>
                    <TableCell align="center">数量</TableCell>
                    <TableCell align="center">小计</TableCell>
                    <TableCell align="center">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Card 
                            elevation={0}
                            sx={{ 
                              width: 80, 
                              height: 80, 
                              mr: 2,
                              borderRadius: 1,
                              overflow: 'hidden',
                              border: `1px solid ${theme.palette.divider}`
                            }}
                          >
                            <CardMedia
                              component="img"
                              height="80"
                              image={item.image_url || 'https://via.placeholder.com/80?text=No+Image'}
                              alt={item.name}
                              sx={{ objectFit: 'cover' }}
                            />
                          </Card>
                          <Typography 
                            variant="body1"
                            sx={{ 
                              fontWeight: 500,
                              cursor: 'pointer',
                              '&:hover': { color: theme.palette.primary.main }
                            }}
                            onClick={() => navigate(`/products/${item.productId}`)}
                          >
                            {item.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body1" fontWeight={500}>
                          ¥{item.price.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IconButton 
                            size="small"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          <TextField
                            size="small"
                            value={item.quantity}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              if (!isNaN(value)) {
                                handleQuantityChange(item.id, value);
                              }
                            }}
                            inputProps={{ 
                              min: 1, 
                              max: 99,
                              style: { textAlign: 'center', width: '40px' }
                            }}
                            variant="outlined"
                            sx={{ mx: 1 }}
                          />
                          <IconButton 
                            size="small"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            disabled={item.quantity >= 99}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body1" fontWeight={600} color="primary">
                          ¥{(item.price * item.quantity).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton 
                          color="error"
                          size="small"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`
              }}
            >
              <Typography variant="h6" gutterBottom>
                订单摘要
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">
                  商品数量
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {items.reduce((sum, item) => sum + item.quantity, 0)}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="body1">
                  商品总价
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  ¥{totalPrice.toFixed(2)}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6">
                  应付总额
                </Typography>
                <Typography variant="h6" color="primary" fontWeight={600}>
                  ¥{totalPrice.toFixed(2)}
                </Typography>
              </Box>
              
              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                startIcon={<CartIcon />}
                onClick={handleCheckout}
                disabled={items.length === 0 || checkoutLoading}
                sx={{ py: 1.5 }}
              >
                {checkoutLoading ? '处理中...' : '结算'}
              </Button>
              
              {!isAuthenticated && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  请先登录后再结算
                </Alert>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
      
      {/* 成功提示 */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage('')}
      >
        <Alert 
          onClose={() => setSuccessMessage('')} 
          severity="success" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
      
      {/* 错误提示 */}
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={3000}
        onClose={() => setErrorMessage('')}
      >
        <Alert 
          onClose={() => setErrorMessage('')} 
          severity="error" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
      
      {/* 确认删除对话框 */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
      >
        <DialogTitle>
          确认移除商品
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            您确定要将此商品从购物车中移除吗？
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            取消
          </Button>
          <Button onClick={confirmRemove} color="error" autoFocus>
            移除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CartPage;