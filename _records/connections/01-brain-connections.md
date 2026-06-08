# Connections — Brain

spec: brioela-specs/09-per-user-brain.md
  → build-guide/05-brain/01-do-class-and-setup.md   [x] done
  → build-guide/05-brain/02-tool-protocol.md         [x] done
  → build-guide/05-brain/03-session-lifecycle.md     [x] done
  → build-guide/05-brain/04-sub-agents.md            [x] done
  → build-guide/05-brain/05-alarm-system.md          [x] done
  → build-guide/05-brain/07-agent-framework-hardening.md [x] done

spec: brioela-specs/08-personal-food-brain-memory.md
  → build-guide/05-brain/02-tool-protocol.md         [x] done (namespace rules, memory tools)
  → build-guide/06-brain-memory/                           [x] done

spec: brioela-specs/24-technical-architecture-backbone.md
  → build-guide/05-brain/01-do-class-and-setup.md   [x] done (DO addressing, Env type)
  → build-guide/05-brain/03-session-lifecycle.md     [x] done (compression)

spec: brioela-specs/34-universal-visual-intake.md
  → build-guide/06-brain-memory/04-visual-intake.md        [x] done

spec: implementable-specs/00-overview.md
  → build-guide/05-brain/01-do-class-and-setup.md   [x] done (WAL mode, Drizzle wiring)
  → build-guide/05-brain/03-session-lifecycle.md     [x] done (prefix cache contract)
  → build-guide/06-brain-memory/                           [x] done (writers by table, all schemas)

spec: implementable-specs/15-brain-maintenance-and-behavior-patterns.md
  → build-guide/05-brain/04-sub-agents.md            [x] done (BrainMaintenanceAgent, BehaviorPatternAgent, tool forwarding, TOOL_PERMISSIONS)
  → build-guide/05-brain/07-agent-framework-hardening.md [x] done (current subAgent/agentTool replacement path)

spec: implementable-specs/16-agent-identity.md
  → build-guide/05-brain/06-agent-identity.md        [x] done

spec: implementable-specs/17-session-lifecycle.md
  → build-guide/05-brain/03-session-lifecycle.md     [x] done (compression, SessionContextCompressor, abandoned detection)
  → build-guide/05-brain/05-alarm-system.md          [x] done (watchdog alarm)
  → build-guide/05-brain/07-agent-framework-hardening.md [x] done (current schedule/fiber/session hardening)

spec: implementable-specs/brioela-tools/ (tool specs)
  → build-guide/05-brain/02-tool-protocol.md         [x] done (tool list, definition pattern, TOOL_PERMISSIONS)
  → build-guide/05-brain/07-agent-framework-hardening.md [x] done (AI SDK tool layer retained; runtime plumbing hardened)

external docs: Cloudflare Agents SDK current docs, 2026-06-07
  → build-guide/05-brain/07-agent-framework-hardening.md [x] captured

external docs: Vercel AI SDK v6 tool/agent docs, 2026-06-07
  → build-guide/05-brain/07-agent-framework-hardening.md [x] captured
