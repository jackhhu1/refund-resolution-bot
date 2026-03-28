require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/webhook/meetstream', (req, res) => {
  console.log('Webhook received:', req.body);
  res.sendStatus(200);
});

app.post('/test/:scenario', (req, res) => {
  console.log(`Test scenario triggered: ${req.params.scenario}`);
  res.sendStatus(200);
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../dashboard/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
