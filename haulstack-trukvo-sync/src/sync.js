// Fetches every shipment from Trukvo, handling rate limits, transient errors, and updates.

const PAGE_SIZE = 50;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchAllShipments() {
  const latestShipments = new Map();
  let cursor = null;

  while (true) {
    const url = new URL(`${process.env.TRUKVO_API_URL}/shipments`);
    url.searchParams.set("limit", String(PAGE_SIZE));
    if (cursor) url.searchParams.set("cursor", cursor);

    let res;
    let attempts = 0;
    while (attempts < 10) {
      attempts++;
      try {
        res = await fetch(url, {
          headers: { Authorization: `Bearer ${process.env.TRUKVO_API_KEY}` },
        });

        if (res.status === 429) {
          const retryAfter = res.headers.get("retry-after");
          const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 1500;
          await sleep(waitMs);
          continue;
        }

        if (res.status === 503 || res.status >= 500) {
          await sleep(1000);
          continue;
        }

        break;
      } catch (err) {
        if (attempts >= 10) throw err;
        await sleep(1000);
      }
    }

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`API error ${res.status}: ${errBody}`);
    }

    const page = await res.json();
    for (const item of page.data || []) {
      // Trukvo streams shipments oldest change first.
      // Overwrite so that the map always holds the latest state of each shipment.
      latestShipments.set(item.id, item);
    }

    // Stop only when next_cursor is null / empty
    if (!page.next_cursor) break;
    cursor = page.next_cursor;

    // Small delay between successful requests to stay within fair use
    await sleep(80);
  }

  return Array.from(latestShipments.values());
}
