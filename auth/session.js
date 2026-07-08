const jwt = require('jsonwebtoken');

const COOKIE_NAME = 'portal_session';

// Stateless signed JWT in an httpOnly cookie - no server-side session store.
// Vercel functions are ephemeral/multi-instance, so an in-memory store would
// silently break across invocations.
function createSessionCookie(res, user) {
  const token = jwt.sign(
    { email: user.email, name: user.name },
    process.env.SESSION_SECRET,
    { expiresIn: '12h' }
  );
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 12 * 60 * 60 * 1000,
  });
}

function readSession(req) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.SESSION_SECRET);
  } catch {
    return null;
  }
}

function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME);
}

module.exports = { createSessionCookie, readSession, clearSessionCookie, COOKIE_NAME };
