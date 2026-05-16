
const Ad = require('../models/ad');

const defaultAds = [
  {
    type: 'banner',
    title: '新用户首充优惠',
    imageUrl: '/images/ad-banner-1.png',
    linkUrl: '/payment.html',
    content: '新用户首次充值满100元送50元',
    position: 'home-banner',
    isActive: true,
    weight: 10
  },
  {
    type: 'banner',
    title: 'VIP会员限时优惠',
    imageUrl: '/images/ad-banner-2.png',
    linkUrl: '/payment.html',
    content: '开通年卡会员享受5折优惠',
    position: 'home-banner',
    isActive: true,
    weight: 9
  },
  {
    type: 'interstitial',
    title: '阅读激励广告',
    content: '观看广告免费阅读付费章节',
    position: 'reading-interstitial',
    isActive: true,
    weight: 8
  },
  {
    type: 'reward',
    title: '激励视频广告',
    content: '观看完整视频获得30分钟免费阅读',
    position: 'reward-video',
    isActive: true,
    weight: 10
  },
  {
    type: 'native',
    title: '平台公告',
    content: '平台已完成全新改版，新增多项功能',
    position: 'home-native',
    isActive: true,
    weight: 7
  }
];

function initDefaultAds() {
  console.log('初始化广告数据...');
  
  const existingAds = Ad.findAll({ limit: 1 });
  if (existingAds.length > 0) {
    console.log('广告已存在，跳过初始化');
    return;
  }

  defaultAds.forEach(adData => {
    Ad.create(adData);
  });

  console.log(`已创建 ${defaultAds.length} 个广告位`);
}

module.exports = { initDefaultAds };

