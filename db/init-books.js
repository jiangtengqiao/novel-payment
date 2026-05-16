
const { booksDB, chaptersDB } = require('./init');
const { v4: uuidv4 } = require('uuid');

const REAL_NOVELS = [
  {
    id: uuidv4(),
    title: '斗破苍穹',
    author: '天蚕土豆',
    cover: 'https://img9.doubanio.com/view/subject/l/public/s10863750.jpg',
    description: '这里是属于斗气的世界，没有花俏艳丽的魔法，有的，仅仅是繁衍到巅峰的斗气！',
    category: '玄幻',
    tags: ['系统', '升级流', '热血'],
    status: '已完结',
    isFree: true,
    pricePerChapter: 10,
    views: 15480000,
    likes: 428000,
    wordCount: 5320000,
    chapterCount: 1648,
    lastChapterId: null,
    createdAt: Date.now() - 315360000000,
    updatedAt: Date.now(),
    chapters: [
      { id: uuidv4(), title: '第一章 陨落的天才', content: '第一章 陨落的天才\n\n“萧炎，斗之气，三段！级别，低级！”\n\n测验魔石碑之前，一名中年男子看了一眼碑面之上显示的信息，语气中带有难以掩饰的嘲笑和不屑。', chapterNumber: 1, isFree: true, price: 0, wordCount: 2800, publishTime: Date.now() - 315360000000 },
      { id: uuidv4(), title: '第二章 斗气大陆', content: '第二章 斗气大陆\n\n斗气大陆，是以实力为尊的世界，这里，强者可以凭借自身实力享受无尽荣耀，而弱者，只能在强者的脚下瑟瑟发抖。', chapterNumber: 2, isFree: true, price: 0, wordCount: 3200, publishTime: Date.now() - 315360000000 + 3600000 },
      { id: uuidv4(), title: '第三章 神秘老者', content: '第三章 神秘老者\n\n萧炎回到自己的房间，正准备修炼，忽然听到一阵苍老的咳嗽声从纳戒中传来。', chapterNumber: 3, isFree: false, price: 10, wordCount: 3500, publishTime: Date.now() - 315360000000 + 7200000 },
    ]
  },
  {
    id: uuidv4(),
    title: '完美世界',
    author: '辰东',
    cover: 'https://img2.doubanio.com/view/subject/l/public/s29463107.jpg',
    description: '一粒尘可填海，一根草斩落日月星辰，弹指间诸天万界灰飞烟灭，一位少年从大荒中走出。',
    category: '玄幻',
    tags: ['热血', '玄幻', '成长'],
    status: '已完结',
    isFree: false,
    pricePerChapter: 15,
    views: 12360000,
    likes: 356000,
    wordCount: 6120000,
    chapterCount: 2014,
    lastChapterId: null,
    createdAt: Date.now() - 267840000000,
    updatedAt: Date.now(),
    chapters: [
      { id: uuidv4(), title: '第一章 大荒', content: '第一章 大荒\n\n大荒中，有石村，村中少年石昊，天生不凡，拥有至尊骨，却被族兄挖走。', chapterNumber: 1, isFree: true, price: 0, wordCount: 3100, publishTime: Date.now() - 267840000000 },
      { id: uuidv4(), title: '第二章 柳神', content: '第二章 柳神\n\n石村有柳树，自天外而来，是为柳神，守护石村一方安宁。', chapterNumber: 2, isFree: false, price: 15, wordCount: 3300, publishTime: Date.now() - 267840000000 + 7200000 },
    ]
  },
  {
    id: uuidv4(),
    title: '遮天',
    author: '辰东',
    cover: 'https://img1.doubanio.com/view/subject/l/public/s29239678.jpg',
    description: '冰冷与黑暗并存的宇宙深处，九具龙尸拉着一座铜棺，飞向宇宙尽头。',
    category: '玄幻',
    tags: ['热血', '古典仙侠', '修真'],
    status: '已完结',
    isFree: true,
    pricePerChapter: 12,
    views: 9860000,
    likes: 312000,
    wordCount: 6520000,
    chapterCount: 1880,
    lastChapterId: null,
    createdAt: Date.now() - 228960000000,
    updatedAt: Date.now(),
    chapters: [
      { id: uuidv4(), title: '第一章 九龙拉棺', content: '第一章 九龙拉棺\n\n冰冷与黑暗并存的宇宙深处，九具龙尸拉着一座铜棺，不知飞行了多少岁月。', chapterNumber: 1, isFree: true, price: 0, wordCount: 3600, publishTime: Date.now() - 228960000000 },
    ]
  },
  {
    id: uuidv4(),
    title: '凡人修仙传',
    author: '忘语',
    cover: 'https://img9.doubanio.com/view/subject/l/public/s29511391.jpg',
    description: '凡人流开山之作，一个普通山村少年，偶然进入一个小门派，开始修仙之路。',
    category: '仙侠',
    tags: ['凡人流', '修仙', '成长'],
    status: '已完结',
    isFree: false,
    pricePerChapter: 18,
    views: 8740000,
    likes: 289000,
    wordCount: 7480000,
    chapterCount: 2446,
    lastChapterId: null,
    createdAt: Date.now() - 181440000000,
    updatedAt: Date.now(),
    chapters: [
      { id: uuidv4(), title: '第一章 山村少年', content: '第一章 山村少年\n\n青牛镇外，有一个小山村，名落霞村，村里有个少年，叫韩立。', chapterNumber: 1, isFree: true, price: 0, wordCount: 2900, publishTime: Date.now() - 181440000000 },
    ]
  },
  {
    id: uuidv4(),
    title: '诡秘之主',
    author: '爱潜水的乌贼',
    cover: 'https://img1.doubanio.com/view/subject/l/public/s29854787.jpg',
    description: '蒸汽与机械的浪潮中，一位来自异世界的灵魂，在灰雾之上苏醒。',
    category: '悬疑',
    tags: ['悬疑', '西方幻想', '神秘'],
    status: '已完结',
    isFree: true,
    pricePerChapter: 20,
    views: 7680000,
    likes: 412000,
    wordCount: 4420000,
    chapterCount: 1432,
    lastChapterId: null,
    createdAt: Date.now() - 151200000000,
    updatedAt: Date.now(),
    chapters: [
      { id: uuidv4(), title: '第一章 红月', content: '第一章 红月\n\n克莱恩猛地从床上坐起，窗外是一轮诡异的红月，陌生的房间，陌生的世界。', chapterNumber: 1, isFree: true, price: 0, wordCount: 4200, publishTime: Date.now() - 151200000000 },
    ]
  },
  {
    id: uuidv4(),
    title: '全职高手',
    author: '蝴蝶蓝',
    cover: 'https://img3.doubanio.com/view/subject/l/public/s29515888.jpg',
    description: '网游荣耀教科书级别的顶尖高手，被俱乐部驱逐后，重新回归赛场的故事。',
    category: '游戏',
    tags: ['游戏', '热血', '竞技'],
    status: '已完结',
    isFree: false,
    pricePerChapter: 16,
    views: 6920000,
    likes: 368000,
    wordCount: 5680000,
    chapterCount: 1728,
    lastChapterId: null,
    createdAt: Date.now() - 120960000000,
    updatedAt: Date.now(),
    chapters: [
      { id: uuidv4(), title: '第一章 被驱逐的高手', content: '第一章 被驱逐的高手\n\n嘉世俱乐部，会议室，叶修平静地接过解约合同，十年荣耀，到此为止。', chapterNumber: 1, isFree: true, price: 0, wordCount: 3700, publishTime: Date.now() - 120960000000 },
    ]
  }
];

function initRealBooks() {
  console.log('📚 初始化真实小说数据...');
  
  const existingBooks = booksDB.getAll();
  if (Object.keys(existingBooks).length > 0) {
    console.log('✅ 小说数据已存在，跳过初始化');
    return;
  }
  
  let totalChapters = 0;
  
  REAL_NOVELS.forEach(book => {
    const bookCopy = { ...book };
    const chapters = bookCopy.chapters || [];
    delete bookCopy.chapters;
    
    bookCopy.chapterCount = chapters.length;
    if (chapters.length > 0) {
      bookCopy.lastChapterId = chapters[chapters.length - 1].id;
    }
    
    booksDB.set(bookCopy.id, bookCopy);
    
    chapters.forEach(chapter => {
      chapter.bookId = bookCopy.id;
      chaptersDB.set(chapter.id, chapter);
      totalChapters++;
    });
  });
  
  console.log(`✅ 初始化完成！共 ${REAL_NOVELS.length} 本小说，${totalChapters} 个章节`);
}

module.exports = { initRealBooks };

