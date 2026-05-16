const { booksDB, chaptersDB } = require('../db/init');
const { v4: uuidv4 } = require('uuid');

const CRAWLER_CONFIG = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  timeout: 10000,
  maxRetries: 1,
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
    console.log(`🕷️ 正在爬取第 ${page} 页书籍列表...`);
    
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
            const link = titleEl?.href || '';
            
            if (titleEl) {
              books.push({
                title: titleEl.textContent.trim(),
                author: authorEl?.textContent.replace('作者：', '').trim() || '佚名',
                description: descEl?.textContent.trim() || '',
                link: source.baseUrl + link,
                source: source.name
              });
            }
          });
          return books;
        }
      }
    ];

    let success = false;

    for (const source of sources) {
      try {
        console.log(`📚 从 ${source.name} 爬取...`);
        const html = await this.fetch(source.listUrl);
        const doc = this.parseHtml(html);
        const books = source.parseBook(doc, source);
        
        for (const bookData of books) {
          await this.processBook(bookData);
          await this.delay(300);
        }
        
        console.log(`✅ 从 ${source.name} 爬取了 ${books.length} 本书`);
        success = true;
      } catch (error) {
        console.warn(`⚠️ 从 ${source.name} 爬取失败:`, error.message);
        this.stats.errors++;
      }
    }

    if (!success) {
      console.log('⚠️ 外部爬取失败，生成模拟数据...');
      this.generateMockData();
    }

    this.stats.lastCrawlTime = new Date();
    console.log('✅ 爬取完成！');
  }

  generateMockData() {
    const mockBooks = [
      { 
        title: '无尽神域', 
        author: '萧鼎', 
        description: '一个关于修仙与命运的故事，主角经历重重磨难，最终成就大道。'
      },
      { 
        title: '逆天邪神', 
        author: '火星引力', 
        description: '一个少年逆天改命的传奇，从废柴到天才的逆袭之路。'
      },
      { 
        title: '武神主宰', 
        author: '暗魔师', 
        description: '一代武神的重生之路，重回少年时代，改写命运。'
      },
      { 
        title: '剑来', 
        author: '烽火戏诸侯', 
        description: '一个关于剑与江湖的故事，讲述一个少年的成长历程。'
      }
    ];

    for (const bookData of mockBooks) {
      const existingBooks = booksDB.getAll();
      const isExist = Object.values(existingBooks).find(
        b => b.title === bookData.title && b.author === bookData.author
      );

      if (!isExist) {
        const book = {
          id: uuidv4(),
          title: bookData.title,
          author: bookData.author,
          cover: null,
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
          source: '模拟数据',
          sourceUrl: null,
          lastUpdateTime: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        booksDB.set(book.id, book);
        this.stats.booksCrawled++;
        console.log(`✅ 添加书籍: ${book.title}`);

        this.addMockChapters(book.id);
      }
    }
  }

  addMockChapters(bookId) {
    const mockChapterTitles = [
      '第一章 初遇',
      '第二章 觉醒',
      '第三章 修炼',
      '第四章 挑战',
      '第五章 秘境'
    ];

    let chapterCount = 0;

    for (let i = 0; i < mockChapterTitles.length; i++) {
      const chapter = {
        id: uuidv4(),
        bookId,
        title: mockChapterTitles[i],
        content: this.generateMockContent(mockChapterTitles[i]),
        chapterNumber: i + 1,
        isFree: i < 3,
        price: 10,
        wordCount: 2000 + Math.floor(Math.random() * 1000),
        publishTime: Date.now(),
        createdAt: Date.now()
      };

      chaptersDB.set(chapter.id, chapter);
      chapterCount++;
      this.stats.chaptersCrawled++;
    }

    const book = booksDB.get(bookId);
    if (book) {
      book.chapterCount = chapterCount;
      booksDB.set(bookId, book);
    }
  }

  generateMockContent(title) {
    const paragraphs = [
      `这是《${title}》的正文内容。阳光透过窗户洒进房间，在地板上留下斑驳的光影。`,
      '主角站在窗前，望着远方的山峦，心中充满了对未来的期待和对未知的好奇。',
      '他深吸一口气，推开窗户，新鲜的空气扑面而来，让他精神一振。',
      '今天注定是不平凡的一天，他能感觉到，在他的内心深处，有什么东西正在觉醒。',
      '这不仅是一个新的开始，更是一段传奇的序章，谁也不知道未来会发生什么。',
      '但他已经准备好了，无论前方有多少艰难险阻，他都会勇敢地面对。',
      '因为他知道，只有经历过风雨，才能见到彩虹；只有经历过磨难，才能成就大业。',
      '他握紧拳头，眼中闪烁着坚定的光芒，朝着未来迈出了第一步。'
    ];

    return paragraphs.join('\n\n');
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

    this.addMockChapters(book.id);
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

async function startCrawl(pages = 1) {
  console.log('=== 开始爬取小说数据 ===');
  console.log(`计划爬取 ${pages} 页`);
  
  for (let i = 1; i <= pages; i++) {
    await crawler.crawlBookList(i);
    if (i < pages) {
      await crawler.delay(1000);
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
