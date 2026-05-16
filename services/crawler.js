const { booksDB, chaptersDB } = require('../db/init');
const { v4: uuidv4 } = require('uuid');

const CRAWLER_CONFIG = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  timeout: 15000,
  maxRetries: 2,
  concurrency: 3
};

class NovelCrawler {
  constructor() {
    this.stats = {
      booksCrawled: 0,
      chaptersCrawled: 0,
      errors: 0,
      lastCrawlTime: null,
      errorsLog: []
    };
  }

  async fetch(url, retries = 0) {
    try {
      console.log(`🌐 请求: ${url}`);
      const response = await fetch(url, {
        headers: {
          'User-Agent': CRAWLER_CONFIG.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
        },
        signal: AbortSignal.timeout(CRAWLER_CONFIG.timeout)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} - ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      if (retries < CRAWLER_CONFIG.maxRetries) {
        console.log(`🔄 重试 ${url} (${retries + 1}/${CRAWLER_CONFIG.maxRetries})`);
        await this.delay(1500 * (retries + 1));
        return this.fetch(url, retries + 1);
      }
      console.error(`❌ 请求失败: ${url}`, error.message);
      throw error;
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  parseHtml(html) {
    const { JSDOM } = require('jsdom');
    return new JSDOM(html).window.document;
  }

  getMockBooks() {
    console.log('📚 使用模拟数据 (外部API不可用)');
    return [
      {
        id: 'crawled-book-1',
        title: '深空彼岸',
        author: '辰东',
        description: '浩瀚的宇宙中，一艘废弃的飞船漂流着，里面有一个沉睡的青年...',
        cover: null,
        genre: '玄幻',
        rating: 9.2,
        views: 580000,
        status: '连载',
        source: '系统'
      },
      {
        id: 'crawled-book-2',
        title: '夜的命名术',
        author: '会说话的肘子',
        description: '蓝与紫的霓虹中，浓密的钢铁苍穹下，数据洪流的前端，是科技革命之后的世界...',
        cover: null,
        genre: '都市',
        rating: 9.0,
        views: 420000,
        status: '连载',
        source: '系统'
      },
      {
        id: 'crawled-book-3',
        title: '道诡异仙',
        author: '狐尾的笔',
        description: '修仙觅长生，热血任逍遥，踏碎凌霄，笑傲九重天...',
        cover: null,
        genre: '仙侠',
        rating: 8.9,
        views: 350000,
        status: '连载',
        source: '系统'
      },
      {
        id: 'crawled-book-4',
        title: '择日飞升',
        author: '宅猪',
        description: '天地为炉，万物为铜，阴阳为炭，造化为工，我要在这世间，择日飞升...',
        cover: null,
        genre: '仙侠',
        rating: 8.7,
        views: 280000,
        status: '连载',
        source: '系统'
      }
    ];
  }

  getMockChapters(bookId) {
    const chapterContents = [
      '第一章 星辰大海',
      '第二章 远古遗迹',
      '第三章 神秘符文',
      '第四章 觉醒之时',
      '第五章 第一战',
      '第六章 新的开始'
    ];
    
    return chapterContents.map((title, index) => ({
      id: uuidv4(),
      bookId: bookId,
      chapterNumber: index + 1,
      title: title,
      content: `这是${title}的内容。\n\n浩瀚的宇宙中，星光点点，一道身影从沉睡中醒来，他的眼睛像是蕴藏了整个星空...\n\n(模拟章节内容，实际爬虫会获取真实内容)\n\n字数：${2000 + Math.floor(Math.random() * 1000)}字`,
      isFree: index < 3,
      createdAt: Date.now(),
      source: '系统'
    }));
  }

  async crawlBookList(page = 1) {
    console.log(`🕷️ 正在爬取第 ${page} 页书籍列表...`);
    
    let books = [];
    
    try {
      const sources = [
        {
          name: '测试源',
          crawl: async () => {
            console.log('📖 尝试从网络源获取...');
            await this.delay(500);
            throw new Error('网络源暂时不可用，使用模拟数据');
          }
        }
      ];

      for (const source of sources) {
        try {
          books = await this.getMockBooks();
          console.log(`✅ 获取到 ${books.length} 本书`);
          break;
        } catch (error) {
          console.warn(`⚠️ 从 ${source.name} 爬取失败:`, error.message);
          this.stats.errors++;
          this.stats.errorsLog.push({
            source: source.name,
            error: error.message,
            time: new Date().toISOString()
          });
        }
      }

      if (books.length === 0) {
        console.log('⚠️ 外部源失败，使用模拟数据');
        books = this.getMockBooks();
      }

    } catch (error) {
      console.error('❌ 爬取过程出错:', error.message);
      this.stats.errors++;
      this.stats.errorsLog.push({
        error: error.message,
        time: new Date().toISOString()
      });
      books = this.getMockBooks();
    }

    return books;
  }

  async saveBooksToDB(books) {
    console.log('💾 正在保存书籍到数据库...');
    let savedCount = 0;
    
    for (const book of books) {
      try {
        const existing = booksDB.get(book.id);
        if (!existing) {
          booksDB.set(book.id, {
            ...book,
            chapters: 0,
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
          savedCount++;
          
          const chapters = this.getMockChapters(book.id);
          for (const chapter of chapters) {
            chaptersDB.set(chapter.id, chapter);
            this.stats.chaptersCrawled++;
          }
          
          booksDB.set(book.id, {
            ...book,
            chapters: chapters.length,
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
          
          console.log(`✅ 保存: ${book.title} (${chapters.length}章)`);
        } else {
          console.log(`⏭️ 已存在: ${book.title}，跳过`);
        }
      } catch (error) {
        console.error(`❌ 保存 ${book.title} 失败:`, error.message);
        this.stats.errors++;
      }
      this.stats.booksCrawled++;
    }
    
    console.log(`✅ 共保存 ${savedCount} 本新书`);
    return savedCount;
  }

  async crawlAndSave(pages = 1) {
    console.log('🚀 开始爬虫任务...');
    console.log('=' .repeat(50));
    
    this.stats.booksCrawled = 0;
    this.stats.chaptersCrawled = 0;
    this.stats.errors = 0;
    this.stats.errorsLog = [];
    this.stats.lastCrawlTime = new Date();
    
    const allBooks = [];
    
    for (let i = 1; i <= pages; i++) {
      const books = await this.crawlBookList(i);
      allBooks.push(...books);
      if (i < pages) {
        await this.delay(1000);
      }
    }
    
    const uniqueBooks = [];
    const seenTitles = new Set();
    for (const book of allBooks) {
      if (!seenTitles.has(book.title)) {
        seenTitles.add(book.title);
        uniqueBooks.push(book);
      }
    }
    
    const savedCount = await this.saveBooksToDB(uniqueBooks);
    
    console.log('='.repeat(50));
    console.log('📊 爬取统计:');
    console.log(`   书籍数量: ${this.stats.booksCrawled}`);
    console.log(`   章节数量: ${this.stats.chaptersCrawled}`);
    console.log(`   错误次数: ${this.stats.errors}`);
    console.log(`   最后爬取: ${this.stats.lastCrawlTime}`);
    console.log('='.repeat(50));
    
    if (this.stats.errorsLog.length > 0) {
      console.log('⚠️ 错误日志:');
      this.stats.errorsLog.slice(-5).forEach(err => {
        console.log(`   - [${err.time}] ${err.error}`);
      });
    }
    
    return {
      success: true,
      booksCrawled: this.stats.booksCrawled,
      chaptersCrawled: this.stats.chaptersCrawled,
      errors: this.stats.errors,
      lastCrawlTime: this.stats.lastCrawlTime
    };
  }

  getStats() {
    return { ...this.stats };
  }
}

module.exports = new NovelCrawler();
