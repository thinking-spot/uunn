# uunn

Secure, encrypted platform for worker organizing. Live at uunn.io.

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS 4, shadcn/ui (custom components in `src/components/ui/`)
- **Database:** Supabase (PostgreSQL) with Row-Level Security
- **Auth:** NextAuth 5 (credentials provider — username/password, no OAuth)
- **Crypto:** Web Crypto API — RSA-OAEP 2048-bit (key exchange), AES-GCM 256-bit (content), PBKDF2 (vault)
- **AI:** Google Gemini (server-side document drafting only)
- **Hosting:** Vercel (standalone output)

## Architecture

- **Zero-knowledge:** All message/document content is encrypted client-side before transmission. Server stores only ciphertext.
- **Pseudonymous:** No email required. Username + password only.
- **Route groups:** `(public)` for unauthenticated pages, `(protected)` for auth-required pages.
- **Server actions** in `src/lib/*-actions.ts` handle all mutations.
- **Client-side crypto wrappers** in `src/lib/client-actions/` encrypt before calling server actions.
- **Contexts:** `AuthContext` (user session), `UnionContext` (active union + list).

## Key Directories

```
src/app/(public)/          # Landing, login, about, privacy, security, education
src/app/(protected)/       # Dashboard, messages, votes, documents, members, unions, settings
src/components/ui/         # shadcn/ui components (note: Tabs.tsx uses capital T)
src/lib/                   # Server actions, crypto, validation, types
src/lib/client-actions/    # Client-side encryption wrappers
src/context/               # Auth and Union React contexts
migrations/                # Supabase SQL migrations (applied in order)
```

## Commands

- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run lint` — ESLint
- `npm test` — Run tests (Vitest)
- `npm run test:watch` — Tests in watch mode
- `npx tsc --noEmit` — Type check

## Monitoring

- **Sentry** for error tracking (production only). Config in `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`.
- Requires `NEXT_PUBLIC_SENTRY_DSN` env var. PII is stripped in `beforeSend`.
- Error boundaries in `global-error.tsx` and `(protected)/error.tsx` report to Sentry.

## Testing

- **Vitest** with tests in `src/__tests__/`
- `crypto.test.ts` — 20 tests covering key gen, encrypt/decrypt, wrapping, vault, invite escrow
- `validation.test.ts` — 12 tests covering Zod schemas
- `rate-limit.test.ts` — 5 tests covering sliding window rate limiter
- Test files are excluded from `tsconfig.json` (Vitest handles its own TS)

## CI/CD

- GitHub Actions workflow at `.github/workflows/ci.yml`
- Runs on push/PR to main: type check, lint, test, build

## Conventions

- Tabs component import: `@/components/ui/Tabs` (capital T)
- Toast notifications: use `sonner` (`toast.success()`, `toast.error()`)
- Date formatting: `date-fns`
- Validation: Zod schemas in `src/lib/validation.ts`
- Rate limiting: in-memory sliding window in `src/lib/rate-limit.ts`
