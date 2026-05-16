
const { circlesDB } = require('../db/init');
const { v4: uuidv4 } = require('uuid');

class Circle {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.name = data.name;
    this.description = data.description || '';
    this.avatar = data.avatar || null;
    this.creatorId = data.creatorId;
    this.creatorName = data.creatorName || '创始人';
    this.category = data.category || '综合';
    this.members = data.members || [];
    this.posts = data.posts || [];
    this.isPublic = data.isPublic !== undefined ? data.isPublic : true;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = data.updatedAt || Date.now();
  }

  static findById(id) {
    const data = circlesDB.get(id);
    return data ? new Circle(data) : null;
  }

  static findAll(options = {}) {
    const all = circlesDB.getAll();
    let result = Object.values(all)
      .filter(c => c.isActive)
      .map(data => new Circle(data));

    if (options.category) {
      result = result.filter(c => c.category === options.category);
    }
    if (options.search) {
      const keyword = options.search.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(keyword) || 
        c.description.toLowerCase().includes(keyword)
      );
    }

    if (options.sortBy === 'members') {
      result.sort((a, b) => b.members.length - a.members.length);
    } else {
      result.sort((a, b) => b.createdAt - a.createdAt);
    }

    if (options.limit) {
      result = result.slice(0, options.limit);
    }

    return result;
  }

  static create(data) {
    const circle = new Circle(data);
    circlesDB.set(circle.id, circle);
    return circle;
  }

  update(data) {
    Object.assign(this, data, { updatedAt: Date.now() });
    circlesDB.set(this.id, this);
    return this;
  }

  joinMember(userId, nickname) {
    if (!this.members.find(m => m.userId === userId)) {
      this.members.push({
        userId,
        nickname,
        role: 'member',
        joinedAt: Date.now()
      });
      this.update({});
      return true;
    }
    return false;
  }

  leaveMember(userId) {
    this.members = this.members.filter(m => m.userId !== userId);
    this.update({});
  }

  isMember(userId) {
    return this.members.some(m => m.userId === userId);
  }

  addPost(postId) {
    if (!this.posts.includes(postId)) {
      this.posts.push(postId);
      this.update({});
    }
  }

  getStats() {
    return {
      memberCount: this.members.length,
      postCount: this.posts.length
    };
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      avatar: this.avatar,
      creatorId: this.creatorId,
      creatorName: this.creatorName,
      category: this.category,
      isPublic: this.isPublic,
      memberCount: this.members.length,
      postCount: this.posts.length,
      createdAt: this.createdAt
    };
  }
}

const defaultCircles = [
  {
    name: '玄幻小说交流圈',
    description: '探讨玄幻小说的世界观设定、修炼体系、角色设定',
    category: '玄幻',
    creatorName: '系统管理员',
    isPublic: true
  },
  {
    name: '仙侠小说交流圈',
    description: '修仙问道，御剑飞仙，分享仙侠小说心得',
    category: '仙侠',
    creatorName: '系统管理员',
    isPublic: true
  },
  {
    name: '都市小说交流圈',
    description: '都市生活、职场风云、豪门恩怨',
    category: '都市',
    creatorName: '系统管理员',
    isPublic: true
  },
  {
    name: '全站综合讨论',
    description: '综合讨论区，书友交流、书评分享、推荐好书',
    category: '综合',
    creatorName: '系统管理员',
    isPublic: true
  }
];

function initDefaultCircles() {
  console.log('初始化圈子数据...');
  
  const existing = Circle.findAll({ limit: 1 });
  if (existing.length > 0) {
    console.log('圈子已存在，跳过初始化');
    return;
  }

  defaultCircles.forEach(data => {
    Circle.create({
      ...data,
      creatorId: 'system'
    });
  });

  console.log(`已创建 ${defaultCircles.length} 个默认圈子`);
}

module.exports = { Circle, initDefaultCircles };

