# HCHC PLATFORM HANDOFF
## For: Claude Opus (Desktop Terminal Session)
## Version: 1.0
## Status: Planning / Pre-Build
## Last Updated: May 2026

---

## WHAT YOU ARE BUILDING

A full-stack, cloud-hosted web platform for **Hill Country Home Concepts (HCHC)** — an interior design business operating in the San Antonio / Texas Hill Country residential market.

This platform is the **central flywheel** for all audience capture, service delivery, and business operations. It is not a portfolio site. It is a functioning SaaS-adjacent business platform with a public marketing layer, role-based client portals, a proprietary presentation engine, AI-assisted automation, and a full admin environment.

**Live domain:** hillcountryhomeconcepts.com  
**Owner/Admin:** Ena (Design Center Manager → Independent Design Leader)  
**Business partner:** Referenced throughout; handles investor relations and some lead generation  
**Tech stack in use:** Supabase (primary DB + storage), Google Workspace (document intake + social media queue), Claude API (AI logic layer), Nano Banana (photorealistic rendering)

---

## BRAND DIRECTION

Refer to `__PROJECT_HANDOFF-_WEBSITE_GENERATION.pdf` for full brand spec. Summary:

- **Tone:** Confident, strategic, elevated, clear. Not corporate. Not fluffy.
- **Visual style:** Minimalist, editorial, image-first, strong typographic hierarchy
- **Primary value statement:** "I design homes that sell, scale, and feel elevated."
- **Target-first positioning:** Builders and developers first. Homeowners second.
- **Language:** Use "lead, drive, develop, scale, position, align." Avoid "passionate about, dream spaces, beautiful designs."

---

## SITE ARCHITECTURE — 4 ENVIRONMENTS

### 1. PUBLIC SITE
Marketing layer. Audience routing. No login required.

### 2. CLIENT PORTAL
Lightweight. Homeowners only. Invoice history, project status, direct message thread.

### 3. PROFESSIONAL DASHBOARD
Full tool access. Designers, BIMs (Home Designers), Builders. Gated by subscription tier.

### 4. ADMIN ENVIRONMENT
Owner-only. Full platform access. Material library management. Social media queue. Demo mode toggle.

---

## AUDIENCE BUCKETS & ROUTING LOGIC

### A. CONSUMERS (Homeowners)
**Who:** Individuals building a new home or renovating. One or two projects lifetime on this platform.  
**Primary need:** Design consultation, curated selections, finished presentation for contractor handoff.  
**Entry point:** Public site hero → "Get in Touch" tile.  
**Routing logic:**
- If they attempt to sign up → account setup questionnaire fires
- Questionnaire asks: "What services are you interested in?"
- If they select homeowner/design consultation → routed to "Get in Touch" tile OR auto-scheduler for a brief consultation call
- They are generated as a **new lead** in the CRM/contact pipeline
- They do NOT see the professional tools, subscription tiers, or presentation engine

**Post-project retention:** Email campaigns and social media engagement. No active dashboard needed long-term. Lightweight client portal (invoices, messages, project status) is sufficient.

**Client portal features (homeowners):**
- Invoice history
- Project status indicator
- Direct message thread to Ena/team
- No access to any professional tooling

---

### B. INTERIOR DESIGNERS
**Who:** Independent or boutique interior designers who want to use the presentation engine on a subscription model.  
**Primary need:** AI-assisted design presentation generation. Fast, professional, client-ready output.  
**Entry point:** Public site → "Our Tools" page  
**Routing logic:**
- "Our Tools" page explains the presentation engine, AI capabilities, and human review process
- Sign-up CTAs at top and bottom of page → Subscription tier selection menu
- Account setup collects: name, business name, license info (optional), billing

**Dashboard features:**
- Presentation engine access (tier-gated)
- Project history organized by address or lot number
- Projects in review are visible but locked until approved and pushed through by admin
- Download finished presentations
- Tier 1 credit tracker (for Tier 2 subscribers)

---

### C. HOME DESIGNERS / BIMs
**Who:** Building Information Modelers or drafters who need photorealistic renders from 3D plan files. Fast turnaround, transactional relationship.  
**Primary need:** Tier 1 render service primarily. May expand to engine access later.  
**Status:** Routing and dashboard experience TBD — pending colleague input on market. **Do not finalize this path yet.** Hold as a placeholder in the build.  
**Entry point:** Likely "Our Tools" page alongside Interior Designers, but with different CTAs.  
**Note:** Confirm with business partner before building this UX path.

---

### D. BUILDERS
**Who:** Production or semi-custom homebuilders. High-volume, recurring need.  
**Primary need:** All services — photorealistic renders (Tier 1), presentation engine for buyer selections (Tier 2), potentially enterprise/custom volume.  
**Entry point:** Public site → account setup → builder-specific service menu  
**Routing logic:**
- Builder selects "Builder" at account setup
- Enters company information, license/registration details
- Presented with service menu:
  - **Design Consultation** → calendar booking (call with Ena to discuss buyer design services)
  - **Finish Selections & Presentation** → Revit/plan file submission workflow, interior/exterior selection, scope description, 72-hour turnaround
  - **Presentation Engine Subscription** → Tier 2 or Tier 3 access for recurring buyer presentations

