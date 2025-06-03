import React, { useState, useEffect } from 'react';
import { 
  Button, 
  TextField, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle,
  Grid,
  InputAdornment
} from '@mui/material';
import { Product, CreateProductDto, UpdateProductDto } from '../../types/product';

interface ProductFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProductDto | UpdateProductDto) => void;
  product?: Product;
  title: string;
}

const ProductForm: React.FC<ProductFormProps> = ({ 
  open, 
  onClose, 
  onSubmit, 
  product, 
  title 
}) => {
  const [formData, setFormData] = useState<CreateProductDto | UpdateProductDto>({
    name: '',
    description: '',
    price: 0,
    stock: 0,
  });
  
  const [errors, setErrors] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
  });

  // 当产品数据变化时更新表单
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
      });
    } else {
      // 重置表单
      setFormData({
        name: '',
        description: '',
        price: 0,
        stock: 0,
      });
    }
  }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    let parsedValue: string | number = value;
    if (name === 'price' || name === 'stock') {
      parsedValue = value === '' ? 0 : parseFloat(value);
    }
    
    setFormData({
      ...formData,
      [name]: parsedValue,
    });
    
    // 清除错误
    if (errors[name as keyof typeof errors]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors = { ...errors };
    
    if (!formData.name) {
      newErrors.name = '产品名称不能为空';
      isValid = false;
    }
    
    if (!formData.description) {
      newErrors.description = '产品描述不能为空';
      isValid = false;
    }
    
    if (formData.price !== undefined && formData.price <= 0) {
      newErrors.price = '价格必须大于0';
      isValid = false;
    }
    
    if (formData.stock !== undefined && formData.stock < 0) {
      newErrors.stock = '库存不能为负数';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              name="name"
              label="产品名称"
              fullWidth
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="description"
              label="产品描述"
              fullWidth
              multiline
              rows={4}
              value={formData.description}
              onChange={handleChange}
              error={!!errors.description}
              helperText={errors.description}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              name="price"
              label="价格"
              type="number"
              fullWidth
              value={formData.price}
              onChange={handleChange}
              InputProps={{
                startAdornment: <InputAdornment position="start">¥</InputAdornment>,
              }}
              error={!!errors.price}
              helperText={errors.price}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              name="stock"
              label="库存"
              type="number"
              fullWidth
              value={formData.stock}
              onChange={handleChange}
              error={!!errors.stock}
              helperText={errors.stock}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          提交
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductForm;