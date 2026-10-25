# Ram Villa · portfolio site

A Next.js (App Router) portfolio hosted on Vercel with a workspace where four agents each do a job on the page.

## The agents

| Agent | Role | Lives in | Job on the page |
|---|---|---|---|
| Scout | Researcher | About | Scans the background and skills. Radar sweep over the section. |
| Archivist | Records | Experience | Files each role. A "Filed" stamp lands on every job. |
| Builder | Shipping | Projects | Checks what ships. Sparks play over the project cards. |
| Courier | Requests | Resume | Prepares the resume request. The form glows. |

Each task walks the agent to its room on the floor plan, plays the effect on the real section, writes a briefing into the activity log, and returns the agent to its desk. Briefings come from the content file, so they never state anything the content does not.

## Run it

```bash
cd site
npm ci
npm run dev        # http://localhost:3000
npm test           # unit tests for briefings and the Gemini client
npm run typecheck
npm run build      # static export to out/
```

## Content

Every fact on the page lives in `content/portfolio.ts`. Change it there, and the agents' briefings update with it.

## Gemini (optional)

Gemini writes a second, labelled briefing per agent ("Ask Gemini"). Without a key the button shows a notice and the agents still work.

The key is a server-only environment variable read by `app/api/brief/route.ts`. It never reaches the browser.

- Local: put `GEMINI_API_KEY=...` in `site/.env.local` (this file is git-ignored).
- Vercel: Project → Settings → Environment Variables → add `GEMINI_API_KEY` for Production, Preview and Development.

The route only accepts same-origin requests, limits each client to 20 requests a minute (per serverless instance, best effort), and only sends the facts the site provides for one agent.

## Deploy on Vercel

1. In Vercel, choose **Add New → Project** and import `Ramvilla1997/my-portfolio`.
2. Set **Root Directory** to `site`. Vercel detects Next.js automatically.
3. Add the `GEMINI_API_KEY` environment variable (optional, see above).
4. Deploy. Each push to `main` deploys to production, and each branch gets a preview URL.

For production traffic, add a rate-limit rule in the Vercel Firewall for `/api/brief`. The in-code limit is per instance, so the firewall is the real backstop.
