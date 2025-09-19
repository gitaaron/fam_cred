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
    return JSON.parse(raw);
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

app.post('/api/complete', (req, res) => {
  const { id, delta } = req.body || {};
  if (typeof id !== 'string' || ![1, -1].includes(delta)) {
    return res.status(400).json({ error: 'Invalid payload. Expected { id: string, delta: 1 | -1 }' });
  }
  const state = readState();
  const current = state.members[id] || 0;
  const next = Math.max(0, Math.min(30, current + delta));
  state.members[id] = next;
  writeState(state);
  
  // Broadcast the change to all connected clients
  broadcastToClients({
    type: 'count-updated',
    id,
    count: next
  });
  
  res.json({ id, count: next });
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
