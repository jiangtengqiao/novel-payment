
const { usersDB } = require('../db/init');
const { v4: uuidv4 } = require('uuid');

class User {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.email = data.email;
    this.password = data.password;
    this.nickname = data.nickname || data.email.split('@')[0];
    this.avatar = data.avatar || null;
    this.bio = data.bio || '';
    this.phone = data.phone || null;
    this.gender = data.gender || null;
    this.birthday = data.birthday || null;
    this.coins = data.coins || 0;
    this.totalRecharged = data.totalRecharged || 0;
    this.vipExpireTime = data.vipExpireTime || null;
    this.isAdmin = data.isAdmin || false;
    this.isAuthor = data.isAuthor || false;
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = data.updatedAt || Date.now();
  }

  static findByEmail(email) {
    const data = usersDB.get(email);
    return data ? new User(data) : null;
  }

  static findById(id) {
    const all = usersDB.getAll();
    for (let email in all) {
      if (all[email].id === id) {
        return new User(all[email]);
      }
    }
    return null;
  }

  static create(data) {
    const user = new User(data);
    usersDB.set(user.email, user);
    return user;
  }

  update(data) {
    Object.assign(this, data, { updatedAt: Date.now() });
    usersDB.set(this.email, this);
    return this;
  }

  isVip() {
    if (!this.vipExpireTime) return false;
    return new Date(this.vipExpireTime) > new Date();
  }

  addCoins(amount) {
    this.coins += amount;
    this.totalRecharged += amount;
    this.update({ coins: this.coins, totalRecharged: this.totalRecharged });
  }

  spendCoins(amount) {
    if (this.coins < amount) return false;
    this.coins -= amount;
    this.update({ coins: this.coins });
    return true;
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email,
      nickname: this.nickname,
      avatar: this.avatar,
      bio: this.bio,
      phone: this.phone,
      gender: this.gender,
      birthday: this.birthday,
      coins: this.coins,
      totalRecharged: this.totalRecharged,
      vipExpireTime: this.vipExpireTime,
      isVip: this.isVip(),
      isAdmin: this.isAdmin,
      isAuthor: this.isAuthor,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = User;

