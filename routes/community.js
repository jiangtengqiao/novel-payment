
const express = require('express');
const router = express.Router();
const { Post, Comment } = require('../models/community');

router.get('/posts', (req, res) => {
  const { bookId, type, limit = 20 } = req.query;
  const posts = Post.findAll({ bookId, type, limit: parseInt(limit) });
  res.json({ success: true, posts: posts.map(p => p.toJSON()) });
});

router.get('/posts/:id', (req, res) => {
  const post = Post.findById(req.params.id);
  if (!post || post.isDeleted) {
    return res.status(404).json({ success: false, message: '帖子不存在' });
  }
  res.json({ success: true, post: post.toJSON() });
});

router.post('/posts', (req, res) => {
  const { userId, nickname, avatar, bookId, title, content, type, images } = req.body;
  
  if (!content) {
    return res.status(400).json({ success: false, message: '内容不能为空' });
  }

  const post = Post.create({
    userId,
    nickname,
    avatar,
    bookId,
    title,
    content,
    type,
    images
  });

  res.json({ success: true, post: post.toJSON() });
});

router.put('/posts/:id/like', (req, res) => {
  const post = Post.findById(req.params.id);
  if (!post || post.isDeleted) {
    return res.status(404).json({ success: false, message: '帖子不存在' });
  }
  post.addLike();
  res.json({ success: true, likes: post.likes });
});

router.delete('/posts/:id', (req, res) => {
  const post = Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ success: false, message: '帖子不存在' });
  }
  post.delete();
  res.json({ success: true });
});

router.get('/posts/:id/comments', (req, res) => {
  const post = Post.findById(req.params.id);
  if (!post || post.isDeleted) {
    return res.status(404).json({ success: false, message: '帖子不存在' });
  }
  const comments = Comment.findByPostId(req.params.id);
  res.json({ success: true, comments: comments.map(c => c.toJSON()) });
});

router.post('/posts/:id/comments', (req, res) => {
  const post = Post.findById(req.params.id);
  if (!post || post.isDeleted) {
    return res.status(404).json({ success: false, message: '帖子不存在' });
  }

  const { userId, nickname, avatar, content, replyToId } = req.body;
  if (!content) {
    return res.status(400).json({ success: false, message: '评论内容不能为空' });
  }

  const comment = Comment.create(req.params.id, {
    userId,
    nickname,
    avatar,
    content,
    replyToId
  });

  if (comment) {
    res.json({ success: true, comment: comment.toJSON() });
  } else {
    res.status(500).json({ success: false, message: '评论失败' });
  }
});

module.exports = router;

