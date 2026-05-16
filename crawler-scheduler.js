const cron = require('node-cron');
const { startCrawl } = require('./services/crawler');

console.log('爬虫定时任务已启动');

cron.schedule('0 3 * * *', async () => {
  console.log('\n========== 开始每日爬取任务 ==========');
  console.log('时间:', new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
  
  try {
    const stats = await startCrawl(3);
    console.log('本次爬取统计:', stats);
    console.log('======================================\n');
  } catch (error) {
    console.error('爬取失败:', error);
  }
}, {
  timezone: 'Asia/Shanghai'
});

console.log('定时任务: 每天凌晨3点自动爬取最新小说');

setTimeout(() => {
  console.log('\n是否现在立即开始爬取？按 Ctrl+C 取消...\n');
  setTimeout(async () => {
    try {
      console.log('开始立即爬取...');
      const stats = await startCrawl(2);
      console.log('爬取完成！统计:', stats);
    } catch (error) {
      console.error('立即爬取失败:', error);
    }
  }, 3000);
}, 2000);
