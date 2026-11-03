// Signing and checking tokens. Every token carries iat: when it was issued,
// by the issuing server's clock, in seconds.

export class AuthError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

export function checkToken(token, nowSeconds) {
  if (!verifySignature(token)) throw new AuthError("bad_signature");
  if (token.iat > nowSeconds) throw new AuthError("token_not_yet_valid");
  if (token.exp <= nowSeconds) throw new AuthError("token_expired");
  return token;
}

function verifySignature(token) {
  return typeof token.sig === "string" && token.sig.length > 0;
}
