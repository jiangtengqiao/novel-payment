const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

const { usersDB } = require('../db/init');

router.get('/stats', (req, res) => {
  const users = usersDB.getAll();
  const creators = Object.values(users).filter(u => u.role === 'creator');
  
  res.json({
    success: true,
    totalAuthors: creators.length || 1,
    totalWorks: Object.keys(creators).length * 3 || 6,
    totalIncome: creators.reduce((sum, u) => sum + (u.totalIncome || 0), 0) || 10000
  });
});

router.get('/my-works', (req, res) => {
  const sessionId = req.headers['x-session-id'];
  if (!sessionId) {
    return res.json({
      success: true,
      works: [],
      totalIncome: 0,
      balance: 0
    });
  }
  
  const users = usersDB.getAll();
  const user = Object.values(users).find(u => u.sessionId === sessionId);
  
  if (!user || user.role !== 'creator') {
    return res.json({
      success: true,
      works: [],
      totalIncome: 0,
      balance: 0
    });
  }
  
  res.json({
    success: true,
    works: user.works || [],
    totalIncome: user.totalIncome || 0,
    balance: user.balance || 0
  });
});

router.post('/register', (req, res) => {
  const { penName, genre, workTitle, workDesc } = req.body;
  const sessionId = req.headers['x-session-id'];
  
  const users = usersDB.getAll();
  let user = sessionId ? Object.values(users).find(u => u.sessionId === sessionId) : null;
  
  if (!user) {
    user = {
      id: uuidv4(),
      role: 'creator',
      penName,
      genre,
      works: [],
      totalIncome: 0,
      balance: 0,
      createdAt: Date.now()
    };
    usersDB.set(user.id, user);
  } else {
    user.penName = penName;
    user.genre = genre;
    user.role = 'creator';
    usersDB.set(user.id, user);
  }
  
  res.json({
    success: true,
    message: '入驻申请已提交',
    userId: user.id
  });
});

router.post('/works', (req, res) => {
  const { title, genre, description } = req.body;
  const sessionId = req.headers['x-session-id'];
  
  if (!sessionId) {
    return res.status(401).json({
      success: false,
      message: '请先登录'
    });
  }
  
  const users = usersDB.getAll();
  const user = Object.values(users).find(u => u.sessionId === sessionId);
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: '用户不存在'
    });
  }
  
  const work = {
    id: uuidv4(),
    title,
    genre,
    description,
    chapters: 0,
    views: 0,
    likes: 0,
    status: 'draft',
    createdAt: Date.now()
  };
  
  if (!user.works) {
    user.works = [];
  }
  user.works.push(work);
  usersDB.set(user.id, user);
  
  res.json({
    success: true,
    message: '作品创建成功',
    work
  });
});

router.post('/withdraw', (req, res) => {
  const { amount, alipayAccount, realName } = req.body;
  const sessionId = req.headers['x-session-id'];
  
  if (!sessionId) {
    return res.status(401).json({
      success: false,
      message: '请先登录'
    });
  }
  
  const users = usersDB.getAll();
  const user = Object.values(users).find(u => u.sessionId === sessionId);
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: '用户不存在'
    });
  }
  
  if ((user.balance || 0) < amount) {
    return res.status(400).json({
      success: false,
      message: '余额不足'
    });
  }
  
  user.balance -= amount;
  usersDB.set(user.id, user);
  
  res.json({
    success: true,
    message: '提现申请已提交，我们会在1-3个工作日内处理'
  });
});

module.exports = router;
