const express = require('express');
const { getHealthStatus } = require('../controllers/healthController');
const { registerUser, loginUser, authenticateToken } = require('../lib/auth');
const { generateAIResponse } = require('../lib/ai');

const router = express.Router();

router.get('/health', getHealthStatus);

router.get('/status', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ADEZ-API',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to ADEZ-API',
    version: '1.0.0',
    status: 'ok'
  });
});

router.post('/auth/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const result = await registerUser({ name, email, password });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const result = await loginUser({ email, password });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/me', authenticateToken, (req, res) => {
  res.json({
    user: req.user,
    authenticated: true
  });
});

router.post('/ai/chat', authenticateToken, async (req, res, next) => {
  try {
    const prompt = req.body?.prompt || 'Give me a short overview about ADEZ API.';
    const aiResult = await generateAIResponse({
      prompt,
      context: 'ADEZ API is a gateway for AI, WhatsApp, and developer APIs for the African market.'
    });

    res.json({
      success: true,
      provider: aiResult.provider,
      response: aiResult.response,
      prompt
    });
  } catch (error) {
    next(error);
  }
});

router.get('/webhooks/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'adez-whatsapp-token';

  if (mode === 'subscribe' && token === verifyToken) {
    return res.status(200).send(challenge);
  }

  return res.status(403).send('Forbidden');
});

router.post('/webhooks/whatsapp', (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const expectedSecret = process.env.WHATSAPP_APP_SECRET || 'adez-whatsapp-secret';

  if (process.env.WHATSAPP_APP_SECRET) {
    const crypto = require('crypto');
    const computed = 'sha256=' + crypto
      .createHmac('sha256', expectedSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== computed) {
      return res.status(403).json({ message: 'Invalid signature.' });
    }
  }

  const data = req.body || {};
  const entries = data.entry || [];

  entries.forEach((entry) => {
    (entry.changes || []).forEach((change) => {
      const value = change.value || {};
      const messages = value.messages || [];

      messages.forEach((message) => {
        console.log('WhatsApp message received:', message);
      });
    });
  });

  res.status(200).json({ status: 'received' });
});

module.exports = router;
