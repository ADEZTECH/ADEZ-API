const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createUser, findUserByEmail } = require('./storage');

const JWT_SECRET = process.env.JWT_SECRET || 'adez-change-me-in-production';

function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
}

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: '7d', issuer: 'adez-api' }
  );
}

function validatePassword(password) {
  return typeof password === 'string' && password.length >= 8;
}

async function registerUser({ name, email, password }) {
  const normalizedEmail = String(email || '').toLowerCase();

  if (!normalizedEmail || !validatePassword(password)) {
    throw new Error('A valid email and password of at least 8 characters are required.');
  }

  const existingUser = await findUserByEmail(normalizedEmail);
  if (existingUser) {
    throw new Error('User already exists.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await createUser({
    name: name || 'User',
    email: normalizedEmail,
    password: passwordHash
  });

  return {
    user: sanitizeUser(user),
    token: signToken(user)
  };
}

async function loginUser({ email, password }) {
  const normalizedEmail = String(email || '').toLowerCase();
  const user = await findUserByEmail(normalizedEmail);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error('Invalid email or password.');
  }

  return {
    user: sanitizeUser(user),
    token: signToken(user)
  };
}

function authenticateToken(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication token missing.' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET, {
      issuer: 'adez-api',
      algorithms: ['HS256']
    });
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

module.exports = {
  registerUser,
  loginUser,
  authenticateToken,
  signToken,
  validatePassword
};
