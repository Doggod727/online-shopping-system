import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Container,
  TextField,
  Alert
} from '@mui/material';
import axios from 'axios';

const TokenTest: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [testResult, setTestResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleTestToken = async () => {
    if (!token) {
      setError('没有找到token');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('http://localhost:8080/api/test/token', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setTestResult(response.data);
      console.log('测试成功:', response.data);
    } catch (err: any) {
      console.error('测试失败:', err);
      setError(err.response?.data?.message || '测试失败');
      setTestResult(err.response?.data || null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshToken = () => {
    const currentToken = localStorage.getItem('token');
    setToken(currentToken);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Token测试工具
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          当前Token
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
            {token || '未找到token'}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button variant="contained" onClick={handleTestToken} disabled={!token || loading}>
            {loading ? '测试中...' : '测试Token'}
          </Button>
          <Button variant="outlined" onClick={handleRefreshToken}>
            刷新Token
          </Button>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {testResult && (
          <Box>
            <Typography variant="h6" gutterBottom>
              测试结果
            </Typography>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', background: '#f5f5f5', padding: '1rem' }}>
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default TokenTest;