# paylark-auth

Signs people in to the Paylark app and keeps them signed in.

Three auth servers (`auth-1`, `auth-2`, `auth-3`) sit behind one load
balancer, so any request can land on any of them. They share one session
store. Each server stamps its log lines with its own clock, in UTC.

## How a session works

1. Signing in starts a **session** and gives the app an **access token** and
   a **refresh token**.
2. Every API request carries the access token. It works for
   `accessTokenMinutes` (`src/config.js`).
3. Before it runs out, the app **refreshes**: it sends its refresh token and
   gets a new pair. A refresh token works **once**.
4. A session ends when it's signed out, when its user changes their password
   (every other session of theirs ends), when it's older than
   `sessionMaxDays`, when nobody has used it for `idleTimeoutMinutes`, or
   when the server decides something is wrong with a token.

The code is in `src/`: `sessions.js` (refresh, requests, ending a
session), `store.js` (the session store), `tokens.js`, `config.js`.

## The logs

`logs/auth-2026-10-21.jsonl` is every auth event from all three servers on
2026-10-21 (India time), one JSON object per line, in the order the
log collector received them.

| event | when | fields |
| --- | --- | --- |
| `session_started` | someone signs in | `session_id`, `user_id`, `device_id`, `ip`, `app_version` |
| `refreshed` | a refresh worked | `session_id`, `device_id`, `ip`, `refresh_token_used`, `refresh_token_issued`, `iat` |
| `api_request` | an API request passed | `session_id`, `device_id`, `path` |
| `password_changed` | a user changed their password | `user_id`, `device_id` |
| `store_full` | the session store reached its limit | `size` |
| `session_ended` | a session ended | `session_id`, `user_id`, `reason`, and the `device_id` / `ip` of the request that ended it; `refresh_token` when it was a refresh, `iat` and `token_issued_by` when it was a token |

Every line also has `ts` (the server's clock, UTC, to the millisecond) and
`server`. The app sends its version with every request; it's on
`session_started` and `refreshed` lines as `app_version`. Version
5.2.0 went out to Android users on the morning of the 21st.

Handy: `jq -c 'select(.event == "session_ended")' logs/auth-2026-10-21.jsonl`.
