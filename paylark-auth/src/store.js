// The shared session store. All three auth servers read and write it.

import { config } from "./config.js";
import { log } from "./log.js";

const sessions = new Map(); // session id -> session, least recently used first

export function getSession(id, now) {
  const session = sessions.get(id);
  if (!session) return null;
  if (now - session.lastSeenAt > config.idleTimeoutMinutes * 60_000) {
    sessions.delete(id);
    return null;
  }
  // Move it to the back: most recently used.
  sessions.delete(id);
  sessions.set(id, session);
  return session;
}

export function saveSession(session) {
  sessions.delete(session.id);
  sessions.set(session.id, session);
  while (sessions.size > config.sessionStoreMax) {
    // Full: drop the least recently used session to make room.
    const oldest = sessions.keys().next().value;
    sessions.delete(oldest);
  }
  if (sessions.size === config.sessionStoreMax) log("store_full", { size: sessions.size });
}

export function deleteSession(id) {
  sessions.delete(id);
}
