# Telegram Link Manager

A private Telegram-to-web bookmark library:
- Send a URL to your Telegram bot.
- The webhook fetches Open Graph metadata (title, description, image).
- A lightweight rules engine auto-assigns a category and tags.
- Supabase stores the link.
- A private email-magic-link dashboard lets you search, filter, and favorite saved links.

## Stack
Next.js 15 / TypeScript / Vercel / Supabase / Telegram Bot API.

## 1. Create Supabase project
1. Create a project at https://supabase.com.
2. Open SQL Editor and run `supabase/schema.sql`.
3. In Project Settings → API, copy Project URL, anon/public key, and service_role key.
4. In Authentication → URL Configuration, set Site URL to your Vercel URL. Add `https://YOUR-APP.vercel.app/auth/callback` to Redirect URLs. For local development add `http://localhost:3000/auth/callback`.
5. In Authentication → Providers, keep Email enabled. Magic link sign-in is used.

## 2. Create Telegram bot
1. Open Telegram and message `@BotFather`.
2. Run `/newbot`, follow the steps, and copy the bot token.
3. Get your numeric Telegram user ID from a trusted user-ID bot, or temporarily log `message.from.id` during setup. Put that ID in `TELEGRAM_ALLOWED_USER_IDS`. Do not use a username.
4. Keep the bot private. The webhook also checks the sender ID allowlist.

## 3. Configure environment
Copy `.env.example` to `.env.local` and fill:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only; never expose to browser)
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET` (32+ random characters; Telegram allows A-Z, a-z, 0-9, `_`, `-`)
- `TELEGRAM_ALLOWED_USER_IDS`
- `NEXT_PUBLIC_APP_URL` (for local webhook testing, use a public HTTPS tunnel)
- `NEXT_PUBLIC_OWNER_EMAIL` (same email inserted into `private_owner`)
- `WEBHOOK_SETUP_KEY` (random secret used to call the set-webhook endpoint)

Generate a webhook secret with e.g. `openssl rand -hex 32`.

## 4. Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000. Enter your email; click the magic link sent to your inbox.

Telegram needs a public HTTPS webhook. For local testing, expose localhost with a trusted tunnel (e.g. Cloudflare Tunnel or ngrok), then set `NEXT_PUBLIC_APP_URL` to that HTTPS URL and deploy/set webhook as below.

## 5. Deploy to Vercel
1. Push this folder to a private GitHub repository.
2. In Vercel, Add New → Project → import the repository.
3. Add all environment variables from `.env.example` in Project Settings → Environment Variables. Add an extra `WEBHOOK_SETUP_KEY` with a strong random value.
4. Deploy.
5. Set `NEXT_PUBLIC_APP_URL` to the actual production URL and redeploy if you changed it.
6. Set Supabase Auth Site URL and Redirect URL to the production URL.
7. Set the Telegram webhook by sending a POST request to:
```bash
curl -X POST "https://YOUR-APP.vercel.app/api/telegram/set-webhook" \
  -H "x-setup-key: YOUR_WEBHOOK_SETUP_KEY"
```
The setup route is protected by `WEBHOOK_SETUP_KEY`. Do not share this key.

## 6. Use it
Send a URL to your Telegram bot. It replies with the title, domain, category and tags. Open the Vercel URL, sign in with the allowed email, search/filter links and toggle favorites.

## Notes and limitations
- Auto-categorization is deterministic and local (domain/title/description keyword rules), not an LLM. Edit `lib/classify.ts` to tune categories and rules.
- Metadata extraction depends on the target site allowing server-side requests and exposing Open Graph/title tags. Some sites block automated fetches; the bot then stores the URL with the domain as its fallback title.
- This starter is intended for one private owner. Restrict Supabase Auth signups to your own email in Supabase settings / invite-only workflow. For a multi-user product, add an `owner_id` column and enforce per-user RLS.
- The webhook rejects obvious local/private hostnames before metadata fetching. For a public production service, use a hardened outbound-fetch proxy that also validates DNS results and every redirect to fully mitigate SSRF risks.
- Vercel serverless functions are request-driven, not always-on workers; Telegram webhooks are the right integration pattern.
