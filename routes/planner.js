const router = require('express').Router();
const path = require('path');
const { put, list, get: blobGet } = require('@vercel/blob');

const PLANNER_SECRET = process.env.PLANNER_SECRET;

function todayStr() { return new Date().toISOString().split('T')[0]; }

async function fetchBlob(url) {
  const r = await blobGet(url, { access: 'private' });
  if (r.statusCode !== 200) throw new Error(`Blob fetch ${r.statusCode}`);
  const chunks = [];
  for await (const chunk of r.stream) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function findBlob(prefix) {
  const { blobs } = await list({ prefix });
  return blobs[0] || null;
}

// POST /api/planner — no SSO, protected by shared secret.
// Pushed by the external daily-planner generator with that day's
// calendar-derived schedule for a given user.
router.post('/api/planner', async (req, res) => {
  const secret = req.headers['x-planner-secret'];
  if (secret !== PLANNER_SECRET) return res.status(403).json({ error: 'Forbidden' });

  try {
    const { email, date, slots } = req.body;
    if (!email || !date || !Array.isArray(slots)) {
      return res.status(400).json({ error: 'email, date, slots required' });
    }
    const filename = `planner/${email}/schedule/${date}.json`;
    const result = await put(filename, JSON.stringify({ date, slots, generatedAt: new Date().toISOString() }), {
      access: 'private',
      contentType: 'application/json',
      allowOverwrite: true,
    });
    console.log(`Planner schedule stored: ${email} ${date} -> ${result.url}`);
    res.json({ ok: true, url: result.url });
  } catch (err) {
    console.error('Planner store error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Everything below requires a valid gateway session (mounted after requireAuth)

// GET /api/planner/schedule?date=YYYY-MM-DD
router.get('/api/planner/schedule', async (req, res) => {
  try {
    const date = req.query.date || todayStr();
    const blob = await findBlob(`planner/${req.user.email}/schedule/${date}.json`);
    if (!blob) return res.json({ date, slots: null });
    const data = await fetchBlob(blob.url);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/planner/cells?date=YYYY-MM-DD — per-day free-text edits (task/note columns)
router.get('/api/planner/cells', async (req, res) => {
  try {
    const date = req.query.date || todayStr();
    const blob = await findBlob(`planner/${req.user.email}/cells/${date}.json`);
    if (!blob) return res.json({ date, cells: {} });
    const data = await fetchBlob(blob.url);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/planner/cells', async (req, res) => {
  try {
    const { date, cells } = req.body;
    if (!date || typeof cells !== 'object') return res.status(400).json({ error: 'date, cells required' });
    const filename = `planner/${req.user.email}/cells/${date}.json`;
    await put(filename, JSON.stringify({ date, cells }), {
      access: 'private',
      contentType: 'application/json',
      allowOverwrite: true,
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET/POST /api/planner/todos — running to-do list, not date-scoped
router.get('/api/planner/todos', async (req, res) => {
  try {
    const blob = await findBlob(`planner/${req.user.email}/todos.json`);
    if (!blob) return res.json({ todos: [], lastMondayCleanup: null });
    const data = await fetchBlob(blob.url);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/planner/todos', async (req, res) => {
  try {
    const { todos, lastMondayCleanup } = req.body;
    if (!Array.isArray(todos)) return res.status(400).json({ error: 'todos required' });
    const filename = `planner/${req.user.email}/todos.json`;
    await put(filename, JSON.stringify({ todos, lastMondayCleanup: lastMondayCleanup || null }), {
      access: 'private',
      contentType: 'application/json',
      allowOverwrite: true,
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /planner — serve viewer page
router.get('/planner', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'planner.html'));
});

module.exports = router;
