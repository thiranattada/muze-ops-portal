require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const requireAuth = require('./auth/requireAuth');
const reportProxy = require('./proxy/reportProxy');
const dashboardProxy = require('./proxy/dashboardProxy');
const loginRoutes = require('./routes/login');
const landingRoutes = require('./routes/landing');

const app = express();
app.use(cookieParser());

// NOTE: no body-parsing middleware (express.json()/urlencoded()) is mounted
// anywhere - the proxy streams the raw request body through untouched, and
// a body parser would drain that stream before the proxy ever saw it.

// Public routes - must be registered before requireAuth
app.use(loginRoutes);

// Everything below this line requires a valid session
app.use(requireAuth);

app.use(landingRoutes);
app.use(reportProxy);
app.use(dashboardProxy);

module.exports = app;
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`muze-ops-portal running on http://localhost:${port}`));
}
