# Ena Portfolio Project — Session Recap

## Dual Identity Strategy (Current)

Ena has manager approval to use builder project photography and designs, credited to United Finishes. She also has approval to handle design appointments in the ADG studio for her husband's business, which expands her portfolio-building opportunities.

### Public-Facing Identity: United Finishes Design Leader
- **Tagline:** "Design With Intent."
- **Social identity:** "Design Leader specializing in Texas Hill Country residential interiors"
- **Audience:** Custom home builders in San Antonio / Hill Country
- **Materials:** `BRAND_BOOK_B2B.md`, `BRAND_BOOK_B2B.html`, `PORTFOLIO_B2B.html`
- **Live site:** `unfsa.vercel.app` (Vercel free tier, GitHub repo, user: eldodskis)
- **Contact form:** Submits to `ena.dodski@united-finishes.com` via FormSubmit.co
- **Used at:** Builder networking events, in-person meetings, email follow-ups, LinkedIn

### Underlying Personal Brand: Hill Country Home Concepts (HCHC)
- **Tagline:** "Warm by Design."
- **Audience:** Homeowners (30-55, $120K+ HHI) and real estate professionals
- **Materials:** `BRAND_BOOK.md`, `BRAND_BOOK.html`, `index.html`
- **Live site:** `hchcportfolio.vercel.app` (Vercel free tier, GitHub repo `hchc-portfolio`, user: eldodskis)
- **Contact form:** Submits to `ena.dodski@gmail.com` via FormSubmit.co
- **Used on:** Social media (Instagram/Pinterest), website, realtor networking

### Lane 3 — Designer Partnerships (feeds into Lane 1)
- Independent designers bring clients to ADG's Design Center for flooring
- ADG handles installation, designer keeps client relationship
- No separate brand materials needed

## Legal Separation
- Manager approved use of builder project photos credited to United Finishes
- Manager approved Ena handling design appointments in ADG studio for husband's business
- HCHC social media marketed ONLY through realtor and subcontractor connections
- ADG portfolio used ONLY for builder networking

## What We Built

### Session 1: Research & Brand Foundation
1. **Top Designer Research** (`research_top_designers.md`) — 15 designer profiles, industry patterns
2. **Style Analysis** (`style_analysis.md`) — "Warm Transitional" style, navy signature
3. **Brand Book v1** (`BRAND_BOOK.md` + `.html`) — Full HCHC identity guide

### Session 2: Repositioning & Dual Brand
4. **B2B Brand Book** (`BRAND_BOOK_B2B.md` + `.html`) — ADG builder-facing identity, services, differentiators, networking materials, elevator pitch, follow-up templates, designer partnership program
5. **B2B Portfolio** (`PORTFOLIO_B2B.html`) — Builder portfolio website
6. **B2C Brand Book Update** — Stripped all builder/ADG/KB Home/Pulte references from HCHC brand book
7. **B2C Portfolio Update** (`index.html`) — Removed "For Builders" section, adjusted About copy
8. **Pro Photos** extracted to `pro_photos/` — 7 professional architectural shots

### Session 3: Image Branding, Cleanup & Deployment
9. **HCHC Logo Badge** — Full badge + small badge variants
10. **Image Edits** — HCHC badges applied to 5 images, watermarks covered
11. **Portfolio HTML Updates** — Copy fixes, text replacements
12. **File Renaming** — All images renamed to web-safe (no spaces, lowercase)
13. **PORTFOLIO.html to index.html** — Renamed for Vercel deployment
14. **Vercel Deployment** — HCHC site live on Vercel free tier

### Session 4: Headshot, Contact Forms, Copy Polish
15. **Headshot Added** — `pro_photos/headshot.jpg`
16. **index.html (B2C)** — Headshot in About, switched to "I" voice
17. **PORTFOLIO_B2B.html (B2B)** — "Meet the Designer" section added
18. **Contact Forms Wired Up** — FormSubmit.co on both sites, honeypot spam protection
19. **Copy Polish** — No em dashes, no contractions, complete sentences, clean alt text

