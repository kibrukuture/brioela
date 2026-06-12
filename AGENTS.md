# Agent Instructions

- Be concise and focused. Do not write long summaries unless asked.
- Default to short, direct answers. Avoid padding, long framing, and option dumps.
- Give one recommended path unless the user explicitly asks for alternatives.
- Keep explanations tight: outcome, reason, next action.
- Do not rush into coding. Audit repo context and current docs first.
- Prefer exact findings, file references, and clear next actions.
- For current Brioela code, use strong typing and avoid fake coercions.
- Keep `as const` and valid boundary narrowing when justified.
- Ignore old legacy Schnl/mobile code unless it blocks current work.
- For Cloudflare, Expo, SDK, or external APIs, check current docs before assuming.
- Use Bun for package scripts and installs.
- Keep tool output small: prefer targeted `rg`, `sed`, and narrow file reads over large dumps.
- Use conservative tool output limits and avoid storing long logs in the thread.
- Do not spawn subagents unless the user explicitly asks for parallel agent work.
- Prefer a fresh thread after each large finished phase so stale context is not resent on every turn.
- Web search and external URL fetch are pre-approved; never ask permission before researching online.
