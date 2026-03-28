// --- Rate Limits ---

export const RATE_LIMITS = {
    MESSAGES: { max: 30, windowMs: 60_000 },
    JOIN_REQUESTS: { max: 5, windowMs: 3_600_000 },
    ALLIANCE_REQUESTS: { max: 5, windowMs: 3_600_000 },
} as const;

// --- Status Values ---

export const ALLIANCE_STATUS = {
    PENDING: 'pending',
    ACTIVE: 'active',
} as const;

export const JOIN_REQUEST_STATUS = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
} as const;

export const VOTE_STATUS = {
    OPEN: 'open',
    CLOSED: 'closed',
} as const;

// --- Storage Keys ---

export const STORAGE_KEYS = {
    PRIVATE_KEY: 'uunn_private_key',
    PUBLIC_KEY: 'uunn_public_key',
} as const;

// --- Pagination ---

export const DEFAULT_MESSAGE_LIMIT = 50;
