const express = require('express');
const router = express.Router();
const multer = require('multer');
const { booksDB, chaptersDB } = require('../db/init');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { title, author } = req.body;
    const filePath = req.file.path;
    
    console.log('📚 开始解析小说:', title);
    
    // 读取TXT文件内容
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 解析章节（按常见格式）
    const chapters = parseNovelChapters(content);
    
    console.log('✅ 解析完成，共', chapters.length, '章');
    
    // 创建书籍
    const bookId = uuidv4();
    const book = {
      id: bookId,
      title: title,
      author: author,
      description: '用户上传的小说',
      cover: null,
      genre: '未知',
      rating: 8.0,
      views: 0,
      status: '完结',
      chapters: chapters.length,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    booksDB.set(bookId, book);
    
    // 保存章节
    chapters.forEach((chapter, index) => {
      const chapterId = uuidv4();
      chaptersDB.set(chapterId, {
        id: chapterId,
        bookId: bookId,
        chapterNumber: index + 1,
        title: chapter.title,
        content: chapter.content,
        isFree: index < 10, // 前10章免费
        createdAt: Date.now()
      });
    });
    
    // 删除临时文件
    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      bookId: bookId,
      chapters: chapters.length
    });
  } catch (error) {
    console.error('❌ 上传失败:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

function parseNovelChapters(content) {
  const chapters = [];
  const lines = content.split('\n');
  let currentTitle = '';
  let currentContent = '';
  
  lines.forEach(line => {
    line = line.trim();
    if (!line) return;
    
    // 匹配章节标题（常见格式：第X章 标题 或 第X节 标题）
    const chapterMatch = line.match(/^第[0-9一二三四五六七八九十百千万]+[章节卷].*$/);
    
    if (chapterMatch) {
      // 保存上一章
      if (currentTitle && currentContent) {
        chapters.push({
          title: currentTitle,
          content: currentContent.trim()
        });
      }
      // 开始新章节
      currentTitle = line;
      currentContent = '';
    } else if (currentTitle) {
      currentContent += line + '\n';
    }
  });
  
  // 保存最后一章
  if (currentTitle && currentContent) {
    chapters.push({
      title: currentTitle,
      content: currentContent.trim()
    });
  }
  
  return chapters;
}

module.exports = router;
