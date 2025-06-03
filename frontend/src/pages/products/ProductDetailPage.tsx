import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Button,
  Box,
  Paper,
  Divider,
  Rating,
  Chip,
  TextField,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
  Snackbar,
  IconButton
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { RootState } from '../../store';
// @ts-ignore
import { fetchProductById } from '../../store/slices/productSlice';
import { addToCart } from '../../store/slices/cartSlice';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { favoriteApi } from '../../utils/api';
import { UserRole } from '../../types/auth';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  
  // 打印路径和参数信息，帮助调试
  console.log('ProductDetailPage: 当前路径 =', location.pathname);
  console.log('ProductDetailPage: 参数id =', id);
  console.log('ProductDetailPage: 参数类型 =', typeof id);
  
  const { selectedProduct, isLoading, error } = useAppSelector(
    (state: RootState) => state.products
  );
  
  const { user } = useAppSelector((state: RootState) => state.auth);
  const isCustomer = user?.role.toLowerCase() === 'customer';
  
  const [quantity, setQuantity] = useState(1);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [favoriteLoading, setFavoriteLoading] = useState<boolean>(false);
  
  useEffect(() => {
    if (id) {
      console.log('正在获取商品详情:', id);
      dispatch(fetchProductById(id));
    }
  }, [dispatch, id]);
  
  useEffect(() => {
    if (isCustomer && id) {
      checkFavoriteStatus(id);
    }
  }, [isCustomer, id]);
  
  // 检查商品是否已收藏
  const checkFavoriteStatus = async (productId: string) => {
    try {
      const isFav = await favoriteApi.isProductFavorited(productId);
      setIsFavorite(isFav);
    } catch (err) {
      console.error('检查收藏状态失败:', err);
    }
  };
  
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (isNaN(value) || value < 1) {
      setQuantity(1);
    } else if (selectedProduct && value > selectedProduct.stock) {
      setQuantity(selectedProduct.stock);
    } else {
      setQuantity(value);
    }
  };
  
  const handleAddToCart = () => {
    if (selectedProduct) {
      dispatch(addToCart({
        productId: selectedProduct.id,
        quantity
      }))
        .unwrap()
        .then(() => {
          setSnackbarMessage('商品已添加到购物车');
          setSnackbarSeverity('success');
          setOpenSnackbar(true);
        })
        .catch((error: any) => {
          setSnackbarMessage(error || '添加到购物车失败');
          setSnackbarSeverity('error');
          setOpenSnackbar(true);
        });
    }
  };
  
  const handleToggleFavorite = async () => {
    if (!selectedProduct || !isCustomer) return;
    
    try {
      setFavoriteLoading(true);
      
      if (isFavorite) {
        await favoriteApi.removeFromFavorites(selectedProduct.id);
        setIsFavorite(false);
        setSnackbarMessage('商品已从收藏夹移除');
      } else {
        await favoriteApi.addToFavorites(selectedProduct.id);
        setIsFavorite(true);
        setSnackbarMessage('商品已添加到收藏夹');
      }
      
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
    } catch (err: any) {
      console.error('操作收藏失败:', err);
      
      // 提取更具体的错误信息
      let errorMessage = '操作收藏失败';
      
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    } finally {
      setFavoriteLoading(false);
    }
  };
  
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };
  
  const handleGoBack = () => {
    // 根据用户角色决定返回路径
    const path = location.pathname;
    if (path.includes('/customer/products/')) {
      navigate('/customer/products');
    } else {
      navigate('/products');
    }
  };
  
  if (isLoading) {
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
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleGoBack}
          sx={{ mt: 2 }}
        >
          返回
        </Button>
      </Container>
    );
  }
  
  if (!selectedProduct) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning">未找到产品信息</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleGoBack}
          sx={{ mt: 2 }}
        >
          返回
        </Button>
      </Container>
    );
  }
  
  // 打印商品详情，帮助调试
  console.log('渲染商品详情:', selectedProduct);
  
  // 根据用户角色确定返回路径
  const getProductsPath = () => {
    if (isCustomer) {
      return '/customer/products';
    }
    return '/products';
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* 面包屑导航 */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link color="inherit" onClick={() => navigate('/')}>
          首页
        </Link>
        <Link color="inherit" onClick={() => navigate(getProductsPath())}>
          商品列表
        </Link>
        <Typography color="text.primary">{selectedProduct.name}</Typography>
      </Breadcrumbs>
      
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleGoBack}
        sx={{ mb: 2 }}
      >
        返回
      </Button>
      
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={4}>
          {/* 产品图片 */}
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                height: 400,
                width: '100%',
                bgcolor: 'grey.100',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2
              }}
            >
              <img
                src={`https://source.unsplash.com/random/600x400?product=${selectedProduct.id}`}
                alt={selectedProduct.name}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            </Box>
          </Grid>
          
          {/* 产品信息 */}
          <Grid item xs={12} md={6}>
            <Box>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {selectedProduct.in_stock ? (
                  <Chip label="有库存" color="success" />
                ) : (
                  <Chip label="缺货" color="error" />
                )}
                
                {/* 收藏按钮 - 仅对普通用户显示 */}
                {isCustomer && (
                  <IconButton 
                    color="secondary" 
                    onClick={handleToggleFavorite}
                    disabled={favoriteLoading}
                    title={isFavorite ? '取消收藏' : '收藏商品'}
                  >
                    {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                  </IconButton>
                )}
              </Box>
              
              <Typography variant="h4" component="h1" gutterBottom>
                {selectedProduct.name}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Rating
                  value={selectedProduct.rating || 0}
                  precision={0.5}
                  readOnly
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  ({selectedProduct.rating_count || 0} 评价)
                </Typography>
              </Box>
              
              <Typography variant="h5" color="primary" sx={{ mb: 2 }}>
                ¥{selectedProduct.price.toFixed(2)}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="body1" paragraph>
                {selectedProduct.description || '暂无描述'}
              </Typography>
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  库存: {selectedProduct.stock}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  <TextField
                    label="数量"
                    type="number"
                    value={quantity}
                    onChange={handleQuantityChange}
                    InputProps={{ inputProps: { min: 1, max: selectedProduct.stock } }}
                    sx={{ width: 100, mr: 2 }}
                    size="small"
                  />
                  
                  <Button
                    variant="contained"
                    startIcon={<ShoppingCartIcon />}
                    onClick={handleAddToCart}
                    disabled={!selectedProduct.in_stock}
                    size="large"
                  >
                    加入购物车
                  </Button>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
        
        {/* 产品详情 */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            产品详情
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body1">
            {selectedProduct.description || '暂无描述'}
          </Typography>
        </Box>
      </Paper>
      
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ProductDetailPage; 