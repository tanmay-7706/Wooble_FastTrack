# Wooble FastTrack — AI-enabled Full-Stack Developer (Founding Cohort)

This repository contains solutions, regression tests, analysis scripts, and fixed service integrations for the three **Wooble FastTrack Level 1** challenges:

---

## 1. [Biteloop Checkout Pricing](./biteloop-checkout/)
**Problem:** A food delivery checkout service charged incorrect totals on Monday orders due to divergences from `PRICING.md`.
- **Key Fixes in `src/pricing.js`:**
  1. `discountOf()`: Applied missing cap (`max_discount_paise`) for percentage discount coupons.
  2. `quote()`: Fixed GST base calculation to compute on amount after discount instead of subtotal.
  3. `deliveryFeeOf()`: Fixed free delivery threshold to evaluate on post-discount subtotal.
- **Verification:** 6/6 tests passing in `test/pricing.test.js`, and `analyse.js` reconciling all 146 delivered orders.

---

## 2. [Paylark Auth Log Analysis](./paylark-auth/)
**Problem:** Auth service investigation into why users were being logged out across 3 distributed servers (`auth-1`, `auth-2`, `auth-3`).
- **Key Findings in `logs/auth-2026-10-21.jsonl` (34 sessions ended):**
  1. **Clock Skew:** `auth-3`'s clock was ahead, generating access tokens with future `iat` timestamps that were rejected as `token_not_yet_valid` by `auth-1` and `auth-2` (9 sessions, 7 users).
  2. **Cache Eviction:** The shared session store reached its 20,000-session cap, silently evicting active sessions via LRU which caused subsequent requests to fail with `session_not_found` (4 sessions, 4 users).
  3. **Legitimate Endings:** 4 signed out, 4 max-age expired, 3 password changes, 8 idle timeouts (>45 min), and 2 stolen refresh tokens caught.
- **Script:** `node analyse.js` parses and classifies all events.

---

## 3. [Haulstack Trukvo Carrier Sync](./haulstack-trukvo-sync/)
**Problem:** Haulstack's sync job pulling carrier shipment events from Trukvo's REST API crashed and reported inaccurate figures to operations.
- **Root Causes:**
  1. API returned HTTP 429 (rate limits) and HTTP 503 (transient errors), which crashed unhandled fetches.
  2. Trukvo streams shipment state updates oldest-first (lifecycle: booked → picked_up → in_transit → delivered / rto). The un-deduplicated job treated every event as a separate shipment (2,229 rows vs 600 unique shipments) and summed obsolete freight amounts.
  3. The job broke on short pages rather than following `next_cursor` until null.
- **Key Fixes in `src/sync.js`:**
  - Implemented backoff and retry handling for HTTP 429 and 503 responses.
  - Paginated strictly using `next_cursor` until null.
  - Deduplicated shipments into a Map by shipment ID, preserving only the latest state and final freight amount.
- **Run:** `npm run report`

