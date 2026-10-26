const getHealthStatus = (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'ADEZ-API',
    uptime: process.uptime().toFixed(2)
  });
};

module.exports = { getHealthStatus };
