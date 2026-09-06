# Play Console — Full Step-by-Step Publish Guide (Lekhoni Kahini)

> দেখে দেখে করো, top থেকে bottom order-এ। কোথাও আটকালে সেই section-এর নাম + screen-এর লেখা পাঠাও।
> Binary: production AAB (`eas build --profile production`) · Package `com.lekhoni.kahini` · v1.1.0 (code 3)

## Step 0 — Before you start (হাতের কাছে রাখো)
- Production AAB file (EAS build artifacts থেকে download)
- Icon 512×512 PNG · Feature graphic 1024×500 · Screenshots (min 2, portrait 1080×1920)
- Privacy URL: `https://lekhoni-terms.pages.dev/privacy`
- Deletion URL: `https://lekhoni-terms.pages.dev/delete`
- Support email: `lekhoni-kahini@xyteee.com`
- Demo writer login: username `<demo-user>` / password `<demo-pass>`

## Step 1 — Create app
Play Console → **Create app** → App name: `Lekhoni Kahini` → Default language: **English (US)** → App or game: **App** → **Free** → Developer Program Policies accept → Create.

## Step 2 — Store listing (Grow → Main store listing)
1. **Manage translations → Add language → Bengali** (English + Bengali দুটোতেই নিচেরটা ভরো)
2. App name: `Lekhoni Kahini`
3. Short description (80 chars):
   - EN: `Read & write Bengali stories, novels & poems. Offline, PDF books, free.`
   - BN: `বাংলা গল্প-উপন্যাস পড়ুন ও লিখুন। অফলাইন, PDF বই, ফ্রি।`
4. Full description: `docs/galaxy-store-publishing.md`-এর Full description (EN অংশ English-এ, BN অংশ Bengali-তে)
5. Graphics: icon + feature + screenshots upload
6. Category: **Books & Reference** · Tags: `bengali stories`, `bangla golpo`, `novels`, `offline reading`
7. Contact email: `lekhoni-kahini@xyteee.com` → **Save**

## Step 3 — App content (Policy → App content, এক এক করে ✅ করো)
1. **Privacy policy** → URL বসাও: `https://lekhoni-terms.pages.dev/privacy` → Save
2. **Ads** → *Does your app contain ads?* → **No** → Save
   (Advertising ID-এর checkbox এলে টিক দিও না — app কখনো AAID access করে না)
3. **Content rating** → Start questionnaire → IARC:
   - Violence: **Mild / Implied** (horror/thriller-এ বর্ণনামূলক — catalog-এর সবচেয়ে mature লেখা ধরে)
   - Sexual content: **Mild/Suggestive** (explicit থাকলে Strong — top বই scan করে নাও)
   - Language: **Mild** (comments-এ আসতে পারে)
   - Gambling / controlled substances / alcohol: **No**
   - User-generated content: **Yes** (stories + comments; moderation: **Yes**)
   - Location / personal-info sharing: **No**
   - Certificate এলে ID save রাখো → Save
4. **Target audience** → Age groups: **16–17** + **18 and over** (app gate 15+; 13-এর নিচে কাউকে target কোরো না) → Save
5. **News apps** → No → Save
6. **Data safety** → Start (নিচে exact answers):
   - **Collected data** (প্রত্যেকটায় purposes: **App functionality + Personalization + Account management**):
     - Personal info → **Name**, **Email address**
     - Device or other IDs → **Device or other IDs** (device UUID, push token)
     - App activity → **App interactions** (reading history/positions), **In-app search history**
     - Photos and videos → **Photos** (avatars, covers)
     - Files and docs → **Files and docs** (PDF books)
   - **Shared with third parties** (একই purposes):
     - Device IDs → Expo (push delivery)
     - Name + Email → Google (Sign-In, user বেছে নিলে)
     - Photos/Files/Name/Email → Cloudflare + Neon (hosting/database)
   - **Security**: Encrypted in transit → **Yes** · Deletion → **Yes, in-app + web** (`https://lekhoni-terms.pages.dev/delete`)
   - Review → Submit
7. **App access** → *All or some functionality restricted?* → **Some restricted (writer login)** →
   Sign-in instructions (paste):
   > Core reading (Home, Details, Reader, Library, Episodes, Search) works in guest mode — no login needed. Writer demo: tap Writer → Login — Username: `<demo-user>`, Password: `<demo-pass>`. No 2FA.
   Other info box:
   > No VPN/region lock needed. First launch: confirm age gate (15+) + any display name. Language defaults Bengali (Menu → Settings → Language). No real-money/health features.

## Step 4 — App integrity & signing
- **App integrity → App signing**: Enroll with **Play-managed key** (recommended) → same keystore সব release-এ ব্যবহার হবে।

## Step 5 — Upload + release
1. **Testing → Internal testing** → New release → production AAB upload → testers-এ নিজের Gmail → **Save → Review → Rollout**
2. নিজের phone-এ install → smoke test: guest reading, login, PDF publish, offline, notification, Settings delete-data
3. **Production → New release** → AAB → Release notes:
   - EN: `Initial Play release: Bengali stories & novels, offline downloads, PDF books, Writer Studio, and notifications.`
   - BN: `প্রথম প্লে রিলিজ: বাংলা গল্প-উপন্যাস, অফলাইন ডাউনলোড, PDF বই, রাইটার স্টুডিও ও নোটিফিকেশন।`
4. **Staged rollout 20%** → 48h observe (Crashes/ANRs দেখো) → **100%**
5. Managed publishing ON রাখো (review pass হলেও release তোমার হাতে)

## Jodi warning/error আসে
- Deobfuscation-file warning → informational, acknowledge করে এগোও (R8 off, কিছু upload করার নেই)
- Target API / signing / versionCode error → exact লেখা পাঠাও, ঠিক করে দেবো
