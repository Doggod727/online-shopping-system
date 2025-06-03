# 在线购物管理系统安装指南

本文档提供了在Windows和Linux/macOS环境下安装和配置在线购物管理系统的详细步骤。

## 系统要求

在开始安装本系统前，请确保您的计算机已安装以下软件：

### 必需软件

1. **MySQL** (8.0 或更高版本)
   - 下载链接：https://dev.mysql.com/downloads/installer/
   - 安装指南：https://dev.mysql.com/doc/refman/8.0/en/installing.html
   - 安装时请设置root用户密码为 `password`（或记住您设置的密码）

2. **Node.js** (16.x 或更高版本)
   - 下载链接：https://nodejs.org/
   - 安装指南：https://nodejs.org/en/download/package-manager/
   - 安装完成后，验证安装：`node -v` 和 `npm -v`

3. **Rust** (1.60 或更高版本)
   - 下载链接：https://www.rust-lang.org/tools/install
   - 安装指南：https://www.rust-lang.org/learn/get-started
   - 安装完成后，验证安装：`rustc --version` 和 `cargo --version`

4. **Git** (用于克隆代码库)
   - 下载链接：https://git-scm.com/downloads
   - 安装指南：https://git-scm.com/book/en/v2/Getting-Started-Installing-Git
   - 安装完成后，验证安装：`git --version`

### 推荐工具

- **Visual Studio Code**：推荐的代码编辑器
  - 下载链接：https://code.visualstudio.com/

## 安装步骤

### 1. 克隆代码库

```bash
git clone https://github.com/Doggod727/online-shopping-system.git
cd online-shopping-system
```

### 2. 设置数据库

1. 启动MySQL服务（如果尚未启动）
   ```bash
   # Windows
   net start MySQL
   
   # Linux/macOS
   sudo systemctl start mysql
   ```

2. 创建数据库并导入数据
   ```bash
   # 登录MySQL
   mysql -u root -p
   
   # 在MySQL命令行中执行
   CREATE DATABASE online_shopping;
   EXIT;
   
   # 导入数据库脚本
   mysql -u root -p online_shopping < db_scripts/setup_database.sql
   ```

### 3. 安装前端依赖

```bash
cd frontend
npm install
```

### 4. 安装后端依赖

```bash
cd backend
cargo build
```

### 5. 启动系统

1. 启动后端服务
   ```bash
   # 在backend目录下
   # Windows
   set DATABASE_URL=mysql://root:password@localhost/online_shopping
   set REDIS_URL=redis://127.0.0.1:6379/
   set HOST=127.0.0.1
   set PORT=8080
   set RUST_LOG=info
   cargo run
   
   # Linux/macOS
   export DATABASE_URL=mysql://root:password@localhost/online_shopping
   export REDIS_URL=redis://127.0.0.1:6379/
   export HOST=127.0.0.1
   export PORT=8080
   export RUST_LOG=info
   cargo run
   ```

2. 启动前端服务
   ```bash
   # 在frontend目录下
   npm start
   ```

3. 打开浏览器访问：
   - 前端界面: http://localhost:3000
   - 后端API: http://localhost:8080

## 默认账户

系统预设了以下账户，可用于测试：

1. 管理员账户：
   - 邮箱：admin@example.com
   - 密码：admin123

2. 商家账户：
   - 邮箱：vendor1@example.com
   - 密码：vendor1123

3. 顾客账户：
   - 邮箱：customer1@example.com
   - 密码：customer1123

## 常见问题

### MySQL连接问题

如果遇到MySQL连接问题，请检查：

1. MySQL服务是否正在运行
2. 用户名和密码是否正确
3. 数据库是否已创建

### 端口冲突

如果端口3000或8080已被占用，可以修改环境变量中的端口设置：

```bash
# 修改后端端口
# Windows
set PORT=8081

# Linux/macOS
export PORT=8081

# 修改前端端口（在package.json中或使用环境变量）
# Windows
set PORT=3001 && npm start

# Linux/macOS
PORT=3001 npm start
```

### 编译错误

如果遇到Rust编译错误，请确保您的Rust版本是最新的：

```bash
rustup update
```

如果遇到Node.js相关错误，请确保您的Node.js版本兼容：

```bash
node -v  # 应该是v16.x或更高版本
```

## 卸载

如果您需要卸载系统：

1. 停止所有正在运行的服务
2. 删除项目文件夹
3. 如果不再需要，可以卸载MySQL、Node.js和Rust

### 卸载MySQL

```bash
# Windows (使用控制面板)
# 控制面板 > 程序 > 程序和功能 > MySQL > 卸载

# Linux
sudo apt-get remove --purge mysql*

# macOS
brew uninstall mysql
```

### 卸载Node.js

```bash
# Windows (使用控制面板)
# 控制面板 > 程序 > 程序和功能 > Node.js > 卸载

# Linux
sudo apt-get remove nodejs

# macOS
brew uninstall node
```

### 卸载Rust

```bash
rustup self uninstall
``` 