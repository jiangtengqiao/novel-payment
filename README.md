# 小说平台支付系统 - 配置与使用指南

## 📋 项目概述

这是一个完整的小说平台支付系统，支持：
- **书币充值**：用户可以充值书币用于后续购买
- **章节解锁**：用户可以直接购买单个章节
- **多端适配**：支持手机端和PC端网页支付
- **安全可靠**：采用支付宝官方SDK，包含完整的签名验签机制

---

## 🚀 快速开始

### 1. 配置支付宝参数

编辑 `config.js` 文件，填入你的支付宝应用信息：

```javascript
module.exports = {
  alipay: {
    appId: '你的应用APPID',          // 在支付宝开放平台获取
    privateKey: '你的应用私钥',       // 使用支付宝开发助手生成
    alipayPublicKey: '支付宝公钥',   // 在支付宝开放平台设置后获取
    gateway: 'https://openapi-sandbox.dl.alipaydev.com/gateway.do', // 沙箱环境
    // gateway: 'https://openapi.alipay.com/gateway.do', // 正式环境
    notifyUrl: 'http://你的域名:3000/api/alipay/notify',
    returnUrl: 'http://你的域名:3000/payment-success'
  },
  server: {
    port: 3000,
    host: 'localhost'
  }
};
```

### 2. 获取支付宝配置信息

