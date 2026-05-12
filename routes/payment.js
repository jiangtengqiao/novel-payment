const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

const orders = global.orders || new Map();
const users = global.users || new Map();
const rebateRecords = new Map();

const ORDER_EXPIRE_TIME = 30 * 60 * 1000;

const COIN_RATE = 100;

const RECHARGE_PACKAGES = [
  { price: 1, coins: 100, gift: 0 },
  { price: 6, coins: 600, gift: 0 },
  { price: 30, coins: 3000, gift: 150 },
  { price: 68, coins: 6800, gift: 544 },
  { price: 128, coins: 12800, gift: 1280 },
  { price: 328, coins: 32800, gift: 4920 },
  { price: 648, coins: 64800, gift: 12960 },
  { price: 1280, coins: 128000, gift: 32000 },
  { price: 3280, coins: 328000, gift: 98400 }
];

const REBATE_RULES = [
  { threshold: 50, reward: { type: 'gift', name: '小饰品', count: 1 } },
  { threshold: 100, reward: { type: 'gift', name: '中饰品', count: 1 } },
  { threshold: 158, reward: { type: 'lottery', name: '抽奖次数', count: 1 } },
  { threshold: 218, reward: { type: 'gift', name: '情侣围巾', count: 2 } },
  { threshold: 288, reward: { type: 'lottery', name: '抽奖次数', count: 2 } },
  { threshold: 348, reward: { type: 'gift', name: '邮包', count: 1 } },
  { threshold: 398, reward: { type: 'gift', name: '保温杯', count: 1 } },
  { threshold: 488, reward: { type: 'lottery', name: '抽奖次数', count: 1 } },
  { threshold: 578, reward: { type: 'lottery', name: '抽奖次数', count: 4 } },
  { threshold: 658, reward: { type: 'lottery', name: '免费抽奖次数', count: 2 } },
  { threshold: 1000, reward: { type: 'gift', name: '球鞋/板鞋', count: 1 } },
  { threshold: 1488, reward: { type: 'gift', name: '鞋一双', count: 1 }, bonus: { type: 'video', name: '腾讯动漫剧场版票', count: 1 } },
  { threshold: 1888, reward: { type: 'video', name: '腾讯视频SVIP年卡', count: 1 }, bonus: { type: 'music', name: '汽水音乐年SVIP', count: 1 } },
  { threshold: 2888, reward: { type: 'video', name: '腾讯体育SVIP年卡', count: 1 }, bonus: { type: 'music', name: 'QQ音乐/酷狗音乐最高级年会员', count: 1 }, extraBonus: { type: 'gift', name: '专属礼盒', count: 1 } }
];

setInterval(() => {
  const now = Date.now();
  orders.forEach((order, orderNo) => {
    if (order.status === 'pending' && now - order.createdAt.getTime() > ORDER_EXPIRE_TIME) {
      order.status = 'expired';
      console.log('订单超时:', orderNo);
    }
  });
}, 60000);

router.get('/packages', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        coinRate: COIN_RATE,
        packages: RECHARGE_PACKAGES,
        rebateRules: REBATE_RULES
      }
    });
  } catch (error) {
    console.error('获取充值档位失败:', error);
    res.status(500).json({
      success: false,
      message: '获取充值档位失败'
    });
  }
});

router.get('/user/:userId/rebates', (req, res) => {
  try {
    const { userId } = req.params;
    const user = users.get(userId);
    
    if (!user) {
      return res.json({
        success: true,
        data: {
          userId,
          totalRecharged: 0,
          currentRebateLevel: 0,
          nextRebateLevel: null,
          rebates: [],
          rewards: []
        }
      });
    }

    const totalRecharged = user.totalRecharged || 0;
    const userRebates = rebateRecords.get(userId) || [];
    
    let currentLevel = 0;
    let nextLevel = null;
    
    for (let i = REBATE_RULES.length - 1; i >= 0; i--) {
      if (totalRecharged >= REBATE_RULES[i].threshold) {
        currentLevel = REBATE_RULES[i].threshold;
        break;
      }
    }
    
    for (const rule of REBATE_RULES) {
      if (totalRecharged < rule.threshold) {
        nextLevel = rule;
        break;
      }
    }

    const earnedRewards = [];
    for (const rule of REBATE_RULES) {
      if (totalRecharged >= rule.threshold) {
        earnedRewards.push(rule);
      }
    }

    res.json({
      success: true,
      data: {
        userId,
        totalRecharged,
        currentRebateLevel,
        nextRebateLevel,
        rebates: userRebates,
        rewards: earnedRewards
      }
    });
  } catch (error) {
    console.error('查询返利记录失败:', error);
    res.status(500).json({
      success: false,
      message: '查询返利记录失败'
    });
  }
});

