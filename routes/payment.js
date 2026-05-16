
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Book = require('../models/book');

router.post('/unlock-chapter', async (req, res) => {
  try {
    const { email, chapterId, bookId } = req.body;
    
    if (!email || !chapterId || !bookId) {
      return res.status(400).json({ 
        success: false, 
        message: '缺少必要参数' 
      });
    }

    const user = User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: '用户不存在' 
      });
    }

    const book = Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ 
        success: false, 
        message: '书籍不存在' 
      });
    }

    const chapter = book.getChapter(chapterId);
    if (!chapter) {
      return res.status(404).json({ 
        success: false, 
        message: '章节不存在' 
      });
    }

    if (chapter.isFree) {
      return res.json({ 
        success: true, 
        message: '章节免费，无需购买',
        unlocked: true 
      });
    }

    if (user.vipExpireTime && new Date(user.vipExpireTime) > new Date()) {
      return res.json({ 
        success: true, 
        message: 'VIP会员可免费阅读',
        unlocked: true,
        isVip: true
      });
    }

    const price = chapter.price || book.pricePerChapter;
    
    if (user.coins < price) {
      return res.status(400).json({ 
        success: false, 
        message: `书币不足，需要 ${price} 书币，当前 ${user.coins} 书币`,
        required: price,
        current: user.coins
      });
    }

    const success = user.spendCoins(price);
    if (success) {
      return res.json({ 
        success: true, 
        message: `成功消耗 ${price} 书币`,
        unlocked: true,
        remainingCoins: user.coins
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        message: '书币扣除失败' 
      });
    }

  } catch (error) {
    console.error('解锁章节失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
});

router.get('/chapter-price', (req, res) => {
  const { bookId, chapterId } = req.query;
  
  const book = Book.findById(bookId);
  if (!book) {
    return res.status(404).json({ 
      success: false, 
      message: '书籍不存在' 
    });
  }

  const chapter = book.getChapter(chapterId);
  if (!chapter) {
    return res.status(404).json({ 
      success: false, 
      message: '章节不存在' 
    });
  }

  res.json({
    success: true,
    price: chapter.price || book.pricePerChapter,
    isFree: chapter.isFree
  });
});

router.post('/check-vip', (req, res) => {
  const { email } = req.body;
  
  const user = User.findByEmail(email);
  if (!user) {
    return res.status(404).json({ 
      success: false, 
      message: '用户不存在' 
    });
  }

  const isVip = user.vipExpireTime && new Date(user.vipExpireTime) > new Date();
  
  res.json({
    success: true,
    isVip,
    expireTime: user.vipExpireTime
  });
});

module.exports = router;

