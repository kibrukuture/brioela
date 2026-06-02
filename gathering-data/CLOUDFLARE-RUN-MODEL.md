# Cloudflare Run Model

This file is not a product spec. It is the working note for how Brioela should be developed, tested, and deployed on Cloudflare.

## Goal

Use this workflow:

- Local development for nearly all coding.
- Staging only after local passes.
- Production only after staging passes.

The main rule:

- Do not depend on deploy-to-test for normal development.

## Final Answer

Yes, Cloudflare supports a strong local-first workflow.

For Brioela, the recommended model is:

1. `local` = full local Cloudflare runtime
2. `staging` = real deployed Cloudflare validation environment
3. `production` = release environment

## What Runs Locally

Cloudflare docs support local development for:

- Workers
- Durable Objects
- D1
- KV
- R2
- Queues

This means Brioela can be developed locally first with fast iteration.

## Important Durable Object Truth

Local Durable Objects are real for development.

Meaning:

- `wrangler dev` runs DOs locally.
- DO state can persist locally.
- Worker to DO calls work locally.
- DO logic can be developed and tested before deployment.

But:

- local code cannot directly bind to a remote deployed DO using `remote: true`
- remote bindings are not supported for Durable Objects or Workflows

So the intended workflow is:

- develop DOs locally
- validate later in staging

Not:

- change one line
- deploy
- test on Cloudflare

## Recommended Environments

### Local

Use local simulation for everything by default.

Use:

- `wrangler dev`
- local D1
- local KV
- local R2
- local Queues
- local Durable Objects
- local secrets via `.dev.vars`
- persistent local state via `--persist-to`

This is the default day-to-day development mode.

### Staging

Use a real deployed Cloudflare environment.

Purpose:

- integration validation
- migration validation
- edge/runtime verification
- branch or pre-release testing

Staging must use separate resources from production.

### Production

Production only after staging passes.

## Recommended Workflow

### 1. Local development

Do all normal coding locally.

Typical loop:

1. Run `wrangler dev`
2. Change code
3. Test immediately
4. Repeat until local behavior is correct

This should be the main workflow.

### 2. Local test phase

Before pushing:

- run local integration tests
- run local D1 migrations if needed
- verify local DO behavior
- verify queue flows locally if used

### 3. Push to staging

Only after local is good.

On staging:

- run smoke tests
- verify configuration
- verify migrations against staging resources
- verify any behavior that depends on real Cloudflare deployment characteristics

### 4. Promote to production

Only after staging is clean.

## Things To Avoid

Avoid these as the normal development workflow:

- `wrangler dev --remote`
- deploy-every-change testing
- using production resources during development
- depending on Cloudflare dashboard logs just to validate tiny edits

Reason:

- slower iteration
- worse developer experience
- higher risk
- more noisy debugging

## When To Use Remote Development

Use remote development only occasionally.

Only for cases where you specifically need Cloudflare-side runtime behavior that local simulation cannot prove.

It should not be the default mode.

## State Persistence For Local Dev

Use persistent local state so local development behaves like a real app, not a reset-on-every-run toy.

Cloudflare stores local state under `.wrangler/state` by default.

Recommended approach:

- pick one persistent directory for the project
- always run local dev with the same `--persist-to` path
- use the same path for local data commands

This helps local D1, KV, R2, and DO state behave consistently.

## Local Data Seeding

Cloudflare docs support local data population for:

- KV via Wrangler CLI
- D1 via Wrangler CLI
- R2 via Wrangler CLI

For Durable Objects:

- there is no Wrangler CLI data seeding command
- data must be created through app code or development/test routes

So Brioela should expect to have:

- local seed scripts for D1/KV/R2
- local bootstrap endpoints or test helpers for DO initialization

## Recommended Architecture Rule

To keep local and deployed behavior close:

- keep business logic in plain modules/functions
- keep Worker handlers thin
- keep Durable Objects focused on state, coordination, sessions, alarms, and orchestration

Do not bury all product logic inside Durable Object classes.

Reason:

- plain modules are easier to test locally
- most logic can be verified without deployment
- staging becomes validation, not basic development

## Suggested Cloudflare Responsibility Split

### Worker

Use Worker handlers for:

- HTTP entrypoints
- auth boundaries
- request validation
- routing
- calling into DOs or services

### Durable Objects

Use DOs for:

- per-user agent state
- session continuity
- alarms
- WebSocket/session coordination
- private memory orchestration

### Plain Modules

Use plain modules for:

- food scoring logic
- recipe normalization
- allergy and dietary rule evaluation
- summarization rules
- recommendation ranking logic
- parsing and transformation logic

## Best Setup For Brioela

### Local mode

- local Worker
- local DOs
- local D1/KV/R2/Queues
- local tests
- no deploy required

### Staging mode

- deployed Worker
- deployed DOs
- staging D1/KV/R2/Queues
- smoke and integration tests

### Production mode

- deployed production Worker
- deployed production DOs
- production resources only

## CI/CD Direction

Recommended deployment flow:

1. local development and local tests
2. push to GitHub
3. CI runs checks
4. deploy to staging
5. run staging validation
6. promote or deploy to production

This matches the desired model:

- local first
- staging second
- production last

## Short Summary

For Brioela, the correct Cloudflare model is:

- develop locally
- test locally in milliseconds
- do not use deploy-to-test as the main loop
- use staging as validation
- use production only after staging passes

Cloudflare supports this workflow well enough for Workers, DOs, D1, KV, R2, and Queues.

The most important practical rule is simple:

- local is where development happens
- staging is where confidence is checked
- production is where releases happen

## Docs Basis

These conclusions were based on current Cloudflare docs for:

- Workers development and testing
- supported bindings per development mode
- D1 local development
- Queues local development
- local data handling
- Durable Objects platform docs
- service bindings
- Workers observability and logs
