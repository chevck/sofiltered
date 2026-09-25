# 001 — Fix the mobile process-card stacking scroll effect

- **Status**: DONE
- **Commit**: 0b4ad66
- **Severity**: HIGH
- **Category**: Physicality & origin / Interruptibility / Performance
- **Estimated scope**: 2 files (css/style.css, js/main.js), no new dependencies

## Problem

The "Our Process" section on `index.html` (`.process-grid` of four `.process-stack-item` wrappers, each containing a `.process-card`) has a mobile-only (`max-width: 560px`) stacking effect: each card is `position: sticky` at a staggered `top`, so scrolling should pin one card while the next slides over it. The user's own words: "we have gotten the overlaying boxes but it's not coming out as well as it should... let's make it work and scroll better." Three concrete defects cause this:

**1. Cards have no fixed height, so the "stack" is uneven.** `css/style.css:1318-1328`, current:

```css
.process-card {
  position: relative;
  z-index: 1;
  border-radius: var(--radius-lg);
  padding: 36px 28px;
  min-height: 220px;
  box-shadow: 0 10px 30px rgba(54, 0, 25, 0.1);
  transition:
    transform 0.3s var(--ease),
    box-shadow 0.3s var(--ease);
}
```

`min-height` lets each card grow to fit its own copy length. The four cards have different paragraph lengths (see `index.html:240-287`), so they render at different heights. A stacked-cards effect only reads cleanly when every card is the same size — otherwise the "sliver" of the previous card peeking out from under the next is a different, inconsistent height for every pair, which looks like a layout bug rather than a deliberate stack.

**2. The scroll runway is too long relative to the payoff.** `css/style.css:1285-1316`, current:

```css
@media (max-width: 560px) {
  .process-grid {
    grid-template-columns: 1fr;
  }

  /* stacking-cards reveal: each card pins near the top, staggered, so the
     next one slides over it leaving a sliver of the previous one visible */
  .process-stack-item:not(:last-child) {
    min-height: 62vh;
  }

  .process-stack-item .process-card {
    position: sticky;
  }

  .process-stack-item:nth-child(1) .process-card {
    top: 100px;
    z-index: 1;
  }
  .process-stack-item:nth-child(2) .process-card {
    top: 132px;
    z-index: 2;
  }
  .process-stack-item:nth-child(3) .process-card {
    top: 164px;
    z-index: 3;
  }
  .process-stack-item:nth-child(4) .process-card {
    top: 196px;
    z-index: 4;
  }
}
```

