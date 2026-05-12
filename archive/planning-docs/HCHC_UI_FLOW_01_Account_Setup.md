# HCHC UI FLOW MAP — 01: ACCOUNT SETUP & ONBOARDING
## Version: 1.0 | May 2026
## Scope: New user sign-up through first dashboard landing
## Format: Written flow spec + layout notes per screen

---

## DESIGN PRINCIPLES FOR THIS FLOW

- Minimal friction. Every screen has one job.
- Role + intent captured on screen one. Everything downstream is personalized.
- Staged data collection — don't gate access behind a form wall.
- Homeowners never see professional tooling.
- Every role lands in an environment that feels built for them specifically.

---

## FLOW ENTRY POINTS

A user can reach account setup from:
- Public site hero CTA ("Get Started" or "Sign Up")
- "Our Tools" page CTA buttons (top + bottom)
- "Get in Touch" tile redirect (homeowners)
- Direct URL: hillcountryhomeconcepts.com/signup

All entry points converge at **Screen 01**.

---

## SCREEN 01 — ROLE + INTENT SELECTION
**URL:** /signup  
**Job:** Capture who they are and what they need in one clean interaction. Route them correctly from here.

---

### Written Flow

User lands on a single, focused screen. No navigation. No distractions. HCHC wordmark at top.

A short headline sets the tone:
> "Let's get you set up. Tell us who you are and what you're looking for."

Below the headline, two column-style selection groups appear simultaneously:

**Left column — Who are you?**
Four role cards, select one:
- Homeowner *(Building or renovating a home)*
- Interior Designer *(Design presentations and client management)*
- Home Designer / BIM *(Photorealistic renders from 3D files)*
- Builder *(Design services for your communities and buyers)*

**Right column — What are you most interested in?** *(options update dynamically based on role selected)*

| Role selected | Interest options shown |
|---|---|
| Homeowner | Design consultation for my home / I'm just exploring |
| Interior Designer | Presentation engine (subscription) / Photorealistic renders / Both |
| Home Designer / BIM | Photorealistic renders / I'm not sure yet |
| Builder | Buyer design consultations / Finish selections + presentations / Renderings / All of the above |

Single CTA button at bottom: **"Continue →"**  
Below button, small text: "Already have an account? Sign in"

---

### Routing Logic After Screen 01

| Role + Interest | Next screen |
|---|---|
| Homeowner → Design consultation | Screen 02-A (Homeowner basic info) |
| Homeowner → Just exploring | Screen 02-A (Homeowner basic info, lighter copy) |
| Interior Designer → any | Screen 02-B (Designer basic info) |
| Home Designer / BIM → any | Screen 02-C (BIM basic info) — placeholder flow |
| Builder → any | Screen 02-D (Builder basic info) |

---

### Layout Notes

- Full-bleed background: muted warm neutral or dark editorial tone (on-brand)
- HCHC wordmark top-left, small
- No sidebar, no nav, no footer links — focused flow only
- Role cards: clean tile format, icon or subtle illustration per role, label + descriptor text
- Selected role card highlights with brand accent color
- Right column interest options: radio button style or pill selectors
- Right column animates in after role selection (smooth fade/slide, not jarring)
- Mobile: stack left and right columns vertically — role first, interest second
- CTA button: full-width on mobile, centered fixed-width on desktop
- Typography: display headline, body descriptor text. No filler copy.

---

## SCREEN 02-A — HOMEOWNER BASIC INFO
**URL:** /signup/homeowner  
**Job:** Capture minimum viable info. Set expectation. Get them to the right next step fast.

---

### Written Flow

Headline:
> "Great. Let's connect you with the right person."

Form fields (all required):
- First name
- Last name  
- Email address
- Phone number
- ZIP code *(used to confirm Texas Hill Country service area)*

Below form, one checkbox:
- [ ] I'm ready to schedule a consultation call

If checked → CTA: **"Schedule My Consultation →"**  
If unchecked → CTA: **"Send My Info →"**

