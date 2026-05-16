
const { adsDB } = require('../db/init');
const { v4: uuidv4 } = require('uuid');

class Ad {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.type = data.type;
    this.title = data.title || '';
    this.imageUrl = data.imageUrl || '';
    this.linkUrl = data.linkUrl || '';
    this.content = data.content || '';
    this.position = data.position || 'home';
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.startTime = data.startTime || Date.now();
    this.endTime = data.endTime || null;
    this.views = data.views || 0;
    this.clicks = data.clicks || 0;
    this.weight = data.weight || 1;
    this.createdAt = data.createdAt || Date.now();
  }

  static findById(id) {
    const data = adsDB.get(id);
    return data ? new Ad(data) : null;
  }

  static findAll(options = {}) {
    const all = adsDB.getAll();
    let result = Object.values(all).map(data => new Ad(data));

    if (options.position) {
      result = result.filter(ad => ad.position === options.position);
    }
    if (options.type) {
      result = result.filter(ad => ad.type === options.type);
    }
    if (options.isActive) {
      result = result.filter(ad => ad.isActive && ad.isInTimeRange());
    }

    result.sort((a, b) => b.weight - a.weight);
    return result;
  }

  static create(data) {
    const ad = new Ad(data);
    adsDB.set(ad.id, ad);
    return ad;
  }

  update(data) {
    Object.assign(this, data);
    adsDB.set(this.id, this);
    return this;
  }

  isInTimeRange() {
    const now = Date.now();
    if (this.startTime && now < this.startTime) return false;
    if (this.endTime && now > this.endTime) return false;
    return true;
  }

  recordView() {
    this.views++;
    this.update({ views: this.views });
  }

  recordClick() {
    this.clicks++;
    this.update({ clicks: this.clicks });
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      title: this.title,
      imageUrl: this.imageUrl,
      linkUrl: this.linkUrl,
      content: this.content,
      position: this.position,
      isActive: this.isActive,
      startTime: this.startTime,
      endTime: this.endTime,
      views: this.views,
      clicks: this.clicks,
      weight: this.weight
    };
  }
}

module.exports = Ad;

