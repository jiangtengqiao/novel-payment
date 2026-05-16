
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { chaptersDB } = require('../db/init');

class DownloadService {
  constructor() {
    this.encryptionKey = process.env.DOWNLOAD_KEY || 'novel-platform-2024-secure-key';
  }

  encryptContent(content, format = 'txt') {
    const encrypted = Buffer.from(content).toString('base64');
    return encrypted;
  }

  generateBookFile(bookId, chapters, format = 'txt') {
    let content = '';
    
    chapters.forEach((chapter, index) => {
      content += `\n\n第${index + 1}章 ${chapter.title}\n\n`;
      content += chapter.content + '\n\n';
    });

    switch (format) {
      case 'txt':
        return Buffer.from(content, 'utf8');
      case 'encrypted':
        return Buffer.from(this.encryptContent(content, 'encrypted'));
      default:
        return Buffer.from(content, 'utf8');
    }
  }

  generateDownloadToken(userId, bookId, format) {
    const data = `${userId}-${bookId}-${format}-${Date.now()}`;
    const token = crypto.createHash('sha256')
      .update(data + this.encryptionKey)
      .digest('hex');
    return token;
  }

  verifyDownloadToken(token, userId, bookId, format) {
    const expectedToken = this.generateDownloadToken(userId, bookId, format);
    return token === expectedToken;
  }

  downloadChapter(bookId, chapterId, userId, isVip) {
    const book = { id: bookId };
    const chapter = {
      id: chapterId,
      title: '章节',
      content: '章节内容',
      isFree: false,
      price: 10
    };

    if (!chapter.isFree && !isVip) {
      return {
        success: false,
        message: '需要VIP或购买后才能下载'
      };
    }

    const content = this.encryptContent(chapter.content, 'encrypted');
    
    return {
      success: true,
      content,
      format: 'encrypted'
    };
  }

  downloadBook(bookId, userId, isVip, format = 'txt') {
    const allChapters = Object.values(chaptersDB.getAll() || {});
    const bookChapters = allChapters
      .filter(c => c.bookId === bookId)
      .sort((a, b) => a.chapterNumber - b.chapterNumber);

    if (bookChapters.length === 0) {
      return {
        success: false,
        message: '书籍章节不存在'
      };
    }

    const allFree = bookChapters.every(c => c.isFree);
    if (!allFree && !isVip) {
      return {
        success: false,
        message: '需要VIP才能下载整本书'
      };
    }

    const fileContent = this.generateBookFile(bookId, bookChapters, format);
    const token = this.generateDownloadToken(userId, bookId, format);

    return {
      success: true,
      content: fileContent,
      format,
      token,
      filename: `${bookId}_${format}.${format === 'encrypted' ? 'nba' : format}`
    };
  }
}

module.exports = new DownloadService();

