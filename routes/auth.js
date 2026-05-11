const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

const users = new Map();
const verificationCodes = new Map();

router.post('/register', (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }
    
    if (users.has(email)) {
      return res.status(400).json({ success: false, message: '邮箱已注册' });
    }
    
    const code = Math.random().toString(36).slice(-6).toUpperCase();
    verificationCodes.set(email, {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000,
      password
    });
    
    console.log(`发送验证码 ${code} 到 ${email}`);
    
    res.json({
      success: true,
      message: '验证码已发送，有效期5分钟',
      email
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