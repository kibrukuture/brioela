#!/usr/bin/env bun

import { $ } from 'bun'

await $`bun stop.lexicon.guard.daemon.handler.ts`
await $`bun start.lexicon.guard.daemon.handler.ts`
