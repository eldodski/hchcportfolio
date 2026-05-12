# HCHC UI FLOW MAP — 02: PUBLIC SITE
## Version: 1.1 | May 2026
## Scope: Public-facing marketing site — hero through closing CTA
## Format: Written flow spec + layout notes per section
## Audience: All visitors — unauthenticated
## Changes in v1.1: Replaced static Selected Work section with live Latest feed. Nav updated to reflect new section label.

---

## DESIGN PRINCIPLES FOR THIS FLOW

- Authority before explanation. The site must feel premium before it says anything.
- One page, seven sections. No buried subpages for the core pitch.
- Passive routing — visitors self-select their path without being interrogated.
- Image-first. Copy supports visuals, not the other way around.
- Every section has one job. No section tries to do two things.
- Builders and designers feel spoken to directly. Homeowners feel welcomed, not overwhelmed.

---

## NAVIGATION

**URL:** All public pages  
**Position:** Fixed top bar, full width  
**Job:** Minimal wayfinding. Never distract from the page content.

---

### Layout + Content

**Left:** HCHC wordmark (links to homepage)

**Center:** Four links only
- Latest
- Services
- For Professionals
- Contact

**Right:** "Sign In" (text link, subtle) + "Get Started" (small button, brand accent)

---

### Behavior Notes

- Nav is transparent over hero, transitions to solid on scroll
- On mobile: hamburger menu, full-screen overlay when opened
- "For Professionals" anchor-links to Section 5 on homepage OR routes to /tools if accessed from another page
- "Get Started" routes to /signup (Screen 01 of account setup flow)
- Active link state: subtle underline or accent color, not heavy
- No dropdowns, no mega menu — MVP keeps this flat

---

## SECTION 1 — HERO
**Anchor:** #hero  
**Job:** Establish authority instantly. Present two clear doors for routing.

---

### Written Flow

Full-bleed background image — high-end residential interior or Texas Hill Country exterior. Image is the first thing a visitor processes.

Overlaid, centered or left-aligned:

**Display headline (large):**
> "Design that sells. Systems that scale."

**Subheadline (smaller, secondary weight):**
> "Interior design strategy for builders, developers, and discerning homeowners across the Texas Hill Country."

**Two CTA buttons side by side:**
- Primary: "I Work in Building & Design →"
- Secondary: "I'm a Homeowner →"

Below buttons, one small line:
> "Currently accepting new clients and professional partnerships."

---

### Routing Logic

| CTA selected | Destination |
|---|---|
| "I Work in Building & Design" | Smooth scroll to Section 3 (Who We Work With) — professionals column |
| "I'm a Homeowner" | Smooth scroll to Section 3 — homeowner column, or anchor to contact/scheduler |

Both CTAs keep the user on the page first. Hard routing to signup happens later — after they've seen the work.

---

### Layout Notes

- Image: full viewport height on desktop, 70vh on mobile
- Overlay: subtle dark gradient from bottom-left to allow text legibility without killing the image
- Headline: large display font, white or near-white, left-aligned on desktop, centered on mobile
- Two buttons: side by side on desktop, stacked on mobile
- Primary button: solid brand accent fill. Secondary: ghost/outline style.
- No logo, no nav clutter in the hero itself — nav floats above it transparently
- Image selection priority: kitchen or living space with Hill Country material palette (warm stone, wood, clean lines)

---

## SECTION 2 — WHAT WE DO
**Anchor:** #services  
**Job:** Surface the three core services fast. Give each visitor a thread to pull.

---

### Written Flow

**Section label (small caps, above headline):**
> SERVICES

**Headline:**
> "Three ways we work together."

**Three tiles, left to right:**

---

**Tile 1 — Design Consultation**
*Icon or small image: warm residential interior*
> "Full-service interior design for new builds and renovations. Selections, presentations, and client-ready packages — start to finish."
Link: "Learn More →" (anchors to Section 5 or /services/consultation)

---

**Tile 2 — Finish Selections + Presentations**
*Icon or small image: material board or selection sheet*
> "Submit your plans. Receive a complete, client-ready design presentation within 72 hours. Human-reviewed. Accurate. Deliverable."
Link: "Learn More →" (anchors to Section 5 or /services/renders)

---

**Tile 3 — Presentation Engine**
*Icon or small image: clean presentation slide or dashboard UI*
> "A subscription tool for designers and builders. AI-assisted presentations generated at the touch of a button — with human review before every delivery."
Link: "Learn More →" (anchors to Section 5 or /tools)

---

### Layout Notes

- Three equal-width tiles in a row on desktop, stacked on mobile
- Each tile: top image or icon zone, title, descriptor text, text link at bottom
- Tile background: white or very light neutral — contrast against page background
- Section background: slightly off-white or warm light tone to separate from hero
- No buttons in this section — links only. CTAs come later.
- Tile border: subtle, minimal. Shadow or border-radius for card feel without being heavy.
- Section padding: generous top and bottom — breathing room matters here

