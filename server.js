
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

const { clearSampleData } = require('./db/seed');
const { initRealBooks } = require('./db/init-books');
const { startCrawl } = require('./services/crawler');

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

clearSampleData();
initRealBooks();

console.log('🕷️  启动后台爬虫...');

// 服务器启动5秒后立即爬取初始数据
setTimeout(async () => {
  try {
    const stats = await startCrawl(2);
    console.log('✅ 初始爬虫完成:', stats);
  } catch (error) {
    console.error('❌ 初始爬虫跳过:', error.message);
  }
}, 5000);

// 每小时爬取1页，缓缓更新，避免拥挤
console.log('⏰ 设置每小时定时爬虫任务...');
const cron = require('node-cron');

// 每小时的第0分钟执行，每次爬取1-2页
cron.schedule('0 * * * *', async () => {
  const hour = new Date().getHours();
  console.log(`🕐 [${hour}:00] 启动定时爬虫任务...`);
  
  try {
    // 不同时段爬取不同数量，分散负载
    let pages = hour % 2 === 0 ? 1 : 2; 
    
    const stats = await startCrawl(pages);
    console.log(`✅ [${hour}:00] 定时爬虫完成:`, stats);
  } catch (error) {
    console.error(`❌ [${hour}:00] 定时爬虫失败:`, error.message);
  }
}, {
  timezone: 'Asia/Shanghai'
});

console.log('✅ 定时爬虫已设置！');

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
  console.log('\n可用API:');
  console.log('  爬虫: POST /api/crawler/start');
  console.log('  书籍: GET /api/books/list');
  console.log('  广告: GET /api/ads/list');
  console.log('  社区: GET /api/community/posts');
  console.log('  圈子: GET /api/circles/circles');
});

