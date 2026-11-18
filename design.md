# design.md — Visual identity

> Status: **Direction chosen (2026-11-18): B's layout (soft and cosy) with A's colours (bold and playful).** Font pairing still to confirm.
> Mockups: https://claude.ai/artifact/DEc9u6G4gwVsUBv3uHCnnY (artboard "Chosen").
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

**Decision:** B's layout + A's colours.
- **From B (layout):** big rounded cards (32 px), soft pill buttons with words ("Not for me" / "Say hi"), a calm one-card deck, a ring for the match score, the "why you match" callout.
- **From A (colour):** cream ground, black ink outlines (2 px), hot-pink accent, sunny yellow highlight, pastel tag pills.
- **Dropped from A:** hard offset shadows and the tilted card (too loud next to soft shapes).
- **Font pairing (to confirm):** default Bricolage Grotesque + DM Sans; alternative Fraunces + Nunito (switchable in the mockup's Tweaks).

## 3. Design tokens

**Light theme (default)**

| Token | Value | Use |
|---|---|---|
| `color.bg` | `#FFF7E8` | App background (cream) |
| `color.surface` | `#FFFFFF` | Cards, sheets, nav |
| `color.ink` | `#1A1A1A` | Text, outlines, icons |
| `color.text-muted` | `#4A4A4A` | Secondary text (passes AA on cream and white) |
| `color.border` | `#1A1A1A`, 2 px | Card, button and chip outlines |
| `color.primary` | `#FF5C93` | Main action ("Say hi"), match ring. **Text on it is ink, never white** (white fails contrast) |
| `color.highlight` | `#FFE45C` | Active nav pill, filter button, small highlights |
| `color.callout` | `#FFF1B8` | "Why you match" box |
| `color.tag.pink / butter / sky / mint` | `#FFD1E0` / `#FFE9B8` / `#DCE6FF` / `#C9F2D9` | Lifestyle tag pills (ink text) |
| `color.verified` | `#C9F2D9` + ink outline + shield icon | Verified badge (same in every theme) |
| `color.photo-placeholder` | `#8FB3FF` | Empty photo slots |
| `color.success / warning / danger` | `#22C27A` / `#FFB020` / `#C8323C` | Status; danger text on white uses `#C8323C` |

**Dark theme (draft: to test on real screens)**

| Token | Value |
|---|---|
| `color.bg` | `#15130F` |
| `color.surface` | `#211E19` |
| `color.ink` (text) | `#FFF7E8` |
| `color.text-muted` | `#C9C1B3` |
| `color.border` | `#FFF7E8` at 2 px |
| Accent, highlight, tag colours | Same as light; text on them stays `#1A1A1A` |

**Shape, space, type, motion**

```
radius.sm 12 · radius.md 20 · radius.lg 32 (cards) · radius.pill 999
border.width 2
shadow: none (flat; outlines carry the structure)
space: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 48
font.display: Bricolage Grotesque 700/800 (alt: Fraunces 600)
font.body: DM Sans 400/500/700 (alt: Nunito 400/600/700)
text: 12 · 13 · 14 · 15 · 16 · 20 · 24 · 26 · 32 · 40
touch target: 44 px minimum; primary buttons 56 px tall
motion.fast 120ms · motion.base 200ms · motion.slow 320ms
motion.swipe: spring (gentle, little overshoot); match moment: one celebratory burst
all motion off under prefers-reduced-motion
```

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
