import React from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Divider,
  TextField,
  Grid,
  Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import { CartItemType } from '../../types/cart';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

const CartItem: React.FC<CartItemProps> = ({ item, onUpdateQuantity, onRemove }) => {
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = parseInt(e.target.value, 10);
    if (!isNaN(newQuantity) && newQuantity > 0) {
      onUpdateQuantity(item.id, newQuantity);
    }
  };

  const handleIncrement = () => {
    onUpdateQuantity(item.id, item.quantity + 1);
  };

  const handleDecrement = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.id, item.quantity - 1);
    }
  };

  const handleRemove = () => {
    onRemove(item.id);
  };

  return (
    <Paper elevation={0} sx={{ mb: 2, p: 2, border: '1px solid #eee' }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={3}>
          <Box 
            sx={{ 
              height: 80, 
              width: '100%', 
              bgcolor: 'grey.100', 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {item.name}
            </Typography>
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <Typography variant="body1" fontWeight="medium">
            {item.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            单价: ¥{item.price.toFixed(2)}
          </Typography>
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <Box display="flex" alignItems="center">
            <IconButton 
              size="small" 
              onClick={handleDecrement}
              disabled={item.quantity <= 1}
            >
              <RemoveIcon fontSize="small" />
            </IconButton>
            
            <TextField
              size="small"
              value={item.quantity}
              onChange={handleQuantityChange}
              inputProps={{ 
                min: 1, 
                style: { textAlign: 'center', width: '40px' } 
              }}
              sx={{ mx: 1 }}
            />
            
            <IconButton 
              size="small" 
              onClick={handleIncrement}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>
        </Grid>
        
        <Grid item xs={8} sm={2}>
          <Typography variant="body1" fontWeight="medium">
            ¥{(item.price * item.quantity).toFixed(2)}
          </Typography>
        </Grid>
        
        <Grid item xs={4} sm={1} textAlign="right">
          <IconButton 
            color="error" 
            size="small"
            onClick={handleRemove}
          >
            <DeleteIcon />
          </IconButton>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default CartItem;