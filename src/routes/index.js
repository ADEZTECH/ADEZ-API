const express = require('express');
const { getHealthStatus } = require('../controllers/healthController');

const router = express.Router();

router.get('/health', getHealthStatus);
router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to ADEZ-API',
    version: '1.0.0',
    status: 'ok'
  });
});

module.exports = router;
