// One-shot seed: writes sample projects into Firestore `projects`.
// Uses the firebase-tools stored refresh token to mint an access token, then
// pushes each project via the Firestore REST API.
// Run: node scripts/seed-projects.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const PROJECT_ID = "rental-module";
const CLIENT_ID = "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com";
const CLIENT_SECRET = "j9iVZfS8kkCEFUPaAeJV0sAi";

const projects = [
  {
    name: "Emerald Towers",
    fields: [
      { name: "Tower", required: true },
      { name: "Floor", required: true },
      { name: "Car Park", required: true },
      { name: "Corner", required: false },
    ],
  },
  {
    name: "Azure Heights",
    fields: [
      { name: "Wing", required: true },
      { name: "Facing", required: false },
      { name: "Parking Level", required: false },
    ],
  },
  {
    name: "Maple Villas",
    fields: [
      { name: "Phase", required: true },
      { name: "Plot Facing", required: false },
    ],
  },
];

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

function fieldValue(field) {
  return {
    name: { stringValue: field.name },
    required: { booleanValue: !!field.required },
  };
}

const token = await getAccessToken();
console.log(`seeding ${projects.length} projects into ${PROJECT_ID}...`);
for (const p of projects) {
  const id = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/projects?documentId=${id}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          name: { stringValue: p.name },
          fields: {
            arrayValue: {
              values: p.fields.map((f) => ({ mapValue: { fields: fieldValue(f) } })),
            },
          },
          createdAt: { stringValue: new Date().toISOString() },
        },
      }),
    }
  );
  if (res.status === 409) {
    console.log(`skip (exists): ${p.name}`);
    continue;
  }
  if (!res.ok) throw new Error(`create ${p.name} failed: ${res.status} ${await res.text()}`);
  console.log(`created: ${p.name}`);
}
console.log("done");