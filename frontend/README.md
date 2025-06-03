# 在线购物系统前端

这是在线购物管理系统的前端部分，使用React、TypeScript和Material-UI (MUI) v5开发。

## 项目设置

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm start
```

应用将在 [http://localhost:3000](http://localhost:3000) 运行。

### 构建生产版本

```bash
npm run build
```

## 项目结构

- `src/components/` - 可复用组件
- `src/pages/` - 页面组件
- `src/store/` - Redux状态管理
- `src/utils/` - 工具函数和API服务

## 主要功能

- 用户认证（登录/注册）
- 管理员仪表盘
- 产品浏览和管理
- 订单处理

## 测试账户

目前系统实现了模拟登录功能。可以使用任意邮箱和密码进行登录测试，系统会自动将用户导航到管理员仪表盘。 