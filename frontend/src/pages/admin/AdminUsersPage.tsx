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
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { RootState } from '../../store';
import { userManagementApi, User, UpdateUserDto } from '../../utils/api';
import { UserRole } from '../../types/auth';

const AdminUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  
  // 用户列表状态
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  // 分页状态
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // 筛选状态
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  // 编辑用户对话框
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editedRole, setEditedRole] = useState<string>('');
  const [editLoading, setEditLoading] = useState<boolean>(false);
  
  // 创建用户对话框
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [newUserEmail, setNewUserEmail] = useState<string>('');
  const [newUserPassword, setNewUserPassword] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<string>(UserRole.CUSTOMER);
  const [createLoading, setCreateLoading] = useState<boolean>(false);
  
  // 删除用户对话框
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  
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
  
  // 获取所有用户
  useEffect(() => {
    if (user && String(user.role).toLowerCase() === 'admin') {
      fetchUsers();
    }
  }, [user]);
  
  // 获取用户数据
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await userManagementApi.getAllUsers();
      console.log('获取到用户数据:', response);
      
      if (response && Array.isArray(response) && response.length > 0) {
        setUsers(response);
        setFilteredUsers(response);
      } else {
        console.warn('API返回了空的用户列表或非数组格式');
        
        setUsers([]);
        setFilteredUsers([]);
        setError('服务器返回了空的用户列表');
      }
    } catch (err: any) {
      console.error('获取用户列表失败:', err);
      
      setError(err.message || '获取用户列表失败');
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // 应用筛选器
  useEffect(() => {
    if (!users.length) return;
    
    let result = [...users];
    
    // 按角色筛选
    if (roleFilter !== 'all') {
      result = result.filter(user => 
        String(user.role).toLowerCase() === roleFilter.toLowerCase()
      );
    }
    
    // 按搜索词筛选
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(user => 
        user.email.toLowerCase().includes(query) || 
        user.id.toLowerCase().includes(query)
      );
    }
    
    setFilteredUsers(result);
    setPage(0); // 重置到第一页
  }, [users, roleFilter, searchQuery]);
  
  // 处理页面变化
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  // 处理每页行数变化
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // 刷新用户列表
  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };
  
  // 打开编辑对话框
  const handleOpenEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditedRole(user.role);
    setEditDialogOpen(true);
  };
  
  // 关闭编辑对话框
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedUser(null);
    setEditedRole('');
  };
  
  // 保存编辑的用户
  const handleSaveEdit = async () => {
    if (!selectedUser) return;
    
    try {
      setEditLoading(true);
      
      const updateData: UpdateUserDto = {
        role: editedRole
      };
      
      await userManagementApi.updateUser(selectedUser.id, updateData);
      
      // 更新本地用户列表
      const updatedUsers = users.map(u => 
        u.id === selectedUser.id ? { ...u, role: editedRole } : u
      );
      
      setUsers(updatedUsers);
      showSnackbar(`用户 ${selectedUser.email} 角色已更新为 ${editedRole}`, 'success');
      handleCloseEditDialog();
    } catch (err: any) {
      console.error('更新用户失败:', err);
      showSnackbar(err.message || '更新用户失败', 'error');
    } finally {
      setEditLoading(false);
    }
  };
  
  // 打开创建用户对话框
  const handleOpenCreateDialog = () => {
    setCreateDialogOpen(true);
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserRole(UserRole.CUSTOMER);
  };
  
  // 关闭创建用户对话框
  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
  };
  
  // 创建新用户
  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      showSnackbar('请填写完整的用户信息', 'error');
      return;
    }
    
    try {
      setCreateLoading(true);
      
      const newUser = await userManagementApi.createUser({
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole
      });
      
      // 更新用户列表
      setUsers([...users, newUser]);
      showSnackbar(`新用户 ${newUser.email} 创建成功`, 'success');
      handleCloseCreateDialog();
    } catch (err: any) {
      console.error('创建用户失败:', err);
      showSnackbar(err.message || '创建用户失败', 'error');
    } finally {
      setCreateLoading(false);
    }
  };
  
  // 打开删除用户对话框
  const handleOpenDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };
  
  // 关闭删除用户对话框
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedUser(null);
  };
  
  // 删除用户
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      setDeleteLoading(true);
      
      await userManagementApi.deleteUser(selectedUser.id);
      
      // 更新用户列表
      const updatedUsers = users.filter(u => u.id !== selectedUser.id);
      setUsers(updatedUsers);
      
      showSnackbar(`用户 ${selectedUser.email} 已删除`, 'success');
      handleCloseDeleteDialog();
    } catch (err: any) {
      console.error('删除用户失败:', err);
      showSnackbar(err.message || '删除用户失败', 'error');
    } finally {
      setDeleteLoading(false);
    }
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
  
  // 获取角色显示名称
  const getRoleName = (role: string): string => {
    switch(String(role).toLowerCase()) {
      case 'admin':
        return '管理员';
      case 'vendor':
        return '供应商';
      case 'customer':
        return '普通用户';
      default:
        return role;
    }
  };
  
  // 获取角色标签颜色
  const getRoleColor = (role: string): 'primary' | 'secondary' | 'default' | 'error' | 'info' | 'success' | 'warning' => {
    switch(String(role).toLowerCase()) {
      case 'admin':
        return 'error';
      case 'vendor':
        return 'secondary';
      case 'customer':
        return 'primary';
      default:
        return 'default';
    }
  };
  
  // 格式化日期
  const formatDate = (dateString: string): string => {
    if (!dateString) return '未知';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // 重置筛选
  const handleResetFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
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
        用户管理
      </Typography>
      
      {/* 统计卡片 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">总用户数</Typography>
              <Typography variant="h4">{users.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">管理员数</Typography>
              <Typography variant="h4">
                {users.filter(u => String(u.role).toLowerCase() === 'admin').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">供应商数</Typography>
              <Typography variant="h4">
                {users.filter(u => String(u.role).toLowerCase() === 'vendor').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">普通用户数</Typography>
              <Typography variant="h4">
                {users.filter(u => String(u.role).toLowerCase() === 'customer').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* 筛选工具栏 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="搜索用户邮箱或ID"
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small" variant="outlined">
              <InputLabel>用户角色</InputLabel>
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                label="用户角色"
              >
                <MenuItem value="all">全部角色</MenuItem>
                <MenuItem value="admin">管理员</MenuItem>
                <MenuItem value="vendor">供应商</MenuItem>
                <MenuItem value="customer">普通用户</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={5} sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={handleResetFilters}
              disabled={searchQuery === '' && roleFilter === 'all'}
              size="small"
            >
              重置筛选
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
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateDialog}
              size="small"
            >
              添加用户
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* 错误提示 */}
      {error && (
        <Alert 
          severity={error.includes('当前显示模拟数据') ? 'info' : 'error'} 
          sx={{ mb: 3 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}
      
      {/* 用户列表 */}
      {filteredUsers.length === 0 ? (
        <Alert severity={users.length > 0 ? 'info' : 'warning'}>
          {users.length > 0
            ? '没有符合筛选条件的用户。请尝试调整筛选条件或重置筛选。' 
            : '系统中还没有任何用户或未能成功获取用户数据。'}
        </Alert>
      ) : (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>邮箱</TableCell>
                  <TableCell>角色</TableCell>
                  <TableCell>注册时间</TableCell>
                  <TableCell>最后更新</TableCell>
                  <TableCell width="140px">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.id.substring(0, 8)}...</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip 
                          label={getRoleName(user.role)} 
                          color={getRoleColor(user.role)}
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell>{formatDate(user.updated_at)}</TableCell>
                      <TableCell>
                        <Tooltip title="编辑用户">
                          <IconButton 
                            size="small" 
                            color="primary" 
                            onClick={() => handleOpenEditDialog(user)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="删除用户">
                          {String(user.role).toLowerCase() === 'admin' ? (
                            <span>
                              <IconButton 
                                size="small" 
                                color="error"
                                disabled={true}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </span>
                          ) : (
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleOpenDeleteDialog(user)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredUsers.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="每页行数"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} 共 ${count}`}
          />
        </Paper>
      )}
      
      {/* 编辑用户对话框 */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog}>
        <DialogTitle>编辑用户</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ pt: 1, minWidth: '400px' }}>
              <Typography variant="body1" gutterBottom>
                用户邮箱: {selectedUser.email}
              </Typography>
              <Typography variant="body1" gutterBottom>
                用户ID: {selectedUser.id}
              </Typography>
              <FormControl fullWidth margin="normal">
                <InputLabel>用户角色</InputLabel>
                <Select
                  value={editedRole}
                  onChange={(e) => setEditedRole(e.target.value)}
                  label="用户角色"
                >
                  <MenuItem value="admin">管理员</MenuItem>
                  <MenuItem value="vendor">供应商</MenuItem>
                  <MenuItem value="customer">普通用户</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>取消</Button>
          <Button 
            onClick={handleSaveEdit} 
            variant="contained" 
            color="primary"
            disabled={editLoading || !selectedUser || selectedUser.role === editedRole}
          >
            {editLoading ? '保存中...' : '保存'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 创建用户对话框 */}
      <Dialog open={createDialogOpen} onClose={handleCloseCreateDialog}>
        <DialogTitle>创建新用户</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, minWidth: '400px' }}>
            <TextField
              fullWidth
              label="用户邮箱"
              variant="outlined"
              margin="normal"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              required
            />
            <TextField
              fullWidth
              label="密码"
              type="password"
              variant="outlined"
              margin="normal"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              required
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>用户角色</InputLabel>
              <Select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value)}
                label="用户角色"
              >
                <MenuItem value="admin">管理员</MenuItem>
                <MenuItem value="vendor">供应商</MenuItem>
                <MenuItem value="customer">普通用户</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog}>取消</Button>
          <Button 
            onClick={handleCreateUser} 
            variant="contained" 
            color="primary"
            disabled={createLoading || !newUserEmail || !newUserPassword}
          >
            {createLoading ? '创建中...' : '创建'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 删除用户确认对话框 */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>确认删除用户</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Typography variant="body1">
              确定要删除用户 <b>{selectedUser.email}</b> 吗？此操作不可撤销。
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>取消</Button>
          <Button 
            onClick={handleDeleteUser} 
            variant="contained" 
            color="error"
            disabled={deleteLoading}
          >
            {deleteLoading ? '删除中...' : '确认删除'}
          </Button>
        </DialogActions>
      </Dialog>
      
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

export default AdminUsersPage; 