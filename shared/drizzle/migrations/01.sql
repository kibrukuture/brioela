
-- this was added manually for the first time. 
CREATE SCHEMA IF NOT EXISTS "schnl";

GRANT USAGE ON SCHEMA schnl TO  service_role;
GRANT ALL ON ALL TABLES IN SCHEMA schnl TO  service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA schnl TO  service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA schnl TO  service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA schnl GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA schnl GRANT ALL ON ROUTINES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA schnl GRANT ALL ON SEQUENCES TO service_role;

-- this is for the default random uuid. 
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

