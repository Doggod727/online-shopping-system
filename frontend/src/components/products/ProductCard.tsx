import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  Rating,
  Chip,
  IconButton,
  Snackbar,
  Alert,
  CardActionArea
} from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import { addToCart, fetchCart } from '../../store/slices/cartSlice';
import { Product } from '../../types/product';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const { isAuthenticated, user } = useAppSelector(state => state.auth);

  // 确保产品有库存状态，如果没有提供，则根据stock判断
  const inStock = product.in_stock !== undefined ? product.in_stock : (product.stock > 0);

  const handleAddToCart = (e: React.MouseEvent) => {
    // 阻止事件冒泡，避免点击添加购物车按钮时跳转到详情页
    e.stopPropagation();
    
    // 检查用户是否已登录
    if (!isAuthenticated) {
      setSnackbarMessage('请先登录后再添加商品到购物车');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }
    
    // 检查用户是否为管理员
    if (user && user.role.toUpperCase() === 'ADMIN') {
      setSnackbarMessage('管理员不能使用购物车功能');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }
    
    dispatch(addToCart({ 
      productId: product.id, 
      quantity: 1 
    }))
      .unwrap()
      .then(() => {
        setSnackbarMessage('商品已添加到购物车');
        setSnackbarSeverity('success');
        setOpenSnackbar(true);
        
        // 添加成功后刷新购物车数据
        dispatch(fetchCart());
      })
      .catch((error: any) => {
        setSnackbarMessage(error || '添加到购物车失败');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      });
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };
  
  const handleCardClick = () => {
    navigate(`/products/${product.id}`);
  };

  // 获取分类对应的颜色
  const getCategoryColor = (category?: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    if (!category) return "default";
    
    switch(category.toLowerCase()) {
      case '电子产品':
        return "primary";
      case '服装':
        return "secondary";
      case '家居':
        return "success";
      case '食品':
        return "warning";
      case '美妆':
        return "error";
      default:
        return "default";
    }
  };

  // 生成随机图片URL，如果产品没有提供图片URL
  const imageUrl = product.image_url || `https://source.unsplash.com/random/300x200?product=${product.id}`;

  // 判断是否显示购物车按钮（管理员不显示）
  const showCartButton = isAuthenticated && (!user || user.role.toUpperCase() !== 'ADMIN');

  return (
    <>
      <Card sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'scale(1.02)',
          boxShadow: 3
        }
      }}>
        <CardActionArea onClick={handleCardClick}>
          <CardMedia
            component="img"
            height="200"
            image={imageUrl}
            alt={product.name}
          />
          
          <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 1, display: 'flex', gap: 1 }}>
              {inStock ? (
                <Chip 
                  label="有库存" 
                  size="small" 
                  color="success" 
                  sx={{ fontSize: '0.7rem' }} 
                />
              ) : (
                <Chip 
                  label="缺货" 
                  size="small" 
                  color="error" 
                  sx={{ fontSize: '0.7rem' }} 
                />
              )}
              
              {product.category && (
                <Chip 
                  label={product.category} 
                  size="small" 
                  color={getCategoryColor(product.category)}
                  sx={{ fontSize: '0.7rem' }} 
                />
              )}
            </Box>
            
            <Typography gutterBottom variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
              {product.name}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
              {product.description && product.description.length > 100 
                ? `${product.description.substring(0, 100)}...` 
                : product.description}
            </Typography>
            
            {/* 如果有评分数据则显示 */}
            {(product.rating !== undefined) && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Rating 
                value={product.rating || 0} 
                precision={0.5} 
                size="small" 
                readOnly 
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                ({product.rating_count || 0})
              </Typography>
            </Box>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                ¥{product.price.toFixed(2)}
              </Typography>
            </Box>
          </CardContent>
        </CardActionArea>
        
        {/* 将购物车按钮移到CardActionArea外部 */}
        {showCartButton && (
          <Box sx={{ p: 2, pt: 0 }}>
            <Button
              variant="contained"
              size="small"
              fullWidth
              startIcon={<AddShoppingCartIcon />}
              onClick={handleAddToCart}
              disabled={!inStock}
            >
              加入购物车
            </Button>
          </Box>
        )}
      </Card>
      
      <Snackbar 
        open={openSnackbar} 
        autoHideDuration={3000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarSeverity} 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ProductCard;