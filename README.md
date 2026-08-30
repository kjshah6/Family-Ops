# Family Roster

A private, shared schedule app for Nyra, Eve, and Jack's parents — sports, classes,
and pickup/drop-off, with Email sign-in link and Passkey login.

## What's inside
- Next.js (App Router)
- better-auth (Email magic link + Passkeys)
- Prisma + Postgres
- Resend (free tier) for sending sign-in emails
- Only emails on your `ALLOWED_PARENT_EMAILS` list can ever create an account

## 1. Push this code to GitHub
```
cd family-schedule-app
git init
git add .
git commit -m "Family roster app"
```
Create a new **private** repo on GitHub, then:
```
git remote add origin https://github.com/YOUR_USERNAME/family-roster.git
git push -u origin main
```

## 2. Create a free Postgres database (Neon)
1. Go to https://neon.tech, sign up free, create a project.
2. Copy the connection string it gives you — that's your `DATABASE_URL`.

## 3. Create a free Resend account (sends the sign-in emails)
1. Go to https://resend.com, sign up free (no credit card needed).
2. Copy your API key — that's your `RESEND_API_KEY`.
3. The default `onboarding@resend.dev` sender works immediately for testing;
   for a nicer "from" address later you can verify your own domain in Resend.

## 4. Deploy to Vercel
1. Go to https://vercel.com, sign up free, click "New Project," import your GitHub repo.
2. Add these Environment Variables (from `.env.example`):
   `DATABASE_URL`, `ALLOWED_PARENT_EMAILS`, `RESEND_API_KEY`,
   `PASSKEY_RP_ID` (your vercel domain, e.g. `family-roster.vercel.app`),
   `BETTER_AUTH_SECRET` (any random 32+ character string),
   `BETTER_AUTH_URL` (e.g. `https://family-roster.vercel.app`)
3. Click Deploy.

## 5. Set up the database tables
After the first deploy, run locally (pointed at your production `DATABASE_URL`):
```
npm install
npm run auth:generate   # adds better-auth's User/Session/Passkey tables to schema.prisma
npm run db:push         # creates all tables in Postgres
node prisma/seed.mjs    # creates the Nyra/Eve/Jack records
```

## 6. Sign in
Visit your Vercel URL. The first sign-in for each parent must be by email
(and their email must be in `ALLOWED_PARENT_EMAILS`). Once signed in, tap the
fingerprint icon in the header to register a passkey for fast sign-in after that.

## Notes
- To add or remove parents, just edit `ALLOWED_PARENT_EMAILS` in Vercel's project
  settings — no redeploy needed for env var changes to take effect on next request.
- Everything runs on free tiers (Vercel Hobby, Neon free tier, Resend free tier)
  for this scale of use — no annual developer fees required.
