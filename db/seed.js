
const { booksDB } = require('../db/init');

function clearSampleData() {
  console.log('正在清空示例数据...');
  const allBooks = booksDB.getAll();
  for (let id in allBooks) {
    booksDB.delete(id);
  }
  console.log('示例数据已清空');
}

module.exports = { clearSampleData };

