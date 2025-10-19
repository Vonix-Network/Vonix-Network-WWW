# 🤖 AI: What’s Next

Guidance for the next AI assistant to continue work on Vonix Network.

---

## 🟩 Current Status

- **DB Init:** Unified and idempotent via `npm run db:init` (`src/db/init.ts`).
- **XP System:** Implemented and integrated in social + forum flows (`src/lib/xp-system.ts`).
- **Achievements:** Page live at `/achievements` (`src/app/(public)/achievements/page.tsx`).
- **Leaderboard:** New XP leaderboard ready at `src/app/(public)/leaderboard/xp-page.tsx` (not yet swapped into `page.tsx`).
- **Docs:** Added AI guide, quickstart, setup checklist, docs index.

---

## ⏩ Immediate Next Steps (High Impact)

- **[leaderboard] Replace old engagement leaderboard with XP leaderboard**
  - Rename `src/app/(public)/leaderboard/xp-page.tsx` → `page.tsx` (backup old file).
  - Validate UI and data loads correctly from `users.xp`.

- **[xp-ui] Add level-up notifications**
  - When `awardXP()` returns `leveledUp`, show a toast/modal.
  - Suggested: client-side toast via `sonner` or existing notification system.
  - Files to touch: `src/lib/xp-system.ts` (hook up return shape), UI surface in pages/components.

- **[auth/session] Daily login XP (streaks)**
  - Implement daily check and award in a server-entry point (e.g., initial session fetch) or a lightweight `GET /api/xp/daily` called on app load.
  - Update `daily_streaks` (already created) to track `current_streak`, `last_login_date`.
  - Add idempotency (only once per day per user).

---

## 🔧 Feature Polish (Medium Priority)

- **[friends] Award XP when a friend request is accepted**
  - Locate accept endpoint in `src/app/api/` (friend system), call `awardXP(userId, XP_REWARDS.FRIEND_REQUEST_ACCEPTED, 'friend_accepted', friendId)`.
  - Add achievement checks if applicable.

- **[forum] XP for replies and upvotes**
  - Replies: add XP in `src/app/api/forum/posts/[id]/replies/*` create route.
  - Upvotes (if exists): award to author on upvote received; ensure no self-award.

- **[profiles] Show XP badge + progress**
  - Add `XPBadge` and `XPProgressBar` to profile component/pages.
  - Surface total XP, level, and next-level progress.

- **[dashboard] XP card widget**
  - Add `XPCard` to dashboard (`src/app/(dashboard)/*`) to show progress and recent transactions.

---

## 🧱 Tech Debt / Consistency

- **Drizzle-only migrations**
  - Optionally port `src/db/add-*.ts` to Drizzle migration files to have a single migration system (current `db:init` is already clean/working).

- **API response consistency**
  - Ensure all endpoints follow `{ success, data, error }` pattern and proper status codes.

- **Validation coverage**
  - Confirm all POST/PATCH routes use `zod` `safeParse` with clear error messages.

---

## 🧪 Testing Plan

- **XP flows**
  - Post create => +15 XP
  - Comment create => +5 XP
  - Forum post => +20 XP
  - Like received (post) => +2 XP to author
  - Like received (comment) => +1 XP to author
  - Achievement unlock on first post

- **UI**
  - `/achievements` renders and groups properly.
  - `/leaderboard` shows XP rankings once replaced.

- **DB**
  - `users` includes `xp`, `level`, `title`.
  - XP tables seeded: `achievements` (10), `level_rewards` (6).

---

## 📂 Key Files & Endpoints

- **XP Engine:** `src/lib/xp-system.ts`
- **DB Init:** `src/db/init.ts`
- **Schema:** `src/db/schema.ts`
- **Achievements Page:** `src/app/(public)/achievements/page.tsx`
- **Leaderboard (new):** `src/app/(public)/leaderboard/xp-page.tsx`
- **Social Comment Like XP:** `src/app/api/social/comments/[id]/like/route.ts`
- **Social Comment Create XP:** `src/app/api/social/posts/[id]/comments/route.ts`
- **Forum Post XP:** `src/app/api/forum/posts/route.ts`

---

## 🧭 Patterns & Guardrails (AI)

- **Database**
  - Use `db` (Drizzle) for typed queries; `client.execute()` for raw SQL.
  - Always `parseInt(session.user.id)` before use as number.
  - Never use `db.run()`/`db.all()` (not supported with LibSQL).

- **API**
  - `export const dynamic = 'force-dynamic'` and `export const revalidate = 0` for routes that mutate state.
  - Use `zod.safeParse` and return 400 with details on validation failure.

- **XP**
  - Wrap `awardXP()` calls in try/catch; log errors; never block critical path if XP fails.
  - Avoid awarding XP to the acting user for self-actions (likes on own content, etc.).

- **UI**
  - Follow Tailwind patterns used project-wide (glass effect, borders, spacing), Lucide icons.

---

## 📑 Docs To Keep In Sync

- `AI_GUIDE.md` – update if patterns change
- `src/db/README.md` – add commands or workflow changes
- `docs/XP_INTEGRATION_GUIDE.md` – add new XP sources
- `README.md` – reflect major feature additions

---

## ✅ Definition of Done for Upcoming Items

- **Leaderboard swap**
  - Old `page.tsx` backed up
  - New XP leaderboard live at `/leaderboard`
  - Renders top users by `users.xp`, podium + list

- **Level-up notifications**
  - Toast/modal appears on `leveledUp`
  - Shows new level and title

- **Daily login XP**
  - Awarded once per day
  - `daily_streaks` updated
  - Idempotent and logged

---

## 📆 Suggested Order of Execution

1. Swap leaderboard to XP-based.
2. Level-up notifications.
3. Daily login XP + streaks.
4. Friend acceptance XP.
5. Forum reply/upvote XP.
6. Profile XP surfaces and dashboard card.

---

## 🆘 Quick Commands

```bash
npm run db:init        # Full DB setup
npm run db:studio      # Visual DB browser
npm run validate       # TS + ESLint + Prettier
npm run dev            # Start dev server
```

---

## 📣 Notes for the Next AI

- Prefer enhancing existing patterns over introducing new ones.
- Keep changes small, incremental, and documented.
- Ensure DB operations are idempotent and safe to re-run.
- Always add validation and error paths.
- Update docs when adding/removing features.
