# Android GPU Safe Mode Audit Report

## Activation
Android GPU Safe Mode is enabled before first paint via `src/routes/__root.tsx` when the device is Android and any constrained signal is present: `deviceMemory <= 4`, `hardwareConcurrency <= 4`, Save-Data, reduced motion, or unknown Android memory.

## Global compositor kill-switch
`src/styles.css` now applies the final `html[data-android-gpu-safe-mode="true"]` override at the end of the stylesheet so component utilities cannot reintroduce GPU layers. It removes transforms, 3D perspective, filters, backdrop filters, blend modes, masks, clip paths, will-change, containment, isolation, content-visibility, animations, transitions, shadows, and floating/fixed UI promotion triggers.

## Components that previously created GPU/compositor layers and are now neutralized in Safe Mode
- `src/components/site/HeroCarousel.tsx` — 3D transforms, perspective, masks, blur/glow layers, autoplay carousel. Safe Mode renders one static hero card only.
- `src/routes/index.tsx` — hero ambient glow, search dropdown animation, category hover transforms, gradient blur layers. Safe Mode global CSS removes motion/effects and delayed product sections reduce initial render pressure.
- `src/components/site/ProductCard.tsx` — hover transforms, shadow glow, backdrop-filter icon buttons, card containment. Safe Mode makes cards static DOM and strips GPU triggers globally.
- `src/components/site/AdaptiveProductMedia.tsx` — palette transition and hover scale. Safe Mode uses static white media background and skips palette/canvas work.
- `src/components/site/ProductImage.tsx` — image decode/texture churn. Safe Mode uses small WebP thumbnails, `loading="lazy"`, `decoding="async"`, `fetchpriority="low"`, stable keyed images, and one-at-a-time decode queue.
- `src/components/site/PromoBannerCarousel.tsx` — autoplay, fade animation, glass controls, translate centering. Existing Android/low-end autoplay guard plus Safe Mode CSS flatten controls/effects.
- `src/components/site/FlashDeals.tsx` — hover transforms, will-change, glow animations, blur ambience, backdrop-filter icon buttons. Safe Mode CSS strips these; homepage loads it only after scroll in Safe Mode.
- `src/components/site/TestimonialsCarousel.tsx` — autoplay slider/motion path. Safe Mode disables the carousel on homepage.
- `src/components/site/Reveal.tsx` / `motion-primitives.tsx` — Framer Motion reveal layers. Safe Mode returns plain static divs.
- `src/components/site/LazyMount.tsx` — observer reveal mounting. Safe Mode mounts static content without observer animation.
- `src/components/site/Nav.tsx` — sticky header transform/opacity hide animation, glass blur, logo glow. Android already disables scroll hiding; Safe Mode CSS removes blur, shadows, transitions and transforms.
- `src/components/site/MobileBottomNav.tsx` — fixed floating glass bottom bar. Safe Mode CSS makes it static/non-floating and removes blur/effects.
- `src/components/chat/LiveChat.tsx` and deferred overlays — skipped on ultra/safe Android via `DeferredShell`; global Safe Mode CSS also strips fixed/floating effects if mounted.

## Remaining intentional compositor candidates
None on the homepage in Android GPU Safe Mode. The only remaining non-normal-flow UI is browser-native scrolling and normal `position: sticky` header behavior, with transform/filter/contain/will-change removed.

## Minimal root fix
The root fix is the first-paint `data-android-gpu-safe-mode` flag plus the final CSS kill-switch in `src/styles.css`, combined with the static hero and safe image decode path.

## Why it only happens on certain Android devices
Low-end MediaTek/Mali Android Chrome devices have limited GPU texture memory and weaker compositor tile invalidation. Rapid reuse of transformed/filtered/contained DOM layers plus image texture churn can leave stale tiles on screen, causing duplicated text, black flashes, and colored rectangles. Higher-end devices usually have enough GPU memory and faster tile invalidation, so the same effects do not visibly corrupt.