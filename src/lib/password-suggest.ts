/**
 * Generate a strong random password suitable for a uunn account.
 *
 * 16 characters drawn from an alphabet of 80 (uppercase, lowercase, digits,
 * and a small set of friendly symbols). Excludes visually-ambiguous
 * characters (0/O, 1/l/I) since users may need to write the password down.
 *
 * Entropy: 16 * log2(80) ≈ 101 bits. Comfortably above any brute-force
 * threshold even with full PBKDF2 acceleration.
 *
 * Rejection-samples crypto.getRandomValues to avoid modulo bias from
 * 256 % 80.
 */
export function suggestPassword(): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*?';
    const len = 16;
    const out: string[] = [];
    const buf = new Uint8Array(64);

    while (out.length < len) {
        crypto.getRandomValues(buf);
        for (let i = 0; i < buf.length && out.length < len; i++) {
            // Largest multiple of alphabet.length that fits in a byte:
            // bytes >= max are rejected to avoid modulo bias.
            const max = Math.floor(256 / alphabet.length) * alphabet.length;
            if (buf[i] >= max) continue;
            out.push(alphabet[buf[i] % alphabet.length]);
        }
    }
    return out.join('');
}
