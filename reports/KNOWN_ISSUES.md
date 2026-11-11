# 📋 Vrindopnisad 2.0 — Known Issues & Defect Registry

**Audit Date**: November 11, 2026  
**Auditor**: Senior QA Reliability Architect  

---

### ISSUE-01: URL Mutation during Background Pre-warming
- **Severity**: Critical
- **Domain**: `bhav.vrindopnishad.in`
- **Route**: `/` (Root landing)
- **Reproduction Steps**:
  1. Open a clean browser session to `https://bhav.vrindopnishad.in/`.
  2. Observe the browser address bar during the initial 500ms.
- **Expected Behavior**: Address bar remains `https://bhav.vrindopnishad.in/` on the Home Sanctuary.
- **Actual Behavior**: Address bar spontaneously altered to `https://bhav.vrindopnishad.in/?tab=padavali&pad=hit-chaurasi-01` or `?tab=granthas`.
- **Evidence**: Playwright E2E assertion failed: `Expected: "https://bhav.vrindopnishad.in/", Received: "https://bhav.vrindopnishad.in/?tab=padavali&pad=hit-chaurasi-01"`.
- **Root Cause**: `src/services/seoService.ts` executed `url.searchParams.set('tab', config.tab)` and `window.history.replaceState(...)` as an unrequested side effect of `updateSEO()`. Pre-warmed background reader components triggered this during boot.
- **Fix Recommendation / Implemented**: Removed `replaceState` from `seoService.ts`. Centralized routing in `App.tsx`'s `handleTabSwitch` and added a `popstate` listener.
- **Regression Test**: `tests/e2e/domain-integrity.spec.ts` (Test 1).
- **Status**: **RESOLVED** (Commit `ac11c92`).

---

### ISSUE-02: React 19 Client Hydration Mismatch (#418) on Path Domain
- **Severity**: High
- **Domain**: `path.vrindopnishad.in`
- **Route**: `/`
- **Reproduction Steps**:
  1. Open `https://path.vrindopnishad.in/` in Chrome or Safari.
  2. Inspect the DevTools console.
- **Expected Behavior**: Seamless client hydration with zero console warnings or errors.
- **Actual Behavior**: Minified React error #418: *"Hydration failed because the server-rendered HTML didn't match the client"*.
- **Evidence**: Browser console error logged in Playwright test: `Minified React error #418`.
- **Root Cause**: `dist/index.html` was generated for `smaran` tab. Client detected `host === 'path.vrindopnishad.in'` and immediately rendered `granthas`. `hydrateRoot()` threw error #418 trying to reconcile the mismatched trees.
- **Fix Recommendation / Implemented**: Updated `main.tsx` with a shell mismatch guard that mounts cleanly with `createRoot` when domain shells differ. Configured edge interceptor `functions/[[path]].ts` to serve `/granthas.html` for root visits to `path.vrindopnishad.in`.
- **Regression Test**: `tests/e2e/smoke.spec.ts` (Test 2).
- **Status**: **RESOLVED** (Commit `ac11c92`).

---

### ISSUE-03: Empty Results & Author Filter Collision on Mobile Verse Selector
- **Severity**: High
- **Domain**: `bhav.vrindopnishad.in` / `path.vrindopnishad.in`
- **Route**: `/?tab=padavali&author=bhori-sakhi`
- **Reproduction Steps**:
  1. Open Padavali Reader.
  2. Select author "भोरी सखी (भोलानाथ जी)".
  3. Open the verse selector drawer.
- **Expected Behavior**: All 62 padas of Shri Bhori Sakhi appear in the selector list.
- **Actual Behavior**: Selector displays *"0 उपलब्ध"* and *"कोई परिणाम नहीं मिला"*.
- **Evidence**: User screenshot `media_1794372697371_c86f60bb.png`.
- **Root Cause**: `readerSearchQuery` in `App.tsx` was populated with the author's full display name, and the reader searched for that full name within verse titles.
- **Fix Recommendation / Implemented**: Decoupled `readerSearchQuery` from author selection; added `isRedundantAuthorQuery` defensive guard in `PadavaliReader.tsx` and explicit `loadingAuthor` state.
- **Regression Test**: `tests/e2e/path-padavali.spec.ts`.
- **Status**: **RESOLVED** (Commit `05e228b`).

---

### ISSUE-04: Mobile Reader Canvas Bottom Void
- **Severity**: Medium
- **Domain**: `bhav.vrindopnishad.in`
- **Route**: `/?tab=padavali`
- **Reproduction Steps**:
  1. Open any pad on mobile.
  2. Scroll to the bottom of the verse.
- **Expected Behavior**: Serene reading card with clear closure, colophon, and easy access to navigation controls.
- **Actual Behavior**: White card ended abruptly above a huge empty beige space without navigation controls or colophon.
- **Evidence**: User screenshot `media_1794369049828_9096412b.jpg`.
- **Root Cause**: Lack of `min-h-[calc(100vh-8rem)]` on `<article>`, absent colophon flourish, and narrow $90\text{px}$ `isNearBottom` scroll threshold.
- **Fix Recommendation / Implemented**: Added `min-h-[calc(100vh-8rem)]` to `<article>`, embedded sacred colophon (`॥ श्रीराधा ॥` / `॥ ॐ तत्सत् ॥`), added "Back to Top" and "Select Verse" action pills, and expanded scroll threshold to $240\text{px}$.
- **Regression Test**: `tests/e2e/mobile-navigation.spec.ts`.
- **Status**: **RESOLVED** (Commit `ac11c92`).

