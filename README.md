# Ram Villa — Portfolio

Personal portfolio for Ram Villa, Senior Full-Stack Engineer. The site is an agent playground: visitors ask questions, and the agent who looks after that part of the page walks over and answers from the page's own content.

## Repository layout

| Path | What it is |
|---|---|
| `site/` | The Next.js app (App Router, TypeScript strict, Vitest, three.js). This is the product. |
| `assets/` | Documents kept for reference (resume and FSL PDFs). |
| `neue_regrade/` | Font files kept for reference. |
| `docs/` | Design review notes for the earlier single-page version. |

## Run it

```bash
cd site
npm ci
npm run dev        # http://localhost:3000
npm test           # unit tests (search, crew, routes, office maths, answer route)
npm run typecheck
npm run build      # production build; `npx next start` serves it
```

## Configuration

Set these as environment variables (locally in `site/.env.local`, on Vercel in Project → Settings → Environment Variables). None of them is read by the browser.

| Variable | Purpose |
|---|---|
| `GROQ_API_KEY` | Optional. Answers AI questions first. |
| `GROQ_MODEL` | Optional. Defaults to `llama-3.3-70b-versatile`. |
| `GEMINI_API_KEY` | Optional. Used when Groq is not set or does not answer. |
| `GEMINI_MODEL` | Optional. Defaults to `gemini-3.1-flash-lite`. |

Without any key, the playground still works. It answers with the matching passage from the page.

## Content

Every fact on the site is in `site/content/portfolio.ts`. The playground's search and answers are built from that file.

## Deploy

Vercel project `my-portfolio`, Root Directory `site`. Each push to `main` creates a production deployment in the `ram-villa` team.

## Contact

- LinkedIn: [linkedin.com/in/ramvilla](https://www.linkedin.com/in/ramvilla/)
- Email: ramvilla2203@gmail.com
