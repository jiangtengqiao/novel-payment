const nodemailer = require('nodemailer');

console.log('=== 测试QQ邮箱SMTP ===\n');

const transporter = nodemailer.createTransport({
  host: '183.47.110.217', // QQ邮箱SMTP的IPv4地址
  port: 465,
  secure: true,
  auth: {
    user: '2527469579@qq.com',
    pass: 'ibwcdqgjmxpfedcj'
  },
  tls: {
    rejectUnauthorized: false,
    servername: 'smtp.qq.com' // 解决SSL证书问题
  },
  family: 4, // 强制IPv4
  connectionTimeout: 8000,
  greetingTimeout: 8000,
  socketTimeout: 8000
});

console.log('测试SMTP连接...');
transporter.verify(function(error, success) {
  if (error) {
    console.error('❌ SMTP连接失败:', error.message);
    console.error('错误详情:', error);
    process.exit(1);
  } else {
    console.log('✅ SMTP连接成功！\n');
    
    // 测试发送一封邮件
    const testCode = 'TEST12';
    const mailOptions = {
      from: '"小说支付中心" <2527469579@qq.com>',
      to: '2527469579@qq.com',
      subject: '【测试】验证码',
      text: `测试验证码：${testCode}`,
      html: `<div style="font-family: sans-serif; padding: 20px;">
        <h2>测试邮件</h2>
        <p>验证码：<strong>${testCode}</strong></p>
      </div>`
    };
    
    console.log('发送测试邮件...');
    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.error('❌ 发送失败:', error.message);
        console.error('错误详情:', error);
        process.exit(1);
      } else {
        console.log('✅ 邮件发送成功！');
        console.log('Message ID:', info.messageId);
        console.log('请查收邮箱：2527469579@qq.com');
        process.exit(0);
      }
    });
  }
});