#### 步骤1：创建应用
1. 访问 [支付宝开放平台](https://open.alipay.com/)
2. 登录后进入"控制台" → "我的应用"
3. 创建应用，选择"自研"类型
4. 获取 `APPID`

#### 步骤2：生成密钥
1. 下载 [支付宝开放平台开发助手](https://opendocs.alipay.com/common/02kipk)
2. 使用工具生成 RSA2 密钥对
3. 将生成的**应用私钥**填入配置
4. 将**应用公钥**上传到开放平台
5. 获取**支付宝公钥**填入配置

#### 步骤3：开通支付产品
1. 在商家平台开通以下产品：
   - 电脑网站支付（PC端）
   - 手机网站支付（H5端）
2. 确保产品状态为"已开通"

### 3. 配置回调地址

**注意**：回调地址必须公网可访问！

对于本地开发，可以使用内网穿透工具：
```bash
# 使用 ngrok
ngrok http 3000

# 或使用花生壳等其他工具
```

获取公网URL后，配置 `notifyUrl` 和 `returnUrl`。

### 4. 启动服务

```bash
# 开发环境
npm start

# 服务运行在 http://localhost:3000
```

### 5. 测试支付

1. 访问 http://localhost:3000
2. 选择"书币充值"或"章节解锁"
3. 完成支付流程
4. 查看控制台输出验证异步通知

---

## 📁 项目结构

```
novel-payment-system/
├── config.js                 # 配置文件（支付宝参数）
├── package.json              # 项目依赖
├── server.js                 # Express服务器入口
├── routes/
│   └── payment.js           # 支付路由（核心业务逻辑）
├── utils/
│   └── alipay.js            # 支付宝SDK封装
└── public/
    ├── payment.html         # 支付主页面
    └── payment-success.html # 支付成功页面
```

---

## 💳 支付流程

### 正常支付流程

```
用户选择商品
    ↓
点击支付
    ↓
后端创建订单 → 返回支付链接
    ↓
前端打开支付宝页面
    ↓
用户完成支付
    ↓
支付宝异步通知 → 后端验签 → 更新订单状态
    ↓
支付成功
```

### 关键API接口

#### 1. 创建支付订单
```
POST /api/alipay/create

请求参数：
{
  "subject": "60书币充值",           // 商品名称
  "totalAmount": 6.00,              // 金额（元）
  "body": "充值60书币到账户",        // 商品描述
  "productType": "coin",            // 产品类型
  "productId": 60                   // 产品ID或数量
}

响应：
{
  "success": true,
  "data": {
    "outTradeNo": "订单号",
    "payUrl": "https://..."         // 支付链接
  }
}
```

#### 2. 支付异步通知
```
POST /api/alipay/notify

支付宝POST发送，包含签名验证

处理成功后返回：success
处理失败返回：failure
```

#### 3. 查询订单状态
```
GET /api/alipay/query/:outTradeNo

响应：
{
  "success": true,
  "data": {
    "tradeStatus": "TRADE_SUCCESS",
    // ... 其他订单信息
  }
}
```

#### 4. 申请退款
```
POST /api/alipay/refund

请求参数：
{
  "outTradeNo": "订单号",
  "refundAmount": 6.00,
  "refundReason": "用户申请退款"
}

响应：
{
  "success": true,
  "message": "退款成功"
}
```

---

## 🔒 安全规范

⚠️ **重要安全提醒**：

1. **私钥保护**
   - ❌ 禁止将私钥保存在客户端
   - ❌ 禁止将私钥上传到GitHub等公开仓库
   - ❌ 禁止将私钥打印到日志中
   - ✅ 私钥仅保存在服务器端配置文件

2. **验签必须**
   - ✅ 收到异步通知必须先验签
   - ✅ 验证 app_id、out_trade_no、total_amount
   - ✅ 只有 TRADE_SUCCESS 或 TRADE_FINISHED 才算支付成功

3. **订单处理**
   - ✅ 确保 out_trade_no 全局唯一
   - ✅ 金额必须与服务端订单一致
   - ✅ 处理完成后返回 "success" 字符串

4. **幂等性**
   - ✅ 同一通知可能被发送多次
   - ✅ 使用订单状态或数据库事务防止重复处理

---

## 📱 前端集成

### 在你的小说平台中集成支付

```html
<!-- 1. 引入支付组件 -->
<div id="payment-component"></div>

<!-- 2. 调用支付函数 -->
<script>
function openPayment(productType, productId, subject, amount) {
  fetch('/api/alipay/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subject: subject,
      totalAmount: amount,
      body: `购买商品：${subject}`,
      productType: productType,
      productId: productId
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      window.open(data.data.payUrl, '_blank');
    }
  });
}

// 示例：充值100书币
openPayment('coin', 100, '100书币充值', 10.00);

// 示例：购买章节
openPayment('chapter', 'chapter_123', '第128章', 1.00);
</script>
```

### 监听支付结果

```javascript
// 轮询查询订单状态
function checkPaymentStatus(outTradeNo) {
  const interval = setInterval(() => {
    fetch(`/api/alipay/query/${outTradeNo}`)
      .then(res => res.json())
      .then(data => {
        if (data.data.tradeStatus === 'TRADE_SUCCESS') {
          clearInterval(interval);
          alert('支付成功！');
          // 刷新页面或更新UI
        }
      });
  }, 3000);

  // 30秒后停止查询
  setTimeout(() => clearInterval(interval), 30000);
}
```

---

## 🧪 测试环境

### 沙箱环境

配置文件中使用沙箱网关：
```javascript
gateway: 'https://openapi-sandbox.dl.alipaydev.com/gateway.do'
```

沙箱环境特点：
- ✅ 不真实扣款
- ✅ 可以模拟各种支付结果
- ✅ 适合开发和测试

获取沙箱账号：
1. 访问 [沙箱环境](https://open.alipay.com/develop/sandbox)
2. 登录获取沙箱支付宝账号和密码

---

## 📊 数据库设计（建议）

如果需要持久化存储订单，建议创建以下表：

```sql
-- 订单表
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  out_trade_no VARCHAR(64) UNIQUE NOT NULL,  -- 商户订单号
  trade_no VARCHAR(64),                       -- 支付宝交易号
  user_id VARCHAR(64),                        -- 用户ID
  subject VARCHAR(256),                       -- 商品名称
  total_amount DECIMAL(10,2),                 -- 订单金额
  status ENUM('pending','paid','closed','refunded'),  -- 订单状态
  product_type VARCHAR(32),                   -- 产品类型
  product_id VARCHAR(64),                     -- 产品ID
  paid_at DATETIME,                           -- 支付时间
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 用户书币表
CREATE TABLE user_coins (
  user_id VARCHAR(64) PRIMARY KEY,
  coins INT DEFAULT 0,
  total_recharged INT DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 用户购买记录表
CREATE TABLE purchases (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(64) NOT NULL,
  book_id VARCHAR(64) NOT NULL,
  chapter_id VARCHAR(64) NOT NULL,
  order_no VARCHAR(64),
  amount DECIMAL(10,2),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🎯 收款账号配置

你的收款账号：**13317833096**

此账号为个人支付宝账号，接入时请确保：
1. 已完成支付宝实名认证
2. 已开通商家服务
3. 已签约相应的支付产品

---

## 🔧 常见问题

### 1. 验签失败
- 检查公私钥是否匹配
- 确认字符编码为 UTF-8
- 验证支付宝公钥是否正确

### 2. 异步通知收不到
- 确认回调地址公网可访问
- 检查服务器防火墙设置
- 验证 notify_url 配置正确

### 3. 支付完成后订单未更新
- 检查异步通知是否返回 "success"
- 查看服务器日志
- 使用订单查询接口验证状态

### 4. 重复支付
- 确保 out_trade_no 全局唯一
- 在处理逻辑中加入幂等性检查
- 使用数据库事务保证数据一致性

---

## 📞 技术支持

- 支付宝开放平台文档：https://open.alipay.com/
- 商家支持中心：https://b.alipay.com/
- 技术支持邮箱：opensupport@alipay.com

---

## 📝 注意事项

1. **生产环境**：部署前务必切换到正式网关和真实配置
2. **HTTPS**：正式环境建议使用 HTTPS
3. **日志记录**：保留完整的支付日志便于排查问题
4. **异常处理**：做好各种异常情况的处理和用户提示
5. **定期对账**：建议每日对账确保资金安全

---

祝你开发顺利！🎉
