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

-- Create FTS5 Virtual Tables for session_turns (content)
CREATE VIRTUAL TABLE session_turns_fts USING fts5(
  content,
  content='session_turns',
  content_rowid='rowid',
  tokenize='unicode61'
);

CREATE VIRTUAL TABLE session_turns_fts_trigram USING fts5(
  content,
  content='session_turns',
  content_rowid='rowid',
  tokenize='trigram'
);

-- Triggers for keeping session_turns FTS5 tables synced
CREATE TRIGGER session_turns_fts_ai AFTER INSERT ON session_turns BEGIN
  INSERT INTO session_turns_fts(rowid, content) VALUES (new.rowid, new.content);
END;

CREATE TRIGGER session_turns_fts_au AFTER UPDATE ON session_turns BEGIN
  INSERT INTO session_turns_fts(session_turns_fts, rowid, content) VALUES ('delete', old.rowid, old.content);
  INSERT INTO session_turns_fts(rowid, content) VALUES (new.rowid, new.content);
END;

CREATE TRIGGER session_turns_fts_ad AFTER DELETE ON session_turns BEGIN
  INSERT INTO session_turns_fts(session_turns_fts, rowid, content) VALUES ('delete', old.rowid, old.content);
END;

CREATE TRIGGER session_turns_fts_trigram_ai AFTER INSERT ON session_turns BEGIN
  INSERT INTO session_turns_fts_trigram(rowid, content) VALUES (new.rowid, new.content);
END;

CREATE TRIGGER session_turns_fts_trigram_au AFTER UPDATE ON session_turns BEGIN
  INSERT INTO session_turns_fts_trigram(session_turns_fts_trigram, rowid, content) VALUES ('delete', old.rowid, old.content);
  INSERT INTO session_turns_fts_trigram(rowid, content) VALUES (new.rowid, new.content);
END;

CREATE TRIGGER session_turns_fts_trigram_ad AFTER DELETE ON session_turns BEGIN
  INSERT INTO session_turns_fts_trigram(session_turns_fts_trigram, rowid, content) VALUES ('delete', old.rowid, old.content);
END;
