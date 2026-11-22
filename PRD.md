# PRD — Vibecheck Homes

> Working name. Product requirements: the problem, who it's for, what we build and how we know it works.
> Status: **Draft v0.1 (2026-11-18)**, Phase 0 (planning). Owner: Amit Reddy.

---

## 1. Problem

In Indian cities, people pick a flatmate after one WhatsApp call and then sign an 11-month rent agreement with them.
Mismatched sleep schedules, cleanliness, guests, smoking, food habits and money issues show up only after moving in, when leaving is expensive.

Existing options:

- **Facebook / WhatsApp groups and brokers:** no verification, lots of fake listings and deposit scams, no compatibility signal.
- **Listing platforms (FlatMate.in, FlatX, NoBroker-style):** good at flats; some already offer match scores, hidden-number chat and identity checks. Matching alone is no longer a differentiator.
- **Nothing helps after the match:** splitting bills, chores, reminders and house rules happen in messy group chats.

## 2. Vision

> **Find people you can actually live with, and keep living well together.**

Vibecheck Homes is a trust-first flatmate app for Gen Z and young professionals in India:
deep compatibility matching → safe chat → verified meetups → a shared house hub after moving in.

## 3. Target users (launch: Chennai)

| Persona                           | Who                                                    | Main pain                            | What they need from us                                   |
| --------------------------------- | ------------------------------------------------------ | ------------------------------------ | -------------------------------------------------------- |
| **Campus seeker**                 | College student (e.g. SRM, near OMR) moving off-campus | Doesn't know anyone; scared of scams | Campus-verified matches, safe chat, budget fit           |
| **Fresher / young professional**  | 21–28, new job in Chennai                              | New city, short notice, no network   | Fast compatible matches near the office, verified people |
| **Room holder**                   | Has a flat, needs to fill a room                       | Strangers, no-shows, flaky people    | Serious, verified applicants who fit the house           |
| **Women seekers** (cross-cutting) | Any of the above                                       | Safety                               | Women-only mode, verified-only chat, meetup check-ins    |

**Out of scope for launch:** landlords and brokers listing whole flats, families, and anyone under 18.

## 4. Differentiators (in build order)

