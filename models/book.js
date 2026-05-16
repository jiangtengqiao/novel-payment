
const { booksDB, chaptersDB } = require('../db/init');
const { v4: uuidv4 } = require('uuid');

class Book {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.title = data.title;
    this.author = data.author || '佚名';
    this.authorId = data.authorId || null;
    this.cover = data.cover || null;
    this.description = data.description || '';
    this.category = data.category || '玄幻';
    this.tags = data.tags || [];
    this.status = data.status || 'ongoing';
    this.isFree = data.isFree !== undefined ? data.isFree : true;
    this.pricePerChapter = data.pricePerChapter || 10;
    this.views = data.views || 0;
    this.likes = data.likes || 0;
    this.wordCount = data.wordCount || 0;
    this.chapterCount = data.chapterCount || 0;
    this.lastChapterId = data.lastChapterId || null;
    this.lastUpdateTime = data.lastUpdateTime || Date.now();
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = data.updatedAt || Date.now();
  }

  static findById(id) {
    const data = booksDB.get(id);
    return data ? new Book(data) : null;
  }

  static findAll(options = {}) {
    const all = booksDB.getAll();
    let result = Object.values(all).map(data => new Book(data));

    if (options.category) {
      result = result.filter(b => b.category === options.category);
    }
    if (options.status) {
      result = result.filter(b => b.status === options.status);
    }
    if (options.search) {
      const keyword = options.search.toLowerCase();
      result = result.filter(b => 
        b.title.toLowerCase().includes(keyword) || 
        b.author.toLowerCase().includes(keyword) ||
        b.description.toLowerCase().includes(keyword)
      );
    }

    if (options.sortBy === 'views') {
      result.sort((a, b) => b.views - a.views);
    } else if (options.sortBy === 'likes') {
      result.sort((a, b) => b.likes - a.likes);
    } else {
      result.sort((a, b) => b.lastUpdateTime - a.lastUpdateTime);
    }

    if (options.limit) {
      result = result.slice(0, options.limit);
    }

    return result;
  }

  static create(data) {
    const book = new Book(data);
    booksDB.set(book.id, book);
    return book;
  }

  update(data) {
    Object.assign(this, data, { updatedAt: Date.now() });
    booksDB.set(this.id, this);
    return this;
  }

  addChapter(chapterData) {
    const chapter = {
      id: uuidv4(),
      bookId: this.id,
      title: chapterData.title,
      content: chapterData.content,
      chapterNumber: this.chapterCount + 1,
      isFree: chapterData.isFree !== undefined ? chapterData.isFree : this.isFree,
      price: chapterData.price || this.pricePerChapter,
      wordCount: chapterData.content ? chapterData.content.length : 0,
      publishTime: Date.now(),
      createdAt: Date.now()
    };
    
    chaptersDB.set(chapter.id, chapter);
    
    this.chapterCount++;
    this.wordCount += chapter.wordCount;
    this.lastChapterId = chapter.id;
    this.lastUpdateTime = Date.now();
    this.update({});
    
    return chapter;
  }

  getChapters() {
    const all = chaptersDB.getAll();
    const chapters = Object.values(all).filter(c => c.bookId === this.id);
    chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
    return chapters;
  }

  getChapter(chapterId) {
    return chaptersDB.get(chapterId);
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      author: this.author,
      authorId: this.authorId,
      cover: this.cover,
      description: this.description,
      category: this.category,
      tags: this.tags,
      status: this.status,
      isFree: this.isFree,
      pricePerChapter: this.pricePerChapter,
      views: this.views,
      likes: this.likes,
      wordCount: this.wordCount,
      chapterCount: this.chapterCount,
      lastChapterId: this.lastChapterId,
      lastUpdateTime: this.lastUpdateTime,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Book;

