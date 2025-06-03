# 在线购物系统故障排除指南

## 常见问题及解决方案

### 1. 后端启动错误 (exit code: 101)

这通常与数据库连接相关。请检查：

1. **MySQL服务是否运行**
   ```
   sc query MySQL
   ```
   如果未运行，启动服务：
   ```
   net start MySQL
   ```

2. **数据库是否存在**
   ```
   mysql -u root -p -e "SHOW DATABASES LIKE 'online_shopping';"
   ```
   如果不存在，运行初始化脚本：
   ```
   setup_database.bat
   ```

3. **环境变量是否正确设置**
   确保以下环境变量已正确设置：
   ```
   set DATABASE_URL=mysql://root:password@localhost/online_shopping
   ```
   注意：如果您的MySQL密码不是"password"，请相应修改。

4. **数据库用户权限**
   确保root用户有权限访问数据库：
   ```
   mysql -u root -p -e "GRANT ALL PRIVILEGES ON online_shopping.* TO 'root'@'localhost';"
   ```

### 2. 前端无法连接到后端

1. **检查后端是否正在运行**
   ```
   curl http://127.0.0.1:8080
   ```
   应该返回"Hello World!"或类似响应。

2. **检查CORS设置**
   后端已配置允许来自localhost:3000和127.0.0.1:3000的请求。

3. **检查API基础URL**
   在frontend/src/utils/api.ts中，确保baseURL设置正确：
   ```javascript
   baseURL: 'http://127.0.0.1:8080/api'
   ```

### 3. 登录问题

1. **使用预设账户**
   系统预设了以下账户：
   - 管理员: admin@example.com / admin123
   - 供应商: vendor1@example.com / vendor1123
   - 客户: customer1@example.com / customer1123

2. **密码格式**
   系统支持"邮箱前缀+123"格式的密码（如admin123）。

3. **检查数据库中的用户记录**
   ```
   mysql -u root -p -e "SELECT email, password_hash FROM online_shopping.users;"
   ```

### 4. 产品分页问题

如果管理员页面只显示部分产品：

1. **检查API响应**
   在浏览器开发者工具中查看网络请求，确保API返回了正确的数据。

2. **使用getAllProductsWithPagination**
   确保在AdminProductsPage.tsx中使用了getAllProductsWithPagination方法：
   ```javascript
   const response = await productApi.getAllProductsWithPagination();
   ```

### 5. 端口冲突

1. **检查端口是否被占用**
   ```
   netstat -ano | findstr :8080
   netstat -ano | findstr :3000
   ```

2. **更改端口**
   - 后端: 修改环境变量PORT
   - 前端: 在package.json中添加"start": "set PORT=3001 && react-scripts start"

## 重置系统

如果需要完全重置系统：

1. **删除数据库**
   ```
   mysql -u root -p -e "DROP DATABASE online_shopping;"
   ```

2. **重新创建数据库**
   ```
   setup_database.bat
   ```

3. **重启服务**
   ```
   start_system.bat
   ``` 