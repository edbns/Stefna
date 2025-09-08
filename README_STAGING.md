# Stefna Staging, Environments, and Mobile/Web Separation

## API Origins
- Production web origin: `https://stefna.xyz`
- Staging/dev origin (Netlify site URL): `https://stefna.netlify.app`
- Netlify Functions live at: `<origin>/.netlify/functions/<name>`

## Mobile App (Expo)
- Uses `EXPO_PUBLIC_API_URL` to set API origin per channel/build:
  - Dev/preview builds: set to `https://stefna.netlify.app`
  - Production builds: set to `https://stefna.xyz`
- Mobile config reads the variable in `src/config/environment.ts` and builds function URLs via `config.apiUrl(fn)`.
- Keep `READ_ONLY` true for production until parity and tests are green. Remove before launch.

## JWT and Claims
- Tokens include `platform` and `permissions`.
- Backend functions must enforce permissions for writes:
  - `user-settings`: only tokens with `canManageFeed` can modify `share_to_feed`.
  - Credits/generation/profile/likes: trust token `userId`; ignore any `userId` in body.

## Contract Tests (CI)
- Minimal tests should hit functions with:
  - Web token (with `canManageFeed`)
  - Mobile token (no special permissions)
- Verify expected 200/403 per endpoint and schema shape.

## Audit Logging
- Table `settings_audit_log` records changes to user settings.
- Extend similarly for critical write paths if needed.

## Local Dev Notes
- Netlify dev: `netlify dev` runs functions at `http://localhost:8888/.netlify/functions/*`.
- For device testing, set `EXPO_PUBLIC_API_URL` to your LAN IP: `http://<LAN_IP>:8888`.