---

## SECTION 3 — WHO WE WORK WITH
**Anchor:** #audience  
**Job:** Speak directly to each visitor type. Make every audience feel seen.

---

### Written Flow

**Section label:**
> WHO WE WORK WITH

**Headline:**
> "Built for the people who build."

**Three columns:**

---

**Column 1 — Builders & Developers**
*Small heading:* Builders & Developers
> "You need consistency, speed, and buyer satisfaction at scale. We bring design systems that reduce decision fatigue, accelerate selections, and give your buyers confidence before a single nail is driven."
> 
> What we deliver: finish selection packages, buyer-ready presentations, photorealistic renderings, and design systems that work across communities — not just one-off projects.

CTA: "See How We Work With Builders →" (anchors to Section 5 or /signup?role=builder)

---

**Column 2 — Interior & Home Designers**
*Small heading:* Interior & Home Designers
> "Your time is your product. Our presentation engine handles the production so you can focus on the design. Client-ready packages, installation diagrams, and photorealistic renders — faster than your current workflow."
>
> What we deliver: AI-assisted design presentations, render credits, and a tool that works the way you think.

CTA: "Explore Our Tools →" (routes to Section 5)

---

**Column 3 — Homeowners**
*Small heading:* Homeowners
> "Building or renovating a home is one of the most significant investments you'll make. We help you make selections with confidence — and deliver a finished plan your contractor can actually execute."
>
> What we deliver: personalized design consultation, curated finish selections, and a presentation you'll be proud to sign.

CTA: "Get in Touch →" (routes to /contact or triggers consultation scheduler)

---

### Layout Notes

- Three columns equal width on desktop
- On mobile: tabbed interface — one tab per audience type, tap to reveal column content
- Column headers: slightly larger, heavier weight than body text
- CTA per column: text link style with arrow, not a full button — keeps the section from feeling like a landing page
- Section background: white or very light — clean
- Optional: subtle top border or icon per column to visually differentiate
- This section is the payoff for the hero routing — if a user clicked "I Work in Building & Design" and scrolled here, Builders & Developers column should be visually first / prominent

---

## SECTION 4 — LATEST
**Anchor:** #latest  
**Job:** Live content feed. Visual proof, authority building, and SEO through website-first publishing. Content lives here first, then syndicates to Instagram and Facebook.

---

### Written Flow

**Section label:**
> LATEST

**Headline:**
> "What we're working on."

**Filter bar — four pills, horizontally arranged:**
- All *(default, selected on load)*
- Projects
- Tips & Ideas
- Process

Selecting a filter updates the feed dynamically — no page reload.

**Feed grid below filter bar:**
4–6 most recent posts displayed. Each post card contains:

*For image posts:*
- Full-bleed image (primary)
- Post title or first line of caption
- Content tag (Projects / Tips & Ideas / Process) — small label
- Date published
- On hover (desktop): subtle overlay with "Read More →" link to full post page

*For video posts:*
- Video thumbnail with play button overlay
- Post title
- Content tag + date
- On hover/tap: inline autoplay preview (muted) or link to full post

**Below feed grid:**
- "Follow on Instagram →" and "Follow on Facebook →" — text links, subtle

---

### Content Data Model (Notes for Opus)

Each post stored in Supabase with:
- `post_id`
- `title`
- `caption` / body text
- `media_url` (image or video — Supabase storage)
- `media_type` (image / video / carousel)
- `content_tag` (projects / tips_ideas / process)
- `published_at` (timestamp)
- `pinned` (boolean — pinned posts always appear first regardless of date)
- `syndicated_instagram` (boolean)
- `syndicated_facebook` (boolean)
- `slug` (for individual post URL: /latest/[slug])

Feed query: pull posts where `published_at` is not null, order by `pinned DESC`, then `published_at DESC`, limit 6.
Filter query: same with `content_tag` filter applied.

---

### Pinning Logic

Admin can pin up to 2 posts at any time. Pinned posts always render first — before recency ordering. Ensures best project work is never buried under tips content. Managed from admin content queue.

---

### Individual Post Pages

Each post has a full page at `/latest/[slug]` — the canonical URL indexed by search engines. Social platforms link back here when syndicated. Page contains:
- Full image or video
- Full caption/body text
- Content tag + date
- Related posts (same tag, 2–3 suggestions)
- CTA at bottom matching visitor type (Get in Touch / Get Started)

Auto-generated from Supabase records — no manual page building required.

---

### Layout Notes

