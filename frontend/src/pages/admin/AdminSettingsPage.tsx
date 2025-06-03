import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Snackbar,
  Card,
  CardHeader,
  CardContent,
  IconButton,
  Tooltip,
  InputAdornment
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../store';
import { profileApi } from '../../utils/api';
import { getAdminSettings, updateAdminSettings } from '../../utils/api/admin';

interface SystemSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  orderPrefix: string;
  itemsPerPage: number;
  allowRegistration: boolean;
  maintenanceMode: boolean;
  theme: string;
  currencySymbol: string;
  taxRate: number;
  paymentGateways: string[];
  logLevel: string;
}

// 密码表单接口
interface PasswordForm {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const AdminSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  
  // 初始系统设置
  const initialSettings: SystemSettings = {
    siteName: '在线购物管理系统',
    siteDescription: '基于React+TypeScript前端和Rust后端的在线购物管理系统',
    contactEmail: 'admin@example.com',
    orderPrefix: 'ORD-',
    itemsPerPage: 10,
    allowRegistration: true,
    maintenanceMode: false,
    theme: 'light',
    currencySymbol: '¥',
    taxRate: 13,
    paymentGateways: ['alipay', 'wechatpay'],
    logLevel: 'info'
  };
  
  // 状态
  const [settings, setSettings] = useState<SystemSettings>(initialSettings);
  const [loading, setLoading] = useState<boolean>(false);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  
  // 密码相关状态
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState<{[key: string]: string}>({});
  const [showOldPassword, setShowOldPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [changingPassword, setChangingPassword] = useState<boolean>(false);
  
  // 确保用户是管理员
  useEffect(() => {
    console.log('AdminSettingsPage - 检查用户权限:', {
      isAuthenticated: !!user,
      userId: user?.id,
      userRole: user?.role
    });
    
    if (!user) {
      console.log('AdminSettingsPage - 用户未登录，重定向到登录页面');
      navigate('/login');
    } else if (String(user.role).toLowerCase() !== 'admin') {
      console.log('AdminSettingsPage - 用户不是管理员，重定向到首页');
      navigate('/');
      showSnackbar('只有管理员可以访问此页面', 'error');
    } else {
      console.log('AdminSettingsPage - 用户是管理员，允许访问');
    }
  }, [user, navigate]);
  
  // 获取设置数据
  useEffect(() => {
    const fetchSettings = async () => {
      if (user?.id) {
        try {
          setLoading(true);
          const adminSettings = await getAdminSettings(user.id);
          
          // 更新设置
          setSettings({
            siteName: adminSettings.siteName || initialSettings.siteName,
            siteDescription: adminSettings.siteDescription || initialSettings.siteDescription,
            contactEmail: adminSettings.contactEmail || initialSettings.contactEmail,
            orderPrefix: adminSettings.orderPrefix || initialSettings.orderPrefix,
            itemsPerPage: adminSettings.itemsPerPage || initialSettings.itemsPerPage,
            allowRegistration: adminSettings.allowRegistration !== undefined ? 
              adminSettings.allowRegistration : initialSettings.allowRegistration,
            maintenanceMode: adminSettings.maintenanceMode !== undefined ? 
              adminSettings.maintenanceMode : initialSettings.maintenanceMode,
            theme: adminSettings.theme || initialSettings.theme,
            currencySymbol: adminSettings.currencySymbol || initialSettings.currencySymbol,
            taxRate: adminSettings.taxRate || initialSettings.taxRate,
            paymentGateways: adminSettings.paymentGateways || initialSettings.paymentGateways,
            logLevel: adminSettings.logLevel || initialSettings.logLevel
          });
          
          setLoading(false);
        } catch (error: any) {
          console.error('获取管理员设置失败:', error);
          const errorMessage = error.message || '获取设置失败，使用默认值';
          showSnackbar(errorMessage, 'error');
          setLoading(false);
        }
      }
    };
    
    fetchSettings();
  }, [user]);
  
  // 显示提示信息
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };
  
