---
name: DB tables migration
description: Drizzle ORM tables are NOT auto-created; must run db:push-force before the API works.
---

The project uses Drizzle ORM with drizzle-kit push (not traditional migrations). Tables are defined in `lib/db/src/schema/` but are NOT created automatically when the app starts.

**Command to create/sync all tables:**
```bash
cd lib/db && pnpm run push-force
# or from workspace root:
pnpm --filter @workspace/db run push-force
```

Tables that must exist for the app to function: `chats`, `summaries`, `quizzes`, `flashcards`, `notes`, `images`, `user_profiles`

**Why:** Without running this, the dashboard stats/activity endpoints return 500 errors because the tables don't exist in Supabase PostgreSQL.

**How to apply:** Run this after any schema change or when setting up a fresh environment.
