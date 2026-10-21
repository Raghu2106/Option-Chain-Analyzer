# Implementation Plan: 3 New Global News & Macro SEO Articles for NSE Option Chain Analyzer

Deliver 3 comprehensive, SEO-optimized, highly actionable trading and market research articles dated **October 21, 2026**, directly linking major global economic catalysts to open interest (OI) accumulation, Put-Call Ratio (PCR), and Implied Volatility (IV) on the National Stock Exchange of India (NSE).

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The user confirmed the editorial angle: **"Tactical guides linking global events to option chain OI"** with three primary global drivers:
> 1. **US Federal Reserve Policy & Dollar Index (DXY)**
> 2. **Brent Crude Oil Shocks & Geopolitical Risk**
> 3. **Nasdaq Tech Cues & Wall Street Earnings Spillovers**

- **Publication Date**: October 21, 2026 (matching current date).
- **Target Audience**: Indian derivatives traders, index option buyers/sellers (Nifty & Bank Nifty), and macro market participants seeking data-backed explanations of how overseas headlines manifest in domestic option chains.
- **Compliance**: Clear educational framing with SEBI regulatory disclaimers integrated into each article.

---

## 1. Overview & Core Concept

### What It Does
Enriches the educational and analytical research hub with three high-authority, long-form articles that capture organic search traffic from traders searching for global market cues and their specific impact on Indian option strikes:

1. **Article 1 (`fed-rate-policy-us-dollar-dxy-nifty-option-chain`)**:
   *Title*: "Fed Interest Rate Trajectory & US Dollar Surge: Reading FII Shifts on the Nifty Option Chain"
   *Focus*: How FOMC rate commentary, US 10-year Treasury yields, and DXY surges trigger Foreign Institutional Investor (FII) index futures unwinding and heavy OTM Call writing on Nifty 50 strikes.
2. **Article 2 (`crude-oil-shocks-geopolitical-risk-iv-skew-nse`)**:
   *Title*: "Crude Oil Price Shocks & Geopolitical Risk: Spotting Implied Volatility (IV) Skew on NSE Options"
   *Focus*: Why Brent crude spikes hit the Indian rupee and fiscal deficit, causing India VIX surges, sudden Put-side IV anomalies, and aggressive Put unwinding across Bank Nifty and Nifty strikes.
3. **Article 3 (`nasdaq-tech-earnings-wall-street-cues-nifty-opening-gaps`)**:
   *Title*: "Nasdaq Tech Earnings & Overnight Wall Street Cues: Navigating Opening Gaps on the NSE Option Chain"
   *Focus*: How overnight tech earnings (Nvidia, Apple, Microsoft) and Nasdaq swings create Gift Nifty gap openings, and how traders verify whether a gap will sustain or fade by inspecting 9:15–9:45 AM OI addition vs short-covering.

---

## 2. User Experience & Visual Design

### Visual Identity & Layout
- **Zero-Pill Metadata**: Article header metadata (Author, Date: October 21, 2026, Read Time: 8-10 min, Category) rendered as clean typography with subtle `·` separators, avoiding cluttered pill chips.
- **Readable Editorial Typography**: High-contrast, scannable headings with `text-wrap: balance`, structured tables comparing global catalyst vs. option chain signals, and key takeaway boxes.
- **Data Callouts**: Distinctive scenario tables demonstrating exact strike behavior (e.g., Call OI addition, PCR compression, IV skew shift).
- **Seamless Navigation**: In-app reader with back-to-blog and direct link to analyze live CSV data on the main analyzer tool.

---

## 3. SEO & Technical Architecture

### System Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                       Search Engines / Crawlers             │
└──────────────────────────────┬──────────────────────────────┘
                               │
               Static Pre-rendered HTML Pages
               (generate-routes.js + sitemap.xml)
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              Client-Side React SPA (src/App.tsx)            │
│  - syncRouteFromUrl() routes /blog/:articleId               │
│  - Updates document.title, meta description, og:url         │
│  - Injects Article Schema (JSON-LD structured data)         │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│          src/components/BlogSection.tsx                     │
│  - 3 New Comprehensive Article Entries                     │
│  - High-intent search keywords (H1, H2, H3 tags)            │
│  - Scenario tables, strike analysis & SEBI compliance       │
└─────────────────────────────────────────────────────────────┘
```

### Key Technical Details
1. **Content Repository (`src/components/BlogSection.tsx`)**:
   - Add all 3 new articles with full HTML/JSX bodies, complete key takeaways, tactical step-by-step checklists, and illustrative OI strike distribution matrices.
2. **Route Synchronization (`src/App.tsx`)**:
   - Register route metadata (Title, Description, Canonical URL) for the 3 new slugs in `syncRouteFromUrl` so client-side navigation dynamically updates title and meta tags.
3. **Pre-rendering & SEO (`generate-routes.js`)**:
   - Add routes and static HTML content to `generate-routes.js` so search engine crawlers receive full static HTML with JSON-LD schema on direct URL access.
4. **Sitemap (`public/sitemap.xml`)**:
   - Add `<url>` entries for the 3 new slugs with `<lastmod>2026-10-21</lastmod>` and priority `0.8`.

---

## 4. Verification Plan

### Automated Build & Lint
- Run `lint_applet` to confirm zero TypeScript compilation errors or missing imports.
- Run `compile_applet` (`npm run build`) to ensure the Vite build and `generate-routes.js` pre-render script execute successfully.

### Manual Verification
- Verify navigation to `/blog` lists all 3 new articles at the top with "October 21, 2026" publication dates.
- Verify clicking into each article opens the full long-form guide with intact formatting, tables, and back navigation.
- Verify metadata and social cards resolve properly for each slug.
