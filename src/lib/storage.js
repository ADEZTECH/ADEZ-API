const { MongoClient } = require('mongodb');
const { Client } = require('pg');

const memoryUsers = [];
let databaseType = 'memory';
let mongoClient = null;
let mongoDb = null;
let pgClient = null;
let isDbReady = false;

async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI;
  const pgUrl = process.env.DATABASE_URL;

  if (pgUrl) {
    try {
      pgClient = new Client({ connectionString: pgUrl });
      await pgClient.connect();
      await pgClient.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255),
          email VARCHAR(255) UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      databaseType = 'postgres';
      isDbReady = true;
      return { type: 'postgres', client: pgClient };
    } catch (error) {
      console.warn('PostgreSQL connection failed:', error.message);
    }
  }

  if (mongoUri) {
    try {
      mongoClient = new MongoClient(mongoUri);
      await mongoClient.connect();
      mongoDb = mongoClient.db(process.env.MONGODB_DB || 'adezapi');
      databaseType = 'mongo';
      isDbReady = true;
      return { type: 'mongo', db: mongoDb };
    } catch (error) {
      console.warn('MongoDB connection failed:', error.message);
    }
  }

  databaseType = 'memory';
  isDbReady = true;
  return { type: 'memory' };
}

async function ensureDatabaseReady() {
  if (isDbReady) {
    return { type: databaseType };
  }

  return connectDatabase();
}

async function findUserByEmail(email) {
  const normalizedEmail = String(email || '').toLowerCase();
  if (!normalizedEmail) return null;

  await ensureDatabaseReady();

  if (databaseType === 'memory') {
    return memoryUsers.find((user) => user.email === normalizedEmail) || null;
  }

  if (databaseType === 'mongo') {
    return mongoDb.collection('users').findOne({ email: normalizedEmail });
  }

  if (databaseType === 'postgres') {
    const result = await pgClient.query(
      'SELECT * FROM users WHERE email = $1 LIMIT 1',
      [normalizedEmail]
    );
    return result.rows[0] || null;
  }

  return null;
}

async function createUser({ name, email, password }) {
  const normalizedEmail = String(email || '').toLowerCase();
  const createdAt = new Date().toISOString();

  await ensureDatabaseReady();

  if (databaseType === 'memory') {
    const user = {
      id: `user_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      name: name || 'User',
      email: normalizedEmail,
      password,
      created_at: createdAt
    };
    memoryUsers.push(user);
    return user;
  }

  if (databaseType === 'mongo') {
    const result = await mongoDb.collection('users').insertOne({
      name: name || 'User',
      email: normalizedEmail,
      password,
      created_at: createdAt
    });

    return {
      id: result.insertedId.toString(),
      name: name || 'User',
      email: normalizedEmail,
      password,
      created_at: createdAt
    };
  }

  if (databaseType === 'postgres') {
    const result = await pgClient.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
      [name || 'User', normalizedEmail, password]
    );
    return result.rows[0];
  }

  return null;
}

module.exports = {
  connectDatabase,
  ensureDatabaseReady,
  findUserByEmail,
  createUser,
  getDatabaseType: () => databaseType
};
