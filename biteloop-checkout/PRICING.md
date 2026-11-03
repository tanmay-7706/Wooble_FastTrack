# Checkout pricing rules

The rules the checkout must follow. Finance and support work from this page;
if the code and this page disagree, this page is right.

Every amount is in **paise**, as a whole number (₹1 = 100 paise). Every time
is stored in **UTC**, but the rules are in **India time (IST, UTC+5:30)**.

1. **Subtotal**: each item's price times its quantity, added up.
2. **Coupon**: an order can carry one coupon code (`data/coupons.json`). It
   applies only if:
   - the subtotal is **at least** the coupon's `min_order_paise`, and
   - the order was placed **on or before** the coupon's `valid_until` date,
     **in India time** (the last day it works is that whole day, IST).

   Otherwise the order is charged as if it had no coupon.
3. **Discount**: a `flat` coupon takes off its `amount_paise` (never more
   than the subtotal). A `percent` coupon takes off that percent of the
   subtotal, rounded down to the paisa, and **never more than its
   `max_discount_paise`**.
4. **After discount**: subtotal minus discount. GST and free delivery are
   both worked out on this amount.
5. **GST**: 5% of the amount after discount, rounded to the
   **nearest** paisa (half a paisa rounds up), once per order.
6. **Delivery fee**: ₹35 (`delivery_fee_paise`), free when the amount
   after discount is at least ₹199 (`free_delivery_from_paise`).
7. **Late-night fee**: ₹25 (`late_night_fee_paise`) on an order placed from
   11:00 pm to 4:59 am, India time.
8. **Total**: after discount + GST + delivery fee + late-night fee.

A **cancelled** order is refunded in full, so it isn't part of the day's
takings.
