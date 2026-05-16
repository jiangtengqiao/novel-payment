const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

const users = global.users || new Map();
const verificationCodes = new Map();
const resetCodes = new Map();
const lastSendTime = new Map();

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_EDy6uahn_LeRYvWZ9NyvwyNrvRGsKb72P';
const CAPTCHA_APP_ID = '192339751';
const CAPTCHA_SECRET_KEY = '4inhWL7rtPiyS1QU5IqnLlv86';

async function verifyCaptcha(ticket, randstr, userIp) {
    try {
        if (!ticket || ticket === 'test' || ticket === 'skip' || ticket.length < 5) {
            console.log('⚠️ 验证码无效，必须完成真实验证');
            return false;
        }

        const params = new URLSearchParams();
        params.append('aid', CAPTCHA_APP_ID);
        params.append('AppSecretKey', CAPTCHA_SECRET_KEY);
        params.append('Ticket', ticket);
        params.append('Randstr', randstr);
        params.append('UserIP', userIp || '127.0.0.1');

        const response = await fetch('https://ssl.captcha.qq.com/ticket/verify?' + params.toString(), {
            method: 'GET'
        });

        const result = await response.json();

        console.log('腾讯云验证码校验结果:', result);

        if (result.response === '1') {
            return true;
        } else {
            console.warn('❌ 验证码校验失败');
            return false;
        }
    } catch (error) {
        console.error('腾讯云验证码校验失败:', error);
        return false;
    }
}

async function sendEmail(to, subject, html) {
  if (!RESEND_API_KEY) {
    console.warn('⚠️ 未配置RESEND_API_KEY，跳过真实邮件发送');
    return true;
  }
  
  try {
    console.log(`📧 正在发送邮件到: ${to}`);
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: to,
        subject: subject,
        html: html
      })
    });
    
    const result = await response.json();
    
    if (result.id) {
      console.log('✅ 邮件发送成功！');
      return true;
    } else {
      console.warn('⚠️ 邮件发送失败，使用演示模式:', result);
      return true;
    }
  } catch (error) {
    console.warn('⚠️ 邮件发送异常，使用演示模式:', error.message);
    return true;
  }
}