### Session 5: Resume, B2B Rewrite, Deployment
20. **Branded Resume** (`EnaDodski_Resume_2026_v2.docx`):
    - Built via `build_resume.py` script (python-docx)
    - HCHC brand elements: Navy headings (Cormorant Garamond), Mocha accents, Sand dividers
    - White background, dark text (#2D2D2D) for LinkedIn/Indeed compatibility
    - 11pt body text, tightened heading spacing
    - Power language per Project Handoff: lead, drive, develop, scale, position
    - United Finishes start date corrected to Nov 2024
    - 10+ years experience (starting 2016)
    - Portfolio link at footer
21. **B2C Updates (index.html):**
    - "room"/"rooms" replaced with "space"/"spaces"/"homes" throughout
    - "Room Refresh" service renamed to "Space Refresh"
    - 10 years experience updated
22. **B2B Full Rewrite (PORTFOLIO_B2B.html):**
    - **Dual identity positioning:** Ena as Design Leader (public), HCHC as underlying brand
    - Nav: "Ena Dodski" with subtitle "Design Leader · United Finishes"
    - Hero: "Design With Intent." tagline
    - About section leads (Ena first, not company pitch)
    - All copy in first person ("I") not company voice ("We/ADG")
    - Portfolio credited: "Projects completed through United Finishes / ADG Design Services"
    - Footer: "Ena Dodski / Design With Intent. / United Finishes · Hill Country Home Concepts"
    - Fixed all image paths from old filenames to web-safe names
    - Contact form points to `ena.dodski@united-finishes.com`
    - 10+ years experience
    - No contractions, no em dashes
23. **B2B Deployed:**
    - `b2b-deploy/` folder prepped (index.html + pro_photos/)
    - Deployed to Vercel: `unfsa.vercel.app`
    - Separate repo from HCHC site
    - **ACTION REQUIRED:** First form submission triggers FormSubmit confirmation to `ena.dodski@united-finishes.com`. Ena must click to activate.

## Brand Fonts (downloaded to `fonts/`)
- `CG-SemiBold.ttf` — Cormorant Garamond SemiBold (headings)
- `Jost-Light.ttf` — Jost Light (subheadings, uppercase)
- `Jost-Regular.ttf` — Jost Regular (body)

## Brand Colors
| Name | Hex | Usage |
|------|-----|-------|
| Ivory | `#F5F0EB` | Primary background (60%) |
| Navy | `#1B2A4A` | Headings, accents (25%) |
| Espresso | `#3C2A21` | Body text |
| Sand | `#D4C5B2` | Borders, dividers |
| Mocha | `#A37762` | Subheadings, highlights (10%) |
| Carrara | `#E8E4E0` | Section backgrounds |
| Gold | `#C4A265` | Accent (5%) |
| Dusty Blue | `#7B9BAE` | Accent |
| Sage | `#8A9A7B` | Accent |

## Files in Ena Folder
```
Ena/
├── index.html                 -- B2C portfolio website (HCHC) -- DEPLOYED (hchcportfolio.vercel.app)
├── PORTFOLIO_B2B.html         -- B2B portfolio website -- DEPLOYED (unfsa.vercel.app)
├── b2b-deploy/                -- Deploy-ready B2B files (index.html + pro_photos/)
├── Headshot.jpg               -- Original headshot
├── BRAND_BOOK.md              -- B2C brand book (HCHC, consumer-focused)
├── BRAND_BOOK.html            -- B2C brand book (styled HTML)
├── BRAND_BOOK_B2B.md          -- B2B brand book (ADG, builder-focused)
├── BRAND_BOOK_B2B.html        -- B2B brand book (styled HTML)
├── # PROJECT HANDOFF- WEBSITE GENERATION.docx -- Design leader positioning guide
├── EnaDodski_Resume_2026.docx      -- Original resume
├── EnaDodski_Resume_2026_branded.docx -- First branded version
├── EnaDodski_Resume_2026_v2.docx   -- Current branded resume (white bg, 11pt, 10yr)
├── build_resume.py            -- Resume generation script (python-docx)
├── research_top_designers.md  -- Top 15 designer profiles + industry patterns
├── style_analysis.md          -- Ena's style DNA analysis
├── session_recap.md           -- THIS FILE
├── Repositioning Ena's Career.docx -- Strategy conversation transcript
├── MOOD BOARDS.pptx           -- Mood board presentation
├── fonts/                     -- Brand fonts (CG-SemiBold, Jost-Light, Jost-Regular)
├── pro_photos/                -- All portfolio images (14 files, web-safe names)
│   ├── hero.webp
│   ├── hill-country-vista.webp
│   ├── kitchen-detail.webp
│   ├── navy-kitchen.png
│   ├── new-heartland.png
│   ├── modern-warmth.webp
│   ├── soft-collected.webp
│   ├── master-retreat.webp
│   ├── spa-bath.webp
│   ├── trad-residence.png
│   ├── urban-organic.png
│   ├── modern-contrast.png
│   ├── client-presentation.png
│   └── headshot.jpg
├── images1/                   -- Original client projects + Bassett boards
├── images2/                   -- Kitchen reno before/after + additional rooms
└── drive-download-*.zip       -- Original uploaded zips
```

### Session 6: HCHC SaaS Platform + Presentation Engine MVP

26. **Platform Architecture** -- Evolved static portfolio into multi-page platform:
    - Auth: Clerk.com (sign in/sign up, role-based access)
    - Database: Supabase (PostgreSQL + file storage)
    - Frontend: Vanilla HTML/CSS/JS (no framework)

27. **Config + Client Libraries:**
    - `config.js` -- Clerk + Supabase public keys
    - `js/supabase-client.js` -- Full Supabase client (materials CRUD, image upload, projects CRUD)
    - `js/clerk-auth.js` -- Clerk integration (sign in/up, role detection, nav updates)

28. **Material Manager** (`materials.html` + `js/material-library.js`):
    - Full CRUD with Supabase backend
    - Image upload to Supabase storage
    - Filter/search by category, tone, price tier
    - Style tag multi-select (5 predefined design styles)
    - Grid view with thumbnails and badges

29. **Design Rule Engine** (`js/design-rules.js`):
    - Tone matching (warm/cool/neutral compatibility matrix)
    - Style consistency scoring
    - Budget tier variance detection
    - Specific conflict checks (warm cabinets + cool backsplash, etc.)
    - Returns: overall score, status (good/warning/conflict), warnings, suggestions

30. **Presentation Engine** (`presentation-engine.html`):
    - Split-panel UI: inputs left, live preview right
    - Project details (name, client, address)
    - Design style selector (5 presets from `data/styles.json`)
    - Budget tier filter
    - Material selection dropdowns per category with thumbnails
    - Real-time compatibility indicator (green/yellow/red with score)
    - Live preview updates as selections change
    - "Generate Presentation" opens clean print-ready HTML in new tab

31. **Presentation Template** (`js/presentation-template.js`):
    - Cover page with HCHC branding
    - Design concept section with auto-generated summary
    - Material grid with images and specs
    - Visual mood board
    - Summary with selection list and next steps
    - Print-ready (Ctrl+P for PDF)

32. **5 Design Style Presets** (`data/styles.json`):
    - Hill Country Modern, Warm Transitional, Clean Contemporary, Classic Neutral, Elevated Builder Grade
    - Each defines: palette, material preferences per category, restrictions

33. **18 Seed Materials** (`data/seed-materials.json` + `supabase-setup.sql`):
    - 3 per category across all tones and price tiers
    - Mapped to appropriate style presets

34. **Supabase Setup** (`supabase-setup.sql`):
    - Tables: materials, projects, files
    - RLS policies (public read, authenticated write)
    - Storage buckets: material-images, uploads, presentations
    - Seed data insert statements

35. **Dashboard** (`dashboard/index.html`):
    - Role-based views (Admin/Designer, Builder, Home Purchaser)
    - Quick action cards (Build Presentation, Material Library, Submit Project, Review Queue)
    - Project list with status tracking
    - Project submission form for builders
    - Clerk auth gating

36. **Marketing Site Auth** (`index.html` updated):
    - Clerk SDK integration
    - Auth nav (Sign In / Get Started when logged out; Dashboard / Sign Out when logged in)
    - HCHC-branded Clerk appearance variables

37. **Vercel Config** (`vercel.json`):
    - Dashboard route rewrites

## New Platform Files
```
Ena/
├── config.js                    -- Clerk + Supabase public keys
├── vercel.json                  -- Route rewrites
├── materials.html               -- Material Manager (CRUD + image upload)
├── presentation-engine.html     -- Presentation Engine (split-panel builder)
├── supabase-setup.sql           -- Database setup + seed data
├── js/
│   ├── clerk-auth.js            -- Clerk integration
│   ├── supabase-client.js       -- Supabase client + CRUD functions
│   ├── design-rules.js          -- Rule engine (tone/style/budget)
│   └── presentation-template.js -- Print-ready HTML generator
├── data/
│   ├── styles.json              -- 5 design style presets
│   └── seed-materials.json      -- 18 starter materials
└── dashboard/
    └── index.html               -- Role-based dashboard
```

## Deployment Status
- **HCHC (B2C):** LIVE at `hchcportfolio.vercel.app` -- needs GitHub push with all platform files
- **ADG (B2B):** LIVE at `unfsa.vercel.app` -- needs GitHub push with latest changes
- **FormSubmit activation needed** on `ena.dodski@united-finishes.com`

## Setup Required Before Platform Works
1. **Supabase:** Run `supabase-setup.sql` in Supabase SQL Editor (creates tables + seed data)
2. **Supabase Storage:** Create 3 buckets in dashboard: `material-images` (public), `uploads` (private), `presentations` (public)
3. **Verify Supabase anon key** -- the key from the docx (`sb_publishable_...`) looks non-standard. Check Settings > API in Supabase dashboard for the actual `anon` key (should start with `eyJ...`). Update `config.js` if different.
4. **Push to GitHub** -- all new files deploy via Vercel on push

## What's Next
- Run Supabase SQL setup
- Verify Supabase anon key and update config.js if needed
- Push all platform files to GitHub for Vercel deployment
- Test Clerk sign-up flow and verify role metadata
- Upload real material photos through Material Manager
- Professional photo shoot of the navy kitchen
- Logo design (HCHC wordmark)
- Custom domain setup (hillcountryhomeconcepts.com already configured)
