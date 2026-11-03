// The checkout service, for trying a quote by hand:
//   npm start, then open http://localhost:3000/api/orders/<order id>/quote

import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { quote } from "./pricing.js";

const read = (name) => JSON.parse(readFileSync(new URL(`../data/${name}`, import.meta.url), "utf8"));
const catalogue = { menu: read("menu.json"), coupons: read("coupons.json"), config: read("config.json") };
const orders = read("orders.json");

const server = createServer((request, response) => {
  const send = (status, body) => {
    response.writeHead(status, { "Content-Type": "application/json" });
    response.end(JSON.stringify(body, null, 2));
  };
  const url = new URL(request.url, "http://localhost");
  if (url.pathname === "/health") return send(200, { ok: true });
  const match = url.pathname.match(/^\/api\/orders\/([^/]+)\/quote$/);
  if (request.method === "GET" && match) {
    const order = orders.find((o) => o.id === decodeURIComponent(match[1]));
    if (!order) return send(404, { error: "No such order" });
    return send(200, { order: order.id, charged_paise: order.charged_paise, quote: quote(order, catalogue) });
  }
  send(404, { error: "Not found" });
});

const port = Number(process.env.PORT ?? 3000);
server.listen(port, () => console.log(`Checkout listening on http://localhost:${port}`));
