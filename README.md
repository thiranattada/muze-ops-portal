# muze-ops-portal

Unified internal tools portal, gated behind one Google Workspace login
(`muze.co.th` accounts only). Some tools (Email Digest, Daily Planner) are
built directly into this app; others with their own independent
Google-gated auth are just linked from the landing page (see
`public/landing.html`) rather than proxied.

## Setup

```bash
npm install
cp .env.example .env   # fill in real values, see below
npm start
```

Open http://localhost:3000 — you'll be redirected to `/login` until you
sign in with Google.

## Before this works end-to-end

1. **Google OAuth client** (the one piece only a Google Cloud Console admin
   for `muze.co.th` can set up):
   - Create/reuse a GCP project, set the OAuth consent screen to **Internal**
   - Add the `.../auth/calendar.readonly` scope on the consent screen (used
     only by the Daily Planner's "Run" button, to read the signed-in user's
     own calendar - it's a sensitive but not restricted scope, so Internal
     apps don't need Google's verification review for it)
   - Create a Web-application OAuth 2.0 Client ID
   - Authorized redirect URI: `https://muze-ops-portal.vercel.app/auth/google/callback`
     (and `http://localhost:3000/auth/google/callback` for local dev)
   - Put the Client ID/Secret into `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`
     (locally in `.env`, and in Vercel's project env vars for production)
   - Everyone needs to log out and back in once after this scope was added,
     to grant it - existing sessions/refresh tokens predate it
2. `SESSION_SECRET` and `PLANNER_SECRET` are already set as Vercel
   production env vars.

## Known limitations (by design)

- No session store — sessions are a stateless signed JWT cookie, 12h expiry.
  Rotating `SESSION_SECRET` logs everyone out; acceptable for a small
  internal tool.
- No `/logout` link is exposed anywhere except the landing page header.

## Adding a module later

For a module with its own independent Google-gated auth (like KTC Monthly
Report or TVN Case Monitoring), just add a plain link card to
`public/landing.html` — no proxying needed. For a module without its own
auth that needs the portal's SSO to gate it, build it as a native route
here (see `routes/digest.js`/`routes/planner.js` as examples) rather than
reintroducing a reverse-proxy layer.
