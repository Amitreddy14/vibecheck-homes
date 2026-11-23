# Runbook: Google sign-in setup

Sign-in is **Google only** (decision 2026-11-23). This sets up one Google OAuth client
used by local, staging and production, plus the matching Supabase settings.

## 1. Google Cloud: OAuth client

1. https://console.cloud.google.com → create a project `vibecheck-homes`.
2. **Google Auth Platform → Branding** (OAuth consent screen): app name `Vibecheck Homes`,
   support email = yours, audience **External**. Scopes: only the default
   `openid`, `email`, `profile` (no sensitive scopes, so no Google review needed).
3. **Audience:** while testing, add your own Google address under **Test users**.
   Publish the app (**In production**) before the beta so anyone can sign in.
4. **Clients → Create client → Web application**, name `vibecheck-web`.
   **Authorized redirect URIs**, add all three:
   - `http://127.0.0.1:54321/auth/v1/callback` (local)
   - `https://bozwowmkhhwzhystumic.supabase.co/auth/v1/callback` (staging)
   - `https://wkfhwuozmhjfytugfula.supabase.co/auth/v1/callback` (production)
5. Copy the **Client ID** and **Client secret**. The secret goes only into Supabase and
   `supabase/.env`: never into the repo, Vercel or chat.

## 2. Supabase (do it for staging AND production)

**Authentication → Sign In / Providers**

- **Google:** enable, paste Client ID + Client secret, save.
- **Email:** turn **off**. Otherwise anyone could create accounts through the API with an
  email and password, bypassing Google.

**Authentication → URL Configuration**

| Project    | Site URL                                     | Redirect URLs                                              |
| ---------- | -------------------------------------------- | ---------------------------------------------------------- |
| staging    | `https://vibecheck-homes-staging.vercel.app` | `https://vibecheck-homes-staging.vercel.app/auth/callback` |
| production | `https://vibecheck-homes.vercel.app`         | `https://vibecheck-homes.vercel.app/auth/callback`         |

Exact URLs only, no wildcards: Supabase refuses to send people anywhere not on this list.

## 3. Local

Create `supabase/.env` (git-ignored):

```
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=<client id>
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=<client secret>
```

Then `pnpm db:stop` and `pnpm db:start` so the auth service picks them up.

## Rotating the secret

Google Cloud → the client → add a new secret → update it in both Supabase projects and
`supabase/.env` → delete the old secret in Google Cloud.
