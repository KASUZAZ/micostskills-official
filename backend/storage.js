const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const STATE_ID = process.env.APP_STATE_ID || "production";
const STATE_TABLE = process.env.SUPABASE_STATE_TABLE || "micostskills_app_state";
const BACKUP_TABLE = process.env.SUPABASE_BACKUP_TABLE || "micostskills_app_backups";

function createSupabaseClient() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function readLocalFile(dataFile, emptyStore) {
  try {
    const data = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    return { ...emptyStore(), ...data };
  } catch {
    return emptyStore();
  }
}

function writeLocalFile(dataFile, store) {
  fs.mkdirSync(path.dirname(dataFile), { recursive: true });
  fs.writeFileSync(dataFile, `${JSON.stringify(store, null, 2)}\n`);
}

function createAppStorage({ dataFile, emptyStore }) {
  let cache = emptyStore();
  let supabase = null;
  let primary = "local-json";

  async function init() {
    cache = readLocalFile(dataFile, emptyStore);
    supabase = createSupabaseClient();

    if (!supabase) return { primary };

    const { data, error } = await supabase
      .from(STATE_TABLE)
      .select("data")
      .eq("id", STATE_ID)
      .maybeSingle();

    if (error) {
      console.warn(`Supabase storage unavailable, using local JSON fallback: ${error.message}`);
      return { primary };
    }

    if (data?.data && Object.keys(data.data).length) {
      cache = { ...emptyStore(), ...data.data };
    } else {
      await supabase
        .from(STATE_TABLE)
        .upsert({ id: STATE_ID, data: cache, updated_at: new Date().toISOString() }, { onConflict: "id" });
    }

    primary = "supabase";
    return { primary };
  }

  function read() {
    return cache;
  }

  function write(store) {
    cache = { ...emptyStore(), ...store };
    try {
      writeLocalFile(dataFile, cache);
    } catch (error) {
      if (!supabase) throw error;
      console.warn(`Local JSON save skipped: ${error.message}`);
    }
    return persistRemote(cache);
  }

  async function persistRemote(store) {
    if (supabase) {
      const { error } = await supabase
        .from(STATE_TABLE)
        .upsert({ id: STATE_ID, data: store, updated_at: new Date().toISOString() }, { onConflict: "id" });

      if (error) {
        console.error(`Supabase save failed: ${error.message}`);
        return { ok: false, error: error.message };
      } else {
        await supabase.from(BACKUP_TABLE).insert({ source: "server-write", data: store }).then(({ error: backupError }) => {
          if (backupError) console.warn(`Supabase backup insert skipped: ${backupError.message}`);
        });
      }
    }

    return { ok: true };
  }

  function status() {
    return {
      primary,
      supabase: Boolean(supabase),
      stateId: STATE_ID,
    };
  }

  return {
    init,
    read,
    write,
    status,
  };
}

module.exports = {
  createAppStorage,
};
