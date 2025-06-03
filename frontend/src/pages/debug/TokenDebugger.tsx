import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  TextField,
  Container
} from '@mui/material';

const TokenDebugger: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [decodedToken, setDecodedToken] = useState<any>(null);
  const [customToken, setCustomToken] = useState<string>('');

  useEffect(() => {
    // 从localStorage获取token
    const storedToken = localStorage.getItem('token');
    setToken(storedToken);
    
    if (storedToken) {
      try {
        // 解析JWT token（不验证签名）
        const parts = storedToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          setDecodedToken(payload);
        }
      } catch (error) {
        console.error('解析token失败:', error);
      }
    }
  }, []);

  const handleSaveToken = () => {
    if (customToken) {
      localStorage.setItem('token', customToken);
      setToken(customToken);
      
      try {
        // 解析JWT token（不验证签名）
        const parts = customToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          setDecodedToken(payload);
        }
      } catch (error) {
        console.error('解析token失败:', error);
      }
    }
  };

  const handleClearToken = () => {
    localStorage.removeItem('token');
    setToken(null);
    setDecodedToken(null);
  };

  const handleRefreshPage = () => {
    window.location.reload();
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Token调试工具
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
        
        <Typography variant="h6" gutterBottom>
          解析后的Token内容
        </Typography>
        <Box sx={{ mb: 2 }}>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {decodedToken ? JSON.stringify(decodedToken, null, 2) : '无法解析token'}
          </pre>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button variant="contained" color="error" onClick={handleClearToken}>
            清除Token
          </Button>
          <Button variant="contained" onClick={handleRefreshPage}>
            刷新页面
          </Button>
          <Button 
            variant="outlined" 
            color="primary"
            onClick={() => window.location.href = '/debug/test-token'}
          >
            测试Token
          </Button>
        </Box>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          设置自定义Token
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          value={customToken}
          onChange={(e) => setCustomToken(e.target.value)}
          placeholder="输入JWT token"
          sx={{ mb: 2 }}
        />
        <Button variant="contained" onClick={handleSaveToken} disabled={!customToken}>
          保存Token
        </Button>
      </Paper>
    </Container>
  );
};

export default TokenDebugger;