import React from 'react';
import { IconButton, Badge, Tooltip } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../hooks/redux';
import { fetchCart } from '../../store/slices/cartSlice';
import { UserRole } from '../../types/auth';

const CartIcon: React.FC = () => {
  const { totalItems } = useSelector((state: RootState) => state.cart);
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // 检查是否为管理员
  const isAdmin = user && user.role.toUpperCase() === UserRole.ADMIN.toUpperCase();

  const handleClick = () => {
    // 如果是管理员，显示提示并不执行操作
    if (isAdmin) {
      alert('管理员不能访问购物车功能');
      return;
    }
    
    // 如果用户已登录且不是管理员，先刷新购物车数据
    if (isAuthenticated && !isAdmin) {
      dispatch(fetchCart());
    }
    navigate('/cart');
  };

  return (
    <Tooltip title="购物车">
      <IconButton 
        color="inherit" 
        onClick={handleClick}
        aria-label="购物车"
      >
        <Badge badgeContent={totalItems} color="error">
          <ShoppingCartIcon />
        </Badge>
      </IconButton>
    </Tooltip>
  );
};

export default CartIcon;