1. **Deep compatibility:** a rich "vibe quiz" (sleep, cleanliness, guests, noise, food, smoking, pets, work pattern, budget, commute) with an **explainable** match score ("why you two match" plus the one thing to talk about).
2. **Campus-first trust:** college-email verification gives a "verified student" badge for free; real ID verification (DigiLocker via a provider) comes once there's revenue.
3. **Women-first safety:** women-only mode, chat only with verified users, masked phone numbers, report/block, meetup safety check-ins.
4. **Life after the match (house hub):** shared expenses (record only; payment through the user's own UPI app), chore rotation, reminders, and a house-rules agreement.

## 5. Goals and non-goals

**Goals (beta)**

- G1: A new user finishes onboarding (profile + vibe quiz) in **≤ 5 minutes**.
- G2: Every match shows a score breakdown the user can understand.
- G3: No phone number, exact address or ID document is ever shown to another user without consent.
- G4: The core app runs within free tiers until revenue (see Architecture.md §9).
- G5: Meets DPDP Act duties in the product: notice, consent, access, correction, erasure, breach handling.

**Non-goals (for now)**

- Holding or moving money (no wallet or escrow: avoids payment-regulation territory).
- Rent agreements, e-stamping, broker features.
- Multi-city launch, native iOS before Phase 9, a learned ML ranker before there's enough interaction data.

## 6. Features by phase

Acceptance criteria are the minimum for a phase to count as done. Full task breakdown: `task.md`.

| Phase | Feature                  | Acceptance criteria (summary)                                                                                                                                                                           |
| ----- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0     | Foundation               | Monorepo builds; CI green on PR; staging deploy on merge; nightly DB backup job; docs in place                                                                                                          |
| 1     | Sign-up and profile      | Google + email-link sign-in; 18+ gate; consent notice stored; profile with photos (type/size checked, private bucket); vibe quiz saved; college-email verification sets badge                           |
| 2     | Matching                 | Hard filters + weighted score in Postgres; swipe deck; mutual like → match; "why you match" (top 3 reasons + 1 conflict); no profile shown that fails a hard filter                                     |
| 3     | Chat + safety            | Realtime 1:1 chat only after a match; phone/links masked until both opt in; report and block (blocked user disappears both ways); women-only mode; verified-only chat setting; meetup check-in reminder |
| 4     | Listings                 | "Have a room" / "Need a room" posts; map shows a rough area only (never the exact address); duplicate-photo detection                                                                                   |
| 5     | AI v1                    | Chat-style onboarding agent fills the quiz; LLM match explainer; scam/abuse classifier on listings and messages; every AI feature has an eval set and a fallback                                        |
| 6     | Hardening + Chennai beta | Security review against rules.md checklist; DPDP review; load test; Sentry + analytics live; beta invite flow                                                                                           |
| 7     | House hub                | Household with members; expense log + "who owes whom" + UPI deep link; chore rotation; reminders; house-rules agreement (AI-drafted, members accept)                                                    |
| 8     | Money                    | Razorpay: boosted listings, premium matching; paid hosting tiers; paid ID verification on                                                                                                               |
| 9     | Mobile                   | Expo app reusing shared packages; Play Store then App Store                                                                                                                                             |
| 10    | ML v2                    | Learning-to-rank from swipes, chats and meetups; A/B tested against rule-based scoring                                                                                                                  |

### 6.1 Phase 1 decisions (2026-11-21)

- **Discoverable** (shown in others' decks) only when all of these are filled in:
  - Basics: first name, date of birth (18+), gender, student or working.
  - Housing: budget range, preferred area, move-in month, "need a room" or "have a room".
  - College or company name.
  - At least 1 photo.
  - Vibe quiz finished, and consent given.
- **Gender:** Woman / Man / Non-binary / Prefer not to say. Everyone chooses who they're open to living with; women-only mode (Phase 3) is available to women.
- **Verification:** optional badge for a verified college or work email. It unlocks a "verified only" filter for others. Paid ID verification comes later (Phase 8).
- **Vibe quiz v1: 12 quick cards (~2 minutes), one tap each.** Draft below; wording to be finalised in T1.5.

| #   | Question                     | Options                                                            |
| --- | ---------------------------- | ------------------------------------------------------------------ |
| 1   | When do you usually sleep?   | Before 11 pm · 11 pm–1 am · After 1 am                             |
| 2   | When do you usually wake up? | Before 7 am · 7–9 am · After 9 am                                  |
| 3   | How tidy is your space?      | 1 (lived-in) to 5 (spotless)                                       |
| 4   | Dirty dishes get washed…     | Right away · By the end of the day · When I need them              |
| 5   | Friends coming over?         | Rarely · Weekends · Often                                          |
| 6   | Overnight guests?            | Never · Sometimes · Anytime is fine                                |
| 7   | Home vibe?                   | Quiet · Occasional get-togethers · Love hosting                    |
| 8   | Food at home?                | Veg only · Eggetarian · Non-veg                                    |
| 9   | Smoking?                     | No · Outside only · Yes                                            |
| 10  | Drinking at home?            | No · Occasionally · Yes                                            |
| 11  | Pets?                        | No pets please · Have a pet · Love pets                            |
| 12  | Your weekday routine?        | Out all day (college/office) · Work/study from home · Night shifts |

## 7. Business model

- **Free:** profile, quiz, matching, chat, basic house hub.
- **Paid (Phase 8):** listing boosts and "verified listing" for room holders; premium (see who liked you, more daily swipes, priority in decks, advanced filters); paid ID verification passed through at cost or bundled.
- **Later:** partnerships with co-living operators, movers and furniture rental (referral fees).

## 8. Success metrics

| Metric                            | Why                | Beta target (to validate) |
| --------------------------------- | ------------------ | ------------------------- |
| Onboarding completion rate        | Funnel health      | ≥ 60%                     |
| Match rate (mutual likes / likes) | Matching quality   | Track baseline            |
| Chat → meetup rate                | Real intent        | Track baseline            |
| Reports per 1,000 users           | Safety             | Falling over time         |
| Households created                | House-hub adoption | Track after Phase 7       |
| D30 retention                     | Product–market fit | Track baseline            |

## 9. Constraints

- **Budget:** free tiers only until revenue (see Architecture.md §9 for limits and upgrade triggers).
- **Team:** solo developer, 10–20 hrs/week, no fixed beta date; each phase ships when solid.
- **Legal:** DPDP Act 2023 + DPDP Rules 2025 (main obligations from 13 May 2027); 18+ only; never store Aadhaar numbers; ID checks only through a licensed provider.
- **Platforms:** responsive web first (mobile browser is the main screen size), Expo app later.

## 10. Risks

See the top-risks section on the Whiteboard and `Architecture.md` §11. The biggest: cold start (launch in one area), safety/fraud, and scope creep.

## 11. Open questions

- [x] UI direction: B's soft layout + A's bold colours; fonts Bricolage Grotesque + DM Sans (see `design.md`).
- [ ] Final brand name and domain (check trademark before launch).
- [ ] Which colleges and areas to seed first in Chennai.
- [ ] Free LLM provider for Phase 5 (must not train on user data).
