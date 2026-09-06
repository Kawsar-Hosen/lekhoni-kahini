# Lekhoni Kahini — লেখনী কাহিনি

Bengali stories reading & writing app (ages 15+). Read novels, poems and episodes, download for offline, collect PDF books, and publish your own writing with Writer Studio. Free, no ads.

- **Package:** `com.lekhoni.kahini` · **Version:** 1.1.0 (versionCode 2)
- **Platform:** React Native (Expo SDK 54) + Cloudflare Workers backend
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
| App | React Native 0.81, Expo 54, TypeScript, AsyncStorage + SecureStore |
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

## Builds (EAS)
| Profile | Output | Command |
|---|---|---|
| development | dev-client APK | `eas build --profile development --platform android` |
| preview | APK (internal testing) | `eas build --profile preview --platform android` |
| production | **AAB** (store submission) | `eas build --profile production --platform android` |

Release config: `targetSdkVersion 36`, portrait only, `com.lekhoni.kahini`.

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
Bump `expo.version` + `android.versionCode` together for every store release.
