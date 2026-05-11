const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');

const users = new Map();
const verificationCodes = new Map();
const lastSendTime = new Map();

const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 465,
  secure: true,
  auth: {
    user: '2527469579@qq.com',
    pass: 'ibwcdqgjmxpfedcj'
  }
});

async function sendEmail(to, code) {
  try {
    const info = await transporter.sendMail({
      from: '"小说支付中心" <2527469579@qq.com>',
      to: to,
      subject: '【小说支付中心】验证码',
      text: `您的验证码是：${code}\n\n有效期5分钟，请及时使用。\n\n如有疑问请联系客服。`,
      html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; border-radius: 10px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
  <div style="text-align: center; color: white;">
    <div style="font-size: 48px; margin-bottom: 15px;">📚</div>
    <h2 style="margin-bottom: 5px;">小说支付中心</h2>
    <p style="opacity: 0.9; font-size: 14px; margin-bottom: 20px;">验证码通知</p>
  </div>
  <div style="background: white; border-radius: 8px; padding: 25px; text-align: center;">
    <p style="color: #666; font-size: 14px; margin-bottom: 15px;">您的验证码是：</p>
    <div style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px;">${code}</div>
    <p style="color: #999; font-size: 12px; margin-top: 20px;">有效期5分钟，请及时使用</p>
  </div>
  <p style="text-align: center; color: rgba(255,255,255,0.8); font-size: 12px; margin-top: 15px;">如有疑问请联系客服</p>
</div>`
    });
    console.log('邮件发送成功:', info.messageId);
    return true;
  } catch (error) {
    console.error('邮件发送失败:', error);
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
      res.json({
        success: true,
        message: '邮件发送失败，验证码已显示在下方',
        email,
        expiresIn: 5 * 60,
        code: code
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