// India Standard Time is UTC+5:30 all year. Every time Biteloop stores is UTC.

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

function inIndia(utc) {
  return new Date(Date.parse(utc) + IST_OFFSET_MS);
}

/** The calendar date in India, YYYY-MM-DD. */
export function istDate(utc) {
  return inIndia(utc).toISOString().slice(0, 10);
}

/** The hour of the day in India, 0 to 23. */
export function istHour(utc) {
  return inIndia(utc).getUTCHours();
}
