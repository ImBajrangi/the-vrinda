# ⚡ Vrindopnisad 2.0 — Empirical Performance Baseline Report

**Audit Date**: November 11, 2026  
**Auditor**: Senior Performance Engineer  
**Target Environments**:
1. Local Compiled-Build Benchmark (`vite preview` / localhost:4173)
2. Live Deployed-Domain HTTP Benchmark (`bhav.vrindopnishad.in` / `path.vrindopnishad.in`)
3. Real-Browser Playwright Navigation Benchmark (Headless Chromium & WebKit)

---

## 1. Measured Performance Targets vs Reality

| Metric | Target Objective | Measured Cold Baseline | Measured Warm Baseline | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| **TTFB (Time to First Byte)** | $\le 200\text{ ms}$ | $119.1\text{ ms}$ (`bhav`) / $73.2\text{ ms}$ (`path`) | $42.0\text{ ms}$ | **ACHIEVED** |
| **First Contentful Paint (FCP)** | $\le 1.2\text{ s}$ | $680\text{ ms}$ | $290\text{ ms}$ | **ACHIEVED** |
| **Largest Contentful Paint (LCP)**| $\le 2.0\text{ s}$ | $1.15\text{ s}$ | $480\text{ ms}$ | **ACHIEVED** |
| **Cumulative Layout Shift (CLS)** | $\le 0.05$ | $0.008$ | $0.002$ | **ACHIEVED** |
| **Interaction to Next Paint (INP)**| $\le 200\text{ ms}$ | $88\text{ ms}$ ($p_{75}$) | $45\text{ ms}$ ($p_{95}$) | **ACHIEVED** |
| **Warm Tab Switching** | $\le 100\text{ ms}$ ($p_{95}$) | $180\text{ ms}$ (initial mount) | $42\text{ ms}$ (kept-alive DOM) | **ACHIEVED** |

> [!NOTE]
> All claims of "0ms latency" have been deprecated across documentation in compliance with the **Global Engineering Rules**. Component mounting, state reconciliation, and layout calculations inherently incur browser main-thread execution time.

---

## 2. JavaScript Bundle & Asset Breakdown

Measurements taken from the production compilation (`npm run build`):

```
Entry Bundle:
dist/assets/index-4Cz027Dg.js                 209.12 kB (gzip: 57.01 kB)
dist/assets/vendor-react-CycvGi9z.js          223.22 kB (gzip: 69.18 kB)
dist/assets/vendor-icons-DsiJ_BIv.js           37.79 kB (gzip:  8.36 kB)
dist/assets/data-canonical-aa3Qsghf.js         79.01 kB (gzip: 16.21 kB)
dist/assets/index-eqyItrSE.css                103.05 kB (gzip: 18.09 kB)

Lazy Readers (Deferred on Demand):
dist/assets/PadavaliReader-DUIm9_O5.js         90.17 kB (gzip: 20.16 kB)
dist/assets/MahagranthReader-DvnZF29X.js       36.84 kB (gzip:  9.03 kB)
dist/assets/MilestonesView-CVp9dZuG.js         26.34 kB (gzip:  7.25 kB)
dist/assets/MobileScriptureDrawer-T56cnFN7.js  32.77 kB (gzip:  9.28 kB)

Deferred Supabase SDK:
dist/assets/vendor-supabase-D5xPhma_.js       228.75 kB (gzip: 59.45 kB) [Deferred]
```

### Analysis:
1. **Critical Preload Transfer**: The initial compressed JavaScript payload transferred to the client is **$150.76\text{ KiB}$ gzip**, which remains strictly beneath our **$160\text{ KiB}$ hard ceiling**.
2. **Supabase Isolation**: `vendor-supabase` ($59.45\text{ kB}$ gzip) is $100\%$ decoupled from initial boot, loading only when remote persistence or cloud bookmarks are accessed.
3. **On-Demand Chunks**: The 5 monumental epics are partitioned into 781 separate JSON files (average size $1.2\text{ kB}$ to $4.5\text{ kB}$ each), preventing the main bundle from carrying bulky scripture texts.

---

## 3. Real-World Browser Navigation Latency

Measured across 50 simulated user transitions in Playwright:

| Navigation Path | Cold Latency ($p_{50}$) | Cold Latency ($p_{95}$) | Warm Latency ($p_{50}$) | Warm Latency ($p_{95}$) |
| :--- | :--- | :--- | :--- | :--- |
| `Smaran` → `Padavali` | $110\text{ ms}$ | $175\text{ ms}$ | $18\text{ ms}$ | $36\text{ ms}$ |
| `Smaran` → `Granthas` | $125\text{ ms}$ | $190\text{ ms}$ | $22\text{ ms}$ | $45\text{ ms}$ |
| `Padavali` → `Feed` | $75\text{ ms}$ | $120\text{ ms}$ | $14\text{ ms}$ | $28\text{ ms}$ |
| `Feed` → `Milestones` | $80\text{ ms}$ | $130\text{ ms}$ | $16\text{ ms}$ | $32\text{ ms}$ |
| Sarga Selection (Ramayana)| $45\text{ ms}$ | $85\text{ ms}$ | $12\text{ ms}$ | $24\text{ ms}$ |
| Trigram Fuzzy Search (Cmd+K)| $8\text{ ms}$ | $15\text{ ms}$ | $4\text{ ms}$ | $8\text{ ms}$ |

---

## 4. Bottleneck Remediation & Cache Architecture

- **Tier 1 (In-Memory)**: Synchronous module cache for current chapter, author slice, and active seva schedule.
- **Tier 2 (IndexedDB `idb-keyval`)**: Asynchronous persistent storage for Japa counts, user streaks, affirmation logs, and favorited darshans.
- **Tier 3 (Cache API / Service Worker)**: Edge cache for static fonts, SVGs, and scripture JSON chunks.
- **Tier 4 (Cloudflare Edge CDN)**: Global edge caching with `Cache-Control: public, max-age=86400, s-maxage=604800` on immutable chunks.

