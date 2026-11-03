// Biteloop checkout: what an order costs. The rules are in PRICING.md.
// Every amount is in paise (₹1 = 100 paise), as whole numbers.

import { istDate, istHour } from "./time.js";

export const GST_PERCENT = 5;

export function subtotalOf(order, menu) {
  let subtotal = 0;
  for (const line of order.items) {
    const item = menu.find((m) => m.id === line.item_id);
    if (!item) throw new Error(`Unknown menu item ${line.item_id} on ${order.id}`);
    subtotal += item.price_paise * line.qty;
  }
  return subtotal;
}

// Whether a coupon can be used on this order at all.
export function couponIsValid(coupon, order, subtotal) {
  if (!coupon) return false;
  if (subtotal < coupon.min_order_paise) return false;
  if (istDate(order.placed_at) > coupon.valid_until) return false;
  return true;
}

// What a valid coupon takes off the subtotal.
export function discountOf(coupon, subtotal) {
  if (coupon.type === "flat") return Math.min(coupon.amount_paise, subtotal);
  const off = Math.floor((subtotal * coupon.percent) / 100);
  return Math.min(off, coupon.max_discount_paise);
}

export function gstOf(amount) {
  return Math.round((amount * GST_PERCENT) / 100);
}

export function deliveryFeeOf(subtotal, discount, config) {
  const basis = subtotal - discount;
  return basis >= config.free_delivery_from_paise ? 0 : config.delivery_fee_paise;
}

export function lateNightFeeOf(order, config) {
  const hour = istHour(order.placed_at);
  const lateNight = hour >= 23 || hour < 5;
  return lateNight ? config.late_night_fee_paise : 0;
}

export function quote(order, { menu, coupons, config }) {
  const subtotal = subtotalOf(order, menu);
  const coupon = coupons.find((c) => c.code === order.coupon) ?? null;
  const discount = couponIsValid(coupon, order, subtotal) ? discountOf(coupon, subtotal) : 0;
  const taxable = subtotal - discount;
  const gst = gstOf(taxable);
  const delivery = deliveryFeeOf(subtotal, discount, config);
  const lateNight = lateNightFeeOf(order, config);
  return { subtotal, discount, gst, delivery, lateNight, total: taxable + gst + delivery + lateNight };
}
