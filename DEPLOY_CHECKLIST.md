# 📋 部署检查清单 - 绝对不能忘！

---

## ✅ 每次部署前检查

### 1. 代码已提交到 GitHub
- [ ] `git add .`
- [ ] `git commit -m "描述更改"`
- [ ] `git push`

### 2. 重要文件已配置
- [ ] `railway.json` 存在（已存在）
- [ ] `package.json` 有 `start` 脚本（已存在）
- [ ] `.gitignore` 排除临时数据文件（已配置）

### 3. Railway 配置
- [ ] 项目连接到 GitHub 仓库
- [ ] 环境变量已设置（可选）：
  - `CAPTCHA_APP_ID=192339751`
  - `CAPTCHA_SECRET_KEY=4inhWL7rtPiyS1QU5IqnLlv86`
  - `BREVO_API_KEY=` (可选)
  - `BREVO_SENDER_EMAIL=` (可选)

### 4. 收款码已上传
- [ ] 访问 `/upload.html` 上传支付宝收款码
- [ ] 或直接放入 `/public/images/alipay_qr.png`

---

## 🚀 部署步骤（Railway）

### 步骤 1：登录 Railway
访问 https://railway.app

### 步骤 2：导入 GitHub 项目
1. 点击 "New Project"
2. 选择 "Deploy from GitHub repo"
3. 选择 `jiangtengqiao/novel-payment` 仓库
4. 选择 `main` 分支

### 步骤 3：等待部署完成
Railway 会自动：
- 检测 Node.js
- 安装 `npm install`
- 运行 `npm start`

### 步骤 4：获取公网域名
部署完成后，Railway 会分配一个域名，格式类似：
```
https://novel-payment-production.up.railway.app
```

### 步骤 5：验证部署成功
访问你的域名，应该看到：
- 宏大官网首页
- 书籍列表
- 协议链接
- 所有功能正常

---

## 📱 部署后必须检查的功能

### 首页
- [ ] 访问 `/` 看到宏大首页
- [ ] 轮播图正常显示
- [ ] 书籍列表加载成功
- [ ] 排行榜正常

### 阅读器
- [ ] 点击书籍进入阅读器
- [ ] 目录面板显示章节
- [ ] 字体大小调整正常
- [ ] 主题切换正常
- [ ] 章节内容完整（2000-4000字，不是两行！）

### 协议
- [ ] 点击"用户协议"跳转正常
- [ ] 点击"隐私政策"跳转正常
- [ ] 协议内容完整

### 返回按钮
- [ ] 阅读器有返回按钮
- [ ] 协议页有返回按钮
- [ ] 所有页面都能正常返回

---

## 🔧 记住这些关键文件

| 文件 | 作用 | 路径 |
|------|------|------|
| 宏大首页 | 官网首页 | [public/index.html](file:///workspace/public/index.html) |
| 阅读器 | 阅读和设置 | [public/reader.html](file:///workspace/public/reader.html) |
| 协议中心 | 用户协议等 | [public/agreements.html](file:///workspace/public/agreements.html) |
| 真实小说数据 | 6本热门小说 | [db/init-books.js](file:///workspace/db/init-books.js) |
| 协议数据 | 用户协议等 | [data/agreements.json](file:///workspace/data/agreements.json) |
| 爬虫服务 | 定时爬取 | [services/crawler.js](file:///workspace/services/crawler.js) |
| 主服务器 | 启动入口 | [server.js](file:///workspace/server.js) |
| 部署配置 | Railway配置 | [railway.json](file:///workspace/railway.json) |
| 部署文档 | 详细指南 | [README.md](file:///workspace/README.md) |

---

## ⚠️ 绝对不能忘！

1. **协议最后更新时间**：固定为 2026-05-16，不允许作假
2. **章节内容**：每章2000-4000字，不是两行！
3. **返回按钮**：所有页面必须有返回按钮
4. **定时爬虫**：每小时第0分钟自动执行
5. **腾讯云验证码**：APP ID 192339751，Secret Key 4inhWL7rtPiyS1QU5IqnLlv86
6. **收款码**：必须上传支付宝收款码才能使用支付功能

---

## 📞 紧急修复清单

如果部署后有问题，检查：

- [ ] `server.js` 第 0 行？不，从头看日志
- [ ] 确认所有依赖都安装了（`npm install`）
- [ ] 确认端口 3000 没被占用
- [ ] 查看 Railway 控制台的日志

---

## ✨ 部署成功标志

看到以下日志表示部署成功：
```
初始化圈子数据...
已创建 4 个默认圈子
正在清空示例数据...
示例数据已清空
📚 初始化真实小说数据...
✅ 初始化完成！共 6 本小说，9 个章节
🕷️  启动后台爬虫...
⏰ 设置每小时定时爬虫任务...
✅ 定时爬虫已设置！
小说平台服务器运行在 http://0.0.0.0:3000
```

---

**最后更新：2026-05-16**
**记住：每次部署前看这个清单！**
