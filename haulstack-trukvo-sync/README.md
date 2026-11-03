# haulstack-trukvo-sync

Pulls our shipments from **Trukvo**, our biggest carrier partner, so ops can
see how October is going without logging in to Trukvo's portal.

You need Node.js 18 or later. There's nothing to install.

```
npm run report
```

reads `.env` (the API's address and our key), fetches every shipment, and
prints the numbers ops asked for.

## Trukvo's API (from their docs)

Base URL and key are in `.env`. Send the key on every request:

```
Authorization: Bearer <TRUKVO_API_KEY>
```

### GET /shipments

Our shipments booked from 1 to 21 October, oldest change first.

| Query | |
| --- | --- |
| `limit` | records per page, 1 to 100 (default 50) |
| `cursor` | `next_cursor` from the previous page; leave it out for the first page |

```json
{
  "data": [
    {
      "id": "TRK-7QK2M9A",
      "shipper_id": "SHP-4KD2",
      "origin": "Bhiwandi",
      "destination": "Pune",
      "status": "in_transit",
      "freight_amount": 18450.5,
      "currency": "INR",
      "updated_at": "2026-10-14T09:12:44.000Z"
    }
  ],
  "next_cursor": "c_1e"
}
```

`next_cursor` is `null` on the last page.

**status** is one of `booked`, `picked_up`, `in_transit`, `delivered`,
`rto` (returned to origin: the consignee didn't take it) or `cancelled`.
**freight_amount** is what we owe Trukvo for the shipment, in rupees.

Errors come back as `{ "error": "<code>", "message": "..." }` with an HTTP
status to match. Please stay within fair use.
