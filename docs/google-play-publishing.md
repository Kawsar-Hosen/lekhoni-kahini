# Google Play Publishing — Lekhoni Kahini

> Order: only AFTER Galaxy Store is live.
> Binary: production **AAB** from current code (`eas build --profile production`).
> Package `com.lekhoni.kahini` · v1.1.0 (code 2) · targetSdk 36.

## 0. Ready materials
Same as Galaxy doc + below extras:
- Feature graphic **1024×500** JPG/PNG (required)
- Phone screenshots min 2 (max 8)
- Demo writer login `<demo-user> / <demo-pass>`
- Privacy URL `https://lekhoni-terms.pages.dev/privacy`
- Deletion URL `https://lekhoni-terms.pages.dev/delete`

## 1. Create app
- Play Console ($25 one-time) → Create app → `Lekhoni Kahini`, package `com.lekhoni.kahini`, **Free**, category **Books & Reference**

## 2. App integrity
- **Play App Signing: ON** (recommended, keep one keystore for both stores)

## 3. App bundle
- Upload the production AAB to **Internal testing** first

## 4. Store listing (add English (US) + Bengali translations)
- App name: `Lekhoni Kahini`
- Short description (max 80 chars):
  - EN: `Read & write Bengali stories, novels & poems. Offline, PDF books, free.`
  - BN: `বাংলা গল্প-উপন্যাস পড়ুন ও লিখুন। অফলাইন, PDF বই, ফ্রি।`
- Full description: Galaxy doc full description (EN block → English tab, BN block → Bengali tab)
- Category: Books & Reference · Tags: `bengali stories` `bangla golpo` `novels` `offline reading` `writer`
- Contact email: `lekhoni-kahini@xyteee.com`
- Graphics: icon 512×512, feature 1024×500, screenshots (min 2)

## 5. App content (every section)
- **Privacy policy:** `https://lekhoni-terms.pages.dev/privacy`
- **Ads:** `No, my app does not contain ads`
- **Content rating:** answer honestly — user-generated content (stories/comments): **Yes** · moderation in place: **Yes** · 15+ age gate: **Yes** · gambling/violence/sexual content: **No** (only what is true)
- **Target audience:** 15 and over · **News app:** No
- **Data safety:**
  - Collected: Name, Email, Device IDs (device UUID + push token), App activity (reading history/positions), Photos (avatars/covers), Files & docs (PDF books)
  - Shared: Expo (push delivery), Google (Sign-In), Cloudflare + Neon (hosting/database) — purposes: App functionality, Personalization, Account management
  - Security: encrypted in transit ✅
  - **Data deletion:** Yes — in-app (Writer Studio account delete + Settings → Delete server data) and web: `https://lekhoni-terms.pages.dev/delete`
- **App access:** `Guest mode covers all reading, no login needed. Writer demo — username: <demo-user>, password: <demo-pass>.`

## 6. Release
- Internal testing → install on your phone → smoke test (login, PDF publish, offline, notification)
- **Production → staged rollout 20% → hold → 100%**
- Release notes every release:
  - EN: `Initial release: Bengali stories & novels, offline downloads, PDF books, Writer Studio, and notifications.`
  - BN: `প্রথম রিলিজ: বাংলা গল্প-উপন্যাস, অফলাইন ডাউনলোড, PDF বই, রাইটার স্টুডিও ও নোটিফিকেশন।`

## Apply for production — answers (copy-paste)

**How did you recruit users for your closed test?**
> Recruited friends, family and Bengali reader community via WhatsApp and Telegram invite links. No paid testing provider used.

**How easy was it to recruit testers?**
> Easy

**Describe the engagement you received from testers during your closed test:**
> Testers used core features daily — reading books, episodes, offline downloads, search and Writer Studio publishing. Usage matches real readers; session length and retention consistent with expected production behavior.

**Provide a summary of the feedback that you received from testers:**
> Collected via WhatsApp group and direct messages. Feedback: reader UI polish, report reasons, offline stability. Fixed crashes, improved Bengali UI and offline downloads. Pre-launch report clean with no crashes or ANRs.
