// Arjun's tests for the pricing. They pass.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { quote } from "../src/pricing.js";

const read = (name) => JSON.parse(readFileSync(new URL(`../data/${name}`, import.meta.url), "utf8"));
const catalogue = { menu: read("menu.json"), coupons: read("coupons.json"), config: read("config.json") };

test("a big order delivers free", () => {
  const order = {"id":"TEST-1","placed_at":"2026-10-19T09:20:00Z","items":[{"item_id":"CHK-BRY","qty":1},{"item_id":"DAL-KHC","qty":1},{"item_id":"MNI-THL","qty":2}],"coupon":null};
  assert.equal(quote(order, catalogue).total, 84630);
});

test("a small order pays for delivery", () => {
  const order = {"id":"TEST-2","placed_at":"2026-10-19T07:15:00Z","items":[{"item_id":"ALO-PRT","qty":1}],"coupon":null};
  assert.equal(quote(order, catalogue).total, 18095);
});

test("an expired coupon takes nothing off", () => {
  const order = {"id":"TEST-3","placed_at":"2026-10-19T06:49:00Z","items":[{"item_id":"CHK-BRY","qty":1},{"item_id":"RAJ-CHW","qty":2}],"coupon":"FEST20"};
  assert.equal(quote(order, catalogue).total, 62685);
});

// Regression tests written from PRICING.md (added after the Monday 19 Oct incident).
test("percent coupon discount never exceeds max_discount_paise", () => {
  // subtotal 27900 + 24900 = 52800; 50% would be 26400, capped at 15000
  const order = { id: "R-1", placed_at: "2026-10-19T09:00:00Z", items: [{ item_id: "CHK-BRY", qty: 1 }, { item_id: "PNR-BTM", qty: 1 }], coupon: "WELCOME50" };
  assert.equal(quote(order, catalogue).discount, 15000);
});

test("GST is worked out on the amount after discount", () => {
  const order = { id: "R-2", placed_at: "2026-10-19T09:00:00Z", items: [{ item_id: "CHK-BRY", qty: 1 }, { item_id: "PNR-BTM", qty: 1 }], coupon: "WELCOME50" };
  const q = quote(order, catalogue);
  assert.equal(q.gst, Math.round((q.subtotal - q.discount) * 0.05));
});

test("free delivery is decided on the amount after discount", () => {
  // subtotal 27700 is over 19900, but after WELCOME50 (13850 off) it is 13850, so delivery is charged
  const order = { id: "R-3", placed_at: "2026-10-19T09:00:00Z", items: [{ item_id: "DAL-KHC", qty: 1 }, { item_id: "MSL-CHS", qty: 1 }, { item_id: "MNG-LSI", qty: 1 }], coupon: "WELCOME50" };
  assert.equal(quote(order, catalogue).delivery, 3500);
});
