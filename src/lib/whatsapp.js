const crypto = require('crypto');

function verifyWhatsAppSignature(secret, payload, signature) {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature || '')
  );
}

module.exports = { verifyWhatsAppSignature };
