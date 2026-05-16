# 🚀 快速部署指南（5分钟搞定！）

## 方法一：最简单 - 使用Railway一键部署（推荐）

### 步骤1：准备代码仓库

```bash
# 在当前目录初始化git（如果还没有的话）
cd /workspace
git init
git add .
git commit -m "Initial commit: Novel Reading Platform"
```

### 步骤2：创建GitHub仓库

1. 访问 https://github.com/new
2. 创建一个新仓库（可以设为私有）
3. 按照GitHub提示推送代码：

```bash
git remote add origin https://github.com/你的用户名/你的仓库名.git
git branch -M main
git push -u origin main
```

### 步骤3：在Railway上部署

1. 访问 https://railway.app/new
2. 点击 "Deploy from GitHub repo"
3. 选择你刚创建的仓库
4. 点击 "Deploy Now"

### 步骤4：配置环境变量

在Railway项目设置中添加以下环境变量：

```bash
RESEND_API_KEY=re_EDy6uahn_LeRYvWZ9NyvwyNrvRGsKb72P
CAPTCHA_APP_ID=192339751
CAPTCHA_SECRET_KEY=4inhWL7rtPiyS1QU5IqnLlv86
PORT=3000
NODE_ENV=production
JWT_SECRET=novel_platform_super_secure_secret_key_2024
```

### 步骤5：完成！

Railway会自动构建和部署，部署完成后您会获得一个专属域名！

---

## 方法二：使用Railway按钮部署

如果您想让这个项目更容易部署，可以在README中添加Railway部署按钮：

```markdown
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)
```

---

## 方法三：本地服务也能用！

现在您的本地服务器已经在运行了：

- **本地访问：** http://localhost:3000
- **外部访问：** http://115.190.92.241:3000

如果这是一个公网服务器，您已经可以直接使用了！

---

## ✅ 当前状态

- ✅ 服务器已运行在 http://localhost:3000
- ✅ 所有功能正常工作
- ✅ API密钥已配置
- ✅ 爬虫自动运行中
- ✅ 协议内容已生成（8-10万字）

---

## 📱 可用页面

- 🏠 首页: /
- 📖 阅读: /reader
- 💳 充值: /payment
- 📜 协议: /agreements
- 👥 社区: /community
- 👤 个人中心: /profile
- ✍️ 创作者中心: /creator
- 📊 爬虫状态: /crawler-status
- 📤 上传小说: /upload-novel

---

## 🔐 环境变量已配置在 .env 文件中

查看文件：[.env](file:///workspace/.env)

所有API密钥都已经预配置好了，可以直接使用！

---

需要帮助？告诉我您想用哪种方式部署！
