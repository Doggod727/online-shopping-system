import React, { useState } from 'react';
import { 
  Button, 
  IconButton, 
  Box, 
  TextField, 
  Snackbar, 
  Alert 
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
// @ts-ignore
import { addToCart } from '../../store/slices/cartSlice';
import { Product } from '../../types/product';
import { useAppDispatch } from '../../hooks/redux';

interface AddToCartButtonProps {
  product: Product;
}

const AddToCartButton: React.FC<AddToCartButtonProps> = ({ product }) => {
  const dispatch = useAppDispatch();
  const [quantity, setQuantity] = useState(1);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1) {
      setQuantity(value);
    }
  };

  const handleIncrement = () => {
    setQuantity(prev => prev + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleAddToCart = () => {
    dispatch(addToCart({ productId: product.id, quantity }))
      .unwrap()
      .then(() => {
        setSnackbarOpen(true);
      })
      .catch((error: any) => {
        console.error('添加到购物车失败:', error);
      });
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <>
      <Box display="flex" alignItems="center" mt={2}>
        <Box display="flex" alignItems="center" mr={2}>
          <IconButton size="small" onClick={handleDecrement} disabled={quantity <= 1}>
            <RemoveIcon />
          </IconButton>
          <TextField
            size="small"
            value={quantity}
            onChange={handleQuantityChange}
            inputProps={{ min: 1, style: { textAlign: 'center' } }}
            sx={{ width: '60px', mx: 1 }}
          />
          <IconButton size="small" onClick={handleIncrement}>
            <AddIcon />
          </IconButton>
        </Box>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<ShoppingCartIcon />}
          onClick={handleAddToCart}
          disabled={product.stock <= 0}
        >
          {product.stock > 0 ? '加入购物车' : '缺货'}
        </Button>
      </Box>
      
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={3000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success">
          已将 {quantity} 件 {product.name} 添加到购物车
        </Alert>
      </Snackbar>
    </>
  );
};

export default AddToCartButton;