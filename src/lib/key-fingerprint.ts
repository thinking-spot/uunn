/**
 * Public-key fingerprint helpers for out-of-band verification (H8).
 *
 * A fingerprint is the SHA-256 of the canonical JWK form of a public key,
 * formatted as 16 colon-separated hex bytes (32 hex chars). Two members
 * comparing fingerprints over a trusted channel (in-person, phone call,
 * verified Signal message) can confirm their server-mediated public-key
 * exchange has not been tampered with by a hostile server.
 *
 * Without this layer, a hostile server can swap a member's stored
 * `public_key` with one whose private key the server holds; the rest of
 * the protocol then wraps union keys directly to the server. Fingerprint
 * verification gives admins (and members) a way to detect that swap.
 */

function canonicalize(jwk: JsonWebKey): string {
    // Sort keys deterministically so the same public key always produces
    // the same hash regardless of how the JWK was serialized upstream.
    const ordered: Record<string, unknown> = {};
    Object.keys(jwk).sort().forEach((k) => { ordered[k] = (jwk as Record<string, unknown>)[k]; });
    return JSON.stringify(ordered);
}

function bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a JWK public key and return a short fingerprint suitable for human
 * comparison. Uses the first 16 bytes of SHA-256(canonical(jwk)) — 128 bits
 * of collision resistance, well over what's needed for accidental clashes
 * in a small union and adequate against a moderately-resourced attacker
 * trying to brute-force a colliding key pair.
 */
export async function fingerprint(jwk: JsonWebKey): Promise<string> {
    const data = new TextEncoder().encode(canonicalize(jwk));
    const hashBuf = await crypto.subtle.digest('SHA-256', data);
    const bytes = new Uint8Array(hashBuf).slice(0, 16);
    const hex = bytesToHex(bytes);
    // Format: aa:bb:cc:dd:...
    return hex.match(/.{2}/g)!.join(':').toUpperCase();
}

/**
 * Same as `fingerprint`, but accepts the JWK as a JSON string (which is
 * the form stored in DB and most commonly available client-side).
 */
export async function fingerprintFromJson(jwkString: string | null | undefined): Promise<string | null> {
    if (!jwkString) return null;
    try {
        const jwk = JSON.parse(jwkString);
        return await fingerprint(jwk);
    } catch {
        return null;
    }
}
