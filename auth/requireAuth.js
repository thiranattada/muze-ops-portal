const { readSession } = require('./session');

function requireAuth(req, res, next) {
  const session = readSession(req);
  if (!session) {
    return res.redirect(`/login?next=${encodeURIComponent(req.originalUrl)}`);
  }
  req.user = session;
  next();
}

module.exports = requireAuth;
