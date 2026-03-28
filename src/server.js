require('dotenv').config();
const express = require('express');
const path = require('path');

const { processMeeting } = require('./pipeline');
const { joinMeeting, fetchTranscript } = require('./meetstream');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ── In-memory bot→agent mapping ──────────────────────────────
const botSessions = {}; // bot_id → agent_id

// ── Health check ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ── Webhook health check (GET) ───────────────────────────────
app.get('/webhook/meetstream', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'MeetStream webhook endpoint active' });
});

// ── MeetStream webhook (POST) ────────────────────────────────
app.post('/webhook/meetstream', async (req, res) => {
  res.status(200).send('ok'); // always ack immediately

  const { event, bot_id, bot_status, message } = req.body;
  console.log(`[meetstream] event=${event} bot_id=${bot_id} status=${bot_status}`);

  if (event === 'bot.joining') {
    console.log('[meetstream] Bot is joining the meeting...');
  }

  if (event === 'bot.inmeeting') {
    console.log('[meetstream] Bot is live in the meeting');
  }

  if (event === 'bot.stopped') {
    console.log(`[meetstream] Bot stopped — reason: ${bot_status} — ${message}`);
    if (bot_status === 'NotAllowed' || bot_status === 'Denied' || bot_status === 'Error') {
      console.error('[meetstream] Bot failed to join:', message);
    }
  }

  if (event === 'transcription.processed') {
    console.log('[meetstream] Transcript ready — fetching and running pipeline...');
    try {
      const transcript = await fetchTranscript(bot_id);
      console.log(`[meetstream] Transcript fetched (${transcript.length} chars)`);
      const agentId = botSessions[bot_id] ?? 'agent@demo.com';
      await processMeeting(transcript, agentId, bot_id);
    } catch (err) {
      console.error('[meetstream] Pipeline error:', err.message);
    }
  }
});

// ── Join a meeting ───────────────────────────────────────────
app.post('/join', async (req, res) => {
  const { meeting_url, agent_id = 'agent@demo.com' } = req.body;
  if (!meeting_url) {
    return res.status(400).json({ error: 'meeting_url is required' });
  }
  try {
    const result = await joinMeeting(meeting_url);
    botSessions[result.bot_id] = agent_id;
    console.log(`[join] Bot ${result.bot_id} joining for agent ${agent_id}`);
    res.json(result);
  } catch (err) {
    console.error('[join] Failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Test route (existing) ────────────────────────────────────
app.post('/test/:scenario', async (req, res) => {
  console.log(`Test scenario triggered: ${req.params.scenario}`);
  try {
    const result = await processMeeting(null, 'agent_junior', 'test_call_123', req.params.scenario);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Dashboard ────────────────────────────────────────────────
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../dashboard/index.html'));
});

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Webhook endpoint: POST /webhook/meetstream`);
  console.log(`MOCK_MODE: ${process.env.MOCK_MODE}`);
});
