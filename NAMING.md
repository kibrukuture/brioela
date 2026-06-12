# Naming Convention

## Core rule

**Name every variable, function, and type exactly like what it does. No generic terms. Be extremely granular.**

A name must answer: _what specific thing is this, and what does it do?_
If the name could apply to more than one thing in the codebase, it is too generic and must be renamed.

---

## What padding means

**Padding** is any word appended to a name that adds length without adding meaning.

Padding words describe _structure_ or _role_ instead of _purpose_. They tell you how something is shaped, not what it actually does.

```ts
// Padded — "Handler" says nothing about what runs
const sessionWatchdogHandler = { handle() { ... } }

// Padded — "Result" says nothing about what came back
interface AlarmHandlerResult { status: string }

// Padded — "Manager" says nothing about what is managed
class AlarmManager { ... }

// Correct — name tells you exactly what it is and does
const runSessionWatchdog: AlarmAction = { handle() { ... } }
interface AlarmOutcome { status: string }
function scheduleNextAlarmSlot() { ... }
```

---

## Banned words

Never use these as suffixes or standalone names on any identifier, type, variable, or function.

```js
const BANNED_WORDS = [
  'Result',     // use the domain word: Outcome, Verdict, Settlement, Decision
  'Handler',    // implies a callback function — banned on objects/types/vars (file names only)
  'Helper',     // vague — name what it helps with (file names only)
  'Manager',    // vague catch-all — name what it manages and how
  'Service',    // vague catch-all — name what it does
  'Util',       // vague catch-all — name the function's actual operation
  'Utils',      // same as Util
  'Wrapper',    // describes structure not purpose — name the purpose
  'Processor',  // vague — everything processes something; name what and how
  'Type',       // padding suffix on non-schema identifiers: SessionCaller not SessionCallerType
  'Info',       // vague — name the specific data: UserProfile not UserInfo
  'Data',       // vague — name the specific thing: AlarmPayload not AlarmData
  'Object',     // vague — name the domain concept: Recipe not RecipeObject
  'Item',       // vague — name the domain concept: Alarm not AlarmItem
  'Entry',      // vague — name the domain concept: MemoryRecord not MemoryEntry
  'Base',       // signals unfinished abstraction — name the real concept
  'Abstract',   // same as Base
  'Common',     // vague — put it where it belongs, name it what it is
  'Misc',       // vague — name every function exactly
  'General',    // vague — be specific
]
```

---

## File name exceptions

`Handler` and `Helper` are allowed **in file names only** — they describe the file's role in the folder, not an exported identifier:

```
run.session.watchdog.handler.ts   ✓  file name
format.migration.error.helper.ts  ✓  file name

export const runSessionWatchdog: AlarmAction   ✓  no padding on the variable
export const runSessionWatchdogHandler         ✗  Handler on a variable — banned
```

---

## Granularity rule

Do not stop at the first noun that fits. Push until the name is unambiguous within the codebase.

```ts
// Too broad — what alarm? what write?
function writeAlarm() {}

// Correct — exactly one thing with no ambiguity
function writeUserAlarm() {}
function markAlarmProcessing() {}
function readEarliestPendingScheduledAt() {}
```

---

## Separator rule

Domain key strings (alarm types, event types, namespace keys) use **only colons** as separators. No underscores, no hyphens:

```
brain:watchdog             ✓
brain:behavior:pattern     ✓
brain_watchdog             ✗
brain-watchdog             ✗
brain:behavior_pattern     ✗
```
