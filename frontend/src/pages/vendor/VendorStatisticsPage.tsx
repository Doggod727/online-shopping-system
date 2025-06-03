import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  Box, 
  CircularProgress, 
  Alert,
  Button,
  Divider,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab
} from '@mui/material';
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { orderApi } from '../../utils/api';
import { productApi } from '../../utils/api';
import { OrderStatus } from '../../types/order';

// 产品类型
interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category?: string;
}

// 订单项类型
interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
}

// 订单类型
interface Order {
  id: string;
  user_id: string;
  total: number;
  status: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

// 销售统计类型
interface SalesData {
  date: string;
  sales: number;
  orders: number;
}

// 商品销售分析
interface ProductSalesData {
  productId: string;
  productName: string;
  quantity: number;
  revenue: number;
}

// 销售分类统计
interface CategorySalesData {
  category: string;
  sales: number;
  percentage: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const VendorStatisticsPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [productSalesData, setProductSalesData] = useState<ProductSalesData[]>([]);
  const [categorySalesData, setCategorySalesData] = useState<CategorySalesData[]>([]);
  
  const [timeRange, setTimeRange] = useState<string>('week');
  const [tabValue, setTabValue] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // 获取供应商订单
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await orderApi.getVendorOrders();
      
      let fetchedOrders: Order[] = [];
      if (Array.isArray(response)) {
        fetchedOrders = response;
      } else if (response && typeof response === 'object' && 'orders' in response) {
        fetchedOrders = response.orders;
      }
      
      setOrders(fetchedOrders);
      
