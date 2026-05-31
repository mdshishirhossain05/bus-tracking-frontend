# Branding & white-labeling for a new customer

The codebase is **not** multi-tenant SaaS today. To sell the platform to a
new university you give that customer their own backend deployment plus a
rebranded build of both mobile apps. This document captures every place
you need to touch.

## What you change per customer

### 1. Backend (one deploy per customer)

The Postgres schema has no `tenantId` / `organizationId` columns. The
isolation model is "one stack per customer":

- Spin up a fresh Postgres, Redis, and backend service (e.g. on Railway).
- Set env vars (`DATABASE_URL`, `REDIS_URL`, `JWT_*_SECRET`, etc.) per
  the README. Run `npx prisma migrate deploy`.
- Bootstrap an admin user (`npm run bootstrap:admin`).
- Hand the resulting API base URL to the mobile app build below.

There is no shared admin across customers. Each university's admin sees
only their own data — by virtue of running on their own database.

### 2. Mobile apps (both passenger + driver)

Touch points are the same for both apps:

| What | File | Field |
|---|---|---|
| App display name | `apps/{app}/app.json` + `apps/{app}/app.config.js` | `name`, `slug`, `scheme` |
| iOS bundle id | `apps/{app}/app.config.js` | `ios.bundleIdentifier` |
| Android package | `apps/{app}/app.config.js` | `android.package` |
| App icon | `apps/{app}/assets/icon.png` | replace the file |
| Adaptive icon | `apps/{app}/assets/android-icon-*.png` | replace the files |
| Adaptive bg color | `apps/{app}/app.json` | `android.adaptiveIcon.backgroundColor` |
| Backend URL | `apps/{app}/eas.json` (preview + production) | `env.EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_SOCKET_URL` |
| Maps key | `apps/{app}/eas.json` | `env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` |
| Onboarding copy | `apps/passenger/src/components/OnboardingScreen.tsx` (slides via i18n keys in `packages/shared/src/i18n/strings.ts`) | `onboarding.*` |
| EAS project id | `apps/{app}/app.json` | `extra.eas.projectId` (rotate when you fork an EAS project for the new customer) |

The primary color is in **one place**:

- `mobile/packages/shared/src/theme/tokens.ts` → `colors.primary`

Changing that one constant retints everything: the active button, the
status badges, the live bus marker, the language chip, etc.

### 3. Web admin (one deploy per customer)

- Vercel project per customer; set `NEXT_PUBLIC_API_BASE_URL` and
  `NEXT_PUBLIC_SOCKET_URL` to point at the matching backend.
- Brand text in the web app is per-component and not centralized. The
  word "UniBus" doesn't appear in the codebase, so rebranding is mostly
  swapping the favicon and any literal "University" text. Page titles
  inherit from the deployed env vars.

## What you do NOT change per customer

- Backend source code.
- Database schema.
- The mobile app source code outside the table above.
- The Prisma migrations.

A new customer is a deploy + a brand swap, not a fork.

## The "true SaaS" path (deferred)

If you ever want one platform serving many universities under one
deployment, the refactor is real engineering — roughly a few weeks of
work to:

- Add `organizationId` to User, Route, Bus, Trip, ServiceSchedule,
  Notification, StopSubscription, RouteVisit, OccupancyVote,
  ServiceAlert, FavoriteRoute, RouteVisit, and every Prisma model that
  carries per-customer data.
- Add a `tenantContext` middleware that resolves the org from the
  authenticated user (or subdomain) and scopes every query.
- Audit every service to ensure no cross-tenant query leak.
- Add an org-picker to the admin UI for super-admins to switch view.

For now, the per-customer-deploy path is faster to sell and ship.
