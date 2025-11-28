const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

console.log('Starting manual migration...');

// 1. Create new tables
db.exec(`
CREATE TABLE IF NOT EXISTS "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	PRIMARY KEY("provider", "providerAccountId"),
	FOREIGN KEY ("userId") REFERENCES "users"("id") ON UPDATE no action ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" integer NOT NULL,
	FOREIGN KEY ("userId") REFERENCES "users"("id") ON UPDATE no action ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" integer NOT NULL,
	PRIMARY KEY("identifier", "token")
);
`);
console.log('Created Auth tables.');

// 2. Migrate Users table
db.exec('PRAGMA foreign_keys=OFF');

const migrateUsers = db.transaction(() => {
    db.exec('DROP TABLE IF EXISTS "__new_users"');

    // Create new users table
    db.exec(`
    CREATE TABLE "__new_users" (
        "id" text PRIMARY KEY NOT NULL,
        "name" text,
        "email" text NOT NULL,
        "emailVerified" integer,
        "image" text,
        "password" text,
        "role" text DEFAULT 'staff',
        "full_name" text,
        "avatar_url" text,
        "created_at" text
    );
    `);

    // Copy data
    // Mapping:
    // id -> id
    // email -> email
    // full_name -> full_name AND name
    // role -> role
    // avatar_url -> avatar_url AND image
    // created_at -> created_at
    db.exec(`
    INSERT INTO "__new_users" ("id", "name", "email", "emailVerified", "image", "password", "role", "full_name", "avatar_url", "created_at")
    SELECT 
        "id", 
        "full_name", 
        "email", 
        NULL, 
        "avatar_url", 
        NULL, 
        "role", 
        "full_name", 
        "avatar_url", 
        "created_at" 
    FROM "users";
    `);

    db.exec('DROP TABLE "users"');
    db.exec('ALTER TABLE "__new_users" RENAME TO "users"');
    db.exec('CREATE UNIQUE INDEX "users_email_unique" ON "users" ("email")');
    
    db.exec('PRAGMA foreign_keys=ON');
});

try {
    migrateUsers();
    console.log('Successfully migrated Users table.');
} catch (error) {
    console.error('Failed to migrate Users table:', error);
    process.exit(1);
}

console.log('Migration complete.');