- Section background: dark or deep neutral — makes images and video thumbnails pop
- Section label and headline: white or near-white text
- Filter pills: outlined style on dark background, selected state fills with brand accent
- Feed grid: 3-column on desktop, 2-column on tablet, 1-column on mobile
- Card aspect ratio: consistent 4:3 crop for images. Video cards same ratio with play overlay.
- Pinned posts: no special visual indicator to public — they appear first. Admin sees pin status in content queue.
- Video autoplay on hover: muted, loops, stops on mouse-out. Respects reduced-motion accessibility preference.
- "Follow on Instagram / Facebook" links: below grid, small, not competing with feed
- Feed updates automatically as new posts are published — no manual site deploys needed

---

## SECTION 5 — THE TOOLS
**Anchor:** #tools  
**Job:** Explain the professional tooling. Drive sign-up for designers and builders. Homeowners are not the audience for this section — make that clear visually.

---

### Written Flow

**Section label:**
> FOR DESIGN PROFESSIONALS

**Headline:**
> "We built the tools we wished existed."

**Subtext:**
> "The HCHC platform gives designers and builders access to AI-assisted presentation generation and photorealistic rendering — with human review before every deliverable. Not fully automated. That's intentional."

---

**Two tool blocks side by side:**

**Block 1 — Presentation Engine**
*Visual: clean UI screenshot or mockup of a finished presentation*

> "Generate complete, client-ready design presentations from a change order or selections list. Materials are matched against our curated library, installation diagrams are pre-populated, and your finished draft is ready for review — then download for client signature."

Key points (3 bullets max):
- AI-assisted, human-approved
- Supports installation diagrams and material specs
- Download-ready for client signature

Pricing callout: **$300/month** — includes 3 render credits annually

CTA button: "Start Your Subscription →" (routes to /signup?role=designer or /plans)

---

**Block 2 — Photorealistic Renders**
*Visual: before/after or a single stunning render output*

> "Submit your Revit, Rhino, or SketchUp files. We deliver photorealistic images of your spaces — interior or exterior — within 72 hours. One scoping call. Human review. Flat fee."

Key points:
- $1,000 per room / $250 per iteration
- 72-hour delivery
- Accepted formats: Revit, Rhino, SketchUp [confirm full list]

CTA button: "Submit a Project →" (routes to /signup?role=designer or Tier 1 submission flow)

---

**Below both blocks:**
> "Not sure which option fits your workflow? [Book a quick call →]"

---

### Layout Notes

- Section background: light neutral — distinct from Section 4's dark background
- "FOR DESIGN PROFESSIONALS" label: visually distinct — consider a subtle horizontal rule or badge treatment to signal this section has a specific audience
- Two blocks: side by side on desktop, stacked on mobile
- Tool block visual (screenshot/mockup): placeholder acceptable for MVP — real UI screenshot replaces it once dashboard is built
- Pricing: displayed clearly, not buried. Not a surprise at checkout.
- CTA buttons: full treatment here — this is the conversion section for professionals
- Homeowners who scroll this far should feel this section isn't for them — the label and language does that work without being exclusionary

---

## SECTION 6 — THE PROCESS
**Anchor:** #process  
**Job:** Reduce friction. Show that working with HCHC is straightforward. Applies to all audiences.

---

### Written Flow

**Section label:**
> HOW IT WORKS

**Headline:**
> "From first conversation to finished presentation."

**Four steps, horizontal flow on desktop:**

**Step 1 — Connect**
> "Tell us about your project. Schedule a call or submit your files — we'll confirm scope and timeline before anything starts."

**Step 2 — Design**
> "We work through selections, materials, and presentation structure — guided by our design system and your project requirements."

**Step 3 — Review**
> "Every deliverable goes through human review before it reaches you. You see a finished draft, make edits, and approve."

**Step 4 — Deliver**
> "Download your presentation, share it with your client or contractor, and get to work. Clean, complete, ready to sign."

---

### Layout Notes

- Four steps in a horizontal row with connectors between them (line or arrow) on desktop
- On mobile: vertical stack with step numbers prominent
- Each step: number (large, light treatment), title, descriptor text
- Section background: white — clean and neutral after the varied backgrounds above
- Step connectors: simple line or dotted path, not decorative
- No images in this section — typography and whitespace carry it
- Keep copy tight — each step description is 1–2 sentences max

---

## SECTION 7 — CLOSING CTA
**Anchor:** #contact  
**Job:** Two clear paths. One strong closing statement. Convert or capture.

---

### Written Flow

**Headline (large, centered):**
> "Let's build something that performs."

**Subtext:**
> "Whether you're a builder scaling a community, a designer streamlining your workflow, or a homeowner making one of the most important decisions of your life — we're ready."

**Two CTA blocks side by side:**

**Left — For Professionals**
> "Create your account and access the tools."
Button: "Get Started →" (routes to /signup)

**Right — For Homeowners & Consultations**
> "Ready to talk through your project?"
Button: "Get in Touch →" (routes to /contact or triggers scheduler)

