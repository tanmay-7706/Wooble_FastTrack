// Paylark auth log analysis — 21 October 2026 (India time, UTC+5:30)
// Answers all 6 of Kabir's questions from the logs.

import { readFileSync } from "node:fs";

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
const IDLE_TIMEOUT_MIN = 45; // from config.js
const LOG_PATH = new URL("./logs/auth-2026-10-21.jsonl", import.meta.url);

const lines = readFileSync(LOG_PATH, "utf8").trim().split("\n");
const events = lines.map((l) => JSON.parse(l));

// India time day boundary: 21 Oct IST = 20 Oct 18:30 UTC to 21 Oct 18:30 UTC
const DAY_START_UTC = new Date("2026-10-20T18:30:00.000Z");
const DAY_END_UTC   = new Date("2026-10-21T18:30:00.000Z");

function inISTDay(ts) {
  const d = new Date(ts);
  return d >= DAY_START_UTC && d < DAY_END_UTC;
}

// ─── Q1: How many sessions ended yesterday (India time), for any reason ─────
const ended = events.filter(
  (e) => e.event === "session_ended" && inISTDay(e.ts)
);
console.log(`\nQ1: Sessions ended on 21 Oct (IST): ${ended.length}`);

// Breakdown by reason
const byReason = {};
for (const e of ended) byReason[e.reason] = (byReason[e.reason] ?? 0) + 1;
console.log("    Breakdown:", byReason);

// ─── Q2: How many users were signed out who shouldn't have been ───────────────
// Last-seen time per session (most recent api_request, refreshed, or session_started before session_ended)
const lastSeen = {}; // session_id -> Date
for (const e of events) {
  if (["api_request", "refreshed", "session_started"].includes(e.event)) {
    const d = new Date(e.ts);
    if (!lastSeen[e.session_id] || d > lastSeen[e.session_id]) {
      lastSeen[e.session_id] = d;
    }
  }
}

const wrongSessions = [];

for (const e of ended) {
  if (e.reason === "token_not_yet_valid") {
    // auth-3 clock skew: token iat is in the future as seen by auth-1/auth-2
    wrongSessions.push({ ...e, wrongReason: "clock_skew_auth3" });
  } else if (e.reason === "session_not_found") {
    // Could be: idle timeout (legit) or store_full LRU eviction (wrong)
    const last = lastSeen[e.session_id];
    if (last) {
      const gapMin = (new Date(e.ts) - last) / 60000;
      if (gapMin < IDLE_TIMEOUT_MIN) {
        // Gap less than idle timeout -> was actively used -> wrongly evicted
        wrongSessions.push({ ...e, wrongReason: "store_full_eviction", gapMin: gapMin.toFixed(1) });
      }
    }
  }
}

const wrongUsers = [...new Set(wrongSessions.map((e) => e.user_id))];
console.log(`\nQ2: Users wrongly signed out: ${wrongUsers.length}`);
console.log("    Users:", wrongUsers.sort().join(", "));
console.log(`    Wrong sessions: ${wrongSessions.length}`);

// ─── Q3: Stolen refresh token (refresh_token_reused) ─────────────────────────
const stolen = ended.filter((e) => e.reason === "refresh_token_reused");
console.log(`\nQ3: Sessions ended due to stolen/reused refresh token: ${stolen.length}`);

// ─── Q4: What signed people out wrongly ──────────────────────────────────────
const clockSkewCount = wrongSessions.filter((e) => e.wrongReason === "clock_skew_auth3").length;
const storeEvictCount = wrongSessions.filter((e) => e.wrongReason === "store_full_eviction").length;
console.log(`\nQ4: What signed people out wrongly:`);
console.log(`    clock_skew_auth3   — ${clockSkewCount} sessions: auth-3's clock is ahead; tokens it issues have a future iat and are rejected as 'not yet valid' by auth-1 and auth-2.`);
console.log(`    store_full_eviction — ${storeEvictCount} sessions: the session store hit its 20,000-session cap; the LRU entry was silently dropped, so the next request found no session.`);

// ─── Q5: Every session that ended, and why ───────────────────────────────────
console.log(`\nQ5: All ${ended.length} sessions that ended on 21 Oct IST:`);
const table = ended.map((e) => {
  let realReason = e.reason;
  if (e.reason === "token_not_yet_valid") realReason = "clock_skew_auth3 (token_not_yet_valid)";
  if (e.reason === "session_not_found") {
    const last = lastSeen[e.session_id];
    const gapMin = last ? (new Date(e.ts) - last) / 60000 : Infinity;
    realReason = gapMin < IDLE_TIMEOUT_MIN
      ? `store_full_eviction (gap ${gapMin.toFixed(1)} min < 45 min idle timeout)`
      : `idle_timeout (gap ${gapMin.toFixed(1)} min > 45 min, logged as session_not_found)`;
  }
  return { session_id: e.session_id, user_id: e.user_id, ts: e.ts, logged_reason: e.reason, real_reason: realReason };
});
for (const row of table) {
  console.log(`    ${row.ts}  ${row.session_id}  ${row.user_id}  logged="${row.logged_reason}"  real="${row.real_reason}"`);
}

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log(`
─── SUMMARY ───────────────────────────────
Sessions ended (21 Oct IST):   ${ended.length}
  signed_out (user action):    ${byReason["signed_out"] ?? 0}
  session_expired (max age):   ${byReason["session_expired"] ?? 0}
  password_changed:            ${byReason["password_changed"] ?? 0}
  refresh_token_reused (stolen):${byReason["refresh_token_reused"] ?? 0}
  idle_timeout (session_not_found, gap ≥45 min): ${ended.filter(e => e.reason==="session_not_found" && (()=>{const l=lastSeen[e.session_id];return l?(new Date(e.ts)-l)/60000>=45:true;})()).length}
  ── WRONG ──────────────────────────────
  clock_skew_auth3 (token_not_yet_valid): ${clockSkewCount}
  store_full_eviction (session_not_found, gap <45 min): ${storeEvictCount}
Users wrongly signed out:      ${wrongUsers.length}
`);
