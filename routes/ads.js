
const express = require('express');
const router = express.Router();
const Ad = require('../models/ad');

router.get('/list', (req, res) => {
  const { position, type } = req.query;
  const ads = Ad.findAll({ position, type, isActive: true });
  res.json({ success: true, ads: ads.map(ad => ad.toJSON()) });
});

router.get('/:id', (req, res) => {
  const ad = Ad.findById(req.params.id);
  if (!ad) {
    return res.status(404).json({ success: false, message: '广告不存在' });
  }
  res.json({ success: true, ad: ad.toJSON() });
});

router.post('/:id/view', (req, res) => {
  const ad = Ad.findById(req.params.id);
  if (!ad) {
    return res.status(404).json({ success: false, message: '广告不存在' });
  }
  ad.recordView();
  res.json({ success: true });
});

router.post('/:id/click', (req, res) => {
  const ad = Ad.findById(req.params.id);
  if (!ad) {
    return res.status(404).json({ success: false, message: '广告不存在' });
  }
  ad.recordClick();
  res.json({ success: true, linkUrl: ad.linkUrl });
});

router.post('/', (req, res) => {
  const ad = Ad.create(req.body);
  res.json({ success: true, ad: ad.toJSON() });
});

router.put('/:id', (req, res) => {
  const ad = Ad.findById(req.params.id);
  if (!ad) {
    return res.status(404).json({ success: false, message: '广告不存在' });
  }
  ad.update(req.body);
  res.json({ success: true, ad: ad.toJSON() });
});

router.delete('/:id', (req, res) => {
  const ad = Ad.findById(req.params.id);
  if (!ad) {
    return res.status(404).json({ success: false, message: '广告不存在' });
  }
  ad.update({ isActive: false });
  res.json({ success: true });
});

module.exports = router;

