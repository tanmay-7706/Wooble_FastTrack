import { readFileSync } from "node:fs";
import { quote } from "./src/pricing.js";
const read = (n) => JSON.parse(readFileSync(new URL(`./data/${n}`, import.meta.url), "utf8"));
const catalogue = { menu: read("menu.json"), coupons: read("coupons.json"), config: read("config.json") };
const orders = read("orders.json").filter(o => o.status === "delivered");
let right = 0, over = 0, under = 0, wrong = 0;
for (const o of orders) {
  const r = quote(o, catalogue).total;
  right += r;
  const d = o.charged_paise - r;
  if (d > 0) over += d; else if (d < 0) under += -d;
  if (d !== 0) wrong++;
}
const rs = (p) => (p / 100).toFixed(2);
console.log({ delivered: orders.length, right_paise: right, over_paise: over, under_paise: under, wrong, right_rs: rs(right), over_rs: rs(over), under_rs: rs(under) });
