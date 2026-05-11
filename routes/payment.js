const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

const orders = new Map();
const users = new Map();

const ORDER_EXPIRE_TIME = 30 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  orders.forEach((order, orderNo) => {
    if (order.status === 'pending' && now - order.createdAt.getTime() > ORDER_EXPIRE_TIME) {
      order.status = 'expired';
      console.log('订单超时:', orderNo);
    }
  });
}, 60000);

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

    if (productType === 'coin') {
      const totalCoins = (coins || 0) + (gift || 0);
      let user = users.get(productId);
      if (!user) {
        user = { coins: 0, totalRecharged: 0, members: [], vipExpireTime: null };
        users.set(productId, user);
      }
      user.coins += totalCoins;
      user.totalRecharged += price;

      console.log('书币充值成功:', {
        userId: productId,
        amount: price,
        coins: coins,
        gift: gift,
        totalCoins: totalCoins,
        totalRecharged: user.totalRecharged
      });
    } else if (productType === 'member') {
      const userId = productId;
      let user = users.get(userId);
      if (!user) {
        user = { coins: 0, totalRecharged: 0, members: [], vipExpireTime: null };
        users.set(userId, user);
      }
      
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

    res.json({
      success: true,
      message: '支付确认成功'
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
          members: []
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
        members: user.members
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