Small print below CTA:
> "We'll reach out within one business day. No spam, no pressure."

---

### Routing Logic After Screen 02-A

| Action | Next step |
|---|---|
| Checked "ready to schedule" | Screen 03-A: Inline calendar scheduler |
| Unchecked, submits info | Confirmation screen — lead logged, team notified |
| ZIP code outside service area | Soft message: "We're currently focused on the Texas Hill Country market. Submit your info and we'll let you know if we expand to your area." Still logs as lead. |

Homeowners do NOT proceed to account creation in the traditional sense at this stage. A lightweight account is created in the background (Supabase) using their email, flagged as role: homeowner, status: lead. Full client portal access is granted manually by admin after a project is confirmed.

---

### Layout Notes

- Same background treatment as Screen 01 for visual continuity
- Form is centered, generous white space, not cramped
- Fields: clean, minimal styling — no heavy borders, subtle underline or floating label style
- Checkbox is prominent, not buried
- CTA changes label dynamically based on checkbox state
- Progress indicator: not needed for homeowners — this is a short path
- Mobile: single column, full-width fields

---

## SCREEN 03-A — HOMEOWNER CONSULTATION SCHEDULER
**URL:** /signup/homeowner/schedule  
**Job:** Book the consultation call. Close the loop immediately.

---

### Written Flow

Headline:
> "Pick a time that works for you."

Inline calendar component showing Ena's available slots (connected to Google Calendar via Workspace).

User selects date → time slots appear → confirms selection.

Below confirmation:
- Brief description of what to expect:
> "This is a 20-minute intro call. We'll talk through your project, timeline, and how we can help. No commitment required."

CTA: **"Confirm My Appointment →"**

---

### Routing Logic After Screen 03-A

Confirmation screen with:
- Appointment date/time summary
- "Add to my calendar" button (Google / Apple / Outlook)
- "We'll send a confirmation to [email]"
- Lead record updated in Supabase with appointment details
- Admin notified via email/dashboard

---

### Layout Notes

- Calendar component: clean, on-brand. Not a third-party widget if avoidable — or skin Calendly to match brand.
- Time slots: pill or tile format, not a dropdown
- Confirmation state: subtle success animation, not over-the-top
- Mobile: full-width calendar, scrollable time slots

---

## SCREEN 02-B — INTERIOR DESIGNER BASIC INFO
**URL:** /signup/designer  
**Job:** Minimal friction entry. Establish account. Prompt setup checklist after.

---

### Written Flow

Headline:
> "Welcome. Let's get your account started."

Form fields:
- First name
- Last name
- Email address
- Password (with confirm)
- Business name *(optional at this stage)*

CTA: **"Create My Account →"**

Small print: "By creating an account you agree to our Terms of Service and Privacy Policy."

---

### Routing Logic After Screen 02-B

Account created in Supabase: role = interior_designer, tier = none, status = onboarding.

User lands on **Screen 04-B: Designer Onboarding Dashboard** — a lightweight welcome environment with a setup checklist.

---

### Layout Notes

- Same visual language as prior screens
- Password field: show/hide toggle
- No business name required — lower barrier to entry
- No billing info yet — tier selection happens inside the dashboard
- Progress bar: "Step 1 of 2" — communicates there's one more step (tier selection) without overwhelming

---

## SCREEN 02-C — HOME DESIGNER / BIM BASIC INFO
**URL:** /signup/bim  
**Status: PLACEHOLDER — do not fully build yet**

Hold this route open. Mirror Screen 02-B structure for now. Full UX path TBD pending colleague input on market and lead gen strategy.

Flag in build: `// BIM_FLOW — PLACEHOLDER — AWAITING MARKET CONFIRMATION`

---

## SCREEN 02-D — BUILDER BASIC INFO
**URL:** /signup/builder  
**Job:** Minimal friction entry. Establish account. Collect business context progressively.

---

### Written Flow

Headline:
> "Let's set up your builder account."

