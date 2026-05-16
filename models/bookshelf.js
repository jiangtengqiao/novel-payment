
const { shelvesDB, historyDB } = require('../db/init');
const { v4: uuidv4 } = require('uuid');

class Bookshelf {
  constructor(userId) {
    this.userId = userId;
    this.shelfData = shelvesDB.get(userId) || {
      books: [],
      categories: ['默认书架'],
      createdAt: Date.now()
    };
    this.history = historyDB.get(userId) || [];
  }

  save() {
    shelvesDB.set(this.userId, this.shelfData);
  }

  addBook(bookId, category = '默认书架') {
    const existing = this.shelfData.books.find(b => b.bookId === bookId);
    if (existing) return false;

    this.shelfData.books.push({
      bookId,
      category,
      addedAt: Date.now(),
      lastReadAt: null,
      lastChapterId: null
    });

    this.save();
    return true;
  }

  removeBook(bookId) {
    this.shelfData.books = this.shelfData.books.filter(b => b.bookId !== bookId);
    this.save();
  }

  updateReadProgress(bookId, chapterId) {
    const book = this.shelfData.books.find(b => b.bookId === bookId);
    if (book) {
      book.lastReadAt = Date.now();
      book.lastChapterId = chapterId;
      this.save();
    }

    const historyItem = {
      bookId,
      chapterId,
      readAt: Date.now()
    };
    this.history.unshift(historyItem);
    if (this.history.length > 100) {
      this.history = this.history.slice(0, 100);
    }
    historyDB.set(this.userId, this.history);
  }

  getBooks() {
    return this.shelfData.books;
  }

  getRecentHistory(limit = 20) {
    return this.history.slice(0, limit);
  }

  addCategory(name) {
    if (!this.shelfData.categories.includes(name)) {
      this.shelfData.categories.push(name);
      this.save();
      return true;
    }
    return false;
  }

  removeCategory(name) {
    if (name === '默认书架') return false;
    this.shelfData.categories = this.shelfData.categories.filter(c => c !== name);
    this.shelfData.books.forEach(book => {
      if (book.category === name) {
        book.category = '默认书架';
      }
    });
    this.save();
    return true;
  }

  getCategories() {
    return this.shelfData.categories;
  }

  toJSON() {
    return {
      userId: this.userId,
      books: this.shelfData.books,
      categories: this.shelfData.categories,
      createdAt: this.shelfData.createdAt
    };
  }
}

module.exports = Bookshelf;

