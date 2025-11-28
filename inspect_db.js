const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

console.log('--- Users Table Info ---');
const usersInfo = db.pragma('table_info(users)');
console.log(usersInfo);

console.log('\n--- Tasks Table Info ---');
const tasksInfo = db.pragma('table_info(tasks)');
console.log(tasksInfo);
