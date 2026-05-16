
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Bookshelf = require('../models/bookshelf');

router.get('/profile/:email', (req, res) => {
  const user = User.findByEmail(req.params.email);
  if (!user) {
    return res.status(404).json({ success: false, message: '用户不存在' });
  }
  res.json({ success: true, user: user.toJSON() });
});

router.put('/profile/:email', (req, res) => {
  const user = User.findByEmail(req.params.email);
  if (!user) {
    return res.status(404).json({ success: false, message: '用户不存在' });
  }
  
  const { nickname, bio, avatar, phone, gender, birthday } = req.body;
  user.update({ nickname, bio, avatar, phone, gender, birthday });
  
  res.json({ success: true, user: user.toJSON() });
});

router.get('/:email/bookshelf', (req, res) => {
  const shelf = new Bookshelf(req.params.email);
  res.json({ success: true, bookshelf: shelf.toJSON() });
});

router.post('/:email/bookshelf', (req, res) => {
  const { bookId, category } = req.body;
  const shelf = new Bookshelf(req.params.email);
  const added = shelf.addBook(bookId, category);
  
  if (added) {
    res.json({ success: true, bookshelf: shelf.toJSON() });
  } else {
    res.status(400).json({ success: false, message: '已在书架中' });
  }
});

router.delete('/:email/bookshelf/:bookId', (req, res) => {
  const shelf = new Bookshelf(req.params.email);
  shelf.removeBook(req.params.bookId);
  res.json({ success: true, bookshelf: shelf.toJSON() });
});

router.get('/:email/history', (req, res) => {
  const shelf = new Bookshelf(req.params.email);
  res.json({ success: true, history: shelf.getRecentHistory() });
});

module.exports = router;

