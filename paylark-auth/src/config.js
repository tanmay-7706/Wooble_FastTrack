// Paylark auth: the settings every auth server runs with.

export const config = {
  // An access token works for this long; the app refreshes it before then.
  accessTokenMinutes: 15,
  // A session nobody has used for this long is closed.
  idleTimeoutMinutes: 45,
  // No session lives longer than this, used or not.
  sessionMaxDays: 30,
  // How many sessions the shared session store holds.
  sessionStoreMax: 20000,
};
