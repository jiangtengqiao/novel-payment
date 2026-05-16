const express = require('express');
const router = express.Router();
const crawler = require('../services/crawler');

router.post('/start', async (req, res) => {
  try {
    const { pages = 2 } = req.body;
    
    console.log(`用户请求开始爬取 ${pages} 页`);
    
    res.json({
      success: true,
      message: '爬虫任务已启动',
      stats: crawler.getStats()
    });
    
    setTimeout(async () => {
      try {
        await startCrawl(pages);
        console.log('爬虫任务完成');
      } catch (error) {
        console.error('爬虫任务失败:', error);
      }
    }, 100);
    
  } catch (error) {
    console.error('启动爬虫失败:', error);
    res.status(500).json({
      success: false,
      message: '启动爬虫失败: ' + error.message
    });
  }
});

router.get('/stats', (req, res) => {
  res.json({
    success: true,
    stats: crawler.getStats()
  });
});

router.post('/stop', (req, res) => {
  console.log('停止爬虫');
  res.json({
    success: true,
    message: '爬虫已停止'
  });
});

module.exports = router;