**Below both:**
Small text: "Or reach us directly at [email address]"

---

### Layout Notes

- Section background: dark or deep brand tone — strong visual close to the page
- Headline and subtext: white or near-white text
- Two CTA blocks: side by side on desktop, stacked on mobile
- Each block: subtle card or just centered text + button — not over-designed
- Primary button (Get Started): solid accent fill
- Secondary button (Get in Touch): ghost/outline on dark background
- Email link: plain text, not a button — keeps it human
- This section is the last thing a visitor sees — it should feel confident, not desperate

---

## FOOTER

**Job:** Legal, navigation, social links. Not a design statement.

**Contents:**
- HCHC wordmark (small)
- Four nav links repeated: Work / Services / For Professionals / Contact
- Social links: Instagram, Facebook (Google Workspace connected)
- Legal: Privacy Policy / Terms of Service
- Copyright line: © 2026 Hill Country Home Concepts. All rights reserved.
- Optional: "Designed and built in San Antonio, TX"

**Layout Notes:**
- Two-row footer: nav + social on top row, legal on bottom row
- Dark background matching Section 7 or separate very dark neutral
- Minimal — no about copy, no newsletter signup (for MVP)
- Mobile: stacked, centered

---

## FULL PAGE FLOW SUMMARY

```
[NAV — fixed, transparent → solid on scroll]
    |
[SECTION 1 — HERO]
    Two doors: Professionals → scroll to S3 / Homeowners → scroll to S3
    |
[SECTION 2 — WHAT WE DO]
    Three service tiles — threads to pull
    |
[SECTION 3 — WHO WE WORK WITH]
    Three columns — each audience spoken to directly
    |
[SECTION 4 — LATEST]
    Live content feed — Projects / Tips & Ideas / Process filters
    Website-first publishing → syndicates to Instagram + Facebook
    |
[SECTION 5 — THE TOOLS]
    Professional tooling explained — conversion point for designers/builders
    |
[SECTION 6 — THE PROCESS]
    Four steps — friction reduction for all audiences
    |
[SECTION 7 — CLOSING CTA]
    Two paths: Get Started (professionals) / Get in Touch (homeowners)
    |
[FOOTER]
```

---

## ROUTING SUMMARY — PUBLIC SITE EXITS

| Visitor action | Destination |
|---|---|
| "I Work in Building & Design" (hero) | Scroll to Section 3, professionals columns |
| "I'm a Homeowner" (hero) | Scroll to Section 3, homeowner column |
| "Get in Touch" (homeowner CTA) | /contact or inline consultation scheduler |
| Filter: Projects (Section 4) | Feed filters to projects content |
| Filter: Tips & Ideas (Section 4) | Feed filters to tips content |
| Filter: Process (Section 4) | Feed filters to process content |
| Post card click (Section 4) | /latest/[slug] — individual post page |
| "Follow on Instagram" (Section 4) | Instagram profile (new tab) |
| "Follow on Facebook" (Section 4) | Facebook profile (new tab) |
| "Start Your Subscription" (Section 5) | /signup?role=designer or /plans |
| "Submit a Project" (Section 5) | /signup or Tier 1 submission flow |
| "Get Started" (closing CTA) | /signup (Screen 01 — account setup flow) |
| "Get in Touch" (closing CTA) | /contact or scheduler |
| Nav: "For Professionals" | Anchor to Section 5 |
| Nav: "Latest" | Anchor to Section 4 |
| Nav: "Services" | Anchor to Section 2 |
| Nav: "Contact" | Anchor to Section 7 or /contact |
| Nav: "Sign In" | /login |
| Nav: "Get Started" | /signup |

---

## NOTES FOR OPUS

- Public site is a single scrolling page for MVP. Subpages (/latest/[slug], /services/consultation, etc.) are either auto-generated or future state — stub routes now, build later.
- /contact page is a simple form + scheduler embed for MVP — does not require its own flow doc.
- All scroll anchors should use smooth scroll behavior.
- Section 4 (Latest) feed pulls from Supabase posts table — build feed component to reference storage URLs, not hardcoded paths. Feed must support image and video media types.
- Filter pills use client-side filtering — no page reload on filter change.
- Individual post pages at /latest/[slug] are auto-generated from Supabase records.
- Pinned posts (up to 2) always render first in feed — managed via admin content queue.
- Section 5 tool visuals are placeholders until dashboard UI is built — design system should account for swapping these out.
- Social links in footer and Section 4 connect to Instagram and Facebook — Google Workspace integration confirmed.
- "For Professionals" label treatment in Section 5 is intentional UX — do not remove or soften it.
- Website-first publishing is the core content strategy — canonical URLs live on this domain, social platforms receive syndicated versions.

---

*Next flow to map: Professional Dashboard — designer and builder experience*  
*Then: Admin Environment*
