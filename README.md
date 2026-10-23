# nuumx AI Employee: landing page

A conversion-focused landing page built with [Astro](https://astro.build). Pages are plain HTML and CSS at build time; only the interactive parts (hero merge, lead form, analytics) ship small scripts, so the page stays fast on mobile networks.

## Run it

```bash
npm install
npm run dev       # local preview at http://localhost:4321
npm run build     # production build into dist/
npm run preview   # serve the production build locally
npx astro check   # type-check
```

Requires Node 22.23 or newer.

## Where things live

| Path | What it is |
|---|---|
| `src/config/site.ts` | Page text for meta tags, the menu links, and **lead settings** (form and call-me endpoints, WhatsApp number, booking link) |
| `src/pages/index.astro` | The home page: puts the sections together in order |
| `src/components/Header.astro` | Fixed frosted header with in-page links and "Book a free demo" |
| `src/components/hero/` | The hero: `Hero.astro` (layout), `ToolWindows.astro` (the five separate apps), `NuumxWindow.astro` (the merged nuumx window) |
| `src/components/replaces/WhatItReplaces.astro` | "What it replaces": a calm spec comparison table (Today in grey, With Riya in ink on one frosted strip); rows rise in once. Copy in `src/data/what-it-replaces.ts`, motion in `src/scripts/what-it-replaces.ts`, styles in `src/styles/replaces.css` (classes `wr-`) |
| `src/components/frees/Frees.astro` | "It doesn't replace your team. It frees them.": a dark interlude right after What it replaces; the busywork chips are pulled into Riya's glow, then the team's chips light up. Copy in `src/data/frees.ts`, motion in `src/scripts/frees.ts`, styles in `src/styles/frees.css` (classes `fr-`) |
| `src/components/helps/HowItHelps.astro` | "How it helps your business": the four gains as a tab list (hover with a 90 ms delay, click or arrow keys) with one glass panel and a sliding ink-bar indicator; an accordion on phones. Copy in `src/data/how-it-helps.ts`, behaviour in `src/scripts/how-it-helps.ts`, styles in `src/styles/helps.css` (classes `hb-`) |
| `src/components/testimonials/Testimonials.astro` | "Testimonials": a concave glass ribbon of client cards that loops continuously (hover or focus eases it to a stop; drag, flick or arrow keys move it), each with a result, a receipt of Riya's work and status chips; a flat drifting row on phones. Copy in `src/data/testimonials.ts` (**placeholder data: while `SAMPLE` is true the section only renders in dev, never in a production build**), motion in `src/scripts/testimonials.ts`, styles in `src/styles/testimonials.css` (classes `ts-`) |
| `src/components/industries/Industries.astro` | "Industries": one sentence that plays like a looping film, "Riya turns every [enquiry] into [outcome]", with Riya deleting and retyping the phrases on frosted tiles; a hairline timeline and a small pause button. Copy in `src/data/industries.ts`, motion in `src/scripts/industries.ts`, styles in `src/styles/industries.css` (classes `ind-`) |
| `src/components/closing/` | The page's end: `FinalCta.astro` (one dark frosted panel, "Book a free demo" highlighted, call and WhatsApp), `Faq.astro` (two columns, native `<details>` smoothed by `src/scripts/closing.ts`, with a "Still have a question?" card) and `Footer.astro` (links, contact, legal, social, faint wordmark). Copy in `src/data/final-cta.ts`, `src/data/faq.ts`, `src/data/footer.ts`; styles in `src/styles/closing.css` (classes `fc-`, `faq-`, `ft-`) |
| `src/components/how/` | "How it works": `HowItWorks.astro` (pinned on desktop: rolling clock, step text, one phone, progress line; a plain list on phones) and `PhoneScreen.astro` (the five phone screens). Copy in `src/data/how-it-works.ts`, motion in `src/scripts/how-it-works.ts`, styles in `src/styles/how.css` |
| `src/components/LeadDialog.astro` | The "Book a free demo" / "Get a call from Riya" form |
| `src/components/MobileBar.astro` | Sticky bottom bar on phones |
| `src/components/ComingNext.astro` | Temporary placeholder for the sections still being designed |
| `src/scripts/` | `hero-merge.ts` (scroll animation), `hero-trail.ts` (falling app tiles behind the cursor, desktop only), `leads.ts` (form logic), `analytics.ts` (events and campaign source) |
| `src/styles/` | `global.css` (design tokens, buttons), `hero.css` (hero and windows) |
| `src/assets/` | Images Astro optimises at build time (background, wordmark) |

## Connecting leads

In `src/config/site.ts`:

- `formEndpoint`: a URL that accepts a POST of the lead (Google Apps Script web app, CRM webhook, n8n, Zapier). Fields sent: `type, name, phone, company, source, page, submitted`.
- `callMeEndpoint`: a URL that makes Riya call the visitor (your voice platform's outbound-call hook).

While an endpoint is empty, that form hands the lead to WhatsApp with the details pre-filled, so a visitor is never told "we will call you" when nothing is connected.

## Analytics

Events are pushed to `window.dataLayer`: `cta_click` (with `cta`), `lead_form_open` (with `mode`) and `generate_lead` (with `mode`, `connected`). Add your Google Tag Manager snippet to `src/layouts/Base.astro` to receive them. UTM tags, `gclid` and `fbclid` are captured for the whole visit and sent with every lead.

## Animation

The site has **one scroll engine**: `src/scripts/motion/scroll.ts` sets up Lenis (smooth scroll) driven by GSAP's ticker, and keeps ScrollTrigger in sync. It starts on every page from `src/layouts/Base.astro`.

Rules for every section:

- Import `gsap` and `ScrollTrigger` **from `src/scripts/motion/scroll.ts`**, never directly from `gsap`, so there is only ever one Lenis instance and one clock.
- Put each section's animation in its own script and wrap it in `gsap.matchMedia()` with desktop, phone and `(prefers-reduced-motion: reduce)` conditions. Reduced motion must show a calm, final state. `gsap.matchMedia()` only runs the setup while at least one condition matches, so give every layout its own condition (for example both `pinned` and `stacked`).
- Animate only `transform` and `opacity`. Start continuous loops only while the section is on screen (a ScrollTrigger `onToggle` or IntersectionObserver), as `hero-merge.ts` does.
- Simple fade or slide reveals can use CSS scroll-driven animations (`animation-timeline: view()`) with no JavaScript.
- To pause page scrolling (dialogs, menus), dispatch `nx:scroll-lock` / `nx:scroll-unlock` on `window`. Give scrollable overlays `data-lenis-prevent`.
- Videos: compressed MP4/WebM with a poster image, `preload="none"`, loaded when the section approaches. For scroll-scrubbed video, encode with a keyframe on every frame (for example `ffmpeg -g 1`) or use an image sequence on canvas.

## Adding features later

- **Chatbot / voice widget:** add it as its own component and load it after the page is ready (for a framework component, `client:idle` or `client:visible`; for a vendor script, inject it on first interaction). It should never block the first view.
- **Framework components:** `npx astro add react` lets you drop React components into individual sections without slowing the rest of the page.

## Hosting

Deploy `dist/` to Vercel, Netlify or Cloudflare Pages. All three detect Astro automatically and redeploy on every push to the connected Git branch.

## Publishing (GitHub Pages)

This folder is published on its own as the public repository `Sompande1007/nuumx-ai-employee-site`
(https://sompande1007.github.io/nuumx-ai-employee-site/). Its workflow, `.github/workflows/pages.yml`, builds and
deploys on every push. To publish changes from the private project repository, run from the project root:

    git subtree push --prefix=website site main