`62vh` of empty runway per card (three times, since the last card doesn't need one) means the user scrolls roughly two full extra screens of blank space with nothing visibly changing before the next card arrives. That reads as "broken" or "stuck," not smooth. The 32px stagger between `top` values is also too small to read clearly as a fanned stack once cards are a uniform height — it needs to be a fraction the reader can actually perceive as "peeking out."

**3. Native `position: sticky` is a hard snap, not an animation — there's no transition as one card gets covered.** The cards just jump into their overlapping z-order with no easing, scale, or fade, which is why it feels flat/mechanical ("not coming out as well as it should") rather than smooth. There is no code to cite for this because it's an absence: nothing currently varies `transform`/`opacity` on a card as its coverage changes.

**Secondary interaction bug**: every `.process-card` also carries the site-wide scroll-reveal attribute (`index.html:240` etc., `data-reveal`), whose base rule is `css/style.css:2177-2183`:

```css
[data-reveal] {
  opacity: 0;
  transform: translateY(28px);
  transition:
    opacity 0.7s var(--ease),
    transform 0.7s var(--ease);
}
[data-reveal].is-visible {
  opacity: 1;
  transform: translateY(0);
}
```

This is fine off mobile, but on the stacked layout it means each card's entrance is a 28px vertical slide happening at the same time it may already be engaging `position: sticky` — the two positional systems (reveal's `translateY` and sticky's `top` snap) fight for the same frames right as a card arrives, adding to the janky feel. On mobile, the stacked cards should only fade in place, not also slide.

## Target

**1. Uniform card height on mobile.** Add to the existing `@media (max-width: 560px)` block in `css/style.css`:

```css
@media (max-width: 560px) {
  .process-stack-item .process-card {
    height: 300px;
    overflow: hidden;
  }
}
```

(Merge into the existing `@media (max-width: 560px)` block from Problem #1/#2 — do not create a second, duplicate media query.)

**2. Shorter, punchier runway and a clearer stagger.** Replace the values in that same block:

```css
@media (max-width: 560px) {
  .process-grid {
    grid-template-columns: 1fr;
  }

  .process-stack-item .process-card {
    height: 300px;
    overflow: hidden;
  }

  .process-stack-item:not(:last-child) {
    min-height: 42vh;
  }

  .process-stack-item .process-card {
    position: sticky;
    transition:
      transform 0.3s var(--ease-collect),
      opacity 0.3s var(--ease-collect);
  }

  .process-stack-item:nth-child(1) .process-card {
    top: 96px;
    z-index: 1;
  }
  .process-stack-item:nth-child(2) .process-card {
    top: 144px;
    z-index: 2;
  }
  .process-stack-item:nth-child(3) .process-card {
    top: 192px;
    z-index: 3;
  }
  .process-stack-item:nth-child(4) .process-card {
    top: 240px;
    z-index: 4;
  }
}
```

`--ease-collect` is `cubic-bezier(0.16, 1, 0.3, 1)`, already defined in `css/style.css:32` — reuse it, don't invent a new curve. The 48px stagger (96 → 144 → 192 → 240) against a 300px fixed card height leaves a clean, clearly-visible 48px sliver of each covered card.

**3. Scroll-linked cover transition in JS**, added to `js/main.js` immediately after the existing mosaic-drift block (`js/main.js:30-55`), following that block's own convention exactly (same `prefersReducedMotion` variable already declared there, same rAF-batched passive-scroll pattern):

```js
/* Process cards (mobile stack): scale/fade a card slightly as the next one covers it */
const processStackCards = document.querySelectorAll(".process-stack-item .process-card");
const processStackMql = window.matchMedia("(max-width: 560px)");
if (processStackCards.length && !prefersReducedMotion) {
  let stackTicking = false;
  const updateStack = () => {
    if (!processStackMql.matches) {
      processStackCards.forEach((card) => {
        card.style.transform = "";
        card.style.opacity = "";
      });
      stackTicking = false;
      return;
    }
    processStackCards.forEach((card, i) => {
      const next = processStackCards[i + 1];
      if (!next) {
        card.style.transform = "";
        card.style.opacity = "";
        return;
      }
      const cardTop = card.getBoundingClientRect().top;
      const nextTop = next.getBoundingClientRect().top;
      const gap = nextTop - cardTop;
      const coverDistance = 48;
      const progress = Math.min(1, Math.max(0, 1 - gap / coverDistance));
      const scale = 1 - progress * 0.04;
      const opacity = 1 - progress * 0.15;
      card.style.transform = `scale(${scale})`;
      card.style.opacity = String(opacity);
    });
    stackTicking = false;
  };
  document.addEventListener(
    "scroll",
    () => {
      if (!stackTicking) {
        requestAnimationFrame(updateStack);
        stackTicking = true;
      }
    },
    { passive: true }
  );
  window.addEventListener("resize", () => {
    if (!stackTicking) {
      requestAnimationFrame(updateStack);
      stackTicking = true;
    }
  });
  updateStack();
}
```

This only ever writes `transform`/`opacity` (Performance category — no layout properties touched), reuses the already-declared `prefersReducedMotion` from the mosaic block instead of re-querying `matchMedia` a second time, and does nothing at desktop widths (checked live via `processStackMql.matches` on every tick, since the user can resize/rotate).

**4. Stop `data-reveal` from sliding stacked cards.** Add to the same `@media (max-width: 560px)` block in `css/style.css`:

```css
@media (max-width: 560px) {
  .process-stack-item .process-card[data-reveal] {
    transform: none;
  }
  .process-stack-item .process-card[data-reveal].is-visible {
    transform: none;
  }
}
```

This keeps the opacity fade-in (still governed by the base `[data-reveal]` rule) but removes the competing `translateY(28px)` slide specifically for stacked cards, per `AUDIT.md` §6: reduced/simplified motion should drop position changes while keeping opacity feedback — the same principle applies here even outside `prefers-reduced-motion`, because the position change is actively fighting the sticky mechanic, not just redundant.

## Repo conventions to follow

- Easing tokens live in `css/style.css:29-33` (`:root`); this plan reuses `--ease-collect` (`cubic-bezier(0.16, 1, 0.3, 1)`), already used for the hero's page-load animations — do not add a new curve.
- The rAF-batched passive-scroll pattern is established at `js/main.js:30-55` (mosaic drift) — the new process-stack handler in Target §3 must follow that exact shape (a `*Ticking` boolean flag, `requestAnimationFrame`, `{ passive: true }`), including reusing the single `prefersReducedMotion` constant already declared at `js/main.js:32` rather than calling `window.matchMedia("(prefers-reduced-motion: reduce)")` again.
- All existing mobile-only CSS for this feature already lives in one `@media (max-width: 560px)` block at `css/style.css:1285-1316` — every CSS change in this plan merges into that same block; do not create a second `@media (max-width: 560px)` block elsewhere in the file.

## Steps

1. In `css/style.css`, inside the existing `@media (max-width: 560px) { ... }` block that currently contains `.process-grid`, `.process-stack-item:not(:last-child)`, `.process-stack-item .process-card`, and the four `:nth-child(...) .process-card` rules (lines 1285-1316): change `.process-stack-item:not(:last-child) { min-height: 62vh; }` to `min-height: 42vh;`.
2. In that same block, add `height: 300px; overflow: hidden;` to the existing `.process-stack-item .process-card { position: sticky; }` rule, and add `transition: transform 0.3s var(--ease-collect), opacity 0.3s var(--ease-collect);` to it as well (merge into the same rule, don't duplicate the selector).
3. In that same block, change the four `top` values: `nth-child(1)` → `96px`, `nth-child(2)` → `144px`, `nth-child(3)` → `192px`, `nth-child(4)` → `240px`. Leave the `z-index` values (1, 2, 3, 4) unchanged.
4. In that same block, add the two `[data-reveal]` override rules from Target §4.
5. In `js/main.js`, immediately after the mosaic-drift block ends (after the `}` that closes `if (mosaicRows.length && !prefersReducedMotion) { ... }`, i.e., after current line 55), insert the full script block from Target §3 verbatim.

## Boundaries

- Do NOT touch the desktop/tablet (`min-width: 561px`) process-grid layout, `.process-card:nth-child(odd/even)` coloring, or `.process-card__icon` rules — this plan is scoped to the mobile (`max-width: 560px`) stacking behavior only.
- Do NOT touch `services.html`'s process section or any `.process-card` usage there — it does not use `.process-stack-item` and must not be affected. Verify after the change that `grep -n "process-stack-item" services.html` returns nothing.
- Do NOT change the four process-card copy blocks, icons, or numbers in `index.html` — markup structure (the `.process-stack-item` wrappers) already exists from the prior turn; this plan only changes CSS values inside the existing media query and adds one new JS block.
- Do NOT introduce a new easing token or duration scale — reuse `--ease-collect` and stay under the 300ms UI budget from `AUDIT.md` (this plan uses 300ms).
- If the existing mobile media query block at `css/style.css:1285-1316` does not match the current-code excerpts in this plan when you go to edit it (drift since commit `0b4ad66`), STOP and report instead of improvising.

## Verification

- **Mechanical**: this is a static HTML/CSS/JS site with no build step. Open `index.html` (or the already-running local server) in a browser; open DevTools console and confirm no JS errors on page load and on scroll.
- **Feel check** (use DevTools device toolbar at a 375×812 or similar mobile viewport, or an actual phone):
  - Scroll through the "Our Process" section. Each card should visibly pin in place for a noticeable-but-not-tedious beat, then the next card should slide up and settle, covering all but roughly the top 48px of the previous card.
  - All four cards should be the same height — check with DevTools that no card's text overflows its box; if any paragraph clips, either shorten the fixed height increase (e.g., `320px`) or reduce `.process-card p` font-size slightly, and note the change.
  - As a card is about to be covered, it should visibly shrink slightly and dim (the scale/opacity effect from Target §3) rather than instantly snapping under the next card with no transition.
  - In DevTools' Rendering panel, enable "Emulate CSS media feature prefers-reduced-motion: reduce" and confirm: the cards still stack (sticky positioning itself is not gated, per `AUDIT.md` §6 — reduced motion removes movement/animation, not the fundamental layout), but the scale/opacity JS effect and the `data-reveal` slide are both suppressed — cards should simply appear (opacity only) with no scale change as they stack.
  - Resize the viewport from mobile to desktop width while the page is scrolled into the process section, and confirm the JS effect's inline `transform`/`opacity` styles clear (via the `processStackMql.matches` check in Target §3) so the desktop 4-column grid looks completely normal with no leftover scale/opacity from the mobile code path.
  - Confirm `services.html`'s "Our Process" section is pixel-identical to before this change (no `.process-stack-item` present there, so it should be untouched).
- **Done when**: scrolling through the section on a mobile viewport shows four uniform-height cards cleanly fanning over each other with a visible peek of each prior card, a noticeably shorter/tighter scroll runway than before, a soft scale/fade as each card is covered, and the reduced-motion and desktop-resize fallbacks both verified per the feel check above.
