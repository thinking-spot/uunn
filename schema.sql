-- Cloudflare D1 Database Schema for uunn
-- IMPORTANT: This database stores ONLY encrypted metadata
-- No sensitive data (messages, keys, identities) is stored here

-- Groups table (metadata only)
CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,              -- Encrypted group name
    description TEXT,                -- Encrypted description
    created_at INTEGER NOT NULL,
    created_by TEXT NOT NULL,        -- User ID (pseudonymous)
    member_count INTEGER DEFAULT 1,
    active BOOLEAN DEFAULT 1
);

-- Group members (for coordination, not identity)
CREATE TABLE IF NOT EXISTS group_members (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    user_id TEXT NOT NULL,           -- Pseudonymous user ID
    pseudonym TEXT NOT NULL,         -- Public pseudonym
    public_key TEXT NOT NULL,        -- For message encryption
    joined_at INTEGER NOT NULL,
    invited_by TEXT,                 -- User ID who invited
    role TEXT DEFAULT 'member',      -- 'admin' or 'member'
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);

-- Invitations (for tracking invite codes)
CREATE TABLE IF NOT EXISTS invitations (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    group_id TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT 1,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_invitations_code ON invitations(code);
CREATE INDEX IF NOT EXISTS idx_invitations_group ON invitations(group_id);

-- Message metadata (encrypted content not stored here)
-- This is only for synchronization between devices
CREATE TABLE IF NOT EXISTS message_metadata (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    encrypted_hash TEXT NOT NULL,    -- Hash of encrypted content for integrity
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_message_metadata_group ON message_metadata(group_id);
CREATE INDEX IF NOT EXISTS idx_message_metadata_timestamp ON message_metadata(timestamp);

-- Action metadata (proposals, petitions, etc.)
CREATE TABLE IF NOT EXISTS actions (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    type TEXT NOT NULL,              -- 'proposal', 'petition', 'grievance', 'demand'
    title TEXT NOT NULL,             -- Encrypted
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    deadline INTEGER,
    status TEXT DEFAULT 'active',    -- 'draft', 'active', 'closed', 'approved', 'rejected'
    encrypted_data TEXT,             -- Encrypted action details
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_actions_group ON actions(group_id);
CREATE INDEX IF NOT EXISTS idx_actions_status ON actions(status);

-- Votes (encrypted vote data)
CREATE TABLE IF NOT EXISTS votes (
    id TEXT PRIMARY KEY,
    action_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    encrypted_vote TEXT NOT NULL,    -- Encrypted vote content
    FOREIGN KEY (action_id) REFERENCES actions(id) ON DELETE CASCADE,
    UNIQUE(action_id, user_id)       -- One vote per user per action
);

CREATE INDEX IF NOT EXISTS idx_votes_action ON votes(action_id);

-- Sync log (for real-time updates)
CREATE TABLE IF NOT EXISTS sync_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id TEXT NOT NULL,
    event_type TEXT NOT NULL,        -- 'message', 'member', 'action', etc.
    event_data TEXT,                 -- Encrypted event data
    timestamp INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sync_log_group ON sync_log(group_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_timestamp ON sync_log(timestamp);

-- Privacy audit log (for transparency)
-- Logs only metadata access, never content
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,            -- 'group_created', 'member_joined', etc.
    timestamp INTEGER NOT NULL,
    metadata TEXT                    -- Non-sensitive metadata only
);

CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
