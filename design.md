# design.md — Visual identity

> Status: **Direction not chosen yet.** Three mockups (bold and playful, soft and cosy, dark and premium) are being made; tokens below get filled in once one is picked.
> Audience: Gen Z and young professionals in India, mostly on phones.

---

## 1. Principles (fixed, whatever the style)

1. **Mobile-first.** Design at 360–390 px width first; desktop is a wider layout of the same screens.
2. **Fun on top, trust underneath.** Playful motion and copy, but safety signals (verified badges, masked numbers, report button) are always clear and never hidden by decoration.
3. **Explain, don't just score.** Every match shows *why*, in plain words.
4. **One main action per screen.** Swipe deck: like / pass. Chat: send. House hub: add expense / mark done.
5. **Accessible by default.** WCAG AA contrast, 44 px minimum touch targets, full keyboard support on web, alt text on photos, and every animation respects `prefers-reduced-motion`.
6. **Fast on cheap phones and slow networks.** Images optimised, skeleton loaders, no layout shift.

## 2. Candidate directions

| Direction | Feel | Colour idea | Type idea | Motion |
|---|---|---|---|---|
| **A. Bold and playful** | Social app, loud and fun | Saturated primaries, sticker accents | Chunky rounded display font + clean sans | Bouncy springs, confetti on match |
| **B. Soft and cosy** | Home, calm, safe | Warm pastels, cream background | Friendly rounded sans, hand-drawn accents | Gentle fades and eases |
| **C. Dark and premium** | Fintech / music-app polish | Near-black base, one neon accent | Tight geometric sans | Smooth, subtle micro-interactions |

**Decision:** _pending_. Record the choice and reasons in `memory.md`.

## 3. Design tokens *(fill in after the choice)*

```
color.bg / color.surface / color.surface-raised
color.text / color.text-muted
color.primary / color.primary-contrast
color.accent
color.success / color.warning / color.danger
color.verified          # the badge colour: same in every theme
radius.sm / md / lg / pill
space: 4 · 8 · 12 · 16 · 24 · 32 · 48
font.display / font.body / font.mono
text: 12 · 14 · 16 · 20 · 24 · 32 · 40
shadow / border: per direction
motion.fast 120ms · motion.base 200ms · motion.slow 320ms; spring presets
```

Light and dark themes are both required.

## 4. Core components (to design)

- Profile card (swipe deck): photos, name, age, college/company, verified badge, top 3 vibe tags, match score ring.
- Match score ring + "why you match" sheet.
- Vibe quiz: one question per screen, big tappable options, progress bar.
- Chat: bubbles, masked-number notice, safety banner, report/block menu.
- Listing card + rough-area map.
- Meetup planner + check-in prompt.
- House hub: expense list, "who owes whom" summary, UPI pay button, chore wheel, reminders.
- Empty states, error states and skeletons for every screen.
- Badges: verified student, ID verified (later), women-only mode.

## 5. Voice and copy

- Casual, warm, short; English first (Hindi/Tamil later).
- Safety copy is clear and never jokey.
- Example: "You both sleep before midnight and hate dirty dishes. Talk about: weekend guests."