router.post('/create', (req, res) => {
  try {
    const { subject, totalAmount, body, productType, productId } = req.body;

    if (!subject || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    const outTradeNo = uuidv4().replace(/-/g, '').slice(0, 16);

    const orderData = {
      outTradeNo,
      subject,
      totalAmount,
      body: body || '',
      productType,
      productId,
      status: 'pending',
      createdAt: new Date()
    };

    orders.set(outTradeNo, orderData);

    res.json({
      success: true,
      data: {
        outTradeNo,
        payUrl: null,
        qrCode: null
      }
    });
  } catch (error) {
    console.error('创建订单失败:', error);
    res.status(500).json({
      success: false,
      message: '创建订单失败',
      error: error.message
    });
  }
});

router.post('/confirm', (req, res) => {
  try {
    const { orderNo, confirmCode, productType, price, productId, coins, gift, months, duration, giftCoins, paidAmount } = req.body;

    if (!orderNo || !confirmCode || !price) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    const order = orders.get(orderNo);

    if (!order) {
      return res.status(400).json({
        success: false,
        message: '订单不存在'
      });
    }

    if (order.status === 'expired') {
      return res.status(400).json({
        success: false,
        message: '订单已过期，请重新下单'
      });
    }

    if (order.status === 'paid') {
      return res.json({
        success: true,
        message: '订单已支付'
      });
    }

    const expectedCode = orderNo.slice(-6);
    if (confirmCode !== expectedCode) {
      return res.status(400).json({
        success: false,
        message: '订单验证码错误，请输入订单号后6位'
      });
    }

    if (paidAmount && Math.abs(parseFloat(paidAmount) - parseFloat(order.totalAmount)) > 0.01) {
      return res.status(400).json({
        success: false,
        message: `付款金额不匹配！应付 ${order.totalAmount} 元，实际支付 ${paidAmount} 元`
      });
    }

    order.status = 'paid';
    order.paidAt = new Date();
    order.confirmCode = confirmCode;

    const userId = productId;
    let user = users.get(userId);
    if (!user) {
      user = { coins: 0, totalRecharged: 0, members: [], vipExpireTime: null, lotteries: 0 };
      users.set(userId, user);
    }

    const previousTotal = user.totalRecharged;

    if (productType === 'coin') {
      const totalCoins = (coins || 0) + (gift || 0);
      user.coins += totalCoins;
      user.totalRecharged += price;

      console.log('书币充值成功:', {
        userId: userId,
        amount: price,
        coins: coins,
        gift: gift,
        totalCoins: totalCoins,
        totalRecharged: user.totalRecharged
      });
    } else if (productType === 'member') {
      user.coins += (giftCoins || 0);
      user.totalRecharged += price;
      
      const now = new Date();
      const memberEnd = new Date(now.getTime() + (months || 1) * 30 * 24 * 60 * 60 * 1000);
      
      user.members.push({
        type: duration,
        months: months,
        price: price,
        giftCoins: giftCoins,
        startTime: now,
        endTime: memberEnd,
        paidAt: now
      });
      
      if (!user.vipExpireTime || memberEnd > new Date(user.vipExpireTime)) {
        user.vipExpireTime = memberEnd;
      }

      console.log('会员开通成功:', {
        userId: userId,
        memberType: duration,
        months: months,
        price: price,
        giftCoins: giftCoins,
        vipExpireTime: user.vipExpireTime
      });
    }

    const earnedRewards = [];
    for (const rule of REBATE_RULES) {
      if (user.totalRecharged >= rule.threshold && previousTotal < rule.threshold) {
        earnedRewards.push(rule);
        
        if (rule.reward.type === 'lottery') {
          user.lotteries += rule.reward.count;
        }
        
        const rebateRecord = {
          orderNo,
          threshold: rule.threshold,
          rewards: [rule.reward],
          createdAt: new Date()
        };
        
        if (rule.bonus) {
          rebateRecord.rewards.push(rule.bonus);
          if (rule.bonus.type === 'lottery') {
            user.lotteries += rule.bonus.count;
          }
        }
        if (rule.extraBonus) {
          rebateRecord.rewards.push(rule.extraBonus);
          if (rule.extraBonus.type === 'lottery') {
            user.lotteries += rule.extraBonus.count;
          }
        }
        
        let userRebates = rebateRecords.get(userId);
        if (!userRebates) {
          userRebates = [];
          rebateRecords.set(userId, userRebates);
        }
        userRebates.push(rebateRecord);
        
        console.log('用户获得返利:', { userId, rule });
      }
    }

    res.json({
      success: true,
      message: '支付确认成功',
      data: {
        earnedRewards: earnedRewards,
        userInfo: {
          coins: user.coins,
          totalRecharged: user.totalRecharged,
          lotteries: user.lotteries
        }
      }
    });
  } catch (error) {
    console.error('确认支付失败:', error);
    res.status(500).json({
      success: false,
      message: '确认支付失败'
    });
  }
});

router.get('/query/:outTradeNo', (req, res) => {
  try {
    const { outTradeNo } = req.params;
    const order = orders.get(outTradeNo);

    if (!order) {
      return res.json({
        success: true,
        data: {
          tradeStatus: 'ORDER_NOT_EXIST'
        }
      });
    }

    res.json({
      success: true,
      data: {
        tradeStatus: order.status.toUpperCase(),
        outTradeNo: order.outTradeNo,
        totalAmount: order.totalAmount,
        subject: order.subject,
        createdAt: order.createdAt,
        paidAt: order.paidAt
      }
    });
  } catch (error) {
    console.error('查询订单失败:', error);
    res.status(500).json({
      success: false,
      message: '查询订单失败'
    });
  }
});

router.get('/user/:userId/info', (req, res) => {
  try {
    const { userId } = req.params;
    const user = users.get(userId);

    if (!user) {
      return res.json({
        success: true,
        data: {
          userId,
          coins: 0,
          totalRecharged: 0,
          vipExpireTime: null,
          isVip: false,
          members: [],
          lotteries: 0
        }
      });
    }

    const now = new Date();
    const isVip = user.vipExpireTime && new Date(user.vipExpireTime) > now;

    res.json({
      success: true,
      data: {
        userId,
        coins: user.coins,
        totalRecharged: user.totalRecharged,
        vipExpireTime: user.vipExpireTime,
        isVip: isVip,
        members: user.members,
        lotteries: user.lotteries || 0
      }
    });
  } catch (error) {
    console.error('查询用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '查询用户信息失败'
    });
  }
});

router.get('/user/:userId/coins', (req, res) => {
  try {
    const { userId } = req.params;
    const user = users.get(userId);

    res.json({
      success: true,
      data: {
        userId,
        coins: user ? user.coins : 0,
        totalRecharged: user ? user.totalRecharged : 0
      }
    });
  } catch (error) {
    console.error('查询用户书币失败:', error);
    res.status(500).json({
      success: false,
      message: '查询用户书币失败'
    });
  }
});

router.post('/consume', (req, res) => {
  try {
    const { userId, coins } = req.body;

    if (!userId || !coins) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    let user = users.get(userId);
    if (!user || user.coins < coins) {
      return res.status(400).json({
        success: false,
        message: '书币不足'
      });
    }

    user.coins -= coins;

    res.json({
      success: true,
      message: '消费成功',
      data: {
        userId,
        remainingCoins: user.coins
      }
    });
  } catch (error) {
    console.error('书币消费失败:', error);
    res.status(500).json({
      success: false,
      message: '书币消费失败'
    });
  }
});

module.exports = router;
