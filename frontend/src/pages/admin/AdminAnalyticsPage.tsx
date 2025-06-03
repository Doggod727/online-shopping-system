import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  TextField,
  useTheme,
  Divider,
  Tab,
  Tabs,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  FilterAlt as FilterIcon,
  DateRange as DateRangeIcon,
  ShowChart as ChartIcon
} from '@mui/icons-material';
import { RootState } from '../../store';
import { analyticsApi, AnalyticsParams, AnalyticsResponse, TimeSeriesData, CategoryData } from '../../utils/api';
import { UserRole } from '../../types/auth';

// 格式化数字为货币格式
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2
  }).format(value);
};

// 格式化数字为百分比
const formatPercent = (value: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'percent',
    minimumFractionDigits: 2
  }).format(value / 100);
};

// 格式化日期为字符串
const formatDateToString = (date: Date | null): string => {
  if (!date) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// 颜色数组
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

// 标签的Tab索引
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const AdminAnalyticsPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  
  // 状态
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  
  // 筛选条件
  const [startDateStr, setStartDateStr] = useState<string>(formatDateToString(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));
  const [endDateStr, setEndDateStr] = useState<string>(formatDateToString(new Date()));
  const [timePeriod, setTimePeriod] = useState<string>('daily');
  
  // 标签页
  const [tabValue, setTabValue] = useState(0);
  
  // 通知状态
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  
  // 确保用户是管理员
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (String(user.role).toLowerCase() !== 'admin') {
      navigate('/');
      showSnackbar('只有管理员可以访问此页面', 'error');
    }
  }, [user, navigate]);
  
  // 加载数据
  useEffect(() => {
    if (user && String(user.role).toLowerCase() === 'admin') {
      fetchAnalytics();
    }
  }, [user]);
  
  // 标签页切换
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // 获取分析数据
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: AnalyticsParams = {
        start_date: startDateStr,
        end_date: endDateStr,
        time_period: timePeriod as any
      };
      
      const response = await analyticsApi.getAnalyticsSummary(params);
      
      if (response) {
        setAnalytics(response);
      } else {
        setError('服务器返回了空的数据');
      }
    } catch (err: any) {
      console.error('获取分析数据失败:', err);
      setError(err.message || '获取分析数据失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // 应用筛选条件
  const handleApplyFilter = () => {
    fetchAnalytics();
  };
  
  // 重置筛选条件
  const handleResetFilter = () => {
    setStartDateStr(formatDateToString(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));
    setEndDateStr(formatDateToString(new Date()));
    setTimePeriod('daily');
    // 使用延迟以确保状态更新
    setTimeout(() => {
      fetchAnalytics();
    }, 0);
  };
  
  // 刷新数据
  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };
  
  // 显示通知
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };
  
  // 关闭通知
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };
  
  // 导出数据为CSV
  const handleExportCSV = () => {
    if (!analytics) return;
    
    // 创建CSV内容
    let csvContent = "数据,值\n";
    
    // 添加摘要数据
    csvContent += `总用户数,${analytics.summary.total_users}\n`;
    csvContent += `总订单数,${analytics.summary.total_orders}\n`;
    csvContent += `总收入,${analytics.summary.total_revenue}\n`;
    csvContent += `总产品数,${analytics.summary.total_products}\n`;
    csvContent += `平均订单价值,${analytics.summary.average_order_value}\n`;
    csvContent += `新用户数,${analytics.summary.new_users_count}\n`;
    csvContent += `转化率,${analytics.summary.conversion_rate}%\n\n`;
    
    // 添加销售数据
    csvContent += "时间,销售额\n";
    analytics.sales_over_time.forEach(item => {
      csvContent += `${item.label},${item.value}\n`;
    });
    
    csvContent += "\n订单数据\n";
    csvContent += "时间,订单数\n";
    analytics.orders_over_time.forEach(item => {
      csvContent += `${item.label},${item.value}\n`;
    });
    
    // 创建下载链接
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `电商平台数据分析_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showSnackbar('数据已导出为CSV文件', 'success');
  };
  
  // 如果正在加载，显示加载指示器
  if (loading && !refreshing) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        数据分析
      </Typography>
      
      {/* 筛选工具栏 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              label="开始日期"
              type="date"
              value={startDateStr}
              onChange={(e) => setStartDateStr(e.target.value)}
              fullWidth
              size="small"
              InputLabelProps={{
                shrink: true,
              }}
              helperText="格式: YYYY-MM-DD"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="结束日期"
              type="date"
              value={endDateStr}
              onChange={(e) => setEndDateStr(e.target.value)}
              fullWidth
              size="small"
              InputLabelProps={{
                shrink: true,
              }}
              helperText="格式: YYYY-MM-DD"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>时间周期</InputLabel>
              <Select
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value)}
                label="时间周期"
              >
                <MenuItem value="daily">每日</MenuItem>
                <MenuItem value="weekly">每周</MenuItem>
                <MenuItem value="monthly">每月</MenuItem>
                <MenuItem value="yearly">每年</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4} sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={handleApplyFilter}
              size="small"
            >
              应用筛选
            </Button>
            <Button
              variant="outlined"
              onClick={handleResetFilter}
              size="small"
            >
              重置
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={refreshing}
              size="small"
            >
              {refreshing ? '刷新中...' : '刷新'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportCSV}
              disabled={!analytics}
              size="small"
            >
              导出CSV
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* 错误提示 */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}
      
      {/* 数据摘要卡片 */}
      {analytics && (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">总用户数</Typography>
                  <Typography variant="h4">{analytics.summary.total_users}</Typography>
                  <Typography variant="body2" color="success.main">
                    +{analytics.summary.new_users_count} 新用户
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">总订单数</Typography>
                  <Typography variant="h4">{analytics.summary.total_orders}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    转化率: {formatPercent(analytics.summary.conversion_rate)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">总收入</Typography>
                  <Typography variant="h4">{formatCurrency(analytics.summary.total_revenue)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    平均订单: {formatCurrency(analytics.summary.average_order_value)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">总产品数</Typography>
                  <Typography variant="h4">{analytics.summary.total_products}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          {/* 标签页 */}
          <Paper sx={{ width: '100%', mb: 3 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="analytics tabs">
                <Tab label="销售趋势" icon={<ChartIcon />} iconPosition="start" />
                <Tab label="订单分析" icon={<DateRangeIcon />} iconPosition="start" />
                <Tab label="产品和类别" icon={<BarChart />} iconPosition="start" />
                <Tab label="用户分布" icon={<PieChart />} iconPosition="start" />
              </Tabs>
            </Box>
            
            {/* 销售趋势标签页 */}
            <TabPanel value={tabValue} index={0}>
              <Typography variant="h6" gutterBottom>
                销售趋势
              </Typography>
              <Box sx={{ height: 400, mb: 4 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={analytics.sales_over_time}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <RechartsTooltip 
                      formatter={(value) => formatCurrency(Number(value))} 
                      labelFormatter={(label) => `日期: ${label}`} 
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name="销售额"
                      stroke={theme.palette.primary.main}
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
              
              <Typography variant="subtitle1" gutterBottom>
                销售额变化趋势分析
              </Typography>
              <Typography variant="body2" paragraph>
                通过分析过去一段时间的销售数据，我们可以看到销售额整体呈现出增长趋势。
                日均销售额约为 {formatCurrency(analytics.sales_over_time.reduce((sum, item) => sum + item.value, 0) / analytics.sales_over_time.length)}。
                销售高峰主要出现在周末和节假日，这表明消费者在闲暇时间有更强的购买意愿。
              </Typography>
            </TabPanel>
            
            {/* 订单分析标签页 */}
            <TabPanel value={tabValue} index={1}>
              <Typography variant="h6" gutterBottom>
                订单分析
              </Typography>
              <Box sx={{ height: 400, mb: 4 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={analytics.orders_over_time}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <RechartsTooltip 
                      formatter={(value) => Number(value).toFixed(0)} 
                      labelFormatter={(label) => `日期: ${label}`} 
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name="订单数"
                      stroke={theme.palette.secondary.main}
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
              
              <Typography variant="subtitle1" gutterBottom>
                订单量与转化率分析
              </Typography>
              <Typography variant="body2" paragraph>
                订单总量为 {analytics.summary.total_orders}，平均订单价值为 {formatCurrency(analytics.summary.average_order_value)}。
                当前转化率为 {formatPercent(analytics.summary.conversion_rate)}，相比行业标准（约2-3%）处于良好水平。
                我们可以通过优化结账流程和提供个性化推荐来进一步提高转化率。
              </Typography>
            </TabPanel>
            
            {/* 产品和类别标签页 */}
            <TabPanel value={tabValue} index={2}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    热门产品
                  </Typography>
                  <Box sx={{ height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analytics.top_products}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis yAxisId="left" orientation="left" stroke={theme.palette.primary.main} />
                        <YAxis yAxisId="right" orientation="right" stroke={theme.palette.secondary.main} />
                        <RechartsTooltip />
                        <Legend />
                        <Bar 
                          yAxisId="left" 
                          dataKey="value" 
                          name="销售额" 
                          fill={theme.palette.primary.main} 
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar 
                          yAxisId="right" 
                          dataKey="count" 
                          name="销售量" 
                          fill={theme.palette.secondary.main}
                          radius={[4, 4, 0, 0]} 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    类别收入
                  </Typography>
                  <Box sx={{ height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analytics.revenue_by_category}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="category" type="category" />
                        <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                        <Bar 
                          dataKey="value" 
                          name="销售额" 
                          fill={theme.palette.info.main}
                          radius={[0, 4, 4, 0]} 
                        >
                          {analytics.revenue_by_category.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>
              </Grid>
            </TabPanel>
            
            {/* 用户分布标签页 */}
            <TabPanel value={tabValue} index={3}>
              <Typography variant="h6" gutterBottom>
                用户角色分布
              </Typography>
              <Box sx={{ height: 400, display: 'flex', justifyContent: 'center' }}>
                <ResponsiveContainer width="80%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.users_by_role}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="category"
                      label={({ category, count, percent }) => 
                        `${category}: ${count} (${(percent * 100).toFixed(1)}%)`
                      }
                    >
                      {analytics.users_by_role.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value, name, props) => [value, props.payload.category]} 
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              
              <Typography variant="subtitle1" gutterBottom align="center">
                用户分布分析
              </Typography>
              <Typography variant="body2" paragraph align="center">
                平台总用户数为 {analytics.summary.total_users}，其中普通用户占比最大，
                表明我们的平台主要服务于终端消费者。管理员和供应商数量相对较少，
                符合电商平台的典型用户分布特征。
              </Typography>
            </TabPanel>
          </Paper>
        </>
      )}
      
      {/* 提示消息 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminAnalyticsPage; 