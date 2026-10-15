# Student Project Tracker — live cloud variant

This is the hands-on web app development cloud variant of the Student Project
Tracker. It uses Vercel to host the Express app and Supabase for PostgreSQL.
Unlike the SQLite version, this app stores shared demo records in a hosted
database.

## Local rehearsal

Requirements: Node.js 22 or later and npm.

1. Install the locked dependencies:

   ```powershell
   npm.cmd ci
   ```

2. Copy `.env.example` to `.env` in this folder. In `.env`, replace only the
   placeholder after `DATABASE_URL=` with your own Supabase PostgreSQL
   connection string. Keep `.env` private; do not put a real connection string
   in `.env.example`, source files, or browser code.
3. In the Supabase SQL Editor for your own project, run [`schema.sql`](./schema.sql)
   to create the `projects` table.
4. Start the local live variant:

   ```powershell
   npm.cmd start
   ```

   Open <http://localhost:3000>.

`DATABASE_URL` is a server-only setting. For deployment, add it to the Vercel
project's environment variables; do not expose it to the browser.

## Deploying your own copy

The hosted app is available at
<https://student-project-tracker-live-pi.vercel.app/>.

A Vercel project for this repository must use the repository root as its Root
Directory and deploy the Express app, not just the `public` folder as a static
site. Vercel's `app.js` entry point delegates to the same Express app used by
the local server. Use the Express framework preset (or automatic Express
detection), leave the Output Directory unset, and redeploy after changing these
settings. Check that `/api/health` returns JSON before using the app.

The existing deployment's Vercel and Supabase credentials and configuration
belong to its original deployer; they are not included here. A reader deploying
their own copy must create or use their own Vercel and Supabase projects, run
the schema in their own database, and configure their own `DATABASE_URL` in
Vercel. Do not expect the original deployer's credentials to work for your
copy.

## Data and sign-in

There is no sign-in. Everyone using the deployed app can work with the same
demo records, so do not enter private or sensitive information. Local SQLite
rows are not migrated to PostgreSQL; the PostgreSQL database starts with its
own records.

## Verified checks

- `npm.cmd start` started the local live variant.
- The local homepage returned HTTP 200.
- The local `/api/health` and `/api/projects` endpoints returned HTTP 200.
