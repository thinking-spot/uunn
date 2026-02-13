DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Unions;
DROP TABLE IF EXISTS Memberships;
DROP TABLE IF EXISTS Messages;
DROP TABLE IF EXISTS Votes;
DROP TABLE IF EXISTS Options;

CREATE TABLE Users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  public_key TEXT, -- User's public key for E2EE
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Unions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  shared_key_enc TEXT, -- Shared key encrypted with Creator's public key
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  creator_id TEXT NOT NULL,
  FOREIGN KEY (creator_id) REFERENCES Users(id)
);

CREATE TABLE Memberships (
  user_id TEXT NOT NULL,
  union_id TEXT NOT NULL,
  role TEXT DEFAULT 'member', -- 'admin', 'member'
  encrypted_shared_key TEXT, -- The union's shared key encrypted with THIS user's public key
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, union_id),
  FOREIGN KEY (user_id) REFERENCES Users(id),
  FOREIGN KEY (union_id) REFERENCES Unions(id)
);

CREATE TABLE Messages (
  id TEXT PRIMARY KEY,
  union_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  content_blob TEXT NOT NULL, -- Encrypted content (base64)
  iv TEXT NOT NULL, -- Initialization vector
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (union_id) REFERENCES Unions(id),
  FOREIGN KEY (sender_id) REFERENCES Users(id)
);

CREATE TABLE Votes (
  id TEXT PRIMARY KEY,
  union_id TEXT NOT NULL,
  title TEXT NOT NULL, -- Could be plaintext for listing
  description TEXT, -- Encryption optional depending on policy
  start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP,
  created_by TEXT,
  FOREIGN KEY (union_id) REFERENCES Unions(id),
  FOREIGN KEY (created_by) REFERENCES Users(id)
);
