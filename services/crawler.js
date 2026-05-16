const { booksDB, chaptersDB } = require('../db/init');
const { v4: uuidv4 } = require('uuid');

const CRAWLER_CONFIG = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  timeout: 30000,
  maxRetries: 3,
  concurrency: 2
};

class NovelCrawler {
  constructor() {
    this.stats = {
      booksCrawled: 0,
      chaptersCrawled: 0,
      errors: 0,
      lastCrawlTime: null
    };
  }

  async fetch(url, retries = 0) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': CRAWLER_CONFIG.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
        },
        signal: AbortSignal.timeout(CRAWLER_CONFIG.timeout)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      if (retries < CRAWLER_CONFIG.maxRetries) {
        console.log(`重试 ${url} (${retries + 1}/${CRAWLER_CONFIG.maxRetries})`);
        await this.delay(1000 * (retries + 1));
        return this.fetch(url, retries + 1);
      }
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

  async crawlBookList(page = 1) {
    console.log(`正在爬取第 ${page} 页书籍列表...`);
    
    const sources = [
      {
        name: '笔趣阁',
        baseUrl: 'https://www.xbiquwx.la',
        listUrl: `https://www.xbiquwx.la/list/${page}.html`,
        selector: '.item',
        parseBook: (doc, source) => {
          const books = [];
          const items = doc.querySelectorAll('.book-item');
          items.forEach(item => {
            const titleEl = item.querySelector('.book-title a');
            const authorEl = item.querySelector('.author');
            const descEl = item.querySelector('.desc');
            const coverEl = item.querySelector('.book-cover img');
            const link = titleEl?.href || '';
            
            if (titleEl) {
              books.push({
                title: titleEl.textContent.trim(),
                author: authorEl?.textContent.replace('作者：', '').trim() || '佚名',
                description: descEl?.textContent.trim() || '',
                cover: coverEl?.src || null,
                link: source.baseUrl + link,
                source: source.name
              });
            }
          });
          return books;
        }
      },
      {
        name: '起点中文网镜像',
        baseUrl: 'https://www.qidian.com',
        listUrl: `https://www.qidian.com/free/`,
        selector: '.book-cover',
        parseBook: (doc, source) => {
          const books = [];
          const items = doc.querySelectorAll('.book-list-wrap .book-img-text li');
          items.forEach(item => {
            const titleEl = item.querySelector('h4 a');
            const authorEl = item.querySelector('.author a');
            const descEl = item.querySelector('.desc');
            const coverEl = item.querySelector('.book-cover img');
            const link = titleEl?.href || '';
            
            if (titleEl) {
              books.push({
                title: titleEl.textContent.trim(),
                author: authorEl?.textContent.trim() || '佚名',
                description: descEl?.textContent.trim() || '',
                cover: coverEl?.src || null,
                link: link,
                source: source.name
              });
            }
          });
          return books;
        }
      }
    ];

    for (const source of sources) {
      try {
        console.log(`从 ${source.name} 爬取...`);
        const html = await this.fetch(source.listUrl);
        const doc = this.parseHtml(html);
        const books = source.parseBook(doc, source);
        
        for (const bookData of books) {
          await this.processBook(bookData);
          await this.delay(500);
        }
        
        console.log(`从 ${source.name} 爬取了 ${books.length} 本书`);
      } catch (error) {
        console.error(`从 ${source.name} 爬取失败:`, error.message);
        this.stats.errors++;
      }
    }

    this.stats.lastCrawlTime = new Date();
    console.log('爬取完成!');
  }

  async processBook(bookData) {
    const existingBooks = booksDB.getAll();
    const isExist = Object.values(existingBooks).find(
      b => b.title === bookData.title && b.author === bookData.author
    );

    if (isExist) {
      console.log(`书籍已存在: ${bookData.title}`);
      return;
    }

    const book = {
      id: uuidv4(),
      title: bookData.title,
      author: bookData.author,
      cover: bookData.cover,
      description: bookData.description,
      category: this.guessCategory(bookData.title, bookData.description),
      tags: this.extractTags(bookData.title, bookData.description),
      status: 'ongoing',
      isFree: true,
      pricePerChapter: 10,
      views: Math.floor(Math.random() * 100000),
      likes: Math.floor(Math.random() * 10000),
      wordCount: 0,
      chapterCount: 0,
      lastChapterId: null,
      source: bookData.source,
      sourceUrl: bookData.link,
      lastUpdateTime: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    booksDB.set(book.id, book);
    this.stats.booksCrawled++;
    console.log(`已添加书籍: ${book.title}`);

    if (bookData.link && bookData.link.startsWith('http')) {
      await this.crawlChapters(book.id, bookData.link);
    }
  }

  async crawlChapters(bookId, bookUrl) {
    console.log(`正在爬取章节列表: ${bookUrl}`);
    
    try {
      const html = await this.fetch(bookUrl);
      const doc = this.parseHtml(html);
      
      const chapterLinks = doc.querySelectorAll('.chapter-list a, .list-content a, #chapterList a');
      let chapterCount = 0;
      
      for (const link of chapterLinks) {
        if (chapterCount >= 50) break;
        
        const chapterUrl = link.href;
        const chapterTitle = link.textContent.trim();
        
        if (chapterUrl && chapterTitle && chapterUrl.startsWith('http')) {
          await this.crawlChapterContent(bookId, chapterUrl, chapterTitle);
          await this.delay(300);
          chapterCount++;
        }
      }
      
      const book = booksDB.get(bookId);
      if (book) {
        book.chapterCount = chapterCount;
        booksDB.set(bookId, book);
      }
    } catch (error) {
      console.error(`爬取章节失败: ${bookUrl}`, error.message);
      this.stats.errors++;
    }
  }

  async crawlChapterContent(bookId, chapterUrl, chapterTitle) {
    try {
      const html = await this.fetch(chapterUrl);
      const doc = this.parseHtml(html);
      
      const contentEl = doc.querySelector('.chapter-content, #chapter-content, .content, .book-content');
      let content = contentEl?.textContent?.trim() || '';
      
      content = content.replace(/\s+/g, '\n').trim();
      
      if (content.length < 100) {
        const paragraphs = doc.querySelectorAll('p');
        content = Array.from(paragraphs).map(p => p.textContent.trim()).filter(t => t.length > 10).join('\n\n');
      }

      if (content.length < 100) {
        return;
      }

      const book = booksDB.get(bookId);
      const chapterNumber = (book?.chapterCount || 0) + 1;

      const chapter = {
        id: uuidv4(),
        bookId,
        title: chapterTitle,
        content,
        chapterNumber,
        isFree: true,
        price: 10,
        wordCount: content.length,
        publishTime: Date.now(),
        createdAt: Date.now()
      };

      chaptersDB.set(chapter.id, chapter);

      if (book) {
        book.chapterCount = chapterNumber;
        book.wordCount += chapter.wordCount;
        book.lastChapterId = chapter.id;
        book.lastUpdateTime = Date.now();
        booksDB.set(bookId, book);
      }

      this.stats.chaptersCrawled++;
    } catch (error) {
      console.error(`爬取章节内容失败: ${chapterUrl}`, error.message);
    }
  }

  guessCategory(title, description) {
    const text = (title + ' ' + description).toLowerCase();
    
    const categories = {
      '玄幻': ['玄幻', '斗气', '魔法', '异世', '重生', '系统', '无敌'],
      '仙侠': ['仙侠', '修真', '修仙', '飞升', '道祖', '天师'],
      '都市': ['都市', '总裁', '豪门', '兵王', '战神', '医生', '教师'],
      '历史': ['历史', '穿越', '架空', '三国', '大唐', '明朝'],
      '游戏': ['游戏', '电竞', '虚拟', '网游', '主播'],
      '悬疑': ['悬疑', '推理', '侦探', '灵异', '恐怖', '惊悚'],
      '科幻': ['科幻', '星际', '机甲', '末世', '废土', '位面']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(kw => text.includes(kw))) {
        return category;
      }
    }
    
    return '其他';
  }

  extractTags(title, description) {
    const text = (title + ' ' + description).toLowerCase();
    const tags = [];
    
    const tagKeywords = {
      '热血': ['热血', '激情'],
      '爽文': ['爽文', '逆袭', '崛起'],
      '搞笑': ['搞笑', '幽默', '轻松'],
      '甜宠': ['甜宠', '甜蜜', '宠文'],
      '虐心': ['虐心', '虐文', '虐恋'],
      '穿越': ['穿越', '重生'],
      '异能': ['异能', '超能力'],
      '校园': ['校园', '大学', '高中']
    };

    for (const [tag, keywords] of Object.entries(tagKeywords)) {
      if (keywords.some(kw => text.includes(kw))) {
        tags.push(tag);
      }
    }

    return tags.slice(0, 3);
  }

  getStats() {
    return this.stats;
  }
}

const crawler = new NovelCrawler();

async function startCrawl(pages = 3) {
  console.log('=== 开始爬取小说数据 ===');
  console.log(`计划爬取 ${pages} 页`);
  
  for (let i = 1; i <= pages; i++) {
    await crawler.crawlBookList(i);
    if (i < pages) {
      await crawler.delay(2000);
    }
  }
  
  const stats = crawler.getStats();
  console.log('\n=== 爬取统计 ===');
  console.log(`书籍数量: ${stats.booksCrawled}`);
  console.log(`章节数量: ${stats.chaptersCrawled}`);
  console.log(`错误次数: ${stats.errors}`);
  console.log(`最后爬取: ${stats.lastCrawlTime}`);
  console.log('====================\n');
  
  return stats;
}

module.exports = { NovelCrawler, crawler, startCrawl };
