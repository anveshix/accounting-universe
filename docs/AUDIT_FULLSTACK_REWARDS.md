# Full-stack audit and rewards upgrade

## Findings (what I saw in the code)
| # | Finding | Severity | Status |
|---|---|---|---|
| 1 | No reward loop: progress was a text table and a list. Nothing told a learner "you just gained something". | High (retention) | Fixed: XP, levels, streak, daily goal, badges, toasts |
| 2 | Visualisation of progress was a table only; 60+ topics unreadable at a glance. | High | Fixed: mastery map, 14-day heat strip, level ring |
| 3 | One 1.1 MB JS bundle (Three.js and all labs load up front). Slow first load on phones. | High (perf) | Open: split labs and 3D with dynamic `import()` |
| 4 | Progress lives only in the browser: no cross-device streak or sync, and clearing site data loses everything. | Medium | Open: needs accounts and a backend |
| 5 | Notes "lock" is a UI gate; Pro text and files ship in the bundle. | High before charging | Open: server-side delivery, licence check (see NOTES_AUTHORING.md) |
| 6 | Rewards are client-side and derived from local events, so a student can edit an export or time to fake XP. Fine for self-motivation, wrong for a leaderboard or paid certificates. | Medium | Open: signed attempts if competitive features are added |
| 7 | Much source is dense one-line code (Prettier baseline), hard to review. | Medium | Open (ratchet already in place) |
| 8 | CI was written but never seen running on GitHub. | Medium | Open |
| 9 | AGENTS.md repeats paragraphs. | Low | Open |

## Reward design (all in `packages/curriculum/src/rewards.ts`, tested)
- XP = marks share (20) x mode (Beginner 1, Practice 1.5, Board 2) minus 2 per hint, +5 for a hint-free perfect score, +10 for fixing a skill after a mistake, +5 first time opening each lab tab. Integer maths only.
- Level n starts at 25 n (n-1) XP. Streak survives until the end of the day after the last active day. Daily goal 30 XP.
- Derived from stored attempts, so it cannot disagree with real work. Time on page earns nothing: the incentive is correctness, fewer hints and correcting mistakes, not clicking.
- Variable reward is milestone-based (badges, level-ups), not random loot.

## Next, in order
1. Code-split labs/3D (finding 3). 2. Spaced-repetition "review due" queue from mistakes, shown on the HUD. 3. Server and accounts for sync, Pro delivery and teacher class boards. 4. Hinglish text for toasts and badges.