**Dashboard features:**
- All professional dashboard features
- Project history by community, lot, or address
- File submission portal (Revit, Rhino, SketchUp, image formats)
- Presentation downloads
- Review status visibility (locked until admin-approved)
- Future: builder-specific templates, volume pricing (do not build yet)

**Note:** Builders are the highest-value recurring customer. Consider whether enterprise/custom quoting path is needed in addition to standard tiers. Flag for discussion.

---

## SUBSCRIPTION TIERS

### TIER 1 — À La Carte Render Service
**Who it's for:** Any professional user. BIMs, designers, builders needing one-off renders.  
**What it is:** Upload Revit, Rhino, SketchUp, or acceptable 3D file/still → receive photorealistic images  
**Process:**
1. User submits project files + scope description (interior, exterior, or both)
2. One-time phone call to confirm project scope
3. Human review of output before delivery (not fully automated — this is a selling point)
4. Delivery within 72 hours / 3 business days

**Pricing:**
- $1,000 per room
- $250 per iteration or change request
- Flat fee, no subscription required

**Messaging emphasis:** Human sanity check before every deliverable. Accuracy guaranteed.

---

### TIER 2 — AI Design Secretary (Presentation Engine)
**Who it's for:** Interior designers and builders with recurring presentation needs.  
**What it is:** Monthly subscription to the HCHC Presentation Engine. Generates installation diagrams and client-ready design presentations at the touch of a button.  
**Process:**
1. Change order or project file submitted
2. Claude reviews document against material library
3. Missing materials are auto-added with installation notes
4. Engine pre-populates presentation
5. Designer sees finished draft first (read-only preview)
6. Designer enters edit/drafting mode for adjustments
7. Save → download finished presentation ready for client signature
8. Human review gate before delivery (admin or partner must approve before designer can download)

**Pricing:** $300/month  
**Includes:** 3 Tier 1 render credits annually (~$3,000 value — lead with this in marketing)

---

### TIER 3 — Unlimited Package
**Who it's for:** High-volume users — busy builders, large design firms.  
**What it is:** Full access to both tools with capped but generous render allotment.  
**Pricing:** TBD — price high enough to absorb render volume risk  
**Includes:**
- Unlimited Tier 2 (presentation engine)
- 4–6 Tier 1 renders per month included
- Additional renders at reduced per-room rate (TBD)
- No true unlimited renders — cap protects business time

**Note:** Finalize Tier 3 pricing before building payment flow.

---

## PRESENTATION ENGINE — DETAILED WORKFLOW

This is the core proprietary tool. Refer also to `__PROJECT_HANDOFF-_HCHC_DESIGN_SYSTEM_-_PRESENTATION_ENGINE.docx` for full spec.

### Input Layer
User selects or inputs:
- Flooring, cabinetry, countertops, backsplash/tile, hardware, paint color
- Style (dropdown — Hill Country Modern, Warm Transitional, Clean Contemporary, Classic Neutral, Elevated Builder Grade)
- Budget tier (low/mid/high), builder/project name, client name

### Material Library
- Stored in Supabase
- Each material: name, category, color tone (warm/cool/neutral), style tags, price tier, image URL, vendor/SKU
- **Admin-only for additions and edits**
- Future state: "Submit material for approval" function for designers (not built yet)
- **Automated material addition via change order workflow (see below)**

### Change Order Automation Workflow
1. Change order document uploaded (by builder or admin)
2. Document routes to Google Workspace
3. Claude API reviews document — checks all specified products against Supabase material library
4. Missing materials: Claude auto-adds to library with name, category, install method notation
5. Engine pre-populates presentation with confirmed materials
6. Designer/builder sees finished draft (read-only)
7. User enters drafting mode → edits → saves
8. Admin review gate → approval → user can download finished presentation
9. Presentation downloaded for client signature

### Design Logic / Rule Engine
- Warm materials pair with warm tones
- Avoid conflicting undertones
- Style consistency enforced across all selections
- Budget tier influences available options
- AI enforces rules; AI does not freely invent design direction

### Output Format
- Image-first layout
- Minimal text, clean hierarchy
- Sections: Cover page, Design concept, Materials by category, Visual boards, Summary/next steps
- Download formats: PDF (primary), slide deck (secondary)

---

## RENDER SERVICE WORKFLOW (TIER 1 / NANO BANANA)

1. User submits: Revit, Rhino, SketchUp, or 3D still image file
2. User describes scope: interior, exterior, or both; finish preferences; brand book (optional upload)
3. System confirms file receipt
4. One-time scoping call scheduled automatically
5. Files processed through Nano Banana with preset prompts (prompts provided separately by Ena)
6. Human review of renders before delivery
7. Delivered within 72 hours / 3 business days
8. Iterations billed at $250 each

