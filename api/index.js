import express from 'express'
import cors from 'cors'
import pg from 'pg'

const app = express()
app.use(express.json({ limit: '5mb' }))
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_backups (
      user_id TEXT PRIMARY KEY,
      email   TEXT NOT NULL,
      data    JSONB NOT NULL,
      saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  console.log('DB ready')
}

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' })
  const token = header.slice(7)
  try {
    const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': process.env.SUPABASE_ANON_KEY,
      },
    })
    if (!response.ok) return res.status(401).json({ error: 'Invalid or expired token' })
    const user = await response.json()
    req.userId = user.id
    req.userEmail = user.email
    next()
  } catch (err) {
    console.error('Auth error:', err)
    return res.status(401).json({ error: 'Auth check failed' })
  }
}

app.get('/health', (_, res) => res.json({ ok: true }))

app.post('/backup', authMiddleware, async (req, res) => {
  const { data } = req.body
  if (!data) return res.status(400).json({ error: 'No data provided' })
  try {
    await pool.query(`
      INSERT INTO user_backups (user_id, email, data, saved_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (user_id) DO UPDATE SET data = $3, saved_at = NOW(), email = $2
    `, [req.userId, req.userEmail, JSON.stringify(data)])
    res.json({ ok: true, saved_at: new Date().toISOString() })
  } catch (err) {
    console.error('Backup error:', err)
    res.status(500).json({ error: 'Failed to save backup' })
  }
})

app.get('/backup', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT data, saved_at FROM user_backups WHERE user_id = $1',
      [req.userId]
    )
    if (result.rows.length === 0) return res.json({ backup: null })
    res.json({ backup: result.rows[0].data, saved_at: result.rows[0].saved_at })
  } catch (err) {
    console.error('Restore error:', err)
    res.status(500).json({ error: 'Failed to fetch backup' })
  }
})

const PORT = process.env.PORT || 3001
initDB().then(() => {
  app.listen(PORT, () => console.log(`API running on port ${PORT}`))
})