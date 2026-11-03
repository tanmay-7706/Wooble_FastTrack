// What ops asked for: how October is going with Trukvo.

import { loadEnv } from "./env.js";
import { fetchAllShipments } from "./sync.js";

loadEnv();
const shipments = await fetchAllShipments();

const delivered = shipments.filter((s) => s.status === "delivered");
const report = {
  shipments: shipments.length,
  delivered: delivered.length,
  deliveredFreight: delivered.reduce((sum, s) => sum + parseFloat(s.freight_amount), 0),
  rto: shipments.filter((s) => s.status === "rto").length,
  onTheRoad: shipments.filter((s) => s.status === "picked_up" || s.status === "in_transit").length,
};
console.log(JSON.stringify(report, null, 2));
