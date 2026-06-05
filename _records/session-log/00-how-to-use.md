# Session Log — How to Use

## The single most important recovery instruction

After context compaction or starting a new session:
READ THE LAST NUMBERED FILE IN THIS FOLDER.

That file tells you exactly where work stopped, what was in progress, and what is next.
Do not read all files. Do not read from the beginning. Just the last one.

## File naming
Files are zero-padded numbers followed by a short label:
  001-initial-setup.md
  002-inventory-pass.md
  003-design-system-start.md
  ...

Always increment. Never overwrite a previous session log.

## What each session log file must contain
1. Date of session
2. What was completed this session (file paths, not vague descriptions)
3. What is currently in progress (if anything was left half-done)
4. What is next (the exact first action for the next session)
5. Any blockers or decisions made that affect future sessions
6. Which `_records/inventory/` items changed status this session

## The contract
Every session ends by writing or updating the session log BEFORE closing.
If a session ends abruptly, the previous session log is still valid — start from there.
