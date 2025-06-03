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
  Tabs,
  Container,
  Switch,
  FormControlLabel,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  OutlinedInput,
  InputAdornment,
  Stack,
  Chip,
  IconButton
} from '@mui/material';
import { 
  Store as StoreIcon, 
  Payments as PaymentsIcon, 
  LocalShipping as ShippingIcon, 
  Notifications as NotificationsIcon,
  Save as SaveIcon,
  Upload as UploadIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { profileApi, UserProfile, UpdateUserProfileDto, vendorProfileApi, VendorProfile, UpdateVendorProfileDto } from '../../utils/api';

// 店铺设置DTO
interface StoreSettings {
  storeName: string;
  storeDescription: string;
  contactEmail: string;
  contactPhone: string;
  storeAddress: string;
  storeLogoUrl: string;
  storeBannerUrl: string;
  businessHours: string;
  acceptsReturns: boolean;
  returnPolicy: string;
  shippingMethods: ShippingMethod[];
  paymentMethods: PaymentMethod[];
  notificationSettings: NotificationSettings;
}

interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  fee: number;
  estimatedDays: string;
  enabled: boolean;
}

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  accountInfo: string;
  enabled: boolean;
}

interface NotificationSettings {
  newOrderEmail: boolean;
  newOrderSms: boolean;
  lowStockEmail: boolean;
  lowStockThreshold: number;
  orderStatusUpdateEmail: boolean;
}

const VendorSettingsPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  
  // 密码修改状态
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // 店铺设置状态
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    storeName: '',
    storeDescription: '',
    contactEmail: '',
    contactPhone: '',
    storeAddress: '',
    storeLogoUrl: '',
    storeBannerUrl: '',
    businessHours: '',
    acceptsReturns: true,
    returnPolicy: '',
    shippingMethods: [
      {
        id: '1',
        name: '标准配送',
        description: '3-5个工作日送达',
        fee: 10,
        estimatedDays: '3-5',
        enabled: true
      },
      {
        id: '2',
        name: '快速配送',
        description: '1-2个工作日送达',
        fee: 20,
        estimatedDays: '1-2',
        enabled: true
      },
      {
        id: '3',
        name: '当日达',
        description: '当天送达(仅限部分地区)',
        fee: 30,
        estimatedDays: '0-1',
        enabled: false
      }
    ],
    paymentMethods: [
      {
        id: '1',
        name: '支付宝',
        description: '通过支付宝支付',
        accountInfo: 'example@alipay.com',
        enabled: true
      },
      {
        id: '2',
        name: '微信支付',
        description: '通过微信支付',
        accountInfo: 'wxid_example',
        enabled: true
      },
      {
        id: '3',
        name: '银行转账',
        description: '通过银行转账支付',
        accountInfo: '工商银行 6222 **** **** 1234',
        enabled: false
      }
    ],
    notificationSettings: {
      newOrderEmail: true,
      newOrderSms: true,
      lowStockEmail: true,
      lowStockThreshold: 5,
      orderStatusUpdateEmail: true
    }
  });

  // 获取供应商详细信息
  useEffect(() => {
    const fetchVendorProfile = async () => {
      setLoading(true);
      try {
        // 获取供应商详情
        const profile = await vendorProfileApi.getVendorProfile();
        setVendorProfile(profile);
        
        // 解析JSON字符串字段
        let shippingMethods = [];
        let paymentMethods = [];
        let notificationSettings = {
          newOrderEmail: true,
          newOrderSms: true,
          lowStockEmail: true,
          lowStockThreshold: 5,
          orderStatusUpdateEmail: true
        };
        
        try {
          if (profile.shipping_methods) {
            shippingMethods = JSON.parse(profile.shipping_methods);
          }
        } catch (e) {
          console.error('解析配送方式失败:', e);
        }
        
        try {
          if (profile.payment_methods) {
            paymentMethods = JSON.parse(profile.payment_methods);
          }
        } catch (e) {
          console.error('解析支付方式失败:', e);
        }
        
        try {
          if (profile.notification_settings) {
            notificationSettings = JSON.parse(profile.notification_settings);
          }
        } catch (e) {
          console.error('解析通知设置失败:', e);
        }
        
        // 使用后端数据更新状态
        setStoreSettings({
          storeName: profile.store_name || '',
          storeDescription: profile.store_description || '',
          contactEmail: profile.contact_email || profile.email || '',
          contactPhone: profile.contact_phone || '',
          storeAddress: profile.store_address || '',
          storeLogoUrl: profile.store_logo_url || '',
          storeBannerUrl: profile.store_banner_url || '',
          businessHours: profile.business_hours || '',
          acceptsReturns: profile.accepts_returns,
          returnPolicy: profile.return_policy || '',
          shippingMethods: shippingMethods.length > 0 ? shippingMethods : storeSettings.shippingMethods,
          paymentMethods: paymentMethods.length > 0 ? paymentMethods : storeSettings.paymentMethods,
          notificationSettings: notificationSettings
        });
      } catch (err: any) {
        console.error('获取供应商详情失败:', err);
        showSnackbar('获取供应商信息失败，请稍后重试', 'error');
        
        // 如果获取失败，尝试获取用户个人资料
        try {
          const userProfile = await profileApi.getUserProfile();
          setUserProfile(userProfile);
          
          // 使用用户资料部分更新店铺设置
          setStoreSettings(prev => ({
            ...prev,
            storeName: userProfile.username || prev.storeName,
            contactEmail: userProfile.email || prev.contactEmail,
            contactPhone: userProfile.phone || prev.contactPhone,
            storeAddress: userProfile.address || prev.storeAddress
          }));
        } catch (profileErr) {
          console.error('获取用户资料失败:', profileErr);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchVendorProfile();
  }, []);
  
  // 处理标签页切换
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // 处理店铺基本信息变更
  const handleStoreInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setStoreSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 处理开关控件变更
  const handleSwitchChange = (name: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setStoreSettings(prev => ({
      ...prev,
      [name]: e.target.checked
    }));
  };
  
  // 处理嵌套对象的开关变更
  const handleNestedSwitchChange = (
    section: 'notificationSettings',
    field: string
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setStoreSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: e.target.checked
      }
    }));
  };
  
  // 处理嵌套对象的文本输入变更
  const handleNestedChange = (
    section: 'notificationSettings',
    field: string
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    setStoreSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };
  
  // 处理配送方式变更
  const handleShippingMethodChange = (id: string, field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: unknown; checked?: boolean; type?: string; } }
  ) => {
    const target = e.target;
    const value = 'checked' in target && field === 'enabled'
      ? target.checked
      : 'type' in target && target.type === 'number'
        ? Number(target.value)
        : target.value;
    
    setStoreSettings(prev => ({
      ...prev,
      shippingMethods: prev.shippingMethods.map(method => 
        method.id === id ? { ...method, [field]: value } : method
      )
    }));
  };
  
  // 处理支付方式变更
  const handlePaymentMethodChange = (id: string, field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: unknown; checked?: boolean; type?: string; } }
  ) => {
    const target = e.target;
    const value = 'checked' in target && field === 'enabled'
      ? target.checked
      : target.value;
    
    setStoreSettings(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.map(method => 
        method.id === id ? { ...method, [field]: value } : method
      )
    }));
  };
  
  // 添加新的配送方式
  const handleAddShippingMethod = () => {
    const newId = Date.now().toString();
    setStoreSettings(prev => ({
      ...prev,
      shippingMethods: [
        ...prev.shippingMethods,
        {
          id: newId,
          name: '新配送方式',
          description: '',
          fee: 0,
          estimatedDays: '',
          enabled: true
        }
      ]
    }));
  };
  
  // 添加新的支付方式
  const handleAddPaymentMethod = () => {
    const newId = Date.now().toString();
    setStoreSettings(prev => ({
      ...prev,
      paymentMethods: [
        ...prev.paymentMethods,
        {
          id: newId,
          name: '新支付方式',
          description: '',
          accountInfo: '',
          enabled: true
        }
      ]
    }));
  };
  
  // 删除配送方式
  const handleDeleteShippingMethod = (id: string) => {
    setStoreSettings(prev => ({
      ...prev,
      shippingMethods: prev.shippingMethods.filter(method => method.id !== id)
    }));
  };
  
  // 删除支付方式
  const handleDeletePaymentMethod = (id: string) => {
    setStoreSettings(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.filter(method => method.id !== id)
    }));
  };
  
  // 显示提示消息
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };
  
  // 关闭提示消息
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };
  
  // 保存店铺设置
  const handleSaveSettings = async () => {
    setLoading(true);
    
    try {
      // 准备要保存的数据
      const profileUpdate: UpdateVendorProfileDto = {
        store_name: storeSettings.storeName,
        store_description: storeSettings.storeDescription,
        contact_email: storeSettings.contactEmail,
        contact_phone: storeSettings.contactPhone,
        store_address: storeSettings.storeAddress,
        store_logo_url: storeSettings.storeLogoUrl,
        store_banner_url: storeSettings.storeBannerUrl,
        business_hours: storeSettings.businessHours,
        accepts_returns: storeSettings.acceptsReturns,
        return_policy: storeSettings.returnPolicy,
        shipping_methods: JSON.stringify(storeSettings.shippingMethods),
        payment_methods: JSON.stringify(storeSettings.paymentMethods),
        notification_settings: JSON.stringify(storeSettings.notificationSettings)
      };
      
      // 调用API保存设置
      await vendorProfileApi.updateVendorProfile(profileUpdate);
      
      showSnackbar('店铺设置保存成功', 'success');
    } catch (err: any) {
      console.error('保存店铺设置失败:', err);
      showSnackbar('保存失败: ' + (err.message || '未知错误'), 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // 处理密码表单变更
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 修改密码
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // 验证新密码
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showSnackbar('两次输入的新密码不一致', 'error');
      setLoading(false);
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      showSnackbar('新密码长度不能少于6个字符', 'error');
      setLoading(false);
      return;
    }
    
    try {
      await profileApi.changePassword(passwordData.currentPassword, passwordData.newPassword);
      showSnackbar('密码修改成功', 'success');
      
      // 清空密码表单
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err: any) {
      console.error('修改密码失败:', err);
      showSnackbar(err.message || '修改密码失败，请重试', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && !userProfile) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <StoreIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h5" component="h1">
            店铺设置
          </Typography>
        </Box>
        
        <Paper sx={{ mb: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="基本信息" icon={<StoreIcon />} iconPosition="start" />
            <Tab label="支付设置" icon={<PaymentsIcon />} iconPosition="start" />
            <Tab label="配送设置" icon={<ShippingIcon />} iconPosition="start" />
            <Tab label="通知设置" icon={<NotificationsIcon />} iconPosition="start" />
            <Tab label="修改密码" icon={<LockIcon />} iconPosition="start" />
          </Tabs>
          
          {/* 基本信息 */}
          {tabValue === 0 && (
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                店铺基本信息
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Avatar 
                      src={storeSettings.storeLogoUrl} 
                      sx={{ width: 120, height: 120, mb: 2 }}
                    >
                      <StoreIcon sx={{ fontSize: 60 }} />
                    </Avatar>
                    <Button
                      variant="outlined"
                      startIcon={<UploadIcon />}
                      size="small"
                    >
                      上传店铺logo
                    </Button>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="店铺名称"
                    name="storeName"
                    value={storeSettings.storeName}
                    onChange={handleStoreInfoChange}
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="联系邮箱"
                    name="contactEmail"
                    type="email"
                    value={storeSettings.contactEmail}
                    onChange={handleStoreInfoChange}
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="联系电话"
                    name="contactPhone"
                    value={storeSettings.contactPhone}
                    onChange={handleStoreInfoChange}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="店铺地址"
                    name="storeAddress"
                    value={storeSettings.storeAddress}
                    onChange={handleStoreInfoChange}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="店铺描述"
                    name="storeDescription"
                    value={storeSettings.storeDescription}
                    onChange={handleStoreInfoChange}
                    margin="normal"
                    multiline
                    rows={4}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="营业时间"
                    name="businessHours"
                    placeholder="例如: 周一至周五 9:00-18:00, 周末 10:00-16:00"
                    value={storeSettings.businessHours}
                    onChange={handleStoreInfoChange}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={storeSettings.acceptsReturns}
                        onChange={handleSwitchChange('acceptsReturns')}
                        color="primary"
                      />
                    }
                    label="接受退货"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="退货政策"
                    name="returnPolicy"
                    value={storeSettings.returnPolicy}
                    onChange={handleStoreInfoChange}
                    margin="normal"
                    multiline
                    rows={3}
                    disabled={!storeSettings.acceptsReturns}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
          
          {/* 支付设置 */}
          {tabValue === 1 && (
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">支付方式设置</Typography>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  onClick={handleAddPaymentMethod}
                >
                  添加支付方式
                </Button>
              </Box>
              
              {storeSettings.paymentMethods.map((method, index) => (
                <Paper
                  key={method.id}
                  variant="outlined"
                  sx={{ p: 2, mb: 2 }}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="支付方式名称"
                        value={method.name}
                        onChange={handlePaymentMethodChange(method.id, 'name')}
                        margin="dense"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="账户信息"
                        value={method.accountInfo}
                        onChange={handlePaymentMethodChange(method.id, 'accountInfo')}
                        margin="dense"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="描述"
                        value={method.description}
                        onChange={handlePaymentMethodChange(method.id, 'description')}
                        margin="dense"
                      />
                    </Grid>
                    <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={method.enabled}
                            onChange={handlePaymentMethodChange(method.id, 'enabled') as any}
                          />
                        }
                        label={method.enabled ? '已启用' : '已禁用'}
                      />
                      <IconButton 
                        color="error" 
                        onClick={() => handleDeletePaymentMethod(method.id)}
                        disabled={storeSettings.paymentMethods.length <= 1}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Box>
          )}
          
          {/* 配送设置 */}
          {tabValue === 2 && (
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">配送方式设置</Typography>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  onClick={handleAddShippingMethod}
                >
                  添加配送方式
                </Button>
              </Box>
              
              {storeSettings.shippingMethods.map((method, index) => (
                <Paper
                  key={method.id}
                  variant="outlined"
                  sx={{ p: 2, mb: 2 }}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="配送方式名称"
                        value={method.name}
                        onChange={handleShippingMethodChange(method.id, 'name')}
                        margin="dense"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="预计配送时间(天)"
                        value={method.estimatedDays}
                        onChange={handleShippingMethodChange(method.id, 'estimatedDays')}
                        margin="dense"
                        placeholder="例如: 1-3, 3-5"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="配送费用"
                        type="number"
                        value={method.fee}
                        onChange={handleShippingMethodChange(method.id, 'fee')}
                        margin="dense"
                        InputProps={{
                          startAdornment: <InputAdornment position="start">¥</InputAdornment>,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="描述"
                        value={method.description}
                        onChange={handleShippingMethodChange(method.id, 'description')}
                        margin="dense"
                      />
                    </Grid>
                    <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={method.enabled}
                            onChange={handleShippingMethodChange(method.id, 'enabled') as any}
                          />
                        }
                        label={method.enabled ? '已启用' : '已禁用'}
                      />
                      <IconButton 
                        color="error" 
                        onClick={() => handleDeleteShippingMethod(method.id)}
                        disabled={storeSettings.shippingMethods.length <= 1}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Box>
          )}
          
          {/* 通知设置 */}
          {tabValue === 3 && (
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                通知设置
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    订单通知
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={storeSettings.notificationSettings.newOrderEmail}
                        onChange={handleNestedSwitchChange('notificationSettings', 'newOrderEmail')}
                        color="primary"
                      />
                    }
                    label="新订单邮件通知"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={storeSettings.notificationSettings.newOrderSms}
                        onChange={handleNestedSwitchChange('notificationSettings', 'newOrderSms')}
                        color="primary"
                      />
                    }
                    label="新订单短信通知"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={storeSettings.notificationSettings.orderStatusUpdateEmail}
                        onChange={handleNestedSwitchChange('notificationSettings', 'orderStatusUpdateEmail')}
                        color="primary"
                      />
                    }
                    label="订单状态更新邮件通知"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    库存通知
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={storeSettings.notificationSettings.lowStockEmail}
                          onChange={handleNestedSwitchChange('notificationSettings', 'lowStockEmail')}
                          color="primary"
                        />
                      }
                      label="低库存邮件通知"
                    />
                    {storeSettings.notificationSettings.lowStockEmail && (
                      <TextField
                        label="库存阈值"
                        type="number"
                        size="small"
                        value={storeSettings.notificationSettings.lowStockThreshold}
                        onChange={handleNestedChange('notificationSettings', 'lowStockThreshold')}
                        InputProps={{
                          inputProps: { min: 1 }
                        }}
                        sx={{ ml: 2, width: 100 }}
                      />
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
          
          {/* 修改密码 */}
          {tabValue === 4 && (
            <Box component="form" onSubmit={handleChangePassword} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                修改账户密码
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="当前密码"
                    name="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="新密码"
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    margin="normal"
                    helperText="密码长度至少6个字符"
                  />
                  <TextField
                    fullWidth
                    label="确认新密码"
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    margin="normal"
                    error={passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword !== ''}
                    helperText={passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword !== '' ? '两次输入的密码不一致' : ''}
                  />
                  <Box sx={{ mt: 3 }}>
                    <Button 
                      type="submit"
                      variant="contained"
                      color="primary"
                      startIcon={<LockIcon />}
                      disabled={loading}
                    >
                      {loading ? <CircularProgress size={24} /> : '修改密码'}
                    </Button>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        密码安全提示
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Typography variant="body2" paragraph>
                        • 强密码应包含字母、数字和特殊字符的组合
                      </Typography>
                      <Typography variant="body2" paragraph>
                        • 请勿使用与其他网站相同的密码
                      </Typography>
                      <Typography variant="body2" paragraph>
                        • 定期更换密码可以提高账户安全性
                      </Typography>
                      <Typography variant="body2" paragraph>
                        • 请勿将密码告知他人或在不安全的地方记录密码
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </Paper>
        
        {/* 如果是基本信息、支付设置、配送设置和通知设置页签才显示保存设置按钮 */}
        {tabValue < 4 && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSaveSettings}
              disabled={loading}
            >
              {loading ? '保存中...' : '保存设置'}
            </Button>
          </Box>
        )}
      </Paper>
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default VendorSettingsPage; 