# Lekhoni Kahini — লেখনী কাহিনি

Bengali stories reading & writing app (ages 15+). Read novels, poems and episodes, download for offline, collect PDF books, and publish your own writing with Writer Studio. Free, no ads.

- **Package:** `com.lekhoni.kahini` · **Version:** 1.4.0 (versionCode 8)
- **Platform:** Current production: React Native (Expo SDK 54). Next redesign: Flutter (planned).
- **Backend:** Cloudflare Workers (`lekhoni-admin-api`) + Neon Postgres + R2
- **Status:** LIVE on Google Play (production access granted) + Galaxy Store
- **Privacy:** https://lekhoni-terms.pages.dev/privacy · **Deletion:** https://lekhoni-terms.pages.dev/delete

## Features
- Home, categories, episodes, search, notifications
- Book details, chapter reader (scroll/page, TTS, themes), PDF reader
- Library: downloads (offline), favorites, history, bookmarks
- Writer Studio: write/publish text + PDF stories, cover upload, dashboard, monetization progress
- Reader/writer accounts: email + code verification, Google Sign-In, forgot/reset
- Comments (moderated), likes, follows, reports, push notifications
- 3 languages (bn/en/hi), 10+ themes, dark mode

## Tech stack
| Layer | Tech |
|---|---|
| App (current) | React Native 0.81, Expo 54, TypeScript, AsyncStorage + SecureStore |
| App (next redesign) | Flutter (planned; same backend APIs and Play listing) |
| Backend | Cloudflare Workers (`lekhoni-admin-api`), Neon Postgres, R2 media |
| Admin panel | React + Vite (Cloudflare Pages, Access + secret protected) |
| Legal pages | Static HTML (Cloudflare Pages) |
| Push | Expo push notifications |
| Auth | Email + PBKDF2, 6-digit codes, JWT (30d), Google OAuth (server-verified) |

## Quick start
```bash
npm install
npx expo start --clear   # Dev Client build required (not Expo Go)
```

## Builds — current React Native app (EAS)
| Profile | Output | Command |
|---|---|---|
| development | dev-client APK | `eas build --profile development --platform android` |
| preview | APK (internal testing) | `eas build --profile preview --platform android` |
| production | **AAB** (store submission) | `eas build --profile production --platform android` |

Release config: `targetSdkVersion 36`, portrait only, `com.lekhoni.kahini`.

## Flutter redesign (planned)

The next major UI redesign will be a Flutter app. This is a framework rewrite, not a drop-in theme change; the React Native 1.4.0 build stays live until the Flutter build passes testing and is explicitly approved.

- **Same Play listing:** keep the `applicationId` / package name `com.lekhoni.kahini`. A new package name creates a new app, not an update.
- **Same signing key:** use the existing upload key / Play App Signing setup. A different key will reject the update unless the upload key is reset in Play Console.
- **Higher versionCode:** every upload must use a versionCode greater than the current production build (currently 8).
- **API contract unchanged:** keep the same Worker endpoints, auth/JWT flow, and request/response shapes. The app, website, and admin panel share this backend.
- **Re-implement platform features:** push, Google Sign-In, PDF/download, offline storage, TTS, deep links, notifications, and any billing/ads integrations.
- **Push caveat:** the current app uses Expo push. Flutter will normally use FCM; if the backend must keep its existing API surface, add a small push adapter instead of changing existing response contracts.
- **Local data:** React Native AsyncStorage/SecureStore data will not migrate automatically. Add a migration path only if users must keep local downloads, history, bookmarks, or settings.
- **Release path:** build a signed AAB with `flutter build appbundle --release`, test through Play internal testing, then use a staged production rollout on the same listing.
- **Approval gate:** do not bump versions, build a production AAB, or submit to Play without explicit user approval.

## Backend (`../LekhoniAdmin`)
```bash
npx wrangler deploy   # deploys lekhoni-admin-api
```
Required Worker secrets (set via `wrangler secret put <NAME>`, never commit values):
`DATABASE_URL`, `JWT_SECRET`, `ADMIN_SECRET`, `MAIL_WEBHOOK_URL`, `MAIL_WEBHOOK_SECRET`

## Admin panel
Deployed on Cloudflare Pages (`admin.xyteee.com`, behind Cloudflare Access). Login with `ADMIN_SECRET` (stored only in Worker secrets + password manager — never in code).

## Legal
- Terms source: `../LekhoniTerms/index.html`
- Privacy + deletion pages: `../LekhoniTerms/privacy.html`, `delete.html` → https://lekhoni-terms.pages.dev

## Publishing order
1. Galaxy Store (APK/AAB) → live
2. Google Play Store (production AAB, staged rollout)

## Versioning
- **Current React Native app:** bump `expo.version` + `android.versionCode` together for every store release.
- **Flutter redesign:** bump the `version` field in `pubspec.yaml` (versionName + build number) and keep the Android `versionCode` greater than the last Play release.

## Redesign rules (Play Store live app — be careful)
> Future AI: this app is in production. Mistakes reach real users. Read before redesigning.

1. **Dev Client only, never Expo Go** — native modules use static imports.
2. **Verify before changing**: run `npx tsc --noEmit`; test on a development
   build (`eas build --profile development`). Never ship untested UI to production.
3. **No approval = no build/submit**: never run `eas build --profile production`,
   `eas submit`, or version bumps without explicit user approval. EAS free builds
   are limited — check quota first.
4. **Secrets stay out of git**: `google-services.json`, `google-service-account.json`,
   `.env` values are gitignored. Keys only via EAS secrets / provider dashboards.
5. **Backend is shared** (`../LekhoniAdmin` worker): app + website + admin use the
   same API. Changing response shapes breaks all three — extend, don't rename.
6. **Theme system**: Maroon `#7B1E2B`, Gold `#C9972B`; fonts Tiro Bangla +
   Hind Siliguri (BN), Inter + Fraunces (EN). Keep dark mode + 10+ themes working.
7. **Animated API**: native driver only for `opacity`/`transform`.
8. Key dirs: `src/` (screens/components), `App.tsx` (nav root), `android/` (native),
   `docs/` (store publishing notes), `plugins/`, `patches/`.
9. Test matrix before any production build: cold start, login/signup/Google,
   reader (scroll/page/TTS), offline library, studio publish, notifications.
10. **Flutter rewrite:** preserve the package ID, signing key, API contracts, and
    Play listing; follow the Flutter redesign section above. Production
    build/submit only after explicit approval.