Form fields:
- First name
- Last name
- Email address
- Password (with confirm)
- Company name *(required — builders are always company-affiliated)*
- Primary market / city *(e.g., San Antonio, Boerne, Fredericksburg)*

CTA: **"Create My Account →"**

Small print: Terms + Privacy link.

---

### Routing Logic After Screen 02-D

Account created in Supabase: role = builder, tier = none, status = onboarding.

User lands on **Screen 04-D: Builder Onboarding Dashboard** — welcome environment with setup checklist and service menu.

---

### Layout Notes

- Company name field required (visual indicator)
- City field: text input or dropdown of Texas Hill Country markets
- Same visual language, same progress bar ("Step 1 of 2")
- Mobile: single column, full-width

---

## SCREEN 04-B — DESIGNER ONBOARDING DASHBOARD
**URL:** /dashboard/designer/welcome  
**Job:** Orient the user. Surface the setup checklist. Drive them to tier selection without forcing it.

---

### Written Flow

Header:
> "You're in. Here's how to get the most out of HCHC."

Welcome message (personalized with first name):
> "Hi [Name] — your account is set up. Complete the steps below to unlock your tools."

**Setup Checklist** (progress bar at top showing % complete):

1. ✅ Create your account *(already done)*
2. ⬜ Choose your plan *(links to Tier selection screen)*
3. ⬜ Upload your brand book *(optional — enhances presentation output)*
4. ⬜ Start your first project *(unlocks after tier selected)*

Each checklist item is a tappable row with a short descriptor and a CTA label ("Choose Plan", "Upload Now", "Start Project").

Below checklist, a preview panel:
> "Here's what you'll be able to do:" — 2–3 short capability callouts with small visuals (presentation engine preview, render example, project history).

This is a teaser, not a full product tour. Goal is to drive them to choose a plan.

---

### Layout Notes

- Dashboard shell is visible but tools are grayed out / locked until tier selected
- Checklist: card-style rows, clean icons, clear CTA per row
- Progress bar: prominent but not alarming — feels encouraging not pressuring
- Preview panel: image-forward, minimal text
- Navigation sidebar visible but simplified: Dashboard, My Projects (locked), Account Settings
- Mobile: stack checklist and preview vertically

---

## SCREEN 04-D — BUILDER ONBOARDING DASHBOARD
**URL:** /dashboard/builder/welcome  
**Job:** Same as designer onboarding but builder-specific framing and service menu.

---

### Written Flow

Header:
> "Your builder account is ready."

Welcome message:
> "Hi [Name] — let's get [Company Name] set up with the right services."

**Setup Checklist:**

1. ✅ Create your account
2. ⬜ Select your services *(links to builder service menu)*
3. ⬜ Upload your brand book *(optional)*
4. ⬜ Submit your first project *(unlocks after service selected)*

**Builder Service Menu** (shown inline below checklist on first visit):

Three service tiles, each selectable:

**Tile 1 — Design Consultation**
> "Schedule a call to discuss design services for your home buyers."
CTA: "Book a Call"

**Tile 2 — Finish Selections + Presentations**
> "Submit your plans and get a complete, client-ready design presentation within 72 hours."
CTA: "Submit a Project"

**Tile 3 — Presentation Engine Access**
> "Subscribe and generate buyer-ready presentations at the touch of a button. Includes 3 render credits annually."
CTA: "View Plans"

Builders can select one, multiple, or all three. Tile 1 goes directly to calendar. Tiles 2 and 3 route to their respective flows.

---

### Layout Notes

- Service tiles: large, image-forward, one strong action per tile
- Tile selection does not require choosing a subscription tier immediately — builders can book a call (Tile 1) or submit a project (Tile 2) before committing to a plan
- Tile 3 ("View Plans") routes to tier selection screen
- Same sidebar nav as designer dashboard, builder-labeled
- Mobile: tiles stack vertically, full-width

---

## TIER SELECTION SCREEN
**URL:** /plans  
**Accessible from:** Designer checklist, Builder Tile 3, nav menu (post-login)  
**Job:** Present the three tiers clearly. Drive conversion without pressure.

