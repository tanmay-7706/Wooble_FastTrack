// Every server writes JSON lines; a collector ships them to one file per day.

export function log(event, fields) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), server: process.env.SERVER_NAME, event, ...fields }));
}
