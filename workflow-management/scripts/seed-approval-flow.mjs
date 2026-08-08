// One-shot seed: writes the default approval flow and booking form configuration.
// Uses the firebase-tools stored refresh token to mint an access token, then
// pushes the docs via the Firestore REST API.
// Run: node scripts/seed-approval-flow.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const PROJECT_ID = "rental-module";
const CLIENT_ID = "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com";
const CLIENT_SECRET = "j9iVZfS8kkCEFUPaAeJV0sAi";

const stages = [
  { status: "booking_completed", role: "sales" },
  { status: "unit_allocated", role: "sales" },
  { status: "cso_approved", role: "cso" },
  { status: "kyc_pending", role: "crm" },
  { status: "crm_approved", role: "crm" },
  { status: "management_approved", role: "management" },
  { status: "ats_approved", role: "documentation" },
  { status: "sale_deed_approved", role: "documentation" },
  { status: "print_requested", role: "crm_documentation" },
  { status: "documents_printed", role: "legal" },
  { status: "legal_verification_pending", role: "legal" },
  { status: "accounts_verification_pending", role: "accounts" },
  { status: "client_signature_pending", role: "crm_documentation" },
  { status: "executed", role: "legal_execution" },
  { status: "registration_completed", role: "legal_execution" },
  { status: "index_ii_received", role: "legal_execution" },
  { status: "document_scanned", role: "scan_verification" },
  { status: "sales_closed", role: "sales_closing" },
  { status: "archived", role: "admin" },
];

const bookingFields = [
  { key: "client_confirmation_date", label: "Client Confirmation Date", type: "date", required: true },
  { key: "onboarding_date", label: "Onboarding Date", type: "date", required: true },
  { key: "project_name", label: "Project Name", type: "text", required: true },
  { key: "unit_no", label: "Unit Number", type: "text", required: true },
  { key: "client_name", label: "Client Name", type: "text", required: true },
  { key: "sd_value", label: "SD Value", type: "number", required: true },
  { key: "payment_plan", label: "Payment Plan", type: "select", required: true, options: ["Full Payment", "Installment (6 months)", "Installment (12 months)", "Installment (24 months)", "Construction Linked"] },
  { key: "source_of_booking", label: "Source of Booking", type: "select", required: true, options: ["Walk-in", "Agent", "Referral", "Online", "Phone Inquiry", "Other"] },
  { key: "remarks", label: "Remark", type: "textarea", required: false },
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

function formFields(fields) {
  return {
    fields: {
      arrayValue: {
        values: fields.map((f) => {
          const fv = {
            key: { stringValue: f.key },
            label: { stringValue: f.label },
            type: { stringValue: f.type },
            required: { booleanValue: !!f.required },
          };
          if (f.options) {
            fv.options = { arrayValue: { values: f.options.map((o) => ({ stringValue: o })) } };
          }
          return { mapValue: { fields: fv } };
        }),
      },
    },
  };
}

async function writeDoc(token, docId, payload) {
  const base = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/config`;
  let res = await fetch(`${base}?documentId=${docId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: payload }),
  });
  if (res.status === 409) {
    res = await fetch(`${base}/${docId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fields: payload }),
    });
    console.log(`updated config/${docId}`);
  } else if (res.ok) {
    console.log(`created config/${docId}`);
  }
  if (!res.ok) throw new Error(`seed config/${docId} failed: ${res.status} ${await res.text()}`);
}

const token = await getAccessToken();
console.log(`seeding config into ${PROJECT_ID}...`);
await writeDoc(token, "approval_flow", fields(stages));
await writeDoc(token, "booking_form", formFields(bookingFields));
console.log("done");