**Note:** Nano Banana generates photorealistic images from 3D model files. 2D-to-3D conversion is not supported without Revit/SketchUp/Rhino source files. This is a technical constraint to communicate clearly to users at file submission.

**Accepted file formats:** TBD — confirm with Nano Banana API documentation.

---

## ADMIN ENVIRONMENT

### Access
- Owner (Ena) only
- Separate secure login / elevated auth layer
- Full visibility and edit access across all platform environments

### Features
- **Material library management:** Add, edit, archive materials. Image upload. SKU/vendor notation. Install method fields.
- **Social media queue:** View, schedule, edit queued posts (connected to Google Workspace)
- **Project review queue:** All projects pending approval across all tiers visible here. Push through to release to user.
- **User management:** View all accounts, tier assignments, usage history
- **Lead pipeline:** Homeowner inquiry log, consultation requests, contact form submissions
- **Platform troubleshooting:** Full access to all features for QA and issue resolution

### Demo Mode
A toggle within admin that activates a sandboxed demo environment:

**Sandboxed data:**
- Pre-loaded fake projects, clients, materials — polished and complete
- No real user data exposed

**Role switcher:**
- While in demo mode, toggle between: "View as Builder" / "View as Interior Designer" / "View as Homeowner"
- Shows exactly what each user type sees without leaving the admin session

**Guided tour overlay:**
- Scripted click-through for investor/partner walkthroughs
- Callout bubbles highlight key funnel steps
- Demonstrates account setup flow, service menu, tool access, review gate
- Serves three audiences: prospects evaluating tools, investors evaluating funnel, partners evaluating their specific experience

---

## TECH STACK & INTEGRATIONS

| Layer | Tool | Notes |
|---|---|---|
| Database + Storage | Supabase | Primary. Material library, user accounts, project files, presentations |
| Document Storage | Google Workspace | Change order intake, social media content queue |
| AI Logic | Claude API | Change order review, material matching, design summary generation, rule enforcement |
| Rendering | Nano Banana | Photorealistic image generation from 3D files. Preset prompts provided by Ena separately |
| Auth | TBD | Supabase Auth likely. Role-based access required (homeowner / designer / BIM / builder / admin) |
| Payments | TBD | Stripe recommended. Required for Tier 1 flat fee + Tier 2/3 subscriptions |
| Scheduling | TBD | Calendar integration for scoping calls and homeowner consultations. Consider Calendly API or Google Calendar via Workspace |
| Email | TBD | Transactional email for project status, delivery notifications, lead follow-up |

---

## WHAT IS BUILT (AS OF MAY 2026)

- Material library interface (exists, wired to Supabase, admin-accessible)
- Material/photo database (actively being populated)
- hillcountryhomeconcepts.com domain active
- Google Workspace connected

## WHAT IS PLANNED / NOT YET BUILT

- Public site routing and UX flows
- Role-based account setup and onboarding
- Subscription tier selection and payment flow
- Professional dashboard (designers, builders)
- Client portal (homeowners)
- Presentation engine UI (draft/edit/download flow)
- Change order automation workflow
- Nano Banana render submission and delivery workflow
- Admin environment (beyond material library)
- Demo mode
- Home Designer / BIM UX path (on hold — pending colleague input)
- Tier 3 pricing finalization
- Enterprise/builder custom quoting path (flagged for future discussion)

---

## DESIGN PRINCIPLES FOR THE BUILD

- **Systems over creativity** — this platform runs on rules, not improvisation
- **Speed over perfection** — MVP first, iterate fast
- **Consistency over variety** — every output should look like it came from the same hand
- **Human in the loop** — automation assists, humans approve. This is a feature, not a limitation. Market it.
- **Image-first UI** — presentations and the public site both lead with visuals

---

## OPEN QUESTIONS (DO NOT BUILD UNTIL RESOLVED)

1. Home Designer / BIM UX path — awaiting colleague input on market demand and lead gen strategy
2. Tier 3 pricing — needs finalization before payment flow build
3. Builder enterprise/custom quoting — evaluate after Tier 3 is defined
4. Accepted file formats for Nano Banana — confirm via API documentation
5. Scheduling tool — confirm Google Calendar (Workspace) vs. Calendly
6. Transactional email provider — select before notification system build
7. "Submit material for approval" for designers — future state, not MVP

---

## SUCCESS METRICS

- A builder can submit a project and receive a finished presentation within 72 hours
- A designer can generate a client-ready presentation in under 10 minutes
- A homeowner lands on a consultation booking within 2 clicks of arriving on the site
- Admin can review, approve, and push all pending projects from a single queue
- Demo mode can be activated and walked through live in under 5 minutes

---

*This document should be updated after each major build session. Treat it as the single source of truth for platform architecture and intent.*
