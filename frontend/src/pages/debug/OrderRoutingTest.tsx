import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Paper, 
  Button, 
  Box, 
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { RootState } from '../../store';
import { UserRole } from '../../types/auth';

const OrderRoutingTest: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [testResults, setTestResults] = useState<{[key: string]: boolean}>({});
  
  useEffect(() => {
    // 如果用户未登录，显示提示
    if (!isAuthenticated || !user) {
      return;
    }
    
    // 测试结果
    const results: {[key: string]: boolean} = {};
    
    // 根据用户角色确定应该访问哪个订单页面
    switch (user.role) {
      case UserRole.ADMIN:
        results['shouldAccessAdmin'] = true;
        results['shouldAccessUser'] = false;
        results['shouldAccessVendor'] = false;
        break;
      case UserRole.VENDOR:
        results['shouldAccessAdmin'] = false;
        results['shouldAccessUser'] = false;
        results['shouldAccessVendor'] = true;
        break;
      case UserRole.CUSTOMER:
        results['shouldAccessAdmin'] = false;
        results['shouldAccessUser'] = true;
        results['shouldAccessVendor'] = false;
        break;
    }
    
    setTestResults(results);
  }, [isAuthenticated, user]);
  
  const handleTestRoute = (route: string) => {
    navigate(route);
  };
  
  if (!isAuthenticated || !user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">请先登录以进行测试</Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>订单路由测试</Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>当前用户信息</Typography>
        <List>
          <ListItem>
            <ListItemText primary="用户ID" secondary={user.id} />
          </ListItem>
          <ListItem>
            <ListItemText primary="邮箱" secondary={user.email} />
          </ListItem>
          <ListItem>
            <ListItemText primary="角色" secondary={user.role} />
          </ListItem>
        </List>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>路由访问权限测试</Typography>
        
        <List>
          <ListItem>
            <ListItemText 
              primary="管理员订单页面 (/admin/orders)" 
              secondary={testResults['shouldAccessAdmin'] ? '应该可以访问' : '应该无法访问'} 
            />
            <Button 
              variant="contained" 
              color={testResults['shouldAccessAdmin'] ? 'primary' : 'error'}
              onClick={() => handleTestRoute('/admin/orders')}
            >
              测试访问
            </Button>
          </ListItem>
          
          <Divider />
          
          <ListItem>
            <ListItemText 
              primary="供应商订单页面 (/vendor/orders)" 
              secondary={testResults['shouldAccessVendor'] ? '应该可以访问' : '应该无法访问'} 
            />
            <Button 
              variant="contained" 
              color={testResults['shouldAccessVendor'] ? 'primary' : 'error'}
              onClick={() => handleTestRoute('/vendor/orders')}
            >
              测试访问
            </Button>
          </ListItem>
          
          <Divider />
          
          <ListItem>
            <ListItemText 
              primary="普通用户订单页面 (/orders)" 
              secondary={testResults['shouldAccessUser'] ? '应该可以访问' : '应该无法访问'} 
            />
            <Button 
              variant="contained" 
              color={testResults['shouldAccessUser'] ? 'primary' : 'error'}
              onClick={() => handleTestRoute('/orders')}
            >
              测试访问
            </Button>
          </ListItem>
        </List>
      </Paper>
      
      <Box sx={{ mt: 3 }}>
        <Button 
          variant="outlined" 
          onClick={() => navigate(-1)}
          sx={{ mr: 2 }}
        >
          返回
        </Button>
      </Box>
    </Container>
  );
};

export default OrderRoutingTest; 