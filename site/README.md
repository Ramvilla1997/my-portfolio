# Ram Villa · portfolio site

A Next.js (App Router, static export) portfolio with a workspace where four agents each do a job on the page.

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

Gemini is only used for a second, labelled briefing per agent ("Ask Gemini"). Without it the agents still work.

The key never reaches the browser. The browser calls a small Cloudflare Worker in `../agent-proxy`, which holds the key as a secret.

1. Create a Gemini API key in Google AI Studio.
2. In the GitHub repository settings, add these secrets:
   - `GEMINI_API_KEY`: the Gemini key
   - `CLOUDFLARE_API_TOKEN`: a token with Workers edit permission
   - `CLOUDFLARE_ACCOUNT_ID`: your Cloudflare account ID
3. Run the **Deploy agent proxy** workflow. It deploys the Worker and stores the key as its secret.
4. Copy the Worker URL, then add it as a repository **variable** named `AGENT_API_URL`. Re-run the **Deploy site to GitHub Pages** workflow so the button appears.

The Worker only accepts requests from `https://ramvilla1997.github.io`, limits each client to 20 requests a minute (per isolate, best effort), and rejects unknown agents and oversized input. Only the facts the site sends for one agent reach the model.

## Deploy

The **Deploy site to GitHub Pages** workflow builds `site/` and publishes it. In repository settings, set **Pages → Source → GitHub Actions**.
