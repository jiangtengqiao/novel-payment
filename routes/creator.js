
const express = require('express');
const router = express.Router();
const Book = require('../models/book');
const User = require('../models/user');

router.get('/my-books', (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ success: false, message: '缺少用户ID' });
  }

  const allBooks = Book.findAll({});
  const myBooks = allBooks.filter(book => book.authorId === userId);

  res.json({ success: true, books: myBooks.map(b => b.toJSON()) });
});

router.get('/stats', (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ success: false, message: '缺少用户ID' });
  }

  const allBooks = Book.findAll({});
  const myBooks = allBooks.filter(book => book.authorId === userId);

  const totalViews = myBooks.reduce((sum, book) => sum + book.views, 0);
  const totalLikes = myBooks.reduce((sum, book) => sum + book.likes, 0);
  const totalChapters = myBooks.reduce((sum, book) => sum + book.chapterCount, 0);
  const totalWords = myBooks.reduce((sum, book) => sum + book.wordCount, 0);

  res.json({
    success: true,
    stats: {
      bookCount: myBooks.length,
      totalViews,
      totalLikes,
      totalChapters,
      totalWords
    }
  });
});

router.post('/become-author', (req, res) => {
  const { email } = req.body;
  
  const user = User.findByEmail(email);
  if (!user) {
    return res.status(404).json({ success: false, message: '用户不存在' });
  }

  user.update({ isAuthor: true });
  
  res.json({ 
    success: true, 
    message: '已成为作者',
    user: user.toJSON() 
  });
});

router.get('/earnings', (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ success: false, message: '缺少用户ID' });
  }

  const allBooks = Book.findAll({});
  const myBooks = allBooks.filter(book => book.authorId === userId);

  const estimatedRevenue = myBooks.reduce((sum, book) => {
    return sum + (book.chapterCount * book.pricePerChapter * 0.3);
  }, 0);

  res.json({
    success: true,
    earnings: {
      totalRevenue: estimatedRevenue,
      pendingRevenue: estimatedRevenue * 0.7,
      withdrawnRevenue: 0
    }
  });
});

module.exports = router;

