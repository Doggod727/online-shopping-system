import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  CircularProgress,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Chip,
  Divider,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { RootState } from '../../store';
import { productApi } from '../../utils/api';
import { Product } from '../../types/product';
import { UserRole } from '../../types/auth';

const AdminProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  // 确保用户是管理员
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (String(user.role).toLowerCase() !== 'admin') {
      navigate('/');
      alert('只有管理员可以访问此页面');
    }
  }, [user, navigate]);
  
  // 获取产品数据
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('开始获取所有产品');
      const response = await productApi.getAllProductsWithPagination();
      
      // 正确处理ProductsResponse类型
      let productsArray: Product[] = [];
      if ('products' in response && Array.isArray(response.products)) {
        productsArray = response.products;
      } else if (Array.isArray(response)) {
        productsArray = response;
      }
      
      console.log(`获取到 ${productsArray.length} 个产品`, productsArray);
      setProducts(productsArray);
      setFilteredProducts(productsArray);
    } catch (err: any) {
      console.error('获取产品失败:', err);
      setError(err.message || '获取产品失败');
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // 初始加载产品
  useEffect(() => {
    if (user && String(user.role).toLowerCase() === 'admin') {
      fetchProducts();
    }
  }, [user]);
  
  // 应用筛选器
  useEffect(() => {
    if (!products.length) return;
    
    let result = [...products];
    
    // 按类别筛选
    if (categoryFilter !== 'all') {
      result = result.filter(product => 
        product.category?.toLowerCase() === categoryFilter.toLowerCase()
      );
    }
    
    // 按搜索词筛选
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(product => 
        product.name.toLowerCase().includes(query) || 
        product.description.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query) || false
      );
    }
    
    setFilteredProducts(result);
  }, [products, categoryFilter, searchQuery]);
  
  // 刷新产品列表
  const handleRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };
  
  // 获取所有产品类别
  const getCategories = () => {
    const categories = new Set<string>();
    
    // 确保products是数组
    if (!Array.isArray(products)) {
      console.error('products不是数组:', products);
      return [];
    }
    
    products.forEach(product => {
      if (product.category) {
        categories.add(product.category);
      }
    });
    return Array.from(categories);
  };
  
  // 如果正在加载，显示加载指示器
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }
  
  const categories = getCategories();
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        商品管理
      </Typography>
      
      {/* 统计卡片 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">总商品数</Typography>
              <Typography variant="h4">{products.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">类别数</Typography>
              <Typography variant="h4">{categories.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* 筛选工具栏 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              placeholder="搜索商品名称、描述或类别"
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
              <InputLabel>商品类别</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="商品类别"
              >
                <MenuItem value="all">全部类别</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>{category}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
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
      
      {/* 商品列表 */}
      {filteredProducts.length === 0 ? (
        <Alert severity="info">
          {searchQuery || categoryFilter !== 'all' 
            ? '没有符合筛选条件的商品，请尝试其他筛选条件' 
            : '系统中还没有任何商品'}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredProducts.map((product) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="140"
                  image={product.image_url || 'https://via.placeholder.com/300x200?text=No+Image'}
                  alt={product.name}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h6" component="div">
                    {product.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {product.description.length > 100 
                      ? `${product.description.substring(0, 100)}...` 
                      : product.description}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" color="primary">
                      ¥{product.price.toFixed(2)}
                    </Typography>
                    <Chip label={product.category || '未分类'} size="small" />
                  </Box>
                  <Typography variant="body2">
                    库存: {product.stock}
                  </Typography>
                  <Typography variant="body2">
                    供应商: {product.vendor_id}
                  </Typography>
                </CardContent>
                <Divider />
                <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between' }}>
                  <Button 
                    size="small" 
                    startIcon={<EditIcon />}
                    onClick={() => alert(`编辑商品 ${product.id} 功能尚未实现`)}
                  >
                    编辑
                  </Button>
                  <Button 
                    size="small" 
                    color="error" 
                    startIcon={<DeleteIcon />}
                    onClick={() => alert(`删除商品 ${product.id} 功能尚未实现`)}
                  >
                    删除
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default AdminProductsPage; 