      // 完成订单加载后处理统计数据
      if (fetchedOrders.length > 0) {
        console.log('成功获取到 ' + fetchedOrders.length + ' 个订单用于统计');
      }
    } catch (err: any) {
      console.error('获取订单数据失败:', err);
      setError(err.response?.data?.message || '获取订单数据失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 获取供应商产品
  const fetchProducts = async () => {
    try {
      const productsData = await productApi.getVendorProducts();
      const productsMap: Record<string, Product> = {};
      productsData.forEach((product: Product) => {
        productsMap[product.id] = product;
      });
      setProducts(productsMap);
    } catch (err) {
      console.error('获取产品失败:', err);
    }
  };
  
  // 处理时间范围变化
  const handleTimeRangeChange = (event: any) => {
    setTimeRange(event.target.value);
  };
  
  // 处理标签页变化
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // 刷新数据
  const handleRefresh = () => {
    fetchOrders();
    fetchProducts();
  };
  
  // 根据时间范围过滤订单
  const filterOrdersByTimeRange = (orders: Order[], range: string): Order[] => {
    const now = new Date();
    const filtered = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      
      switch(range) {
        case 'today':
          return orderDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now);
          weekAgo.setDate(now.getDate() - 7);
          return orderDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now);
          monthAgo.setMonth(now.getMonth() - 1);
          return orderDate >= monthAgo;
        case 'year':
          const yearAgo = new Date(now);
          yearAgo.setFullYear(now.getFullYear() - 1);
          return orderDate >= yearAgo;
        default:
          return true;
      }
    });
    
    return filtered;
  };
  
  // 处理销售数据统计
  const processStatisticsData = () => {
    if (orders.length === 0) return;
    
    const filteredOrders = filterOrdersByTimeRange(orders, timeRange);
    
    // 统计每日销售数据
    const salesByDate = new Map<string, { sales: number, orders: number }>();
    
    // 统计产品销售数据
    const productSales = new Map<string, { quantity: number, revenue: number }>();
    
    // 统计分类销售数据
    const categorySales = new Map<string, number>();
    let totalSales = 0;
    
    filteredOrders.forEach(order => {
      // 不再过滤订单状态，统计所有订单
      
      // 日期格式化为YYYY-MM-DD
      const date = new Date(order.created_at).toISOString().split('T')[0];
      
      // 累计每日销售额和订单数
      const dailySales = salesByDate.get(date) || { sales: 0, orders: 0 };
      dailySales.sales += order.total;
      dailySales.orders += 1;
      salesByDate.set(date, dailySales);
      
      // 累计产品销售数据
      order.items.forEach(item => {
        // 产品销售统计
        const productId = item.product_id;
        const currentProductSales = productSales.get(productId) || { quantity: 0, revenue: 0 };
        currentProductSales.quantity += item.quantity;
        currentProductSales.revenue += item.price * item.quantity;
        productSales.set(productId, currentProductSales);
        
        // 分类销售统计
        const product = products[productId];
        if (product) {
          const category = product.category || '未分类';
          const currentCategorySales = categorySales.get(category) || 0;
          const itemRevenue = item.price * item.quantity;
          categorySales.set(category, currentCategorySales + itemRevenue);
          totalSales += itemRevenue;
        }
      });
    });
    
    // 转换为图表数据格式
    const salesChartData: SalesData[] = Array.from(salesByDate.entries())
      .map(([date, data]) => ({
        date,
        sales: parseFloat(data.sales.toFixed(2)),
        orders: data.orders
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    setSalesData(salesChartData);
    
    // 处理产品销售数据
    const productSalesArray: ProductSalesData[] = Array.from(productSales.entries())
      .map(([productId, data]) => ({
        productId,
        productName: products[productId]?.name || '未知产品',
        quantity: data.quantity,
        revenue: parseFloat(data.revenue.toFixed(2))
      }))
      .sort((a, b) => b.revenue - a.revenue);
    
    setProductSalesData(productSalesArray);
    
    // 处理分类销售数据
    const categorySalesArray: CategorySalesData[] = Array.from(categorySales.entries())
      .map(([category, sales]) => ({
        category,
        sales: parseFloat(sales.toFixed(2)),
        percentage: totalSales > 0 ? parseFloat(((sales / totalSales) * 100).toFixed(2)) : 0
      }))
      .sort((a, b) => b.sales - a.sales);
    
    setCategorySalesData(categorySalesArray);
  };
  
  // 获取统计概览数据
  const getStatisticsOverview = () => {
    const filteredOrders = filterOrdersByTimeRange(orders, timeRange);
    
    // 统计所有订单，不再只计算已完成和已发货的订单
    
    // 计算总销售额
    const totalSales = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    
    // 计算总订单数
    const orderCount = filteredOrders.length;
    
    // 计算平均订单金额
    const averageOrderValue = orderCount > 0 ? totalSales / orderCount : 0;
    
    // 计算已售商品数量
    const soldItemsCount = filteredOrders.reduce((sum, order) => 
      sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );
    
    return {
      totalSales: parseFloat(totalSales.toFixed(2)),
      orderCount,
      averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
      soldItemsCount
    };
  };
  
  // 获取订单状态统计
  const getOrderStatusStats = () => {
    const filteredOrders = filterOrdersByTimeRange(orders, timeRange);
    
    // 统计不同状态的订单数量
    const pendingCount = filteredOrders.filter(o => o.status.toLowerCase() === 'pending').length;
    const processingCount = filteredOrders.filter(o => o.status.toLowerCase() === 'processing').length;
    const shippedCount = filteredOrders.filter(o => o.status.toLowerCase() === 'shipped').length;
    const deliveredCount = filteredOrders.filter(o => o.status.toLowerCase() === 'delivered').length;
    const cancelledCount = filteredOrders.filter(o => o.status.toLowerCase() === 'cancelled').length;
    
    return [
      { name: '待处理', value: pendingCount, color: '#FFBB28' },
      { name: '处理中', value: processingCount, color: '#0088FE' },
      { name: '已发货', value: shippedCount, color: '#00C49F' },
      { name: '已完成', value: deliveredCount, color: '#8884D8' },
      { name: '已取消', value: cancelledCount, color: '#FF8042' }
    ];
  };
  
  // 初始化加载数据
  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);
  
  // 当订单、产品或时间范围变化时，重新处理统计数据
  useEffect(() => {
    if (orders.length > 0 && Object.keys(products).length > 0) {
      processStatisticsData();
    }
  }, [orders, products, timeRange]);
  
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }
  
  const stats = getStatisticsOverview();
  const orderStatusStats = getOrderStatusStats();
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          销售统计
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small">
            <InputLabel>时间范围</InputLabel>
            <Select
              value={timeRange}
              label="时间范围"
              onChange={handleTimeRangeChange}
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="today">今日</MenuItem>
              <MenuItem value="week">本周</MenuItem>
              <MenuItem value="month">本月</MenuItem>
              <MenuItem value="year">本年</MenuItem>
            </Select>
          </FormControl>
          
          <Button variant="outlined" onClick={handleRefresh}>
            刷新数据
          </Button>
        </Box>
      </Box>
      
      {/* 销售概览卡片 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                总销售额
              </Typography>
              <Typography variant="h4">¥{stats.totalSales}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                订单数
              </Typography>
              <Typography variant="h4">{stats.orderCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                平均订单金额
              </Typography>
              <Typography variant="h4">¥{stats.averageOrderValue}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                已售商品数量
              </Typography>
              <Typography variant="h4">{stats.soldItemsCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* 图表统计部分 */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
        >
          <Tab label="销售趋势" />
          <Tab label="商品销量" />
          <Tab label="分类统计" />
          <Tab label="订单状态" />
        </Tabs>
        
        {/* 销售趋势图表 */}
        {tabValue === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              销售趋势
            </Typography>
            <Box sx={{ height: 400 }}>
              {salesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={salesData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="sales" 
                      name="销售额(¥)" 
                      stroke="#8884d8" 
                      activeDot={{ r: 8 }} 
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="orders" 
                      name="订单数" 
                      stroke="#82ca9d" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography variant="body1" color="text.secondary">
                    暂无销售数据
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}
        
        {/* 商品销量图表 */}
        {tabValue === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              商品销量排行
            </Typography>
            <Box sx={{ height: 400 }}>
              {productSalesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={productSalesData.slice(0, 10)}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="productName" 
                      width={150}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="quantity" name="销售数量" fill="#8884d8" />
                    <Bar dataKey="revenue" name="销售额(¥)" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography variant="body1" color="text.secondary">
                    暂无商品销售数据
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}
        
        {/* 分类销售统计 */}
        {tabValue === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              分类销售统计
            </Typography>
            <Box sx={{ height: 400 }}>
              {categorySalesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categorySalesData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="sales"
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                    >
                      {categorySalesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `¥${value}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography variant="body1" color="text.secondary">
                    暂无分类销售数据
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}
        
        {/* 订单状态统计 */}
        {tabValue === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              订单状态统计
            </Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusStats}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {orderStatusStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        )}
      </Paper>
      
      {/* 热门商品详情 */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          热门商品详情
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        {productSalesData.length > 0 ? (
          <Stack spacing={2}>
            {productSalesData.slice(0, 5).map((product, index) => (
              <Card key={product.productId} variant="outlined">
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {index + 1}. {product.productName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        商品ID: {product.productId}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        销售数量
                      </Typography>
                      <Typography variant="h6">
                        {product.quantity}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        销售额
                      </Typography>
                      <Typography variant="h6">
                        ¥{product.revenue}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </Stack>
        ) : (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              暂无商品销售数据
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default VendorStatisticsPage; 