# 在线购物管理系统

基于React+TypeScript前端和Rust后端的在线购物管理系统。

## 项目概述

本项目是一个完整的在线购物管理系统，支持三种用户角色：客户、管理员和供应商。系统采用分层架构设计，包括前端（React/TypeScript）和后端（Rust/Actix-Web）。

### 主要功能

- 用户认证（注册、登录）
- 商品管理（浏览、搜索、添加到购物车）
- 购物车和结账
- 订单管理
- 管理员和供应商控制台
- 数据分析和报表

## 系统要求与前置资源

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
<<<<<<< HEAD
   set DATABASE_URL=mysql://root:password@localhost/online_shopping
=======
   set DATABASE_URL=mysql://root:123456@localhost/online_shopping
>>>>>>> 4dbf05f4695a4fbb6236377e2c5b754324caf69c
   set REDIS_URL=redis://127.0.0.1:6379/
   set HOST=127.0.0.1
   set PORT=8080
   set RUST_LOG=info
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

## 技术栈

### 前端
- React + TypeScript
- Material-UI (UI组件库)
- React Router (路由)
- Axios (HTTP客户端)
- Recharts (图表)
- MUI Date Pickers (日期选择器)

### 后端
- Rust
- Actix-Web (Web框架)
- Diesel (ORM)
- MySQL (数据库)
- JWT (身份验证)

## 项目结构

```
project/
├── frontend/                # React前端
│   ├── public/              # 静态文件
│   └── src/                 # 源代码
│       ├── components/      # 通用组件
│       │   ├── common/      # 公共组件
│       │   ├── layout/      # 布局组件
│       │   └── ui/          # UI组件
│       ├── features/        # 功能模块
│       │   ├── admin/       # 管理员功能
│       │   ├── auth/        # 认证功能
│       │   ├── cart/        # 购物车功能
│       │   ├── products/    # 商品功能
│       │   └── vendor/      # 供应商功能
│       ├── pages/           # 页面组件
│       ├── utils/           # 工具函数
│       └── App.tsx          # 应用入口
├── backend/                 # Rust后端
│   ├── src/                 # 源代码
│   │   ├── config/          # 配置
│   │   ├── handlers/        # 请求处理器
│   │   ├── models/          # 数据模型
│   │   ├── services/        # 业务逻辑
│   │   ├── utils/           # 工具函数
│   │   └── main.rs          # 应用入口
│   └── Cargo.toml           # Rust依赖配置
└── db_scripts/              # 数据库脚本
```

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
set PORT=8081

# 修改前端端口（在package.json中或使用环境变量）
set PORT=3001 && npm start
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

## 贡献

欢迎贡献代码、报告问题或提出改进建议。请遵循以下步骤：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 详情请参阅 LICENSE 文件。

## 已实现功能

### 用户认证
- 用户登录
- 基于JWT的身份验证
- 基于角色的访问控制

### 产品管理
- 产品列表和详情
- 产品分类和筛选
- 产品搜索

### 购物车
- 添加产品到购物车
- 查看和编辑购物车
- 结账流程

### 订单管理
- 创建订单
- 查看订单历史
- 订单状态更新

### 管理员功能
- 系统设置
- 用户管理
- 订单管理
- 销售分析报表

### 供应商功能
- 产品管理
- 库存管理
- 订单处理

## 系统要求

- Windows 10 或更高版本
- MySQL 8.0 或更高版本
- Node.js 16.x 或更高版本
- Rust 1.60 或更高版本

## 常见问题

常见问题及解决方案请参阅 [INSTALL.md](INSTALL.md) 文件中的"常见问题"部分。
