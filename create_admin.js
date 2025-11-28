const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const db = new Database('sqlite.db');

const email = process.argv[2];
const password = process.argv[3];
const name = process.argv[4] || 'Super Admin';

if (!email || !password) {
  console.error('Usage: node create_admin.js <email> <password> [name]');
  process.exit(1);
}

const hashedPassword = bcrypt.hashSync(password, 10);
const id = crypto.randomUUID();
const now = new Date().toISOString();

try {
  const stmt = db.prepare(`
    INSERT INTO users (id, email, password, name, full_name, roles, created_at, emailVerified)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const roles = JSON.stringify(['super_admin']);
  stmt.run(id, email, hashedPassword, name, name, roles, now, Date.now());

  console.log(`Super Admin user created successfully!`);
  console.log(`Email: ${email}`);
  console.log(`Role: super_admin`);
} catch (error) {
  if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    console.error('Error: A user with this email already exists.');
  } else {
    console.error('Error creating user:', error);
  }
}
