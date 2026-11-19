# Signal-Radar – notes for Claude

## Working with the owner (important)
- **Always explain what you build, how and why** – to the owner in **German**, in plain words. The owner is a beginner in tech and finance.
- **Explain every technical term** the first time it comes up (e.g. API, MCP, agent, pull request, merge, secret, CI), in one plain German sentence, ideally with an everyday comparison.
- **Coach the owner**: the owner wants to become an expert in Claude and AI. At the end of each answer give 1–2 concrete tips: how their last prompt could have been clearer, what to do better when building apps, and notable new Claude/AI features (check the web, don't rely on memory).
- **Every owner request becomes a task**: add it to `docs/TASKS.md`, ordered by priority (value ÷ effort), and work through it in that order.
- **Everything the user enters can be changed later** (profile, goal, portfolio, preferences). The app must work without optional inputs.
- For every step say briefly: *what* changes, *why* it helps, *what* the owner has to do themselves (with click-by-click instructions; note when something only works in a desktop browser).
- No jargon without explanation. Prefer an example over a technical term.

## Language rules
- **App UI and content: German.**
- **Everything on GitHub: English** – README, docs, code comments in new code, commit messages, PR titles/descriptions, workflow comments.
- Explanations to the owner in chat: German.

## What the project is
A public investment dashboard (GitHub Pages) shared via WhatsApp link, no login.
- `collector/` gathers prices, news, SEC filings, research etc. every 15 minutes via GitHub Actions and writes `site/data/*.json`.
- `site/` is the web app (plain HTML/CSS/JS). `signals.js` turns data into plain-language signals.
- Tests: `npm test`. Demo data: `npm run demo`.

## Project files (keep up to date)
- `docs/ROADMAP.md` versions & scope · `docs/TASKS.md` tasks with status/priority · `docs/DECISIONS.md` decisions with reasons · `CHANGELOG.md`.
- Add every new idea from the owner to `docs/TASKS.md` first (value, effort, version), then implement.

## Content rules
- Never promise investment advice. Observations, rules and suggestions – no buy recommendations. Keep the "Keine Anlageberatung" notice.
- Never invent numbers or attribute fabricated quotes to real people. Mark demo data as "Demo".
- Every section shows its source and evidence level. Keep it simple: fewer things, clearly explained.
- Don't put private persons' names (e.g. friends of the owner) into the public repo.
