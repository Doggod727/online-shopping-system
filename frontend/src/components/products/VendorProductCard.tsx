import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  Rating,
  Chip,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Product } from '../../types/product';

interface VendorProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => Promise<void>;
}

const VendorProductCard: React.FC<VendorProductCardProps> = ({ product, onEdit, onDelete }) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEditClick = () => {
    onEdit(product);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(product);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

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
        <CardMedia
          component="img"
          height="200"
          image={`https://source.unsplash.com/random/300x200?product=${product.id}`}
          alt={product.name}
        />
        
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ mb: 1 }}>
            {product.in_stock ? (
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
          </Box>
          
          <Typography gutterBottom variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
            {product.name}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
            {product.description.length > 100 
              ? `${product.description.substring(0, 100)}...` 
              : product.description}
          </Typography>
          
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
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
              ¥{product.price.toFixed(2)}
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
              库存: {product.stock}
            </Typography>
          </Box>
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          <Button 
            size="small" 
            startIcon={<EditIcon />}
            onClick={handleEditClick}
          >
            编辑
          </Button>
          <Button 
            size="small" 
            color="error" 
            startIcon={<DeleteIcon />}
            onClick={handleDeleteClick}
          >
            删除
          </Button>
        </CardActions>
      </Card>
      
      {/* 删除确认对话框 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            您确定要删除产品 "{product.name}" 吗？此操作无法撤销。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)} 
            disabled={isDeleting}
          >
            取消
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            disabled={isDeleting}
            autoFocus
          >
            {isDeleting ? '删除中...' : '删除'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default VendorProductCard; 