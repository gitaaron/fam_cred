// API server for family rewards app
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Store active SSE connections
const sseConnections = new Set();

// Enable CORS for all origins (for development)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Cache-Control');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

const DATA_DIR = path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');

function ensureState() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STATE_FILE)) {
    fs.writeFileSync(STATE_FILE, JSON.stringify({ members: {} }, null, 2));
  }
}

function readState() {
  ensureState();
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    // Normalize legacy state where members[id] was a number into new object shape
    const normalized = { members: {} };
    const srcMembers = parsed.members || {};
    for (const [id, value] of Object.entries(srcMembers)) {
      if (typeof value === 'number') {
        normalized.members[id] = {
          stars: value,
          taskIndex: 0,
          rewardIndex: 0,
          redemptions: {}
        };
      } else if (typeof value === 'object' && value) {
        normalized.members[id] = {
          stars: Math.max(0, Number(value.stars || 0)),
          taskIndex: Math.max(0, Number(value.taskIndex || 0)),
          rewardIndex: Math.max(0, Number(value.rewardIndex || 0)),
          redemptions: typeof value.redemptions === 'object' && value.redemptions ? value.redemptions : {}
        };
      }
    }
    return normalized;
  } catch (e) {
    return { members: {} };
  }
}

function writeState(state) {
  ensureState();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// Broadcast to all connected SSE clients
function broadcastToClients(data) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  console.log(`Broadcasting to ${sseConnections.size} clients:`, data);
  sseConnections.forEach(res => {
    try {
      res.write(message);
    } catch (error) {
      console.log('Removing dead SSE connection');
      sseConnections.delete(res);
    }
  });
}

app.get('/api/state', (req, res) => {
  const state = readState();
  res.json(state);
});

// Server-Sent Events endpoint for real-time updates
app.get('/api/events', (req, res) => {
  console.log('New SSE connection from:', req.ip || req.connection.remoteAddress);
  
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Add this connection to the set
  sseConnections.add(res);
  console.log(`Total SSE connections: ${sseConnections.size}`);

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

  // Handle client disconnect
  req.on('close', () => {
    console.log('SSE connection closed');
    sseConnections.delete(res);
    console.log(`Remaining SSE connections: ${sseConnections.size}`);
  });
});

// Back-compat endpoint: treat as stars +/-1 and emit legacy + new events
app.post('/api/complete', (req, res) => {
  const { id, delta } = req.body || {};
  if (typeof id !== 'string' || ![1, -1].includes(delta)) {
    return res.status(400).json({ error: 'Invalid payload. Expected { id: string, delta: 1 | -1 }' });
  }
  const state = readState();
  if (!state.members[id]) state.members[id] = { stars: 0, taskIndex: 0, rewardIndex: 0, redemptions: {} };
  const current = Number(state.members[id].stars || 0);
  const next = Math.max(0, current + delta);
  state.members[id].stars = next;
  writeState(state);

  // Broadcast both legacy and new event types for compatibility
  broadcastToClients({ type: 'count-updated', id, count: next });
  broadcastToClients({ type: 'stars-updated', id, stars: next });

  res.json({ id, count: next, stars: next });
});

// New endpoint: update stars by arbitrary delta (task completion/undo)
app.post('/api/stars', (req, res) => {
  const { id, delta } = req.body || {};
  if (typeof id !== 'string' || typeof delta !== 'number' || !Number.isFinite(delta)) {
    return res.status(400).json({ error: 'Invalid payload. Expected { id: string, delta: number }' });
  }
  const state = readState();
  if (!state.members[id]) state.members[id] = { stars: 0, taskIndex: 0, rewardIndex: 0, redemptions: {} };
  const current = Number(state.members[id].stars || 0);
  const next = Math.max(0, current + delta);
  state.members[id].stars = next;
  writeState(state);
  broadcastToClients({ type: 'stars-updated', id, stars: next });
  res.json({ id, stars: next });
});

// New endpoint: sync carousel index for task or reward
app.post('/api/index', (req, res) => {
  const { id, which, index } = req.body || {};
  if (typeof id !== 'string' || !['task', 'reward'].includes(which) || typeof index !== 'number' || index < 0) {
    return res.status(400).json({ error: 'Invalid payload. Expected { id: string, which: "task"|"reward", index: number>=0 }' });
  }
  const state = readState();
  if (!state.members[id]) state.members[id] = { stars: 0, taskIndex: 0, rewardIndex: 0, redemptions: {} };
  if (which === 'task') state.members[id].taskIndex = index; else state.members[id].rewardIndex = index;
  writeState(state);
  broadcastToClients({ type: 'index-updated', id, which, index });
  res.json({ id, which, index });
});

// New endpoint: redeem or undo a reward
app.post('/api/redeem', (req, res) => {
  const { id, rewardKey = 'current', cost, action } = req.body || {};
  if (typeof id !== 'string' || typeof cost !== 'number' || !['redeem', 'undo'].includes(action)) {
    return res.status(400).json({ error: 'Invalid payload. Expected { id: string, rewardKey?: string, cost: number, action: "redeem"|"undo" }' });
  }
  const state = readState();
  if (!state.members[id]) state.members[id] = { stars: 0, taskIndex: 0, rewardIndex: 0, redemptions: {} };
  const member = state.members[id];
  const current = Number(member.stars || 0);
  if (action === 'redeem') {
    if (current < cost) return res.status(400).json({ error: 'Not enough stars' });
    member.stars = current - cost;
    member.redemptions[rewardKey] = (member.redemptions[rewardKey] || 0) + 1;
  } else if (action === 'undo') {
    if (!(member.redemptions[rewardKey] > 0)) return res.status(400).json({ error: 'Nothing to undo' });
    member.stars = current + cost;
    member.redemptions[rewardKey] = member.redemptions[rewardKey] - 1;
    if (member.redemptions[rewardKey] <= 0) delete member.redemptions[rewardKey];
  }
  writeState(state);
  broadcastToClients({ type: 'stars-updated', id, stars: member.stars });
  broadcastToClients({ type: 'redeem-updated', id, rewardKey, count: member.redemptions[rewardKey] || 0 });
  res.json({ id, stars: member.stars, rewardKey, redeemedCount: member.redemptions[rewardKey] || 0 });
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
