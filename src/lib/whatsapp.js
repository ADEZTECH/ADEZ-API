const crypto = require('crypto');

function verifyWhatsAppSignature(secret, payload, signature) {
  if (!secret || !signature) {
    return false;
  }

  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(typeof payload === 'string' ? payload : JSON.stringify(payload))
    .digest('hex');

  const expectedBuffer = Buffer.from(expected, 'hex');
  const providedBuffer = Buffer.from(signature, 'utf8');

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

module.exports = { verifyWhatsAppSignature };
