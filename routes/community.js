const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

let posts = [
  {
    id: '1',
    title: '《斗破苍穹》最新章节太燃了！萧炎终于突破斗帝了！',
    author: '书友小明',
    time: '2小时前',
    content: '今天更新的章节真的太精彩了！萧炎在古界大战中突破斗帝境界，一招毁天灭地，直接碾压魂天帝！看到这里我激动得不行，土豆的文笔越来越厉害了...',
    tags: ['斗破苍穹', '讨论'],
    likes: 1892,
    comments: 456,
    views: 3247,
    type: 'discussion',
    createdAt: Date.now() - 7200000
  },
  {
    id: '2',
    title: '推荐几本近期发现的宝藏小说，熬夜看完太爽了！',
    author: '资深书虫',
    time: '5小时前',
    content: '最近书荒找了很久，终于发现了几本超级好看的小说！《深空彼岸》的世界观设定太宏大了，辰东不愧是大神！还有《夜的命名术》，脑洞真的很大...',
    tags: ['推荐', '书单'],
    likes: 5678,
    comments: 1234,
    views: 8921,
    type: 'recommend',
    createdAt: Date.now() - 18000000
  },
  {
    id: '3',
    title: '深度解析《诡秘之主》的世界观和人物塑造',
    author: '书评达人',
    time: '昨天',
    content: '乌贼的《诡秘之主》真的是近年来最优秀的玄幻小说之一！从序列体系到人物成长，每一个细节都经得起推敲。克莱恩的成长轨迹太真实了...',
    tags: ['书评', '分析', '诡秘之主'],
    likes: 8901,
    comments: 2345,
    views: 15678,
    type: 'review',
    createdAt: Date.now() - 86400000
  }
];

router.get('/stats', (req, res) => {
  res.json({
    success: true,
    totalPosts: posts.length + 100,
    todayPosts: Math.floor(Math.random() * 20) + 5,
    activeUsers: Math.floor(Math.random() * 500) + 100
  });
});

router.get('/posts', (req, res) => {
  const type = req.query.type || 'all';
  
  let filteredPosts = posts;
  if (type !== 'all') {
    if (['recommend', 'review', 'discussion', 'activity', 'announcement'].includes(type)) {
      filteredPosts = posts.filter(p => p.type === type);
    }
  }
  
  res.json({
    success: true,
    posts: filteredPosts
  });
});

router.post('/posts', (req, res) => {
  const { title, type, content } = req.body;
  
  const newPost = {
    id: uuidv4(),
    title: title,
    author: '匿名用户',
    time: '刚刚',
    content: content,
    tags: [type],
    likes: 0,
    comments: 0,
    views: 1,
    type: type,
    createdAt: Date.now()
  };
  
  posts.unshift(newPost);
  
  res.json({
    success: true,
    post: newPost
  });
});

router.post('/posts/:id/like', (req, res) => {
  const postId = req.params.id;
  const post = posts.find(p => p.id === postId);
  
  if (post) {
    post.likes = (post.likes || 0) + 1;
    res.json({
      success: true,
      likes: post.likes
    });
  } else {
    res.status(404).json({
      success: false,
      message: '帖子不存在'
    });
  }
});

module.exports = router;
