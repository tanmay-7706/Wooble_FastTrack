// New tokens for a session, stamped with this server's clock.

import { randomBytes } from "node:crypto";
import { config } from "./config.js";

export function issueTokens(session, now) {
  const iat = Math.floor(now / 1000);
  return {
    iat,
    accessToken: { sid: session.id, iat, exp: iat + config.accessTokenMinutes * 60, issuer: process.env.SERVER_NAME, sig: "…" },
    refreshToken: `rt_${randomBytes(6).toString("hex")}`,
  };
}
