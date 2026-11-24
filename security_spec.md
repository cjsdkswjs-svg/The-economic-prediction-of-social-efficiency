# Security Specification — 한빛정밀 시뮬레이션 (Firestore Rules)

## 1. Data Invariants
1. **Admin Isolation**: Only the verified administrator (`request.auth.token.email == 'cjsdkswjs@gmail.com'` with `request.auth.token.email_verified == true`) can `get`, `list`, or `delete` `/submissions/{submissionId}`. Booth visitors and unauthenticated users cannot read or scrape any participant records.
2. **Immutable Submissions**: Once created, `/submissions/{submissionId}` documents cannot be updated (`allow update: if false;`).
3. **Strict Schema & Bounds**: Every created submission must contain exact keys (`studentId`, `studentName`, `role`, `corporateScore`, `socialScore`, `combinedEfficiency`, `endingTitle`, `metrics`, `createdAt`) with bounded strings (`<= 20` / `<= 60`), numeric scores clamped to `[0, 100]`, exact 7-key `metrics` map (`Pd, Pf, E, C, D, A, S`), and server-enforced timestamp `createdAt == request.time`.
4. **Path Hardening**: All single-document operations (`get`, `create`, `delete`) enforce `isValidId(submissionId)` (`^[a-zA-Z0-9_\-]+$`, `size <= 128`).

## 2. The "Dirty Dozen" Payloads (Expected: `PERMISSION_DENIED`)
1. **Unauthenticated `list` scrape**: Unauthenticated client calls `getDocs(collection(db, 'submissions'))` -> DENIED (`isAdmin()` false).
2. **Non-admin Google user `list` scrape**: Authenticated user `other@gmail.com` (`email_verified: true`) reads `/submissions` -> DENIED.
3. **Unverified admin email spoof**: Authenticated user with `email: 'cjsdkswjs@gmail.com'` and `email_verified: false` reads `/submissions` -> DENIED.
4. **Ghost field injection (Shadow Create)**: Payload adds `"isAdmin": true` or `"verified": true` -> DENIED (`hasOnly` rejects).
5. **Client-forged timestamp**: Payload supplies `createdAt: "2020-01-01T00:00:00Z"` instead of `serverTimestamp()` -> DENIED (`createdAt == request.time` fails).
6. **Score tampering out of bounds**: Payload sends `combinedEfficiency: 999` or `corporateScore: -5` -> DENIED (`>= 0 && <= 100` fails).
7. **Missing required metric key**: `metrics` omits `'S'` -> DENIED (`hasAll` fails).
8. **Extra metric key**: `metrics` includes `'bonus': 50` -> DENIED (`hasOnly` fails).
9. **Oversized `studentName` DoS string**: `studentName` is 500 characters -> DENIED (`size() <= 20` fails).
10. **Invalid `role` enum**: `role: "admin"` -> DENIED (`role in ['ceo', 'worker']` fails).
11. **Post-submit score update**: Visitor or admin attempts `updateDoc` on `/submissions/{id}` -> DENIED (`allow update: if false`).
12. **Non-admin `delete` vandalism**: Unauthenticated or non-admin user calls `deleteDoc` -> DENIED (`isAdmin()` false).
