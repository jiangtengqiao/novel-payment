
const express = require('express');
const router = express.Router();
const Book = require('../models/book');
const User = require('../models/user');
const Bookshelf = require('../models/bookshelf');

router.get('/categories', (req, res) => {
  const categories = [
    { id: '玄幻', name: '玄幻', count: 1234 },
    { id: '仙侠', name: '仙侠', count: 987 },
    { id: '都市', name: '都市', count: 856 },
    { id: '历史', name: '历史', count: 654 },
    { id: '游戏', name: '游戏', count: 543 },
    { id: '悬疑', name: '悬疑', count: 432 },
    { id: '科幻', name: '科幻', count: 321 }
  ];
  res.json({ success: true, categories });
});

router.get('/list', (req, res) => {
  const { category, status, search, sortBy, limit = 20, page = 1 } = req.query;
  
  const options = {
    category,
    status,
    search,
    sortBy,
    limit: parseInt(limit)
  };
  
  const books = Book.findAll(options).map(b => b.toJSON());
  res.json({ success: true, books, total: books.length });
});

router.get('/recommend', (req, res) => {
  const hot = Book.findAll({ sortBy: 'views', limit: 6 });
  const newBooks = Book.findAll({ limit: 6 });
  const topLikes = Book.findAll({ sortBy: 'likes', limit: 6 });
  
  res.json({
    success: true,
    hot: hot.map(b => b.toJSON()),
    new: newBooks.map(b => b.toJSON()),
    topLikes: topLikes.map(b => b.toJSON())
  });
});

router.get('/:bookId', (req, res) => {
  const book = Book.findById(req.params.bookId);
  if (!book) {
    return res.status(404).json({ success: false, message: '书籍不存在' });
  }
  
  book.views++;
  book.update({ views: book.views });
  
  res.json({ success: true, book: book.toJSON() });
});

router.get('/:bookId/chapters', (req, res) => {
  const book = Book.findById(req.params.bookId);
  if (!book) {
    return res.status(404).json({ success: false, message: '书籍不存在' });
  }
  
  const chapters = book.getChapters();
  res.json({ success: true, chapters });
});

router.get('/:bookId/chapters/:chapterId', (req, res) => {
  const book = Book.findById(req.params.bookId);
  if (!book) {
    return res.status(404).json({ success: false, message: '书籍不存在' });
  }
  
  const chapter = book.getChapter(req.params.chapterId);
  if (!chapter) {
    return res.status(404).json({ success: false, message: '章节不存在' });
  }
  
  res.json({ success: true, chapter });
});

module.exports = router;

