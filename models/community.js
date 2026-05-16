
const { postsDB, chaptersDB } = require('../db/init');
const { v4: uuidv4 } = require('uuid');

class Post {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.userId = data.userId;
    this.nickname = data.nickname || '匿名用户';
    this.avatar = data.avatar || null;
    this.bookId = data.bookId || null;
    this.title = data.title || '';
    this.content = data.content;
    this.type = data.type || 'discussion';
    this.images = data.images || [];
    this.likes = data.likes || 0;
    this.comments = data.comments || 0;
    this.views = data.views || 0;
    this.isPinned = data.isPinned || false;
    this.isDeleted = data.isDeleted || false;
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = data.updatedAt || Date.now();
  }

  static findById(id) {
    const data = postsDB.get(id);
    return data ? new Post(data) : null;
  }

  static findAll(options = {}) {
    const all = postsDB.getAll();
    let result = Object.values(all)
      .filter(p => !p.isDeleted)
      .map(data => new Post(data));

    if (options.bookId) {
      result = result.filter(p => p.bookId === options.bookId);
    }
    if (options.type) {
      result = result.filter(p => p.type === options.type);
    }
    if (options.userId) {
      result = result.filter(p => p.userId === options.userId);
    }

    result.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return b.isPinned ? 1 : -1;
      return b.createdAt - a.createdAt;
    });

    if (options.limit) {
      result = result.slice(0, options.limit);
    }

    return result;
  }

  static create(data) {
    const post = new Post(data);
    postsDB.set(post.id, post);
    return post;
  }

  update(data) {
    Object.assign(this, data, { updatedAt: Date.now() });
    postsDB.set(this.id, this);
    return this;
  }

  addLike() {
    this.likes++;
    this.update({ likes: this.likes });
  }

  removeLike() {
    this.likes = Math.max(0, this.likes - 1);
    this.update({ likes: this.likes });
  }

  addComment() {
    this.comments++;
    this.update({ comments: this.comments });
  }

  delete() {
    this.update({ isDeleted: true });
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      nickname: this.nickname,
      avatar: this.avatar,
      bookId: this.bookId,
      title: this.title,
      content: this.content,
      type: this.type,
      images: this.images,
      likes: this.likes,
      comments: this.comments,
      views: this.views,
      isPinned: this.isPinned,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

class Comment {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.postId = data.postId;
    this.userId = data.userId;
    this.nickname = data.nickname || '匿名用户';
    this.avatar = data.avatar || null;
    this.content = data.content;
    this.replyToId = data.replyToId || null;
    this.likes = data.likes || 0;
    this.isDeleted = data.isDeleted || false;
    this.createdAt = data.createdAt || Date.now();
  }

  static findByPostId(postId) {
    const all = postsDB.getAll();
    const post = all[postId];
    if (!post) return [];
    
    const comments = (post.commentsList || []).map(data => new Comment(data));
    return comments;
  }

  static create(postId, data) {
    const post = postsDB.get(postId);
    if (!post) return null;

    const comment = new Comment({ ...data, postId });
    if (!post.commentsList) post.commentsList = [];
    post.commentsList.push(comment);
    postsDB.set(postId, post);

    const postObj = new Post(post);
    postObj.addComment();

    return comment;
  }

  delete() {
    const post = postsDB.get(this.postId);
    if (!post) return;

    post.commentsList = post.commentsList.map(c => 
      c.id === this.id ? { ...c, isDeleted: true } : c
    );
    postsDB.set(this.postId, post);
  }

  toJSON() {
    return {
      id: this.id,
      postId: this.postId,
      userId: this.userId,
      nickname: this.nickname,
      avatar: this.avatar,
      content: this.content,
      replyToId: this.replyToId,
      likes: this.likes,
      isDeleted: this.isDeleted,
      createdAt: this.createdAt
    };
  }
}

module.exports = { Post, Comment };

