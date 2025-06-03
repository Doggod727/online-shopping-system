import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  TextField, 
  Button, 
  Avatar, 
  Divider, 
  Alert,
  Snackbar,
  Card,
  CardContent,
  CircularProgress,
  Tab,
  Tabs
} from '@mui/material';
import { 
  Person as PersonIcon, 
  Lock as LockIcon, 
  Save as SaveIcon 
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { authApi, profileApi, UserProfile, UpdateUserProfileDto } from '../../utils/api';

// 定义个人资料页面组件
const ProfilePage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const [tabValue, setTabValue] = useState(0);
  
  // 用户详细信息状态
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // 基本信息状态
  const [profileData, setProfileData] = useState<UpdateUserProfileDto>({
    username: '',
    phone: '',
    address: '',
    avatar_url: '',
    gender: '',
    birth_date: ''
  });
  
  // 密码修改状态
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // 获取用户详细信息
  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      try {
        const profile = await profileApi.getUserProfile();
        setUserProfile(profile);
        setProfileData({
          username: profile.username || '',
          phone: profile.phone || '',
          address: profile.address || '',
          avatar_url: profile.avatar_url || '',
          gender: profile.gender || '',
          birth_date: profile.birth_date || ''
        });
      } catch (err: any) {
        console.error('获取用户详细信息失败:', err);
        // 显示更友好的错误信息
        if (err.response && err.response.status === 404) {
          setError('个人资料服务暂不可用，请稍后再试');
        } else {
          setError(err.message || '获取用户详细信息失败，请刷新页面重试');
        }
        
        // 设置一些默认值，以便用户可以编辑
        setProfileData({
          username: user?.email?.split('@')[0] || '',
          phone: '',
          address: '',
          avatar_url: '',
          gender: '',
          birth_date: ''
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [user?.email]);
  
  // 处理标签页切换
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // 处理个人信息表单变更
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 处理密码表单变更
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 更新个人信息
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const updatedProfile = await profileApi.updateUserProfile(profileData);
      setUserProfile(updatedProfile);
      setSuccess('个人信息更新成功');
      console.log('个人信息已更新:', updatedProfile);
    } catch (err: any) {
      setError(err.message || '更新个人信息失败');
      console.error('更新个人信息失败:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // 修改密码
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    // 验证新密码
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('两次输入的新密码不一致');
      setLoading(false);
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setError('新密码长度不能少于6个字符');
      setLoading(false);
      return;
    }
    
    try {
      console.log('尝试修改密码:', passwordData.currentPassword.length, passwordData.newPassword.length);
      await profileApi.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setSuccess('密码修改成功');
      console.log('密码已修改');
      
      // 清空密码表单
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err: any) {
      console.error('修改密码失败详情:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('修改密码失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && !userProfile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        个人资料
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            icon={<PersonIcon />} 
            label="基本信息" 
            iconPosition="start"
          />
          <Tab 
            icon={<LockIcon />} 
            label="修改密码" 
            iconPosition="start"
          />
        </Tabs>
        
        {/* 基本信息表单 */}
        {tabValue === 0 && (
          <Box component="form" onSubmit={handleUpdateProfile} sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Avatar 
                  sx={{ 
                    width: 120, 
                    height: 120, 
                    mb: 2,
                    fontSize: '3rem'
                  }}
                >
                  {userProfile?.username ? userProfile.username.charAt(0).toUpperCase() : 
                   userProfile?.email ? userProfile.email.charAt(0).toUpperCase() : 'U'}
                </Avatar>
                <Typography variant="subtitle1" fontWeight="bold">
                  {userProfile?.username || userProfile?.email || '用户'}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {userProfile?.role || '顾客'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={8}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="电子邮箱"
                      name="email"
                      value={userProfile?.email || ''}
                      disabled
                      helperText="邮箱地址不可修改"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="用户名"
                      name="username"
                      value={profileData.username}
                      onChange={handleProfileChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="电话号码"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleProfileChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      select
                      label="性别"
                      name="gender"
                      value={profileData.gender || ''}
                      onChange={handleProfileChange}
                      SelectProps={{
                        native: true,
                      }}
                    >
                      <option value=""></option>
                      <option value="male">男</option>
                      <option value="female">女</option>
                      <option value="other">其他</option>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="生日"
                      name="birth_date"
                      type="date"
                      value={profileData.birth_date || ''}
                      onChange={handleProfileChange}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      helperText="格式: YYYY-MM-DD"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="收货地址"
                      name="address"
                      value={profileData.address}
                      onChange={handleProfileChange}
                      multiline
                      rows={2}
                    />
                  </Grid>
                </Grid>
              </Grid>
              
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : '保存修改'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}
        
        {/* 修改密码表单 */}
        {tabValue === 1 && (
          <Box component="form" onSubmit={handleChangePassword} sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="当前密码"
                  name="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="新密码"
                  name="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  helperText="密码长度至少6个字符"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="确认新密码"
                  name="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  error={passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword !== ''}
                  helperText={passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword !== '' ? '两次输入的密码不一致' : ''}
                />
              </Grid>
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<LockIcon />}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : '修改密码'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
      
      {/* 账户安全信息卡片 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            账户安全
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                最近登录时间
              </Typography>
              <Typography variant="body2">
                {new Date().toLocaleString('zh-CN')}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                账户状态
              </Typography>
              <Typography variant="body2" color="success.main">
                正常
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* 成功提示 */}
      <Snackbar 
        open={!!success} 
        autoHideDuration={3000} 
        onClose={() => setSuccess('')}
      >
        <Alert severity="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      </Snackbar>
      
      {/* 错误提示 */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={3000} 
        onClose={() => setError('')}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfilePage; 