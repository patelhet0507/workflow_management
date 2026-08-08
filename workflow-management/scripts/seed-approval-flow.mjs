// One-shot seed: writes the default approval flow into Firestore `config/approval_flow`.
// Uses the firebase-tools stored refresh token to mint an access token, then
// pushes the doc via the Firestore REST API.
// Run: node scripts/seed-approval-flow.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const PROJECT_ID = "rental-module";
const CLIENT_ID = "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com";
const CLIENT_SECRET = "j9iVZfS8kkCEFUPaAeJV0sAi";

const stages = [
  { status: "booking_created", role: "KYC" },
  { status: "kyc_approved", role: "CRM" },
  { status: "crm_approved", role: "CSO" },
  { status: "cso_approved", role: "management" },
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

function fields(stages) {
  return {
    stages: {
      arrayValue: {
        values: stages.map((s) => ({
          mapValue: {
            fields: {
              status: { stringValue: s.status },
              role: { stringValue: s.role },
            },
          },
        })),
      },
    },
  };
}

const base = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/config`;

const token = await getAccessToken();
console.log(`seeding approval flow into ${PROJECT_ID}...`);

let res = await fetch(`${base}?documentId=approval_flow`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ fields: fields(stages) }),
});

if (res.status === 409) {
  // doc exists -> overwrite via PATCH
  res = await fetch(`${base}/approval_flow`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: fields(stages) }),
  });
  console.log("updated existing config/approval_flow");
} else if (res.ok) {
  console.log("created config/approval_flow");
}

if (!res.ok) throw new Error(`seed failed: ${res.status} ${await res.text()}`);
console.log("done");
