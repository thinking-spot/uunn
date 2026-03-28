# uunn

Secure, end-to-end encrypted platform for worker organizing and coordination.

## Features

- **Encrypted Messaging** -- Real-time chat encrypted with AES-GCM. Messages are encrypted client-side before transmission; the server only stores ciphertext.
- **Encrypted Documents** -- Collaborative documents (demand letters, petitions, meeting notes) encrypted with the union's shared key.
- **Democratic Voting** -- Create polls, cast votes (yes/no/abstain), attach supporting documents. One vote per member enforced.
- **Union Management** -- Create and join unions with secure invite links. Manage members, roles, and settings.
- **Union Discovery** -- Search public unions by name or location. Request to join or propose alliances between unions.
- **Pseudonymous Auth** -- Username-based accounts with no email required. Private keys backed up via password-derived vault (PBKDF2).
- **Push Notifications** -- Web Push notifications for new messages via service worker.
- **AI Document Drafting** -- Generate formal documents (petitions, letters) with Gemini AI assistance.

## Security Model

- **RSA-OAEP (2048-bit)** for key exchange -- each user has a keypair; public key stored on server, private key in browser localStorage with encrypted vault backup.
- **AES-GCM (256-bit)** for content encryption -- each union has a shared key, wrapped with each member's public key.
- **PBKDF2 (100k iterations)** for vault protection -- private key backup encrypted with user's password.
- **Zero plaintext on server** -- messages and documents are encrypted/decrypted exclusively on the client.

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- **Backend:** Next.js Server Actions, Supabase (PostgreSQL + Realtime)
- **Crypto:** Web Crypto API (browser-native)
- **AI:** Google Gemini (server-side)
- **Auth:** NextAuth 5 (credentials provider)
- **Notifications:** Web Push API (VAPID)

## Getting Started

1. **Clone and install:**
   ```bash
   git clone <repo-url>
   cd uunn
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Supabase credentials, NextAuth secret, Gemini API key, and VAPID keys.

3. **Set up the database:**
   Run the migration files in `migrations/` against your Supabase project in order:
   - `0000_schema_v1_final.sql`
   - `0001_add_push_subscriptions.sql`
   - `0002_add_discovery_schema.sql`
   - `0003_fix_alliances.sql`
   - `0004_encrypt_documents.sql`

4. **Enable Realtime:**
   In Supabase Dashboard, enable Realtime on the `Messages` table.

5. **Run the dev server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
  app/              # Next.js App Router (pages and API routes)
    (protected)/    # Auth-required routes (dashboard, messages, votes, etc.)
    (public)/       # Public routes (landing, login, join, info pages)
  components/       # React components (UI, layout, auth)
  context/          # React Context (AuthContext, UnionContext)
  hooks/            # Custom hooks (useMessages, usePushNotifications)
  lib/              # Business logic
    actions.ts      # Auth server actions
    union-actions.ts    # Union/member/alliance server actions
    document-actions.ts # Document + AI server actions
    vote-actions.ts     # Voting server actions
    message-actions.ts  # Messaging server actions
    crypto.ts           # Web Crypto utilities (client-side)
    client-actions/     # Client wrappers with encryption layer
migrations/         # SQL migration files for Supabase
```
