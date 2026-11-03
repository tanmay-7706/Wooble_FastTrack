// Sessions: signing in, refreshing, and ending them.

import { config } from "./config.js";
import { getSession, saveSession, deleteSession } from "./store.js";
import { AuthError, checkToken } from "./tokens.js";
import { issueTokens } from "./issue.js";
import { log } from "./log.js";

const DAY = 24 * 60 * 60_000;

// The app calls this when its access token is about to run out.
export function refresh({ sessionId, refreshToken, deviceId, ip, now }) {
  const session = getSession(sessionId, now);
  if (!session) return end(sessionId, "session_not_found", { deviceId, ip });
  if (now - session.startedAt > config.sessionMaxDays * DAY) return end(sessionId, "session_expired", { deviceId, ip });

  if (refreshToken !== session.refreshToken) {
    // A refresh token works once. Seeing a used one again means someone
    // copied it: end the session so the copy is worthless.
    if (session.usedRefreshTokens.includes(refreshToken)) {
      return end(sessionId, "refresh_token_reused", { deviceId, ip, refresh_token: refreshToken });
    }
    return end(sessionId, "session_not_found", { deviceId, ip });
  }

  session.usedRefreshTokens.push(refreshToken);
  const tokens = issueTokens(session, now);
  session.refreshToken = tokens.refreshToken;
  session.lastSeenAt = now;
  saveSession(session);
  log("refreshed", { session_id: sessionId, refresh_token_used: refreshToken, refresh_token_issued: tokens.refreshToken, iat: tokens.iat });
  return tokens;
}

// Every API request comes through here with its access token.
export function authenticate({ sessionId, accessToken, deviceId, ip, now }) {
  const session = getSession(sessionId, now);
  if (!session) return end(sessionId, "session_not_found", { deviceId, ip });
  try {
    checkToken(accessToken, Math.floor(now / 1000));
  } catch (error) {
    if (error instanceof AuthError && error.code === "token_expired") return { refresh: true };
    // Anything else wrong with a token: treat it as forged and close the session.
    return end(sessionId, error.code, { deviceId, ip, iat: accessToken.iat, token_issued_by: accessToken.issuer });
  }
  session.lastSeenAt = now;
  saveSession(session);
  return session;
}

export function signOut(sessionId, deviceId, ip) {
  return end(sessionId, "signed_out", { deviceId, ip });
}

// Changing your password ends every other session you have.
export function endOtherSessions(userSessions, keepId) {
  for (const id of userSessions) if (id !== keepId) end(id, "password_changed", {});
}

function end(sessionId, reason, detail) {
  deleteSession(sessionId);
  log("session_ended", { session_id: sessionId, reason, ...detail });
  return { signedOut: true, reason };
}
