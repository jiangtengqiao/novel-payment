const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');

const users = global.users || new Map();
const verificationCodes = new Map();
const lastSendTime = new Map();

// 配置QQ邮箱SMTP（发信人）
const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 465,
  secure: true,
  auth: {
    user: '2527469579@qq.com',
    pass: 'sdafarxfmqrwcgff'
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
  family: 4
});

// 测试邮件连接
transporter.verify(function(error, success) {
  if (error) {
    console.log('⚠️  QQ邮箱SMTP连接失败:', error.message);
    console.log('💡 请确保开启了POP3/SMTP服务并使用了正确的授权码');
  } else {
    console.log('✅ QQ邮箱SMTP连接成功！邮件服务已就绪');
  }
});

async function sendEmail(to, code) {
  try {
    console.log(`正在发送验证码邮件到: ${to}`);
    console.log(`验证码: ${code}`);
    
    const mailOptions = {
      from: '"小说支付中心" <2527469579@qq.com>',
      to: to,
      subject: '【小说支付中心】安全验证 - 验证码',
      text: `尊敬的用户：\n\n您正在进行账户注册验证，验证码为：${code}\n\n验证码有效期：5分钟\n\n请在注册页面输入此验证码完成验证。\n\n⚠️ 安全提示：\n- 此验证码仅供您本人使用，请妥善保管\n- 请勿将验证码告知他人\n- 如非本人操作，请忽略此邮件\n\n如有疑问，请联系客服。\n\n---\n小说支付中心\n官网：https://www.example.com\n客服邮箱：support@example.com`,
      html: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>验证码通知</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f5f7fa; min-height: 100vh; padding: 20px; }
    .email-container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .email-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
    .email-header .logo { font-size: 56px; margin-bottom: 12px; }
    .email-header h1 { color: white; font-size: 22px; font-weight: 600; margin-bottom: 6px; }
    .email-header p { color: rgba(255,255,255,0.9); font-size: 14px; }
    .email-body { padding: 30px; }
    .email-body .greeting { font-size: 15px; color: #333; margin-bottom: 20px; line-height: 1.6; }
    .verification-box { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 20px; }
    .verification-box .label { font-size: 13px; color: #666; margin-bottom: 15px; display: block; }
    .verification-box .code { font-size: 40px; font-weight: 700; color: #667eea; letter-spacing: 12px; font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace; }
    .verification-box .expire { font-size: 12px; color: #999; margin-top: 12px; }
    .warning-section { background: #fff3cd; border: 1px solid #ffeeba; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
    .warning-section .title { font-size: 13px; font-weight: 600; color: #856404; margin-bottom: 10px; }
    .warning-section ul { margin: 0; padding-left: 20px; }
    .warning-section li { font-size: 12px; color: #856404; margin-bottom: 5px; line-height: 1.5; }
    .email-footer { background: #f8f9fa; padding: 20px; text-align: center; }
    .email-footer p { font-size: 12px; color: #999; line-height: 1.6; }
    .email-footer .divider { width: 40px; height: 1px; background: #ddd; margin: 15px auto; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <div class="logo">📚</div>
      <h1>小说支付中心</h1>
      <p>安全验证通知</p>
    </div>
    <div class="email-body">
      <p class="greeting">尊敬的用户：</p>
      <p class="greeting">您正在进行账户注册验证，请使用以下验证码完成操作：</p>
      <div class="verification-box">
        <span class="label">您的验证码</span>
        <div class="code">${code}</div>
        <span class="expire">⚠️ 有效期：5分钟，请尽快使用</span>
      </div>
      <div class="warning-section">
        <div class="title">🔒 安全提示</div>
        <ul>
          <li>此验证码仅供您本人使用，请妥善保管</li>
          <li>请勿将验证码通过任何方式告知他人</li>
          <li>如非本人操作，请忽略此邮件，您的账户安全不会受到影响</li>
          <li>验证码过期后，请重新获取</li>
        </ul>
      </div>
    </div>
    <div class="email-footer">
      <p>如有疑问，请联系客服</p>
      <div class="divider"></div>
      <p>© 2024 小说支付中心 | 版权所有</p>
    </div>
  </div>
</body>
</html>`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ 邮件发送成功！Message ID:', info.messageId);
    console.log('收件人:', to);
    return true;
  } catch (error) {
    console.error('❌ 邮件发送失败:', error.message);
    console.error('错误详情:', error);
    return false;
  }
}

router.post('/send-code', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: '请输入邮箱' });
    }
    
    if (users.has(email)) {
      return res.status(400).json({ success: false, message: '该邮箱已注册，请直接登录' });
    }
    
    const now = Date.now();
    const lastTime = lastSendTime.get(email) || 0;
    
    if (now - lastTime < 60 * 1000) {
      const remaining = Math.ceil((60 * 1000 - (now - lastTime)) / 1000);
      return res.status(400).json({ 
        success: false, 
        message: `请稍后再试，剩余${remaining}秒`,
        remaining 
      });
    }
    
    const code = Math.random().toString(36).slice(-6).toUpperCase();
    verificationCodes.set(email, {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000,
      tempPassword: ''
    });
    
    lastSendTime.set(email, now);
    
    console.log(`=== 验证码发送 ===`);
    console.log(`邮箱: ${email}`);
    console.log(`验证码: ${code}`);
    console.log(`有效期: 5分钟`);
    console.log(`==================`);
    
    const emailSent = await sendEmail(email, code);
    
    if (emailSent) {
      res.json({
        success: true,
        message: '验证码已发送到您的邮箱',
        email,
        expiresIn: 5 * 60
      });
    } else {
      res.status(500).json({
        success: false,
        message: '邮件发送失败，请检查网络连接或联系客服'
      });
    }
  } catch (error) {
    console.error('发送验证码失败:', error);
    res.status(500).json({ success: false, message: '发送失败' });
  }
});

router.post('/register', (req, res) => {
  try {
    const { email, password, code } = req.body;
    
    if (!email || !password || !code) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }
    
    if (users.has(email)) {
      return res.status(400).json({ success: false, message: '邮箱已注册' });
    }
    
    const verification = verificationCodes.get(email);
    if (!verification) {
      return res.status(400).json({ success: false, message: '未找到验证码，请先获取验证码' });
    }
    
    if (Date.now() > verification.expiresAt) {
      verificationCodes.delete(email);
      return res.status(400).json({ success: false, message: '验证码已过期，请重新获取' });
    }
    
    if (verification.code !== code.toUpperCase()) {
      return res.status(400).json({ success: false, message: '验证码错误' });
    }
    
    const userId = uuidv4().slice(0, 8);
    users.set(email, {
      userId,
      email,
      password,
      coins: 0,
      totalRecharged: 0,
      vipExpireTime: null,
      members: [],
      createdAt: new Date()
    });
    
    verificationCodes.delete(email);
    lastSendTime.delete(email);
    
    res.json({
      success: true,
      message: '注册成功',
      data: { userId, email }
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ success: false, message: '注册失败' });
  }
});

router.post('/verify', (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }
    
    const verification = verificationCodes.get(email);
    if (!verification) {
      return res.status(400).json({ success: false, message: '未找到验证码，请重新获取' });
    }
    
    if (Date.now() > verification.expiresAt) {
      verificationCodes.delete(email);
      return res.status(400).json({ success: false, message: '验证码已过期，请重新获取' });
    }
    
    if (verification.code !== code.toUpperCase()) {
      return res.status(400).json({ success: false, message: '验证码错误' });
    }
    
    const userId = uuidv4().slice(0, 8);
    users.set(email, {
      userId,
      email,
      password: verification.password,
      coins: 0,
      totalRecharged: 0,
      vipExpireTime: null,
      members: [],
      createdAt: new Date()
    });
    
    verificationCodes.delete(email);
    
    res.json({
      success: true,
      message: '注册成功',
      data: { userId, email }
    });
  } catch (error) {
    console.error('验证失败:', error);
    res.status(500).json({ success: false, message: '验证失败' });
  }
});

router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }
    
    const user = users.get(email);
    if (!user) {
      return res.status(400).json({ success: false, message: '用户不存在' });
    }
    
    if (user.password !== password) {
      return res.status(400).json({ success: false, message: '密码错误' });
    }
    
    const sessionId = uuidv4();
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        userId: user.userId,
        email: user.email,
        coins: user.coins,
        totalRecharged: user.totalRecharged,
        vipExpireTime: user.vipExpireTime,
        sessionId
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ success: false, message: '登录失败' });
  }
});

router.get('/check', (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }
    
    const exists = users.has(email);
    
    res.json({
      success: true,
      data: { exists }
    });
  } catch (error) {
    console.error('检查用户失败:', error);
    res.status(500).json({ success: false, message: '检查失败' });
  }
});

module.exports = router;
module.exports.users = users;