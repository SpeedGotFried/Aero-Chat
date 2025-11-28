require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('redis');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'db',
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB
});



// init db
// init db
async function initDb() {
  let retries = 10;
  while (retries > 0) {
    try {
      const client = await pool.connect();
      try {
        console.log("Initializing DB...");
        await client.query(`
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
          );
        `);
        await client.query(`
          CREATE TABLE IF NOT EXISTS messages (
            id SERIAL PRIMARY KEY,
            room TEXT,
            user_id INTEGER,
            username TEXT,
            text TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        // Migration
        try {
          await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;`);
        } catch (e) {
          console.log("Migration note:", e.message);
        }

        console.log("Database initialized successfully");
        return;
      } finally {
        client.release();
      }
    } catch (err) {
      console.error(`DB init failed, retrying... (${retries} left)`);
      console.error(err.message);
      retries--;
      await new Promise(res => setTimeout(res, 3000));
    }
  }
  console.error("Could not connect to database after multiple retries");
  process.exit(1);
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// Use redis adapter if needed (simple scale)
const { createAdapter } = require('@socket.io/redis-adapter');
(async () => {
  try {
    const subClient = createClient({ url: process.env.REDIS_URL || 'redis://redis:6379' });
    const pubClient = createClient({ url: process.env.REDIS_URL || 'redis://redis:6379' });

    subClient.on('error', (err) => console.error('Redis Sub Error:', err));
    pubClient.on('error', (err) => console.error('Redis Pub Error:', err));

    await Promise.all([subClient.connect(), pubClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    console.log('Redis adapter initialized');
  } catch (e) {
    console.error('Failed to init Redis adapter:', e);
  }
})();

// Simple REST endpoints
app.get('/health', (req, res) => res.json({ ok: true }));
app.get('/rooms/:room/messages', async (req, res) => {
  const { room } = req.params;
  const { rows } = await pool.query('SELECT * FROM messages WHERE room=$1 ORDER BY id ASC LIMIT 500', [room]);
  res.json(rows);
});

// Auth Endpoints
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users(name, password_hash) VALUES($1, $2) RETURNING id, name',
      [username, hash]
    );
    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Username taken' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE name=$1', [username]);
    const user = rows[0];
    if (!user || !await bcrypt.compare(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, username: user.name }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, username: user.name, id: user.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error('Authentication error'));
    socket.data.user = decoded;
    next();
  });
});

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  socket.on('join', async ({ room }) => {
    socket.join(room);
    const username = socket.data.user.username;
    socket.data.room = room;
    // notify
    socket.to(room).emit('user_joined', { username });
  });

  socket.on('typing', ({ room, username }) => {
    socket.to(room).emit('typing', { username });
  });

  socket.on('stop_typing', ({ room, username }) => {
    socket.to(room).emit('stop_typing', { username });
  });

  socket.on('message', async ({ room, text }) => {
    const { id, username } = socket.data.user;
    // persist
    const { rows } = await pool.query(
      'INSERT INTO messages(room, user_id, username, text) VALUES($1,$2,$3,$4) RETURNING *',
      [room, id, username, text]
    );
    const message = rows[0];
    io.to(room).emit('message', message);
  });

  socket.on('disconnect', () => {
    const { room } = socket.data;
    const username = socket.data.user?.username;
    if (room && username) socket.to(room).emit('user_left', { username });
  });
});

const PORT = process.env.PORT || 5000;

// Start server only after DB init
initDb().then(() => {
  server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
});
