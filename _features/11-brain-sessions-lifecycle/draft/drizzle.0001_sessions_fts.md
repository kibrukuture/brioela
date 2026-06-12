# Draft: drizzle/0001_add_fts_and_triggers.sql (sessions portion)

Target: `backend/src/agents/brain/drizzle/0001_add_fts_and_triggers.sql`

**Shipped (04 foundation).** Sessions FTS supports **16** `search_session_history`. Same migration also creates `session_turns_fts*` (used by turn-level search if spec adds it).

```sql
-- Create FTS5 Virtual Tables for sessions (outcome_summary)
CREATE VIRTUAL TABLE sessions_fts USING fts5(
  outcome_summary,
  content='sessions',
  content_rowid='rowid',
  tokenize='unicode61'
);

CREATE VIRTUAL TABLE sessions_fts_trigram USING fts5(
  outcome_summary,
  content='sessions',
  content_rowid='rowid',
  tokenize='trigram'
);

-- Triggers for keeping sessions FTS5 tables synced
CREATE TRIGGER sessions_fts_ai AFTER INSERT ON sessions BEGIN
  INSERT INTO sessions_fts(rowid, outcome_summary) VALUES (new.rowid, new.outcome_summary);
END;

CREATE TRIGGER sessions_fts_au AFTER UPDATE ON sessions BEGIN
  INSERT INTO sessions_fts(sessions_fts, rowid, outcome_summary) VALUES ('delete', old.rowid, old.outcome_summary);
  INSERT INTO sessions_fts(rowid, outcome_summary) VALUES (new.rowid, new.outcome_summary);
END;

CREATE TRIGGER sessions_fts_ad AFTER DELETE ON sessions BEGIN
  INSERT INTO sessions_fts(sessions_fts, rowid, outcome_summary) VALUES ('delete', old.rowid, old.outcome_summary);
END;

CREATE TRIGGER sessions_fts_trigram_ai AFTER INSERT ON sessions BEGIN
  INSERT INTO sessions_fts_trigram(rowid, outcome_summary) VALUES (new.rowid, new.outcome_summary);
END;

CREATE TRIGGER sessions_fts_trigram_au AFTER UPDATE ON sessions BEGIN
  INSERT INTO sessions_fts_trigram(sessions_fts_trigram, rowid, outcome_summary) VALUES ('delete', old.rowid, old.outcome_summary);
  INSERT INTO sessions_fts_trigram(rowid, outcome_summary) VALUES (new.rowid, new.outcome_summary);
END;

CREATE TRIGGER sessions_fts_trigram_ad AFTER DELETE ON sessions BEGIN
  INSERT INTO sessions_fts_trigram(sessions_fts_trigram, rowid, outcome_summary) VALUES ('delete', old.rowid, old.outcome_summary);
END;
```

Verified: `run.migrations.handler.test.ts` — insert session, MATCH `doro`, update summary, trigram turn search.