---

### Written Flow

Headline:
> "Choose the plan that fits your workflow."

Subtext:
> "All plans include human review before every deliverable. Not fully automated — that's the point."

Three tier cards side by side:

---

**TIER 1 — À La Carte**
*Best for: one-off projects, BIMs, builders testing the service*
- Photorealistic renders from your 3D files
- $1,000 / room
- $250 / iteration
- One scoping call included
- 72-hour delivery
- Human-reviewed output

CTA: "Get Started — No Subscription"

---

**TIER 2 — Design Secretary** *(highlighted as recommended)*
*Best for: active designers and builders with recurring projects*
- Full presentation engine access
- $300 / month
- 3 Tier 1 render credits included annually (~$3,000 value)
- Human review before every delivery
- Unlimited projects

CTA: "Start My Subscription"

---

**TIER 3 — Unlimited**
*Best for: high-volume builders and large design firms*
- Everything in Tier 2
- 4–6 render credits per month included
- Additional renders at reduced rate
- Price: TBD *(do not display pricing until finalized — show "Contact Us" instead)*

CTA: "Contact Us for Pricing"

---

Below tier cards, one line of reassurance:
> "Not sure which plan is right for you? [Book a quick call →]"

---

### Layout Notes

- Three cards in a row on desktop, stacked on mobile
- Tier 2 card: slightly elevated, subtle highlight border or badge ("Most Popular")
- Tier 3 card: premium visual treatment — darker background or gold accent
- Pricing displayed prominently — not buried
- Tier 1 card: no "subscribe" language — it's transactional, per-project
- Annual vs. monthly toggle for Tier 2/3 (future state — skip for MVP)
- All three tiers accessible from this single screen

---

## ACCOUNT SETTINGS — ROLE SWITCHING
**URL:** /account/settings  
**Job:** Allow users to change their role without contacting support.

---

### Written Flow

Section: "Account Type"

Displays current role with a small descriptor.  
Below: "Change account type" link → opens a modal.

Modal content:
> "Switching your account type will update your dashboard and available services. Your project history will be preserved."

Role selector (same tile format as signup Screen 01).  
CTA: "Save Changes"

Note: If switching from a paid tier to a role without that tier, display:
> "Your current subscription will remain active. You can manage it under Billing."

---

### Layout Notes

- Role switch is not buried — it's in the main Account Settings page, clearly labeled
- Modal prevents accidental switches — requires active confirmation
- Billing section is separate from role — changing role does not auto-cancel subscriptions

---

## FLOW SUMMARY MAP

```
/signup
    ├── Homeowner → /signup/homeowner → schedule OR lead capture
    ├── Interior Designer → /signup/designer → /dashboard/designer/welcome → /plans
    ├── Home Designer/BIM → /signup/bim [PLACEHOLDER]
    └── Builder → /signup/builder → /dashboard/builder/welcome → service menu → /plans (if Tier 2/3)

/plans
    ├── Tier 1 → project submission flow (no subscription)
    ├── Tier 2 → Stripe subscription → dashboard unlocked
    └── Tier 3 → contact form → manual activation by admin

/account/settings
    └── Role switching → modal confirmation → dashboard updates
```

---

## SUPABASE DATA MODEL IMPLICATIONS (NOTES FOR OPUS)

Each account record should include at minimum:
- `user_id`
- `role` (homeowner / interior_designer / bim / builder / admin)
- `tier` (null / tier_1 / tier_2 / tier_3)
- `status` (lead / onboarding / active / suspended)
- `company_name` (builders required, others optional)
- `onboarding_complete` (boolean)
- `tier_1_credits_remaining` (integer — for Tier 2 annual credit tracking)
- `brand_book_url` (Supabase storage reference)
- `created_at`
- `last_login`

Admin role is NOT selectable at signup. Admin accounts are created directly in Supabase by the owner.

---

*Next flow to map: Public Site — hero, routing, audience funnels*  
*Then: Professional Dashboard — designer and builder experience*  
*Then: Admin Environment*
