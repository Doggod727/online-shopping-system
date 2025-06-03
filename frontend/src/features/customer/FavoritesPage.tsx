import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  CardActions, 
  Button, 
  IconButton,
  CircularProgress,
  Alert,
  Snackbar,
  useTheme,
  alpha
} from '@mui/material';
import {
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon,
  Favorite as FavoriteIcon,
  NavigateNext as NavigateNextIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { favoriteApi } from '../../utils/api';
import { Favorite } from '../../types/favorite';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../store/slices/cartSlice';
import { AppDispatch } from '../../store';

const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme();
  
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // 提示消息状态
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  
  // 获取收藏列表
  const fetchFavorites = async () => {
    try {
      setLoading(true);
      setError(null);
      
      try {
        const response = await favoriteApi.getUserFavorites();
        console.log('从API获取到收藏列表:', response);
        
        if (response && response.favorites) {
          setFavorites(response.favorites);
        } else {
          setFavorites([]);
          console.warn('API返回的数据格式不符合预期');
        }
      } catch (apiError) {
        console.error('从API获取收藏列表失败:', apiError);
        setError('获取收藏列表失败，请重试');
        setFavorites([]);
      }
    } catch (err: any) {
      console.error('获取收藏列表失败:', err);
      setError(err.message || '获取收藏列表失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 初始加载收藏列表
  useEffect(() => {
    fetchFavorites();
  }, []);
  
  // 从收藏夹移除商品
  const handleRemoveFromFavorites = async (productId: string) => {
    try {
      // 尝试从API移除
      const token = sessionStorage.getItem('token');
      if (token) {
        try {
          await favoriteApi.removeFromFavorites(productId);
          console.log('已从API移除收藏');
        } catch (apiError) {
          console.error('从API移除收藏失败:', apiError);
          throw new Error('移除收藏失败，请重试');
        }
      } else {
        throw new Error('未登录，无法移除收藏');
      }
      
      // 更新本地收藏列表
      setFavorites(prevFavorites => 
        prevFavorites.filter(fav => fav.product_id !== productId)
      );
      
      // 显示成功消息
      setSnackbarMessage('商品已从收藏夹移除');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err: any) {
      console.error('移除收藏失败:', err);
      
      // 显示错误消息
      setSnackbarMessage(err.message || '移除收藏失败');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };
  
  // 添加商品到购物车
  const handleAddToCart = (favorite: Favorite) => {
    if (!favorite.product) {
      setSnackbarMessage('商品信息不完整，无法添加到购物车');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    
    dispatch(addToCart({
      productId: favorite.product_id,
      quantity: 1
    }))
      .unwrap()
      .then(() => {
        setSnackbarMessage('商品已添加到购物车');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      })
      .catch((error: any) => {
        setSnackbarMessage(error || '添加到购物车失败');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      });
  };
  
  // 查看商品详情
  const handleViewProduct = (productId: string) => {
    navigate(`/customer/products/${productId}`);
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
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <FavoriteIcon color="secondary" sx={{ mr: 1 }} />
        我的收藏
      </Typography>
      
      {/* 错误提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* 收藏列表 */}
      {favorites.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 5 }}>
          <FavoriteIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            收藏夹为空
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            您还没有收藏任何商品
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            sx={{ mt: 2 }}
            onClick={() => navigate('/customer/products')}
          >
            去购物
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {favorites.map((favorite) => (
            <Grid item xs={12} sm={6} md={4} key={favorite.id}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }
              }}>
                {favorite.product?.category && (
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      top: 10, 
                      right: 10, 
                      bgcolor: alpha(theme.palette.primary.main, 0.9), 
                      color: 'white',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.75rem'
                    }}
                  >
                    {favorite.product.category}
                  </Box>
                )}
                
                <CardMedia
                  component="img"
                  height="200"
                  image={favorite.product?.image_url || `https://source.unsplash.com/random/300x200?product=${favorite.product_id}`}
                  alt={favorite.product?.name || '商品图片'}
                  sx={{ objectFit: 'cover', cursor: 'pointer' }}
                  onClick={() => handleViewProduct(favorite.product_id)}
                />
                
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h2" noWrap>
                    {favorite.product?.name || '未知商品'}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    mb: 1
                  }}>
                    {favorite.product?.description || '暂无描述'}
                  </Typography>
                  
                  <Typography variant="h6" color="primary">
                    ¥{favorite.product?.price.toFixed(2) || '0.00'}
                  </Typography>
                  
                  {favorite.product && favorite.product.stock <= 0 && (
                    <Typography variant="body2" color="error">
                      库存不足
                    </Typography>
                  )}
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    endIcon={<NavigateNextIcon />}
                    onClick={() => handleViewProduct(favorite.product_id)}
                  >
                    查看详情
                  </Button>
                  
                  <Box>
                    <IconButton 
                      color="primary"
                      onClick={() => handleAddToCart(favorite)}
                      disabled={!favorite.product || favorite.product.stock <= 0}
                      title="添加到购物车"
                    >
                      <ShoppingCartIcon />
                    </IconButton>
                    
                    <IconButton 
                      color="error"
                      onClick={() => handleRemoveFromFavorites(favorite.product_id)}
                      title="从收藏夹移除"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* 提示消息 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FavoritesPage; 