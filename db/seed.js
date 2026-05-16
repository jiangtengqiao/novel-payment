
const Book = require('../models/book');
const User = require('../models/user');

const sampleBooks = [
  {
    title: '斗破苍穹',
    author: '天蚕土豆',
    category: '玄幻',
    tags: ['玄幻', '升级流', '热血'],
    description: '这里是属于斗气的世界，没有花俏艳丽的魔法，有的，仅仅是繁衍到巅峰的斗气！',
    isFree: true,
    status: 'completed'
  },
  {
    title: '完美世界',
    author: '辰东',
    category: '玄幻',
    tags: ['玄幻', '热血', '爽文'],
    description: '一粒尘可填海，一根草斩落星辰，弹指间诸天万界灰飞烟灭。',
    isFree: false,
    pricePerChapter: 15,
    status: 'completed'
  },
  {
    title: '遮天',
    author: '辰东',
    category: '玄幻',
    tags: ['玄幻', '修仙', '热血'],
    description: '冰冷与黑暗并存的宇宙深处，九具庞大的龙尸拉着一口青铜古棺，正在快速接近地球。',
    isFree: true,
    status: 'completed'
  },
  {
    title: '凡人修仙传',
    author: '忘语',
    category: '仙侠',
    tags: ['仙侠', '修仙', '凡人流'],
    description: '一个普通山村少年，偶然下进入到当地江湖小门派，成了一名记名弟子。',
    isFree: false,
    pricePerChapter: 12,
    status: 'completed'
  },
  {
    title: '诛仙',
    author: '萧鼎',
    category: '仙侠',
    tags: ['仙侠', '经典', '虐心'],
    description: '天地不仁，以万物为刍狗！一个普通青年的修仙之路。',
    isFree: true,
    status: 'completed'
  },
  {
    title: '鬼吹灯',
    author: '天下霸唱',
    category: '悬疑',
    tags: ['悬疑', '盗墓', '探险'],
    description: '胡八一上山下乡来到东北地区，在一个叫做岗岗营子的村庄插队时，遇到了一系列诡异的事情。',
    isFree: true,
    status: 'completed'
  },
  {
    title: '盗墓笔记',
    author: '南派三叔',
    category: '悬疑',
    tags: ['悬疑', '盗墓', '惊悚'],
    description: '五十年前，一群长沙土夫子挖到了一件战国古墓，从此开启了一个惊天秘密。',
    isFree: false,
    pricePerChapter: 10,
    status: 'ongoing'
  },
  {
    title: '全职高手',
    author: '蝴蝶蓝',
    category: '游戏',
    tags: ['游戏', '电竞', '热血'],
    description: '网游荣耀中被誉为教科书级别的顶尖高手叶修，被俱乐部驱逐后重新回归的故事。',
    isFree: true,
    status: 'completed'
  }
];

const sampleChapters = [
  { title: '第一章 陨落的天才', content: '斗气大陆，加玛帝国，乌坦城...' },
  { title: '第二章 斗气大陆', content: '斗气修炼，分为十一个境界...' },
  { title: '第三章 坊市', content: '第二天清晨，萧炎早早的起了床...' },
  { title: '第四章 休书', content: '纳兰嫣然，你给我站住！' },
  { title: '第五章 三年之约', content: '纳兰嫣然，今日之辱，我萧炎记下了！' }
];

function initSampleData() {
  console.log('正在初始化示例数据...');
  
  const existing = Book.findAll({ limit: 1 });
  if (existing.length > 0) {
    console.log('已有数据，跳过初始化');
    return;
  }

  sampleBooks.forEach((bookData, index) => {
    const book = Book.create({
      ...bookData,
      views: Math.floor(Math.random() * 1000000) + 100000,
      likes: Math.floor(Math.random() * 100000) + 10000,
      wordCount: 0,
      chapterCount: 0
    });
    
    sampleChapters.forEach((chapter, chapterIndex) => {
      book.addChapter({
        ...chapter,
        content: chapter.content + '\n\n' + '这是第' + (chapterIndex + 1) + '章的内容...\n'.repeat(20),
        isFree: chapterIndex < 3
      });
    });

    console.log(`已添加书籍: ${book.title} (${book.chapterCount}章)`);
  });

  console.log('示例数据初始化完成！');
}

module.exports = { initSampleData };

