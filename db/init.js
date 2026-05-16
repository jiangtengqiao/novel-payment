
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class DataStore {
  constructor(name) {
    this.name = name;
    this.filePath = path.join(DATA_DIR, `${name}.json`);
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const content = fs.readFileSync(this.filePath, 'utf8');
        return JSON.parse(content);
      }
    } catch (e) {
      console.error(`Error loading ${this.name}:`, e);
    }
    return {};
  }

  save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error(`Error saving ${this.name}:`, e);
    }
  }

  get(key) {
    return this.data[key];
  }

  set(key, value) {
    this.data[key] = value;
    this.save();
  }

  getAll() {
    return this.data;
  }

  delete(key) {
    delete this.data[key];
    this.save();
  }
}

const usersDB = new DataStore('users');
const booksDB = new DataStore('books');
const chaptersDB = new DataStore('chapters');
const ordersDB = new DataStore('orders');
const shelvesDB = new DataStore('shelves');
const historyDB = new DataStore('reading-history');
const postsDB = new DataStore('community-posts');
const circlesDB = new DataStore('circles');

module.exports = {
  usersDB,
  booksDB,
  chaptersDB,
  ordersDB,
  shelvesDB,
  historyDB,
  postsDB,
  circlesDB,
  DATA_DIR
};

