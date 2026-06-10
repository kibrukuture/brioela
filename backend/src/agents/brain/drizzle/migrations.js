import journal from './meta/_journal.json';
import m0000 from './0000_handy_robbie_robertson.sql';
import m0001 from './0001_low_jack_flag.sql';
import m0002 from './0002_add_fts_and_triggers.sql';

  export default {
    journal,
    migrations: {
      m0000,
m0001,
m0002
    }
  }
  