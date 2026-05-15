const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

const admins = new Map();
const adminSessions = new Map();

admins.set('admin', {
  username: 'admin',
  password: 'admin123456',
  name: '超级管理员',
  role: 'super_admin',
  createdAt: new Date()
});

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: '请输入账号和密码' 
      });
    }
    
    const admin = admins.get(username);
    
    if (!admin || admin.password !== password) {
      return res.status(401).json({ 
        success: false, 
        message: '账号或密码错误' 
      });
    }
    
    const token = uuidv4();
    const session = {
      username: admin.username,
      name: admin.name,
      role: admin.role,
      loginAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };
    
    adminSessions.set(token, session);
    
    res.json({
      success: true,
      message: '登录成功',
      token,
      admin: {
        username: admin.username,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('管理员登录失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '登录失败，请稍后重试' 
    });
  }
});

router.post('/logout', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      adminSessions.delete(token);
    }
    res.json({
      success: true,
      message: '已退出登录'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '退出失败' 
    });
  }
});

router.get('/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: '未登录' 
      });
    }
    
    const session = adminSessions.get(token);
    
    if (!session) {
      return res.status(401).json({ 
        success: false, 
        message: '会话已过期' 
      });
    }
    
    if (new Date() > session.expiresAt) {
      adminSessions.delete(token);
      return res.status(401).json({ 
        success: false, 
        message: '会话已过期，请重新登录' 
      });
    }
    
    res.json({
      success: true,
      admin: {
        username: session.username,
        name: session.name,
        role: session.role
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '验证失败' 
    });
  }
});

router.post('/create', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const session = adminSessions.get(token);
    
    if (!session || session.role !== 'super_admin') {
      return res.status(403).json({ 
        success: false, 
        message: '权限不足，仅超级管理员可创建账号' 
      });
    }
    
    const { username, password, name, role } = req.body;
    
    if (!username || !password || !name) {
      return res.status(400).json({ 
        success: false, 
        message: '请填写完整的账号信息' 
      });
    }
    
    if (admins.has(username)) {
      return res.status(400).json({ 
        success: false, 
        message: '账号已存在' 
      });
    }
    
    admins.set(username, {
      username,
      password,
      name,
      role: role || 'admin',
      createdBy: session.username,
      createdAt: new Date()
    });
    
    res.json({
      success: true,
      message: '工作人员账号创建成功'
    });
  } catch (error) {
    console.error('创建管理员账号失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '创建失败' 
    });
  }
});

router.get('/list', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const session = adminSessions.get(token);
    
    if (!session) {
      return res.status(401).json({ 
        success: false, 
        message: '未登录' 
      });
    }
    
    const adminList = [];
    admins.forEach((admin, username) => {
      adminList.push({
        username: admin.username,
        name: admin.name,
        role: admin.role,
        createdAt: admin.createdAt
      });
    });
    
    res.json({
      success: true,
      admins: adminList
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '获取失败' 
    });
  }
});

module.exports = router;
