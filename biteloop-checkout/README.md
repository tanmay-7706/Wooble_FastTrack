# biteloop-checkout

What Biteloop charges for an order: the pricing behind the app's checkout.

You need Node.js 18 or later. There's nothing to install.

```
npm test         # the pricing tests
npm start        # the service, on http://localhost:3000
```

Then `http://localhost:3000/api/orders/<order id>/quote` shows what the code
would charge that order now, beside what the live checkout charged.

## What's here

| Path | What it is |
| --- | --- |
| `PRICING.md` | the rules the checkout must follow |
| `src/pricing.js` | the pricing: `quote(order, catalogue)` |
| `src/time.js` | India-time helpers |
| `src/server.js` | the service |
| `test/` | the tests |
| `data/menu.json` | the menu, prices in paise |
| `data/coupons.json` | the coupons |
| `data/config.json` | the fees |
| `data/orders.json` | every order placed on Monday 2026-10-19 (India time), with `charged_paise`: what the live checkout charged |
