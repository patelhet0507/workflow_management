// One-shot: print Firestore collection sizes + booking status summary + user roles.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const PROJECT_ID = "rental-module";
const CLIENT_ID = "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com";
const CLIENT_SECRET = "j9iVZfS8kkCEFUPaAeJV0sAi";

const configPath = path.join(os.homedir(), ".config", "configstore", "firebase-tools.json");
const tokens = JSON.parse(fs.readFileSync(configPath, "utf8")).tokens;

async function getAccessToken() {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: tokens.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`token mint failed: ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}

async function list(token, collection) {
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}?pageSize=1000`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) {
    console.log(`${collection}: ERROR ${res.status}`);
    return [];
  }
  const data = await res.json();
  const docs = data.documents ?? [];
  return docs.map((d) => {
    const f = d.fields ?? {};
    const out = {};
    for (const [k, v] of Object.entries(f)) {
      out[k] = v.stringValue ?? v.integerValue ?? v.doubleValue ?? v.booleanValue ?? "";
    }
    return out;
  });
}

const token = await getAccessToken();
for (const c of ["bookings", "config", "users"]) {
  const rows = await list(token, c);
  if (c === "bookings") {
    const statuses = {};
    for (const r of rows) statuses[r.status ?? "(none)"] = (statuses[r.status ?? "(none)"] ?? 0) + 1;
    console.log(`bookings: ${rows.length} | byStatus=${JSON.stringify(statuses)}`);
  } else if (c === "config") {
    rows.forEach((r) => {
      const n = Array.isArray(r.stages) ? r.stages.length : 0;
      console.log(`config: ${r.id ?? r.name ?? "?"} (${n} stages)`);
    });
  } else if (c === "users") {
    rows.forEach((r) => console.log(`  user: ${r.email ?? "?"} role=${r.role ?? "(none)"}`));
  } else {
    console.log(`${c}: ${rows.length}`);
  }
}
