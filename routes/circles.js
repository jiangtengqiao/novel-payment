
const express = require('express');
const router = express.Router();
const { Circle, initDefaultCircles } = require('../models/circle');
const { Post } = require('../models/community');

initDefaultCircles();

router.get('/circles', (req, res) => {
  const { category, search, sortBy, limit = 20 } = req.query;
  const circles = Circle.findAll({ category, search, sortBy, limit: parseInt(limit) });
  res.json({ success: true, circles: circles.map(c => c.toJSON()) });
});

router.get('/circles/:id', (req, res) => {
  const circle = Circle.findById(req.params.id);
  if (!circle) {
    return res.status(404).json({ success: false, message: '圈子不存在' });
  }
  res.json({ success: true, circle: circle.toJSON() });
});

router.post('/circles', (req, res) => {
  const { name, description, category, creatorId, creatorName } = req.body;
  
  if (!name) {
    return res.status(400).json({ success: false, message: '圈子名称不能为空' });
  }

  const circle = Circle.create({
    name,
    description,
    category,
    creatorId,
    creatorName
  });

  circle.joinMember(creatorId, creatorName);

  res.json({ success: true, circle: circle.toJSON() });
});

router.post('/circles/:id/join', (req, res) => {
  const circle = Circle.findById(req.params.id);
  if (!circle) {
    return res.status(404).json({ success: false, message: '圈子不存在' });
  }

  const { userId, nickname } = req.body;
  const joined = circle.joinMember(userId, nickname);

  if (joined) {
    res.json({ success: true, message: '加入成功', circle: circle.toJSON() });
  } else {
    res.status(400).json({ success: false, message: '已在圈子中' });
  }
});

router.post('/circles/:id/leave', (req, res) => {
  const circle = Circle.findById(req.params.id);
  if (!circle) {
    return res.status(404).json({ success: false, message: '圈子不存在' });
  }

  const { userId } = req.body;
  circle.leaveMember(userId);

  res.json({ success: true, message: '已退出圈子', circle: circle.toJSON() });
});

router.get('/circles/:id/posts', (req, res) => {
  const circle = Circle.findById(req.params.id);
  if (!circle) {
    return res.status(404).json({ success: false, message: '圈子不存在' });
  }

  const posts = circle.posts.map(postId => Post.findById(postId)).filter(p => p && !p.isDeleted);
  
  res.json({ success: true, posts: posts.map(p => p.toJSON()) });
});

module.exports = router;

