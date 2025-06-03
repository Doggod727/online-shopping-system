import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Button, 
  Grid, 
  Box, 
  CircularProgress,
  Alert,
  Snackbar,
  Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { productApi } from '../../utils/api';
import { Product, CreateProductDto, UpdateProductDto } from '../../types/product';
import VendorProductCard from '../../components/products/VendorProductCard';
import ProductForm from '../../components/products/ProductForm';const VendorProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // 加载供应商产品
  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productApi.getVendorProducts();
      setProducts(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || '加载产品失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // 处理添加按钮点击
  const handleAddClick = () => {
    setSelectedProduct(undefined);
    setOpenForm(true);
  };

  // 处理编辑按钮点击
  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setOpenForm(true);
  };

  // 处理删除按钮点击
  const handleDeleteClick = async (product: Product) => {
    try {
      await productApi.deleteProduct(product.id);
      // 更新产品列表
      setProducts(products.filter(p => p.id !== product.id));
      // 显示成功消息
      setSnackbar({ 
        open: true, 
        message: '产品删除成功', 
        severity: 'success' 
      });
    } catch (err: any) {
      // 显示错误消息
      setSnackbar({ 
        open: true, 
        message: err.response?.data?.message || '删除产品失败', 
        severity: 'error' 
      });
    }
  };  // 处理表单提交
  const handleFormSubmit = async (data: CreateProductDto | UpdateProductDto) => {
    try {
      if (selectedProduct) {
        // 更新产品
        const updatedProduct = await productApi.updateProduct(selectedProduct.id, data);
        // 更新产品列表
        setProducts(products.map(p => 
          p.id === selectedProduct.id ? updatedProduct : p
        ));
        // 显示成功消息
        setSnackbar({ 
          open: true, 
          message: '产品更新成功', 
          severity: 'success' 
        });
      } else {
        // 创建产品
        const newProduct = await productApi.createProduct(data as CreateProductDto);
        // 更新产品列表
        setProducts([...products, newProduct]);
        // 显示成功消息
        setSnackbar({ 
          open: true, 
          message: '产品创建成功', 
          severity: 'success' 
        });
      }
      // 关闭表单
      setOpenForm(false);
    } catch (err: any) {
      // 显示错误消息
      setSnackbar({ 
        open: true, 
        message: err.response?.data?.message || '保存产品失败', 
        severity: 'error' 
      });
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            我的产品
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleAddClick}
          >
            添加产品
          </Button>
        </Box>        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : products.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1">
              您还没有添加任何产品。点击"添加产品"按钮开始创建。
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {products.map((product) => (
              <Grid item key={product.id} xs={12} sm={6} md={4}>
                <VendorProductCard 
                  product={product}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* 产品表单对话框 */}
      <ProductForm 
        open={openForm}
        onClose={() => setOpenForm(false)}
        onSubmit={handleFormSubmit}
        product={selectedProduct}
        title={selectedProduct ? '编辑产品' : '添加产品'}
      />

      {/* 消息提示 */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default VendorProductsPage;