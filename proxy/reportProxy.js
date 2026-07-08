const router = require('express').Router();
const proxyRequest = require('./proxyRequest');

function basicAuthHeader() {
  const creds = `${process.env.REPORT_TOOL_BASIC_AUTH_USER}:${process.env.REPORT_TOOL_BASIC_AUTH_PASSWORD}`;
  return `Basic ${Buffer.from(creds).toString('base64')}`;
}

function forward(req, res) {
  proxyRequest(req, res, {
    targetBase: process.env.REPORT_TOOL_BASE_URL,
    stripPrefix: '/report',
    injectHeaders: { Authorization: basicAuthHeader() },
    timeoutMs: 55000,
  });
}

router.all('/report', forward);
router.all('/report/*splat', forward);

module.exports = router;