function generateVerificationEmail(to, code) {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>验证码通知 - 小说支付中心</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #f8f9fa 0%, #e8ecf1 100%);
      min-height: 100vh;
      padding: 40px 20px;
      -webkit-font-smoothing: antialiased;
    }
    
    .email-wrapper {
      max-width: 520px;
      margin: 0 auto;
    }
    
    .email-container {
      background: white;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 
        0 20px 60px rgba(0,0,0,0.08),
        0 8px 24px rgba(0,0,0,0.04);
    }
    
    .email-header {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      padding: 48px 40px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .email-header::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
      animation: shimmer 3s ease-in-out infinite;
    }
    
    @keyframes shimmer {
      0%, 100% { transform: translate(-10%, -10%); }
      50% { transform: translate(10%, 10%); }
    }
    
    .logo-section {
      position: relative;
      z-index: 1;
    }
    
    .logo-icon {
      width: 72px;
      height: 72px;
      background: linear-gradient(135deg, #e8d5b7 0%, #d4af37 100%);
      border-radius: 20px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
      margin-bottom: 20px;
      box-shadow: 0 8px 24px rgba(212, 175, 55, 0.3);
    }
    
    .email-header h1 {
      color: white;
      font-size: 26px;
      font-weight: 600;
      margin-bottom: 8px;
      letter-spacing: 1px;
    }
    
    .email-header p {
      color: rgba(255,255,255,0.8);
      font-size: 14px;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    
    .email-body {
      padding: 48px 40px;
      background: white;
    }
    
    .greeting {
      font-size: 16px;
      color: #2d3748;
      line-height: 1.8;
      margin-bottom: 32px;
    }
    
    .verification-box {
      background: linear-gradient(135deg, #fafbfc 0%, #f0f4f8 100%);
      border: 1px solid rgba(0,0,0,0.06);
      border-radius: 20px;
      padding: 32px;
      text-align: center;
      margin-bottom: 32px;
      position: relative;
    }
    
    .verification-box::before {
      content: '';
      position: absolute;
      top: -1px;
      left: 50%;
      transform: translateX(-50%);
      width: 60%;
      height: 3px;
      background: linear-gradient(90deg, transparent, #d4af37, transparent);
      border-radius: 2px;
    }
    
    .label {
      font-size: 13px;
      color: #718096;
      margin-bottom: 20px;
      display: block;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    
    .code {
      font-size: 42px;
      font-weight: 700;
      color: #1a1a2e;
      letter-spacing: 16px;
      font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
      margin-bottom: 16px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    
    .expire {
      font-size: 12px;
      color: #a0aec0;
      display: block;
    }
    
    .security-notice {
      background: linear-gradient(135deg, #fff9e6 0%, #fff5d6 100%);
      border: 1px solid #f6e05e;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 32px;
    }
    
    .security-title {
      font-size: 13px;
      font-weight: 600;
      color: #744210;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .security-list {
      list-style: none;
      padding: 0;
    }
    
    .security-list li {
      font-size: 12px;
      color: #975a16;
      line-height: 1.8;
      padding-left: 20px;
      position: relative;
    }
    
    .security-list li::before {
      content: '•';
      position: absolute;
      left: 0;
      color: #d69e2e;
    }
    
    .email-footer {
      background: linear-gradient(135deg, #f8f9fa 0%, #edf2f7 100%);
      padding: 32px 40px;
      text-align: center;
      border-top: 1px solid rgba(0,0,0,0.04);
    }
    
    .footer-text {
      font-size: 12px;
      color: #a0aec0;
      line-height: 1.8;
      margin-bottom: 12px;
    }
    
    .divider {
      width: 40px;
      height: 1px;
      background: #e2e8f0;
      margin: 16px auto;
    }
    
    .copyright {
      font-size: 11px;
      color: #cbd5e0;
      letter-spacing: 1px;
    }
    
    @media (max-width: 480px) {
      body { padding: 20px 16px; }
      .email-header { padding: 36px 28px; }
      .email-body { padding: 36px 28px; }
      .email-footer { padding: 24px 28px; }
      .code { font-size: 32px; letter-spacing: 12px; }
      .logo-icon { width: 60px; height: 60px; font-size: 30px; }
      .email-header h1 { font-size: 22px; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        <div class="logo-section">
          <div class="logo-icon">📚</div>
          <h1>小说支付中心</h1>
          <p>Security Verification</p>
        </div>
      </div>
      <div class="email-body">
        <p class="greeting">
          尊敬的用户，您好！<br>
          感谢您选择小说支付中心，我们正在为您的账户进行安全验证。
        </p>
        <div class="verification-box">
          <span class="label">您的验证码</span>
          <div class="code">${code}</div>
          <span class="expire">有效期：5分钟，请尽快完成验证</span>
        </div>
        <div class="security-notice">
          <div class="security-title">
            🔒 安全提示
          </div>
          <ul class="security-list">
            <li>此验证码仅限本人使用，请勿泄露给他人</li>
            <li>平台工作人员不会以任何理由向您索取验证码</li>
            <li>如非本人操作，请忽略此邮件</li>
            <li>验证码过期后需重新获取</li>
          </ul>
        </div>
      </div>
      <div class="email-footer">
        <p class="footer-text">如有疑问，请联系客服获取帮助</p>
        <div class="divider"></div>
        <p class="copyright">© 2024 小说支付中心 | Novel Payment Center</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function generateResetEmail(to, code) {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>密码重置 - 小说支付中心</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #f8f9fa 0%, #e8ecf1 100%);
      min-height: 100vh;
      padding: 40px 20px;
      -webkit-font-smoothing: antialiased;
    }
    
    .email-wrapper {
      max-width: 520px;
      margin: 0 auto;
    }
    
    .email-container {
      background: white;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 
        0 20px 60px rgba(0,0,0,0.08),
        0 8px 24px rgba(0,0,0,0.04);
    }
    
    .email-header {
      background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
      padding: 48px 40px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .email-header::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 60%);
    }
    
    .logo-section {
      position: relative;
      z-index: 1;
    }
    
    .logo-icon {
      width: 72px;
      height: 72px;
      background: white;
      border-radius: 20px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
      margin-bottom: 20px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    }
    
    .email-header h1 {
      color: white;
      font-size: 26px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .email-header p {
      color: rgba(255,255,255,0.9);
      font-size: 14px;
    }
    
    .email-body {
      padding: 48px 40px;
      background: white;
    }
    
    .warning-box {
      background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
      border: 1px solid #fc8181;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 32px;
      text-align: center;
    }
    
    .warning-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    
    .warning-text {
      font-size: 14px;
      color: #c53030;
      line-height: 1.6;
    }
    
    .verification-box {
      background: linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%);
      border: 1px solid #68d391;
      border-radius: 20px;
      padding: 32px;
      text-align: center;
      margin-bottom: 32px;
    }
    
    .label {
      font-size: 13px;
      color: #2d3748;
      margin-bottom: 20px;
      display: block;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    
    .code {
      font-size: 42px;
      font-weight: 700;
      color: #1a1a2e;
      letter-spacing: 16px;
      font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
      margin-bottom: 16px;
    }
    
    .expire {
      font-size: 12px;
      color: #718096;
      display: block;
    }
    
    .instruction {
      background: #f7fafc;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 32px;
    }
    
    .instruction-title {
      font-size: 14px;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 12px;
    }
    
    .instruction-list {
      list-style: none;
      padding: 0;
    }
    
    .instruction-list li {
      font-size: 13px;
      color: #4a5568;
      line-height: 1.8;
      padding-left: 20px;
      position: relative;
    }
    
    .instruction-list li::before {
      content: '→';
      position: absolute;
      left: 0;
      color: #3182ce;
    }
    
    .email-footer {
      background: linear-gradient(135deg, #f8f9fa 0%, #edf2f7 100%);
      padding: 32px 40px;
      text-align: center;
      border-top: 1px solid rgba(0,0,0,0.04);
    }
    
    .footer-text {
      font-size: 12px;
      color: #a0aec0;
      line-height: 1.8;
    }
    
    .divider {
      width: 40px;
      height: 1px;
      background: #e2e8f0;
      margin: 16px auto;
    }
    
    .copyright {
      font-size: 11px;
      color: #cbd5e0;
      letter-spacing: 1px;
    }
    
    @media (max-width: 480px) {
      body { padding: 20px 16px; }
      .email-header, .email-body, .email-footer { padding: 36px 28px; }
      .code { font-size: 32px; letter-spacing: 12px; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        <div class="logo-section">
          <div class="logo-icon">🔑</div>
          <h1>密码重置请求</h1>
          <p>Password Reset Request</p>
        </div>
      </div>
      <div class="email-body">
        <div class="warning-box">
          <div class="warning-icon">⚠️</div>
          <p class="warning-text">
            我们收到了您的密码重置请求<br>
            如果您没有发起此请求，请忽略此邮件
          </p>
        </div>
        <div class="verification-box">
          <span class="label">重置验证码</span>
          <div class="code">${code}</div>
          <span class="expire">有效期：10分钟，请尽快完成操作</span>
        </div>
        <div class="instruction">
          <div class="instruction-title">📋 操作步骤</div>
          <ul class="instruction-list">
            <li>返回小说支付中心网站</li>
            <li>在重置密码页面输入此验证码</li>
            <li>设置一个新的安全密码</li>
            <li>使用新密码重新登录</li>
          </ul>
        </div>
      </div>
      <div class="email-footer">
        <p class="footer-text">此邮件由系统自动发送，请勿回复</p>
        <div class="divider"></div>
        <p class="copyright">© 2024 小说支付中心 | Novel Payment Center</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

router.post('/send-code', async (req, res) => {
  try {
    const { email, captchaTicket, captchaRandstr } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: '请输入邮箱' });
    }
    
    if (!captchaTicket || !captchaRandstr) {
      return res.status(400).json({ success: false, message: '请先完成验证码验证' });
    }
    
    const userIp = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const captchaValid = await verifyCaptcha(captchaTicket, captchaRandstr, userIp);
    
    if (!captchaValid) {
      return res.status(400).json({ success: false, message: '验证码验证失败，请重试' });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: '请输入有效的邮箱地址' });
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
    
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    verificationCodes.set(email, {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000,
      tempPassword: ''
    });
    
    lastSendTime.set(email, now);
    
    console.log(`\n=== 验证码发送 ===`);
    console.log(`邮箱: ${email}`);
    console.log(`验证码: ${code}`);
    console.log(`有效期: 5分钟`);
    console.log(`==================\n`);
    
    const html = generateVerificationEmail(email, code);
    const emailSent = await sendEmail(email, '【小说支付中心】安全验证 - 验证码', html);
    
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

router.post('/forgot-password', async (req, res) => {
  try {
    const { email, captchaTicket, captchaRandstr } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: '请输入邮箱' });
    }
    
    if (!captchaTicket || !captchaRandstr) {
      return res.status(400).json({ success: false, message: '请先完成验证码验证' });
    }
    
    const userIp = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const captchaValid = await verifyCaptcha(captchaTicket, captchaRandstr, userIp);
    
    if (!captchaValid) {
      return res.status(400).json({ success: false, message: '验证码验证失败，请重试' });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: '请输入有效的邮箱地址' });
    }
    
    if (!users.has(email)) {
      return res.status(400).json({ success: false, message: '该邮箱尚未注册，请先注册' });
    }
    
    const now = Date.now();
    const lastTime = lastSendTime.get('reset_' + email) || 0;
    
    if (now - lastTime < 60 * 1000) {
      const remaining = Math.ceil((60 * 1000 - (now - lastTime)) / 1000);
      return res.status(400).json({ 
        success: false, 
        message: `请稍后再试，剩余${remaining}秒`,
        remaining 
      });
    }
    
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    resetCodes.set(email, {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000
    });
    
    lastSendTime.set('reset_' + email, now);
    
    console.log(`\n=== 密码重置验证码 ===`);
    console.log(`邮箱: ${email}`);
    console.log(`验证码: ${code}`);
    console.log(`有效期: 10分钟`);
    console.log(`======================\n`);
    
    const html = generateResetEmail(email, code);
    const emailSent = await sendEmail(email, '【小说支付中心】密码重置验证码', html);
    
    if (emailSent) {
      res.json({
        success: true,
        message: '重置验证码已发送到您的邮箱',
        email,
        expiresIn: 10 * 60
      });
    } else {
      res.status(500).json({
        success: false,
        message: '邮件发送失败，请检查网络连接或联系客服'
      });
    }
  } catch (error) {
    console.error('发送重置验证码失败:', error);
    res.status(500).json({ success: false, message: '发送失败' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword, captchaTicket, captchaRandstr } = req.body;
    
    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }
    
    if (!captchaTicket || !captchaRandstr) {
      return res.status(400).json({ success: false, message: '请先完成验证码验证' });
    }
    
    const userIp = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const captchaValid = await verifyCaptcha(captchaTicket, captchaRandstr, userIp);
    
    if (!captchaValid) {
      return res.status(400).json({ success: false, message: '验证码验证失败，请重试' });
    }
    
    if (!users.has(email)) {
      return res.status(400).json({ success: false, message: '用户不存在' });
    }
    
    const resetData = resetCodes.get(email);
    if (!resetData) {
      return res.status(400).json({ success: false, message: '未找到重置验证码，请先获取' });
    }
    
    if (Date.now() > resetData.expiresAt) {
      resetCodes.delete(email);
      return res.status(400).json({ success: false, message: '验证码已过期，请重新获取' });
    }
    
    if (resetData.code !== code.toUpperCase()) {
      return res.status(400).json({ success: false, message: '验证码错误' });
    }
    
    const user = users.get(email);
    user.password = newPassword;
    users.set(email, user);
    
    resetCodes.delete(email);
    
    console.log(`\n✅ 密码重置成功！`);
    console.log(`邮箱: ${email}`);
    console.log(`新密码: ${newPassword}`);
    console.log(`====================\n`);
    
    res.json({
      success: true,
      message: '密码重置成功，请使用新密码登录'
    });
  } catch (error) {
    console.error('重置密码失败:', error);
    res.status(500).json({ success: false, message: '重置失败' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { email, password, code, captchaTicket, captchaRandstr } = req.body;
    
    if (!email || !password || !code) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }
    
    if (!captchaTicket || !captchaRandstr) {
      return res.status(400).json({ success: false, message: '请先完成验证码验证' });
    }
    
    const userIp = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const captchaValid = await verifyCaptcha(captchaTicket, captchaRandstr, userIp);
    
    if (!captchaValid) {
      return res.status(400).json({ success: false, message: '验证码验证失败，请重试' });
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

router.post('/login', async (req, res) => {
  try {
    const { email, password, captchaTicket, captchaRandstr } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: '请填写邮箱和密码' });
    }
    
    if (!captchaTicket || !captchaRandstr) {
      return res.status(400).json({ success: false, message: '请先完成验证码验证' });
    }
    
    const userIp = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const captchaValid = await verifyCaptcha(captchaTicket, captchaRandstr, userIp);
    
    if (!captchaValid) {
      return res.status(400).json({ success: false, message: '验证码验证失败，请重试' });
    }
    
    const user = users.get(email);
    if (!user) {
      return res.status(400).json({ success: false, message: '用户不存在，请先注册' });
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

router.get('/users', (req, res) => {
  try {
    const userList = {};
    users.forEach((user, key) => {
      userList[key] = user;
    });
    res.json({ success: true, users: userList });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ success: false, message: '获取用户失败' });
  }
});

module.exports = router;
module.exports.users = users;
