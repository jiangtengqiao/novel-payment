const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const paymentRoutes = require('./routes/payment');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

const users = new Map();
const orders = new Map();
const verificationCodes = new Map();
const lastSendTime = new Map();
const rebateRecords = new Map();

global.users = users;
global.orders = orders;

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

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/alipay', paymentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

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
  res.sendFile(path.join(__dirname, 'public', 'payment.html'));
});

app.get('/payment-success', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'payment-success.html'));
});

app.get('/agreements', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'agreements.html'));
});

const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`小说平台支付服务器运行在 http://0.0.0.0:${PORT}`);
  console.log(`外部访问地址: http://115.190.92.241:${PORT}`);
});
