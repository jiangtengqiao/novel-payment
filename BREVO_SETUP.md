# Brevo 邮件服务配置指南

## 快速开始

### 1. 注册Brevo账号
访问 https://www.brevo.com 注册免费账号（每天300封免费邮件）

### 2. 获取API密钥
- 登录后 → 右上角头像 → SMTP & API
- 点击 API Keys 标签
- 生成新的API密钥，复制保存

### 3. 配置环境变量
在项目根目录创建 `.env` 文件：

```env
BREVO_API_KEY=你的API密钥
```

### 4. 安装SDK
```bash
npm install @getbrevo/brevo
```

### 5. 重启服务器
```bash
node server.js
```

## 使用说明

配置好后，用户注册时验证码会通过Brevo自动发送到用户邮箱！
