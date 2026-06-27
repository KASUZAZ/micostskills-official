const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const STATE_ID = process.env.APP_STATE_ID || "production";
const STATE_TABLE = process.env.SUPABASE_STATE_TABLE || "micostskills_app_state";
const BACKUP_TABLE = process.env.SUPABASE_BACKUP_TABLE || "micostskills_app_backups";

function parseFirebaseCredential() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    return JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8"));
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return {
      project_id: process.env.FIREBASE_PROJECT_ID,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  }

  return null;
}

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
  let firebaseCredential = null;
  let primary = "local-json";

  async function init() {
    cache = readLocalFile(dataFile, emptyStore);
    supabase = createSupabaseClient();
    firebaseCredential = parseFirebaseCredential();

    if (!supabase) return { primary, firebase: Boolean(firebaseCredential) };

    const { data, error } = await supabase
      .from(STATE_TABLE)
      .select("data")
      .eq("id", STATE_ID)
      .maybeSingle();

    if (error) {
      console.warn(`Supabase storage unavailable, using local JSON fallback: ${error.message}`);
      return { primary, firebase: Boolean(firebaseCredential) };
    }

    if (data?.data && Object.keys(data.data).length) {
      cache = { ...emptyStore(), ...data.data };
    } else {
      await supabase
        .from(STATE_TABLE)
        .upsert({ id: STATE_ID, data: cache, updated_at: new Date().toISOString() }, { onConflict: "id" });
    }

    primary = "supabase";
    return { primary, firebase: Boolean(firebaseCredential) };
  }

  function read() {
    return cache;
  }

  function write(store) {
    cache = { ...emptyStore(), ...store };
    writeLocalFile(dataFile, cache);
    void persistRemote(cache);
  }

  async function persistRemote(store) {
    if (supabase) {
      const { error } = await supabase
        .from(STATE_TABLE)
        .upsert({ id: STATE_ID, data: store, updated_at: new Date().toISOString() }, { onConflict: "id" });

      if (error) {
        console.error(`Supabase save failed: ${error.message}`);
      } else {
        await supabase.from(BACKUP_TABLE).insert({ source: "server-write", data: store }).then(({ error: backupError }) => {
          if (backupError) console.warn(`Supabase backup insert skipped: ${backupError.message}`);
        });
      }
    }

    if (firebaseCredential) {
      try {
        await mirrorToFirebase(firebaseCredential, store);
      } catch (error) {
        console.error(`Firebase mirror failed: ${error.message}`);
      }
    }
  }

  function status() {
    return {
      primary,
      supabase: Boolean(supabase),
      firebase: Boolean(firebaseCredential),
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

function base64Url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

async function getFirebaseAccessToken(credential) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: credential.client_email,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };
  const unsigned = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(claim))}`;
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(unsigned)
    .sign(credential.private_key, "base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error_description || data.error || "Firebase token request failed.");
  return data.access_token;
}

async function mirrorToFirebase(credential, store) {
  const projectId = credential.project_id || process.env.FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error("Firebase project_id tidak diset.");

  const accessToken = await getFirebaseAccessToken(credential);
  const documentPath = `projects/${projectId}/databases/(default)/documents/micostskills_app_state/${STATE_ID}`;
  const response = await fetch(`https://firestore.googleapis.com/v1/${documentPath}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        data_json: { stringValue: JSON.stringify(store) },
        updated_at: { timestampValue: new Date().toISOString() },
      },
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || "Firebase Firestore mirror failed.");
}

module.exports = {
  createAppStorage,
};
