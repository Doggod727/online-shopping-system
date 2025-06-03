import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Grid, 
  Typography, 
  Card, 
  CardMedia, 
  CardContent, 
  CardActions, 
  Button, 
  Rating, 
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Pagination,
  Skeleton,
  useTheme,
  alpha,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Search as SearchIcon, 
  FilterList as FilterIcon,
  ShoppingCart as CartIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { productApi, favoriteApi, FavoritesResponse } from '../../utils/api';
import { Product } from '../../types/product';
import { addToCart } from '../../store/slices/cartSlice';
import { useAppDispatch } from '../../hooks/redux';
import { UserRole } from '../../types/auth';

// 定义收藏夹接口
interface FavoriteItem {
  id: string;
  product_id: string;
  user_id: string;
  created_at: string;
}

const ProductsPage: React.FC = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [category, setCategory] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  
  // 获取用户信息，用于决定导航路径
  const { user } = useSelector((state: RootState) => state.auth);
  const userRole = user?.role?.toLowerCase();
  
  const itemsPerPage = 12;
  
  // 从URL获取搜索查询
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const q = queryParams.get('q');
    if (q) {
      setSearchQuery(q);
    }
  }, [location.search]);
  
  // 获取所有商品
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // 从API获取数据
        const response = await productApi.getAllProductsWithPagination();
        console.log(`从API获取到商品数据: ${response.products.length} / ${response.total}`);
        setProducts(response.products);
        setTotalProducts(response.total);
      } catch (error) {
        console.error('获取商品失败:', error);
        // 不使用模拟数据，显示错误状态
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);
  
  // 获取收藏状态
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await favoriteApi.getUserFavorites();
        if (response?.favorites?.length > 0) {
          const favoriteIds = response.favorites.map(fav => fav.product_id);
          setFavorites(favoriteIds);
        }
      } catch (error) {
        console.error('获取收藏列表失败:', error);
        // 出错时不显示任何收藏
        setFavorites([]);
      }
    };
    
    // 只有登录用户才获取收藏列表
    const token = sessionStorage.getItem('token');
    if (token) {
      fetchFavorites();
    }
  }, []);
  
  // 处理搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/products/search?q=${encodeURIComponent(searchQuery)}`);
  };
  
  // 处理排序
  const handleSortChange = (event: SelectChangeEvent) => {
    setSortBy(event.target.value);
  };
  
  // 处理分类筛选
  const handleCategoryChange = (event: SelectChangeEvent) => {
    setCategory(event.target.value);
    setPage(1); // 重置页码
  };
  
  // 处理分页
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // 添加到购物车
  const handleAddToCart = (product: Product) => {
    dispatch(addToCart({
      productId: product.id,
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
  
  // 切换收藏状态
  const toggleFavorite = async (productId: string) => {
    try {
      if (favorites.includes(productId)) {
        await favoriteApi.removeFromFavorites(productId);
        setFavorites(favorites.filter(id => id !== productId));
        setSnackbarMessage('商品已从收藏夹移除');
      } else {
        await favoriteApi.addToFavorites(productId);
        setFavorites([...favorites, productId]);
        setSnackbarMessage('商品已添加到收藏夹');
      }
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error: any) {
      console.error('操作收藏失败:', error);
      setSnackbarMessage(error.message || '操作收藏失败');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };
  
  // 获取唯一的商品分类
  const categories = ['all', ...Array.from(new Set(products.map(product => product.category)))];
  
  // 筛选和排序商品
  let filteredProducts = [...products];
  
  // 应用搜索筛选
  if (searchQuery) {
    filteredProducts = filteredProducts.filter(product => 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  
  // 应用分类筛选
  if (category !== 'all') {
    filteredProducts = filteredProducts.filter(product => product.category === category);
  }
  
  // 应用排序
  switch (sortBy) {
    case 'price_asc':
      filteredProducts.sort((a, b) => a.price - b.price);
      break;
    case 'price_desc':
      filteredProducts.sort((a, b) => b.price - a.price);
      break;
    case 'rating':
      filteredProducts.sort((a, b) => Number(b.rating) - Number(a.rating));
      break;
    case 'newest':
    default:
      filteredProducts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      break;
  }
  
  // 分页
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const displayedProducts = filteredProducts.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  
  return (
    <Box>
      {/* 顶部搜索和筛选栏 */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          mb: 3, 
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box component="form" onSubmit={handleSearch}>
              <TextField
                fullWidth
                placeholder="搜索商品..."
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
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton type="submit" edge="end">
                        <FilterIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="category-select-label">分类</InputLabel>
              <Select
                labelId="category-select-label"
                id="category-select"
                value={category}
                label="分类"
                onChange={handleCategoryChange}
              >
                <MenuItem value="all">全部分类</MenuItem>
                {categories.filter(cat => cat !== 'all').map((cat) => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="sort-select-label">排序方式</InputLabel>
              <Select
                labelId="sort-select-label"
                id="sort-select"
                value={sortBy}
                label="排序方式"
                onChange={handleSortChange}
              >
                <MenuItem value="newest">最新上架</MenuItem>
                <MenuItem value="price_asc">价格从低到高</MenuItem>
                <MenuItem value="price_desc">价格从高到低</MenuItem>
                <MenuItem value="rating">评分最高</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>
      
      {/* 商品列表 */}
      {loading ? (
        <Grid container spacing={3}>
          {Array.from(new Array(8)).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Skeleton variant="rectangular" height={200} />
                <CardContent>
                  <Skeleton variant="text" height={28} />
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" />
                </CardContent>
                <CardActions>
                  <Skeleton variant="rectangular" width={120} height={36} />
                  <Skeleton variant="circular" width={36} height={36} />
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <>
          {filteredProducts.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 5 }}>
              <Typography variant="h6" color="text.secondary">
                没有找到匹配的商品
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                请尝试其他搜索关键词或浏览全部商品
              </Typography>
              <Button 
                variant="outlined" 
                sx={{ mt: 2 }}
                onClick={() => {
                  setSearchQuery('');
                  setCategory('all');
                  navigate('/products');
                }}
              >
                查看全部商品
              </Button>
            </Box>
          ) : (
            <>
              <Grid container spacing={3} sx={{ mt: 0 }}>
                {/* 商品列表标题和结果统计 */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" component="h1">
                      商品列表
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {`显示 ${displayedProducts.length} / ${filteredProducts.length} 个商品（总共 ${totalProducts} 个）`}
                    </Typography>
                  </Box>
                </Grid>
                
                {/* 商品卡片 */}
                {displayedProducts.map((product) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                    <Card 
                      sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        }
                      }}
                    >
                      <CardMedia
                        component="img"
                        height="200"
                        image={product.image_url}
                        alt={product.name}
                        sx={{ objectFit: 'cover' }}
                        onClick={() => {
                          // 根据用户角色决定导航路径
                          if (userRole === 'customer') {
                            navigate(`/customer/products/${product.id}`);
                          } else {
                            navigate(`/products/${product.id}`);
                          }
                        }}
                      />
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography 
                          gutterBottom 
                          variant="h6" 
                          component="div" 
                          sx={{ 
                            fontWeight: 600,
                            fontSize: '1rem',
                            cursor: 'pointer',
                            '&:hover': { color: theme.palette.primary.main }
                          }}
                          onClick={() => {
                            // 根据用户角色决定导航路径
                            if (userRole === 'customer') {
                              navigate(`/customer/products/${product.id}`);
                            } else {
                              navigate(`/products/${product.id}`);
                            }
                          }}
                        >
                          {product.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Rating 
                            value={Number(product.rating)} 
                            precision={0.5} 
                            size="small" 
                            readOnly 
                          />
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                            ({product.rating})
                          </Typography>
                        </Box>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            mb: 1
                          }}
                        >
                          {product.description}
                        </Typography>
                        <Chip 
                          label={product.category} 
                          size="small" 
                          sx={{ 
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                            fontWeight: 500
                          }} 
                        />
                      </CardContent>
                      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                        <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                          ¥{product.price.toFixed(2)}
                        </Typography>
                        <Box>
                          <IconButton 
                            size="small" 
                            color={favorites.includes(product.id) ? 'secondary' : 'default'}
                            onClick={() => toggleFavorite(product.id)}
                            sx={{ mr: 1 }}
                          >
                            {favorites.includes(product.id) ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                          </IconButton>
                          <Button 
                            variant="contained" 
                            size="small" 
                            startIcon={<CartIcon />}
                            onClick={() => handleAddToCart(product)}
                          >
                            加入购物车
                          </Button>
                        </Box>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              
              {/* 分页 */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination 
                    count={totalPages} 
                    page={page} 
                    onChange={handlePageChange} 
                    color="primary"
                    size="large"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
            </>
          )}
        </>
      )}
      
      {/* 提示消息 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductsPage;