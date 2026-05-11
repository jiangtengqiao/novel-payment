module.exports = {
  alipay: {
    appId: 'YOUR_APP_ID',
    privateKey: 'YOUR_APP_PRIVATE_KEY',
    alipayPublicKey: 'ALIPAY_PUBLIC_KEY',
    gateway: 'https://openapi-sandbox.dl.alipaydev.com/gateway.do',
    notifyUrl: 'http://localhost:3000/api/alipay/notify',
    returnUrl: 'http://localhost:3000/payment-success'
  },
  server: {
    port: 3000,
    host: 'localhost'
  }
};
