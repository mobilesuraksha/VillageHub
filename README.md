# VillageHub

A Progressive Web App for village communities to buy & sell, find jobs, discover local
shops and services, and stay updated with local news — built on vanilla HTML/CSS/JS
(no build step) and Firebase (Auth, Firestore, Storage, Hosting, Cloud Messaging).

> **Build status: in progress, built step-by-step.** This is not a finished 15-module
> app yet — see [What's built so far](#whats-built-so-far) vs [Roadmap](#roadmap) below
> before you assume a feature exists. Everything listed as "built" is real, working code;
> nothing is a stub.

---

## What's built so far

- **Full PWA shell**: installable manifest, combined offline + push service worker,
  offline fallback page, install-prompt banner (incl. manual iOS instructions)
- **Design system**: CSS custom properties for light/dark themes, full component
  library (buttons, cards, forms, modals, toasts, skeletons, badges)
- **Firebase integration layer**: config, Google-only auth with profile bootstrap,
  a generic Firestore data layer, Storage uploads with client-side WebP compression,
  and FCM token registration
- **Client-side router** (History API, not hash-based, so URLs stay clean and crawlable)
- **Home page**: fully wired to Firestore — search, categories, latest listings,
  popular shops, latest jobs, offers, and news, each with real skeleton/empty/error states
- **Security**: complete `firestore.rules` and `storage.rules` (ownership + role-based
  moderation, forced pending-review status on new content, no client-side privilege
  escalation) and all composite indexes the current queries need
- Every other nav/drawer destination (Buy & Sell, Shops, Jobs, Account, Offers, News,
  Services, Notifications, Help, Contact, Settings) resolves to a real, styled
  "coming soon" page — not a dead link, not a stub file — while it's being built out

## Roadmap

Next build steps, in order: **Buy & Sell** (categories, add/edit/delete listing,
multi-image upload, listing detail, WhatsApp/call/save/share/report) → **Shops**
(profile, gallery, reviews/ratings) → **Jobs** (posting, search, apply, employer
dashboard) → **Account** (profile, saved items, my listings/shops, notifications) →
**Offers / News / Services** full pages → **Admin Panel** (dashboard, users, approve/
reject, categories, reports, analytics, role management, banners).

---

## Project structure

```
villagehub/
├── firebase.json            Hosting/Firestore/Storage config + security headers
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
├── .firebaserc               <- put your Firebase project ID here
├── package.json
└── public/                   Everything in here is deployed as-is (static)
    ├── index.html             Static header/drawer/bottom-nav shell + SEO meta
    ├── manifest.json
    ├── firebase-messaging-sw.js   Combined offline-cache + FCM background SW
    ├── offline.html
    ├── robots.txt / sitemap.xml
    ├── assets/icons/          Generated app icons (see generate_icons.py in repo root)
    ├── assets/images/         placeholder.svg, og-image.png
    ├── css/                   variables → base → layout → components → animations
    └── js/
        ├── firebase/          firebase-config, auth/firestore/storage/messaging services
        ├── core/              router, state, theme, toast, modal, skeleton, lazy-load, seo, utils
        ├── components/        header, drawer, install-prompt, listing/shop/job/offer/news cards
        ├── pages/              home.js (more pages land here as they're built)
        └── main.js             entry point - wires everything together
```

---

## Setup

### 1. Create a Firebase project
1. Go to the [Firebase Console](https://console.firebase.google.com) → **Add project**.
2. Enable these products for the project: **Authentication** (Google sign-in provider),
   **Firestore Database** (production mode), **Storage**, **Cloud Messaging**.
3. Under **Project settings → General**, scroll to "Your apps" → add a **Web app** →
   copy the `firebaseConfig` object it gives you.
4. Under **Project settings → Cloud Messaging → Web configuration**, generate a
   **Web Push certificate (VAPID key)**.

### 2. Wire your config into the project
Replace the placeholder values in **both** of these files (they must match exactly):
- `public/js/firebase/firebase-config.js` — also paste your VAPID key into `VAPID_KEY`
- `public/firebase-messaging-sw.js` — duplicated here on purpose; service workers
  can't reliably import the main thread's ES modules in every browser yet

> These config values (apiKey, projectId, etc.) are a **public client identifier, not
> a secret** — it's normal and safe for them to ship in your deployed bundle. Real
> access control lives entirely in `firestore.rules` / `storage.rules`. For extra
> abuse-hardening once you're live, add [Firebase App Check](https://firebase.google.com/docs/app-check).

Then set your project ID in `.firebaserc`.

### 3. Seed the `categories` collection (optional but recommended)
The Buy & Sell categories are currently hard-coded in `public/js/pages/home.js`
(`CATEGORIES` array) so the app works with zero setup. Once the Admin Panel's
Category Management ships, you'll manage these from Firestore's `categories`
collection instead — the two are designed to line up 1:1 by `id`.

### 4. Local development
```bash
npm install -g firebase-tools   # if you don't have it already
firebase login
firebase use --add              # pick the project you created above
npm run dev                     # starts hosting+auth+firestore+storage emulators
```

### 5. Deploy
```bash
firebase deploy
# or deploy pieces individually:
npm run deploy:rules
npm run deploy:indexes
npm run deploy:hosting
```

**Before going live with Google Sign-In**, note that Google's OAuth consent screen
requires a published Privacy Policy URL — add real Privacy Policy / Terms pages
before launch; this project doesn't include legal copy since that has to come from you.

---

## Firestore schema

All 11 collections from the spec exist in the rules/indexes now; pages that read/write
most of them ship in upcoming steps. Core shapes used already:

| Collection | Key fields |
|---|---|
| `users/{uid}` | `displayName, email, photoURL, phone, role ('user'\|'moderator'\|'admin'), status ('active'\|'suspended'), location, verified, fcmTokens[], createdAt` |
| `listings/{id}` | `title, description, category, price, priceType, images[], location, sellerId, status ('pending'\|'approved'\|'rejected'\|'sold'), featured, createdAt` |
| `shops/{id}` | `name, ownerId, category, logo, banner, gallery[], rating, reviewCount, status, createdAt`; subcollection `reviews/{id}` |
| `jobs/{id}` | `title, companyName, employerId, category, type, salary{min,max,period}, location, status, createdAt`; subcollection `applications/{id}` |
| `offers/{id}` | `title, image, discount, type ('daily'\|'festival'\|'featured'), status ('active'\|...), createdAt` |
| `news/{id}` | `title, content, image, category ('local'\|'panchayat'\|'school'\|'electricity'\|'water'\|'events'), createdAt` |
| `services/{id}` | `name, category, phone, providerId, status, createdAt` |
| `categories/{id}` | `name, slug, icon, type, order, active` |
| `reports/{id}` | `targetType, targetId, reportedBy, reason, status, createdAt` |
| `notifications/{id}` | `userId, title, body, type, relatedId, read, createdAt` |
| `saved/{id}` | `userId, itemType, itemId, createdAt` |

All new `listings`/`shops`/`jobs`/`services` are forced to `status: 'pending'` at the
rules layer — an admin/moderator (`users/{uid}.role`) has to flip them to `'approved'`
before they're publicly visible. That moderation UI is part of the Admin Panel step.

---

## Design notes

- **Palette**: deep "banyan" green (`#146B4D`) + marigold gold (`#E29B26`) instead of a
  generic SaaS blue/teal — chosen for the village/Panchayat context rather than
  arbitrarily.
- **Type**: Baloo 2 (display, rounded vernacular-signage character) + Noto Sans (body,
  clean and multilingual-ready if you localize later) + Material Symbols Rounded (icons).
- **Brand mark**: a 6-spoke "hub" shape (see `generate_icons.py`) that doubles as an
  abstract banyan-tree/village-gathering-point motif — every coordinate is computed
  with `math.cos`/`math.sin` rather than hand-typed, so it's exact.
- Dark mode isn't a palette invert — it has its own tuned green-charcoal surfaces.

## Known limitations to be aware of

- **SPA SEO ceiling**: individual listing/shop/job pages are rendered client-side.
  Modern Googlebot executes JS and can index this, but for the best possible SEO on
  high-value public pages (listing/shop detail), consider adding a small Cloud
  Function that pre-renders those specific routes with the right meta tags for
  crawlers/social scrapers — flagging this now so it's a deliberate choice later,
  not a surprise.
- **Sending push notifications** *to* users requires a trusted server context
  (Cloud Functions or the Admin SDK) — the client code here only handles permission
  + token registration + displaying pushes. Nothing in this repo can send a push yet.
- `sitemap.xml` currently lists static routes only; once listings go live, generate a
  second sitemap from Firestore on a schedule (Cloud Function) rather than hand-editing it.