  // 处理设置变更
  const handleSettingChange = (
    key: keyof SystemSettings,
    value: string | number | boolean | string[]
  ) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };
  
  // 处理密码表单变更
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 实时验证
    validatePasswordField(name, value);
  };
  
  // 验证密码字段
  const validatePasswordField = (name: string, value: string) => {
    const errors = { ...passwordErrors };
    
    switch (name) {
      case 'oldPassword':
        if (!value) {
          errors.oldPassword = '请输入当前密码';
        } else {
          delete errors.oldPassword;
        }
        break;
      case 'newPassword':
        if (!value) {
          errors.newPassword = '请输入新密码';
        } else if (value.length < 6) {
          errors.newPassword = '密码长度至少为6个字符';
        } else if (value === passwordForm.oldPassword) {
          errors.newPassword = '新密码不能与当前密码相同';
        } else {
          delete errors.newPassword;
          // 如果确认密码已填写，检查是否匹配
          if (passwordForm.confirmPassword && passwordForm.confirmPassword !== value) {
            errors.confirmPassword = '两次输入的密码不匹配';
          } else if (passwordForm.confirmPassword) {
            delete errors.confirmPassword;
          }
        }
        break;
      case 'confirmPassword':
        if (!value) {
          errors.confirmPassword = '请确认新密码';
        } else if (value !== passwordForm.newPassword) {
          errors.confirmPassword = '两次输入的密码不匹配';
        } else {
          delete errors.confirmPassword;
        }
        break;
      default:
        break;
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // 验证所有密码字段
  const validatePasswordForm = () => {
    const errors = { ...passwordErrors };
    
    if (!passwordForm.oldPassword) {
      errors.oldPassword = '请输入当前密码';
    }
    
    if (!passwordForm.newPassword) {
      errors.newPassword = '请输入新密码';
    } else if (passwordForm.newPassword.length < 6) {
      errors.newPassword = '密码长度至少为6个字符';
    } else if (passwordForm.newPassword === passwordForm.oldPassword) {
      errors.newPassword = '新密码不能与当前密码相同';
    }
    
    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = '请确认新密码';
    } else if (passwordForm.confirmPassword !== passwordForm.newPassword) {
      errors.confirmPassword = '两次输入的密码不匹配';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // 修改密码
  const handleChangePassword = async () => {
    if (!validatePasswordForm()) {
      return;
    }
    
    setChangingPassword(true);
    
    try {
      await profileApi.changePassword(passwordForm.oldPassword, passwordForm.newPassword);
      
      // 清空表单
      setPasswordForm({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      showSnackbar('密码修改成功', 'success');
    } catch (error: any) {
      console.error('修改密码失败:', error);
      const errorMessage = error.message || '修改密码失败，请重试';
      showSnackbar(errorMessage, 'error');
    } finally {
      setChangingPassword(false);
    }
  };
  
  // 保存设置
  const handleSaveSettings = async () => {
    if (!user?.id) {
      showSnackbar('用户ID不存在，无法保存设置', 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      await updateAdminSettings(user.id, settings);
      showSnackbar('系统设置已成功保存', 'success');
      setHasChanges(false);
    } catch (error: any) {
      console.error('保存设置失败:', error);
      const errorMessage = error.message || '保存设置失败，请重试';
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // 重置设置
  const handleResetSettings = () => {
    setSettings(initialSettings);
    showSnackbar('系统设置已重置', 'info');
    setHasChanges(false);
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        系统设置
      </Typography>
      
      <Grid container spacing={3}>
        {/* 基本设置 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="基本设置"
              subheader="网站基本信息配置"
              action={
                <Tooltip title="配置网站的基本信息">
                  <IconButton>
                    <InfoIcon />
                  </IconButton>
                </Tooltip>
              }
            />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="网站名称"
                    value={settings.siteName}
                    onChange={(e) => handleSettingChange('siteName', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="网站描述"
                    value={settings.siteDescription}
                    onChange={(e) => handleSettingChange('siteDescription', e.target.value)}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="联系邮箱"
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => handleSettingChange('contactEmail', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.maintenanceMode}
                        onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="维护模式"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* 商品和订单设置 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="商品和订单设置"
              subheader="订单和商品相关配置"
              action={
                <Tooltip title="配置订单和商品相关选项">
                  <IconButton>
                    <InfoIcon />
                  </IconButton>
                </Tooltip>
              }
            />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="订单前缀"
                    value={settings.orderPrefix}
                    onChange={(e) => handleSettingChange('orderPrefix', e.target.value)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="每页显示数量"
                    type="number"
                    value={settings.itemsPerPage}
                    onChange={(e) => handleSettingChange('itemsPerPage', parseInt(e.target.value) || 10)}
                    InputProps={{ inputProps: { min: 5, max: 100 } }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="货币符号"
                    value={settings.currencySymbol}
                    onChange={(e) => handleSettingChange('currencySymbol', e.target.value)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="税率 (%)"
                    type="number"
                    value={settings.taxRate}
                    onChange={(e) => handleSettingChange('taxRate', parseFloat(e.target.value) || 0)}
                    InputProps={{ inputProps: { min: 0, max: 100, step: 0.1 } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>支付网关</InputLabel>
                    <Select
                      multiple
                      value={settings.paymentGateways}
                      onChange={(e) => handleSettingChange('paymentGateways', e.target.value as string[])}
                      label="支付网关"
                      renderValue={(selected) => (selected as string[]).join(', ')}
                    >
                      <MenuItem value="alipay">支付宝</MenuItem>
                      <MenuItem value="wechatpay">微信支付</MenuItem>
                      <MenuItem value="creditcard">信用卡</MenuItem>
                      <MenuItem value="banktransfer">银行转账</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* 系统设置 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="系统设置"
              subheader="系统级别配置"
              action={
                <Tooltip title="配置系统级别的选项">
                  <IconButton>
                    <InfoIcon />
                  </IconButton>
                </Tooltip>
              }
            />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>主题</InputLabel>
                    <Select
                      value={settings.theme}
                      onChange={(e) => handleSettingChange('theme', e.target.value)}
                      label="主题"
                    >
                      <MenuItem value="light">亮色主题</MenuItem>
                      <MenuItem value="dark">暗色主题</MenuItem>
                      <MenuItem value="system">跟随系统</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>日志级别</InputLabel>
                    <Select
                      value={settings.logLevel}
                      onChange={(e) => handleSettingChange('logLevel', e.target.value)}
                      label="日志级别"
                    >
                      <MenuItem value="debug">调试</MenuItem>
                      <MenuItem value="info">信息</MenuItem>
                      <MenuItem value="warn">警告</MenuItem>
                      <MenuItem value="error">错误</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.allowRegistration}
                        onChange={(e) => handleSettingChange('allowRegistration', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="允许用户注册"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* 修改密码 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="修改密码"
              subheader="更新管理员账户密码"
              action={
                <Tooltip title="修改您的账户密码">
                  <IconButton>
                    <LockIcon />
                  </IconButton>
                </Tooltip>
              }
            />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="oldPassword"
                    label="当前密码"
                    type={showOldPassword ? 'text' : 'password'}
                    value={passwordForm.oldPassword}
                    onChange={handlePasswordChange}
                    error={!!passwordErrors.oldPassword}
                    helperText={passwordErrors.oldPassword}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowOldPassword(!showOldPassword)}
                            edge="end"
                          >
                            {showOldPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="newPassword"
                    label="新密码"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    error={!!passwordErrors.newPassword}
                    helperText={passwordErrors.newPassword || '密码长度至少为6个字符'}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            edge="end"
                          >
                            {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="confirmPassword"
                    label="确认新密码"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    error={!!passwordErrors.confirmPassword}
                    helperText={passwordErrors.confirmPassword}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={handleChangePassword}
                    disabled={changingPassword || 
                      !passwordForm.oldPassword || 
                      !passwordForm.newPassword || 
                      !passwordForm.confirmPassword}
                  >
                    {changingPassword ? '修改中...' : '修改密码'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* 操作按钮 */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleResetSettings}
          disabled={loading || !hasChanges}
        >
          重置
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSaveSettings}
          disabled={loading || !hasChanges}
        >
          {loading ? '保存中...' : '保存设置'}
        </Button>
      </Box>
      
      {/* 提示消息 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity} 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminSettingsPage; 