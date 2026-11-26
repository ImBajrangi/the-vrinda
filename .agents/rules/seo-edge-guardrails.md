---
trigger: model_decision
description: Enforce technical SEO invariants for Vite SPA + Cloudflare Pages Functions (HTMLRewriter, SSG prerender paths, React 19 hydration sync, legacy slug recovery, and 404/301 hygiene)
---

# SPA + Edge SSR SEO Guardrails

1. **Extensionless Pre-Render Paths (Cloudflare Pages `308 <-> 301` Prevention)**:
   - **Never** output static pre-rendered routes to nested `dist/<route>/index.html`. Cloudflare Pages' built-in pretty-URLs engine emits `HTTP 308 -> /<route>/`, which collides with the Edge Worker's trailing-slash normalization (`HTTP 301 -> /<route>`) in an infinite redirect loop.
   - **Always** write static pre-rendered HTML files as flat/extensionless `dist/<route>.html` (e.g., `dist/ritual/<slug>.html`, `dist/grantha/<id>.html`, `dist/sant/<slug>.html`, `dist/<guide>.html`), except the root homepage `dist/index.html`. Cloudflare Pages serves `.html` files directly at `/<route>` with `HTTP 200 OK` and zero redirects.

2. **Edge HTMLRewriter Route Parity**:
   - Every pre-rendered route, section index (`/rituals`, `/places`, `/stories`, `/biographies`), topical guide, and hub (`/ragas`, `/raga/:slug`, `/themes`, `/theme/:slug`, `/glossary`, `/glossary/:term`) must have an explicit route matcher in `functions/[[path]].ts`.
   - Never allow static pre-rendered routes to fall through to the `default:` homepage branch in `HTMLRewriter` and overwrite `<title>`, `<meta name="description">`, or `<link rel="canonical">` with homepage defaults. Preserve pre-rendered `#root` markup where static SSG exists.

3. **Strict HTTP 404 & Guarded Legacy 301s**:
   - Never synthesize HTTP 200 boilerplate pages for unknown `/pad/*`, `/sant/*`, `/grantha/*`, `/ritual/*`, `/place/*`, or `/story/*` slugs; return `HTTP 404` with `X-Robots-Tag: noindex, nofollow`.
   - Always guard legacy `legacySlugRedirects.json` 301 redirects so an unresolvable target never redirects into a `404`. Normalize starter fallback IDs (`hit-chaurasi-01`, `radha-kripa-kataksha`, `kelimal-01`), trailing dots, and Devanagari/Roman consonant skeletons (`devNasalSkeleton`, `romanConsonantSkeleton`) into `padaAliases.json`.

4. **XML Fallback Body Inspection**:
   - Do not rely solely on `Content-Type` headers to detect missing `.xml` sitemaps when `_headers` forces `application/xml`; inspect the response body prefix (`<!doctype` / `<html`) and return `HTTP 404` (or `HTTP 301` for legacy `/sitemaps/*`).
   - Keep `scripts/generate-sitemap.js` and `public/sitemap-images.xml` 100% free of `301` or `404` URLs.

5. **React 19 Hydration & Zero-Flicker Sync (`#418` / `#419` Prevention)**:
   - Never render `React.lazy(...)` components inside the SSR-hydrated Home Sanctuary tree without passing an eager SSR component override in `src/entry-server.tsx` (`AppComponents`), preventing React Suspense abort markers (`<!--$!-->`, Error `#419`).
   - Guard `hydrateRoot()` strictly to static Home Sanctuary routes; query-routed views (`?tab=granthas`), deep section/pad routes, and secondary domains (`path.vrindopnishad.in`) must mount via `createRoot()` to prevent hydration tree mismatches (`#418`).
   - Dismiss `#seo-prerender` with `.remove()` on `requestAnimationFrame` once React mounts, and dismiss `#sanctuary-ssr-preview` only after resolved route data triggers `vrindopnishad:hydrated`. Never force-mount unvisited tabs with `display: none`.

6. **Canonical Internal `<a href>` Links & Domain Purity**:
   - Always render canonical path URLs (`/pad/:slug`, `/grantha/:id/:chapter`, `/ritual/:slug`, `/place/:slug`, `/bio/:slug`, `/story/:slug`) on `<a href>` attributes even when `onClick` handles SPA navigation.
   - Cross-domain recommendations rendered on `path.vrindopnishad.in` pointing to Bhav entities must use full `https://bhav.vrindopnishad.in/...` URLs rather than relative paths that trigger extra `301` hops.
   - **Domain Reservation Boundary**: `vrindopnishad.in` and `www.vrindopnishad.in` are strictly reserved for Vercel. Never attach them as Custom Domains to Cloudflare Pages `the-vrinda` or repoint their DNS away from Vercel; Cloudflare Pages `the-vrinda` serves **only** `bhav.vrindopnishad.in` and `path.vrindopnishad.in`.

7. **Responsive Playwright Verification Scope**:
   - When desktop views keep separate mobile headers (`lg:hidden`) earlier in DOM order, scope Playwright visibility assertions using `:visible` (or explicit landmark/role locators) so desktop tests never assert against hidden mobile elements.
