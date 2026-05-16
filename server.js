
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const paymentRoutes = require('./routes/payment');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const booksRoutes = require('./routes/books');
const usersRoutes = require('./routes/users');
const crawlerRoutes = require('./routes/crawler');
const adsRoutes = require('./routes/ads');
const communityRoutes = require('./routes/community');
const circlesRoutes = require('./routes/circles');
const creatorRoutes = require('./routes/creator');
const uploadRoutes = require('./routes/upload');

const { clearSampleData } = require('./db/seed');
const { initRealBooks } = require('./db/init-books');
const crawler = require('./services/crawler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/data', express.static(path.join(__dirname, 'data')));

app.use('/api/alipay', paymentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/crawler', crawlerRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/circles', circlesRoutes);
app.use('/api/creator', creatorRoutes);
app.use('/api/books', uploadRoutes);

clearSampleData();
initRealBooks();

console.log('🕷️  启动后台爬虫...');

// 爬虫状态API
app.get('/api/crawler/status', (req, res) => {
  res.json({
    success: true,
    stats: crawler.getStats()
  });
});

// 手动触发爬虫
app.post('/api/crawler/trigger', async (req, res) => {
  try {
    const pages = req.body.pages || 1;
    const stats = await crawler.crawlAndSave(pages);
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 服务器启动时一次性爬取大量数据
console.log('🚀 启动时批量爬取数据...');
setTimeout(async () => {
  try {
    console.log('📚 正在爬取初始数据（20页，约200本热门书籍）...');
    const stats = await crawler.crawlAndSave(20);
    console.log('✅ 初始爬取完成:', stats);
  } catch (error) {
    console.error('❌ 初始爬取失败，使用备用数据:', error.message);
  }
}, 3000);

// 每5分钟爬取最新更新
console.log('⏰ 设置每5分钟定时爬虫任务...');
const cron = require('node-cron');

// 每5分钟执行，每次爬取5页（约50本）
cron.schedule('*/5 * * * *', async () => {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('zh-CN');
  console.log(`🕐 [${timeStr}] 启动定时爬虫任务...`);
  
  try {
    const stats = await crawler.crawlAndSave(5);
    console.log(`✅ [${timeStr}] 定时爬取完成:`, stats);
  } catch (error) {
    console.error(`❌ [${timeStr}] 定时爬取失败:`, error.message);
  }
}, {
  timezone: 'Asia/Shanghai'
});

console.log('✅ 每10分钟定时爬虫已设置！');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'public', 'images'));
  },
  filename: function (req, file, cb) {
    cb(null, 'alipay_qr.png');
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb('只允许上传 JPG 或 PNG 格式的图片');
  }
});

app.post('/api/upload', upload.single('qrcode'), (req, res) => {
  if (!req.file) {
    return res.json({ success: false, message: '请选择要上传的图片' });
  }
  res.json({ success: true, message: '收款码上传成功！' });
});

app.get('/upload', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'upload.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/payment', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'payment.html'));
});

app.get('/payment-success', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'payment-success.html'));
});

app.get('/agreements', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'agreements.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/reader', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reader.html'));
});

app.get('/community', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'community.html'));
});

app.get('/circles', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'circles.html'));
});

app.get('/creator', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'creator.html'));
});

app.get('/crawler-status', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'crawler-status.html'));
});

app.get('/upload-novel', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'upload-novel.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`小说平台服务器运行在 http://0.0.0.0:${PORT}`);
  console.log(`外部访问地址: http://115.190.92.241:${PORT}`);
  console.log('\n可用页面:');
console.log('  首页: /');
console.log('  充值: /payment');
console.log('  阅读: /reader');
console.log('  协议: /agreements');
console.log('  管理: /admin');
console.log('  社区: /community');
console.log('  创作者中心: /creator');
console.log('  上传小说: /upload-novel');
console.log('  爬虫状态: /crawler-status');
console.log('\n可用API:');
console.log('  爬虫: GET /api/crawler/status, POST /api/crawler/trigger');
console.log('  书籍: GET /api/books/list, POST /api/books/upload');
console.log('  广告: GET /api/ads/list');
console.log('  社区: GET /api/community/posts');
console.log('  圈子: GET /api/circles/circles');
console.log('  创作者: GET/POST /api/creator/*');
});

