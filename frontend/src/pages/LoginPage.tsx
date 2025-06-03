import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Container, 
  TextField, 
  Typography, 
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Link,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import { loginStart, loginSuccess, loginFailure } from '../store/slices/authSlice';
import { authApi } from '../utils/api';
import { UserRole } from '../types/auth';

// 输入验证
const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.CUSTOMER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isRegister, setIsRegister] = useState(false); // 控制是登录还是注册模式
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // 验证输入
  const validateInputs = (): boolean => {
    let isValid = true;
    
    // 验证邮箱
    if (!email) {
      setEmailError('请输入邮箱地址');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('请输入有效的邮箱地址');
      isValid = false;
    } else {
      setEmailError(null);
    }
    
    // 验证密码
    if (!password) {
      setPasswordError('请输入密码');
      isValid = false;
    } else if (!validatePassword(password)) {
      setPasswordError('密码至少需要6个字符');
      isValid = false;
    } else {
      setPasswordError(null);
    }
    
    return isValid;
  };

  const handleRoleChange = (event: SelectChangeEvent) => {
    setRole(event.target.value as UserRole);
  };

  // 根据用户角色导航到对应的页面
  const navigateByRole = (role: UserRole) => {
    console.log('navigateByRole函数被调用，角色:', role);
    console.log('角色类型:', typeof role);
    
    // 将角色转为字符串进行比较
    const roleStr = String(role).toLowerCase();
    console.log('转换后的角色字符串:', roleStr);
    
    if (roleStr === 'admin') {
      console.log('导航到管理员页面');
      navigate('/admin/products');
    } else if (roleStr === 'vendor') {
      console.log('导航到供应商页面');
      navigate('/vendor');
    } else if (roleStr === 'customer') {
      console.log('导航到普通用户专属页面');
      navigate('/customer/orders');
    } else {
      console.log('导航到普通用户页面');
      navigate('/products');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // 验证输入
    if (!validateInputs()) {
      return;
    }
    
    setLoading(true);
    
    try {
      let response;
      
      if (isRegister) {
        // 调用注册API
        dispatch(loginStart());
        response = await authApi.register({ 
          email, 
          password,
          role // 使用用户选择的角色
        });
        
      } else {
        // 调用登录API
        dispatch(loginStart());
        response = await authApi.login({ email, password });
      }
      
      // 确保用户角色是字符串
      if (response.user && response.user.role) {
        response.user.role = String(response.user.role);
      }
      
      // 登录/注册成功，更新Redux状态
      dispatch(loginSuccess({
        user: response.user,
        token: response.token
      }));
      
      console.log('登录成功，保存的用户信息:', JSON.stringify(response.user));
      console.log('用户角色:', response.user.role, '类型:', typeof response.user.role);
      
      // 根据用户角色重定向到不同页面
      navigateByRole(response.user.role);
    } catch (err: any) {
      // 处理错误
      const action = isRegister ? '注册' : '登录';
      const errorMessage = err.response?.data?.message || `${action}失败，请检查您的输入`;
      dispatch(loginFailure(errorMessage));
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center">
            在线购物系统{isRegister ? '注册' : '登录'}
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="邮箱地址"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  error={!!emailError}
                  helperText={emailError}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="密码"
                  type="password"
                  id="password"
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  error={!!passwordError}
                  helperText={passwordError}
                />
              </Grid>
              
              {isRegister && (
                <Grid item xs={12}>
                  <FormControl fullWidth id="role-form-control">
                    <InputLabel id="role-select-label">用户角色</InputLabel>
                    <Select
                      labelId="role-select-label"
                      id="role-select"
                      name="role-select"
                      value={role}
                      label="用户角色"
                      onChange={handleRoleChange}
                      disabled={loading}
                    >
                      <MenuItem value={UserRole.CUSTOMER}>普通用户</MenuItem>
                      <MenuItem value={UserRole.VENDOR}>供应商</MenuItem>
                      <MenuItem value={UserRole.ADMIN}>管理员</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </Grid>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : (isRegister ? '注册' : '登录')}
            </Button>
            <Button
              fullWidth
              variant="text"
              onClick={() => setIsRegister(!isRegister)}
              disabled={loading}
            >
              {isRegister ? '已有账号？返回登录' : '没有账号？立即注册'}
            </Button>
            
            {/* 添加密码格式提示 */}
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2, textAlign: 'center' }}>
              初始密码格式：邮箱前缀+123（例如：user@example.com 的密码为 user123）
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage; 