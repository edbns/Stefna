## Stefna Architecture Notes (Mobile ↔ Web Separation)

### Goals
- Prevent cross-platform interference (mobile vs web) on shared backend.
- Enforce strict API contracts with platform-aware JWTs and permissions.
- Keep environments clean: dev/staging separate from production.

### JWT & Auth
- Tokens include: `userId`, `email`, `platform` ('web' | 'mobile'), `permissions` (string[]).
- Issued by `verify-otp.ts` based on Origin → adds platform & permissions.
- All write functions must:
  - Authenticate via `requireAuth`.
  - Trust `userId` from token only; ignore `userId` in request body.
  - Enforce permissions where applicable.

### Function Enforcement (implemented)
- `user-settings.ts`: feed toggle restricted to tokens with `canManageFeed`.
- `upload-agreement.ts`: fixes correct `user_id` usage from auth.
- `unified-generate-background.ts`: token-derived `userId`; rejects spoofed body `userId`.
- `credits-reserve.ts` / `credits-finalize.ts`: auth and ownership checks (finalize verifies ledger owner).
- `toggleLike.ts`: authenticated likes, scoped by user.
- `update-profile.ts`: authenticated profile upsert path (no creation here).

### Mobile App Config
- Centralized in `src/config/environment.ts`.
- `EXPO_PUBLIC_API_URL` controls origin per channel; URLs built via `config.apiUrl(fn)`.
- Temporary `READ_ONLY` guard prevents production writes until parity.

### Environments
- Production: `https://stefna.xyz`.
- Staging/Dev: Netlify site URL `https://stefna.netlify.app` (or branch subdomains).
- Functions: `<origin>/.netlify/functions/<name>`.

### Contract Testing (to add in CI)
- Test each critical function with web/mobile tokens:
  - Settings feed toggle: web allowed; mobile denied.
  - Credits reserve/finalize: valid flows and ownership checks.
  - Generation: insufficient credits path and successful reservation.

### Audit Logging
- `settings_audit_log` tracks user settings changes.
- Extend to credits ledger already in use for financial traceability.

### Notes
- Keep mobile & web repos separate; no sharing of frontend runtime code.
- Use `authenticatedFetch` on web; mobile passes token via headers.

