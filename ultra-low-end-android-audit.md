# Ultra Low-End Android GPU/Compositor Audit

Generated from a static scan of `src/**/*.tsx`, `src/**/*.ts`, and `src/**/*.css`. This report is intentionally focused on GPU/compositor instability, not generic React performance.

## Root cause with code evidence

The real-device symptoms (colored rectangles, smeared/duplicated text during scroll, random card blocks, black flashes) match Chrome Android GPU/compositor tile or texture corruption. The strongest code evidence is the combination of many promoted product layers plus image texture churn in dense scroll areas.

- **`src/components/site/HeroCarousel.tsx`** — 3D queue carousel creates simultaneous image compositor layers via perspective, translate3d, scale, rotateY, opacity, blur/grayscale/brightness/drop-shadow, mask-image and will-change.
- **`src/components/site/ProductCard.tsx`** — Every product card has hover transforms, large shadows, backdrop-filter buttons, badge shadows and add-to-cart transform/filter transitions; repeated across dense grids while scrolling.
- **`src/components/site/AdaptiveProductMedia.tsx`** — Product media previously used palette-driven background transitions, skeleton opacity reveal and hover scale while each card image decoded.
- **`src/components/site/ProductImage.tsx`** — Unmount cleanup removed src/srcset from recycled image nodes, forcing Chrome to tear down/recreate image textures during scroll on constrained Android GPUs.
- **`src/lib/image-palette.ts`** — Palette extraction creates a second Image decode and draws product imagery into canvas/getImageData; safe on desktop, but extra decode/canvas memory on 4GB Android.
- **`src/styles.css`** — Global visual system contains backdrop blur/glass, masks, shadows, transforms and animations. Ultra mode overrides must be last to prevent reintroduction.

This explains why iPhone/desktop are unaffected: they have different compositor implementations and more reliable texture recycling; the failing path is low-end Android Chrome + limited GPU memory + many promoted image/card layers.

## Components/files using compositor-layer-triggering CSS or classes

Terms scanned: `transform`, `translate3d`, `translateZ`, `translate`, `rotate`, `scale`, `perspective`, `filter`, `backdrop-filter`, `mix-blend-mode`, `isolation`, `contain`, `will-change`, `opacity`, `box-shadow`, `shadow-`, `drop-shadow`, `blur`, `mask`, `clip-path`, `animate-`, `animation`.

### `src/components/account/OrderDetailsDrawer.tsx`
- Summary: `animate-`×4, `blur`×3, `contain`×1, `filter`×12, `opacity`×4, `scale`×13, `shadow-`×1
  - L107: `filter` → `const slugs = (order?.order_items ?? []).map((i) => i.product_slug).filter(Boolean);`
  - L117: `filter` → `const eligible = (prods ?? []).filter((p) => p.return_eligible || p.replacement_eligible);`
  - L131: `filter` → `.filter((n) => n.data?.order_id === id || (n.link ?? "").includes(id))`
  - L163: `filter` → `.on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `id=eq.${orderId}` }, refresh)`
  - L164: `filter` → `.on("postgres_changes", { event: "*", schema: "public", table: "order_items", filter: `order_id=eq.${orderId}` }, refresh)`
  - L165: `filter` → `.on("postgres_changes", { event: "*", schema: "public", table: "shipments", filter: `order_id=eq.${orderId}` }, refresh)`
  - L167: `filter` → `.on("postgres_changes", { event: "*", schema: "public", table: "refunds", filter: `order_id=eq.${orderId}` }, refresh)`
  - L168: `filter` → `.on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, refresh)`
  - L330: `opacity` → `<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}`
  - L331: `blur` → `onClick={onClose} className="fixed inset-0 z-[80] bg-background/70 backdrop-blur-sm" aria-hidden />`
  - L336: `shadow-` → `className="fixed inset-x-0 bottom-0 z-[81] h-[92dvh] max-h-[92dvh] rounded-t-3xl border-t border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden"`
  - L336: `blur` → `className="fixed inset-x-0 bottom-0 z-[81] h-[92dvh] max-h-[92dvh] rounded-t-3xl border-t border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden"`
  - L351: `scale` → `aria-label="Copy order ID" className="size-6 grid place-items-center rounded-md border border-border/60 hover:border-accent/50 hover:text-accent active:scale-90 transition">`
  - L357: `scale` → `<button onClick={onClose} aria-label="Close" className="size-9 grid place-items-center rounded-full border border-border/60 hover:border-accent/50 active:scale-95 transition">`
  - L364: `contain` → `<div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-5">`
  - L366: `animate-` → `<div className="py-20 grid place-items-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>`
  - L436: `filter` → `<p className="text-[10px] text-muted-foreground">{[e.location, fmtDate(e.occurred_at, true)].filter(Boolean).join(" · ")}</p>`
  - L458: `filter` → `<p className="text-xs text-muted-foreground mt-2">{[order.shipping_address.line1, order.shipping_address.line2].filter(Boolean).join(", ")}</p>`
  - L466: `filter` → `].filter(Boolean).join(", ")} />`
  - L469: `scale` → `className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest px-3 py-2 rounded-full border border-border/60 hover:border-accent/40 hover:text-accent `
  - … 18 more matching lines omitted for brevity

### `src/components/admin/AIOperationsCenter.tsx`
- Summary: `animate-`×3, `blur`×1, `filter`×2, `opacity`×6, `scale`×4
  - L40: `opacity` → `<motion.section id={id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}`
  - L92: `scale` → `className={cn("text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded-full border inline-flex items-center gap-1 disabled:opacity-50 active:scale-95 transition-all",`
  - L92: `opacity` → `className={cn("text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded-full border inline-flex items-center gap-1 disabled:opacity-50 active:scale-95 transition-all",`
  - L112: `scale` → `className={cn("text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full border inline-flex items-center gap-1 disabled:opacity-50 active:scale-95 transition-all", ton`
  - L112: `opacity` → `className={cn("text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full border inline-flex items-center gap-1 disabled:opacity-50 active:scale-95 transition-all", ton`
  - L113: `animate-` → `{busy ? <Loader2 className="size-3 animate-spin" /> : icon} {label}`
  - L131: `blur` → `<div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} />`
  - L132: `scale` → `<motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ ease: EASE, duration: 0.3 }}`
  - L132: `opacity` → `<motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ ease: EASE, duration: 0.3 }}`
  - L153: `scale` → `className="text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 rounded-full border border-accent/40 bg-accent/15 text-accent inline-flex items-center gap-1 disabled:opacity`
  - L153: `opacity` → `className="text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 rounded-full border border-accent/40 bg-accent/15 text-accent inline-flex items-center gap-1 disabled:opacity`
  - L154: `animate-` → `{busy === rec.key ? <Loader2 className="size-3 animate-spin" /> : <Zap className="size-3" />} Execute now`
  - L194: `animate-` → `if (loading) return <div className="min-h-[40vh] grid place-items-center"><Loader2 className="size-5 animate-spin text-accent" /></div>;`
  - L200: `filter` → `const best = executed.filter((e) => (e.success_score ?? 0) >= 60);`
  - L201: `filter` → `const failed = executed.filter((e) => e.outcome === "failed" || (e.success_score ?? 100) < 40);`
  - L211: `opacity` → `initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02, ease: EASE }}`

### `src/components/admin/AISummaryCard.tsx`
- Summary: `opacity`×1
  - L23: `opacity` → `<motion.section id="ai-summary" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}`

### `src/components/admin/AcquisitionSummary.tsx`
- Summary: `animate-`×1
  - L53: `animate-` → `<div className="grid place-items-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>`

### `src/components/admin/AdminCommandCenter.tsx`
- Summary: `animate-`×2, `filter`×11, `opacity`×1, `translate`×1
  - L59: `filter` → `const filteredAutoCommands = useMemo(() => {`
  - L62: `filter` → `return autoCommands.filter((c) => `${c.label} ${c.keywords}`.toLowerCase().includes(q));`
  - L147: `filter` → `const filteredActions = useMemo(() => {`
  - L150: `filter` → `return quickActions.filter((a) => `${a.label} ${a.keywords ?? ""}`.toLowerCase().includes(q));`
  - L160: `filter` → `return GROUP_ORDER.map((g) => [g, map.get(g) ?? []] as const).filter(([, arr]) => arr.length);`
  - L174: `translate` → `<DialogContent className="overflow-hidden p-0 max-w-2xl gap-0 top-[12%] translate-y-0 sm:top-[15%]">`
  - L185: `animate-` → `<Loader2 className="size-3.5 animate-spin" /> Searching…`
  - L189: `filter` → `{!searching && !showIdle && grouped.length === 0 && filteredActions.length === 0 && !nlAction && (`
  - L263: `filter` → `{(grouped.length > 0 || nlAction) && filteredActions.length > 0 && <CommandSeparator />}`
  - L266: `filter` → `{filteredActions.length > 0 && (`
  - L268: `filter` → `{filteredActions.map((a) => (`
  - L279: `filter` → `{filteredAutoCommands.length > 0 && (`
  - L283: `filter` → `{filteredAutoCommands.map((c) => (`
  - L319: `opacity` → `className={`h-9 px-3 rounded-xl text-xs font-medium inline-flex items-center gap-2 ${confirmCmd?.danger ? "bg-rose-500 text-white" : "bg-accent text-accent-foreground"} disabled:op`
  - L320: `animate-` → `{running ? <Loader2 className="size-3.5 animate-spin" /> : null} Confirm`

### `src/components/admin/AdminCustomersTab.tsx`
- Summary: `animate-`×1, `filter`×1, `translate`×1
  - L58: `filter` → `const paying = useMemo(() => (rows ?? []).filter((c) => c.total_orders > 0).length, [rows]);`
  - L61: `animate-` → `return <div className="grid place-items-center py-10"><Loader2 className="size-5 animate-spin text-accent" /></div>;`
  - L72: `translate` → `<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />`

### `src/components/admin/AdminFloatingToolbar.tsx`
- Summary: `animate-`×1, `blur`×3, `filter`×1, `opacity`×4, `rotate`×1, `scale`×4, `shadow-`×2, `transform`×2, `translate`×1
  - L88: `scale` → `initial={{ opacity: 0, y: 12, scale: 0.96 }}`
  - L88: `opacity` → `initial={{ opacity: 0, y: 12, scale: 0.96 }}`
  - L89: `scale` → `animate={{ opacity: 1, y: 0, scale: 1 }}`
  - L89: `opacity` → `animate={{ opacity: 1, y: 0, scale: 1 }}`
  - L90: `scale` → `exit={{ opacity: 0, y: 12, scale: 0.96 }}`
  - L90: `opacity` → `exit={{ opacity: 0, y: 12, scale: 0.96 }}`
  - L92: `shadow-` → `className="mb-3 w-60 overflow-hidden rounded-2xl border border-accent/30 bg-background/80 p-2 backdrop-blur-2xl shadow-[0_20px_60px_-15px_oklch(0.74_0.19_49/0.45)]"`
  - L92: `blur` → `className="mb-3 w-60 overflow-hidden rounded-2xl border border-accent/30 bg-background/80 p-2 backdrop-blur-2xl shadow-[0_20px_60px_-15px_oklch(0.74_0.19_49/0.45)]"`
  - L141: `transform` → `"absolute top-0.5 size-4 rounded-full bg-white transition-transform",`
  - L142: `translate` → `adminMode ? "translate-x-[1.125rem]" : "translate-x-0.5",`
  - L157: `animate-` → `<span className="size-1.5 rounded-full bg-accent animate-pulse" /> Live`
  - L333: `scale` → `whileTap={{ scale: 0.94 }}`
  - L336: `blur` → `"flex items-center gap-2 rounded-full border border-accent/40 bg-background/70 px-4 py-3 backdrop-blur-2xl transition-all",`
  - L337: `shadow-` → `"shadow-[0_10px_40px_-10px_oklch(0.74_0.19_49/0.55)] hover:brightness-110",`
  - L343: `opacity` → `className="pointer-events-none absolute inset-0 -z-10 rounded-full opacity-60"`
  - L344: `filter` → `style={{ background: "var(--gradient-ember-soft)", filter: "blur(16px)" }}`
  - L344: `blur` → `style={{ background: "var(--gradient-ember-soft)", filter: "blur(16px)" }}`
  - L352: `transform` → `"size-4 text-accent transition-transform",`
  - L353: `rotate` → `open && "rotate-180",`

### `src/components/admin/AdminImageManager.tsx`
- Summary: `blur`×3, `opacity`×4, `shadow-`×1
  - L193: `shadow-` → `className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 rounded-full border border-accent/40 bg-background/70 px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest`
  - L193: `blur` → `className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 rounded-full border border-accent/40 bg-background/70 px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest`
  - L209: `opacity` → `initial={{ opacity: 0 }}`
  - L210: `opacity` → `animate={{ opacity: 1 }}`
  - L211: `opacity` → `exit={{ opacity: 0 }}`
  - L212: `blur` → `className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"`
  - L221: `blur` → `className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto border-l border-accent/20 bg-background/95 p-5 backdrop-blur-2xl"`
  - L350: `opacity` → `"grid size-7 place-items-center rounded-md border border-white/10 text-muted-foreground transition-all disabled:opacity-30",`

### `src/components/admin/AdminMobileBar.tsx`
- Summary: `blur`×5, `opacity`×5, `scale`×1, `shadow-`×5, `transform`×1
  - L90: `opacity` → `initial={{ opacity: 0 }}`
  - L91: `opacity` → `animate={{ opacity: 1 }}`
  - L92: `opacity` → `exit={{ opacity: 0 }}`
  - L93: `blur` → `className="absolute inset-0 bg-background/70 backdrop-blur-sm"`
  - L101: `shadow-` → `className="relative z-10 w-full rounded-t-3xl border-t border-accent/25 bg-background/95 px-4 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] pt-3 backdrop-blur-2xl shadow-`
  - L101: `blur` → `className="relative z-10 w-full rounded-t-3xl border-t border-accent/25 bg-background/95 px-4 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] pt-3 backdrop-blur-2xl shadow-`
  - L170: `opacity` → `className="absolute inset-x-10 bottom-[calc(var(--mobile-safe-bottom)+var(--mobile-nav-edge-gap))] h-16 -z-10 blur-3xl opacity-50"`
  - L170: `blur` → `className="absolute inset-x-10 bottom-[calc(var(--mobile-safe-bottom)+var(--mobile-nav-edge-gap))] h-16 -z-10 blur-3xl opacity-50"`
  - L174: `shadow-` → `className="pointer-events-auto relative flex h-[var(--mobile-nav-surface-height)] items-center justify-between gap-1 rounded-[26px] px-3 py-2.5 ring-1 ring-white/[0.09] shadow-[0_2`
  - L174: `blur` → `className="pointer-events-auto relative flex h-[var(--mobile-nav-surface-height)] items-center justify-between gap-1 rounded-[26px] px-3 py-2.5 ring-1 ring-white/[0.09] shadow-[0_2`
  - L185: `transform` → `className="relative -mt-7 grid size-14 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground shadow-[0_12px_30px_-8px_oklch(0.74_0.19_49/0.7)] ring-4 ring-backg`
  - L185: `scale` → `className="relative -mt-7 grid size-14 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground shadow-[0_12px_30px_-8px_oklch(0.74_0.19_49/0.7)] ring-4 ring-backg`
  - L185: `shadow-` → `className="relative -mt-7 grid size-14 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground shadow-[0_12px_30px_-8px_oklch(0.74_0.19_49/0.7)] ring-4 ring-backg`
  - L187: `opacity` → `<span aria-hidden className="pointer-events-none absolute inset-0 -z-10 rounded-full opacity-70 blur-md" style={{ background: "var(--gradient-ember-soft)" }} />`
  - L187: `blur` → `<span aria-hidden className="pointer-events-none absolute inset-0 -z-10 rounded-full opacity-70 blur-md" style={{ background: "var(--gradient-ember-soft)" }} />`
  - L221: `shadow-` → `className="absolute inset-0 rounded-2xl bg-accent shadow-[0_6px_16px_-8px_var(--color-accent),0_0_0_1px_oklch(1_0_0/0.12)_inset]"`
  - L230: `shadow-` → `active ? "bg-background text-accent" : "bg-accent text-accent-foreground shadow-[0_0_10px_var(--color-accent)]",`

### `src/components/admin/AdminNavDrawer.tsx`
- Summary: `blur`×2, `filter`×1, `opacity`×2, `scale`×1, `shadow-`×2, `translate`×1
  - L29: `scale` → `className="lg:hidden fixed top-3 left-3 z-40 size-10 grid place-items-center rounded-xl bg-background/70 backdrop-blur-xl border border-white/[0.08] hover:bg-white/[0.06] hover:bor`
  - L29: `shadow-` → `className="lg:hidden fixed top-3 left-3 z-40 size-10 grid place-items-center rounded-xl bg-background/70 backdrop-blur-xl border border-white/[0.08] hover:bg-white/[0.06] hover:bor`
  - L29: `blur` → `className="lg:hidden fixed top-3 left-3 z-40 size-10 grid place-items-center rounded-xl bg-background/70 backdrop-blur-xl border border-white/[0.08] hover:bg-white/[0.06] hover:bor`
  - L38: `opacity` → `initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}`
  - L40: `blur` → `className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"`
  - L53: `shadow-` → `<div className="relative h-full flex flex-col rounded-[1.75rem] overflow-hidden glass-strong glass-reflect" style={{ boxShadow: "var(--shadow-float), 0 0 50px -22px oklch(0.74 0.19`
  - L69: `filter` → `const items = g.items.filter(visibleItem);`
  - L87: `translate` → `<ChevronRight className="relative size-3.5 shrink-0 opacity-0 -translate-x-1 group-hover:opacity-50 group-hover:translate-x-0 transition-all duration-300" />`
  - L87: `opacity` → `<ChevronRight className="relative size-3.5 shrink-0 opacity-0 -translate-x-1 group-hover:opacity-50 group-hover:translate-x-0 transition-all duration-300" />`

### `src/components/admin/AdminOverlayIndicator.tsx`
- Summary: `blur`×1, `opacity`×6, `shadow-`×1, `translate`×1
  - L22: `opacity` → `initial={{ opacity: 0 }}`
  - L23: `opacity` → `animate={{ opacity: 1 }}`
  - L24: `opacity` → `exit={{ opacity: 0 }}`
  - L29: `opacity` → `initial={{ opacity: 0, y: -12 }}`
  - L30: `opacity` → `animate={{ opacity: 1, y: 0 }}`
  - L31: `opacity` → `exit={{ opacity: 0, y: -12 }}`
  - L33: `translate` → `className="fixed left-1/2 top-3 z-[56] -translate-x-1/2 print:hidden"`
  - L35: `shadow-` → `<div className="flex items-center gap-2 rounded-full border border-accent/40 bg-background/80 px-3 py-1.5 backdrop-blur-2xl shadow-[0_10px_30px_-10px_oklch(0.74_0.19_49/0.5)]">`
  - L35: `blur` → `<div className="flex items-center gap-2 rounded-full border border-accent/40 bg-background/80 px-3 py-1.5 backdrop-blur-2xl shadow-[0_10px_30px_-10px_oklch(0.74_0.19_49/0.5)]">`

### `src/components/admin/AdminProductPanel.tsx`
- Summary: `animate-`×2, `blur`×5, `opacity`×3, `shadow-`×1, `translate`×1
  - L280: `translate` → `<div className="fixed bottom-[calc(10.75rem+env(safe-area-inset-bottom))] left-1/2 z-40 w-[calc(100vw-1.5rem)] max-w-[420px] -translate-x-1/2 sm:bottom-6 sm:w-auto">`
  - L281: `shadow-` → `<div className="flex flex-wrap items-center justify-center gap-1 rounded-3xl border border-accent/30 bg-background/70 px-2 py-1.5 backdrop-blur-2xl shadow-[0_10px_40px_-10px_oklch(`
  - L281: `blur` → `<div className="flex flex-wrap items-center justify-center gap-1 rounded-3xl border border-accent/30 bg-background/70 px-2 py-1.5 backdrop-blur-2xl shadow-[0_10px_40px_-10px_oklch(`
  - L315: `opacity` → `initial={{ opacity: 0 }}`
  - L316: `opacity` → `animate={{ opacity: 1 }}`
  - L317: `opacity` → `exit={{ opacity: 0 }}`
  - L318: `blur` → `className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"`
  - L327: `blur` → `className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto border-l border-accent/20 bg-background/95 p-5 backdrop-blur-2xl"`
  - L565: `blur` → `className="sticky bottom-0 z-[var(--z-bottom-nav)] mt-6 -mx-5 border-t border-white/10 bg-background/95 px-5 pt-3 backdrop-blur-2xl"`
  - L573: `animate-` → `{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}`
  - L627: `blur` → `<div className="rounded-2xl border border-accent/20 bg-white/[0.02] p-3.5 backdrop-blur-xl">`
  - L672: `animate-` → `{props.saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}`

### `src/components/admin/AdminShell.tsx`
- Summary: `animate-`×9, `blur`×5, `drop-shadow`×1, `filter`×6, `opacity`×20, `scale`×4, `shadow-`×11, `transform`×3, `translate`×6
  - L180: `filter` → `const paid = rows.filter((o) => o.payment_status === "paid" || o.status === "paid" || o.status === "fulfilled");`
  - L201: `opacity` → `<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3">`
  - L202: `animate-` → `<Loader2 className="size-5 animate-spin text-accent" />`
  - L217: `opacity` → `initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}`
  - L252: `opacity` → `<div className="orb animate-orb -top-32 left-1/4 size-[28rem] opacity-30" style={{ background: "var(--gradient-ember-soft)" }} />`
  - L252: `animate-` → `<div className="orb animate-orb -top-32 left-1/4 size-[28rem] opacity-30" style={{ background: "var(--gradient-ember-soft)" }} />`
  - L253: `opacity` → `<div className="orb animate-float-soft bottom-0 right-0 size-[24rem] opacity-20" style={{ background: "var(--gradient-ember-soft)" }} />`
  - L253: `animate-` → `<div className="orb animate-float-soft bottom-0 right-0 size-[24rem] opacity-20" style={{ background: "var(--gradient-ember-soft)" }} />`
  - L257: `transform` → `<aside className={`fixed lg:sticky top-14 lg:top-0 bottom-0 left-0 z-30 lg:z-40 w-[17.5rem] transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:transfo`
  - L257: `translate` → `<aside className={`fixed lg:sticky top-14 lg:top-0 bottom-0 left-0 z-30 lg:z-40 w-[17.5rem] transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:transfo`
  - L259: `shadow-` → `<div className="relative h-full flex flex-col rounded-[1.75rem] overflow-hidden glass-strong glass-reflect" style={{ boxShadow: "var(--shadow-float), 0 0 50px -22px oklch(0.74 0.19`
  - L261: `opacity` → `<div className="orb animate-orb -top-16 -left-10 size-44 opacity-40" style={{ background: "var(--gradient-ember)" }} />`
  - L261: `animate-` → `<div className="orb animate-orb -top-16 -left-10 size-44 opacity-40" style={{ background: "var(--gradient-ember)" }} />`
  - L262: `opacity` → `<div className="orb animate-float-soft -bottom-20 -right-12 size-48 opacity-30" style={{ background: "var(--gradient-ember-soft)" }} />`
  - L262: `animate-` → `<div className="orb animate-float-soft -bottom-20 -right-12 size-48 opacity-30" style={{ background: "var(--gradient-ember-soft)" }} />`
  - L269: `transform` → `<span className="relative size-7 rounded-lg bg-gradient-to-br from-accent to-primary grid place-items-center shadow-[0_6px_20px_-10px_oklch(0.74_0.19_49_/_0.6)] transition-transfor`
  - L269: `scale` → `<span className="relative size-7 rounded-lg bg-gradient-to-br from-accent to-primary grid place-items-center shadow-[0_6px_20px_-10px_oklch(0.74_0.19_49_/_0.6)] transition-transfor`
  - L269: `shadow-` → `<span className="relative size-7 rounded-lg bg-gradient-to-br from-accent to-primary grid place-items-center shadow-[0_6px_20px_-10px_oklch(0.74_0.19_49_/_0.6)] transition-transfor`
  - L283: `opacity` → `initial={{ opacity: 0, y: 8 }}`
  - L284: `opacity` → `animate={{ opacity: 1, y: 0 }}`
  - … 45 more matching lines omitted for brevity

### `src/components/admin/AnnouncementAdminSheet.tsx`
- Summary: `animate-`×1, `blur`×2, `filter`×1, `opacity`×4
  - L148: `opacity` → `initial={{ opacity: 0 }}`
  - L149: `opacity` → `animate={{ opacity: 1 }}`
  - L150: `opacity` → `exit={{ opacity: 0 }}`
  - L151: `blur` → `className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm"`
  - L160: `blur` → `className="absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-3xl border-t border-accent/20 bg-background/95 p-5 backdrop-blur-2xl sm:inset-y-0 sm:right-0 sm:left-a`
  - L322: `filter` → `? (editing.pages ?? []).filter((x) => x !== p)`
  - L412: `opacity` → `className="flex flex-1 items-center justify-center gap-2 rounded-full bg-accent px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-accent-foreground disabled:opacity-`
  - L414: `animate-` → `{saving ? <Loader2 className="size-3.5 animate-spin" /> : null}`

### `src/components/admin/AutomationMonitor.tsx`
- Summary: `animate-`×1, `filter`×4
  - L8: `animate-` → `running: { label: "Running", cls: "bg-amber-500/15 text-amber-400", icon: <Loader2 className="size-4 animate-spin" /> },`
  - L25: `filter` → `queued: execs.filter((e) => e.status === "queued").length,`
  - L26: `filter` → `running: execs.filter((e) => e.status === "running").length,`
  - L27: `filter` → `completed: execs.filter((e) => e.status === "success").length,`
  - L28: `filter` → `failed: execs.filter((e) => e.status === "failed").length,`

### `src/components/admin/AutomationSummaryWidget.tsx`
- Summary: `animate-`×1, `filter`×1, `opacity`×2
  - L66: `filter` → `return (rows ?? []).filter(`
  - L93: `opacity` → `<motion.section id="automation-summary" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}`
  - L121: `opacity` → `className="h-8 px-3 rounded-full bg-accent text-accent-foreground text-[11px] font-medium inline-flex items-center gap-1.5 disabled:opacity-50">`
  - L122: `animate-` → `{running ? <Loader2 className="size-3 animate-spin" /> : <Play className="size-3" />} Run now`

### `src/components/admin/BadgeEditorModal.tsx`
- Summary: `animate-`×1, `animation`×5, `blur`×3, `opacity`×4, `transform`×1, `translate`×1
  - L68: `animation` → `animation: "none",`
  - L95: `animation` → `animation: b.animation,`
  - L178: `blur` → `<div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />`
  - L180: `opacity` → `initial={{ opacity: 0, y: 40 }}`
  - L181: `opacity` → `animate={{ opacity: 1, y: 0 }}`
  - L185: `blur` → `<div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-white/10 bg-card/90 backdrop-blur-xl">`
  - L199: `animation` → `className={`inline-flex flex-col items-center justify-center gap-0 font-mono px-2.5 py-1 min-h-[24px] leading-none tracking-wider ${badgeAnimationClass(form.animation)}`}`
  - L214: `opacity` → `{form.subtitle && <span className="opacity-80" style={{ fontSize: `${Math.max(7, form.fontSize - 3)}px`, fontWeight: 500 }}>{form.subtitle}</span>}`
  - L278: `animation` → `{/* Typography + animation */}`
  - L292: `animation` → `<select value={form.animation} onChange={(e) => set("animation", e.target.value as BadgeAnimation)} className="mt-1 w-full bg-white/5 border border-border rounded-lg px-2 py-2 text`
  - L395: `transform` → `<span className={`absolute top-0.5 size-5 rounded-full bg-white transition-transform ${ruleOn ? "translate-x-[22px]" : "translate-x-0.5"}`} />`
  - L395: `translate` → `<span className={`absolute top-0.5 size-5 rounded-full bg-white transition-transform ${ruleOn ? "translate-x-[22px]" : "translate-x-0.5"}`} />`
  - L416: `blur` → `<div className="sticky bottom-0 flex gap-2 px-5 py-4 border-t border-white/10 bg-card/90 backdrop-blur-xl">`
  - L420: `opacity` → `<button onClick={save} disabled={saving} className="flex-1 inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground px-4 py-2.5 rounded-full text-xs uppercase`
  - L421: `animate-` → `{saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />} Save badge`

### `src/components/admin/BadgeSettingsEditor.tsx`
- Summary: `animate-`×1, `opacity`×4, `transform`×1, `translate`×1
  - L133: `opacity` → `className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 rounded-full text-xs uppercase tracking-widest font-bold disabled:opacity-40"`
  - L135: `animate-` → `{saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}`
  - L166: `opacity` → `className={`card-premium rounded-2xl p-4 border transition-opacity ${`
  - L167: `opacity` → `enabled ? "border-transparent" : "border-transparent opacity-60"`
  - L186: `transform` → `className={`absolute top-0.5 size-5 rounded-full bg-white transition-transform ${`
  - L187: `translate` → `enabled ? "translate-x-[22px]" : "translate-x-0.5"`
  - L208: `opacity` → `className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-sm font-mono disabled:opacity-50"`

### `src/components/admin/BannerAdminSheet.tsx`
- Summary: `animate-`×2, `blur`×2, `filter`×1, `opacity`×7
  - L232: `opacity` → `initial={{ opacity: 0 }}`
  - L233: `opacity` → `animate={{ opacity: 1 }}`
  - L234: `opacity` → `exit={{ opacity: 0 }}`
  - L235: `blur` → `className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm"`
  - L255: `blur` → `className="absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-3xl border-t border-accent/20 bg-background/95 p-5 backdrop-blur-2xl sm:inset-y-0 sm:right-0 sm:left-a`
  - L297: `opacity` → `className="grid size-5 place-items-center rounded text-muted-foreground/60 hover:text-accent disabled:opacity-20"`
  - L305: `opacity` → `className="grid size-5 place-items-center rounded text-muted-foreground/60 hover:text-accent disabled:opacity-20"`
  - L460: `filter` → `? (editing.pages ?? []).filter((x) => x !== p)`
  - L540: `opacity` → `className="flex flex-1 items-center justify-center gap-2 rounded-full bg-accent px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-accent-foreground disabled:opacity-`
  - L542: `animate-` → `{saving ? <Loader2 className="size-3.5 animate-spin" /> : null}`
  - L598: `animate-` → `<Loader2 className="size-5 animate-spin text-accent" />`
  - L614: `opacity` → `className="mt-1.5 w-full rounded-lg border border-white/10 px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:border-accent/40 hover:text-accen`

### `src/components/admin/BulkActionBar.tsx`
- Summary: `animate-`×2, `blur`×2, `filter`×1, `opacity`×2, `scale`×1, `shadow-`×2
  - L60: `opacity` → `initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}`
  - L64: `shadow-` → `<div className="mx-auto flex max-w-3xl items-center gap-2 rounded-2xl border border-border/60 bg-background/90 p-2 shadow-2xl backdrop-blur-xl">`
  - L64: `blur` → `<div className="mx-auto flex max-w-3xl items-center gap-2 rounded-2xl border border-border/60 bg-background/90 p-2 shadow-2xl backdrop-blur-xl">`
  - L72: `animate-` → `{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Actions"}`
  - L84: `opacity` → `initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>`
  - L85: `blur` → `<div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setOpen(false); setForm(null); }} />`
  - L89: `shadow-` → `className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-border/60 bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl"`
  - L108: `animate-` → `<Loader2 className="h-6 w-6 animate-spin text-primary" />`
  - L169: `scale` → `className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition hover:bg-muted active:scale-[0.99]",`
  - L294: `filter` → `const tags = val.split(",").map((t) => t.trim()).filter(Boolean);`

### `src/components/admin/BulkVisibilityPanel.tsx`
- Summary: `animate-`×3, `blur`×3, `filter`×2, `opacity`×5, `shadow-`×1
  - L79: `filter` → `() => (categories ?? []).filter((c) => selected.has(catKey(c.id))).map((c) => c.id),`
  - L83: `filter` → `() => (banners ?? []).filter((b) => selected.has(banKey(b.id))).map((b) => b.id),`
  - L141: `animate-` → `<Loader2 className="size-4 animate-spin" />`
  - L186: `opacity` → `initial={{ opacity: 0 }}`
  - L187: `opacity` → `animate={{ opacity: 1 }}`
  - L188: `opacity` → `exit={{ opacity: 0 }}`
  - L189: `blur` → `className="absolute inset-0 bg-background/60 backdrop-blur-sm"`
  - L197: `shadow-` → `className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-accent/20 bg-background/95 backdrop-blur-2xl shadow-[-30px_0_80px_-30px_oklch(0.74_0.19_49/0.`
  - L197: `blur` → `className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-accent/20 bg-background/95 backdrop-blur-2xl shadow-[-30px_0_80px_-30px_oklch(0.74_0.19_49/0.`
  - L217: `blur` → `<div className="border-t border-white/5 bg-background/80 px-4 py-3 backdrop-blur-xl">`
  - L225: `opacity` → `className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-3 py-2.5 text-xs font-semibold uppercase tracking-widest text-accent-foreground transition-all hove`
  - L227: `animate-` → `{busy ? <Loader2 className="size-3.5 animate-spin" /> : <Eye className="size-3.5" />} Publish`
  - L232: `opacity` → `className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-xs font-semibold uppercase tracking-widest text-foreground transit`
  - L234: `animate-` → `{busy ? <Loader2 className="size-3.5 animate-spin" /> : <EyeOff className="size-3.5" />} Hide`

### `src/components/admin/CategoryAdminSheet.tsx`
- Summary: `animate-`×5, `blur`×3, `filter`×9, `opacity`×8, `scale`×4, `transform`×1, `translate`×1
  - L98: `scale` → `/** Downscale + compress an image client-side before upload (max 1600px, JPEG q0.82). */`
  - L104: `scale` → `const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));`
  - L105: `scale` → `const w = Math.round(bitmap.width * scale);`
  - L106: `scale` → `const h = Math.round(bitmap.height * scale);`
  - L156: `filter` → `const [filter, setFilter] = useState<CatFilter>("all");`
  - L572: `filter` → `switch (filter) {`
  - L587: `filter` → `const mains = rows.filter((r) => !r.parent_id);`
  - L591: `filter` → `const allSubs = rows.filter((s) => s.parent_id === m.id);`
  - L592: `filter` → `const mSubs = allSubs.filter(matches);`
  - L596: `filter` → `const orphans = rows.filter(`
  - L600: `filter` → `}, [rows, query, filter, productCounts]);`
  - L691: `animate-` → `<Loader2 className="size-3.5 animate-spin" />`
  - L730: `opacity` → `initial={embedded ? { opacity: 0, y: 8 } : { opacity: 0 }}`
  - L731: `opacity` → `animate={embedded ? { opacity: 1, y: 0 } : { opacity: 1 }}`
  - L732: `opacity` → `exit={embedded ? { opacity: 0, y: 8 } : { opacity: 0 }}`
  - L733: `blur` → `className={embedded ? "" : "fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm"}`
  - L754: `blur` → `className={embedded ? "relative overflow-hidden rounded-2xl border border-accent/20 bg-background/70 p-5 backdrop-blur-xl" : "absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-au`
  - L815: `filter` → `filter === f`
  - L852: `animate-` → `<Loader2 className="size-5 animate-spin text-muted-foreground" />`
  - L939: `opacity` → `className="-mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-accent/30 bg-accent/[0.06] px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-`
  - … 11 more matching lines omitted for brevity

### `src/components/admin/CollapsibleModule.tsx`
- Summary: `blur`×1, `filter`×1, `opacity`×5, `rotate`×1
  - L67: `opacity` → `className="pointer-events-none absolute -top-20 -right-20 size-40 rounded-full opacity-30"`
  - L68: `filter` → `style={{ background: "var(--gradient-ember-soft)", filter: "blur(28px)" }}`
  - L68: `blur` → `style={{ background: "var(--gradient-ember-soft)", filter: "blur(28px)" }}`
  - L83: `rotate` → `<motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}>`
  - L92: `opacity` → `initial={{ height: 0, opacity: 0 }}`
  - L93: `opacity` → `animate={{ height: "auto", opacity: 1 }}`
  - L94: `opacity` → `exit={{ height: 0, opacity: 0 }}`
  - L95: `opacity` → `transition={{ type: "spring", stiffness: 300, damping: 34, opacity: { duration: 0.2 } }}`

### `src/components/admin/CustomerActionsMenu.tsx`
- Summary: `animate-`×9, `blur`×3, `filter`×1, `opacity`×3, `shadow-`×2
  - L69: `opacity` → `className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm hover:bg-white/5 active:bg-white/10 disabled:opacity-50 transition-colors ${tone ?? "text-foregrou`
  - L71: `animate-` → `{k && busy === k ? <Loader2 className="size-4 animate-spin shrink-0" /> : <Icon className="size-4 shrink-0" />}`
  - L152: `blur` → `className="fixed inset-0 z-[120] flex items-end sm:items-center sm:justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"`
  - L152: `animate-` → `className="fixed inset-0 z-[120] flex items-end sm:items-center sm:justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"`
  - L156: `shadow-` → `className="w-full sm:max-w-sm max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border border-white/10 bg-[oklch(0.16_0.01_260)] shadow-2xl backdrop-blur-xl p-2 pb-[max(0.7`
  - L156: `blur` → `className="w-full sm:max-w-sm max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border border-white/10 bg-[oklch(0.16_0.01_260)] shadow-2xl backdrop-blur-xl p-2 pb-[max(0.7`
  - L156: `animate-` → `className="w-full sm:max-w-sm max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border border-white/10 bg-[oklch(0.16_0.01_260)] shadow-2xl backdrop-blur-xl p-2 pb-[max(0.7`
  - L225: `blur` → `className="fixed inset-0 z-[130] flex items-stretch sm:items-center sm:justify-center bg-black/60 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200"`
  - L225: `animate-` → `className="fixed inset-0 z-[130] flex items-stretch sm:items-center sm:justify-center bg-black/60 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200"`
  - L229: `shadow-` → `className="flex w-full flex-col h-[100dvh] sm:h-auto sm:max-w-md sm:max-h-[90vh] border border-white/10 bg-[oklch(0.16_0.01_260)] shadow-2xl rounded-none sm:rounded-2xl animate-in `
  - L229: `animate-` → `className="flex w-full flex-col h-[100dvh] sm:h-auto sm:max-w-md sm:max-h-[90vh] border border-white/10 bg-[oklch(0.16_0.01_260)] shadow-2xl rounded-none sm:rounded-2xl animate-in `
  - L246: `opacity` → `const btnPrimary = "inline-flex items-center justify-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50";`
  - L316: `filter` → `tags: tags.trim() ? tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,`
  - L321: `animate-` → `{busy ? <Loader2 className="size-4 animate-spin" /> : null} Save Changes`
  - L349: `animate-` → `{busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Send`
  - L371: `animate-` → `{busy ? <Loader2 className="size-4 animate-spin" /> : <Bell className="size-4" />} Send`
  - L394: `opacity` → `className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground disabled:opacity-50">`
  - L395: `animate-` → `{busy ? <Loader2 className="size-4 animate-spin" /> : <Ban className="size-4" />} Ban Customer`

### `src/components/admin/CustomerMarketingCard.tsx`
- Summary: `animate-`×1, `opacity`×2
  - L50: `opacity` → `initial={{ opacity: 0, y: 12 }}`
  - L51: `opacity` → `animate={{ opacity: 1, y: 0 }}`
  - L74: `animate-` → `<Loader2 className="size-4 animate-spin" />`

### `src/components/admin/CustomerMarketingHub.tsx`
- Summary: `animate-`×3, `blur`×1, `filter`×2, `opacity`×1
  - L64: `filter` → `() => buildCustomerRecommendations(audiences).filter((r) => !dismissed.has(r.id)),`
  - L108: `animate-` → `<Loader2 className="size-5 animate-spin text-accent" />`
  - L178: `filter` → `active={campaignsForAudience(a.key, campaigns).filter((c) => c.status === "active").length}`
  - L233: `opacity` → `className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-widest font-mono disabled:opacity-50 ${`
  - L237: `animate-` → `{busy ? <Loader2 className="size-3 animate-spin" /> : icon}`
  - L322: `blur` → `<div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />`
  - L382: `animate-` → `{busy === `panel-dup-${c.id}` ? <Loader2 className="size-3 animate-spin" /> : <Copy className="size-3 text-muted-foreground" />}`

### `src/components/admin/DashboardOverview.tsx`
- Summary: `animate-`×2, `blur`×7, `drop-shadow`×2, `filter`×12, `opacity`×8, `scale`×2, `shadow-`×1, `transform`×1, `translate`×1
  - L111: `filter` → `const outOfStock = (products ?? []).filter((p) => !p.in_stock);`
  - L112: `filter` → `const lowStock = (products ?? []).filter((p) => {`
  - L119: `filter` → `.filter((p) => p.reviews > 0)`
  - L167: `filter` → `initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}`
  - L167: `opacity` → `initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}`
  - L167: `blur` → `initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}`
  - L168: `filter` → `animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}`
  - L168: `opacity` → `animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}`
  - L168: `blur` → `animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}`
  - L172: `filter` → `<div className="pointer-events-none absolute -top-20 left-1/4 size-72 rounded-full opacity-40" style={{ background: "var(--gradient-ember)", filter: "blur(44px)" }} />`
  - L172: `opacity` → `<div className="pointer-events-none absolute -top-20 left-1/4 size-72 rounded-full opacity-40" style={{ background: "var(--gradient-ember)", filter: "blur(44px)" }} />`
  - L172: `blur` → `<div className="pointer-events-none absolute -top-20 left-1/4 size-72 rounded-full opacity-40" style={{ background: "var(--gradient-ember)", filter: "blur(44px)" }} />`
  - L173: `filter` → `<div className="pointer-events-none absolute -bottom-24 -right-10 size-56 rounded-full opacity-25" style={{ background: "radial-gradient(circle, oklch(0.55 0.18 280 / 0.6), transpa`
  - L173: `opacity` → `<div className="pointer-events-none absolute -bottom-24 -right-10 size-56 rounded-full opacity-25" style={{ background: "radial-gradient(circle, oklch(0.55 0.18 280 / 0.6), transpa`
  - L173: `blur` → `<div className="pointer-events-none absolute -bottom-24 -right-10 size-56 rounded-full opacity-25" style={{ background: "radial-gradient(circle, oklch(0.55 0.18 280 / 0.6), transpa`
  - L178: `shadow-` → `<span className="size-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent)] animate-pulse" /> Live revenue · {period}d`
  - L178: `animate-` → `<span className="size-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent)] animate-pulse" /> Live revenue · {period}d`
  - L216: `opacity` → `initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} />`
  - L218: `filter` → `style={{ filter: "drop-shadow(0 3px 12px oklch(0.74 0.19 49 / 0.6))" }}`
  - L218: `drop-shadow` → `style={{ filter: "drop-shadow(0 3px 12px oklch(0.74 0.19 49 / 0.6))" }}`
  - … 16 more matching lines omitted for brevity

### `src/components/admin/DraftActivityWidget.tsx`
- Summary: `animate-`×2
  - L74: `animate-` → `<Loader2 className="size-4 animate-spin" />`
  - L111: `animate-` → `<Loader2 className="size-4 animate-spin" />`

### `src/components/admin/EditorSaveBar.tsx`
- Summary: `opacity`×2
  - L72: `opacity` → `className="grid size-7 place-items-center rounded-lg border border-white/10 text-muted-foreground hover:text-accent disabled:opacity-30"`
  - L81: `opacity` → `className="grid size-7 place-items-center rounded-lg border border-white/10 text-muted-foreground hover:text-accent disabled:opacity-30"`

### `src/components/admin/ExecutiveDashboard.tsx`
- Summary: `animate-`×3, `opacity`×4, `rotate`×1, `scale`×4
  - L14: `scale` → `import { scaleCampaign, pauseFinancialCampaign, launchProfitCampaign } from "@/lib/financial-marketing";`
  - L37: `opacity` → `initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}`
  - L58: `rotate` → `<svg viewBox="0 0 100 100" className="size-full -rotate-90">`
  - L163: `animate-` → `return <div className="min-h-[40vh] grid place-items-center"><Loader2 className="size-5 animate-spin text-accent" /></div>;`
  - L198: `scale` → `<button onClick={exportCSV} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-widest bg-white/[0.04] border border-whi`
  - L199: `scale` → `<button onClick={exportPDF} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-widest bg-accent/15 text-accent border b`
  - L222: `opacity` → `<motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02, ease: EASE }}`
  - L281: `scale` → `<button disabled={busy === o.id || done.has(o.id)} onClick={() => act(o.id, () => scaleCampaign({ id: o.campaignId! } as never))}`
  - L282: `opacity` → `className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full bg-emerald-400/15 text-emerald-300 border border-emerald-400/30 disabled:opacity-50">`
  - L283: `animate-` → `{busy === o.id ? <Loader2 className="size-3 animate-spin" /> : done.has(o.id) ? "Scaled ✓" : "Scale"}`
  - L307: `opacity` → `className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full bg-rose-400/15 text-rose-300 border border-rose-400/30 disabled:opacity-50">`
  - L308: `animate-` → `{busy === r.id ? <Loader2 className="size-3 animate-spin" /> : done.has(r.id) ? "Paused ✓" : "Pause"}`

### `src/components/admin/ExecutiveQuickCard.tsx`
- Summary: `animate-`×1, `opacity`×1
  - L20: `opacity` → `initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}`
  - L35: `animate-` → `<div className="min-h-[160px] grid place-items-center"><Loader2 className="size-5 animate-spin text-accent" /></div>`

### `src/components/admin/ExecutiveSummaryPanel.tsx`
- Summary: `animate-`×2, `blur`×1, `filter`×1, `opacity`×2
  - L24: `animate-` → `<Loader2 className="size-5 animate-spin text-muted-foreground" />`
  - L33: `filter` → `const worst = [...campaigns].filter((c) => c.cost > 0).sort((a, b) => a.roi - b.roi)[0] ?? null;`
  - L44: `opacity` → `initial={{ opacity: 0, y: 10 }}`
  - L45: `opacity` → `animate={{ opacity: 1, y: 0 }}`
  - L47: `blur` → `className="rounded-2xl border border-accent/30 bg-gradient-to-br from-white/[0.04] to-transparent p-5 backdrop-blur-xl"`
  - L52: `animate-` → `<span className="size-1.5 rounded-full bg-accent animate-pulse" />`

### `src/components/admin/FinancialInsightsPanel.tsx`
- Summary: `animate-`×5, `blur`×1, `filter`×2, `opacity`×5, `scale`×4
  - L12: `scale` → `fmt, scaleCampaign, pauseFinancialCampaign, duplicateFinancialCampaign,`
  - L42: `animate-` → `<Loader2 className="size-5 animate-spin text-muted-foreground" />`
  - L59: `opacity` → `initial={{ opacity: 0, y: 10 }}`
  - L60: `opacity` → `animate={{ opacity: 1, y: 0 }}`
  - L62: `blur` → `className="rounded-2xl border border-accent/30 bg-gradient-to-br from-white/[0.04] to-transparent p-5 backdrop-blur-xl"`
  - L67: `animate-` → `<span className="size-1.5 rounded-full bg-accent animate-pulse" />`
  - L104: `filter` → `const winner = [...campaigns].filter((c) => c.cost > 0).sort((a, b) => b.roi - a.roi)[0] ?? null;`
  - L105: `filter` → `const loser = [...campaigns].filter((c) => c.cost > 0).sort((a, b) => a.roi - b.roi)[0] ?? null;`
  - L136: `scale` → `disabled={!winner || busy === "scale"}`
  - L137: `scale` → `onClick={() => winner && run("scale", () => scaleCampaign(winner), `Scaled "${winner.name}" budget`)}`
  - L138: `opacity` → `className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-3 py-2.5 text-xs font-medium text-foreground transition-all hover:b`
  - L140: `scale` → `{busy === "scale" ? <Loader2 className="size-3.5 animate-spin" /> : <ArrowUpRight className="size-3.5 text-emerald-400" />} Scale Winner`
  - L140: `animate-` → `{busy === "scale" ? <Loader2 className="size-3.5 animate-spin" /> : <ArrowUpRight className="size-3.5 text-emerald-400" />} Scale Winner`
  - L145: `opacity` → `className="flex items-center justify-center gap-1.5 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-xs font-medium text-foreground transition-all hover:b`
  - L147: `animate-` → `{busy === "pause" ? <Loader2 className="size-3.5 animate-spin" /> : <Pause className="size-3.5 text-destructive" />} Pause Loser`
  - L152: `opacity` → `className="flex items-center justify-center gap-1.5 rounded-xl border border-accent/40 bg-accent/10 px-3 py-2.5 text-xs font-medium text-foreground transition-all hover:bg-accent/2`
  - L154: `animate-` → `{busy === "dup" ? <Loader2 className="size-3.5 animate-spin" /> : <Copy className="size-3.5 text-accent" />} Duplicate Winner`

### `src/components/admin/FinancialMarketingCard.tsx`
- Summary: `animate-`×1, `opacity`×2
  - L55: `opacity` → `initial={{ opacity: 0, y: 12 }}`
  - L56: `opacity` → `animate={{ opacity: 1, y: 0 }}`
  - L72: `animate-` → `<div className="h-28 grid place-items-center text-muted-foreground"><Loader2 className="size-4 animate-spin" /></div>`

### `src/components/admin/FinancialMarketingHub.tsx`
- Summary: `animate-`×3, `filter`×1, `opacity`×2, `scale`×6
  - L13: `scale` → `scaleCampaign, pauseFinancialCampaign, duplicateFinancialCampaign,`
  - L72: `filter` → `recs: buildFinancialRecommendations(live, camps, prod, cust).filter((r) => !dismissed.has(r.id)),`
  - L91: `scale` → `if (rec.campaignId && rec.action === "scale") {`
  - L93: `scale` → `if (cp) return void run(key, () => scaleCampaign(cp), "Budget scaled");`
  - L104: `animate-` → `<div className="rounded-2xl glass px-5 py-10 grid place-items-center"><Loader2 className="size-5 animate-spin text-accent" /></div>`
  - L187: `scale` → `<ActBtn busy={busy === `rec-${r.id}-true`} primary onClick={() => acceptRec(r, true)} icon={<Zap className="size-3" />}>{r.action === "pause" ? "Pause" : r.action === "scale" ? "Sc`
  - L188: `scale` → `{r.template && r.action !== "pause" && r.action !== "scale" && (`
  - L227: `scale` → `{c.roi >= 1.5 && <IconBtn busy={busy === `c-scale-${c.id}`} title="Scale budget" onClick={() => void run(`c-scale-${c.id}`, () => scaleCampaign(c), "Scaled")}><TrendingUp className`
  - L333: `opacity` → `<button disabled={busy} onClick={onClick} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-widest font-mono disabled:opacity-50 ${`
  - L334: `animate-` → `{busy ? <Loader2 className="size-3 animate-spin" /> : icon}{children}`
  - L341: `opacity` → `<button disabled={busy} title={title} onClick={onClick} className="size-6 grid place-items-center rounded-lg border border-border hover:bg-white/5 disabled:opacity-50">`
  - L342: `animate-` → `{busy ? <Loader2 className="size-3 animate-spin" /> : children}`

### `src/components/admin/GlobalExpansionWidget.tsx`
- Summary: `animate-`×1
  - L24: `animate-` → `<div key={i} className="h-20 rounded-xl bg-muted/30 animate-pulse" />`

### `src/components/admin/InlineActiveToggle.tsx`
- Summary: `animate-`×1, `blur`×1, `opacity`×1
  - L56: `opacity` → `"inline-flex items-center gap-1.5 rounded-full border font-mono uppercase tracking-widest backdrop-blur-md transition-all disabled:opacity-60",`
  - L56: `blur` → `"inline-flex items-center gap-1.5 rounded-full border font-mono uppercase tracking-widest backdrop-blur-md transition-all disabled:opacity-60",`
  - L64: `animate-` → `<Icon className={cn(iconSize, busy && "animate-spin")} />`

### `src/components/admin/InventoryMarketingHub.tsx`
- Summary: `animate-`×2, `blur`×1, `filter`×1, `opacity`×1
  - L60: `filter` → `() => buildInventoryRecommendations(intel, campaigns).filter((r) => !dismissed.has(r.id)),`
  - L99: `animate-` → `<Loader2 className="size-5 animate-spin text-accent" />`
  - L230: `opacity` → `className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-widest font-mono disabled:opacity-50 ${`
  - L234: `animate-` → `{busy ? <Loader2 className="size-3 animate-spin" /> : icon}`
  - L309: `blur` → `<div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />`

### `src/components/admin/KpiCard.tsx`
- Summary: `blur`×1, `opacity`×3
  - L11: `opacity` → `initial={{ opacity: 0, y: 12 }}`
  - L12: `opacity` → `animate={{ opacity: 1, y: 0 }}`
  - L17: `opacity` → `<div className="absolute -top-16 -right-16 size-32 rounded-full bg-accent/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />`
  - L17: `blur` → `<div className="absolute -top-16 -right-16 size-32 rounded-full bg-accent/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />`

### `src/components/admin/MarketingAutomationCard.tsx`
- Summary: `animate-`×1, `filter`×2, `opacity`×2
  - L42: `filter` → `const activeCampaigns = intel ? intel.campaigns.filter((c) => c.status === "active").length : 0;`
  - L44: `filter` → `const activeAutomations = automations.filter((a) => a.enabled && a.status === "active").length;`
  - L49: `opacity` → `initial={{ opacity: 0, y: 12 }}`
  - L50: `opacity` → `animate={{ opacity: 1, y: 0 }}`
  - L73: `animate-` → `<Loader2 className="size-4 animate-spin" />`

### `src/components/admin/MarketingExecutionsCenter.tsx`
- Summary: `animate-`×6, `blur`×1, `filter`×18, `opacity`×7, `rotate`×1, `transform`×1, `translate`×1
  - L60: `opacity` → `{(blocked || maint) && <span className="ml-auto text-[10px] uppercase tracking-widest opacity-80">System status</span>}`
  - L76: `filter` → `const [filter, setFilter] = useState<FilterKey>("all");`
  - L107: `filter` → `const activeAutomations = useMemo(() => automations.filter((a) => a.enabled && a.status === "active"), [automations]);`
  - L109: `filter` → `const filtered = useMemo(() => {`
  - L111: `filter` → `if (filter === "success") list = list.filter((r) => r.status === "success" && !r.blocked);`
  - L112: `filter` → `else if (filter === "failed") list = list.filter((r) => r.status === "failed");`
  - L113: `filter` → `else if (filter === "blocked") list = list.filter((r) => r.blocked);`
  - L114: `filter` → `else if (filter === "running") list = list.filter((r) => r.triggered_by === "manual" && Date.now() - new Date(r.created_at).getTime() < 5000);`
  - L115: `filter` → `else if (filter === "retried") list = list.filter((r) => r.retry_count > 0);`
  - L116: `filter` → `else if (filter === "permanent") list = list.filter((r) => r.failed_permanently);`
  - L119: `filter` → `list = list.filter((r) =>`
  - L132: `filter` → `}, [rows, filter, q, sortKey]);`
  - L134: `filter` → `const failures = useMemo(() => (rows ?? []).filter((r) => r.status === "failed"), [rows]);`
  - L144: `filter` → `const lines = filtered.map((r) => [`
  - L152: `filter` → `download(`automation-executions-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(filtered, null, 2), "application/json");`
  - L157: `animate-` → `return <div className="grid place-items-center py-24 text-muted-foreground"><Loader2 className="size-5 animate-spin" /></div>;`
  - L202: `filter` → `className={`h-8 px-3 rounded-full text-xs whitespace-nowrap transition-colors ${filter === k ? "bg-accent text-accent-foreground" : "bg-card border border-border text-muted-foregro`
  - L203: `opacity` → `{l} <span className="opacity-70">({n})</span>`
  - L207: `translate` → `<Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />`
  - L221: `filter` → `{filtered.length === 0 ? (`
  - … 15 more matching lines omitted for brevity

### `src/components/admin/MediaUploader.tsx`
- Summary: `animate-`×1, `opacity`×3
  - L162: `opacity` → `initial={{ opacity: 0, y: 6 }}`
  - L163: `opacity` → `animate={{ opacity: 1, y: 0 }}`
  - L164: `opacity` → `exit={{ opacity: 0, height: 0 }}`
  - L206: `animate-` → `{item.status === "uploading" && <Loader2 className="size-4 animate-spin text-accent" />}`

### `src/components/admin/OrderActionCenter.tsx`
- Summary: `animate-`×1, `opacity`×1, `rotate`×1, `transform`×1
  - L32: `opacity` → `className={`inline-flex items-center justify-center gap-1.5 text-[11px] px-2.5 py-2 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${cls}`}>`
  - L33: `animate-` → `{busy ? <Loader2 className="size-3.5 animate-spin" /> : done ? <CheckCircle2 className="size-3.5" /> : icon}{label}`
  - L88: `transform` → `<ChevronDown className={`size-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />`
  - L88: `rotate` → `<ChevronDown className={`size-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />`

### `src/components/admin/OrderIntegrityMonitor.tsx`
- Summary: `animate-`×2, `opacity`×1, `rotate`×1, `transform`×1
  - L82: `opacity` → `className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:border-accent/40 disabled:opacity-50">`
  - L83: `animate-` → `{scanning ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />} Run scan`
  - L88: `animate-` → `<div className="flex items-center gap-2 text-[11px] text-muted-foreground"><Loader2 className="size-3 animate-spin" /> Loading…</div>`
  - L113: `transform` → `<ChevronDown className={`size-3 transition-transform ${open ? "rotate-180" : ""}`} /> View details`
  - L113: `rotate` → `<ChevronDown className={`size-3 transition-transform ${open ? "rotate-180" : ""}`} /> View details`

### `src/components/admin/PaymentDiagnostics.tsx`
- Summary: `animate-`×1, `blur`×1, `filter`×1, `opacity`×2
  - L79: `opacity` → `initial={{ opacity: 0, y: 8 }}`
  - L80: `opacity` → `animate={{ opacity: 1, y: 0 }}`
  - L81: `blur` → `className="rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur-xl space-y-5"`
  - L92: `animate-` → `{loading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}`
  - L217: `filter` → `method filter is applied at checkout — INR orders surface every enabled Indian method.`

### `src/components/admin/PaymentGatewayStatusCenter.tsx`
- Summary: `animate-`×2, `opacity`×5
  - L55: `opacity` → `initial={{ opacity: 0, y: 10 }}`
  - L56: `opacity` → `animate={{ opacity: 1, y: 0 }}`
  - L109: `opacity` → `className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest hover:border-accent/40 disabled:opacity-`
  - L111: `animate-` → `{busy ? <Loader2 className="size-3 animate-spin" /> : g.enabled ? <ToggleRight className="size-3.5 text-emerald-400" /> : <ToggleLeft className="size-3.5" />}`
  - L122: `opacity` → `className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-colors disabled:opacity-50 ${g.mode === m ? "bg-accent text-acce`
  - L142: `opacity` → `<Icon className="size-3 opacity-60" />`
  - L170: `animate-` → `<div className="h-40 grid place-items-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>`

### `src/components/admin/PaymentIntelDrawer.tsx`
- Summary: `animate-`×4, `blur`×1, `filter`×8, `opacity`×4
  - L98: `filter` → `.on("postgres_changes", { event: "*", schema: "public", table: "payments", filter: `order_id=eq.${orderId}` }, load)`
  - L99: `filter` → `.on("postgres_changes", { event: "*", schema: "public", table: "shipments", filter: `order_id=eq.${orderId}` }, load)`
  - L100: `filter` → `.on("postgres_changes", { event: "*", schema: "public", table: "refunds", filter: `order_id=eq.${orderId}` }, load)`
  - L101: `filter` → `.on("postgres_changes", { event: "*", schema: "public", table: "support_tickets", filter: `order_id=eq.${orderId}` }, load)`
  - L139: `filter` → `const openTickets = detail?.tickets?.filter((t) => t.status !== "resolved" && t.status !== "closed").length ?? 0;`
  - L140: `filter` → `const resolvedTickets = detail?.tickets?.filter((t) => t.status === "resolved" || t.status === "closed").length ?? 0;`
  - L144: `filter` → `[addr.line1, addr.line2, addr.city, addr.state, addr.postal, addr.country].filter(Boolean).join(", "),`
  - L149: `filter` → `a ? [a.full_name, a.line1, a.line2, a.landmark, a.city, a.state, a.postal, a.country].filter(Boolean).join(", ") : "—";`
  - L156: `opacity` → `initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}`
  - L157: `blur` → `className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose}`
  - L174: `opacity` → `<button onClick={doInvoice} disabled={busy === "invoice"} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[11px] hover:bg-white/5 d`
  - L175: `animate-` → `{busy === "invoice" ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />} Invoice`
  - L177: `opacity` → `<button onClick={doRefund} disabled={busy === "refund"} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[11px] hover:bg-white/5 dis`
  - L178: `animate-` → `{busy === "refund" ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />} Refund`
  - L180: `opacity` → `<button onClick={doTicket} disabled={busy === "ticket"} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[11px] hover:bg-white/5 dis`
  - L181: `animate-` → `{busy === "ticket" ? <Loader2 className="size-3.5 animate-spin" /> : <MessageSquarePlus className="size-3.5" />} Ticket`
  - L194: `animate-` → `<div className="min-h-[40vh] grid place-items-center"><Loader2 className="size-5 animate-spin text-accent" /></div>`

### `src/components/admin/ProductBadgeManager.tsx`
- Summary: `animate-`×5, `animation`×1, `filter`×4, `opacity`×10, `translate`×1
  - L47: `animation` → `badgeAnimationClass(b.animation),`
  - L54: `opacity` → `<button type="button" onClick={onRemove} disabled={busy} className="ml-0.5 opacity-70 hover:opacity-100 disabled:opacity-40">`
  - L55: `animate-` → `{busy ? <Loader2 className="size-3 animate-spin" /> : <X className="size-3" />}`
  - L100: `filter` → `.filter(Boolean) as RenderBadge[];`
  - L108: `filter` → `.filter((t) => t.enabled && !t.isDiscount && !t.archived)`
  - L109: `filter` → `.filter((t) => !q || t.label.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));`
  - L121: `filter` → `if (!live) { onChange?.((selectedIds ?? []).filter((x) => x !== id)); return; }`
  - L144: `animate-` → `return <div className="grid place-items-center py-6"><Loader2 className="size-4 animate-spin text-accent" /></div>;`
  - L177: `opacity` → `initial={{ opacity: 0, y: 6 }}`
  - L178: `opacity` → `animate={{ opacity: 1, y: 0 }}`
  - L179: `opacity` → `exit={{ opacity: 0, x: -8 }}`
  - L186: `opacity` → `dragId === b.id ? "border-accent/50 opacity-60" : "border-white/10",`
  - L212: `opacity` → `className="size-7 grid place-items-center rounded-lg border border-white/10 text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/10 disable`
  - L214: `animate-` → `{busy === b.id ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}`
  - L236: `translate` → `<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />`
  - L269: `animate-` → `{busy === t.id ? <Loader2 className="size-3 animate-spin" /> : active ? <Check className="size-3" /> : t.emoji ? <span aria-hidden>{t.emoji}</span> : <Tag className="size-3" />}`
  - L315: `opacity` → `initial={{ opacity: 0, height: 0 }}`
  - L316: `opacity` → `animate={{ opacity: 1, height: "auto" }}`
  - L317: `opacity` → `exit={{ opacity: 0, height: 0 }}`
  - L344: `opacity` → `className="flex-1 h-8 rounded-lg bg-accent text-accent-foreground text-[11px] font-bold hover:brightness-110 disabled:opacity-60 inline-flex items-center justify-center gap-1">`
  - … 1 more matching lines omitted for brevity

### `src/components/admin/ProductCardAdminControls.tsx`
- Summary: `animate-`×1, `blur`×2, `opacity`×4, `scale`×3, `shadow-`×1
  - L140: `blur` → `"grid size-7 place-items-center rounded-full border backdrop-blur-md transition-all",`
  - L146: `animate-` → `{busy ? <Loader2 className="size-3.5 animate-spin" /> : <MoreVertical className="size-3.5" />}`
  - L152: `scale` → `initial={{ opacity: 0, y: -6, scale: 0.96 }}`
  - L152: `opacity` → `initial={{ opacity: 0, y: -6, scale: 0.96 }}`
  - L153: `scale` → `animate={{ opacity: 1, y: 0, scale: 1 }}`
  - L153: `opacity` → `animate={{ opacity: 1, y: 0, scale: 1 }}`
  - L154: `scale` → `exit={{ opacity: 0, y: -6, scale: 0.96 }}`
  - L154: `opacity` → `exit={{ opacity: 0, y: -6, scale: 0.96 }}`
  - L156: `shadow-` → `className="mt-1.5 w-44 overflow-hidden rounded-xl border border-accent/30 bg-background/90 p-1 backdrop-blur-2xl shadow-[0_16px_40px_-12px_oklch(0.74_0.19_49/0.5)]"`
  - L156: `blur` → `className="mt-1.5 w-44 overflow-hidden rounded-xl border border-accent/30 bg-background/90 p-1 backdrop-blur-2xl shadow-[0_16px_40px_-12px_oklch(0.74_0.19_49/0.5)]"`
  - L167: `opacity` → `"flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors disabled:opacity-50",`

### `src/components/admin/ProductEditorModal.tsx`
- Summary: `animate-`×1, `blur`×3, `filter`×21, `opacity`×8, `shadow-`×1
  - L84: `filter` → `const words = name.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);`
  - L92: `filter` → `return text.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);`
  - L145: `filter` → `const remove = (c: string) => onChange(value.filter((x) => x !== c));`
  - L146: `filter` → `const matches = COLLECTION_SUGGESTIONS.filter(`
  - L215: `filter` → `const mains = categories.filter((c) => !c.parent_id);`
  - L217: `filter` → `const subs = mainObj ? categories.filter((c) => c.parent_id === mainObj.id) : [];`
  - L221: `filter` → `const initialExtra = ((row as any)?.categories as string[] | undefined ?? []).filter(`
  - L228: `filter` → `const extraSubs = extraMainObj ? categories.filter((c) => c.parent_id === extraMainObj.id) : [];`
  - L230: `filter` → `const set = new Set<string>([effectiveCategory, ...extraCategories].filter(Boolean));`
  - L383: `filter` → `const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);`
  - L462: `filter` → `tags: parseList(form.tags), features: featuresList.map((f) => f.trim()).filter(Boolean), meta_keywords: autoKeywords,`
  - L495: `blur` → `className="fixed inset-0 z-50 grid place-items-end sm:place-items-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"`
  - L500: `opacity` → `initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}`
  - L504: `blur` → `<div className="sticky top-0 z-20 -mx-4 sm:-mx-5 px-4 sm:px-5 pt-2 pb-2 bg-background/90 backdrop-blur space-y-2">`
  - L604: `shadow-` → `<div className={`${cardWidth} max-w-full rounded-2xl overflow-hidden border border-white/10 bg-card shadow-[var(--shadow-ember)]`}>`
  - L663: `filter` → `<select value={mainCat} onChange={(e) => { setMainCat(e.target.value); setSubCat(""); }} className="filter-select">`
  - L672: `filter` → `<select value={subCat} onChange={(e) => setSubCat(e.target.value)} className="filter-select">`
  - L683: `filter` → `<select value={extraMain} onChange={(e) => { setExtraMain(e.target.value); setExtraSub(""); }} className="filter-select">`
  - L689: `filter` → `<select value={extraSub} disabled={!extraMain} onChange={(e) => setExtraSub(e.target.value)} className="filter-select disabled:opacity-50">`
  - L689: `opacity` → `<select value={extraSub} disabled={!extraMain} onChange={(e) => setExtraSub(e.target.value)} className="filter-select disabled:opacity-50">`
  - … 14 more matching lines omitted for brevity

### `src/components/admin/ProductFaqManager.tsx`
- Summary: `animate-`×2, `filter`×1, `opacity`×4
  - L123: `filter` → `setFaqs((p) => p.filter((f) => f.id !== id));`
  - L165: `animate-` → `<Loader2 className="size-3.5 animate-spin" /> Loading FAQs…`
  - L192: `opacity` → `<button type="button" disabled={busy} onClick={() => void saveEdit(f.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/20 text-accent text-xs disabl`
  - L210: `opacity` → `<button type="button" disabled={busy} onClick={() => void toggleActive(f)} title={f.isActive ? "Hide from customers" : "Show to customers"} className="size-7 grid place-items-cente`
  - L216: `opacity` → `<button type="button" disabled={busy} onClick={() => void remove(f.id)} title="Delete" className="size-7 grid place-items-center rounded-lg hover:bg-white/5 text-muted-foreground h`
  - L231: `opacity` → `<button type="button" disabled={busy} onClick={() => void handleAdd()} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-accent to-primary text`
  - L232: `animate-` → `{busy ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Add FAQ`

### `src/components/admin/ProductMarketingPanel.tsx`
- Summary: `animate-`×4, `blur`×2, `filter`×1, `opacity`×3
  - L69: `opacity` → `initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}`
  - L70: `blur` → `className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm"`
  - L77: `blur` → `className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-accent/20 bg-background/95 backdrop-blur-2xl"`
  - L116: `animate-` → `<Loader2 className="size-6 animate-spin" />`
  - L332: `filter` → `const available = data.allCampaigns.filter((c) => !featuringIds.has(c.id));`
  - L377: `animate-` → `{busy === "add" ? <Loader2 className="size-4 animate-spin" /> : "Add"}`
  - L470: `opacity` → `"flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs font-medium transition disabled:opacity-50",`
  - L474: `animate-` → `{busy ? <Loader2 className="size-4 shrink-0 animate-spin" /> : <Icon className="size-4 shrink-0" />}`
  - L487: `opacity` → `className="grid size-7 place-items-center rounded-lg border border-white/10 text-muted-foreground transition hover:text-foreground disabled:opacity-50"`
  - L489: `animate-` → `{busy ? <Loader2 className="size-3.5 animate-spin" /> : children}`

### `src/components/admin/ProductQuickEditSheet.tsx`
- Summary: `animate-`×1, `blur`×2, `opacity`×7, `scale`×3, `shadow-`×1, `transform`×1, `translate`×1
  - L136: `opacity` → `initial={{ opacity: 0 }}`
  - L137: `opacity` → `animate={{ opacity: 1 }}`
  - L138: `opacity` → `exit={{ opacity: 0 }}`
  - L139: `blur` → `className="absolute inset-0 bg-background/70 backdrop-blur-sm"`
  - L143: `scale` → `initial={{ opacity: 0, y: 24, scale: 0.98 }}`
  - L143: `opacity` → `initial={{ opacity: 0, y: 24, scale: 0.98 }}`
  - L144: `scale` → `animate={{ opacity: 1, y: 0, scale: 1 }}`
  - L144: `opacity` → `animate={{ opacity: 1, y: 0, scale: 1 }}`
  - L145: `scale` → `exit={{ opacity: 0, y: 24, scale: 0.98 }}`
  - L145: `opacity` → `exit={{ opacity: 0, y: 24, scale: 0.98 }}`
  - L147: `shadow-` → `className="relative z-10 w-full max-w-md overflow-hidden rounded-t-3xl border border-accent/25 bg-background/95 backdrop-blur-2xl shadow-[0_30px_80px_-20px_oklch(0.74_0.19_49/0.5)]`
  - L147: `blur` → `className="relative z-10 w-full max-w-md overflow-hidden rounded-t-3xl border border-accent/25 bg-background/95 backdrop-blur-2xl shadow-[0_30px_80px_-20px_oklch(0.74_0.19_49/0.5)]`
  - L261: `opacity` → `className="ml-auto inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-semibold text-accent-foreground transition-all hover:brightness-110 disabled:opacity`
  - L263: `animate-` → `{saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}`
  - L325: `transform` → `"absolute top-0.5 size-4 rounded-full bg-white transition-transform",`
  - L326: `translate` → `value ? "translate-x-[1.125rem]" : "translate-x-0.5",`

### `src/components/admin/ProductRatingManager.tsx`
- Summary: `animate-`×2, `shadow-`×1
  - L117: `animate-` → `<Loader2 className="size-4 animate-spin" /> Loading rating data…`
  - L154: `shadow-` → `className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"`
  - L165: `animate-` → `{busy ? <Loader2 className="size-3.5 animate-spin" /> : <ShieldCheck className="size-3.5" />}`

### `src/components/admin/PublishConfirm.tsx`
- Summary: `animate-`×3, `blur`×1, `opacity`×2, `shadow-`×1
  - L26: `blur` → `<div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md grid place-items-center p-4 animate-in fade-in duration-200">`
  - L26: `animate-` → `<div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md grid place-items-center p-4 animate-in fade-in duration-200">`
  - L27: `shadow-` → `<div className="card-premium rounded-3xl p-7 max-w-md w-full border border-accent/30 shadow-2xl animate-in zoom-in-95 duration-200">`
  - L27: `animate-` → `<div className="card-premium rounded-3xl p-7 max-w-md w-full border border-accent/30 shadow-2xl animate-in zoom-in-95 duration-200">`
  - L46: `opacity` → `className="px-5 py-2.5 rounded-full text-[11px] uppercase tracking-widest font-mono border border-border hover:bg-white/5 disabled:opacity-50"`
  - L54: `opacity` → `className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] uppercase tracking-widest font-bold bg-accent text-accent-foreground hover:bg-accent/90 disabled:opac`
  - L56: `animate-` → `{working ? <Loader2 className="size-3.5 animate-spin" /> : <Rocket className="size-3.5" />}`

### `src/components/admin/ReturnAdminCard.tsx`
- Summary: `blur`×1, `filter`×1, `rotate`×3, `transform`×3
  - L81: `filter` → `const photos = (r.photo_urls ?? []).filter(Boolean);`
  - L245: `transform` → `<ChevronDown className={`size-4 shrink-0 transition-transform ${orderOpen ? "rotate-180" : ""}`} />`
  - L245: `rotate` → `<ChevronDown className={`size-4 shrink-0 transition-transform ${orderOpen ? "rotate-180" : ""}`} />`
  - L291: `transform` → `<ChevronDown className={`size-4 shrink-0 transition-transform ${customerOpen ? "rotate-180" : ""}`} />`
  - L291: `rotate` → `<ChevronDown className={`size-4 shrink-0 transition-transform ${customerOpen ? "rotate-180" : ""}`} />`
  - L319: `transform` → `<ChevronDown className={`size-4 shrink-0 text-muted-foreground transition-transform ${evidenceOpen ? "rotate-180" : ""}`} />`
  - L319: `rotate` → `<ChevronDown className={`size-4 shrink-0 text-muted-foreground transition-transform ${evidenceOpen ? "rotate-180" : ""}`} />`
  - L413: `blur` → `<div className="sticky bottom-0 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 px-4 sm:px-6 pt-3 pb-4 bg-gradient-to-t from-background via-background/95 to-transparent backdrop-blur-sm border-t bor`

### `src/components/admin/ReturnQueueCard.tsx`
- Summary: `transform`×1, `translate`×1
  - L72: `transform` → `<ChevronRight className="size-4 group-hover:translate-x-0.5 transition-transform" />`
  - L72: `translate` → `<ChevronRight className="size-4 group-hover:translate-x-0.5 transition-transform" />`

### `src/components/admin/SaveStateBadge.tsx`
- Summary: `animate-`×1
  - L41: `animate-` → `icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,`

### `src/components/admin/SectionAnalyticsPanel.tsx`
- Summary: `animate-`×1, `opacity`×1
  - L32: `opacity` → `initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}`
  - L43: `animate-` → `<div className="grid place-items-center py-10"><Loader2 className="size-5 animate-spin text-accent" /></div>`

### `src/components/admin/SegmentActivationCenter.tsx`
- Summary: `animate-`×1, `opacity`×1
  - L109: `opacity` → `className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-40 transition-colors">`
  - L110: `animate-` → `{busy === id ? <Loader2 className="size-3.5 animate-spin" /> : a.icon}`

### `src/components/admin/SegmentedTabs.tsx`
- Summary: `mask`×1, `scale`×1, `shadow-`×1
  - L18: `mask` → `{/* edge fade masks */}`
  - L39: `scale` → `whileTap={{ scale: 0.93 }}`
  - L47: `shadow-` → `className="absolute inset-0 rounded-full bg-accent shadow-[var(--shadow-ember)]"`

### `src/components/admin/StorefrontDashboardPanel.tsx`
- Summary: `animate-`×1, `blur`×3, `filter`×6, `opacity`×4, `shadow-`×1
  - L87: `filter` → `const today = list.filter((o) => new Date(o.created_at) >= startToday);`
  - L88: `filter` → `const revenueToday = today.filter(isPaid).reduce((s, o) => s + (Number(o.total) || 0), 0);`
  - L89: `filter` → `const pending = list.filter((o) => o.status === "pending" || o.status === "processing").length;`
  - L91: `filter` → `const outOfStock = products.filter((p) => !p.inStock);`
  - L92: `filter` → `const lowStock = products.filter(`
  - L127: `opacity` → `initial={{ opacity: 0 }}`
  - L128: `opacity` → `animate={{ opacity: 1 }}`
  - L129: `opacity` → `exit={{ opacity: 0 }}`
  - L130: `blur` → `className="absolute inset-0 bg-background/60 backdrop-blur-sm"`
  - L138: `shadow-` → `className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-accent/20 bg-background/95 backdrop-blur-2xl shadow-[-30px_0_80px_-30px_oklch(0.74_0.19_49/0.`
  - L138: `blur` → `className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-accent/20 bg-background/95 backdrop-blur-2xl shadow-[-30px_0_80px_-30px_oklch(0.74_0.19_49/0.`
  - L169: `opacity` → `className="pointer-events-none absolute -right-4 -top-6 size-16 rounded-full opacity-25"`
  - L170: `filter` → `style={{ background: "var(--gradient-ember-soft)", filter: "blur(16px)" }}`
  - L170: `blur` → `style={{ background: "var(--gradient-ember-soft)", filter: "blur(16px)" }}`
  - L230: `animate-` → `<Loader2 className="size-4 animate-spin text-accent" />`

### `src/components/admin/SupportSatisfactionPanel.tsx`
- Summary: `animate-`×1, `filter`×7, `opacity`×2
  - L105: `filter` → `const monthly = ratings.filter((r) => {`
  - L109: `filter` → `const dist = [5, 4, 3, 2, 1].map((star) => ({ star, count: ratings.filter((r) => r.rating === star).length }));`
  - L110: `filter` → `const csat = all.length ? (ratings.filter((r) => r.rating >= 4).length / all.length) * 100 : 0;`
  - L112: `filter` → `const firstResp = tickets.filter((t) => t.first_response_at).map((t) => +new Date(t.first_response_at!) - +new Date(t.created_at));`
  - L118: `filter` → `.filter((v): v is number => v != null);`
  - L168: `filter` → `.filter((r) => r.rating <= 2)`
  - L205: `animate-` → `if (loading) return <div className="grid place-items-center py-20"><Loader2 className="size-5 animate-spin text-accent" /></div>;`
  - L304: `filter` → `<p className="text-[11px] font-mono uppercase tracking-widest text-destructive mb-3 flex items-center gap-1.5"><ThumbsDown className="size-3.5" />Negative feedback queue · {negativ`
  - L312: `opacity` → `<div key={r.id} className={cn("rounded-xl border p-3", r.reviewed ? "border-border/50 bg-white/[0.02] opacity-70" : "border-destructive/30 bg-white/[0.02]")}>`
  - L367: `opacity` → `className={cn("inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors disabled:opacity-50",`

### `src/components/admin/SwipeRow.tsx`
- Summary: `blur`×1, `shadow-`×1
  - L129: `blur` → `<div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => setMenuOpen(false)}>`
  - L131: `shadow-` → `className="grid w-[min(20rem,90%)] gap-1.5 rounded-2xl border border-accent/25 bg-background/95 p-2 shadow-[0_20px_60px_-15px_oklch(0.74_0.19_49/0.45)]"`

### `src/components/admin/TestimonialsEditor.tsx`
- Summary: `animate-`×3, `opacity`×1
  - L67: `animate-` → `{deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />} Delete`
  - L72: `opacity` → `className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-accent text-accent-foreground font-medium hover:opacity-90">`
  - L73: `animate-` → `{saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />} {isNew ? "Add" : "Save"}`
  - L128: `animate-` → `return <div className="grid place-items-center py-16"><Loader2 className="size-6 animate-spin text-accent" /></div>;`

### `src/components/admin/TicketOpsSheet.tsx`
- Summary: `animate-`×2, `blur`×2, `filter`×9, `opacity`×5, `shadow-`×1
  - L169: `filter` → `.on("postgres_changes", { event: "*", schema: "public", table: "support_tickets", filter: `id=eq.${ticketId}` }, schedule)`
  - L170: `filter` → `.on("postgres_changes", { event: "*", schema: "public", table: "support_ticket_events", filter: `ticket_id=eq.${ticketId}` }, schedule)`
  - L171: `filter` → `.on("postgres_changes", { event: "*", schema: "public", table: "support_internal_notes", filter: `ticket_id=eq.${ticketId}` }, schedule)`
  - L172: `filter` → `.on("postgres_changes", { event: "*", schema: "public", table: "support_messages", filter: `ticket_id=eq.${ticketId}` }, schedule)`
  - L253: `filter` → `const ltv = useMemo(() => orders.filter((o) => PAID.includes((o.payment_status ?? o.status ?? "").toLowerCase())).reduce((a, b) => a + (b.total || 0), 0), [orders]);`
  - L257: `filter` → `const openT = userTickets.filter((t) => t.status !== "resolved" && t.status !== "closed").length;`
  - L258: `filter` → `const resolvedT = userTickets.filter((t) => t.status === "resolved" || t.status === "closed");`
  - L281: `filter` → `const positive = ratings.filter((r) => r.rating >= 4).length;`
  - L282: `filter` → `const negative = ratings.filter((r) => r.rating <= 2).length;`
  - L301: `blur` → `<div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />`
  - L302: `shadow-` → `<div className="relative w-full max-w-lg h-full overflow-y-auto bg-background border-l border-border shadow-2xl">`
  - L304: `blur` → `<div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-5 py-4">`
  - L331: `animate-` → `<div className="grid place-items-center py-24"><Loader2 className="size-5 animate-spin text-accent" /></div>`
  - L373: `opacity` → `className={cn("rounded-full px-3 py-1.5 text-[11px] font-medium border transition-colors disabled:opacity-100",`
  - L386: `opacity` → `className={cn("rounded-full px-3 py-1.5 text-[11px] font-medium border transition-colors disabled:opacity-100",`
  - L467: `opacity` → `t.id === ticketId ? "opacity-60" : "hover:border-accent/40 hover:bg-accent/[0.04]",`
  - L601: `opacity` → `className="rounded-xl bg-accent text-accent-foreground p-2.5 disabled:opacity-50 hover:brightness-110 shrink-0">`
  - L602: `animate-` → `{savingNote ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}`
  - L655: `opacity` → `className={cn("inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors disabled:opacity-50",`

### `src/components/admin/VersionHistorySheet.tsx`
- Summary: `animate-`×1
  - L92: `animate-` → `<Loader2 className="h-5 w-5 animate-spin" />`

### `src/components/admin/VirtualTable.tsx`
- Summary: `blur`×1, `contain`×2, `transform`×2, `translate`×1
  - L21: `transform` → `* re-renders on realtime appends. GPU-accelerated transforms only.`
  - L51: `blur` → `className="sticky top-0 z-10 border-b border-white/10 bg-background/80 backdrop-blur text-[10px] font-mono uppercase tracking-widest text-muted-foreground"`
  - L59: `contain` → `className="overflow-auto overscroll-contain"`
  - L60: `contain` → `style={{ maxHeight, contain: "strict" }}`
  - L71: `transform` → `style={{ transform: `translateY(${vi.start}px)`, willChange: "transform" }}`
  - L71: `translate` → `style={{ transform: `translateY(${vi.start}px)`, willChange: "transform" }}`

### `src/components/admin/product-editor/category-selector.tsx`
- Summary: `animate-`×2, `filter`×4, `opacity`×6, `scale`×3, `translate`×2
  - L69: `filter` → `const parents = useMemo(() => cats.filter((c) => !c.parent_id), [cats]);`
  - L71: `filter` → `() => cats.filter((c) => c.parent_id && c.parent_id === mainId),`
  - L84: `filter` → `onChange(selected.filter((s) => s !== slug));`
  - L88: `filter` → `onChange([slug, ...selected.filter((s) => s !== slug)]);`
  - L146: `animate-` → `<Loader2 className="size-4 animate-spin" /> Loading live categories…`
  - L172: `scale` → `className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-1 text-[10px] text-muted-foreground transition-all hover:text-foreground active:scale-95">`
  - L195: `opacity` → `className="opacity-60 transition-opacity hover:opacity-100">`
  - L201: `opacity` → `className="opacity-60 transition-opacity hover:opacity-100">`
  - L228: `translate` → `<ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />`
  - L241: `opacity` → `className="w-full appearance-none rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 pr-9 text-sm text-foreground focus:border-accent/40 focus:outline-none disabled:opac`
  - L250: `translate` → `<ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />`
  - L253: `scale` → `className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2.5 text-xs font-medium text-foreground transition-all hover:bg-accent/`
  - L253: `opacity` → `className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2.5 text-xs font-medium text-foreground transition-all hover:bg-accent/`
  - L268: `opacity` → `className="w-full flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent/40 focus:outlin`
  - L271: `scale` → `className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2.5 text-xs font-medium text-foreground transition-all hover:bg-accent/`
  - L271: `opacity` → `className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2.5 text-xs font-medium text-foreground transition-all hover:bg-accent/`
  - L272: `animate-` → `{creating ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}`

### `src/components/admin/product-editor/field-builders.tsx`
- Summary: `filter`×2, `scale`×2
  - L29: `filter` → `const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));`
  - L50: `scale` → `className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:text-fo`
  - L70: `filter` → `const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i));`
  - L94: `scale` → `className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:text-fo`

### `src/components/admin/product-editor/kit.tsx`
- Summary: `animate-`×3, `blur`×3, `contain`×1, `filter`×2, `isolation`×1, `opacity`×3, `scale`×5, `shadow-`×1
  - L56: `filter` → `export const parseList = (text: string): string[] => text.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);`
  - L165: `blur` → `<div className="sticky top-0 z-40 -mx-4 -mt-4 lg:-mx-10 lg:-mt-6 mb-3 border-b border-white/10 bg-background/85 px-4 py-2.5 backdrop-blur-xl lg:px-10">`
  - L171: `scale` → `className="grid size-9 place-items-center rounded-full border border-white/10 bg-white/[0.03] text-muted-foreground transition-all hover:text-foreground hover:border-white/20 activ`
  - L184: `scale` → `className="grid size-9 place-items-center rounded-full border border-white/10 bg-white/[0.03] text-muted-foreground transition-all hover:text-foreground hover:border-white/20 activ`
  - L276: `contain` → `* Self-contained editor for a single product section.`
  - L336: `filter` → `return Object.keys(form).filter((k) => JSON.stringify(form[k]) !== JSON.stringify(base[k]));`
  - L471: `isolation` → `<AdminShell title={title} subtitle="Edit this section in isolation — changes never touch other sections." allow={allow ?? ["admin", "super_admin", "manager"]}>`
  - L479: `animate-` → `<div className="grid place-items-center py-24"><Loader2 className="size-5 animate-spin text-accent" /></div>`
  - L501: `opacity` → `<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}`
  - L519: `blur` → `className="fixed bottom-0 inset-x-0 lg:left-[17.5rem] z-[75] border-t border-border bg-background/95 backdrop-blur-xl"`
  - L531: `scale` → `className="grid size-11 place-items-center rounded-lg border border-white/12 bg-white/[0.03] text-muted-foreground transition-all hover:text-foreground hover:border-white/25 active`
  - L540: `shadow-` → `className="absolute bottom-[calc(100%+0.5rem)] left-0 w-52 overflow-hidden rounded-xl border border-white/10 bg-background/95 shadow-xl backdrop-blur-xl"`
  - L540: `blur` → `className="absolute bottom-[calc(100%+0.5rem)] left-0 w-52 overflow-hidden rounded-xl border border-white/10 bg-background/95 shadow-xl backdrop-blur-xl"`
  - L570: `scale` → `className="inline-flex h-11 basis-[35%] grow-0 items-center justify-center gap-1.5 rounded-lg border border-accent/35 bg-accent/10 px-3 text-xs font-semibold text-accent transition`
  - L580: `scale` → `className={`inline-flex h-11 basis-[65%] grow items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-40 disab`
  - L580: `opacity` → `className={`inline-flex h-11 basis-[65%] grow items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-40 disab`
  - L583: `animate-` → `<><Loader2 className="size-4 animate-spin" /> Saving…</>`
  - L628: `opacity` → `className={`flex w-full items-center gap-2.5 px-3.5 py-3 text-left text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${`
  - L658: `animate-` → `<div className="grid place-items-center py-24"><Loader2 className="size-5 animate-spin text-accent" /></div>`

### `src/components/admin/product-editor/media-fields.tsx`
- Summary: `animate-`×2, `blur`×3, `filter`×3, `opacity`×12, `scale`×5, `shadow-`×3, `transform`×3
  - L110: `filter` → `setTimeout(() => setUploads((u) => u.filter((x) => x.error)), 1200);`
  - L116: `filter` → `const reordered = [img, ...images.filter((i) => i.id !== img.id)];`
  - L153: `filter` → `const remaining = images.filter((i) => i.id !== img.id);`
  - L224: `scale` → `className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:text-fore`
  - L224: `opacity` → `className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:text-fore`
  - L228: `scale` → `className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-accent-foreground transition-all hover:brightness-110 active:scale-[0.97`
  - L228: `opacity` → `className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-accent-foreground transition-all hover:brightness-110 active:scale-[0.97`
  - L243: `opacity` → `atLimit && "opacity-40 pointer-events-none",`
  - L258: `opacity` → `<motion.div key={u.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}`
  - L273: `animate-` → `<div className="grid place-items-center py-10"><Loader2 className="size-5 animate-spin text-accent" /></div>`
  - L305: `transform` → `const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: img.id });`
  - L307: `transform` → `transform: CSS.Transform.toString(transform),`
  - L308: `transform` → `transition: transition ?? "transform 180ms ease",`
  - L310: `opacity` → `opacity: isDragging ? 0.9 : 1,`
  - L321: `scale` → `isDragging && "scale-[1.03] shadow-2xl ring-2 ring-accent/50",`
  - L321: `shadow-` → `isDragging && "scale-[1.03] shadow-2xl ring-2 ring-accent/50",`
  - L322: `shadow-` → `isPrimary ? "border-2 border-accent ring-1 ring-accent/40 shadow-[0_8px_30px_-10px_oklch(0.74_0.19_49/0.5)]" : "border border-white/10",`
  - L331: `shadow-` → `<span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest text-accent-fo`
  - L338: `blur` → `"absolute right-1.5 top-1.5 grid min-w-5 place-items-center rounded-md px-1 py-0.5 text-[10px] font-bold backdrop-blur",`
  - L343: `opacity` → `<span className="pointer-events-none absolute left-1.5 bottom-9 grid size-5 place-items-center rounded-md bg-black/45 text-white/70 opacity-0 backdrop-blur transition-opacity group`
  - … 11 more matching lines omitted for brevity

### `src/components/builder/AddBlockMenu.tsx`
- Summary: `blur`×2, `opacity`×2, `scale`×1, `shadow-`×1
  - L29: `opacity` → `<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}`
  - L30: `blur` → `className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} />`
  - L32: `scale` → `initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }}`
  - L32: `opacity` → `initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }}`
  - L34: `shadow-` → `className="relative z-10 w-full max-w-lg rounded-3xl border border-accent/25 bg-background/95 p-5 backdrop-blur-2xl shadow-[0_30px_80px_-20px_oklch(0.74_0.19_49/0.5)]"`
  - L34: `blur` → `className="relative z-10 w-full max-w-lg rounded-3xl border border-accent/25 bg-background/95 p-5 backdrop-blur-2xl shadow-[0_30px_80px_-20px_oklch(0.74_0.19_49/0.5)]"`

### `src/components/builder/BlockAnalyticsPanel.tsx`
- Summary: `animate-`×1, `blur`×2, `opacity`×1
  - L46: `opacity` → `<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}`
  - L47: `blur` → `className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} />`
  - L51: `blur` → `className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col border-l border-accent/20 bg-background/95 backdrop-blur-2xl"`
  - L66: `animate-` → `<div className="grid place-items-center py-16"><Loader2 className="size-5 animate-spin text-accent" /></div>`

### `src/components/builder/BlockEditorSheet.tsx`
- Summary: `animate-`×1, `blur`×2, `opacity`×2, `shadow-`×1, `transform`×1, `translate`×1
  - L134: `opacity` → `initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}`
  - L135: `blur` → `className="absolute inset-0 bg-background/70 backdrop-blur-sm"`
  - L141: `shadow-` → `className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-accent/20 bg-background/95 backdrop-blur-2xl shadow-[-30px_0_80px_-30px_oklch(0.74_0.19_49/0.`
  - L141: `blur` → `className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-accent/20 bg-background/95 backdrop-blur-2xl shadow-[-30px_0_80px_-30px_oklch(0.74_0.19_49/0.`
  - L238: `transform` → `<span className={`absolute top-0.5 size-4 rounded-full bg-white transition-transform ${f.active ? "translate-x-[1.125rem]" : "translate-x-0.5"}`} />`
  - L238: `translate` → `<span className={`absolute top-0.5 size-4 rounded-full bg-white transition-transform ${f.active ? "translate-x-[1.125rem]" : "translate-x-0.5"}`} />`
  - L247: `opacity` → `className="ml-auto inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-semibold text-accent-foreground transition-all hover:brightness-110 disabled:opacity`
  - L248: `animate-` → `{saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />} Save changes`

### `src/components/builder/BlockPreview.tsx`
- Summary: `blur`×1, `filter`×1, `opacity`×2
  - L42: `opacity` → `<div className={`relative overflow-hidden rounded-2xl border p-4 transition-opacity ${live ? "border-border bg-card/60" : "border-dashed border-border/60 bg-card/30 opacity-60"}`}>`
  - L43: `filter` → `<div className="pointer-events-none absolute -right-6 -top-8 size-20 rounded-full opacity-20" style={{ background: "var(--gradient-ember-soft)", filter: "blur(18px)" }} />`
  - L43: `opacity` → `<div className="pointer-events-none absolute -right-6 -top-8 size-20 rounded-full opacity-20" style={{ background: "var(--gradient-ember-soft)", filter: "blur(18px)" }} />`
  - L43: `blur` → `<div className="pointer-events-none absolute -right-6 -top-8 size-20 rounded-full opacity-20" style={{ background: "var(--gradient-ember-soft)", filter: "blur(18px)" }} />`

### `src/components/builder/BlockToolbar.tsx`
- Summary: `animate-`×3, `blur`×1, `opacity`×2, `shadow-`×1
  - L25: `opacity` → `"grid size-8 place-items-center rounded-lg border border-white/10 bg-background/60 text-muted-foreground transition-colors hover:border-accent/40 hover:text-accent disabled:opacity`
  - L47: `animate-` → `{busy === "dup" ? <Loader2 className="size-3.5 animate-spin" /> : <Copy className="size-3.5" />}`
  - L53: `animate-` → `{busy === "vis" ? <Loader2 className="size-3.5 animate-spin" /> : block.active ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}`
  - L68: `shadow-` → `<div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border border-white/10 bg-background/95 p-1 backdrop-blur-2xl shadow-xl"`
  - L68: `blur` → `<div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border border-white/10 bg-background/95 p-1 backdrop-blur-2xl shadow-xl"`
  - L105: `opacity` → `className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors hover:bg-white/5 disabled:opacity-50 ${danger ? "text-destructive" : "text-for`
  - L106: `animate-` → `{busy ? <Loader2 className="size-3.5 animate-spin" /> : <Icon className="size-3.5" />} {label}`

### `src/components/builder/HomepageBuilder.tsx`
- Summary: `animate-`×2, `blur`×1, `filter`×4, `scale`×1
  - L70: `filter` → `const ordered = order.map((id) => byId.get(id)).filter(Boolean) as StorefrontBlock[];`
  - L71: `filter` → `const visible = ordered.filter((b) => matchesStatusFilter(b, status));`
  - L87: `filter` → `// so hidden/filtered blocks keep their slots.`
  - L119: `blur` → `<div className="sticky top-0 z-20 -mx-4 mb-5 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">`
  - L142: `filter` → `{/* Schedule / status filter */}`
  - L153: `animate-` → `{reordering && <Loader2 className="size-3.5 animate-spin text-accent" />}`
  - L167: `animate-` → `<div className="grid place-items-center py-24"><Loader2 className="size-6 animate-spin text-accent" /></div>`
  - L185: `scale` → `whileDrag={{ scale: 1.01, boxShadow: "0 20px 50px -15px oklch(0 0 0 / 0.6)" }}`

### `src/components/chat/LiveChat.tsx`
- Summary: `animate-`×9, `animation`×1, `blur`×12, `filter`×4, `scale`×9, `shadow-`×6, `transform`×1
  - L286: `scale` → `className={`group fixed right-4 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground animate-orb-brea`
  - L286: `animate-` → `className={`group fixed right-4 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground animate-orb-brea`
  - L303: `blur` → `className="fixed inset-0 z-[70] flex flex-col bg-background/95 backdrop-blur-xl animate-chat-slide-up"`
  - L303: `animate-` → `className="fixed inset-0 z-[70] flex flex-col bg-background/95 backdrop-blur-xl animate-chat-slide-up"`
  - L313: `blur` → `className="relative z-10 border-b border-border/60 bg-card/70 backdrop-blur-xl"`
  - L322: `scale` → `className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/90 transition-colors hover:bg-foreground/10 active:scale-90"`
  - L343: `scale` → `className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/90 transition-colors hover:bg-foreground/10 active:scale-90"`
  - L352: `shadow-` → `className="z-[90] w-52 rounded-2xl border-border/60 bg-popover/95 p-1.5 backdrop-blur-xl shadow-[var(--shadow-float)]"`
  - L352: `blur` → `className="z-[90] w-52 rounded-2xl border-border/60 bg-popover/95 p-1.5 backdrop-blur-xl shadow-[var(--shadow-float)]"`
  - L416: `blur` → `className="relative z-10 border-t border-border/60 bg-card/70 px-3 pt-2.5 backdrop-blur-xl"`
  - L441: `transform` → `<button type="button" onClick={handleSend} aria-label="Send message" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-p`
  - L441: `scale` → `<button type="button" onClick={handleSend} aria-label="Send message" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-p`
  - L475: `filter` → `const filtered = useMemo(() => {`
  - L478: `filter` → `return orders.filter((o) =>`
  - L487: `shadow-` → `<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-[var(--shadow-ember`
  - L487: `animate-` → `<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-[var(--shadow-ember`
  - L514: `filter` → `{filtered.length === 0 ? (`
  - L517: `filter` → `filtered.map((o) => (`
  - L525: `blur` → `<div className="rounded-3xl border border-border/60 bg-card/60 p-4 backdrop-blur-xl">`
  - L535: `scale` → `className="rounded-full border border-border/60 bg-secondary/60 px-3 py-1.5 text-xs text-foreground/90 transition-colors hover:border-primary/50 hover:bg-secondary active:scale-95"`
  - … 22 more matching lines omitted for brevity

### `src/components/site/AdaptiveProductMedia.tsx`
- Summary: `animate-`×1, `contain`×5, `opacity`×2, `scale`×1, `transform`×1
  - L14: `contain` → `* Product media container with seamless background matching.`
  - L17: `contain` → `* edges/corners, cached per-src) and sets the container background to exactly`
  - L20: `contain` → `* photo is never modified; it's centered with object-contain and even padding.`
  - L44: `animate-` → `className="absolute inset-0 animate-pulse"`
  - L58: `contain` → `? "relative z-[1] block h-full w-full rounded-[14px] object-contain object-center"`
  - L59: `transform` → `: "relative z-[1] block h-full w-full rounded-[14px] object-contain object-center transition-[transform,opacity] duration-300 ease-out group-hover:scale-[1.03]"`
  - L59: `scale` → `: "relative z-[1] block h-full w-full rounded-[14px] object-contain object-center transition-[transform,opacity] duration-300 ease-out group-hover:scale-[1.03]"`
  - L59: `contain` → `: "relative z-[1] block h-full w-full rounded-[14px] object-contain object-center transition-[transform,opacity] duration-300 ease-out group-hover:scale-[1.03]"`
  - L59: `opacity` → `: "relative z-[1] block h-full w-full rounded-[14px] object-contain object-center transition-[transform,opacity] duration-300 ease-out group-hover:scale-[1.03]"`
  - L61: `opacity` → `style={{ opacity: revealed ? 1 : 0 }}`

### `src/components/site/AddressForm.tsx`
- Summary: `animate-`×4, `filter`×3, `opacity`×3, `shadow-`×4, `translate`×2
  - L270: `filter` → `const line1 = [a.house_number, a.road || a.pedestrian || a.footway].filter(Boolean).join(" ");`
  - L305: `filter` → `line2: p.line2 || [locality, area, district].filter(Boolean).join(", "),`
  - L494: `shadow-` → `? "border-accent bg-accent/10 text-accent shadow-[0_0_20px_-6px_var(--color-accent)]"`
  - L512: `opacity` → `className={`relative overflow-hidden text-left rounded-[20px] border p-3.5 min-h-[88px] transition-all duration-200 disabled:opacity-70 ${`
  - L514: `shadow-` → `? "border-accent bg-accent/10 shadow-[0_0_28px_-8px_var(--color-accent)]"`
  - L524: `animate-` → `<Loader2 className="size-4 animate-spin" />`
  - L541: `shadow-` → `? "border-accent bg-accent/10 shadow-[0_0_28px_-8px_var(--color-accent)]"`
  - L569: `filter` → `.filter(Boolean)`
  - L595: `animate-` → `<Loader2 className="size-6 animate-spin text-accent" />`
  - L616: `translate` → `<Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />`
  - L732: `translate` → `<span className="absolute right-3 top-1/2 -translate-y-1/2">`
  - L733: `animate-` → `{pinState === "checking" && <Loader2 className="size-4 animate-spin text-muted-foreground" />}`
  - L758: `opacity` → `className={`${base} border-border opacity-90 cursor-not-allowed`}`
  - L860: `opacity` → `className="flex-1 bg-accent text-accent-foreground font-bold px-5 py-3.5 rounded-2xl text-[11px] uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-60 i`
  - L860: `shadow-` → `className="flex-1 bg-accent text-accent-foreground font-bold px-5 py-3.5 rounded-2xl text-[11px] uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-60 i`
  - L862: `animate-` → `{busy && <Loader2 className="size-3.5 animate-spin" />}`

### `src/components/site/AnnouncementBar.tsx`
- Summary: `blur`×2, `filter`×1, `opacity`×1, `rotate`×1, `translate`×1
  - L68: `rotate` → `* Live, DB-backed announcement bar. Auto-rotates active announcements and`
  - L88: `filter` → `const valid = ((data as Announcement[]) ?? []).filter(`
  - L136: `blur` → `className="relative h-9 overflow-hidden border-b border-accent/15 bg-background/80 backdrop-blur-md"`
  - L138: `opacity` → `<div aria-hidden className="absolute inset-0 opacity-40 pointer-events-none" style={{ background: gradient }} />`
  - L150: `translate` → `<div className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1.5">`
  - L164: `blur` → `"border border-accent/40 bg-background/70 text-accent backdrop-blur-md transition-all hover:bg-accent/15",`

### `src/components/site/AnnouncementMessage.motion.tsx`
- Summary: `opacity`×3
  - L22: `opacity` → `initial={{ opacity: 0, y: 10 }}`
  - L23: `opacity` → `animate={{ opacity: 1, y: 0 }}`
  - L24: `opacity` → `exit={{ opacity: 0, y: -10 }}`

### `src/components/site/BackButton.tsx`
- Summary: `opacity`×1, `transform`×1, `translate`×1
  - L37: `transform` → `<ArrowLeft className="size-4 shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5" />`
  - L37: `translate` → `<ArrowLeft className="size-4 shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5" />`
  - L39: `opacity` → `{showAccountIcon && <User className="size-4 shrink-0 opacity-80" />}`

### `src/components/site/CategoryCard.tsx`
- Summary: `box-shadow`×1, `contain`×1, `scale`×1, `shadow-`×2, `transform`×2, `translate`×1
  - L79: `contain` → `// the fixed aspect-square container).`
  - L87: `transform` → `className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] transition-[transform,box-shadow,border-color] duration-3`
  - L87: `translate` → `className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] transition-[transform,box-shadow,border-color] duration-3`
  - L87: `box-shadow` → `className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] transition-[transform,box-shadow,border-color] duration-3`
  - L87: `shadow-` → `className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] transition-[transform,box-shadow,border-color] duration-3`
  - L99: `transform` → `className="size-full object-cover [transition:transform_700ms_cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"`
  - L99: `scale` → `className="size-full object-cover [transition:transform_700ms_cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"`
  - L103: `shadow-` → `<span className="grid size-11 sm:size-14 place-items-center rounded-full bg-accent/12 text-accent ring-1 ring-accent/25 shadow-[0_0_24px_-10px_oklch(0.74_0.19_49/0.5)] transition-c`

### `src/components/site/CheckoutProgress.tsx`
- Summary: `scale`×1, `translate`×1
  - L45: `translate` → `<span className="relative flex-1 h-px min-w-3 sm:min-w-5 -translate-y-2 bg-white/10 overflow-hidden rounded-full">`
  - L48: `scale` → `animate={{ scaleX: i < currentIndex || done ? 1 : 0 }}`

### `src/components/site/CompareTray.tsx`
- Summary: `blur`×1, `filter`×1, `shadow-`×1, `translate`×1
  - L16: `filter` → `.filter((p): p is NonNullable<typeof p> => Boolean(p));`
  - L19: `translate` → `<div data-floating-control className="fixed left-1/2 z-[var(--z-floating-controls)] w-[min(94vw,720px)] -translate-x-1/2 bottom-[var(--floating-bottom-offset)] md:bottom-4">`
  - L20: `shadow-` → `<div className="bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-3 flex items-center gap-3">`
  - L20: `blur` → `<div className="bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-3 flex items-center gap-3">`

### `src/components/site/CouponInput.tsx`
- Summary: `animate-`×1, `opacity`×1
  - L133: `opacity` → `className="px-4 rounded-lg bg-accent text-accent-foreground text-xs font-bold uppercase tracking-widest disabled:opacity-40 inline-flex items-center gap-1.5"`
  - L135: `animate-` → `{busy ? <Loader2 className="size-3.5 animate-spin" /> : "Apply"}`

### `src/components/site/DesktopAccountDock.tsx`
- Summary: `shadow-`×1
  - L117: `shadow-` → `className={`hidden md:flex fixed z-[var(--z-bottom-nav)] touch-none cursor-grab active:cursor-grabbing select-none items-center gap-2 rounded-full glass-strong border border-white/`

### `src/components/site/DocPage.tsx`
- Summary: `animate-`×1, `blur`×4, `filter`×1, `opacity`×6, `scale`×1, `shadow-`×3, `transform`×3, `translate`×3
  - L54: `opacity` → `opacity: shown ? 1 : 0,`
  - L55: `transform` → `transform: shown ? "translateY(0)" : "translateY(22px)",`
  - L55: `translate` → `transform: shown ? "translateY(0)" : "translateY(22px)",`
  - L56: `transform` → `transition: `opacity 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,`
  - L56: `opacity` → `transition: `opacity 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,`
  - L71: `filter` → `const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);`
  - L117: `shadow-` → `className="h-full bg-gradient-to-r from-accent/40 via-accent to-accent/40 shadow-[0_0_12px_var(--color-accent)] transition-[width] duration-150 ease-out"`
  - L124: `translate` → `<div className="absolute -top-32 left-1/2 h-[420px] w-[820px] -translate-x-1/2 opacity-70 blur-3xl" style={{ background: "var(--gradient-ember)" }} />`
  - L124: `opacity` → `<div className="absolute -top-32 left-1/2 h-[420px] w-[820px] -translate-x-1/2 opacity-70 blur-3xl" style={{ background: "var(--gradient-ember)" }} />`
  - L124: `blur` → `<div className="absolute -top-32 left-1/2 h-[420px] w-[820px] -translate-x-1/2 opacity-70 blur-3xl" style={{ background: "var(--gradient-ember)" }} />`
  - L125: `opacity` → `<div className="absolute top-1/3 -right-40 h-[360px] w-[360px] opacity-40 blur-3xl" style={{ background: "var(--gradient-ember-soft)" }} />`
  - L125: `blur` → `<div className="absolute top-1/3 -right-40 h-[360px] w-[360px] opacity-40 blur-3xl" style={{ background: "var(--gradient-ember-soft)" }} />`
  - L134: `animate-` → `<span className="size-1.5 rounded-full bg-accent animate-glow" /> {eyebrow}`
  - L218: `opacity` → `<div aria-hidden className="pointer-events-none absolute inset-0 opacity-60 blur-2xl" style={{ background: "var(--gradient-ember-soft)" }} />`
  - L218: `blur` → `<div aria-hidden className="pointer-events-none absolute inset-0 opacity-60 blur-2xl" style={{ background: "var(--gradient-ember-soft)" }} />`
  - L227: `scale` → `className={`group inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all active:scale-95 ${c.primary ? "bg-accent text-accent-foreground shadow-[0`
  - L227: `shadow-` → `className={`group inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all active:scale-95 ${c.primary ? "bg-accent text-accent-foreground shadow-[0`
  - L230: `transform` → `<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />`
  - L230: `translate` → `<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />`
  - L263: `opacity` → `<span aria-hidden className="pointer-events-none absolute -right-6 -top-6 size-20 rounded-full bg-accent/10 blur-2xl transition-opacity opacity-0 group-hover:opacity-100" />`
  - … 2 more matching lines omitted for brevity

### `src/components/site/FlashDeals.tsx`
- Summary: `animate-`×3, `blur`×3, `box-shadow`×1, `filter`×2, `opacity`×3, `rotate`×1, `scale`×2, `shadow-`×5, `transform`×3, `translate`×2, `will-change`×2
  - L52: `opacity` → `className="absolute -top-16 -right-16 size-56 rounded-full blur-3xl opacity-30"`
  - L52: `blur` → `className="absolute -top-16 -right-16 size-56 rounded-full blur-3xl opacity-30"`
  - L65: `opacity` → `className="mt-1 inline-flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-5 py-2.5 text-xs font-mono uppercase tracking-widest hover:opacity-90 transition sha`
  - L65: `shadow-` → `className="mt-1 inline-flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-5 py-2.5 text-xs font-mono uppercase tracking-widest hover:opacity-90 transition sha`
  - L124: `blur` → `const iconStyle = { backgroundColor: "rgba(20,20,20,0.6)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.12)" } as const;`
  - L135: `transform` → `className="group flex h-full flex-col overflow-hidden rounded-[22px] shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-[transform,box-shadow,border-color] duration-200 will-change-tr`
  - L135: `translate` → `className="group flex h-full flex-col overflow-hidden rounded-[22px] shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-[transform,box-shadow,border-color] duration-200 will-change-tr`
  - L135: `will-change` → `className="group flex h-full flex-col overflow-hidden rounded-[22px] shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-[transform,box-shadow,border-color] duration-200 will-change-tr`
  - L135: `box-shadow` → `className="group flex h-full flex-col overflow-hidden rounded-[22px] shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-[transform,box-shadow,border-color] duration-200 will-change-tr`
  - L135: `shadow-` → `className="group flex h-full flex-col overflow-hidden rounded-[22px] shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-[transform,box-shadow,border-color] duration-200 will-change-tr`
  - L145: `transform` → `className="h-full w-full object-cover transition-transform duration-300 motion-safe:lg:group-hover:scale-[1.04]"`
  - L145: `scale` → `className="h-full w-full object-cover transition-transform duration-300 motion-safe:lg:group-hover:scale-[1.04]"`
  - L150: `shadow-` → `className={`absolute left-2 top-2 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase leading-none tracking-wide shadow-sm shadow-black/30 `
  - L156: `shadow-` → `<span data-product-badge className="absolute right-2 top-2 inline-flex items-center rounded-full bg-accent px-2 py-0.5 font-mono text-[9px] font-bold text-black shadow-[var(--shado`
  - L214: `rotate` → `// Homepage shows ONLY the first 4 active flash deals (rotated twice daily by`
  - L222: `filter` → `.filter((p) => p.featured && p.status === "published" && p.inStock && p.stockQuantity > 0)`
  - L263: `animate-` → `className="relative overflow-hidden rounded-[24px] p-5 sm:p-8 lg:p-10 motion-safe:animate-fade-in"`
  - L273: `opacity` → `className="pointer-events-none absolute -top-24 left-0 right-0 mx-auto h-56 w-[70%] rounded-full blur-3xl opacity-40"`
  - L273: `blur` → `className="pointer-events-none absolute -top-24 left-0 right-0 mx-auto h-56 w-[70%] rounded-full blur-3xl opacity-40"`
  - L278: `shadow-` → `<div className="animate-flame-pulse grid size-10 sm:size-11 place-items-center rounded-2xl bg-accent text-accent-foreground shadow-[var(--shadow-ember)] shrink-0">`
  - … 7 more matching lines omitted for brevity

### `src/components/site/FlashSaleStrip.tsx`
- Summary: `animate-`×1, `blur`×1, `filter`×1, `opacity`×1, `shadow-`×2
  - L69: `filter` → `.filter((p) => sale.product_slugs.includes(p.slug))`
  - L79: `opacity` → `className="absolute -top-16 -right-16 size-56 rounded-full blur-3xl opacity-40"`
  - L79: `blur` → `className="absolute -top-16 -right-16 size-56 rounded-full blur-3xl opacity-40"`
  - L85: `shadow-` → `<div className={`size-9 grid place-items-center rounded-xl bg-accent text-accent-foreground shadow-[var(--shadow-ember)] shrink-0 ${lowEnd ? "" : "animate-flame-pulse"}`}>`
  - L85: `animate-` → `<div className={`size-9 grid place-items-center rounded-xl bg-accent text-accent-foreground shadow-[var(--shadow-ember)] shrink-0 ${lowEnd ? "" : "animate-flame-pulse"}`}>`
  - L128: `shadow-` → `<span className="absolute top-1.5 left-1.5 inline-flex items-center rounded-full bg-accent text-black text-[9px] font-bold font-mono px-2 py-0.5 shadow-[var(--shadow-ember)]">`

### `src/components/site/Footer.tsx`
- Summary: `blur`×2, `filter`×1, `opacity`×6, `rotate`×1, `transform`×1, `translate`×5
  - L19: `transform` → `<ChevronDown className={`size-4 text-muted-foreground transition-transform md:hidden ${open ? "rotate-180" : ""}`} />`
  - L19: `rotate` → `<ChevronDown className={`size-4 text-muted-foreground transition-transform md:hidden ${open ? "rotate-180" : ""}`} />`
  - L35: `translate` → `<div aria-hidden className="pointer-events-none absolute -top-px left-1/2 -translate-x-1/2 w-[50%] h-px" style={{ background: "linear-gradient(90deg, transparent, var(--color-accen`
  - L35: `opacity` → `<div aria-hidden className="pointer-events-none absolute -top-px left-1/2 -translate-x-1/2 w-[50%] h-px" style={{ background: "linear-gradient(90deg, transparent, var(--color-accen`
  - L52: `translate` → `<div aria-hidden className="pointer-events-none absolute -top-px left-1/2 -translate-x-1/2 w-[70%] h-px" style={{ background: "linear-gradient(90deg, transparent, var(--color-accen`
  - L52: `opacity` → `<div aria-hidden className="pointer-events-none absolute -top-px left-1/2 -translate-x-1/2 w-[70%] h-px" style={{ background: "linear-gradient(90deg, transparent, var(--color-accen`
  - L53: `translate` → `<div aria-hidden className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[70%] h-32 opacity-40" style={{ background: "var(--gradient-ember-soft)", filter: "blur`
  - L53: `filter` → `<div aria-hidden className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[70%] h-32 opacity-40" style={{ background: "var(--gradient-ember-soft)", filter: "blur`
  - L53: `opacity` → `<div aria-hidden className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[70%] h-32 opacity-40" style={{ background: "var(--gradient-ember-soft)", filter: "blur`
  - L53: `blur` → `<div aria-hidden className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[70%] h-32 opacity-40" style={{ background: "var(--gradient-ember-soft)", filter: "blur`
  - L57: `opacity` → `<Link to="/" aria-label="FoundOurMarket home" className="inline-block text-lg sm:text-xl font-display tracking-tighter font-semibold hover:opacity-90 transition-opacity">`
  - L93: `translate` → `className="size-8 grid place-items-center rounded-xl glass text-muted-foreground hover:text-accent hover:border-accent/40 hover:-translate-y-0.5 transition-all"`
  - L135: `translate` → `<div aria-hidden className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[50%] h-px" style={{ background: "linear-gradient(90deg, transparent, var(--color-accent)`
  - L135: `opacity` → `<div aria-hidden className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[50%] h-px" style={{ background: "linear-gradient(90deg, transparent, var(--color-accent)`
  - L136: `opacity` → `<p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">© 2026 FoundOurMarket. All rights reserved. <span className="opacity-60 normal-case">build {BUI`
  - L137: `blur` → `<div className="flex w-full max-w-sm flex-wrap justify-center gap-1.5 rounded-2xl border border-border/70 bg-card/35 p-1.5 text-[10px] font-mono text-muted-foreground uppercase tra`

### `src/components/site/GlobalCheckoutBeta.tsx`
- Summary: `animate-`×4, `opacity`×4, `scale`×1
  - L107: `opacity` → `initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}`
  - L143: `scale` → `className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-accent inline-flex items-center gap-1.5 transition-colors active:scale-95">`
  - L151: `animate-` → `<div className="h-24 rounded-2xl bg-white/[0.03] animate-pulse" />`
  - L152: `animate-` → `<div className="h-24 rounded-2xl bg-white/[0.03] animate-pulse" />`
  - L224: `opacity` → `className="w-full mt-5 min-h-[56px] inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground font-bold rounded-full text-xs uppercase tracking-widest hover:br`
  - L225: `animate-` → `{placing ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-3.5" />}`
  - L241: `opacity` → `<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}`
  - L258: `opacity` → `className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 bg-sky-500 text-white font-bold rounded-full text-xs uppercase tracking-widest hover:brightness-110 tra`
  - L259: `animate-` → `{waitBusy ? <Loader2 className="size-4 animate-spin" /> : <BellRing className="size-3.5" />}`

### `src/components/site/HelpEnhancements.tsx`
- Summary: `blur`×4, `opacity`×5, `rotate`×1, `scale`×1, `shadow-`×1, `transform`×1
  - L11: `blur` → `const card = "rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl";`
  - L28: `opacity` → `initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}`
  - L31: `opacity` → `<div aria-hidden className="absolute -top-8 -right-8 size-20 rounded-full blur-2xl opacity-30"`
  - L31: `blur` → `<div aria-hidden className="absolute -top-8 -right-8 size-20 rounded-full blur-2xl opacity-30"`
  - L134: `opacity` → `<div aria-hidden className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />`
  - L169: `transform` → `<ChevronDown className={`size-4 text-white/50 transition-transform ${on ? "rotate-180" : ""}`} />`
  - L169: `rotate` → `<ChevronDown className={`size-4 text-white/50 transition-transform ${on ? "rotate-180" : ""}`} />`
  - L173: `opacity` → `<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}`
  - L208: `opacity` → `<div aria-hidden className="absolute -top-20 -right-20 size-56 rounded-full blur-3xl opacity-20"`
  - L208: `blur` → `<div aria-hidden className="absolute -top-20 -right-20 size-56 rounded-full blur-3xl opacity-20"`
  - L232: `blur` → `<div className="rounded-2xl border border-orange-400/25 bg-gradient-to-br from-orange-500/[0.1] to-transparent backdrop-blur-xl p-5 sm:p-6">`
  - L243: `scale` → `className="mt-4 inline-flex items-center gap-2 h-10 px-5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold shadow-lg shadow-orange-500/25 `
  - L243: `shadow-` → `className="mt-4 inline-flex items-center gap-2 h-10 px-5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold shadow-lg shadow-orange-500/25 `

### `src/components/site/HeroCarousel.tsx`
- Summary: `animate-`×4, `animation`×1, `blur`×14, `contain`×1, `drop-shadow`×1, `filter`×4, `mask`×1, `opacity`×10, `perspective`×1, `rotate`×5, `scale`×10, `transform`×7, `translate`×10, `translate3d`×1
  - L30: `scale` → `* recede on both sides with progressive scale, blur, grayscale, dimming and a`
  - L30: `blur` → `* recede on both sides with progressive scale, blur, grayscale, dimming and a`
  - L31: `rotate` → `* subtle rotateY toward center for cinematic depth. Supports autoplay, drag,`
  - L52: `filter` → `return (pool || []).filter((p) => !!p?.image).slice(0, 12);`
  - L92: `rotate` → `// Auto-rotate.`
  - L126: `scale` → `// Visible products + effect strength scale with the device tier so low-end`
  - L131: `scale` → `// to only 3 products. Tier only scales effect *intensity* for performance.`
  - L133: `blur` → `const blurScale = tier === "high" ? 1 : tier === "mid" ? 0.7 : 0.4;`
  - L136: `blur` → `blurScale,`
  - L179: `translate` → `<div aria-hidden className="pointer-events-none absolute top-0 bottom-0 left-1/2 w-screen -translate-x-1/2 -z-0 overflow-hidden">`
  - L180: `blur` → `{/* Heavy blurred backdrop + radial glows are GPU-expensive and, on`
  - L185: `blur` → `{/* full-bleed blurred product backdrop fills the empty side areas */}`
  - L191: `scale` → `className="absolute inset-0 size-full scale-125 object-cover opacity-[0.14] blur-[64px]"`
  - L191: `opacity` → `className="absolute inset-0 size-full scale-125 object-cover opacity-[0.14] blur-[64px]"`
  - L191: `blur` → `className="absolute inset-0 size-full scale-125 object-cover opacity-[0.14] blur-[64px]"`
  - L192: `opacity` → `style={{ transition: "opacity 800ms ease" }}`
  - L196: `translate` → `className="absolute left-1/2 -top-[20%] -translate-x-1/2 size-[460px] sm:size-[620px] rounded-full blur-[110px]"`
  - L196: `blur` → `className="absolute left-1/2 -top-[20%] -translate-x-1/2 size-[460px] sm:size-[620px] rounded-full blur-[110px]"`
  - L200: `translate` → `className="absolute left-1/2 top-1/3 -translate-x-1/2 h-[60%] w-[120%]"`
  - L203: `translate` → `<div className="absolute left-1/2 -top-[28%] -translate-x-1/2 size-[360px] sm:size-[460px] rounded-full blur-[100px] opacity-40" style={{ background: "radial-gradient(circle, oklch`
  - … 50 more matching lines omitted for brevity

### `src/components/site/ImageLightbox.tsx`
- Summary: `blur`×1, `contain`×1, `opacity`×7, `scale`×2
  - L60: `opacity` → `initial={{ opacity: 0 }}`
  - L61: `opacity` → `animate={{ opacity: 1 }}`
  - L62: `opacity` → `exit={{ opacity: 0 }}`
  - L63: `blur` → `className="fixed inset-0 z-[140] flex flex-col bg-background/95 backdrop-blur-xl print:hidden"`
  - L105: `scale` → `initial={{ opacity: 0, scale: 0.98 }}`
  - L105: `opacity` → `initial={{ opacity: 0, scale: 0.98 }}`
  - L106: `scale` → `animate={{ opacity: 1, scale: 1 }}`
  - L106: `opacity` → `animate={{ opacity: 1, scale: 1 }}`
  - L107: `opacity` → `exit={{ opacity: 0 }}`
  - L109: `contain` → `className="max-h-[72vh] max-w-full rounded-2xl object-contain"`
  - L134: `opacity` → `: "border-border opacity-60 hover:opacity-100"`

### `src/components/site/InstallPrompt.tsx`
- Summary: `blur`×1, `opacity`×4, `shadow-`×1, `translate`×1
  - L62: `opacity` → `initial={{ y: 120, opacity: 0 }}`
  - L63: `opacity` → `animate={{ y: 0, opacity: 1 }}`
  - L64: `opacity` → `exit={{ y: 120, opacity: 0 }}`
  - L67: `translate` → `className="fixed left-1/2 z-[var(--z-floating-controls)] -translate-x-1/2 px-4 w-full max-w-md"`
  - L72: `shadow-` → `<div className="flex items-center gap-3 rounded-2xl border border-border bg-card/95 p-3 pl-4 shadow-2xl backdrop-blur-xl md:p-4">`
  - L72: `blur` → `<div className="flex items-center gap-3 rounded-2xl border border-border bg-card/95 p-3 pl-4 shadow-2xl backdrop-blur-xl md:p-4">`
  - L84: `opacity` → `className="rounded-full bg-foreground px-4 py-2 text-xs font-medium uppercase tracking-wider text-background transition-opacity hover:opacity-90"`

### `src/components/site/LightMobileDrawer.tsx`
- Summary: `blur`×2, `opacity`×1, `scale`×8, `shadow-`×10, `transform`×4, `translate`×3, `will-change`×1
  - L84: `blur` → `{/* Soft blurred backdrop */}`
  - L86: `opacity` → `style={{ opacity: visible ? 1 : 0, transition: "opacity 0.3s ease" }}`
  - L87: `blur` → `className="absolute inset-0 bg-foreground/30 backdrop-blur-[6px]"`
  - L92: `transform` → `transform: visible ? "translateX(0)" : "translateX(-100%)",`
  - L92: `translate` → `transform: visible ? "translateX(0)" : "translateX(-100%)",`
  - L93: `transform` → `transition: "transform 0.42s cubic-bezier(0.22,1,0.36,1)",`
  - L95: `transform` → `className="absolute left-0 top-0 bottom-0 w-[92%] max-w-[420px] flex flex-col overflow-hidden border-r border-border bg-background shadow-[0_0_60px_-10px_oklch(0.4_0.02_260/0.25)] `
  - L95: `will-change` → `className="absolute left-0 top-0 bottom-0 w-[92%] max-w-[420px] flex flex-col overflow-hidden border-r border-border bg-background shadow-[0_0_60px_-10px_oklch(0.4_0.02_260/0.25)] `
  - L95: `shadow-` → `className="absolute left-0 top-0 bottom-0 w-[92%] max-w-[420px] flex flex-col overflow-hidden border-r border-border bg-background shadow-[0_0_60px_-10px_oklch(0.4_0.02_260/0.25)] `
  - L106: `scale` → `className="size-9 rounded-full grid place-items-center bg-card text-muted-foreground ring-1 ring-border shadow-sm hover:text-foreground active:scale-95 transition"`
  - L106: `shadow-` → `className="size-9 rounded-full grid place-items-center bg-card text-muted-foreground ring-1 ring-border shadow-sm hover:text-foreground active:scale-95 transition"`
  - L117: `transform` → `className="group relative flex items-center gap-4 rounded-3xl px-5 py-5 overflow-hidden bg-accent/10 ring-1 ring-accent/20 shadow-[var(--shadow-card)] active:scale-[0.985] transiti`
  - L117: `scale` → `className="group relative flex items-center gap-4 rounded-3xl px-5 py-5 overflow-hidden bg-accent/10 ring-1 ring-accent/20 shadow-[var(--shadow-card)] active:scale-[0.985] transiti`
  - L117: `shadow-` → `className="group relative flex items-center gap-4 rounded-3xl px-5 py-5 overflow-hidden bg-accent/10 ring-1 ring-accent/20 shadow-[var(--shadow-card)] active:scale-[0.985] transiti`
  - L120: `shadow-` → `<span className="relative grid place-items-center size-13 rounded-full bg-gradient-to-br from-accent to-[oklch(0.6_0.16_30)] text-accent-foreground font-semibold text-lg ring-2 rin`
  - L143: `translate` → `<ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition" />`
  - L157: `scale` → `className="relative flex items-center gap-2.5 rounded-2xl bg-card px-3.5 py-3 ring-1 ring-border shadow-[var(--shadow-card)] active:scale-[0.97] hover:ring-accent/30 transition"`
  - L157: `shadow-` → `className="relative flex items-center gap-2.5 rounded-2xl bg-card px-3.5 py-3 ring-1 ring-border shadow-[var(--shadow-card)] active:scale-[0.97] hover:ring-accent/30 transition"`
  - L175: `shadow-` → `<div className="rounded-2xl bg-card ring-1 ring-border shadow-[var(--shadow-card)] overflow-hidden divide-y divide-border">`
  - L187: `translate` → `<ChevronRight className="size-4 text-muted-foreground/50 group-hover:text-accent group-hover:translate-x-0.5 transition" />`
  - … 9 more matching lines omitted for brevity

### `src/components/site/MapPicker.tsx`
- Summary: `animate-`×5, `blur`×3, `contain`×1, `drop-shadow`×1, `filter`×2, `opacity`×2, `shadow-`×6, `translate`×4
  - L41: `filter` → `const line1 = [a.house_number, a.road || a.pedestrian || a.footway].filter(Boolean).join(" ");`
  - L49: `filter` → `return [line1, area, village, city, district, state, postal, country].filter(`
  - L384: `blur` → `className="relative z-[2200] shrink-0 border-b border-border bg-card/95 px-3 pb-3 backdrop-blur"`
  - L399: `translate` → `<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />`
  - L408: `translate` → `<Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />`
  - L408: `animate-` → `<Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />`
  - L412: `shadow-` → `<ul className="absolute inset-x-3 z-[2300] mt-2 max-h-64 divide-y divide-border overflow-auto rounded-2xl border border-border bg-card shadow-xl">`
  - L437: `translate` → `<div className="pointer-events-none absolute left-1/2 top-1/2 z-[1000] -translate-x-1/2 -translate-y-full">`
  - L439: `shadow-` → `className={`size-9 fill-accent/20 text-accent ${lowEnd ? "" : "drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]"}`}`
  - L439: `drop-shadow` → `className={`size-9 fill-accent/20 text-accent ${lowEnd ? "" : "drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]"}`}`
  - L449: `opacity` → `className="absolute right-4 z-[1200] grid size-12 place-items-center rounded-full border border-accent/40 bg-card text-accent shadow-lg disabled:opacity-70"`
  - L449: `shadow-` → `className="absolute right-4 z-[1200] grid size-12 place-items-center rounded-full border border-accent/40 bg-card text-accent shadow-lg disabled:opacity-70"`
  - L456: `animate-` → `<Loader2 className="size-5 animate-spin" />`
  - L463: `translate` → `<div className="pointer-events-none absolute left-1/2 top-4 z-[1200] -translate-x-1/2">`
  - L464: `shadow-` → `<span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/95 px-3 py-1.5 text-xs font-medium text-foreground shadow-lg backdrop-blur">`
  - L464: `blur` → `<span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/95 px-3 py-1.5 text-xs font-medium text-foreground shadow-lg backdrop-blur">`
  - L465: `animate-` → `<Loader2 className="size-3.5 animate-spin text-accent" />`
  - L473: `shadow-` → `className={`absolute inset-x-0 bottom-0 z-[1300] flex flex-col rounded-t-3xl border-t border-border bg-card ${lowEnd ? "" : "backdrop-blur shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.5)`
  - L473: `blur` → `className={`absolute inset-x-0 bottom-0 z-[1300] flex flex-col rounded-t-3xl border-t border-border bg-card ${lowEnd ? "" : "backdrop-blur shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.5)`
  - L493: `contain` → `<div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 pb-3">`
  - … 4 more matching lines omitted for brevity

### `src/components/site/MegaMenu.tsx`
- Summary: `blur`×10, `opacity`×4, `rotate`×1, `scale`×2, `shadow-`×2, `transform`×1, `translate`×5
  - L14: `blur` → `blurb: string;`
  - L23: `blur` → `blurb: "Audio, lighting & smart tech",`
  - L36: `blur` → `blurb: "Decor, storage & appliances",`
  - L49: `blur` → `blurb: "Devices, grooming & skincare",`
  - L60: `blur` → `blurb: "Fitness, recovery & wellness",`
  - L71: `blur` → `blurb: "On-the-go essentials",`
  - L84: `blur` → `blurb: "Camping, fitness & travel",`
  - L95: `blur` → `blurb: "Everything for your pets",`
  - L106: `blur` → `blurb: "Gentle care for little ones",`
  - L169: `transform` → `className={`size-3 transition-transform duration-200 ${isOpen ? "rotate-180 text-accent" : "opacity-60"}`}`
  - L169: `rotate` → `className={`size-3 transition-transform duration-200 ${isOpen ? "rotate-180 text-accent" : "opacity-60"}`}`
  - L169: `opacity` → `className={`size-3 transition-transform duration-200 ${isOpen ? "rotate-180 text-accent" : "opacity-60"}`}`
  - L175: `translate` → `className={`absolute left-1/2 top-full z-50 pt-3.5 -translate-x-1/2 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${`
  - L177: `translate` → `? "opacity-100 translate-y-0 scale-100 pointer-events-auto"`
  - L177: `scale` → `? "opacity-100 translate-y-0 scale-100 pointer-events-auto"`
  - L177: `opacity` → `? "opacity-100 translate-y-0 scale-100 pointer-events-auto"`
  - L178: `translate` → `: "opacity-0 translate-y-1 scale-[0.98] pointer-events-none"`
  - L178: `scale` → `: "opacity-0 translate-y-1 scale-[0.98] pointer-events-none"`
  - L178: `opacity` → `: "opacity-0 translate-y-1 scale-[0.98] pointer-events-none"`
  - L181: `shadow-` → `<div className="flex w-[680px] overflow-hidden rounded-2xl glass-strong ring-1 ring-white/12 shadow-[var(--shadow-float),0_0_70px_-22px_oklch(0.74_0.19_49/0.5)] backdrop-blur-2xl">`
  - … 5 more matching lines omitted for brevity

### `src/components/site/MobileBottomNav.tsx`
- Summary: `opacity`×2, `scale`×3, `transform`×1
  - L61: `transform` → `<span className="relative grid place-items-center size-9 rounded-2xl transition-transform duration-200 ease-out active:scale-90">`
  - L61: `scale` → `<span className="relative grid place-items-center size-9 rounded-2xl transition-transform duration-200 ease-out active:scale-90">`
  - L67: `scale` → `? "scale-100 bg-accent/15 opacity-100 ring-1 ring-accent/35"`
  - L67: `opacity` → `? "scale-100 bg-accent/15 opacity-100 ring-1 ring-accent/35"`
  - L68: `scale` → `: "scale-75 opacity-0"`
  - L68: `opacity` → `: "scale-75 opacity-0"`

### `src/components/site/Nav.tsx`
- Summary: `animate-`×2, `blur`×2, `filter`×2, `opacity`×4, `rotate`×2, `scale`×9, `shadow-`×7, `transform`×7, `translate`×3
  - L52: `transform` → `// CSS transforms. Android strips `transform` from header descendants (a`
  - L53: `transform` → `// compositor mitigation in styles.css); the previous transform-based offsets`
  - L57: `transform` → `"block h-[1.5px] w-5 rounded-full bg-current origin-center [transition:transform_0.4s_cubic-bezier(0.4,0,0.2,1),opacity_0.25s_ease]";`
  - L57: `opacity` → `"block h-[1.5px] w-5 rounded-full bg-current origin-center [transition:transform_0.4s_cubic-bezier(0.4,0,0.2,1),opacity_0.25s_ease]";`
  - L60: `transform` → `<span className={`${line} ${open ? "[transform:translateY(5.5px)_rotate(45deg)]" : ""}`} />`
  - L60: `translate` → `<span className={`${line} ${open ? "[transform:translateY(5.5px)_rotate(45deg)]" : ""}`} />`
  - L60: `rotate` → `<span className={`${line} ${open ? "[transform:translateY(5.5px)_rotate(45deg)]" : ""}`} />`
  - L61: `opacity` → `<span className={`${line} ${open ? "opacity-0" : "opacity-100"}`} />`
  - L62: `transform` → `<span className={`${line} ${open ? "[transform:translateY(-5.5px)_rotate(-45deg)]" : ""}`} />`
  - L62: `translate` → `<span className={`${line} ${open ? "[transform:translateY(-5.5px)_rotate(-45deg)]" : ""}`} />`
  - L62: `rotate` → `<span className={`${line} ${open ? "[transform:translateY(-5.5px)_rotate(-45deg)]" : ""}`} />`
  - L122: `filter` → `loadCategories().then((list) => setCats(list.filter((c) => !c.parent_id)));`
  - L189: `transform` → `transform: !isAndroid && hidden ? "translateY(-120px)" : "translateY(0)",`
  - L189: `translate` → `transform: !isAndroid && hidden ? "translateY(-120px)" : "translateY(0)",`
  - L190: `opacity` → `opacity: !isAndroid && hidden ? 0 : 1,`
  - L191: `filter` → `filter: "none",`
  - L192: `transform` → `transition: isAndroid ? "none" : "transform 0.45s cubic-bezier(0.22,1,0.36,1), opacity 0.35s ease",`
  - L192: `opacity` → `transition: isAndroid ? "none" : "transform 0.45s cubic-bezier(0.22,1,0.36,1), opacity 0.35s ease",`
  - L197: `shadow-` → `<nav className="max-w-7xl lg:max-w-[1480px] mx-auto rounded-[26px] glass-strong bg-gradient-to-b from-white/[0.06] to-black/30 shadow-[0_10px_40px_-18px_oklch(0_0_0/0.7)] ring-1 ri`
  - L197: `blur` → `<nav className="max-w-7xl lg:max-w-[1480px] mx-auto rounded-[26px] glass-strong bg-gradient-to-b from-white/[0.06] to-black/30 shadow-[0_10px_40px_-18px_oklch(0_0_0/0.7)] ring-1 ri`
  - … 18 more matching lines omitted for brevity

### `src/components/site/NewsletterForm.tsx`
- Summary: `animate-`×1, `opacity`×1
  - L68: `opacity` → `className="bg-accent text-accent-foreground font-bold px-8 py-3 rounded-full text-xs uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-60 inline-flex i`
  - L70: `animate-` → `{status === "loading" || authLoading ? <Loader2 className="size-4 animate-spin" /> : "Subscribe"}`

### `src/components/site/NotificationBell.tsx`
- Summary: `animate-`×1, `scale`×2, `shadow-`×3
  - L22: `scale` → `className={`relative size-10 sm:size-11 rounded-xl grid place-items-center text-muted-foreground transition-all duration-200 hover:text-accent hover:bg-accent/10 hover:shadow-[0_0_`
  - L22: `shadow-` → `className={`relative size-10 sm:size-11 rounded-xl grid place-items-center text-muted-foreground transition-all duration-200 hover:text-accent hover:bg-accent/10 hover:shadow-[0_0_`
  - L23: `shadow-` → `isActive ? "bg-accent/10 text-accent shadow-[0_0_18px_-6px_var(--color-accent)]" : ""`
  - L28: `scale` → `<span key={totalUnread} className="absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-accent text-accent-foreground text-[9px] font-bold font-mono leading-none r`
  - L28: `shadow-` → `<span key={totalUnread} className="absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-accent text-accent-foreground text-[9px] font-bold font-mono leading-none r`
  - L28: `animate-` → `<span key={totalUnread} className="absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-accent text-accent-foreground text-[9px] font-bold font-mono leading-none r`

### `src/components/site/OrderSupportSection.tsx`
- Summary: `filter`×3
  - L109: `filter` → `const aids = [...new Set(rows.map((t) => t.assigned_to).filter(Boolean) as string[])];`
  - L134: `filter` → `.on("postgres_changes", { event: "*", schema: "public", table: "support_tickets", filter: `order_id=eq.${orderId}` }, schedule)`
  - L178: `filter` → `const active = tickets.filter((t) => t.status !== "closed" && t.status !== "resolved");`

### `src/components/site/PhoneInput.tsx`
- Summary: `contain`×1, `filter`×4, `shadow-`×1
  - L137: `contain` → `if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);`
  - L162: `filter` → `const filtered = useMemo(() => {`
  - L167: `filter` → `return all.filter(`
  - L220: `shadow-` → `<div className="absolute z-50 mt-1.5 w-full max-h-64 overflow-hidden rounded-2xl border border-border bg-popover shadow-xl">`
  - L232: `filter` → `{filtered.map((c) => (`
  - L246: `filter` → `{filtered.length === 0 && (`

### `src/components/site/PolicyLinks.tsx`
- Summary: `scale`×1, `transform`×1, `translate`×1
  - L82: `scale` → `className={`group flex items-center gap-3 rounded-2xl p-3.5 transition-all active:scale-[0.98] ${`
  - L96: `transform` → `<span className={`block text-sm font-medium ${dark ? "text-white" : "text-foreground"} group-hover:translate-x-0.5 transition-transform`}>`
  - L96: `translate` → `<span className={`block text-sm font-medium ${dark ? "text-white" : "text-foreground"} group-hover:translate-x-0.5 transition-transform`}>`

### `src/components/site/Price.tsx`
- Summary: `animate-`×1
  - L34: `animate-` → `"product-price-skeleton inline-block h-[1em] w-14 animate-pulse rounded bg-white/10 align-middle",`

### `src/components/site/ProductCard.tsx`
- Summary: `animate-`×1, `animation`×2, `blur`×2, `box-shadow`×1, `contain`×1, `filter`×3, `scale`×3, `shadow-`×2, `transform`×5, `translate`×2
  - L33: `filter` → `.filter((t) => t.length >= 2)`
  - L115: `transform` → `// Product-listing badges are intentionally static: transform/keyframe badge`
  - L116: `animation` → `// animations caused cross-browser paint invalidation while scrolling large`
  - L117: `animation` → `// grids. Admin animation settings are preserved outside listing cards.`
  - L131: `shadow-` → `"inline-flex h-[22px] sm:h-[28px] w-full max-w-full items-center gap-1 whitespace-nowrap rounded-full px-2 sm:px-3 py-1 text-[10px] sm:text-[11px] font-bold uppercase leading-none `
  - L179: `blur` → `style={{ backgroundColor: "rgba(120,120,120,0.75)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}`
  - L180: `animate-` → `className={`absolute right-3 top-3 z-10 grid h-[36px] w-[36px] sm:h-[46px] sm:w-[46px] place-items-center rounded-full text-white transition-colors ${saved ? "text-accent" : "hover`
  - L199: `blur` → `style={{ backgroundColor: "rgba(120,120,120,0.75)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 2px 8px rgba(0,0,0,0.25)" }}`
  - L234: `transform` → `<button onClick={(e) => { e.preventDefault(); void setQty(product.slug, qty - 1); }} aria-label="Decrease quantity" className="grid size-11 place-items-center rounded-full text-bla`
  - L234: `scale` → `<button onClick={(e) => { e.preventDefault(); void setQty(product.slug, qty - 1); }} aria-label="Decrease quantity" className="grid size-11 place-items-center rounded-full text-bla`
  - L238: `transform` → `<button onClick={(e) => { e.preventDefault(); void setQty(product.slug, qty + 1); }} aria-label="Increase quantity" className="grid size-11 place-items-center rounded-full text-bla`
  - L238: `scale` → `<button onClick={(e) => { e.preventDefault(); void setQty(product.slug, qty + 1); }} aria-label="Increase quantity" className="grid size-11 place-items-center rounded-full text-bla`
  - L250: `transform` → `className={`product-typography inline-flex h-[46px] sm:h-[52px] w-full items-center justify-center gap-2 rounded-full text-[14px] sm:text-[16px] font-bold transition-[filter,transf`
  - L250: `translate` → `className={`product-typography inline-flex h-[46px] sm:h-[52px] w-full items-center justify-center gap-2 rounded-full text-[14px] sm:text-[16px] font-bold transition-[filter,transf`
  - L250: `scale` → `className={`product-typography inline-flex h-[46px] sm:h-[52px] w-full items-center justify-center gap-2 rounded-full text-[14px] sm:text-[16px] font-bold transition-[filter,transf`
  - L250: `filter` → `className={`product-typography inline-flex h-[46px] sm:h-[52px] w-full items-center justify-center gap-2 rounded-full text-[14px] sm:text-[16px] font-bold transition-[filter,transf`
  - L279: `filter` → `const gated = assigned.filter((b) => {`
  - L304: `transform` → `className="product-card-shell group relative flex h-full flex-col overflow-hidden rounded-[22px] shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-[box-shadow,border-color,transform]`
  - L304: `translate` → `className="product-card-shell group relative flex h-full flex-col overflow-hidden rounded-[22px] shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-[box-shadow,border-color,transform]`
  - L304: `box-shadow` → `className="product-card-shell group relative flex h-full flex-col overflow-hidden rounded-[22px] shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-[box-shadow,border-color,transform]`
  - … 2 more matching lines omitted for brevity

### `src/components/site/ProductCollection.tsx`
- Summary: `animate-`×1, `blur`×1, `filter`×4, `opacity`×1
  - L28: `filter` → `filterFlag,`
  - L40: `filter` → `filterFlag?: "trending" | "bestseller" | "flashDeal" | "featured";`
  - L52: `filter` → `const base = filterFlag ? products.filter((p) => Boolean(p[filterFlag])) : products;`
  - L57: `filter` → `}, [products, filterFlag, rotationSeed, rotationNonce]);`
  - L78: `opacity` → `className="absolute -right-16 -top-16 size-64 rounded-full blur-3xl opacity-40"`
  - L78: `blur` → `className="absolute -right-16 -top-16 size-64 rounded-full blur-3xl opacity-40"`
  - L92: `animate-` → `<Loader2 className="size-5 animate-spin text-muted-foreground" />`

### `src/components/site/ProductDescription.tsx`
- Summary: `filter`×1, `opacity`×3, `rotate`×1, `transform`×1
  - L142: `filter` → `const additions = extraSpecs.filter((s) => !seen.has(s.label.toLowerCase()));`
  - L179: `opacity` → `initial={{ opacity: 0 }}`
  - L180: `opacity` → `animate={{ opacity: 1 }}`
  - L181: `opacity` → `exit={{ opacity: 0 }}`
  - L194: `transform` → `<ChevronDown className={`size-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />`
  - L194: `rotate` → `<ChevronDown className={`size-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />`

### `src/components/site/ProductImage.tsx`
- Summary: `filter`×1
  - L25: `filter` → `* sorting/filtering/incrementally loading. The key includes the src and intrinsic`

### `src/components/site/ProductQA.tsx`
- Summary: `animate-`×2, `blur`×2, `filter`×6, `opacity`×2, `shadow-`×2, `translate`×1
  - L191: `filter` → `const answeredCount = items.filter((q) => q.answer).length;`
  - L193: `filter` → `const filtered = query`
  - L194: `filter` → `? items.filter((it) => it.question.toLowerCase().includes(query) || (it.answer ?? "").toLowerCase().includes(query))`
  - L226: `opacity` → `className="inline-flex items-center gap-2 bg-accent text-accent-foreground font-bold px-5 py-2.5 rounded-full text-[11px] uppercase tracking-widest hover:brightness-110 transition-`
  - L228: `animate-` → `{busy ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}`
  - L239: `translate` → `<Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />`
  - L251: `animate-` → `<div className="py-12 grid place-items-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>`
  - L253: `shadow-` → `<div className="py-14 px-6 text-center rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl shadow-[0_18px_40px_-24px_oklch(0_0_0/0.8)]">`
  - L253: `blur` → `<div className="py-14 px-6 text-center rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl shadow-[0_18px_40px_-24px_oklch(0_0_0/0.8)]">`
  - L255: `filter` → `<div aria-hidden className="absolute inset-0 rounded-full opacity-60" style={{ background: "var(--gradient-ember-soft)", filter: "blur(18px)" }} />`
  - L255: `opacity` → `<div aria-hidden className="absolute inset-0 rounded-full opacity-60" style={{ background: "var(--gradient-ember-soft)", filter: "blur(18px)" }} />`
  - L255: `blur` → `<div aria-hidden className="absolute inset-0 rounded-full opacity-60" style={{ background: "var(--gradient-ember-soft)", filter: "blur(18px)" }} />`
  - L263: `filter` → `) : filtered.length === 0 ? (`
  - L267: `filter` → `{filtered.map((q) => {`
  - L343: `shadow-` → `<div className="mt-4 ml-[3.75rem] flex items-start gap-3 p-4 sm:p-5 bg-accent/[0.07] border border-accent/25 rounded-2xl shadow-[0_16px_40px_-30px_oklch(0_0_0/0.9)]">`

### `src/components/site/ProductRail.tsx`
- Summary: `contain`×1
  - L32: `contain` → `overscrollBehaviorX: "contain",`

### `src/components/site/ProductReviews.tsx`
- Summary: `animate-`×6, `blur`×10, `contain`×1, `drop-shadow`×1, `filter`×20, `opacity`×30, `scale`×9, `shadow-`×7, `transform`×3
  - L78: `filter` → `const [filter, setFilter] = useState<ReviewFilter>("all");`
  - L114: `filter` → `const visible = list.filter((r) => r.status === "published");`
  - L156: `filter` → `.on("postgres_changes", { event: "*", schema: "public", table: "product_reviews", filter: `product_slug=eq.${productSlug}` }, () => load())`
  - L162: `filter` → `const published = useMemo(() => reviews.filter((r) => r.status === "published"), [reviews]);`
  - L186: `filter` → `const verifiedCount = published.filter((r) => r.verified_purchase).length;`
  - L187: `filter` → `const photoReviews = published.filter((r) => (r.media?.length ?? 0) > 0);`
  - L189: `filter` → `? Math.round((published.filter((r) => r.rating >= 4).length / published.length) * 100)`
  - L197: `filter` → `.filter((t) => t.count > 0)`
  - L211: `filter` → `list = list.filter((r) => {`
  - L212: `filter` → `switch (filter) {`
  - L231: `filter` → `}, [reviews, filter, sort]);`
  - L233: `filter` → `useEffect(() => { setVisibleCount(6); }, [filter, sort]);`
  - L405: `filter` → `const filterChips: { key: ReviewFilter; label: string }[] = [`
  - L448: `opacity` → `initial={{ opacity: 0, y: 12 }}`
  - L449: `opacity` → `whileInView={{ opacity: 1, y: 0 }}`
  - L452: `shadow-` → `className="mb-8 grid gap-8 lg:grid-cols-[280px_1fr] rounded-3xl border border-white/10 bg-card/50 backdrop-blur-xl p-6 sm:p-8 shadow-[0_24px_60px_-40px_oklch(0_0_0/0.9)] relative o`
  - L452: `blur` → `className="mb-8 grid gap-8 lg:grid-cols-[280px_1fr] rounded-3xl border border-white/10 bg-card/50 backdrop-blur-xl p-6 sm:p-8 shadow-[0_24px_60px_-40px_oklch(0_0_0/0.9)] relative o`
  - L454: `opacity` → `<div className="pointer-events-none absolute -top-24 -left-24 size-64 rounded-full opacity-60" style={{ background: "var(--gradient-ember-soft)" }} />`
  - L506: `blur` → `<div className="mb-8 rounded-3xl border border-white/10 bg-card/50 backdrop-blur-xl p-5 sm:p-7 relative overflow-hidden">`
  - L507: `opacity` → `<div className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full opacity-50" style={{ background: "var(--gradient-ember-soft)" }} />`
  - … 67 more matching lines omitted for brevity

### `src/components/site/ProductSkeleton.tsx`
- Summary: `animate-`×1, `translate`×1
  - L14: `translate` → `<div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />`
  - L14: `animate-` → `<div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />`

### `src/components/site/ProductTrustBlocks.tsx`
- Summary: `animate-`×1, `blur`×1, `filter`×1, `opacity`×1
  - L48: `animate-` → `<span className="absolute inline-flex h-full w-full rounded-full bg-accent/60 animate-ping" />`
  - L70: `filter` → `<div aria-hidden className="pointer-events-none absolute -top-24 -right-16 size-80 rounded-full opacity-40" style={{ background: "var(--gradient-ember-soft)", filter: "blur(90px)" `
  - L70: `opacity` → `<div aria-hidden className="pointer-events-none absolute -top-24 -right-16 size-80 rounded-full opacity-40" style={{ background: "var(--gradient-ember-soft)", filter: "blur(90px)" `
  - L70: `blur` → `<div aria-hidden className="pointer-events-none absolute -top-24 -right-16 size-80 rounded-full opacity-40" style={{ background: "var(--gradient-ember-soft)", filter: "blur(90px)" `

### `src/components/site/PromoBannerCarousel.tsx`
- Summary: `animate-`×1, `blur`×2, `filter`×1, `opacity`×4, `translate`×3
  - L66: `filter` → `const valid = ((data as any[]) ?? []).filter(`
  - L118: `blur` → `className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-background/70 px-4 py-2 text-[11px] font-mono uppercase tracking-widest text-accent backdrop-blur-`
  - L140: `opacity` → `className={`relative max-w-7xl mx-auto rounded-3xl overflow-hidden border border-border bg-card ${aspectClassName} group ${canEdit && !b.active ? "opacity-60" : ""}`}`
  - L148: `animate-` → `className="absolute inset-0 motion-safe:animate-fade-in"`
  - L163: `opacity` → `<div className="absolute inset-0" style={{ background: "var(--gradient-ember)", opacity: 0.5 }} />`
  - L192: `translate` → `className="absolute left-3 top-1/2 -translate-y-1/2 size-10 grid place-items-center rounded-full glass-strong opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-accent-fo`
  - L192: `opacity` → `className="absolute left-3 top-1/2 -translate-y-1/2 size-10 grid place-items-center rounded-full glass-strong opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-accent-fo`
  - L199: `translate` → `className="absolute right-3 top-1/2 -translate-y-1/2 size-10 grid place-items-center rounded-full glass-strong opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-accent-f`
  - L199: `opacity` → `className="absolute right-3 top-1/2 -translate-y-1/2 size-10 grid place-items-center rounded-full glass-strong opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-accent-f`
  - L203: `translate` → `<div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">`
  - L227: `blur` → `className="grid size-8 place-items-center rounded-full border border-accent/40 bg-background/70 text-accent backdrop-blur-md transition-all hover:bg-accent/15"`

### `src/components/site/QuickViewDialog.tsx`
- Summary: `blur`×1, `opacity`×1, `scale`×4, `shadow-`×2, `transform`×1
  - L35: `blur` → `<DialogContent className="max-w-md gap-0 overflow-hidden rounded-[24px] border-white/10 bg-card/80 p-0 backdrop-blur-2xl">`
  - L40: `shadow-` → `<span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-black shadow-[var(--shadow-ember)]">`
  - L87: `scale` → `<button onClick={() => setQty(product.slug, cartQty - 1)} aria-label="Decrease" className="grid size-9 place-items-center rounded-full text-accent transition-colors hover:bg-accent`
  - L91: `scale` → `<button onClick={() => setQty(product.slug, cartQty + 1)} aria-label="Increase" className="grid size-9 place-items-center rounded-full text-accent transition-colors hover:bg-accent`
  - L99: `transform` → `className="inline-flex h-12 flex-1 items-center justify-center gap-1.5 rounded-full bg-[linear-gradient(135deg,oklch(0.80_0.18_58),oklch(0.68_0.20_42))] text-sm font-semibold text-`
  - L99: `scale` → `className="inline-flex h-12 flex-1 items-center justify-center gap-1.5 rounded-full bg-[linear-gradient(135deg,oklch(0.80_0.18_58),oklch(0.68_0.20_42))] text-sm font-semibold text-`
  - L99: `opacity` → `className="inline-flex h-12 flex-1 items-center justify-center gap-1.5 rounded-full bg-[linear-gradient(135deg,oklch(0.80_0.18_58),oklch(0.68_0.20_42))] text-sm font-semibold text-`
  - L99: `shadow-` → `className="inline-flex h-12 flex-1 items-center justify-center gap-1.5 rounded-full bg-[linear-gradient(135deg,oklch(0.80_0.18_58),oklch(0.68_0.20_42))] text-sm font-semibold text-`
  - L107: `scale` → `className={`grid size-12 shrink-0 place-items-center rounded-full border transition-all active:scale-90 ${saved ? "border-accent bg-accent/20 text-accent" : "border-white/15 bg-whi`

### `src/components/site/RecentlyViewed.tsx`
- Summary: `animate-`×1, `filter`×2, `opacity`×1, `shadow-`×1
  - L41: `opacity` → `className="w-full h-full object-cover transition-[opacity] duration-500"`
  - L56: `shadow-` → `className={`shrink-0 grid place-items-center size-8 rounded-full bg-accent text-accent-foreground transition-colors hover:brightness-110 shadow-[var(--shadow-ember)] ${justAdded ? `
  - L56: `animate-` → `className={`shrink-0 grid place-items-center size-8 rounded-full bg-accent text-accent-foreground transition-colors hover:brightness-110 shadow-[var(--shadow-ember)] ${justAdded ? `
  - L77: `filter` → `const active = excludeSlug ? slugs.filter((s) => s !== excludeSlug) : slugs;`
  - L79: `filter` → `return active.map((s) => map.get(s)).filter(Boolean).slice(0, limit) as Product[];`

### `src/components/site/RecommendationStrip.tsx`
- Summary: `animate-`×2
  - L40: `animate-` → `<div key={i} className="shrink-0 w-[42%] aspect-[4/5] rounded-2xl bg-card animate-pulse" />`
  - L45: `animate-` → `<div key={i} className="aspect-[4/5] rounded-2xl bg-card animate-pulse" />`

### `src/components/site/RegionLockCard.tsx`
- Summary: `animate-`×1
  - L133: `animate-` → `{busy ? <Loader2 className="size-4 animate-spin" /> : "Submit request"}`

### `src/components/site/RegionSelectModal.tsx`
- Summary: `animate-`×1, `blur`×8, `filter`×1, `opacity`×7, `shadow-`×1, `translate`×1
  - L29: `blur` → `blurb: string;`
  - L41: `blur` → `blurb: "Local pricing with instant UPI & cards, built for fast domestic commerce.",`
  - L55: `blur` → `blurb: "Global USD pricing with worldwide shipping to your doorstep.",`
  - L110: `blur` → `className="max-w-sm overflow-hidden border-white/10 bg-background/85 p-6 backdrop-blur-2xl [&>button]:hidden"`
  - L182: `blur` → `className="max-w-lg overflow-hidden border-white/10 bg-background/80 p-0 backdrop-blur-2xl [&>button]:hidden"`
  - L187: `translate` → `className="absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full opacity-50 animate-orb"`
  - L187: `opacity` → `className="absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full opacity-50 animate-orb"`
  - L187: `animate-` → `className="absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full opacity-50 animate-orb"`
  - L188: `filter` → `style={{ background: "var(--gradient-ember-soft)", filter: "blur(90px)" }}`
  - L188: `blur` → `style={{ background: "var(--gradient-ember-soft)", filter: "blur(90px)" }}`
  - L196: `opacity` → `initial={{ opacity: 0, y: 8 }}`
  - L197: `opacity` → `animate={{ opacity: 1, y: 0 }}`
  - L198: `opacity` → `exit={{ opacity: 0, y: -8 }}`
  - L235: `shadow-` → `? "border-accent/60 bg-accent/10 shadow-[var(--shadow-ember)]"`
  - L254: `blur` → `{o.blurb}`
  - L299: `opacity` → `initial={{ opacity: 0, y: 8 }}`
  - L300: `opacity` → `animate={{ opacity: 1, y: 0 }}`
  - L301: `opacity` → `exit={{ opacity: 0, y: -8 }}`
  - L331: `blur` → `<p className="text-xs text-muted-foreground">{selected.blurb}</p>`

### `src/components/site/RelatedProducts.tsx`
- Summary: `filter`×2
  - L35: `filter` → `? products.filter((p) => p.category === product.category && !exclude.has(p.slug))`
  - L37: `filter` → `const others = products.filter(`

### `src/components/site/ReturnCenterSections.tsx`
- Summary: `animate-`×1, `blur`×9, `opacity`×6, `rotate`×1, `scale`×1, `transform`×1
  - L28: `opacity` → `initial: { opacity: 0, y: 14 },`
  - L29: `opacity` → `whileInView: { opacity: 1, y: 0 },`
  - L48: `blur` → `<div className="relative rounded-3xl p-5 sm:p-7 ring-1 ring-white/10 backdrop-blur-xl" style={{ background: cardBg }}>`
  - L85: `blur` → `<div className="rounded-3xl p-5 sm:p-7 ring-1 ring-white/10 backdrop-blur-xl" style={{ background: cardBg }}>`
  - L104: `animate-` → `{current && <span className="absolute inset-0 rounded-xl ring-2 ring-accent/50 animate-ping" />}`
  - L137: `blur` → `<div key={w.cat} className="rounded-2xl p-4 ring-1 ring-white/10 backdrop-blur-md hover:ring-accent/40 transition" style={{ background: cardBg }}>`
  - L162: `blur` → `<div key={m.label} className="relative overflow-hidden rounded-2xl p-5 text-center ring-1 ring-white/10 backdrop-blur-xl" style={{ background: "linear-gradient(135deg, rgba(255,122`
  - L163: `opacity` → `<div aria-hidden className="absolute -top-10 -right-10 size-24 rounded-full blur-2xl opacity-40" style={{ background: "radial-gradient(circle,#FF7A00,transparent 70%)" }} />`
  - L163: `blur` → `<div aria-hidden className="absolute -top-10 -right-10 size-24 rounded-full blur-2xl opacity-40" style={{ background: "radial-gradient(circle,#FF7A00,transparent 70%)" }} />`
  - L184: `blur` → `<div className="rounded-3xl p-5 sm:p-7 ring-1 ring-white/10 backdrop-blur-xl" style={{ background: cardBg }}>`
  - L192: `scale` → `className="text-xs rounded-full px-3.5 py-2 ring-1 transition active:scale-95"`
  - L206: `opacity` → `<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">`
  - L241: `blur` → `<div key={p.title} className="relative overflow-hidden rounded-3xl p-5 sm:p-6 ring-1 ring-white/10 backdrop-blur-xl" style={{ background: cardBg }}>`
  - L242: `opacity` → `<div aria-hidden className="absolute -top-16 -right-16 size-40 rounded-full blur-3xl opacity-20" style={{ background: "radial-gradient(circle,#FF7A00,transparent 70%)" }} />`
  - L242: `blur` → `<div aria-hidden className="absolute -top-16 -right-16 size-40 rounded-full blur-3xl opacity-20" style={{ background: "radial-gradient(circle,#FF7A00,transparent 70%)" }} />`
  - L283: `blur` → `<div key={f.q} className="rounded-2xl ring-1 ring-white/10 backdrop-blur-xl overflow-hidden" style={{ background: cardBg }}>`
  - L286: `transform` → `<ChevronDown className={`size-4 text-accent shrink-0 transition-transform duration-300 ${on ? "rotate-180" : ""}`} />`
  - L286: `rotate` → `<ChevronDown className={`size-4 text-accent shrink-0 transition-transform duration-300 ${on ? "rotate-180" : ""}`} />`
  - L290: `opacity` → `<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden"`

### `src/components/site/ReturnRequestDialog.tsx`
- Summary: `animate-`×1, `filter`×3, `opacity`×7
  - L106: `filter` → `setPhotos(photos.filter((_, idx) => idx !== i));`
  - L107: `filter` → `setPreviews(previews.filter((_, idx) => idx !== i));`
  - L111: `filter` → `const chosen = items.filter((it) => selected[it.id]);`
  - L195: `opacity` → `initial={{ opacity: 0, y: 8 }}`
  - L196: `opacity` → `animate={{ opacity: 1, y: 0 }}`
  - L216: `opacity` → `initial={{ opacity: 0 }}`
  - L217: `opacity` → `animate={{ opacity: 1 }}`
  - L280: `opacity` → `Details <span className="normal-case opacity-60">(optional)</span>`
  - L295: `opacity` → `Photos <span className="normal-case opacity-60">(optional)</span>`
  - L340: `opacity` → `className="w-full inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground rounded-full px-5 py-3 text-xs uppercase tracking-widest font-bold disabled:opacity`
  - L344: `animate-` → `<Loader2 className="size-4 animate-spin" /> Submitting…`

### `src/components/site/Reveal.tsx`
- Summary: `animation`×2, `opacity`×1, `transform`×1
  - L12: `animation` → `* The user-facing animation, timing and appearance are unchanged.`
  - L36: `transform` → `// Product cards must never sit inside a transformed/opacity reveal layer. On`
  - L36: `opacity` → `// Product cards must never sit inside a transformed/opacity reveal layer. On`
  - L47: `animation` → `// fast scroll. Content still renders fully — only the entrance animation is`

### `src/components/site/SavedAddressRail.tsx`
- Summary: `opacity`×3, `scale`×4, `shadow-`×1
  - L71: `scale` → `whileTap={{ scale: 0.98 }}`
  - L74: `shadow-` → `? "border-accent bg-accent/[0.07] shadow-[0_0_0_1px_var(--color-accent),0_12px_30px_-12px_color-mix(in_oklab,var(--color-accent)_45%,transparent)]"`
  - L105: `scale` → `initial={{ scale: 0, opacity: 0 }}`
  - L105: `opacity` → `initial={{ scale: 0, opacity: 0 }}`
  - L106: `scale` → `animate={{ scale: 1, opacity: 1 }}`
  - L106: `opacity` → `animate={{ scale: 1, opacity: 1 }}`
  - L107: `scale` → `exit={{ scale: 0, opacity: 0 }}`
  - L107: `opacity` → `exit={{ scale: 0, opacity: 0 }}`

### `src/components/site/SearchButton.tsx`
- Summary: `animate-`×1, `animation`×2, `opacity`×1, `scale`×1, `transform`×3, `translate`×2
  - L11: `transform` → `* - GPU-only animations (transform/opacity), respects prefers-reduced-motion.`
  - L11: `opacity` → `* - GPU-only animations (transform/opacity), respects prefers-reduced-motion.`
  - L11: `animation` → `* - GPU-only animations (transform/opacity), respects prefers-reduced-motion.`
  - L25: `animation` → `// force reflow to restart the animation`
  - L37: `transform` → `className={`search-cta group absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 inline-flex h-10 sm:h-12 items-center justify-center gap-1.5 rounded-full text-[13px] sm:text-sm`
  - L37: `translate` → `className={`search-cta group absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 inline-flex h-10 sm:h-12 items-center justify-center gap-1.5 rounded-full text-[13px] sm:text-sm`
  - L37: `scale` → `className={`search-cta group absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 inline-flex h-10 sm:h-12 items-center justify-center gap-1.5 rounded-full text-[13px] sm:text-sm`
  - L48: `animate-` → `<Loader2 className="relative z-[1] size-4 animate-spin" />`
  - L53: `transform` → `<ArrowRight className="relative z-[1] size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />`
  - L53: `translate` → `<ArrowRight className="relative z-[1] size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />`

### `src/components/site/SearchCommand.tsx`
- Summary: `animate-`×3, `blur`×2, `contain`×2, `filter`×7, `opacity`×1, `shadow-`×3, `translate`×8
  - L25: `filter` → `const list = [cleaned, ...readRecent().filter((r) => r.toLowerCase() !== cleaned.toLowerCase())].slice(0, 6);`
  - L60: `filter` → `// Defer filtering so typing stays responsive even over the full catalog.`
  - L94: `filter` → `.filter(([, n]) => n >= 2)`
  - L102: `filter` → `.filter((p) => `${p.name} ${p.brand ?? ""} ${p.tagline ?? ""} ${p.category} ${p.description ?? ""}`.toLowerCase().includes(term))`
  - L107: `filter` → `return categories.filter((c) => c.name.toLowerCase().includes(term) || c.slug.toLowerCase().includes(term)).slice(0, 4);`
  - L111: `filter` → `return brandsAll.filter((b) => b.toLowerCase().includes(term)).slice(0, 3);`
  - L193: `filter` → `const stale = q.trim() !== term; // deferred filter is catching up`
  - L197: `blur` → `<div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose} />`
  - L197: `animate-` → `<div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose} />`
  - L198: `translate` → `<div className="absolute left-1/2 top-[6vh] -translate-x-1/2 w-[94%] sm:w-[90%] max-w-2xl glass-strong border border-accent/20 rounded-[24px] shadow-[0_30px_90px_-20px_oklch(0.74_0`
  - L198: `shadow-` → `<div className="absolute left-1/2 top-[6vh] -translate-x-1/2 w-[94%] sm:w-[90%] max-w-2xl glass-strong border border-accent/20 rounded-[24px] shadow-[0_30px_90px_-20px_oklch(0.74_0`
  - L198: `animate-` → `<div className="absolute left-1/2 top-[6vh] -translate-x-1/2 w-[94%] sm:w-[90%] max-w-2xl glass-strong border border-accent/20 rounded-[24px] shadow-[0_30px_90px_-20px_oklch(0.74_0`
  - L202: `blur` → `className="sticky top-0 z-10 p-3 sm:p-4 border-b border-white/8 bg-background/40 backdrop-blur-xl"`
  - L204: `shadow-` → `<div className={`relative flex items-center rounded-full transition-all duration-300 ${q ? "ring-2 ring-accent/50 shadow-[0_0_0_4px_oklch(0.74_0.19_49/0.10),0_0_34px_-6px_oklch(0.7`
  - L205: `translate` → `<Search className="absolute left-5 top-1/2 -translate-y-1/2 size-[22px] text-accent" />`
  - L216: `translate` → `<div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">`
  - L229: `contain` → `<div ref={listRef} className="overflow-y-auto flex-1 overscroll-contain" id="search-results" role="listbox">`
  - L237: `translate` → `<button key={t} onClick={() => go(t)} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-accent/25 bg-gradient-to-b from-accent/15 to-accent/5 px-4 text-sm`
  - L253: `translate` → `<button key={r} onClick={() => go(r)} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm text-foreground/85 transitio`
  - L267: `translate` → `<button key={b} onClick={() => go(b)} className={`inline-flex h-10 items-center rounded-full border px-4 text-sm font-medium transition-all duration-200 active:translate-y-px ${i <`
  - … 6 more matching lines omitted for brevity

### `src/components/site/ShareDialog.tsx`
- Summary: `opacity`×1, `scale`×2
  - L137: `scale` → `<span className="flex size-14 items-center justify-center rounded-2xl border border-border/60 bg-card/40 transition-colors active:scale-95 hover:bg-accent/10 hover:border-accent/40`
  - L150: `scale` → `className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground transition-opacity active:scale-95 hover:opacity-90"`
  - L150: `opacity` → `className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground transition-opacity active:scale-95 hover:opacity-90"`

### `src/components/site/SmartDeliveryCard.tsx`
- Summary: `animate-`×1
  - L50: `animate-` → `<Loader2 className="size-4 text-accent animate-spin shrink-0" />`

### `src/components/site/StarRating.tsx`
- Summary: `drop-shadow`×1, `shadow-`×1
  - L32: `shadow-` → `glow && filled && "drop-shadow-[0_0_6px_oklch(0.74_0.19_49/0.6)]",`
  - L32: `drop-shadow` → `glow && filled && "drop-shadow-[0_0_6px_oklch(0.74_0.19_49/0.6)]",`

### `src/components/site/TestimonialsCarousel.tsx`
- Summary: `blur`×1, `contain`×1, `opacity`×1, `transform`×1, `translate`×1
  - L30: `transform` → `<figure className="group relative glass glass-reflect rounded-2xl p-4 sm:p-5 h-full flex flex-col overflow-hidden hover:-translate-y-1 transition-transform duration-200">`
  - L30: `translate` → `<figure className="group relative glass glass-reflect rounded-2xl p-4 sm:p-5 h-full flex flex-col overflow-hidden hover:-translate-y-1 transition-transform duration-200">`
  - L31: `opacity` → `<div aria-hidden className="absolute -top-10 -right-10 size-32 rounded-full opacity-30 group-hover:opacity-60 transition-opacity blur-2xl" style={{ background: "var(--gradient-embe`
  - L31: `blur` → `<div aria-hidden className="absolute -top-10 -right-10 size-32 rounded-full opacity-30 group-hover:opacity-60 transition-opacity blur-2xl" style={{ background: "var(--gradient-embe`
  - L93: `contain` → `style={{ WebkitOverflowScrolling: "touch", overscrollBehaviorX: "contain" }}`

### `src/components/site/ThemeSelector.tsx`
- Summary: `shadow-`×1
  - L33: `shadow-` → `? "border-accent bg-accent/10 shadow-[0_0_0_1px_var(--color-accent)]"`

### `src/components/site/TicketRatingPrompt.tsx`
- Summary: `animate-`×1, `opacity`×1, `scale`×1, `transform`×1
  - L98: `transform` → `className="p-0.5 transition-transform active:scale-90"`
  - L98: `scale` → `className="p-0.5 transition-transform active:scale-90"`
  - L121: `opacity` → `className="flex-1 inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground rounded-full px-4 py-2.5 text-xs font-bold uppercase tracking-widest disabled:opaci`
  - L123: `animate-` → `{submitting ? <Loader2 className="size-4 animate-spin" /> : "Submit Feedback"}`

### `src/components/site/TrustBadgesStrip.tsx`
- Summary: `rotate`×1, `scale`×1, `shadow-`×1, `transform`×1
  - L34: `transform` → `className="size-[18px] text-accent shrink-0 transition-transform duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:rotate-[8deg] group-hover:scale-1`
  - L34: `rotate` → `className="size-[18px] text-accent shrink-0 transition-transform duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:rotate-[8deg] group-hover:scale-1`
  - L34: `scale` → `className="size-[18px] text-accent shrink-0 transition-transform duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:rotate-[8deg] group-hover:scale-1`
  - L46: `shadow-` → `<div className="hidden lg:flex items-center justify-between rounded-2xl glass-strong ring-1 ring-white/10 px-8 py-5 shadow-[var(--shadow-float)]">`

### `src/components/site/VirtualizedProductGrid.tsx`
- Summary: `contain`×1, `filter`×1, `transform`×6, `translate`×1
  - L27: `transform` → `* The previous transform-based `useWindowVirtualizer` path placed each row with`
  - L28: `transform` → `* `position: absolute` + `transform: translateY()` + `contain: layout paint`
  - L28: `translate` → `* `position: absolute` + `transform: translateY()` + `contain: layout paint`
  - L28: `contain` → `* `position: absolute` + `transform: translateY()` + `contain: layout paint`
  - L38: `transform` → `* grid (no transforms, no promoted layers, no dynamic measurement) and simply`
  - L64: `filter` → `// Reset the window when the dataset changes (filter/sort/navigation).`
  - L101: `transform` → `* Adaptive product grid — now a single, transform-free strategy for every`
  - L104: `transform` → `* memory. No virtualization, no transforms, no layer promotion.`
  - L121: `transform` → `// Large catalogs: bounded, incremental, transform-free rendering.`

### `src/components/site/WishlistCard.tsx`
- Summary: `animate-`×2, `animation`×3, `blur`×4, `opacity`×2, `shadow-`×6, `translate`×1
  - L60: `animation` → `animation: b.animation,`
  - L70: `animation` → `animation: undefined as string | undefined,`
  - L97: `shadow-` → `selected ? "ring-2 ring-accent shadow-[var(--shadow-ember)]" : ""`
  - L121: `translate` → `className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"`
  - L121: `animate-` → `className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"`
  - L133: `opacity` → `className={`relative w-full h-full object-cover transition-opacity duration-500 ${`
  - L134: `opacity` → `imgLoaded ? "opacity-100" : "opacity-0"`
  - L140: `shadow-` → `<span data-product-badge className={`absolute top-2 inline-flex items-center rounded-full bg-accent text-black font-bold font-mono text-[10px] px-2 py-0.5 shadow-[var(--shadow-embe`
  - L155: `shadow-` → `className={`inline-flex items-center gap-1 text-[9px] font-bold font-mono px-1.5 min-h-[18px] leading-none rounded-md tracking-wider whitespace-nowrap shadow-sm md:gap-1 md:text-[1`
  - L157: `animation` → `} ${badgeAnimationClass(b.animation)}`}`
  - L176: `blur` → `<div className="absolute inset-0 grid place-items-center bg-black/55 backdrop-blur-[1px]">`
  - L191: `shadow-` → `className="size-8 grid place-items-center rounded-full bg-accent/25 border border-accent text-accent backdrop-blur-xl shadow-lg shadow-black/30 transition-colors duration-300 hover`
  - L191: `blur` → `className="size-8 grid place-items-center rounded-full bg-accent/25 border border-accent text-accent backdrop-blur-xl shadow-lg shadow-black/30 transition-colors duration-300 hover`
  - L201: `shadow-` → `className="size-8 grid place-items-center rounded-full bg-black/40 border border-white/20 text-white backdrop-blur-xl shadow-lg shadow-black/30 transition-colors duration-300 hover`
  - L201: `blur` → `className="size-8 grid place-items-center rounded-full bg-black/40 border border-white/20 text-white backdrop-blur-xl shadow-lg shadow-black/30 transition-colors duration-300 hover`
  - L292: `shadow-` → `className={`relative shrink-0 grid place-items-center size-10 rounded-xl bg-gradient-to-br from-accent to-[oklch(0.68_0.18_42)] text-black backdrop-blur-xl border border-white/20 s`
  - L292: `blur` → `className={`relative shrink-0 grid place-items-center size-10 rounded-xl bg-gradient-to-br from-accent to-[oklch(0.68_0.18_42)] text-black backdrop-blur-xl border border-white/20 s`
  - L292: `animate-` → `className={`relative shrink-0 grid place-items-center size-10 rounded-xl bg-gradient-to-br from-accent to-[oklch(0.68_0.18_42)] text-black backdrop-blur-xl border border-white/20 s`

### `src/components/site/WishlistRecommendations.tsx`
- Summary: `blur`×1, `filter`×5, `opacity`×2, `shadow-`×1
  - L27: `opacity` → `className="w-full h-full object-cover transition-[opacity] duration-500"`
  - L30: `blur` → `<span className="product-typography absolute top-1.5 left-1.5 rounded-full bg-background/80 backdrop-blur px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest text-muted-fore`
  - L48: `opacity` → `className="shrink-0 grid place-items-center size-7 rounded-full bg-accent text-accent-foreground transition-colors hover:brightness-110 shadow-[var(--shadow-ember)] disabled:opacit`
  - L48: `shadow-` → `className="shrink-0 grid place-items-center size-7 rounded-full bg-accent text-accent-foreground transition-colors hover:brightness-110 shadow-[var(--shadow-ember)] disabled:opacit`
  - L136: `filter` → `() => products.filter((p) => wishlistSlugs.includes(p.slug)),`
  - L158: `filter` → `.filter((p) => !exclude.has(p.slug) && model.catWeight[p.category])`
  - L175: `filter` → `.filter((p) => !shown.has(p.slug) && p.inStock)`
  - L186: `filter` → `.filter((s) => !exclude.has(s))`
  - L188: `filter` → `.filter(Boolean)`

### `src/components/site/motion-primitives.tsx`
- Summary: `animation`×1, `opacity`×2
  - L5: `animation` → `* framer-motion implementations of the homepage reveal + counter animations.`
  - L12: `opacity` → `hidden: { opacity: 0, y: 24 },`
  - L14: `opacity` → `opacity: 1,`

### `src/components/support/TypingDots.tsx`
- Summary: `opacity`×4
  - L13: `opacity` → `initial={{ opacity: 0, y: 4 }}`
  - L14: `opacity` → `animate={{ opacity: 1, y: 0 }}`
  - L15: `opacity` → `exit={{ opacity: 0, y: 4 }}`
  - L27: `opacity` → `animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}`

### `src/components/ui/accordion.tsx`
- Summary: `animate-`×1, `rotate`×1, `transform`×1
  - L25: `rotate` → `"flex flex-1 items-center justify-between py-4 text-sm font-medium cursor-pointer transition-all hover:underline text-left [&[data-state=open]>svg]:rotate-180",`
  - L31: `transform` → `<ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />`
  - L43: `animate-` → `className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"`

### `src/components/ui/alert-dialog.tsx`
- Summary: `animate-`×2, `shadow-`×1, `translate`×1
  - L19: `animate-` → `"fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",`
  - L37: `translate` → `"fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-`
  - L37: `shadow-` → `"fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-`
  - L37: `animate-` → `"fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-`

### `src/components/ui/alert.tsx`
- Summary: `translate`×1
  - L7: `translate` → `"relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",`

### `src/components/ui/button.tsx`
- Summary: `opacity`×1, `shadow-`×3
  - L8: `opacity` → `"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 foc`
  - L13: `shadow-` → `destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",`
  - L15: `shadow-` → `"border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",`
  - L16: `shadow-` → `secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",`

### `src/components/ui/calendar.tsx`
- Summary: `opacity`×5, `rotate`×2, `shadow-`×1
  - L29: `rotate` → `String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,`
  - L30: `rotate` → `String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,`
  - L48: `opacity` → `"h-(--cell-size) w-(--cell-size) select-none p-0 aria-disabled:opacity-50",`
  - L53: `opacity` → `"h-(--cell-size) w-(--cell-size) select-none p-0 aria-disabled:opacity-50",`
  - L65: `shadow-` → `"has-focus:border-ring border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] relative rounded-md border",`
  - L68: `opacity` → `dropdown: cn("bg-popover absolute inset-0 opacity-0", defaultClassNames.dropdown),`
  - L103: `opacity` → `disabled: cn("text-muted-foreground opacity-50", defaultClassNames.disabled),`
  - L168: `opacity` → `"data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-`

### `src/components/ui/carousel.tsx`
- Summary: `rotate`×2, `translate`×4
  - L189: `translate` → `? "-left-12 top-1/2 -translate-y-1/2"`
  - L190: `translate` → `: "-top-12 left-1/2 -translate-x-1/2 rotate-90",`
  - L190: `rotate` → `: "-top-12 left-1/2 -translate-x-1/2 rotate-90",`
  - L217: `translate` → `? "-right-12 top-1/2 -translate-y-1/2"`
  - L218: `translate` → `: "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",`
  - L218: `rotate` → `: "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",`

### `src/components/ui/chart.tsx`
- Summary: `filter`×3, `shadow-`×1
  - L65: `filter` → `const colorConfig = Object.entries(config).filter(([, config]) => config.theme || config.color);`
  - L162: `shadow-` → `"grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",`
  - L169: `filter` → `.filter((item) => item.type !== "none")`
  - L267: `filter` → `.filter((item) => item.type !== "none")`

### `src/components/ui/checkbox.tsx`
- Summary: `opacity`×1
  - L14: `opacity` → `"grid place-content-center peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disa`

### `src/components/ui/command.tsx`
- Summary: `opacity`×3
  - L43: `opacity` → `<Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />`
  - L47: `opacity` → `"flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",`
  - L114: `opacity` → `"relative flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent dat`

### `src/components/ui/context-menu.tsx`
- Summary: `animate-`×2, `opacity`×3, `shadow-`×2, `transform`×2
  - L47: `transform` → `"z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=close`
  - L47: `shadow-` → `"z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=close`
  - L47: `animate-` → `"z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=close`
  - L63: `transform` → `"z-50 max-h-(--radix-context-menu-content-available-height) min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[`
  - L63: `shadow-` → `"z-50 max-h-(--radix-context-menu-content-available-height) min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[`
  - L63: `animate-` → `"z-50 max-h-(--radix-context-menu-content-available-height) min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[`
  - L81: `opacity` → `"relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none `
  - L97: `opacity` → `"relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-`
  - L120: `opacity` → `"relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-`

### `src/components/ui/dialog.tsx`
- Summary: `animate-`×2, `opacity`×1, `shadow-`×1, `translate`×1
  - L24: `animate-` → `"fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",`
  - L41: `translate` → `"fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-`
  - L41: `shadow-` → `"fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-`
  - L41: `animate-` → `"fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-`
  - L47: `opacity` → `<DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:r`

### `src/components/ui/dropdown-menu.tsx`
- Summary: `animate-`×2, `opacity`×4, `shadow-`×2, `transform`×2
  - L49: `transform` → `"z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=close`
  - L49: `shadow-` → `"z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=close`
  - L49: `animate-` → `"z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=close`
  - L66: `shadow-` → `"z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"`
  - L67: `transform` → `"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-9`
  - L67: `animate-` → `"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-9`
  - L85: `opacity` → `"relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabl`
  - L101: `opacity` → `"relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disable`
  - L124: `opacity` → `"relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disable`
  - L167: `opacity` → `<span className={cn("ml-auto text-xs tracking-widest opacity-60", className)} {...props} />`

### `src/components/ui/hover-card.tsx`
- Summary: `animate-`×1, `shadow-`×1, `transform`×1
  - L19: `transform` → `"z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out`
  - L19: `shadow-` → `"z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out`
  - L19: `animate-` → `"z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out`

### `src/components/ui/input-otp.tsx`
- Summary: `animate-`×1, `contain`×3, `opacity`×1, `shadow-`×1
  - L10: `contain` → `>(({ className, containerClassName, ...props }, ref) => (`
  - L13: `contain` → `containerClassName={cn(`
  - L14: `opacity` → `"flex items-center gap-2 has-[:disabled]:opacity-50",`
  - L15: `contain` → `containerClassName,`
  - L42: `shadow-` → `"relative flex h-9 w-9 items-center justify-center border-y border-r border-input text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",`
  - L51: `animate-` → `<div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />`

### `src/components/ui/input.tsx`
- Summary: `opacity`×1, `shadow-`×1
  - L11: `opacity` → `"flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:`
  - L11: `shadow-` → `"flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:`

### `src/components/ui/label.tsx`
- Summary: `opacity`×1
  - L10: `opacity` → `"text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",`

### `src/components/ui/menubar.tsx`
- Summary: `animate-`×2, `opacity`×3, `shadow-`×3, `transform`×2
  - L34: `shadow-` → `"flex h-9 items-center space-x-1 rounded-md border bg-background p-1 shadow-sm",`
  - L85: `transform` → `"z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=close`
  - L85: `shadow-` → `"z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=close`
  - L85: `animate-` → `"z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=close`
  - L104: `transform` → `"z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]`
  - L104: `shadow-` → `"z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]`
  - L104: `animate-` → `"z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]`
  - L122: `opacity` → `"relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none `
  - L138: `opacity` → `"relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-`
  - L161: `opacity` → `"relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-`

### `src/components/ui/navigation-menu.tsx`
- Summary: `animate-`×3, `opacity`×1, `rotate`×2, `shadow-`×1
  - L38: `opacity` → `"group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium cursor-pointer transition-colors hover:bg-accent hover:text-accent-f`
  - L52: `rotate` → `className="relative top-[1px] ml-1 h-3 w-3 transition duration-300 group-data-[state=open]:rotate-180"`
  - L66: `animate-` → `"left-0 top-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-ri`
  - L83: `animate-` → `"origin-top-center relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow data-[state=o`
  - L100: `animate-` → `"top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible`
  - L105: `rotate` → `<div className="relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm bg-border shadow-md" />`
  - L105: `shadow-` → `<div className="relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm bg-border shadow-md" />`

### `src/components/ui/popover.tsx`
- Summary: `animate-`×1, `shadow-`×1, `transform`×1
  - L22: `transform` → `"z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out`
  - L22: `shadow-` → `"z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out`
  - L22: `animate-` → `"z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out`

### `src/components/ui/progress.tsx`
- Summary: `transform`×1, `translate`×1
  - L19: `transform` → `style={{ transform: `translateX(-${100 - (value || 0)}%)` }}`
  - L19: `translate` → `style={{ transform: `translateX(-${100 - (value || 0)}%)` }}`

### `src/components/ui/radio-group.tsx`
- Summary: `opacity`×1
  - L23: `opacity` → `"aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-all`

### `src/components/ui/resizable.tsx`
- Summary: `rotate`×1, `translate`×1
  - L24: `translate` → `"relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ri`
  - L24: `rotate` → `"relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ri`

### `src/components/ui/select.tsx`
- Summary: `animate-`×1, `opacity`×3, `shadow-`×2, `transform`×1, `translate`×1
  - L22: `opacity` → `"flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background cursor-pointer data`
  - L22: `shadow-` → `"flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background cursor-pointer data`
  - L29: `opacity` → `<ChevronDown className="h-4 w-4 opacity-50" />`
  - L71: `transform` → `"relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[s`
  - L71: `shadow-` → `"relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[s`
  - L71: `animate-` → `"relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[s`
  - L73: `translate` → `"data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",`
  - L114: `opacity` → `"relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-`

### `src/components/ui/sheet.tsx`
- Summary: `animate-`×2, `opacity`×1, `shadow-`×1
  - L24: `animate-` → `"fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",`
  - L34: `shadow-` → `"fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed`
  - L34: `animate-` → `"fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed`
  - L64: `opacity` → `<SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ri`

### `src/components/ui/sidebar.tsx`
- Summary: `opacity`×5, `rotate`×1, `shadow-`×2, `transform`×2, `translate`×4
  - L227: `rotate` → `"group-data-[side=right]:rotate-180",`
  - L299: `translate` → `"absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border group-data`
  - L302: `translate` → `"group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:bg-sidebar",`
  - L340: `shadow-` → `"h-8 w-full bg-background shadow-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",`
  - L434: `opacity` → `"flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-[margin,opacity] duration-200 ease-linear f`
  - L435: `opacity` → `"group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",`
  - L455: `transform` → `"absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring cursor-pointer transition-transfo`
  - L504: `opacity` → `"peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring cursor-pointer transition-[width,height,padding] ho`
  - L510: `shadow-` → `"bg-background shadow-[0_0_0_1px_var(--sidebar-border)] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_var(--sidebar-accent)]",`
  - L598: `transform` → `"absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring cursor-pointer transition-transfo`
  - L606: `opacity` → `"group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground md:opac`
  - L674: `translate` → `"mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5",`
  - L706: `translate` → `"flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-none ring-sidebar-ring cursor-pointer hover:bg-sidebar-accent h`
  - L706: `opacity` → `"flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-none ring-sidebar-ring cursor-pointer hover:bg-sidebar-accent h`

### `src/components/ui/skeleton.tsx`
- Summary: `animate-`×1
  - L4: `animate-` → `return <div className={cn("animate-pulse rounded-md bg-primary/10", className)} {...props} />;`

### `src/components/ui/slider.tsx`
- Summary: `opacity`×1
  - L27: `opacity` → `className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabl`

### `src/components/ui/sonner.tsx`
- Summary: `shadow-`×1
  - L13: `shadow-` → `"group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",`

### `src/components/ui/switch.tsx`
- Summary: `opacity`×1, `shadow-`×2, `transform`×1, `translate`×1
  - L12: `opacity` → `"peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 `
  - L12: `shadow-` → `"peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 `
  - L20: `transform` → `"pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0",`
  - L20: `translate` → `"pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0",`
  - L20: `shadow-` → `"pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0",`

### `src/components/ui/table.tsx`
- Summary: `translate`×2
  - L63: `translate` → `"h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",`
  - L78: `translate` → `"p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",`

### `src/components/ui/tabs.tsx`
- Summary: `opacity`×1
  - L30: `opacity` → `"inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background cursor-pointer transition-all focus-visible:outline-none `

### `src/components/ui/textarea.tsx`
- Summary: `opacity`×1, `shadow-`×1
  - L10: `opacity` → `"flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:rin`
  - L10: `shadow-` → `"flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:rin`

### `src/components/ui/toggle.tsx`
- Summary: `opacity`×1, `shadow-`×1
  - L8: `opacity` → `"inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none`
  - L14: `shadow-` → `"border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",`

### `src/components/ui/tooltip.tsx`
- Summary: `animate-`×1, `transform`×1
  - L23: `transform` → `"z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out`
  - L23: `animate-` → `"z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out`

### `src/hooks/use-autosave.ts`
- Summary: `blur`×1
  - L25: `blur` → `/** Force an immediate flush (e.g. on blur / explicit save). */`

### `src/hooks/use-compare.ts`
- Summary: `filter`×3
  - L13: `filter` → `return Array.isArray(arr) ? arr.filter((s): s is string => typeof s === "string").slice(0, MAX) : [];`
  - L37: `filter` → `const next = cur.includes(slug) ? cur.filter((s) => s !== slug) : [slug, ...cur].slice(0, MAX);`
  - L41: `filter` → `const remove = useCallback((slug: string) => write(read().filter((s) => s !== slug)), []);`

### `src/hooks/use-media-upload.ts`
- Summary: `filter`×4
  - L171: `filter` → `return q.filter((it) => it.status === "uploading" || it.status === "queued" || it.status === "error");`
  - L180: `filter` → `return q.filter((it) => it.id !== id);`
  - L184: `filter` → `const active = queue.filter((q) => q.status === "uploading" || q.status === "queued").length;`
  - L187: `filter` → `.filter((q) => q.status === "uploading")`

### `src/hooks/use-recently-viewed.ts`
- Summary: `filter`×3
  - L25: `filter` → `return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : [];`
  - L120: `filter` → `setSlugs((prev) => [slug, ...prev.filter((s) => s !== slug)].slice(0, MAX));`
  - L122: `filter` → `writeLocal([slug, ...readLocal().filter((s) => s !== slug)].slice(0, MAX));`

### `src/integrations/supabase/types.ts`
- Summary: `animation`×3, `filter`×1, `opacity`×6, `scale`×1
  - L652: `animation` → `animation: string`
  - L681: `animation` → `animation?: string`
  - L710: `animation` → `animation?: string`
  - L757: `opacity` → `overlay_opacity: number`
  - L787: `opacity` → `overlay_opacity?: number`
  - L817: `opacity` → `overlay_opacity?: number`
  - L5730: `opacity` → `overlay_opacity: number | null`
  - L5754: `opacity` → `overlay_opacity?: number | null`
  - L5778: `opacity` → `overlay_opacity?: number | null`
  - L6615: `filter` → `category_filter?: string`
  - L6740: `scale` → `seed_all: { Args: { _scale?: number }; Returns: Json }`

### `src/lib/acquisition-intelligence.ts`
- Summary: `filter`×5
  - L188: `filter` → `const camps = withKpis(raw.by_campaign).filter((c) => c.id); // attributable only`
  - L190: `filter` → `const spending = camps.filter((c) => c.spend > 0);`
  - L205: `filter` → `const worst = [...spending].filter((c) => c.spend >= (best?.spend ?? 0) * 0.1).sort((a, b) => a.roas - b.roas)[0];`
  - L219: `filter` → `const sources = withKpis(raw.by_source).filter((s) => s.spend > 0 && s.orders > 0);`
  - L267: `filter` → `const chSorted = channels.filter((c) => c.spend > 0).sort((a, b) => b.roas - a.roas);`

### `src/lib/address-intelligence.ts`
- Summary: `filter`×2
  - L140: `filter` → `.filter(Boolean);`
  - L288: `filter` → `.filter((x) => x.last_used_at)`

### `src/lib/admin-guard.server.ts`
- Summary: `filter`×1
  - L91: `filter` → `const matched = roles.filter((r) => (allowed as string[]).includes(r));`

### `src/lib/admin-notifications.tsx`
- Summary: `filter`×1
  - L147: `filter` → `/* Whether a notification passes the chosen preference mode (client-side view filter) */`

### `src/lib/admin-performance.ts`
- Summary: `filter`×1
  - L118: `filter` → `.filter((r) => r.issues.length > 0)`

### `src/lib/admin-products-list.functions.ts`
- Summary: `filter`×3, `scale`×1
  - L78: `filter` → `/** Server-side paginated/filtered/sorted product listing — keeps the full`
  - L79: `scale` → `* catalog off the client and scales to thousands of products. */`
  - L198: `filter` → `.filter(([, slugs]) => slugs.length > 1)`
  - L228: `filter` → `.filter((x) => x.units > 0)`

### `src/lib/admin-queries.ts`
- Summary: `filter`×1
  - L2: `filter` → `import { includeSeedInAnalytics } from "@/lib/seed-filter";`

### `src/lib/admin-seo.functions.ts`
- Summary: `filter`×2
  - L96: `filter` → `.filter(([, s]) => s.length > 1)`
  - L100: `filter` → `.filter(([, s]) => s.length > 1)`

### `src/lib/admin-sku.functions.ts`
- Summary: `filter`×1
  - L48: `filter` → `(allSku ?? []).map((r: any) => String(r.sku ?? "").trim().toUpperCase()).filter(Boolean),`

### `src/lib/ai-operations.ts`
- Summary: `filter`×6, `scale`×1
  - L104: `scale` → `case "scale":`
  - L310: `filter` → `recs: recs.filter((r) => r.systems.includes(d.system)),`
  - L337: `filter` → `const topRisks = recs.filter((r) => r.category === "critical" || r.category === "risk").slice(0, 3);`
  - L338: `filter` → `const topOpps = recs.filter((r) => r.category === "profit" || r.category === "growth").slice(0, 3);`
  - L378: `filter` → `customer: `${s.customers} customers, lifetime value ${money(s.ltv, currency)}. ${recs.filter((r) => r.systems.includes("customers")).length} customer actions pending.`,`
  - L379: `filter` → `inventory: `Inventory value ${money(s.inventoryValue, currency)}. ${recs.filter((r) => r.systems.includes("inventory")).length} inventory actions pending (restock / clearance / ove`
  - L380: `filter` → `marketing: `Campaign ROI ${s.roi.toFixed(1)}×. ${recs.filter((r) => r.systems.includes("marketing")).length} marketing actions pending.`,`

### `src/lib/auth.tsx`
- Summary: `filter`×1
  - L76: `filter` → `{ event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${userId}` },`

### `src/lib/badge-visibility.tsx`
- Summary: `filter`×8, `rotate`×1
  - L97: `filter` → `const eligible = products.filter(`
  - L179: `rotate` → `* filling any remaining slot with ONE other eligible badge that rotates once`
  - L185: `filter` → `const must = pool.filter((b) => PRIORITY_KEYS.includes(b.key)).slice(0, cap);`
  - L186: `filter` → `const rest = pool.filter((b) => !PRIORITY_KEYS.includes(b.key));`
  - L222: `filter` → `return all.filter((b) => isFlashKey(b.key)).slice(0, 1);`
  - L224: `filter` → `return all.filter((b) => b.key === "bestseller").slice(0, 1);`
  - L226: `filter` → `return all.filter((b) => b.key === "trending").slice(0, 1);`
  - L228: `filter` → `const pool = all.filter(`
  - L237: `filter` → `const nonFlash = all.filter((b) => !isFlashKey(b.key));`

### `src/lib/badges.ts`
- Summary: `filter`×1, `shadow-`×2
  - L62: `shadow-` → `staff_pick: { label: "Staff Pick", emoji: "🏆", className: "bg-accent text-accent-foreground shadow-[var(--shadow-ember)]" },`
  - L66: `shadow-` → `trending: { label: "Trending", emoji: "🔥", className: "bg-accent text-accent-foreground shadow-[var(--shadow-ember)]" },`
  - L174: `filter` → `return PRIORITY.filter((k) => active.has(k))`

### `src/lib/block-analytics.ts`
- Summary: `filter`×2
  - L2: `filter` → `import { includeSeedInAnalytics } from "@/lib/seed-filter";`
  - L28: `filter` → `* filters by the block id stored in event metadata. Tracking is emitted by the`

### `src/lib/cart.tsx`
- Summary: `filter`×7
  - L183: `filter` → `{ event: "*", schema: "public", table: "cart_items", filter: `cart_id=eq.${cartId}` },`
  - L260: `filter` → `setItems((p) => p.filter((i) => !(i.slug === slug && !i.savedForLater)));`
  - L272: `filter` → `setItems((p) => p.filter((i) => !(i.slug === slug && i.savedForLater)));`
  - L320: `filter` → `setItems((p) => p.filter((i) => i.savedForLater));`
  - L362: `filter` → `.filter(Boolean) as DetailedItem[];`
  - L364: `filter` → `const active = items.filter((i) => !i.savedForLater);`
  - L365: `filter` → `const saved = items.filter((i) => i.savedForLater);`

### `src/lib/category-intelligence.ts`
- Summary: `filter`×7
  - L109: `filter` → `const catOrders = orders.filter((o) =>`
  - L114: `filter` → `.filter((it) => it.product_slug && productCatSlug.get(it.product_slug) === catSlug)`
  - L135: `filter` → `const mains = cats.filter((c) => !c.parent_id);`
  - L204: `filter` → `const growing = [...categories].filter((c) => c.revenue > 0).sort((a, b) => b.growth - a.growth)[0];`
  - L212: `filter` → `.filter((c) => c.views >= maxViews * 0.4 && c.conversion < 0.01 && c.orders < 3)`
  - L219: `filter` → `const under = categories.filter((c) => c.health === "critical" && c.productCount > 0).sort((a, b) => a.revenue - b.revenue)[0];`
  - L231: `filter` → `const declining = [...categories].filter((c) => c.revenue > 0 && c.growth < -10).sort((a, b) => a.growth - b.growth)[0];`

### `src/lib/chat-orders.ts`
- Summary: `filter`×1
  - L108: `filter` → `{ event: "*", schema: "public", table: "orders", filter: `user_id=eq.${userId}` },`

### `src/lib/command-actions.ts`
- Summary: `filter`×1, `scale`×8
  - L92: `scale` → `{ id: "qa-acq-best", group: "Marketing", icon: "Rocket", label: "Best Campaigns", to: "/admin-acquisition-intelligence?view=opportunities", roles: EDITOR, action: "cmd_acq_best", k`
  - L112: `scale` → `{ id: "qa-fin-opportunities", group: "System", icon: "Lightbulb", label: "Show Profit Opportunities", to: "/admin-financial?view=recommendations", roles: MANAGER, action: "cmd_fin_`
  - L117: `scale` → `{ id: "qa-fin-scale", group: "System", icon: "BarChart3", label: "Scale Winning Campaign", to: "/admin-financial?view=campaigns", roles: MANAGER, action: "cmd_fin_scale", keywords:`
  - L124: `scale` → `{ id: "qa-exec-opportunities", group: "System", icon: "Sparkles", label: "Show Executive Opportunities", to: "/admin-executive?view=opportunities", roles: MANAGER, action: "cmd_exe`
  - L136: `scale` → `{ id: "qa-ai-profit", group: "System", icon: "TrendingUp", label: "Show Profit Opportunities", to: "/admin-ai-operations?view=profit", roles: MANAGER, action: "cmd_ai_profit", keyw`
  - L137: `scale` → `{ id: "qa-ai-growth", group: "System", icon: "Sparkles", label: "Show Growth Opportunities", to: "/admin-ai-operations?view=growth", roles: MANAGER, action: "cmd_ai_growth", keywor`
  - L142: `scale` → `{ id: "qa-ai-marketing", group: "System", icon: "Megaphone", label: "Show Marketing Recommendations", to: "/admin-ai-operations?view=assistants", roles: MANAGER, action: "cmd_ai_ma`
  - L149: `filter` → `return QUICK_ACTIONS.filter((a) => a.roles.some((r) => roles.has(r)));`
  - L237: `scale` → `if (s.includes("scale") && (s.includes("winning") || s.includes("winner")) && s.includes("campaign")) return "qa-fin-scale";`

### `src/lib/command-automation-actions.ts`
- Summary: `filter`×1
  - L161: `filter` → `return AUTOMATION_COMMANDS.filter((c) => c.roles.some((r) => roles.has(r)));`

### `src/lib/command-center.tsx`
- Summary: `filter`×3
  - L63: `filter` → `const list = read<string[]>(RECENT_SEARCH_KEY, []).filter((x) => x !== term);`
  - L75: `filter` → `const list = read<RecentAction[]>(RECENT_ACTION_KEY, []).filter((x) => x.id !== a.id);`
  - L91: `filter` → `const next = exists ? list.filter((x) => x.id !== a.id) : [a, ...list].slice(0, 12);`

### `src/lib/command-search.ts`
- Summary: `filter`×3, `scale`×1
  - L7: `scale` → `* (DB-backed, scales to large catalogs) and returns normalized, grouped`
  - L151: `filter` → `.filter((p) => (p.stock_quantity ?? 0) <= (p.low_stock_threshold ?? 5))`
  - L202: `filter` → `subtitle: [c.phone, c.country].filter(Boolean).join(" · "),`
  - L281: `filter` → `const allowed = SEARCHERS.filter((s) => hasAny(roles, s.roles));`

### `src/lib/crisp.ts`
- Summary: `filter`×1, `opacity`×1
  - L56: `opacity` → `opacity: 0 !important;`
  - L184: `filter` → `.filter(([, v]) => v !== null && v !== undefined && `${v}`.length > 0)`

### `src/lib/customer-admin.functions.ts`
- Summary: `filter`×1
  - L178: `filter` → `const clean = Array.from(new Set(input.tags.map((t) => t.trim()).filter(Boolean)));`

### `src/lib/customer-center.functions.ts`
- Summary: `filter`×3
  - L326: `filter` → `const openAlerts = rows.filter((a) => a.status !== "resolved").length;`
  - L587: `filter` → `.filter(Boolean) as string[],`
  - L747: `filter` → `* Browse the security audit log with optional category + free-text filters.`

### `src/lib/customer-intelligence.ts`
- Summary: `filter`×23
  - L2: `filter` → `import { includeSeedInAnalytics } from "@/lib/seed-filter";`
  - L232: `filter` → `const userOrders = (ordersByUser.get(p.id) ?? []).filter((o) => isPaid(o.status, o.payment_status));`
  - L275: `filter` → `const recentSpend = userOrders.filter((o) => +new Date(o.created_at) >= cut1).reduce((s, o) => s + Number(o.total ?? 0), 0);`
  - L276: `filter` → `const priorSpend = userOrders.filter((o) => { const t = +new Date(o.created_at); return t >= cut2 && t < cut1; }).reduce((s, o) => s + Number(o.total ?? 0), 0);`
  - L310: `filter` → `const buyers = base.filter((b) => b.ordersCount > 0);`
  - L371: `filter` → `active: rows.filter((r) => r.active).length,`
  - L372: `filter` → `newCustomers: rows.filter((r) => r.tenureDays <= 30).length,`
  - L373: `filter` → `returning: rows.filter((r) => r.ordersCount >= 2).length,`
  - L374: `filter` → `vip: rows.filter((r) => r.tags.includes("VIP")).length,`
  - L375: `filter` → `dormant: rows.filter((r) => r.ordersCount > 0 && (r.recencyDays ?? 9999) > 120).length,`
  - L376: `filter` → `atRisk: rows.filter((r) => r.tags.includes("At Risk")).length,`
  - L377: `filter` → `highValue: rows.filter((r) => r.tags.includes("VIP") || r.tags.includes("High Value")).length,`
  - L412: `filter` → `const r = rows.filter((c) => c.region === region);`
  - L420: `filter` → `newCustomers: r.filter((c) => c.tenureDays <= 30).length,`
  - L435: `filter` → `const buyers = rows.filter((r) => r.ordersCount > 0);`
  - L441: `filter` → `fastestGrowing: [...buyers].filter((r) => r.trend === "up").sort((a, b) => b.lifetimeSpend - a.lifetimeSpend).slice(0, 8),`
  - L482: `filter` → `const reengage = rows.filter((r) => r.ordersCount > 0 && (r.recencyDays ?? 0) > 90 && r.churnRisk >= 55).sort((a, b) => b.lifetimeSpend - a.lifetimeSpend).slice(0, 10);`
  - L485: `filter` → `const recognition = rows.filter((r) => r.tags.includes("Loyal") && r.churnRisk < 50).sort((a, b) => b.frequencyPerMonth - a.frequencyPerMonth).slice(0, 10);`
  - L488: `filter` → `const vip = rows.filter((r) => r.tags.includes("VIP")).sort((a, b) => b.lifetimeSpend - a.lifetimeSpend).slice(0, 10);`
  - L491: `filter` → `const promo = rows.filter((r) => (r.segment === "Promising" || r.segment === "Potential Loyalists") && r.refundRate < 0.2).sort((a, b) => b.aov - a.aov).slice(0, 10);`
  - … 3 more matching lines omitted for brevity

### `src/lib/customer-marketing.ts`
- Summary: `filter`×17
  - L95: `filter` → `selector: { kind: "tag" | "segment" | "filter"; value: string };`
  - L122: `filter` → `const recent = members.filter((c) => c.lastOrderAt && +new Date(c.lastOrderAt) >= cut1).length;`
  - L123: `filter` → `const prior = members.filter((c) => {`
  - L131: `filter` → `const r = members.filter((c) => c.region === region);`
  - L144: `filter` → `const byTag = (t: string) => rows.filter((c) => c.tags.includes(t as never));`
  - L145: `filter` → `const bySegment = (s: string) => rows.filter((c) => c.segment === s);`
  - L146: `filter` → `const spendSorted = [...rows].filter((c) => c.ordersCount > 0).sort((a, b) => b.lifetimeSpend - a.lifetimeSpend);`
  - L154: `filter` → `{ key: "dormant", label: "Dormant Customers", tone: "danger", description: "Lapsed / inactive buyers.", selector: { kind: "segment", value: "Lost Customers" }, template: "dormant_r`
  - L158: `filter` → `{ key: "repeat", label: "Repeat Buyers", tone: "good", description: "Two or more paid orders.", selector: { kind: "filter", value: "repeat" }, template: "repeat_purchase", members:`
  - L159: `filter` → `{ key: "big_spenders", label: "Big Spenders", tone: "good", description: "Top 10% by lifetime spend.", selector: { kind: "filter", value: "big_spenders" }, template: "high_value", `
  - L162: `filter` → `return defs.map((d) => ({ ...d, ...aggregate(d.members) })).filter((a) => a.count > 0);`
  - L287: `filter` → `const buyers = rows.filter((c) => c.ordersCount > 0);`
  - L288: `filter` → `const retentionRate = buyers.length ? buyers.filter((c) => c.ordersCount >= 2).length / buyers.length : 0;`
  - L298: `filter` → `const live = campaigns.filter(`
  - L313: `filter` → `growthCustomers: rows.filter((c) => c.tenureDays <= 30).length,`
  - L326: `filter` → `return campaigns.filter((c) => c.config?.audience_key === key && c.status !== "completed");`
  - L407: `filter` → `const toPause = campaigns.filter((c) => c.status === "active" && c.config?.audience_key === key);`

### `src/lib/customer-tiers.ts`
- Summary: `filter`×1
  - L187: `filter` → `const parts = src.split(/\s+/).filter(Boolean);`

### `src/lib/email-admin.functions.ts`
- Summary: `filter`×21
  - L75: `filter` → `sent: latest.filter((r) => r.status === "sent").length,`
  - L76: `filter` → `pending: latest.filter((r) => r.status === "pending").length,`
  - L77: `filter` → `failed: latest.filter((r) => ["failed", "dlq", "bounced", "complained"].includes(r.status)).length,`
  - L78: `filter` → `suppressed: latest.filter((r) => r.status === "suppressed").length,`
  - L81: `filter` → `if (data.template) latest = latest.filter((r) => r.template_name === data.template);`
  - L83: `filter` → `latest = latest.filter((r) =>`
  - L164: `filter` → `dlq: failed.filter((r) => r.status === "dlq").length,`
  - L165: `filter` → `bounced: failed.filter((r) => r.status === "bounced").length,`
  - L166: `filter` → `complained: failed.filter((r) => r.status === "complained").length,`
  - L167: `filter` → `failed: failed.filter((r) => r.status === "failed").length,`
  - L172: `filter` → `unsubscribe: suppressed.filter((r) => r.reason === "unsubscribe").length,`
  - L173: `filter` → `bounce: suppressed.filter((r) => r.reason === "bounce").length,`
  - L174: `filter` → `complaint: suppressed.filter((r) => r.reason === "complaint").length,`
  - L501: `filter` → `return latest.filter((r) => set.has(r.status)).length;`
  - L525: `filter` → `const recentFailures = latest.filter((r) => FAIL.has(r.status)).slice(0, 15);`
  - L526: `filter` → `const recentBounces = latest.filter((r) => r.status === "bounced" || r.status === "complained").slice(0, 15);`
  - L538: `filter` → `const sentRows = latest.filter((r) => r.status === "sent" || r.status === "delivered");`
  - L539: `filter` → `const fallbackDeliveries = sentRows.filter(isFallbackRow).length;`
  - L543: `filter` → `const fallbackSuccess = auditRows.filter((a) => a.action === "email.sender.fallback_success").length;`
  - L544: `filter` → `const fallbackFailed = auditRows.filter((a) => a.action === "email.sender.fallback_failed").length;`
  - … 1 more matching lines omitted for brevity

### `src/lib/email-alerts.server.ts`
- Summary: `filter`×1
  - L95: `filter` → `const ids = [...new Set((admins ?? []).map((r) => r.user_id as string))].filter(Boolean)`

### `src/lib/email-templates/email-change.tsx`
- Summary: `contain`×2
  - L38: `contain` → `<Container style={container}>`
  - L75: `contain` → `const container = { maxWidth: '480px', margin: '0 auto', padding: '24px 0' }`

### `src/lib/email-templates/invite.tsx`
- Summary: `contain`×2
  - L31: `contain` → `<Container style={container}>`
  - L62: `contain` → `const container = { maxWidth: '480px', margin: '0 auto', padding: '24px 0' }`

### `src/lib/email-templates/magic-link.tsx`
- Summary: `contain`×2
  - L28: `contain` → `<Container style={container}>`
  - L54: `contain` → `const container = { maxWidth: '480px', margin: '0 auto', padding: '24px 0' }`

### `src/lib/email-templates/reauthentication.tsx`
- Summary: `contain`×2
  - L23: `contain` → `<Container style={container}>`
  - L45: `contain` → `const container = { maxWidth: '480px', margin: '0 auto', padding: '24px 0' }`

### `src/lib/email-templates/recovery.tsx`
- Summary: `contain`×2
  - L28: `contain` → `<Container style={container}>`
  - L55: `contain` → `const container = { maxWidth: '480px', margin: '0 auto', padding: '24px 0' }`

### `src/lib/email-templates/signup.tsx`
- Summary: `contain`×2
  - L33: `contain` → `<Container style={container}>`
  - L69: `contain` → `const container = { maxWidth: '480px', margin: '0 auto', padding: '24px 0' }`

### `src/lib/error-page.ts`
- Summary: `scale`×1
  - L7: `scale` → `<meta name="viewport" content="width=device-width, initial-scale=1" />`

### `src/lib/executive-intelligence.ts`
- Summary: `filter`×11
  - L194: `filter` → `const repeatCustomers = data.customers.filter((c) => (c.ordersCount ?? 0) > 1).length;`
  - L197: `filter` → `? (data.customers.filter((c) => c.profit > 0).length / customers) * 100 : 0;`
  - L239: `filter` → `const hiMargin = products.highestMargin.filter((p) => p.margin >= 40);`
  - L247: `filter` → `const bestRegion = [...regions].filter((r) => r.profit > 0 && r.margin >= 20).sort((a, b) => b.margin - a.margin)[0];`
  - L258: `filter` → `const lowStock = d.products.filter((p) => Number(p.stock_quantity) <= Number(p.low_stock_threshold ?? 0) && Number(p.stock_quantity) >= 0).length;`
  - L285: `filter` → `products: products.lowestMargin.filter((p) => p.margin < 20).slice(0, 5).map((p) => ({ label: p.name, value: p.revenue, sub: `${p.margin.toFixed(0)}% margin` })),`
  - L286: `filter` → `campaigns: [...campaigns].filter((c) => c.cost > 0 && c.roi < 1).sort((a, b) => a.roi - b.roi).slice(0, 5).map((c) => ({ label: c.name, value: c.profit, sub: `ROI ${c.roi.toFixed(2`
  - L292: `filter` → `].filter((r) => r.value > 0) : [],`
  - L303: `filter` → `worstCampaigns: [...campaigns].filter((c) => c.cost > 0).sort((a, b) => a.roi - b.roi).slice(0, 6),`
  - L433: `filter` → `const paid = orders.filter(isPaid);`
  - L438: `filter` → `const refunds = returns.filter(isCompletedReturn).reduce((a, r) => a + (Number(r.refund_amount) || 0), 0);`

### `src/lib/financial-marketing.ts`
- Summary: `filter`×16, `scale`×6
  - L89: `filter` → `const live = d.campaigns.filter((c) => c.status === "active" || c.status === "completed");`
  - L93: `filter` → `const paidOrders = d.financial.orders.filter(isPaid);`
  - L95: `filter` → `const completedReturns = d.financial.returns.filter(isCompletedReturn).length;`
  - L140: `filter` → `.filter((c) => c.metrics.revenue > 0 || c.metrics.cost > 0)`
  - L176: `filter` → `const segs = segmentStats(customers).filter((s) => s.count > 0);`
  - L179: `filter` → `const vip = customers.filter((c) => c.tags.includes("VIP" as never));`
  - L183: `filter` → `topCustomers: [...customers].filter((c) => c.profit > 0).sort((a, b) => b.profit - a.profit).slice(0, 8),`
  - L186: `filter` → `refundHeavy: customers.filter((c) => c.tags.includes("Refund Heavy" as never)).sort((a, b) => b.refundRate - a.refundRate).slice(0, 6),`
  - L187: `filter` → `supportHeavy: customers.filter((c) => (c.supportTickets ?? 0) >= 3).sort((a, b) => b.supportTickets - a.supportTickets).slice(0, 6),`
  - L208: `filter` → `const withMargin = all.filter((p) => p.revenue > 0);`
  - L284: `filter` → `const camps = d.campaigns.filter((c) => (c.region === region || c.region === "all") && (c.status === "active" || c.status === "completed"));`
  - L339: `filter` → `const losers = campaigns.filter((c) => c.cost > 0 && c.roi < 0).length;`
  - L355: `scale` → `| "increase_spend" | "reduce_spend" | "pause" | "scale" | "feature_product"`
  - L380: `scale` → `out.push({ id: `frec-scale-${c.id}`, action: "scale", tone: "good", title: `Scale "${c.name}"`, detail: `ROI ${c.roi.toFixed(1)}× (ROAS ${c.roas.toFixed(1)}×). Increase budget to c`
  - L389: `filter` → `const margin = prod.highestMargin.filter((p) => p.margin >= 40);`
  - L393: `filter` → `const lowMargin = prod.lowestMargin.filter((p) => p.margin > 0 && p.margin < 15);`
  - L447: `filter` → `const winners = campaigns.filter((c) => c.cost > 0 && c.roi >= 3);`
  - L449: `scale` → `out.push({ id: "fa-opp", severity: "low", kind: "profit_opportunity", title: "Profit opportunity", detail: `${winners.length} campaign(s) over 3× ROI — scale budget to capture more`
  - L451: `filter` → `const best = [...regions].filter((r) => r.profit > 0 && r.margin >= 25).sort((a, b) => b.margin - a.margin)[0];`
  - L490: `scale` → `export async function scaleCampaign(c: CampaignProfit, factor = 1.5): Promise<{ error?: string }> {`
  - … 2 more matching lines omitted for brevity

### `src/lib/financial-metrics.ts`
- Summary: `filter`×5
  - L110: `filter` → `.filter((r) => r.refund_status === "completed" || r.status === "completed" || r.status === "approved")`
  - L114: `filter` → `.filter((p) => ["pending", "processing", "requires_capture"].includes((p.status ?? "").toLowerCase()))`
  - L210: `filter` → `].filter((x) => x.value > 0);`
  - L294: `filter` → `const lowStock = d.products.filter((p) => p.stock_quantity <= (p.low_stock_threshold ?? 5)).length;`
  - L357: `filter` → `const repeatCustomers = [...ordersByCustomer.values()].filter((n) => n >= 2).length;`

### `src/lib/fraud-intelligence.ts`
- Summary: `filter`×14, `mask`×1
  - L2: `filter` → `import { includeSeedInAnalytics } from "@/lib/seed-filter";`
  - L149: `filter` → `.filter(Boolean);`
  - L240: `filter` → `const paid = uOrders.filter(isPaid).length;`
  - L241: `filter` → `const cancelled = uOrders.filter(isCancelled).length;`
  - L242: `filter` → `const cod = uOrders.filter(isCOD);`
  - L243: `filter` → `const codCancelled = cod.filter(isCancelled).length;`
  - L244: `filter` → `const refundsForUser = uOrders.filter((o) => {`
  - L249: `filter` → `const couponOrders = uOrders.filter((o) => (o.promo_code ?? "").trim()).length;`
  - L321: `filter` → `const mismatched = uOrders.filter(`
  - L385: `mask` → `detail: `Traffic from this account shows VPN or proxy characteristics, often used to mask location.`,`
  - L494: `filter` → `critical: signals.filter((s) => s.severity === "critical").length,`
  - L495: `filter` → `high: signals.filter((s) => s.severity === "high").length,`
  - L670: `filter` → `critical: signals.filter((s) => s.severity === "critical").length,`
  - L671: `filter` → `high: signals.filter((s) => s.severity === "high").length,`
  - L673: `filter` → `lockedAccounts: locks.filter((l) => l.locked).length,`

### `src/lib/geo-detect.ts`
- Summary: `filter`×2, `scale`×1
  - L93: `filter` → `.filter(Boolean)`
  - L194: `scale` → `// Confidence = how dominant the winning side is, scaled by absolute strength.`
  - L202: `filter` → `const yes = indiaVotes.filter(Boolean).length;`

### `src/lib/image-palette.ts`
- Summary: `contain`×2, `scale`×1
  - L4: `scale` → `// outer edges/corners on a downscaled offscreen canvas, then exposes that exact`
  - L5: `contain` → `// solid color so the image container can blend seamlessly with the photo's own`
  - L18: `contain` → `/** Solid CSS background for the image container (exactly the edge color). */`

### `src/lib/inbox-placement.functions.ts`
- Summary: `filter`×1
  - L140: `filter` → `const recipients = [gmailAddress, outlookAddress].filter(Boolean) as string[];`

### `src/lib/inventory-intelligence.ts`
- Summary: `filter`×7
  - L2: `filter` → `import { includeSeedInAnalytics } from "@/lib/seed-filter";`
  - L484: `filter` → `.filter((p) => p.suggestedReorderQty > 0 && (p.urgency === "critical" || p.urgency === "high"))`
  - L492: `filter` → `.filter((p) => p.trend === "up" && p.trendPct > 40 && p.stock > p.threshold * 2)`
  - L499: `filter` → `.filter((p) => p.classification === "dead" || p.classification === "overstock")`
  - L507: `filter` → `.filter((p) => p.avgDailySales > 0 && p.profit > 0)`
  - L514: `filter` → `const fast = sorted.filter((p) => p.trend === "up" && p.avgDailySales > 0);`
  - L515: `filter` → `const slow = sorted.filter((p) => p.classification === "slow" || p.classification === "dead");`

### `src/lib/inventory-marketing.ts`
- Summary: `filter`×12, `scale`×4
  - L98: `filter` → `const sold = [...intel].filter((p) => p.unitsSold > 0).sort((a, b) => b.unitsSold - a.unitsSold);`
  - L101: `filter` → `const pick = (fn: (p: ProductIntel) => boolean) => intel.filter(fn);`
  - L150: `filter` → `return buckets.filter((b) => b.products.length > 0);`
  - L226: `filter` → `const unfeatured = best.products.filter((p) => !promotedSlugs.has(p.slug)).slice(0, 6);`
  - L237: `filter` → `const withDemand = oos.products.filter((p) => p.avgDailySales > 0);`
  - L247: `filter` → `const riskyPromoted = intel.filter(`
  - L259: `filter` → `const promotedReturns = ret?.products.filter((p) => promotedSlugs.has(p.slug)) ?? [];`
  - L269: `scale` → `const scaleUp = margin?.products.filter((p) => p.trend === "up" && !promotedSlugs.has(p.slug)) ?? [];`
  - L269: `filter` → `const scaleUp = margin?.products.filter((p) => p.trend === "up" && !promotedSlugs.has(p.slug)) ?? [];`
  - L270: `scale` → `if (scaleUp.length) recs.push({`
  - L273: `scale` → `detail: `${scaleUp.length} high-margin products have rising demand and no active campaign. Scale up promotion.`,`
  - L274: `scale` → `slugs: scaleUp.map((p) => p.slug), impact: scaleUp.reduce((s, p) => s + p.revenue, 0),`
  - L302: `filter` → `const live = campaigns.filter((c) => c.status === "active" || c.status === "completed");`
  - L307: `filter` → `const atRisk = intel.filter((p) => p.classification === "dead" || p.classification === "overstock");`
  - L338: `filter` → `return campaigns.filter((c) => {`
  - L414: `filter` → `const toPause = campaigns.filter(`

### `src/lib/invoice.ts`
- Summary: `filter`×3
  - L110: `filter` → `[addr?.city, addr?.region, addr?.postal_code].filter(Boolean).join(", "),`
  - L113: `filter` → `].filter(Boolean) as string[];`
  - L124: `filter` → `].filter(Boolean) as string[];`

### `src/lib/legal-links.test.ts`
- Summary: `filter`×1
  - L34: `filter` → `const SRC_FILES = walk(join(process.cwd(), "src")).filter(`

### `src/lib/live-metrics.ts`
- Summary: `filter`×4
  - L2: `filter` → `import { includeSeedInAnalytics } from "@/lib/seed-filter";`
  - L47: `filter` → `ordersPending: orders.filter((o) => o.status === "pending" || o.status === "processing").length,`
  - L48: `filter` → `lowStockNow: products.filter((p) => p.stock_quantity <= (p.low_stock_threshold ?? 5)).length,`
  - L51: `filter` → `activeSessions: new Set(sessions.map((s) => s.session_id).filter(Boolean)).size,`

### `src/lib/marketing-automation.ts`
- Summary: `filter`×27, `rotate`×2
  - L141: `rotate` → `{ key: "rotate_banners", label: "Rotate Banners", group: "storefront", channel: "banner", automationType: "storefront", trigger: "store_banners", description: "Rotate hero banners `
  - L142: `rotate` → `{ key: "rotate_announcements", label: "Rotate Announcements", group: "storefront", channel: "announcement", automationType: "storefront", trigger: "store_announce", description: "C`
  - L265: `filter` → `activeAutomations: intel.automations.filter((a) => a.enabled && a.status === "active").length,`
  - L266: `filter` → `scheduledCampaigns: intel.campaigns.filter((c) => c.status === "scheduled").length,`
  - L267: `filter` → `activeCampaigns: intel.campaigns.filter((c) => c.status === "active").length,`
  - L292: `filter` → `.filter((c) => c.metrics.revenue > 0)`
  - L300: `filter` → `.filter((c) => c.status === "scheduled" && c.scheduled_at && new Date(c.scheduled_at).getTime() >= now)`
  - L317: `filter` → `const bySegment = (s: CustomerSegment) => customers.filter((c) => c.segment === s);`
  - L318: `filter` → `const byTag = (t: string) => customers.filter((c) => c.tags.includes(t as never));`
  - L355: `filter` → `const reengage = customers.filter((c) => c.ordersCount > 0 && (c.recencyDays ?? 0) > 90 && c.churnRisk >= 55);`
  - L359: `filter` → `const vip = customers.filter((c) => c.tags.includes("VIP"));`
  - L363: `filter` → `const newC = customers.filter((c) => c.segment === "New Customers");`
  - L367: `filter` → `const fast = products.filter((p) => p.trend === "up" && p.avgDailySales > 0).sort((a, b) => b.avgDailySales - a.avgDailySales);`
  - L371: `filter` → `const clear = products.filter((p) => p.classification === "dead" || p.classification === "overstock" || p.classification === "slow");`
  - L375: `filter` → `const margin = products.filter((p) => p.price > p.cost && p.stock > 0)`
  - L377: `filter` → `.filter((x) => x.m >= 0.4)`
  - L402: `filter` → `const running = intel.campaigns.filter((c) => c.status === "active" || c.status === "completed");`
  - L414: `filter` → `const outOfStock = new Set(intel.products.filter((p) => p.stock <= 0).map((p) => p.slug));`
  - L418: `filter` → `const conflicts = slugs.filter((s) => outOfStock.has(s));`
  - L674: `filter` → `const successful = rows.filter((r) => r.status === "success").length;`
  - … 9 more matching lines omitted for brevity

### `src/lib/marketplace-quality.ts`
- Summary: `contain`×1, `filter`×5, `scale`×1
  - L6: `scale` → `* generates SEO — it audits completeness and quality at scale across three`
  - L84: `contain` → `invalid_canonical: { label: "Invalid canonical", category: "schema", severity: "warning", hint: "Slug is missing or contains invalid characters — canonical URL may be malformed." }`
  - L140: `filter` → `const wc = (s: string | null | undefined) => (s ?? "").trim().split(/\s+/).filter(Boolean).length;`
  - L150: `filter` → `const live = products.filter((p) => {`
  - L195: `filter` → `if ((p.meta_keywords?.filter(Boolean).length ?? 0) < 3) issues.push("low_keyword_diversity");`
  - L263: `filter` → `const dirty = audited.filter((a) =>`
  - L280: `filter` → `const flagged = audited.filter((a) => a.issues.length > 0).length;`

### `src/lib/media-engine.ts`
- Summary: `rotate`×7, `translate`×1
  - L118: `rotate` → `// Crop / rotate (non-destructive — produces a new blob)`
  - L125: `rotate` → `rotateDeg: number,`
  - L129: `rotate` → `const rad = (rotateDeg * Math.PI) / 180;`
  - L132: `rotate` → `const rotated = rotateDeg % 180 !== 0;`
  - L134: `rotate` → `canvas.width = rotated ? ch : cw;`
  - L135: `rotate` → `canvas.height = rotated ? cw : ch;`
  - L138: `translate` → `ctx.translate(canvas.width / 2, canvas.height / 2);`
  - L139: `rotate` → `ctx.rotate(rad);`

### `src/lib/notifications.tsx`
- Summary: `contain`×1, `filter`×9
  - L130: `filter` → `if (t.includes("payment") && (t.includes("fail") || t.includes("retry"))) return `/account/orders${orderId ? `?order=${orderId}&filter=failed` : "?filter=failed"}`;`
  - L150: `contain` → `* Split a resolved destination string (which may contain a query string, e.g.`
  - L290: `filter` → `{ event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },`
  - L297: `filter` → `{ event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },`
  - L300: `filter` → `if (n.archived_at) return prev.filter((p) => p.id !== n.id);`
  - L304: `filter` → `{ event: "DELETE", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },`
  - L305: `filter` → `(payload) => setItems((prev) => prev.filter(n => n.id !== (payload.old as { id: string }).id)))`
  - L323: `filter` → `setItems(prev => prev.filter(n => n.id !== id));`
  - L328: `filter` → `setItems(prev => prev.filter(n => n.id !== id));`
  - L337: `filter` → `const unread = items.filter(n => !n.read_at).length;`

### `src/lib/order-invoice.ts`
- Summary: `box-shadow`×1, `contain`×1, `filter`×2, `scale`×1, `transform`×6
  - L4: `contain` → `* Pure presentation: builds a self-contained, print-optimized A4 HTML document`
  - L89: `filter` → `const addr = d.addressLines.filter(Boolean).map((l) => esc(l)).join("<br/>");`
  - L95: `scale` → `<meta name="viewport" content="width=device-width, initial-scale=1" />`
  - L109: `transform` → `.doc .label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; }`
  - L115: `transform` → `.card h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 8px; }`
  - L122: `transform` → `thead th { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #888; text-align: left; padding: 8px 10px; border-bottom: 2px solid #111; }`
  - L132: `transform` → `.cashbar .k { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #555; }`
  - L135: `transform` → `.checklist h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 10px; }`
  - L146: `transform` → `.slip .big-label { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #888; margin-top: 26px; }`
  - L155: `box-shadow` → `.sheet, .slip { margin: 0; box-shadow: none; }`
  - L191: `filter` → `<div class="line">${[d.city, d.state, d.country].filter(Boolean).map(esc).join(", ")}${`

### `src/lib/order-operations.ts`
- Summary: `filter`×7
  - L315: `filter` → `for (const t of tags) room[t] = orders.filter((o) => o.tags.includes(t));`
  - L326: `filter` → `count: orders.filter((o) => o.riskScore >= 60).length });`
  - L353: `filter` → `const bottleneck = orders.filter((o) => o.payment_status === "paid" && !o.shipped_at).length;`
  - L366: `filter` → `const v = nums.filter((n) => Number.isFinite(n));`
  - L374: `filter` → `const fulfilled = orders.filter((o) => o.fulfillmentHours != null);`
  - L375: `filter` → `const delivered = orders.filter((o) => o.deliveryDays != null);`
  - L381: `filter` → `delayedCount: orders.filter((o) => o.isDelayed).length,`

### `src/lib/packing-slip.ts`
- Summary: `filter`×4
  - L55: `filter` → `[a.city, a.state || a.region, a.postal || a.postal_code].filter(Boolean).join(", "),`
  - L57: `filter` → `].filter(Boolean);`
  - L99: `filter` → `const slugs = [...new Set((o.order_items ?? []).map((i) => i.product_slug).filter(Boolean) as string[])];`
  - L190: `filter` → `].filter(Boolean) as string[];`

### `src/lib/payment-center.functions.ts`
- Summary: `filter`×2
  - L144: `filter` → `const subjectIds = [input.orderId, input.userId, input.email].filter(`
  - L169: `filter` → `const openAlerts = alertRows.filter((a) => a.status !== "resolved").length;`

### `src/lib/payment-methods.functions.ts`
- Summary: `filter`×3
  - L104: `filter` → `const live = tokens.filter((t) => !t.expired_at || t.expired_at > nowSec);`
  - L123: `filter` → `const stale = (dbRows ?? []).filter((r: any) => !liveIds.has(r.razorpay_token_id));`
  - L376: `filter` → `const live = tokens.filter((t) => !t.expired_at || t.expired_at > nowSec);`

### `src/lib/personalization.ts`
- Summary: `filter`×3
  - L46: `filter` → `return (data ?? []).map((r: { product_slug: string }) => r.product_slug).filter(Boolean);`
  - L51: `filter` → `return (data ?? []).map((r: { product_slug: string }) => r.product_slug).filter(Boolean);`
  - L103: `filter` → `.filter((p) => !seen.has(p.slug))`

### `src/lib/pincode-lookup.server.ts`
- Summary: `filter`×1
  - L70: `filter` → `Array.from(new Set(arr.map((s) => (s ?? "").trim()).filter(Boolean))).slice(0, limit);`

### `src/lib/product-completion.ts`
- Summary: `filter`×1
  - L48: `filter` → `const done = keys.filter((k) => sections[k]).length;`

### `src/lib/product-description.ts`
- Summary: `contain`×1, `filter`×4
  - L20: `contain` → `/** True when the raw text contained no recognisable structure. */`
  - L67: `filter` → `const nonEmpty = lines.map((l) => l.trim()).filter(Boolean);`
  - L81: `filter` → `const items = nonEmpty.map(stripBullet).filter(Boolean);`
  - L100: `filter` → `const clean = paragraphs.filter(Boolean);`
  - L171: `filter` → `const specLines = trimmed.slice(start).filter(Boolean);`

### `src/lib/product-images.ts`
- Summary: `blur`×2
  - L3: `blur` → `// blurred LQIP placeholder. We never ship the original full-resolution JPEG`
  - L53: `blur` → `* Returns responsive WebP srcset + blur-up placeholder for a known bundled`

### `src/lib/product-marketing.ts`
- Summary: `filter`×7
  - L242: `filter` → `const featuring = allCampaigns.filter((c) => campaignSlugs(c).includes(slug));`
  - L244: `filter` → `const active = featuring.filter((c) => activeStatuses.includes(c.status) && c.status !== "completed").map(toRow);`
  - L245: `filter` → `const history = featuring.filter((c) => c.status === "completed").map(toRow);`
  - L255: `filter` → `const withRevenue = featRows.filter((r) => r.attributed.revenue > 0);`
  - L277: `filter` → `const mine = intel.filter((c) => buyerIds.has(c.id));`
  - L306: `filter` → `featuring.filter((c) => c.status === "active").length * 16 +`
  - L413: `filter` → `const slugs = campaignSlugs(campaign).filter((s) => s !== slug);`

### `src/lib/product-rating.functions.ts`
- Summary: `filter`×1
  - L64: `filter` → `const authentic = (customerReviews || []).filter((r: any) => !r.is_seeded);`

### `src/lib/products.ts`
- Summary: `filter`×1
  - L328: `filter` → `return slugs.map((s) => map.get(s)).filter((p): p is Product => !!p);`

### `src/lib/razorpay.functions.ts`
- Summary: `filter`×2
  - L769: `filter` → `const succeeded = all.filter((r) => r.status === "succeeded");`
  - L770: `filter` → `const failed = all.filter((r) => r.status === "failed");`

### `src/lib/razorpay.server.ts`
- Summary: `filter`×2
  - L103: `filter` → `? [token.vpa.username, token.vpa.handle].filter(Boolean).join("@")`
  - L161: `filter` → `.filter(([, v]) => v === true || (v && typeof v === "object"))`

### `src/lib/refund-execute.server.ts`
- Summary: `filter`×1
  - L98: `filter` → `.filter((r) => r.status !== "failed" && r.id !== opts.existingRefundId)`

### `src/lib/region.functions.ts`
- Summary: `filter`×1
  - L64: `filter` → `forwarded.split(",").filter(Boolean).length > 2 ||`

### `src/lib/returns-admin.functions.ts`
- Summary: `filter`×2
  - L98: `filter` → `.filter(Boolean)`
  - L100: `filter` → `const photo_urls = await Promise.all(((r.photo_urls ?? []).filter(Boolean)).map(signPhoto));`

### `src/lib/reviews-ai.functions.ts`
- Summary: `filter`×1
  - L146: `filter` → `return { analyzed: results.filter((r) => r.ok).length, total: results.length, results };`

### `src/lib/section-analytics.ts`
- Summary: `filter`×1
  - L4: `filter` → `import { includeSeedInAnalytics } from "@/lib/seed-filter";`

### `src/lib/seed.functions.ts`
- Summary: `scale`×3
  - L124: `scale` → `scale: z.number().min(0.1).max(10).default(1),`
  - L127: `scale` → `/** Admin — seed the entire store at a chosen scale. */`
  - L136: `scale` → `_scale: data.scale,`

### `src/lib/seo-intelligence.server.ts`
- Summary: `filter`×1
  - L56: `filter` → `const sample = locs.filter((_, i) => i % step === 0).slice(0, limit);`

### `src/lib/seo-intelligence.ts`
- Summary: `contain`×1, `filter`×1
  - L6: `contain` → `* checks performed server-side. This module contains NO data fetching and NO`
  - L225: `filter` → `const critical = opps.filter((o) => o.severity === "high").length;`

### `src/lib/share.ts`
- Summary: `contain`×1, `opacity`×1
  - L40: `contain` → `return `${u.origin}/storage/v1/render/image/public/${path}?width=${width}&quality=70&resize=contain`;`
  - L91: `opacity` → `ta.style.opacity = "0";`

### `src/lib/shipment-analytics.ts`
- Summary: `filter`×19
  - L134: `filter` → `const c = (st: string) => shipments.filter((s) => s.status === st).length;`
  - L135: `filter` → `const delivered = shipments.filter((s) => s.status === "delivered");`
  - L136: `filter` → `const deliveredToday = delivered.filter((s) => {`
  - L140: `filter` → `const delayed = shipments.filter((s) => delayById.get(s.id)?.delayed).length;`
  - L154: `filter` → `awaitingShipment: orders.filter((o) => !shippedOrderIds.has(o.id) && !["cancelled"].includes(o.status)).length,`
  - L162: `filter` → `const finished = shipments.filter((s) => ["delivered", "returned", "failed_delivery", "cancelled"].includes(s.status));`
  - L163: `filter` → `const active = shipments.filter((s) => !["delivered", "cancelled"].includes(s.status));`
  - L166: `filter` → `const delivered = shipments.filter((s) => s.status === "delivered").length;`
  - L167: `filter` → `const failed = shipments.filter((s) => s.status === "failed_delivery").length;`
  - L168: `filter` → `const returned = shipments.filter((s) => s.status === "returned").length;`
  - L169: `filter` → `const stuck = shipments.filter((s) => delayById.get(s.id)?.stuck).length;`
  - L170: `filter` → `const delayed = shipments.filter((s) => delayById.get(s.id)?.delayed).length;`
  - L218: `filter` → `const finished = rows.filter((s) => ["delivered", "returned", "failed_delivery"].includes(s.status));`
  - L219: `filter` → `const delivered = rows.filter((s) => s.status === "delivered");`
  - L226: `filter` → `.filter((d): d is number => d != null && d >= 0);`
  - L227: `filter` → `const active = rows.filter((s) => !["delivered", "cancelled"].includes(s.status));`
  - L235: `filter` → `returnRate: finished.length ? rows.filter((s) => s.status === "returned").length / finished.length : 0,`
  - L236: `filter` → `failureRate: finished.length ? rows.filter((s) => s.status === "failed_delivery").length / finished.length : 0,`
  - L237: `filter` → `delayRate: active.length ? active.filter((s) => delayById.get(s.id)?.delayed).length / active.length : 0,`

### `src/lib/shipment-notify.functions.ts`
- Summary: `filter`×1
  - L82: `filter` → `const matched = roles.filter((r) => (NOTIFY_STAFF as string[]).includes(r));`

### `src/lib/startup-diagnostics.ts`
- Summary: `animate-`×2, `blur`×3, `contain`×1, `filter`×2, `isolation`×1, `mask`×1, `rotate`×2, `scale`×2, `shadow-`×2, `transform`×2, `translate`×2, `will-change`×2
  - L184: `transform` → `"[style*='transform']",`
  - L185: `filter` → `"[style*='filter']",`
  - L187: `will-change` → `"[style*='will-change']",`
  - L188: `translate` → `"[class*='translate']",`
  - L189: `scale` → `"[class*='scale']",`
  - L190: `rotate` → `"[class*='rotate']",`
  - L191: `blur` → `"[class*='blur']",`
  - L192: `blur` → `"[class*='backdrop-blur']",`
  - L193: `animate-` → `"[class*='animate-']",`
  - L194: `shadow-` → `"[class*='shadow-']",`
  - L212: `transform` → `return /transform|translate|scale|rotate|blur|backdrop|filter|will-change|contain|isolation|animate-|shadow-|mask/i.test(value);`
  - L212: `translate` → `return /transform|translate|scale|rotate|blur|backdrop|filter|will-change|contain|isolation|animate-|shadow-|mask/i.test(value);`
  - L212: `rotate` → `return /transform|translate|scale|rotate|blur|backdrop|filter|will-change|contain|isolation|animate-|shadow-|mask/i.test(value);`
  - L212: `scale` → `return /transform|translate|scale|rotate|blur|backdrop|filter|will-change|contain|isolation|animate-|shadow-|mask/i.test(value);`
  - L212: `filter` → `return /transform|translate|scale|rotate|blur|backdrop|filter|will-change|contain|isolation|animate-|shadow-|mask/i.test(value);`
  - L212: `isolation` → `return /transform|translate|scale|rotate|blur|backdrop|filter|will-change|contain|isolation|animate-|shadow-|mask/i.test(value);`
  - L212: `contain` → `return /transform|translate|scale|rotate|blur|backdrop|filter|will-change|contain|isolation|animate-|shadow-|mask/i.test(value);`
  - L212: `will-change` → `return /transform|translate|scale|rotate|blur|backdrop|filter|will-change|contain|isolation|animate-|shadow-|mask/i.test(value);`
  - L212: `shadow-` → `return /transform|translate|scale|rotate|blur|backdrop|filter|will-change|contain|isolation|animate-|shadow-|mask/i.test(value);`
  - L212: `blur` → `return /transform|translate|scale|rotate|blur|backdrop|filter|will-change|contain|isolation|animate-|shadow-|mask/i.test(value);`
  - … 2 more matching lines omitted for brevity

### `src/lib/storage-image.ts`
- Summary: `contain`×1, `transform`×1
  - L2: `transform` → `// transformation endpoint so product cards download a device-appropriate,`
  - L27: `contain` → `u.searchParams.set("resize", "contain");`

### `src/lib/support-inbound.server.ts`
- Summary: `filter`×1
  - L63: `filter` → `return arr.map((t) => normalizeEmail(t)).filter((e): e is string => !!e)`

### `src/lib/traffic-intelligence.ts`
- Summary: `filter`×33
  - L2: `filter` → `import { includeSeedInAnalytics } from "@/lib/seed-filter";`
  - L142: `filter` → `// page_views / orders / search carry is_seeded; analytics filtered via metadata flag absence`
  - L144: `filter` → `events = events.filter((e) => !evSeeded(e));`
  - L150: `filter` → `const curEvents = events.filter((e) => inWindow(e.created_at));`
  - L151: `filter` → `const prevEvents = events.filter((e) => !inWindow(e.created_at));`
  - L152: `filter` → `const curSessions = sessions.filter((s) => inWindow(s.started_at));`
  - L160: `filter` → `const pvEvents = curEvents.filter((e) => e.event === "page_view").slice().reverse();`
  - L176: `filter` → `const views = curEvents.filter((e) => e.event === "page_view").length || pv.length;`
  - L183: `filter` → `const paidOrders = orders.filter((o) => isPaidOrder(o.status, o.payment_status));`
  - L187: `filter` → `const bounce = curSessions.length ? (curSessions.filter((s) => s.page_views <= 1).length / curSessions.length) * 100 : 0;`
  - L194: `filter` → `const liveSessions = sessions.filter((s) => new Date(s.last_seen).getTime() >= liveCut);`
  - L309: `filter` → `for (const e of curEvents.filter((e) => e.event === "page_view")) {`
  - L314: `filter` → `for (const e of curEvents.filter((e) => e.event === "purchase")) {`
  - L332: `filter` → `const sess = curSessions.filter((s) => normRegion(s.country) === region);`
  - L334: `filter` → `for (const e of curEvents.filter((e) => e.event === "page_view" && normRegion(e.metadata?.region) === region)) {`
  - L337: `filter` → `const regOrders = paidOrders.filter((o) => normRegion(o.market_region) === region);`
  - L340: `filter` → `for (const e of curEvents.filter((e) => e.event === "product_view" && normRegion(e.metadata?.region) === region && e.product_slug)) {`
  - L358: `filter` → `const sess = curSessions.filter((s) => (s.device ?? "desktop").toLowerCase() === device);`
  - L360: `filter` → `for (const e of curEvents.filter((e) => e.event === "page_view" && str(e.metadata?.device).toLowerCase() === device)) {`
  - L363: `filter` → `const purchases = curEvents.filter((e) => e.event === "purchase" && classify(e.session_id).device === device);`
  - … 13 more matching lines omitted for brevity

### `src/lib/unified-activity.ts`
- Summary: `filter`×2
  - L6: `filter` → `import { includeSeedInAnalytics } from "@/lib/seed-filter";`
  - L99: `filter` → `* All reads honour the seed-data filter so demo rows never pollute live ops.`

### `src/lib/use-addresses.ts`
- Summary: `filter`×3
  - L73: `filter` → `const ok = checks.filter((c) => c.ok).length;`
  - L110: `filter` → `{ event: "*", schema: "public", table: "addresses", filter: `user_id=eq.${user.id}` },`
  - L185: `filter` → `const used = addresses.filter((a) => a.last_used_at);`

### `src/lib/use-ai-operations.ts`
- Summary: `filter`×3
  - L120: `filter` → `const filtered = allRecs.filter((r) => {`
  - L130: `filter` → `return rankByFeedback(filtered, feedback);`
  - L136: `filter` → `.filter((s) => s.status === "executed")`

### `src/lib/use-categories.ts`
- Summary: `filter`×2
  - L142: `filter` → `const mains = categories.filter((c) => !c.parent_id);`
  - L144: `filter` → `categories.filter((c) => c.parent_id === parentId);`

### `src/lib/use-checkout-analytics.ts`
- Summary: `filter`×1
  - L60: `filter` → `rows.filter((r) => names.includes(r.event)).length;`

### `src/lib/use-checkout-funnel.ts`
- Summary: `filter`×5
  - L124: `filter` → `const curr = rows.filter((r) => inWindow(r, start, now));`
  - L125: `filter` → `const prev = rows.filter((r) => inWindow(r, prevStart, start));`
  - L130: `filter` → `count: curr.filter((r) => s.events.includes(r.event)).length,`
  - L133: `filter` → `const currFailures = curr.filter((r) => FAILURE_EVENTS.has(r.event));`
  - L134: `filter` → `const prevFailures = prev.filter((r) => FAILURE_EVENTS.has(r.event));`

### `src/lib/use-fraud-intelligence.ts`
- Summary: `filter`×4
  - L94: `filter` → `setOpen(alerts.filter((a) => a.status === "open" || a.status === "reviewing"));`
  - L95: `filter` → `setLocked(locks.filter((l) => l.locked).length);`
  - L110: `filter` → `const critical = open.filter((a) => a.severity === "critical").length;`
  - L111: `filter` → `const high = open.filter((a) => a.severity === "high").length;`

### `src/lib/use-low-end-device.ts`
- Summary: `animation`×3, `blur`×4, `contain`×2, `transform`×3, `will-change`×1
  - L5: `animation` → `* GPU compositing, continuous animations) can be skipped — preventing the`
  - L35: `blur` → `// safe mode instead of briefly mounting blur/3D layers before hooks update.`
  - L55: `transform` → `* compositor bug where many promoted layers (transform + will-change + contain:`
  - L55: `contain` → `* compositor bug where many promoted layers (transform + will-change + contain:`
  - L55: `will-change` → `* compositor bug where many promoted layers (transform + will-change + contain:`
  - L58: `transform` → `* a transform-free incremental rendering strategy on Android. SSR-safe.`
  - L80: `contain` → `*  for compositor corruption. UA contains "; wv" or lacks a real browser token. */`
  - L95: `transform` → `* Decide whether to use the transform-free Incremental Rendering Grid instead`
  - L145: `blur` → `* visual effects (visible card count, blur strength, glow, shadows, animation).`
  - L145: `animation` → `* visual effects (visible card count, blur strength, glow, shadows, animation).`
  - L147: `blur` → `*   low  — ≤4GB RAM, ≤4 cores, OR prefers-reduced-motion. Minimal blur, no`
  - L148: `animation` → `*          heavy glow, simplest animations.`
  - L150: `blur` → `*   mid  — everything in between. Medium blur, reduced shadows.`

### `src/lib/use-payment-methods.ts`
- Summary: `filter`×2
  - L73: `filter` → `{ event: "*", schema: "public", table: "saved_payment_methods", filter: `user_id=eq.${user.id}` },`
  - L102: `filter` → `setMethods((prev) => prev.filter((m) => m.id !== id));`

### `src/lib/use-product-badges.ts`
- Summary: `animation`×7, `filter`×3
  - L22: `animation` → `/** Maps a badge animation to its CSS utility class (defined in styles.css). */`
  - L60: `animation` → `animation: BadgeAnimation;`
  - L100: `animation` → `animation?: string | null;`
  - L142: `animation` → `animation: (r.animation as BadgeAnimation) ?? "none",`
  - L241: `filter` → `return list.filter((b) => {`
  - L295: `animation` → `animation: BadgeAnimation;`
  - L322: `animation` → `animation: input.animation,`
  - L386: `animation` → `animation: b.animation,`
  - L456: `filter` → `const targets = slugs.filter(`
  - L655: `filter` → `activeBadges: snap.types.filter((t) => t.enabled && !t.archived).length,`

### `src/lib/use-serviceability-analytics.ts`
- Summary: `filter`×1
  - L69: `filter` → `const count = (names: string[]) => rows.filter((r) => names.includes(r.event)).length;`

### `src/lib/use-support-settings.ts`
- Summary: `filter`×1
  - L22: `filter` → `? (row.support_whatsapp_numbers as string[]).filter((n) => typeof n === "string" && n.trim())`

### `src/lib/use-support-unread.ts`
- Summary: `filter`×2
  - L25: `filter` → `.on('postgres_changes', { event: '*', schema: 'public', table: 'support_ticket_reads', filter: `user_id=eq.${user.id}` }, () => refresh())`
  - L53: `filter` → `.on('postgres_changes', { event: '*', schema: 'public', table: 'support_ticket_reads', filter: `user_id=eq.${user.id}` }, () => refresh())`

### `src/lib/user-intelligence.ts`
- Summary: `filter`×22
  - L143: `filter` → `const buyers = rows.filter((r) => r.orders_count > 0);`
  - L316: `filter` → `online: rows.filter((r) => r.onlineStatus === "online").length,`
  - L317: `filter` → `recent: rows.filter((r) => r.onlineStatus === "recent").length,`
  - L318: `filter` → `active7d: rows.filter(active7).length,`
  - L319: `filter` → `inactive30d: rows.filter((r) => r.lastActivityMs == null || r.lastActivityMs > 30 * DAY).length,`
  - L320: `filter` → `customers: rows.filter((r) => r.ordersCount > 0).length,`
  - L321: `filter` → `leads: rows.filter((r) => r.ordersCount === 0 && !r.isStaff).length,`
  - L322: `filter` → `staff: rows.filter((r) => r.isStaff).length,`
  - L323: `filter` → `admins: rows.filter((r) => r.roles.includes("admin") || r.roles.includes("super_admin")).length,`
  - L324: `filter` → `managers: rows.filter((r) => r.roles.includes("manager")).length,`
  - L325: `filter` → `support: rows.filter((r) => r.roles.includes("support")).length,`
  - L326: `filter` → `vip: rows.filter((r) => r.segment === "VIP Customer").length,`
  - L327: `filter` → `highValue: rows.filter((r) => r.segment === "High Value").length,`
  - L328: `filter` → `atRisk: rows.filter((r) => r.tags.includes("At Risk")).length,`
  - L329: `filter` → `newCustomers: rows.filter((r) => r.segment === "New Customer").length,`
  - L330: `filter` → `returning: rows.filter((r) => r.ordersCount >= 2).length,`
  - L332: `filter` → `revenueVip: rows.filter((r) => r.segment === "VIP Customer").reduce((s, r) => s + r.revenue, 0),`
  - L333: `filter` → `revenueHigh: rows.filter((r) => r.segment === "High Value").reduce((s, r) => s + r.revenue, 0),`
  - L334: `filter` → `revenueOther: rows.filter((r) => r.segment !== "VIP Customer" && r.segment !== "High Value").reduce((s, r) => s + r.revenue, 0),`
  - L343: `filter` → `const users = rows.filter((r) => {`
  - … 2 more matching lines omitted for brevity

### `src/lib/visitor.ts`
- Summary: `filter`×1, `rotate`×1
  - L37: `rotate` → `* Session id that survives refresh/navigation but rotates after 30 min of`
  - L144: `filter` → `const seg = path.split("?")[0].split("/").filter(Boolean);`

### `src/lib/wishlist-alerts.tsx`
- Summary: `filter`×7
  - L104: `filter` → `{ event: "*", schema: "public", table: "wishlist_price_alerts", filter: `user_id=eq.${user.id}` },`
  - L109: `filter` → `{ event: "*", schema: "public", table: "wishlist_restock_alerts", filter: `user_id=eq.${user.id}` },`
  - L206: `filter` → `(slug: string) => priceAlerts.filter((a) => a.product_slug === slug && a.status !== "cancelled"),`
  - L280: `filter` → `const active = priceAlerts.filter((a) => a.status === "active").length;`
  - L281: `filter` → `const triggered = priceAlerts.filter((a) => a.status === "triggered").length;`
  - L283: `filter` → `priceAlerts.filter((a) => a.status !== "cancelled").map((a) => a.product_slug),`
  - L285: `filter` → `const restock = restockAlerts.filter((a) => a.status === "active").length;`

### `src/routes/__root.tsx`
- Summary: `mask`×1, `scale`×1, `shadow-`×1, `transform`×2, `will-change`×1
  - L73: `transform` → `body.innerHTML = '<div id="fom-startup-fallback" style="min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:1.5rem;background:#0a0a0a;color:#f5f5f5;fon`
  - L196: `scale` → `"width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover",`
  - L275: `mask` → `{ rel: "mask-icon", href: "/favicon-64.png", color: "#f59e0b" },`
  - L285: `transform` → `// transform/will-change layers during hydration.`
  - L285: `will-change` → `// transform/will-change layers during hydration.`
  - L441: `shadow-` → `<div className="mx-auto mb-5 size-16 overflow-hidden rounded-2xl bg-card shadow-lg ring-1 ring-border">`

### `src/routes/account.tsx`
- Summary: `animate-`×12, `animation`×1, `blur`×18, `contain`×2, `filter`×15, `mask`×2, `opacity`×29, `rotate`×2, `scale`×17, `shadow-`×19, `transform`×4, `translate`×6
  - L66: `opacity` → `initial: { opacity: 0, y: 14 },`
  - L67: `opacity` → `animate: { opacity: 1, y: 0 },`
  - L168: `filter` → `{ event: "*", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` },`
  - L173: `filter` → `{ event: "*", schema: "public", table: "returns", filter: `user_id=eq.${user.id}` },`
  - L201: `filter` → `const successful = list.filter(`
  - L205: `filter` → `const active = successful.filter(`
  - L229: `filter` → `return { latest: list.find((r) => !isCompleted(r)) ?? null, activeCount: list.filter((r) => !isCompleted(r)).length };`
  - L289: `filter` → `() => products.filter((p) => wishSlugs.has(p.slug)).slice(0, 8),`
  - L294: `filter` → `.filter((p) => !wishSlugs.has(p.slug))`
  - L339: `translate` → `<div className="absolute top-[-22%] left-1/2 -translate-x-1/2 w-[120%] h-[60vh] opacity-50 animate-glow" style={{ background: "var(--gradient-ember-soft)", filter: "blur(120px)" }}`
  - L339: `filter` → `<div className="absolute top-[-22%] left-1/2 -translate-x-1/2 w-[120%] h-[60vh] opacity-50 animate-glow" style={{ background: "var(--gradient-ember-soft)", filter: "blur(120px)" }}`
  - L339: `opacity` → `<div className="absolute top-[-22%] left-1/2 -translate-x-1/2 w-[120%] h-[60vh] opacity-50 animate-glow" style={{ background: "var(--gradient-ember-soft)", filter: "blur(120px)" }}`
  - L339: `blur` → `<div className="absolute top-[-22%] left-1/2 -translate-x-1/2 w-[120%] h-[60vh] opacity-50 animate-glow" style={{ background: "var(--gradient-ember-soft)", filter: "blur(120px)" }}`
  - L339: `animate-` → `<div className="absolute top-[-22%] left-1/2 -translate-x-1/2 w-[120%] h-[60vh] opacity-50 animate-glow" style={{ background: "var(--gradient-ember-soft)", filter: "blur(120px)" }}`
  - L341: `filter` → `<div className="absolute top-[30%] -right-[10%] size-[460px] rounded-full opacity-40 animate-orb" style={{ background: "var(--gradient-ember)", filter: "blur(110px)" }} />`
  - L341: `opacity` → `<div className="absolute top-[30%] -right-[10%] size-[460px] rounded-full opacity-40 animate-orb" style={{ background: "var(--gradient-ember)", filter: "blur(110px)" }} />`
  - L341: `blur` → `<div className="absolute top-[30%] -right-[10%] size-[460px] rounded-full opacity-40 animate-orb" style={{ background: "var(--gradient-ember)", filter: "blur(110px)" }} />`
  - L341: `animate-` → `<div className="absolute top-[30%] -right-[10%] size-[460px] rounded-full opacity-40 animate-orb" style={{ background: "var(--gradient-ember)", filter: "blur(110px)" }} />`
  - L343: `filter` → `<div className="absolute bottom-[-10%] -left-[8%] size-[420px] rounded-full opacity-35 animate-orb" style={{ background: "var(--gradient-violet)", filter: "blur(120px)", animationD`
  - L343: `opacity` → `<div className="absolute bottom-[-10%] -left-[8%] size-[420px] rounded-full opacity-35 animate-orb" style={{ background: "var(--gradient-violet)", filter: "blur(120px)", animationD`
  - … 107 more matching lines omitted for brevity

### `src/routes/account_.addresses.tsx`
- Summary: `animate-`×2, `blur`×2, `contain`×1, `filter`×16, `opacity`×11, `scale`×4, `shadow-`×6, `translate`×1
  - L42: `filter` → `.filter(Boolean)`
  - L55: `filter` → `const [filter, setFilter] = useState<Filter>("all");`
  - L73: `filter` → `const filtered = useMemo(() => {`
  - L74: `filter` → `let list = addresses.filter((a) => {`
  - L75: `filter` → `if (filter === "home" || filter === "work" || filter === "other") return a.address_type === filter;`
  - L76: `filter` → `if (filter === "default") return a.is_default_shipping || a.is_default_billing;`
  - L77: `filter` → `if (filter === "recent") return !!a.last_used_at;`
  - L82: `filter` → `list = list.filter((a) =>`
  - L88: `filter` → `if (filter === "recent") {`
  - L94: `filter` → `}, [addresses, filter, q]);`
  - L99: `animate-` → `<Loader2 className="size-5 animate-spin text-muted-foreground" />`
  - L134: `contain` → `<div className="container-page py-8 sm:py-14 max-w-5xl pb-28">`
  - L136: `opacity` → `<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>`
  - L153: `opacity` → `initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}`
  - L170: `translate` → `<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />`
  - L180: `shadow-` → `className="inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground font-bold px-5 py-3 rounded-2xl text-[11px] uppercase tracking-widest hover:brightness-110`
  - L195: `filter` → `filter === f`
  - L205: `opacity` → `{f} <span className="opacity-60">({counts[f]})</span>`
  - L213: `filter` → `{filtered.length} result{filtered.length === 1 ? "" : "s"}`
  - L221: `opacity` → `initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}`
  - … 23 more matching lines omitted for brevity

### `src/routes/account_.history.tsx`
- Summary: `animate-`×3, `blur`×4, `contain`×1, `filter`×16, `opacity`×11, `scale`×1, `shadow-`×5, `translate`×1
  - L42: `filter` → `return Array.isArray(arr) ? arr.filter((x) => x && typeof x.q === "string") : [];`
  - L85: `filter` → `const [filter, setFilter] = useState<FilterKey>("all");`
  - L110: `filter` → `() => recentSlugs.map((s) => productMap.get(s)).filter(Boolean).slice(0, 12),`
  - L114: `filter` → `() => Array.from(wishSlugs).map((s) => productMap.get(s)).filter(Boolean).slice(0, 8),`
  - L199: `filter` → `const filtered = filter === "all" ? timeline : timeline.filter((t) => t.kind === filter);`
  - L222: `animate-` → `<Loader2 className="size-5 animate-spin text-muted-foreground" />`
  - L230: `opacity` → `<div aria-hidden className="pointer-events-none absolute inset-x-0 -top-20 h-[420px] -z-10 blur-3xl opacity-60" style={{ background: "var(--gradient-ember-soft)" }} />`
  - L230: `blur` → `<div aria-hidden className="pointer-events-none absolute inset-x-0 -top-20 h-[420px] -z-10 blur-3xl opacity-60" style={{ background: "var(--gradient-ember-soft)" }} />`
  - L232: `contain` → `<div className="container-page max-w-5xl py-8 sm:py-12">`
  - L234: `opacity` → `<motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>`
  - L259: `opacity` → `initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}`
  - L264: `filter` → `<div aria-hidden className="absolute -inset-px rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: "var(--gradient-ember-soft)`
  - L264: `opacity` → `<div aria-hidden className="absolute -inset-px rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: "var(--gradient-ember-soft)`
  - L264: `blur` → `<div aria-hidden className="absolute -inset-px rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: "var(--gradient-ember-soft)`
  - L283: `filter` → `const active = filter === f.key;`
  - L290: `shadow-` → `? "bg-accent text-accent-foreground shadow-[0_0_24px_-4px_var(--color-accent)]"`
  - L308: `filter` → `<span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{filtered.length} events</span>`
  - L313: `animate-` → `{[1, 2, 3, 4].map((i) => <div key={i} className="h-20 rounded-2xl bg-card/50 border border-border animate-pulse" />)}`
  - L315: `filter` → `) : filtered.length === 0 ? (`
  - L316: `filter` → `<EmptyState filter={filter} />`
  - … 22 more matching lines omitted for brevity

### `src/routes/account_.notifications.tsx`
- Summary: `animate-`×3, `blur`×4, `contain`×1, `filter`×9, `opacity`×8, `scale`×2, `shadow-`×2, `translate`×2
  - L21: `filter` → `const [filter, setFilter] = useState<Filter>("all");`
  - L33: `filter` → `const filtered = useMemo(() => {`
  - L35: `filter` → `return items.filter((n) => {`
  - L36: `filter` → `if (filter !== "all" && categoryOf(n) !== filter) return false;`
  - L40: `filter` → `}, [items, filter, query]);`
  - L45: `filter` → `await Promise.all(items.filter((n) => n.read_at).map((n) => remove(n.id)));`
  - L49: `contain` → `<div className="container-page py-10 sm:py-16 max-w-3xl">`
  - L51: `opacity` → `initial={{ opacity: 0, y: 12 }}`
  - L52: `opacity` → `animate={{ opacity: 1, y: 0 }}`
  - L83: `translate` → `<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />`
  - L91: `translate` → `<button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">`
  - L100: `filter` → `const active = filter === t;`
  - L110: `shadow-` → `? "border-accent/50 bg-accent/10 text-accent shadow-[0_0_12px_-4px_oklch(0.74_0.19_49_/_0.6)]"`
  - L143: `animate-` → `<li key={i} className="h-20 rounded-2xl border border-border bg-card animate-pulse" />`
  - L146: `filter` → `) : filtered.length === 0 ? (`
  - L148: `scale` → `initial={{ opacity: 0, scale: 0.98 }}`
  - L148: `opacity` → `initial={{ opacity: 0, scale: 0.98 }}`
  - L149: `scale` → `animate={{ opacity: 1, scale: 1 }}`
  - L149: `opacity` → `animate={{ opacity: 1, scale: 1 }}`
  - L153: `blur` → `<span className="absolute inset-0 rounded-full bg-accent/15 blur-xl animate-glow" />`
  - … 11 more matching lines omitted for brevity

### `src/routes/account_.orders.tsx`
- Summary: `animate-`×3, `blur`×9, `contain`×3, `filter`×31, `opacity`×6, `rotate`×4, `scale`×19, `transform`×5, `translate`×4
  - L224: `blur` → `<div className="size-14 rounded-xl border border-border/60 bg-background/80 backdrop-blur grid place-items-center ring-2 ring-card">`
  - L241: `filter` → `const [filter, setFilter] = useState<FilterId>("all");`
  - L324: `filter` → `.on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` }, refresh)`
  - L325: `filter` → `.on("postgres_changes", { event: "*", schema: "public", table: "payments", filter: `user_id=eq.${user.id}` }, refresh)`
  - L326: `filter` → `.on("postgres_changes", { event: "*", schema: "public", table: "returns", filter: `user_id=eq.${user.id}` }, refresh)`
  - L334: `filter` → `const successful = useMemo(() => (orders ?? []).filter((o) => !o.failed), [orders]);`
  - L335: `filter` → `const failedOrders = useMemo(() => (orders ?? []).filter((o) => o.failed), [orders]);`
  - L340: `filter` → `const paid = (orders ?? []).filter((o) => o.succeeded);`
  - L342: `filter` → `const delivered = paid.filter((o) => displayStatus(o).key === "delivered").length;`
  - L343: `filter` → `const refunded = paid.filter((o) => displayStatus(o).key === "refunded").length;`
  - L344: `filter` → `const inTransit = paid.filter((o) => { const k = displayStatus(o).key; return k === "shipped" || k === "ofd"; }).length;`
  - L345: `filter` → `const returnsInProgress = paid.filter((o) => hasActiveReturn(o)).length;`
  - L349: `filter` → `// Per-filter counts`
  - L361: `filter` → `const filtered = useMemo(() => {`
  - L362: `filter` → `let list = filter === "failed" ? failedOrders : successful.filter((o) => classify(o, filter));`
  - L365: `filter` → `list = list.filter((o) =>`
  - L372: `filter` → `}, [successful, failedOrders, filter, q]);`
  - L376: `filter` → `if (filter !== "all" || q) return null;`
  - L377: `filter` → `const active = filtered.filter((o) => ACTIVE_KEYS.includes(displayStatus(o).key));`
  - L378: `filter` → `const rest = filtered.filter((o) => !ACTIVE_KEYS.includes(displayStatus(o).key));`
  - … 64 more matching lines omitted for brevity

### `src/routes/account_.payment-methods.add.tsx`
- Summary: `animate-`×3, `blur`×2, `contain`×1, `opacity`×9, `scale`×1, `shadow-`×2
  - L131: `animate-` → `<Loader2 className="size-5 animate-spin text-muted-foreground" />`
  - L139: `contain` → `<div className="container-page py-8 sm:py-14 max-w-3xl pb-[calc(7rem+env(safe-area-inset-bottom))]">`
  - L149: `opacity` → `initial={{ opacity: 0, y: 12 }}`
  - L150: `opacity` → `animate={{ opacity: 1, y: 0 }}`
  - L180: `opacity` → `className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition disabled:opacity-60 ${`
  - L182: `shadow-` → `? "border-primary/50 bg-primary/10 shadow-[0_8px_40px_-12px_rgba(255,122,26,0.4)]"`
  - L187: `blur` → `<span className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full bg-primary/25 blur-2xl" />`
  - L210: `opacity` → `className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4 opacity-50"`
  - L228: `blur` → `<span className="pointer-events-none absolute -left-10 -top-10 size-40 rounded-full bg-emerald-500/15 blur-3xl" />`
  - L258: `scale` → `className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-[#ff9a4a] px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_10px_30px_-8px`
  - L258: `opacity` → `className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-[#ff9a4a] px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_10px_30px_-8px`
  - L258: `shadow-` → `className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-[#ff9a4a] px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_10px_30px_-8px`
  - L262: `opacity` → `<motion.span key="idle" className="inline-flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>`
  - L267: `opacity` → `<motion.span key="p" className="inline-flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>`
  - L268: `animate-` → `<Loader2 className="size-4 animate-spin" /> Opening secure checkout…`
  - L272: `opacity` → `<motion.span key="v" className="inline-flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>`
  - L273: `animate-` → `<Loader2 className="size-4 animate-spin" /> Verifying…`
  - L277: `opacity` → `<motion.span key="d" className="inline-flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>`

### `src/routes/account_.payments.tsx`
- Summary: `animate-`×4, `blur`×3, `contain`×1, `filter`×7, `opacity`×10, `scale`×5, `shadow-`×3, `translate`×1
  - L58: `opacity` → `initial={{ opacity: 0, y: 14 }}`
  - L59: `opacity` → `animate={{ opacity: 1, y: 0 }}`
  - L60: `scale` → `exit={{ opacity: 0, scale: 0.96 }}`
  - L60: `opacity` → `exit={{ opacity: 0, scale: 0.96 }}`
  - L69: `shadow-` → `)} p-5 backdrop-blur-xl shadow-[0_8px_40px_-12px_rgba(255,122,26,0.25)]`}`
  - L69: `blur` → `)} p-5 backdrop-blur-xl shadow-[0_8px_40px_-12px_rgba(255,122,26,0.25)]`}`
  - L71: `blur` → `<div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-primary/20 blur-3xl" />`
  - L122: `opacity` → `className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-medium text-foreground/80 transition hover:bg-white/10 disabled:opacity-50"`
  - L131: `opacity` → `className="rounded-lg border border-destructive/30 bg-destructive/10 p-1.5 text-destructive transition hover:bg-destructive/20 disabled:opacity-50"`
  - L175: `filter` → `card: methods.filter((m) => m.payment_type === "card").length,`
  - L176: `filter` → `upi: methods.filter((m) => m.payment_type === "upi").length,`
  - L177: `filter` → `wallet: methods.filter((m) => m.payment_type === "wallet").length,`
  - L181: `filter` → `const filtered = useMemo(`
  - L182: `filter` → `() => (tab === "all" ? methods : methods.filter((m) => m.payment_type === tab)),`
  - L207: `animate-` → `<Loader2 className="size-5 animate-spin text-muted-foreground" />`
  - L213: `contain` → `<div className="container-page py-10 sm:py-16 max-w-4xl pb-[calc(7rem+env(safe-area-inset-bottom))]">`
  - L214: `opacity` → `<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>`
  - L232: `opacity` → `className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-foreground/90 transition hover:bg-white/10 disabled:opacit`
  - L234: `animate-` → `<RefreshCw className={`size-4 ${syncing ? "animate-spin" : ""}`} />`
  - L271: `opacity` → `{t.label} <span className="opacity-60">({counts[t.key]})</span>`
  - … 14 more matching lines omitted for brevity

### `src/routes/account_.preferences.tsx`
- Summary: `animate-`×1, `contain`×1, `opacity`×2, `transform`×1, `translate`×1
  - L69: `transform` → `<span className={`absolute top-0.5 size-5 rounded-full bg-background shadow transition-transform ${on ? "translate-x-[22px]" : "translate-x-0.5"}`} />`
  - L69: `translate` → `<span className={`absolute top-0.5 size-5 rounded-full bg-background shadow transition-transform ${on ? "translate-x-[22px]" : "translate-x-0.5"}`} />`
  - L109: `contain` → `<div className="container-page py-10 sm:py-16 max-w-2xl">`
  - L110: `opacity` → `<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">`
  - L164: `opacity` → `<button onClick={save} disabled={saving} className="cta-primary disabled:opacity-50">`
  - L165: `animate-` → `{saving ? <Loader2 className="size-3.5 animate-spin" /> : <SettingsIcon className="size-3.5" />}`

### `src/routes/account_.profile.tsx`
- Summary: `animate-`×8, `animation`×1, `blur`×2, `contain`×1, `filter`×5, `opacity`×14, `scale`×5, `shadow-`×5, `translate`×8
  - L305: `animate-` → `<Loader2 className="size-5 animate-spin text-accent" />`
  - L316: `animate-` → `<div className="orb animate-orb" style={{ width: 340, height: 340, top: -80, left: -60, background: "var(--gradient-ember)" }} />`
  - L317: `animate-` → `<div className="orb animate-orb" style={{ width: 300, height: 300, bottom: 40, right: -80, background: "var(--gradient-violet)", animationDelay: "-8s" }} />`
  - L317: `animation` → `<div className="orb animate-orb" style={{ width: 300, height: 300, bottom: 40, right: -80, background: "var(--gradient-violet)", animationDelay: "-8s" }} />`
  - L318: `filter` → `<div className="absolute inset-0 opacity-[0.04] mix-blend-overlay" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height=`
  - L318: `opacity` → `<div className="absolute inset-0 opacity-[0.04] mix-blend-overlay" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height=`
  - L322: `opacity` → `<motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>`
  - L333: `opacity` → `initial={{ opacity: 0, y: 20 }}`
  - L334: `opacity` → `animate={{ opacity: 1, y: 0 }}`
  - L338: `opacity` → `<div aria-hidden className="absolute -top-16 left-8 size-40 rounded-full blur-3xl opacity-50" style={{ background: "var(--gradient-ember-soft)" }} />`
  - L338: `blur` → `<div aria-hidden className="absolute -top-16 left-8 size-40 rounded-full blur-3xl opacity-50" style={{ background: "var(--gradient-ember-soft)" }} />`
  - L342: `opacity` → `<div aria-hidden className="absolute inset-0 -m-2 rounded-full blur-xl opacity-60 animate-glow" style={{ background: "var(--gradient-ember)" }} />`
  - L342: `blur` → `<div aria-hidden className="absolute inset-0 -m-2 rounded-full blur-xl opacity-60 animate-glow" style={{ background: "var(--gradient-ember)" }} />`
  - L342: `animate-` → `<div aria-hidden className="absolute inset-0 -m-2 rounded-full blur-xl opacity-60 animate-glow" style={{ background: "var(--gradient-ember)" }} />`
  - L343: `shadow-` → `<div className="relative size-20 sm:size-24 rounded-full overflow-hidden border border-white/15 grid place-items-center bg-card shadow-[var(--shadow-ember)]">`
  - L351: `animate-` → `<Loader2 className="size-5 animate-spin text-accent" />`
  - L355: `shadow-` → `<span className="absolute bottom-1 right-1 size-3.5 rounded-full bg-emerald-500 border-2 border-card shadow-[0_0_10px_oklch(0.7_0.18_150)]" />`
  - L360: `shadow-` → `<span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_oklch(0.7_0.18_150)] animate-pulse" /> Online`
  - L360: `animate-` → `<span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_oklch(0.7_0.18_150)] animate-pulse" /> Online`
  - L374: `scale` → `className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest border border-accent/30 bg-accent/5 rounded-full px-3.5 py-2 min-h-[44px] hover:border-a`
  - … 29 more matching lines omitted for brevity

### `src/routes/account_.returns.tsx`
- Summary: `animate-`×3, `blur`×16, `filter`×12, `opacity`×34, `scale`×13, `shadow-`×5, `translate`×1
  - L330: `scale` → `animate={{ scale: [1, 1.35, 1], opacity: [1, 0.6, 1] }}`
  - L330: `opacity` → `animate={{ scale: [1, 1.35, 1], opacity: [1, 0.6, 1] }}`
  - L373: `filter` → `const [filter, setFilter] = useState<FilterKey>("all");`
  - L407: `blur` → `window.addEventListener("blur", onHide, { once: true });`
  - L415: `blur` → `window.removeEventListener("blur", onHide);`
  - L447: `filter` → `returns.flatMap((r) => (r.return_items ?? []).map((it) => it.product_slug)).filter(Boolean),`
  - L475: `filter` → `const filtered = useMemo(`
  - L476: `filter` → `() => enriched.filter(({ view }) => view.matches(filter)),`
  - L477: `filter` → `[enriched, filter],`
  - L511: `filter` → `const items = Object.entries(qty).filter(([, q]) => q > 0);`
  - L541: `animate-` → `<Loader2 className="size-5 animate-spin text-[#FF7A00]" />`
  - L565: `opacity` → `<div className="absolute -top-40 -left-32 size-[420px] rounded-full blur-3xl opacity-[0.18]"`
  - L565: `blur` → `<div className="absolute -top-40 -left-32 size-[420px] rounded-full blur-3xl opacity-[0.18]"`
  - L567: `opacity` → `<div className="absolute top-1/3 -right-32 size-[360px] rounded-full blur-3xl opacity-[0.12]"`
  - L567: `blur` → `<div className="absolute top-1/3 -right-32 size-[360px] rounded-full blur-3xl opacity-[0.12]"`
  - L574: `blur` → `"sticky top-0 z-30 transition-all duration-300 backdrop-blur-xl",`
  - L576: `shadow-` → `? "bg-[#050816]/80 border-b border-white/[0.06] shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)]"`
  - L599: `opacity` → `initial={{ opacity: 0, y: 14 }}`
  - L600: `opacity` → `animate={{ opacity: 1, y: 0 }}`
  - L617: `opacity` → `initial={{ opacity: 0, y: 12 }}`
  - … 64 more matching lines omitted for brevity

### `src/routes/account_.security.tsx`
- Summary: `animate-`×7, `animation`×1, `contain`×1, `mask`×1, `opacity`×16, `rotate`×1, `scale`×6, `shadow-`×3, `transform`×1, `translate`×3
  - L106: `animate-` → `<div className="orb animate-orb" style={{ width: 340, height: 340, top: -80, right: -60, background: "var(--gradient-ember)" }} />`
  - L107: `animate-` → `<div className="orb animate-orb" style={{ width: 300, height: 300, bottom: 40, left: -80, background: "var(--gradient-violet)", animationDelay: "-8s" }} />`
  - L107: `animation` → `<div className="orb animate-orb" style={{ width: 300, height: 300, bottom: 40, left: -80, background: "var(--gradient-violet)", animationDelay: "-8s" }} />`
  - L108: `opacity` → `<div className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage: "linear-gradient(oklch(1 0 0 / 0.5) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 0.5) 1px`
  - L108: `mask` → `<div className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage: "linear-gradient(oklch(1 0 0 / 0.5) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 0.5) 1px`
  - L111: `contain` → `<div className="container-page py-10 sm:py-16 max-w-2xl relative">`
  - L112: `opacity` → `<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">`
  - L123: `opacity` → `initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.05 }}`
  - L128: `rotate` → `<svg viewBox="0 0 100 100" className="size-20 -rotate-90">`
  - L138: `animate-` → `<ShieldCheck className="absolute size-7 text-accent animate-glow" />`
  - L154: `opacity` → `<motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}`
  - L167: `opacity` → `initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}`
  - L180: `opacity` → `<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">`
  - L195: `scale` → `<motion.span animate={{ scale: ok ? [1, 1.3, 1] : 1 }} className={`grid place-items-center size-4 rounded-full ${ok ? "bg-accent/20 text-accent" : "bg-white/5 text-muted-foreground`
  - L210: `opacity` → `<motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`flex items-center gap-1.5 text-xs ${match ? "text-emerald-400" : "text-de`
  - L221: `transform` → `className="cta-sweep relative inline-flex items-center justify-center gap-2 w-full rounded-full px-5 py-3 text-sm font-semibold overflow-hidden disabled:opacity-70 transition-trans`
  - L221: `scale` → `className="cta-sweep relative inline-flex items-center justify-center gap-2 w-full rounded-full px-5 py-3 text-sm font-semibold overflow-hidden disabled:opacity-70 transition-trans`
  - L221: `opacity` → `className="cta-sweep relative inline-flex items-center justify-center gap-2 w-full rounded-full px-5 py-3 text-sm font-semibold overflow-hidden disabled:opacity-70 transition-trans`
  - L222: `shadow-` → `style={{ background: "linear-gradient(120deg, oklch(0.78 0.18 60), oklch(0.74 0.19 49))", color: "var(--color-accent-foreground)", boxShadow: "var(--shadow-ember)" }}`
  - L226: `scale` → `<motion.span key="ok" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="inline-flex items-center gap-2">`
  - … 20 more matching lines omitted for brevity

### `src/routes/account_.support.tsx`
- Summary: `animate-`×6, `blur`×3, `contain`×2, `filter`×15, `opacity`×6, `translate`×2
  - L145: `filter` → `const [filter, setFilter] = useState<FilterId>("all");`
  - L200: `filter` → `.on("postgres_changes", { event: "*", schema: "public", table: "support_tickets", filter: `user_id=eq.${user.id}` }, () => loadTickets())`
  - L208: `filter` → `return tickets.filter((t) => {`
  - L209: `filter` → `if (filter === "unread") { if (!(t.unread_customer_count && t.unread_customer_count > 0)) return false; }`
  - L210: `filter` → `else if (filter === "high") { if (!["high", "urgent"].includes(t.priority.toLowerCase())) return false; }`
  - L211: `filter` → `else if (filter !== "all") { if (t.status.toLowerCase() !== filter) return false; }`
  - L218: `filter` → `}, [tickets, filter, query]);`
  - L221: `animate-` → `return <div className="min-h-[60vh] grid place-items-center"><Loader2 className="size-5 animate-spin text-accent" /></div>;`
  - L227: `translate` → `<div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[120%] h-[55vh] opacity-40 animate-glow" style={{ background: "var(--gradient-ember-soft)", filter: "blur(120px)" }} />`
  - L227: `filter` → `<div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[120%] h-[55vh] opacity-40 animate-glow" style={{ background: "var(--gradient-ember-soft)", filter: "blur(120px)" }} />`
  - L227: `opacity` → `<div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[120%] h-[55vh] opacity-40 animate-glow" style={{ background: "var(--gradient-ember-soft)", filter: "blur(120px)" }} />`
  - L227: `blur` → `<div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[120%] h-[55vh] opacity-40 animate-glow" style={{ background: "var(--gradient-ember-soft)", filter: "blur(120px)" }} />`
  - L227: `animate-` → `<div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[120%] h-[55vh] opacity-40 animate-glow" style={{ background: "var(--gradient-ember-soft)", filter: "blur(120px)" }} />`
  - L230: `blur` → `<header className="sticky top-0 z-30 backdrop-blur-xl bg-background/70 border-b border-white/[0.06]" style={{ paddingTop: "max(0.25rem, env(safe-area-inset-top))" }}>`
  - L231: `contain` → `<div className="container-page h-12 flex items-center gap-3">`
  - L240: `contain` → `<div className="container-page py-6 max-w-3xl">`
  - L241: `opacity` → `<motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="mb-6">`
  - L266: `translate` → `<Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />`
  - L283: `filter` → `filter === f.id ? "bg-accent/15 text-accent ring-accent/40" : "bg-white/[0.03] text-muted-foreground ring-white/10 hover:ring-accent/30",`
  - L297: `animate-` → `<Loader2 className="size-4 animate-spin text-muted-foreground" />`
  - … 14 more matching lines omitted for brevity

### `src/routes/account_.support_.new.tsx`
- Summary: `animate-`×2, `blur`×3, `contain`×3, `filter`×1, `opacity`×3, `translate`×1
  - L154: `animate-` → `return <div className="min-h-[100dvh] grid place-items-center"><Loader2 className="size-5 animate-spin text-accent" /></div>;`
  - L162: `translate` → `<div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[120%] h-[55vh] opacity-40" style={{ background: "var(--gradient-ember-soft)", filter: "blur(120px)" }} />`
  - L162: `filter` → `<div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[120%] h-[55vh] opacity-40" style={{ background: "var(--gradient-ember-soft)", filter: "blur(120px)" }} />`
  - L162: `opacity` → `<div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[120%] h-[55vh] opacity-40" style={{ background: "var(--gradient-ember-soft)", filter: "blur(120px)" }} />`
  - L162: `blur` → `<div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[120%] h-[55vh] opacity-40" style={{ background: "var(--gradient-ember-soft)", filter: "blur(120px)" }} />`
  - L166: `blur` → `<header className="sticky top-0 z-30 shrink-0 backdrop-blur-xl bg-background/70 border-b border-white/[0.06]" style={{ paddingTop: "max(0.25rem, env(safe-area-inset-top))" }}>`
  - L167: `contain` → `<div className="container-page h-14 flex items-center gap-3">`
  - L181: `opacity` → `initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}`
  - L182: `contain` → `className="container-page max-w-2xl py-6 space-y-4"`
  - L241: `blur` → `className="shrink-0 border-t border-white/[0.06] backdrop-blur-xl bg-background/80"`
  - L244: `contain` → `<div className="container-page max-w-2xl py-3">`
  - L246: `opacity` → `className="w-full bg-accent text-accent-foreground rounded-full px-6 py-3 text-xs uppercase tracking-widest font-bold disabled:opacity-50 hover:brightness-110 transition-all flex i`
  - L247: `animate-` → `{saving ? <><Loader2 className="size-4 animate-spin" /> Creating…</> : <><Send className="size-4" /> Submit ticket</>}`

### `src/routes/account_.support_.ticket.$ticketId.tsx`
- Summary: `animate-`×4, `blur`×4, `contain`×1, `filter`×5, `opacity`×5, `scale`×2, `shadow-`×2, `translate`×1
  - L134: `filter` → `.on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `ticket_id=eq.${ticketId}` }, () => load())`
  - L135: `filter` → `.on("postgres_changes", { event: "UPDATE", schema: "public", table: "support_messages", filter: `ticket_id=eq.${ticketId}` }, () => load())`
  - L136: `filter` → `.on("postgres_changes", { event: "UPDATE", schema: "public", table: "support_tickets", filter: `id=eq.${ticketId}` }, () => load())`
  - L219: `animate-` → `return <div className="min-h-dvh grid place-items-center bg-background"><Loader2 className="size-5 animate-spin text-accent" /></div>;`
  - L252: `translate` → `<div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[120%] h-[40vh] opacity-30 animate-glow" style={{ background: "var(--gradient-ember-soft)", filter: "blur(120px)" }} />`
  - L252: `filter` → `<div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[120%] h-[40vh] opacity-30 animate-glow" style={{ background: "var(--gradient-ember-soft)", filter: "blur(120px)" }} />`
  - L252: `opacity` → `<div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[120%] h-[40vh] opacity-30 animate-glow" style={{ background: "var(--gradient-ember-soft)", filter: "blur(120px)" }} />`
  - L252: `blur` → `<div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[120%] h-[40vh] opacity-30 animate-glow" style={{ background: "var(--gradient-ember-soft)", filter: "blur(120px)" }} />`
  - L252: `animate-` → `<div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[120%] h-[40vh] opacity-30 animate-glow" style={{ background: "var(--gradient-ember-soft)", filter: "blur(120px)" }} />`
  - L256: `blur` → `<header className="shrink-0 backdrop-blur-xl bg-background/80 border-b border-white/[0.06]" style={{ paddingTop: "env(safe-area-inset-top)" }}>`
  - L283: `scale` → `initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }}`
  - L283: `opacity` → `initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }}`
  - L285: `shadow-` → `className="absolute right-0 top-11 z-20 w-56 rounded-2xl glass-strong p-1.5 shadow-2xl"`
  - L319: `animate-` → `<div className="grid place-items-center py-16"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>`
  - L322: `contain` → `<img src={supportEmpty} alt="" width={160} height={160} loading="lazy" className="size-40 object-contain opacity-90 mb-4" />`
  - L322: `opacity` → `<img src={supportEmpty} alt="" width={160} height={160} loading="lazy" className="size-40 object-contain opacity-90 mb-4" />`
  - L344: `shadow-` → `? "bg-gradient-to-br from-accent to-[color-mix(in_oklab,var(--accent)_78%,black)] text-accent-foreground rounded-br-md shadow-[0_8px_24px_-12px_color-mix(in_oklab,var(--accent)_60%`
  - L390: `blur` → `<div className="shrink-0 border-t border-white/[0.06] backdrop-blur-xl bg-background/80 px-3 pt-2.5" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>`
  - L411: `scale` → `<button onClick={send} disabled={sending || (!reply.trim() && files.length === 0)} aria-label="Send" className="size-11 shrink-0 grid place-items-center rounded-2xl bg-accent text-`
  - L411: `opacity` → `<button onClick={send} disabled={sending || (!reply.trim() && files.length === 0)} aria-label="Send" className="size-11 shrink-0 grid place-items-center rounded-2xl bg-accent text-`
  - … 4 more matching lines omitted for brevity

### `src/routes/admin-acquisition-intelligence.tsx`
- Summary: `animate-`×2, `opacity`×2
  - L72: `opacity` → `<button onClick={onExport} disabled={!rows.length} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] hover:bg-muted disabled:opacity-5`
  - L155: `animate-` → `<div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>`
  - L184: `animate-` → `<RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh`
  - L259: `opacity` → `<button onClick={() => download(`attribution-${range}-${attrWindow}d.csv`, attributionToCsv(raw.attribution_models))} disabled={!raw.attribution_models.length} className="inline-fl`

### `src/routes/admin-activity.tsx`
- Summary: `animate-`×2
  - L32: `animate-` → `<span className="size-1.5 rounded-full bg-accent animate-pulse" /> Live`
  - L35: `animate-` → `{logs === null ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> :`

### `src/routes/admin-analytics.tsx`
- Summary: `animate-`×4, `animation`×1, `blur`×2, `opacity`×9, `shadow-`×1, `transform`×1, `will-change`×1
  - L44: `animate-` → `<div className="orb animate-mesh" style={{ top: "-12%", left: "-6%", width: "46vw", height: "46vw", background: "var(--gradient-ember-soft)" }} />`
  - L45: `animate-` → `<div className="orb animate-mesh" style={{ bottom: "-16%", right: "-10%", width: "52vw", height: "52vw", background: "var(--gradient-violet)", animationDelay: "-6s" }} />`
  - L45: `animation` → `<div className="orb animate-mesh" style={{ bottom: "-16%", right: "-10%", width: "52vw", height: "52vw", background: "var(--gradient-violet)", animationDelay: "-6s" }} />`
  - L46: `opacity` → `<div className="absolute inset-0 grid-texture opacity-40" />`
  - L67: `opacity` → `initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}`
  - L69: `transform` → `className={`card-premium relative overflow-hidden rounded-2xl p-4 will-change-transform ${accent ? "ring-1 ring-accent/30" : ""}`}`
  - L69: `will-change` → `className={`card-premium relative overflow-hidden rounded-2xl p-4 will-change-transform ${accent ? "ring-1 ring-accent/30" : ""}`}`
  - L85: `shadow-` → `<div className="rounded-xl border border-border/60 bg-background/90 backdrop-blur-md px-3 py-2 text-xs shadow-2xl">`
  - L85: `blur` → `<div className="rounded-xl border border-border/60 bg-background/90 backdrop-blur-md px-3 py-2 text-xs shadow-2xl">`
  - L101: `opacity` → `initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}`
  - L239: `blur` → `<div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 backdrop-blur px-2.5 py-1">`
  - L240: `opacity` → `<span className={`relative flex size-1.5 ${conn === "live" ? "" : "opacity-60"}`}>`
  - L241: `opacity` → `<span className={`absolute inline-flex h-full w-full rounded-full ${conn === "live" ? "bg-emerald-400 animate-ping" : conn === "error" ? "bg-rose-400" : "bg-amber-400"} opacity-60``
  - L241: `animate-` → `<span className={`absolute inline-flex h-full w-full rounded-full ${conn === "live" ? "bg-emerald-400 animate-ping" : conn === "error" ? "bg-rose-400" : "bg-amber-400"} opacity-60``
  - L248: `opacity` → `<button disabled={exporting || !a} onClick={() => doExport("csv", "revenue")} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wides`
  - L249: `opacity` → `<button disabled={exporting || !a} onClick={() => doExport("excel", "revenue")} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wid`
  - L250: `opacity` → `<button disabled={exporting || !a} onClick={() => doExport("pdf", "dashboard")} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wid`
  - L259: `animate-` → `<Loader2 className="size-5 animate-spin text-accent" />`
  - L290: `opacity` → `<motion.div key={ins.text} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}`

### `src/routes/admin-badges-analytics.tsx`
- Summary: `animate-`×1, `animation`×1, `blur`×6, `opacity`×3
  - L95: `blur` → `<div className="flex items-center gap-1 rounded-xl border border-border/60 bg-card/40 p-1 backdrop-blur">`
  - L125: `opacity` → `initial={{ opacity: 0, y: 12 }}`
  - L126: `opacity` → `animate={{ opacity: 1, y: 0 }}`
  - L128: `blur` → `className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/50 p-4 backdrop-blur"`
  - L130: `blur` → `<div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-accent/10 blur-2xl" />`
  - L142: `animate-` → `<Loader2 className="h-6 w-6 animate-spin" />`
  - L147: `blur` → `<div className="rounded-2xl border border-border/60 bg-card/50 p-4 backdrop-blur">`
  - L165: `opacity` → `<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />`
  - L197: `blur` → `<div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card/50 p-4 backdrop-blur">`
  - L219: `animation` → `className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${badgeAnimationClass(s.badge.animation)}`}`
  - L241: `blur` → `<div className="rounded-2xl border border-border/60 bg-card/50 p-4 backdrop-blur">`

### `src/routes/admin-badges-bulk.tsx`
- Summary: `animate-`×3, `filter`×13, `opacity`×1, `translate`×1
  - L57: `filter` → `const filtered = useMemo(() => {`
  - L59: `filter` → `return products.filter(`
  - L66: `filter` → `const usableBadges = types.filter((t) => !t.archived);`
  - L76: `filter` → `const allSel = filtered.length > 0 && filtered.every((p) => selected.has(p.slug));`
  - L77: `filter` → `setSelected(allSel ? new Set() : new Set(filtered.map((p) => p.slug)));`
  - L130: `animate-` → `return <div className="min-h-[40vh] grid place-items-center"><Loader2 className="size-5 animate-spin text-accent" /></div>;`
  - L170: `filter` → `{usableBadges.filter((b) => b.id !== badgeId).map((b) => <option key={b.id} value={b.id}>{b.emoji} {b.label}</option>)}`
  - L190: `filter` → `<span className="text-foreground font-bold">{selected.size}</span> selected · {filtered.length} shown`
  - L195: `opacity` → `className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-5 py-2.5 rounded-full text-xs uppercase tracking-widest font-bold disabled:opacity-50"`
  - L197: `animate-` → `{running ? <Loader2 className="size-3.5 animate-spin" /> : <ChevronRight className="size-3.5" />}`
  - L216: `filter` → `{types.filter((t) => !t.archived).map((b) => (`
  - L222: `animate-` → `<span className={`size-1.5 rounded-full ${b.enabled ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground/60"}`} />`
  - L232: `translate` → `<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />`
  - L249: `filter` → `{filtered.slice(0, 300).map((p) => (`
  - L252: `filter` → `{filtered.length === 0 && (`
  - L255: `filter` → `<p className="text-sm text-muted-foreground">No products match your filters.</p>`
  - L259: `filter` → `{filtered.length > 300 && (`
  - L261: `filter` → `Showing first 300 of {filtered.length}. Refine your search — bulk actions still apply to all <b>selected</b> products.`

### `src/routes/admin-badges.tsx`
- Summary: `animate-`×2, `animation`×1, `blur`×1, `filter`×10, `opacity`×4, `scale`×1, `shadow-`×2
  - L77: `animation` → `<span className={`inline-flex items-center gap-1 px-2 min-h-[24px] leading-none tracking-wider font-mono ${badgeAnimationClass(b.animation)}`} style={{ ...badgePreviewStyle(b), fon`
  - L80: `opacity` → `{b.subtitle && <span className="opacity-75 font-medium">· {b.subtitle}</span>}`
  - L88: `shadow-` → `live: { label: "Active", cls: "text-emerald-300 border-emerald-400/40 bg-emerald-500/15 shadow-[0_0_12px_-2px_rgba(16,185,129,0.6)]", dot: "bg-emerald-400 shadow-[0_0_6px_rgba(16,1`
  - L89: `shadow-` → `scheduled: { label: "Scheduled", cls: "text-sky-300 border-sky-400/40 bg-sky-500/15 shadow-[0_0_12px_-2px_rgba(56,189,248,0.5)]", dot: "bg-sky-400" },`
  - L99: `scale` → `className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono uppercase tracking-widest font-bold transition-all hover:scale-105 active:scale-9`
  - L101: `animate-` → `<span className={`size-1.5 rounded-full ${m.dot} ${state === "live" ? "animate-pulse" : ""}`} />`
  - L143: `filter` → `const live = types.filter((b) => !b.archived);`
  - L144: `filter` → `const active = live.filter((b) => badgeScheduleState(b, now) === "live").length;`
  - L159: `filter` → `const expired = live.filter((b) => badgeScheduleState(b, now) === "expired").length;`
  - L160: `filter` → `const scheduled = live.filter((b) => badgeScheduleState(b, now) === "scheduled").length;`
  - L161: `filter` → `const archived = types.filter((b) => b.archived).length;`
  - L214: `animate-` → `return <div className="min-h-[40vh] grid place-items-center"><Loader2 className="size-5 animate-spin text-accent" /></div>;`
  - L219: `filter` → `.filter(Boolean)`
  - L220: `filter` → `.filter((b) => (showArchived ? (b as BadgeType).archived : !(b as BadgeType).archived))`
  - L221: `filter` → `.filter((b) => categoryFilter === "All" || (b as BadgeType).category === categoryFilter) as BadgeType[];`
  - L243: `opacity` → `initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}`
  - L247: `filter` → `<div className="pointer-events-none absolute -top-6 -right-5 size-16 rounded-full opacity-30" style={{ background: "var(--gradient-ember-soft)", filter: "blur(16px)" }} />`
  - L247: `opacity` → `<div className="pointer-events-none absolute -top-6 -right-5 size-16 rounded-full opacity-30" style={{ background: "var(--gradient-ember-soft)", filter: "blur(16px)" }} />`
  - L247: `blur` → `<div className="pointer-events-none absolute -top-6 -right-5 size-16 rounded-full opacity-30" style={{ background: "var(--gradient-ember-soft)", filter: "blur(16px)" }} />`
  - L269: `filter` → `{/* Category filters + archived toggle */}`
  - … 1 more matching lines omitted for brevity

### `src/routes/admin-bulk-badges.tsx`
- Summary: `animate-`×3, `blur`×1, `filter`×11, `opacity`×2, `shadow-`×1, `translate`×1
  - L77: `filter` → `const filtered = useMemo(() => {`
  - L79: `filter` → `return (rows ?? []).filter(`
  - L95: `filter` → `const allSel = filtered.length > 0 && filtered.every((r) => selected.has(r.id));`
  - L96: `filter` → `setSelected(allSel ? new Set() : new Set(filtered.map((r) => r.id)));`
  - L97: `filter` → `}, [filtered, selected]);`
  - L116: `filter` → `const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));`
  - L119: `animate-` → `return <div className="grid place-items-center py-20"><Loader2 className="size-5 animate-spin text-accent" /></div>;`
  - L127: `translate` → `<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />`
  - L161: `filter` → `<span className="text-xs text-muted-foreground">({filtered.length})</span>`
  - L172: `filter` → `{filtered.map((r) => {`
  - L194: `filter` → `{BADGES.filter((b) => r[b.key]).map((b) => (`
  - L203: `filter` → `{filtered.length === 0 && (`
  - L204: `filter` → `<p className="py-12 text-center text-sm text-muted-foreground">No products match your filters.</p>`
  - L211: `shadow-` → `<div className="mx-auto max-w-3xl rounded-2xl border border-border/60 bg-background/90 p-3 shadow-2xl backdrop-blur-xl">`
  - L211: `blur` → `<div className="mx-auto max-w-3xl rounded-2xl border border-border/60 bg-background/90 p-3 shadow-2xl backdrop-blur-xl">`
  - L225: `opacity` → `className="flex-1 rounded-lg bg-accent px-2 py-1.5 text-[11px] font-bold text-accent-foreground transition-all hover:brightness-110 disabled:opacity-50"`
  - L227: `animate-` → `{busy === `${b.key}:true` ? <Loader2 className="mx-auto size-3.5 animate-spin" /> : "On"}`
  - L232: `opacity` → `className="flex-1 rounded-lg border border-border px-2 py-1.5 text-[11px] font-bold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"`
  - L234: `animate-` → `{busy === `${b.key}:false` ? <Loader2 className="mx-auto size-3.5 animate-spin" /> : "Off"}`

### `src/routes/admin-categories.tsx`
- Summary: `animate-`×1, `blur`×1, `filter`×10, `opacity`×3, `rotate`×1, `shadow-`×1, `transform`×1
  - L32: `shadow-` → `<div className="rounded-xl border border-border bg-card/95 px-3 py-2 backdrop-blur text-xs shadow-xl">`
  - L32: `blur` → `<div className="rounded-xl border border-border bg-card/95 px-3 py-2 backdrop-blur text-xs shadow-xl">`
  - L46: `filter` → `const [filter, setFilter] = useState<CatHealth | "all">("all");`
  - L81: `filter` → `growth: [...d].filter((c) => c.revenue > 0).sort((a, b) => b.growth - a.growth)[0] ?? d[0],`
  - L85: `filter` → `const filtered = useMemo(`
  - L86: `filter` → `() => (data ?? []).filter((c) => filter === "all" || c.health === filter),`
  - L87: `filter` → `[data, filter],`
  - L99: `animate-` → `<div className="grid place-items-center py-24"><Loader2 className="size-5 animate-spin text-accent" /></div>`
  - L131: `opacity` → `initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}`
  - L152: `filter` → `className={`text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 rounded-full border ${filter === "all" ? "border-accent bg-accent/10 text-accent" : "border-border text-mute`
  - L158: `filter` → `<button key={h} onClick={() => setFilter(filter === h ? "all" : h)}`
  - L159: `filter` → `className={`text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 rounded-full border ${filter === h ? `${m.ring} ${m.bg} ${m.color}` : "border-border text-muted-foreground h`
  - L168: `filter` → `{filtered.map((c) => {`
  - L177: `opacity` → `initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}`
  - L230: `transform` → `<ChevronDown className={`size-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />`
  - L230: `rotate` → `<ChevronDown className={`size-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />`
  - L234: `opacity` → `<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">`
  - L254: `filter` → `{filtered.length === 0 && (`

### `src/routes/admin-checkout-analytics.tsx`
- Summary: `animate-`×1
  - L137: `animate-` → `<div className="grid place-items-center py-20"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>`

### `src/routes/admin-checkout-funnel.tsx`
- Summary: `animate-`×1
  - L193: `animate-` → `<div className="grid place-items-center py-20"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>`

### `src/routes/admin-customer-intelligence.tsx`
- Summary: `animate-`×2, `filter`×7, `translate`×1
  - L127: `filter` → `const filtered = useMemo(() => {`
  - L130: `filter` → `.filter((c) => segment === "all" || c.segment === segment)`
  - L131: `filter` → `.filter((c) => region === "all" || c.region === region)`
  - L132: `filter` → `.filter((c) => !term || c.name.toLowerCase().includes(term) || (c.email ?? "").toLowerCase().includes(term) || (c.phone ?? "").includes(term))`
  - L138: `filter` → `const out = filtered.map((c) => ({`
  - L165: `animate-` → `<Loader2 className="size-6 animate-spin text-accent" />`
  - L179: `animate-` → `<RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh`
  - L323: `translate` → `<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />`
  - L352: `filter` → `{filtered.map((c) => (`
  - L377: `filter` → `{!filtered.length && <p className="text-xs text-muted-foreground py-6 text-center">No customers match these filters.</p>}`

### `src/routes/admin-customers.$customerId.tsx`
- Summary: `animate-`×4, `filter`×14, `opacity`×5
  - L85: `opacity` → `{done ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3 opacity-50" />}`
  - L281: `filter` → `.on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: flt }, ping)`
  - L282: `filter` → `.on("postgres_changes", { event: "*", schema: "public", table: "payments", filter: flt }, ping)`
  - L283: `filter` → `.on("postgres_changes", { event: "*", schema: "public", table: "shipments", filter: flt }, ping)`
  - L284: `filter` → `.on("postgres_changes", { event: "*", schema: "public", table: "returns", filter: flt }, ping)`
  - L285: `filter` → `.on("postgres_changes", { event: "*", schema: "public", table: "support_tickets", filter: flt }, ping)`
  - L286: `filter` → `.on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: flt }, ping)`
  - L315: `animate-` → `return <div className="min-h-[40vh] grid place-items-center"><Loader2 className="size-5 animate-spin text-accent" /></div>;`
  - L340: `filter` → `openTickets: data.tickets.filter((t) => t.status !== "resolved" && t.status !== "closed").length,`
  - L354: `animate-` → `<Radio className={`size-3 ${pulse ? "text-accent animate-ping" : ""}`} /> Live`
  - L443: `filter` → `{CUSTOMER_TAGS.filter((t) => !tags.includes(t)).map((t) => (`
  - L547: `filter` → `const full = [a.line1, a.line2, a.city, a.state, a.postal, a.country].filter(Boolean).join(", ");`
  - L687: `filter` → `const shown = emails.filter(matches);`
  - L688: `filter` → `if (shown.length === 0) return <Empty label="No emails for this filter." />;`
  - L754: `opacity` → `<Star key={i} className={`size-3 ${i < r.rating ? "fill-amber-300" : "opacity-30"}`} />`
  - L781: `filter` → `{/* Activity Timeline — unified chronological history, filterable */}`
  - L799: `filter` → `const shown = timeline.filter((e) => tlFilter === "all" || e.kind === tlFilter);`
  - L800: `filter` → `if (shown.length === 0) return <Empty label="No activity for this filter." />;`
  - L867: `opacity` → `className="w-full rounded-xl bg-accent text-accent-foreground py-2 text-sm font-medium disabled:opacity-40"`
  - L869: `animate-` → `{busy ? <Loader2 className="size-4 animate-spin mx-auto" /> : "Create Ticket"}`
  - … 3 more matching lines omitted for brevity

### `src/routes/admin-customers.tsx`
- Summary: `animate-`×2, `filter`×6, `opacity`×2, `translate`×1
  - L151: `filter` → `enriched.filter((c) =>`
  - L166: `filter` → `const active = enriched.filter((c) =>`
  - L169: `filter` → `const vip = enriched.filter((c) => c.tier.key === "vip" || c.tier.key === "elite").length;`
  - L170: `filter` → `const returning = enriched.filter((c) => c.total_orders >= 2).length;`
  - L171: `filter` → `const atRisk = enriched.filter((c) => c.risk_score >= 35 || c.health.score < 35).length;`
  - L195: `animate-` → `<Radio className={`size-3 ${pulse ? "text-accent animate-ping" : ""}`} /> Live`
  - L198: `translate` → `<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />`
  - L208: `filter` → `{/* Segment filters */}`
  - L298: `animate-` → `{loading && <div className="p-6 grid place-items-center"><Loader2 className="size-5 animate-spin text-accent" /></div>}`
  - L316: `opacity` → `className="rounded-full border border-white/10 p-1.5 hover:bg-white/5 disabled:opacity-40"><ChevronLeft className="size-4" /></button>`
  - L319: `opacity` → `className="rounded-full border border-white/10 p-1.5 hover:bg-white/5 disabled:opacity-40"><ChevronRight className="size-4" /></button>`

### `src/routes/admin-email-delivery.tsx`
- Summary: `animate-`×2, `translate`×1
  - L100: `animate-` → `<RefreshCw className={`size-3 ${isFetching ? "animate-spin" : ""}`} /> Refresh`
  - L133: `translate` → `<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />`
  - L159: `animate-` → `<div className="py-10 grid place-items-center"><Loader2 className="size-4 animate-spin text-muted-foreground" /></div>`

### `src/routes/admin-email-diagnostics.tsx`
- Summary: `animate-`×2
  - L100: `animate-` → `return <div className="min-h-[40vh] grid place-items-center"><Loader2 className="size-5 animate-spin text-accent" /></div>;`
  - L132: `animate-` → `<RefreshCw className={`size-3 ${isFetching ? "animate-spin" : ""}`} /> Refresh`

### `src/routes/admin-email-health.tsx`
- Summary: `animate-`×2, `opacity`×2
  - L102: `animate-` → `<RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />`
  - L137: `animate-` → `<Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading deliverability…`
  - L187: `opacity` → `<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />`
  - L205: `opacity` → `<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />`

### `src/routes/admin-email-ops.tsx`
- Summary: `animate-`×3
  - L88: `animate-` → `<RefreshCw className={`size-3 ${isFetching ? "animate-spin" : ""}`} /> Refresh`
  - L115: `animate-` → `<div className="py-10 grid place-items-center"><Loader2 className="size-4 animate-spin text-muted-foreground" /></div>`
  - L164: `animate-` → `<div className="py-10 grid place-items-center"><Loader2 className="size-4 animate-spin text-muted-foreground" /></div>`

### `src/routes/admin-email-queue.tsx`
- Summary: `animate-`×3, `filter`×1
  - L120: `animate-` → `<RefreshCw className={`size-3 ${queueQ.isFetching || logQ.isFetching ? "animate-spin" : ""}`} /> Refresh`
  - L146: `animate-` → `<div className="py-10 grid place-items-center"><Loader2 className="size-4 animate-spin text-muted-foreground" /></div>`
  - L230: `animate-` → `<div className="py-10 grid place-items-center"><Loader2 className="size-4 animate-spin text-muted-foreground" /></div>`
  - L236: `filter` → `<p className="py-8 text-center text-sm text-muted-foreground">No emails match these filters in this period.</p>`

### `src/routes/admin-emails.tsx`
- Summary: `animate-`×3, `opacity`×1, `rotate`×1
  - L24: `rotate` → `{ record: "DKIM", name: `*._domainkey.${SENDER_DOMAIN}`, value: "Managed key (auto-rotated)", purpose: "Signature" },`
  - L119: `opacity` → `className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-[12px] font-medium uppercase tracking-widest text-accent-foreground transition-opacity hover:opacity`
  - L121: `animate-` → `{sending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}`
  - L168: `animate-` → `<RefreshCw className={`size-3 ${isFetching ? "animate-spin" : ""}`} /> Refresh`
  - L313: `animate-` → `<Loader2 className="size-4 animate-spin text-muted-foreground" />`

### `src/routes/admin-financial.tsx`
- Summary: `animate-`×8, `animation`×1, `blur`×2, `filter`×2, `opacity`×7, `rotate`×1, `scale`×7
  - L46: `animate-` → `<div className="orb animate-mesh" style={{ top: "-12%", left: "-6%", width: "46vw", height: "46vw", background: "var(--gradient-ember-soft)" }} />`
  - L47: `animate-` → `<div className="orb animate-mesh" style={{ bottom: "-16%", right: "-10%", width: "52vw", height: "52vw", background: "var(--gradient-ember-soft)", animationDelay: "-7s" }} />`
  - L47: `animation` → `<div className="orb animate-mesh" style={{ bottom: "-16%", right: "-10%", width: "52vw", height: "52vw", background: "var(--gradient-ember-soft)", animationDelay: "-7s" }} />`
  - L48: `opacity` → `<div className="absolute inset-0 grid-texture opacity-30" />`
  - L75: `opacity` → `initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}`
  - L80: `filter` → `<div className="pointer-events-none absolute -top-10 -right-8 size-24 rounded-full opacity-25 group-hover:opacity-45 transition-opacity duration-500" style={{ background: "var(--gr`
  - L80: `opacity` → `<div className="pointer-events-none absolute -top-10 -right-8 size-24 rounded-full opacity-25 group-hover:opacity-45 transition-opacity duration-500" style={{ background: "var(--gr`
  - L80: `blur` → `<div className="pointer-events-none absolute -top-10 -right-8 size-24 rounded-full opacity-25 group-hover:opacity-45 transition-opacity duration-500" style={{ background: "var(--gr`
  - L99: `animate-` → `return <div className="rounded-2xl glass p-4 animate-pulse h-[104px]"><div className="h-2.5 w-16 bg-white/10 rounded mb-4" /><div className="h-6 w-24 bg-white/10 rounded" /></div>;`
  - L105: `opacity` → `initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}`
  - L122: `blur` → `const glassTooltip = { background: "oklch(0.16 0.01 260 / 0.92)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12, fontSize: 11, backdropFilter: "blur(10px)" };`
  - L225: `scale` → `<button aria-label="Search" className="size-8 grid place-items-center rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-accent/30 hover:bg-white/[0.06] transition-`
  - L227: `scale` → `<Link to="/admin" aria-label="Orders" className="relative size-8 grid place-items-center rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-accent/30 hover:bg-white`
  - L247: `filter` → `{/* sticky filter bar */}`
  - L251: `animate-` → `<span className={`size-1.5 rounded-full ${live ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground/40"}`} />`
  - L260: `scale` → `<button onClick={() => load(true)} disabled={refreshing} className="size-7 grid place-items-center rounded-lg bg-white/[0.03] border border-white/[0.08] hover:border-accent/30 tran`
  - L260: `animate-` → `<button onClick={() => load(true)} disabled={refreshing} className="size-7 grid place-items-center rounded-lg bg-white/[0.03] border border-white/[0.08] hover:border-accent/30 tran`
  - L261: `scale` → `<button onClick={exportCSV} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-widest bg-white/[0.04] border border-whi`
  - L262: `scale` → `<button onClick={exportPDF} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-widest bg-accent/15 text-accent border b`
  - L271: `opacity` → `<motion.div key={a.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05, ease: EASE }}`
  - … 8 more matching lines omitted for brevity

### `src/routes/admin-flash-deals.tsx`
- Summary: `animate-`×2, `blur`×1, `filter`×6, `opacity`×2
  - L106: `filter` → `impressions: rows.filter((r) => r.event_type === "impression").length,`
  - L107: `filter` → `clicks: rows.filter((r) => r.event_type === "click").length,`
  - L108: `filter` → `purchases: rows.filter((r) => r.event_type === "purchase").length,`
  - L147: `filter` → `active: d.filter((x) => statusOf(x, now) === "active").length,`
  - L148: `filter` → `scheduled: d.filter((x) => statusOf(x, now) === "scheduled").length,`
  - L149: `filter` → `expired: d.filter((x) => statusOf(x, now) === "expired").length,`
  - L263: `opacity` → `className="inline-flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-4 py-2 text-xs font-mono uppercase tracking-widest hover:opacity-90 transition"`
  - L271: `animate-` → `<Loader2 className="size-6 animate-spin text-accent" />`
  - L338: `blur` → `<div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setEditing(null)}>`
  - L422: `opacity` → `className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-accent text-accent-foreground px-4 py-2.5 text-sm font-medium hover:opacity-90 transition disabled:o`
  - L424: `animate-` → `{saving ? <Loader2 className="size-4 animate-spin" /> : <Flame className="size-4" />}`

### `src/routes/admin-inbox-placement.tsx`
- Summary: `animate-`×4, `filter`×2, `opacity`×3
  - L56: `opacity` → `<span className="text-[9px] font-mono uppercase tracking-[0.2em] opacity-70">{provider}</span>`
  - L99: `filter` → `const completed = rows.filter((r) => r.status === "completed");`
  - L100: `filter` → `const passing = completed.filter(`
  - L152: `opacity` → `className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-primary px-4 py-2.5 text-sm font-medium text-accent-foreground disabled:opacity-50 transition-o`
  - L154: `animate-` → `{runTest.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}`
  - L195: `animate-` → `<RefreshCw className={`size-3.5 ${tests.isFetching ? "animate-spin" : ""}`} />`
  - L202: `animate-` → `<Loader2 className="size-5 animate-spin text-accent" />`
  - L233: `opacity` → `className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs hover:border-accent/40 disabled:opacity-50 transition-colors"`
  - L236: `animate-` → `<Loader2 className="size-3.5 animate-spin" />`

### `src/routes/admin-inventory-intelligence.tsx`
- Summary: `animate-`×2, `filter`×7
  - L62: `filter` → `const atRisk = useMemo(() => [...intel].filter((p) => p.urgency === "critical" || p.urgency === "high").sort((a, b) => b.riskScore - a.riskScore), [intel]);`
  - L63: `filter` → `const stockouts = useMemo(() => [...intel].filter((p) => p.daysRemaining !== null).sort((a, b) => (a.daysRemaining ?? 1e9) - (b.daysRemaining ?? 1e9)).slice(0, 8), [intel]);`
  - L64: `filter` → `const dead = useMemo(() => [...intel].filter((p) => p.classification === "dead" || p.classification === "overstock").sort((a, b) => b.cost * b.stock - a.cost * a.stock).slice(0, 6)`
  - L65: `filter` → `const movers = useMemo(() => [...intel].filter((p) => p.avgDailySales > 0).sort((a, b) => b.avgDailySales - a.avgDailySales).slice(0, 6), [intel]);`
  - L67: `filter` → `const returned = useMemo(() => [...intel].filter((p) => p.returns > 0).sort((a, b) => b.returnRate - a.returnRate).slice(0, 6), [intel]);`
  - L72: `animate-` → `<div className="min-h-[40vh] grid place-items-center"><Loader2 className="size-5 animate-spin text-accent" /></div>`
  - L94: `animate-` → `<RefreshCw className={`size-3 ${refreshing ? "animate-spin" : ""}`} /> Refresh`
  - L194: `filter` → `{[...intel].filter((p) => p.suggestedReorderQty > 0).sort((a, b) => b.riskScore - a.riskScore).slice(0, 20).map((p) => (`
  - L207: `filter` → `{intel.filter((p) => p.suggestedReorderQty > 0).length === 0 && (`

### `src/routes/admin-inventory.tsx`
- Summary: `animate-`×1, `blur`×1, `filter`×2, `opacity`×1
  - L35: `filter` → `const oos = list.filter((p) => p.stock_quantity <= 0);`
  - L36: `filter` → `const low = list.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold);`
  - L65: `animate-` → `{products === null ? <div className="p-8"><Loader2 className="size-4 animate-spin text-muted-foreground" /></div> :`
  - L136: `blur` → `<div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>`
  - L158: `opacity` → `<button onClick={save} disabled={saving} className="px-4 py-2 rounded-full text-xs uppercase tracking-widest font-bold bg-accent text-accent-foreground disabled:opacity-50">{saving`

### `src/routes/admin-live.tsx`
- Summary: `animate-`×9, `animation`×1, `blur`×8, `filter`×13, `opacity`×14, `scale`×5, `transform`×2, `translate`×1, `will-change`×2
  - L30: `filter` → `const FILTER_STORAGE_KEY = "fom_live_filter_v2";`
  - L48: `animate-` → `<div className="orb animate-mesh" style={{ top: "-10%", left: "-5%", width: "45vw", height: "45vw", background: "var(--gradient-ember-soft)" }} />`
  - L49: `animate-` → `<div className="orb animate-mesh" style={{ bottom: "-15%", right: "-8%", width: "50vw", height: "50vw", background: "var(--gradient-violet)", animationDelay: "-6s" }} />`
  - L49: `animation` → `<div className="orb animate-mesh" style={{ bottom: "-15%", right: "-8%", width: "50vw", height: "50vw", background: "var(--gradient-violet)", animationDelay: "-6s" }} />`
  - L50: `opacity` → `<div className="absolute inset-0 grid-texture opacity-40" />`
  - L71: `opacity` → `initial={{ opacity: 0, y: 16 }}`
  - L72: `opacity` → `animate={{ opacity: 1, y: 0 }}`
  - L75: `transform` → `className="card-ambient glass-reflect noise-layer relative overflow-hidden rounded-3xl p-6 sm:p-7 row-span-2 flex flex-col justify-between min-h-[180px] will-change-transform"`
  - L75: `will-change` → `className="card-ambient glass-reflect noise-layer relative overflow-hidden rounded-3xl p-6 sm:p-7 row-span-2 flex flex-col justify-between min-h-[180px] will-change-transform"`
  - L77: `blur` → `<div className="absolute -top-20 -right-16 size-56 rounded-full bg-accent/15 blur-3xl animate-ambient" />`
  - L77: `animate-` → `<div className="absolute -top-20 -right-16 size-56 rounded-full bg-accent/15 blur-3xl animate-ambient" />`
  - L95: `opacity` → `initial={{ opacity: 0, y: 14 }}`
  - L96: `opacity` → `animate={{ opacity: 1, y: 0 }}`
  - L99: `transform` → `className="card-elevated glass-reflect relative overflow-hidden rounded-2xl p-4 will-change-transform"`
  - L99: `will-change` → `className="card-elevated glass-reflect relative overflow-hidden rounded-2xl p-4 will-change-transform"`
  - L135: `animate-` → `<span className={`absolute inline-flex rounded-full size-1.5 ${dot} ${it.ok && !it.pending ? "animate-signal" : ""}`} />`
  - L165: `filter` → `const valid = arr.filter((k) => ALL_KINDS.includes(k));`
  - L175: `filter` → `const [filter, setFilter] = useState<Set<EventKind>>(loadFilter);`
  - L200: `filter` → `/* persist filter */`
  - L202: `filter` → `try { localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify([...filter])); } catch { /* ignore */ }`
  - … 35 more matching lines omitted for brevity

### `src/routes/admin-low-stock.tsx`
- Summary: `animate-`×1
  - L55: `animate-` → `<div className="p-8"><Loader2 className="size-4 animate-spin text-muted-foreground" /></div>`

### `src/routes/admin-marketing-automation.tsx`
- Summary: `animate-`×5, `blur`×1, `filter`×6, `opacity`×3, `shadow-`×1
  - L98: `filter` → `const filteredCampaigns = useMemo(() => {`
  - L100: `filter` → `return region === "all" ? intel.campaigns : intel.campaigns.filter((c) => c.region === region || c.region === "all");`
  - L103: `filter` → `const kpis = useMemo(() => intel ? computeKpis({ ...intel, campaigns: filteredCampaigns }) : null, [intel, filteredCampaigns]);`
  - L107: `filter` → `const tops = useMemo(() => topCampaigns(filteredCampaigns), [filteredCampaigns]);`
  - L108: `filter` → `const upcoming = useMemo(() => upcomingCampaigns(filteredCampaigns), [filteredCampaigns]);`
  - L118: `animate-` → `<Loader2 className="size-6 animate-spin" />`
  - L142: `animate-` → `<RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh`
  - L164: `filter` → `<CampaignsTab campaigns={filteredCampaigns} onChanged={load} focusId={focusCampaign} />`
  - L334: `shadow-` → `<div key={c.id} id={`campaign-${c.id}`} className={`card-premium rounded-2xl p-4 transition-shadow ${focusId === c.id ? "ring-2 ring-primary shadow-lg" : ""}`}>`
  - L525: `opacity` → `<button disabled={busy} onClick={submit} className="w-full h-10 rounded-xl bg-accent text-accent-foreground text-sm font-medium inline-flex items-center justify-center gap-2 disabl`
  - L526: `animate-` → `{busy ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />} Create campaign`
  - L581: `opacity` → `<button disabled={busy} onClick={submit} className="w-full h-10 rounded-xl bg-accent text-accent-foreground text-sm font-medium inline-flex items-center justify-center gap-2 disabl`
  - L582: `animate-` → `{busy ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />} Create rule`
  - L593: `blur` → `<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>`
  - L626: `opacity` → `className={`size-8 grid place-items-center rounded-lg border border-border bg-card disabled:opacity-50 ${danger ? "hover:border-destructive/50 hover:text-destructive" : "hover:bord`
  - L627: `animate-` → `{busy ? <Loader2 className="size-3.5 animate-spin" /> : children}`

### `src/routes/admin-marketing-growth.tsx`
- Summary: `animate-`×2
  - L210: `animate-` → `<div className="grid place-items-center py-32"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>`
  - L264: `animate-` → `<div className="grid place-items-center py-24"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>`

### `src/routes/admin-marketing-metrics.tsx`
- Summary: `animate-`×2, `opacity`×1
  - L113: `animate-` → `<RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh`
  - L115: `opacity` → `<button onClick={exportCsv} disabled={!kpis.length} className="inline-flex items-center gap-1 rounded-md bg-accent px-2.5 py-1.5 text-xs font-medium text-accent-foreground disabled`
  - L142: `animate-` → `<Loader2 className="h-5 w-5 animate-spin" />`

### `src/routes/admin-marketing.tsx`
- Summary: `animate-`×3, `blur`×2, `filter`×2, `opacity`×5
  - L146: `animate-` → `{banners === null ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> :`
  - L173: `opacity` → `<button onClick={() => moveBanner(b.id, -1)} title="Move left" className="size-8 grid place-items-center rounded-full hover:bg-white/5 disabled:opacity-30" disabled={banners.indexO`
  - L174: `opacity` → `<button onClick={() => moveBanner(b.id, 1)} title="Move right" className="size-8 grid place-items-center rounded-full hover:bg-white/5 disabled:opacity-30" disabled={banners.indexO`
  - L207: `animate-` → `{flash === null ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> :`
  - L371: `blur` → `<div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>`
  - L412: `opacity` → `<button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-border text-[11`
  - L413: `animate-` → `{uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}`
  - L447: `opacity` → `<button type="submit" disabled={saving} className="px-4 py-2 rounded-full text-xs uppercase tracking-widest font-bold bg-accent text-accent-foreground disabled:opacity-50">{saving `
  - L486: `filter` → `product_slugs: f.product_slugs.split(",").map((s) => s.trim()).filter(Boolean),`
  - L506: `blur` → `<div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>`
  - L534: `opacity` → `<button type="submit" disabled={saving} className="px-4 py-2 rounded-full text-xs uppercase tracking-widest font-bold bg-accent text-accent-foreground disabled:opacity-50">{f.activ`
  - L541: `filter` → `? `"${f.name}" will be active on the public site immediately and apply −${f.discount_percent}% to ${f.product_slugs.split(",").filter(Boolean).length} products.``

### `src/routes/admin-marketplace-quality.tsx`
- Summary: `animate-`×2, `blur`×1, `filter`×9, `opacity`×4, `rotate`×1, `scale`×2
  - L22: `scale` → `{ name: "description", content: "SEO quality audit, structured-data validation, and product completeness monitoring at marketplace scale." },`
  - L45: `opacity` → `initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}`
  - L50: `rotate` → `<svg viewBox="0 0 36 36" className="size-16 -rotate-90">`
  - L94: `filter` → `const keys = (Object.keys(ISSUE_META) as IssueKey[]).filter(`
  - L100: `filter` → `const filteredProducts = useMemo(() => {`
  - L102: `filter` → `return report.audited.filter((a) => {`
  - L113: `scale` → `subtitle="Audit SEO quality, structured data & product completeness at scale — monitoring only, never overwriting auto-generated metadata."`
  - L119: `opacity` → `className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest glass rounded-full px-4 py-2 text-accent ring-1 ring-inset ring-accent/30 disabled:opacity`
  - L121: `animate-` → `<RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} /> Re-scan`
  - L128: `animate-` → `<Loader2 className="size-5 animate-spin text-accent" />`
  - L172: `opacity` → `<span className="opacity-60">({report.byCategory[c]})</span>`
  - L189: `opacity` → `className={`text-left card-premium rounded-2xl p-4 transition-colors ${active ? "border-accent/60 ring-1 ring-accent/30" : "hover:border-accent/30"} ${count === 0 ? "opacity-50" : `
  - L206: `blur` → `<div className="px-5 py-3 border-b border-border flex flex-wrap items-center justify-between gap-2 sticky top-0 bg-card/80 backdrop-blur z-10">`
  - L208: `filter` → `<ShieldCheck className="size-4 text-accent" /> {filteredProducts.length} flagged`
  - L212: `filter` → `<button onClick={() => setIssueFilter(null)} className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-accent">Clear filter</button>`
  - L216: `filter` → `{filteredProducts.slice(0, 200).map((a) => {`
  - L252: `filter` → `{filteredProducts.length === 0 && (`
  - L256: `filter` → `{filteredProducts.length > 200 && (`
  - L258: `filter` → `Showing first 200 of {filteredProducts.length}`

### `src/routes/admin-media.tsx`
- Summary: `animate-`×1, `filter`×6, `opacity`×1, `translate`×1
  - L30: `filter` → `const [filter, setFilter] = useState("all");`
  - L43: `filter` → `entityType: filter,`
  - L56: `filter` → `[q, filter, loading],`
  - L64: `filter` → `}, [q, filter]);`
  - L80: `filter` → `setItems((prev) => prev.filter((a) => a.id !== asset.id));`
  - L103: `translate` → `<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />`
  - L118: `filter` → `filter === f`
  - L146: `opacity` → `<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">`
  - L179: `animate-` → `<Loader2 className="size-5 animate-spin text-accent" />`

### `src/routes/admin-merchandising.tsx`
- Summary: `animate-`×3, `blur`×2, `filter`×10, `opacity`×5, `shadow-`×1
  - L48: `filter` → `setItems(rows.filter((r) => !!r[section.flag]).sort(sectionSort));`
  - L127: `filter` → `for (const s of MERCH_SECTIONS) counts[s.key] = all.filter((r) => !!r[s.flag]).length;`
  - L130: `filter` → `merchandised: all.filter(hasAnyMerchFlag).length,`
  - L131: `filter` → `hero: all.filter((r) => r.homepage_hero).length,`
  - L160: `opacity` → `className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-accent/15 text-accent border border-accent/40 px-4 py-2 text-xs font-medium hover:bg-accent/25 transition-color`
  - L162: `animate-` → `<Shuffle className={`size-3.5 ${reshuffling ? "animate-spin" : ""}`} /> Reshuffle all`
  - L179: `filter` → `const count = (rows ?? []).filter((r) => !!r[s.flag]).length;`
  - L185: `opacity` → `{s.label} <span className="ml-1 opacity-60">{count}</span>`
  - L192: `animate-` → `<div className="grid place-items-center py-24"><Loader2 className="size-5 animate-spin text-accent" /></div>`
  - L244: `opacity` → `<motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}`
  - L245: `blur` → `className="fixed bottom-0 inset-x-0 lg:left-[17.5rem] z-30 border-t border-border bg-background/90 backdrop-blur-xl px-4 py-3">`
  - L297: `shadow-` → `<div className="absolute right-0 top-9 z-20 w-44 rounded-xl border border-white/10 bg-background/95 backdrop-blur-xl p-1 shadow-xl">`
  - L297: `blur` → `<div className="absolute right-0 top-9 z-20 w-44 rounded-xl border border-white/10 bg-background/95 backdrop-blur-xl p-1 shadow-xl">`
  - L298: `filter` → `{MERCH_SECTIONS.filter((s) => s.key !== currentSection.key).map((s) => (`
  - L395: `opacity` → `{hero.image && <img src={resolveImage(hero.image)} alt="" className="absolute inset-0 size-full object-cover opacity-40" />}`
  - L408: `opacity` → `className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-accent px-5 py-2.5 text-xs font-semibold text-accent-foreground transition-all hover:brightness-110 `
  - L409: `animate-` → `{publishing ? <Loader2 className="size-3.5 animate-spin" /> : <Crown className="size-3.5" />}`
  - L421: `filter` → `const withViews = rows.filter((r) => (Number(r.views_count) || 0) > 0);`
  - L427: `filter` → `.filter((r) => (Number(r.views_count) || 0) >= medianViews && conversionOf(r) < 1.5)`
  - L432: `filter` → `.filter((r) => r.created_at && now - new Date(r.created_at).getTime() < 45 * 864e5)`
  - … 1 more matching lines omitted for brevity

### `src/routes/admin-notifications.tsx`
- Summary: `animate-`×5, `blur`×6, `filter`×27, `opacity`×5, `shadow-`×1, `transform`×1, `translate`×2
  - L45: `filter` → `const lines = body.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !isNoiseLine(l));`
  - L144: `filter` → `{ event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },`
  - L151: `filter` → `{ event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },`
  - L154: `filter` → `{ event: "DELETE", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },`
  - L155: `filter` → `(p) => setItems((prev) => prev?.filter((x) => x.id !== (p.old as { id: string }).id) ?? prev))`
  - L161: `filter` → `const filtered = useMemo(() => {`
  - L165: `filter` → `.filter((n) => view === "archived" ? !!n.archived_at : !n.archived_at)`
  - L166: `filter` → `.filter((n) => view !== "unread" || !n.read_at)`
  - L167: `filter` → `.filter((n) => cat === "all" || opsCategoryOf(n) === cat)`
  - L168: `filter` → `.filter((n) => prio === "all" || priorityOf(n) === prio)`
  - L169: `filter` → `.filter((n) => passesPref(n, mode))`
  - L170: `filter` → `.filter((n) => !term || `${n.title} ${n.body ?? ""} ${n.type}`.toLowerCase().includes(term))`
  - L175: `filter` → `const live = (items ?? []).filter((n) => !n.archived_at);`
  - L177: `filter` → `unread: live.filter((n) => !n.read_at).length,`
  - L178: `filter` → `critical: live.filter((n) => priorityOf(n) === "critical" && !n.read_at).length,`
  - L198: `filter` → `setItems((prev) => prev?.filter((n) => !ids.includes(n.id)) ?? prev);`
  - L204: `filter` → `patch((items ?? []).filter((n) => !n.read_at).map((n) => n.id), { read_at: at });`
  - L208: `filter` → `const ids = filtered.filter((n) => n.read_at).map((n) => n.id);`
  - L229: `filter` → `const selectAll = () => setSelected(new Set(filtered.map((n) => n.id)));`
  - L231: `filter` → `const selIds = [...selected].filter((id) => filtered.some((n) => n.id === id));`
  - … 27 more matching lines omitted for brevity

### `src/routes/admin-orders-analytics.tsx`
- Summary: `animate-`×1, `filter`×2
  - L64: `animate-` → `<div className="min-h-[50vh] grid place-items-center"><Loader2 className="size-5 animate-spin text-accent" /></div>`
  - L112: `filter` → `<KpiCard label="In Transit" value={num(ords.filter((o) => o.shipped_at && !o.delivered_at).length)} icon={<Zap className="size-4" />} />`
  - L218: `filter` → `const hrs = staffPerf.map((s) => s.avg_handling_hours).filter((h): h is number => h != null);`

### `src/routes/admin-orders-ops.tsx`
- Summary: `animate-`×3, `blur`×2, `contain`×1, `filter`×24, `rotate`×1, `shadow-`×2, `transform`×1, `translate`×1
  - L133: `filter` → `.filter(Boolean).join(", ");`
  - L161: `shadow-` → `<div className="absolute right-0 mt-1 z-20 w-36 rounded-lg border border-border bg-card shadow-xl p-1 text-xs">`
  - L279: `filter` → `const addrLines = [a.line1, a.line2, a.landmark, a.area, [a.city, a.district].filter(Boolean).join(", "), [a.state ?? a.region, a.postal_code ?? a.postal].filter(Boolean).join(" ")`
  - L282: `filter` → `const tags = o.tags.filter((t) => t !== "vip");`
  - L286: `blur` → `<div className="absolute inset-0 bg-background/80 backdrop-blur-md" />`
  - L287: `contain` → `<div className="relative w-full max-w-md h-full overflow-y-auto overscroll-contain bg-card border-l border-border shadow-2xl" onClick={(e) => e.stopPropagation()}>`
  - L287: `shadow-` → `<div className="relative w-full max-w-md h-full overflow-y-auto overscroll-contain bg-card border-l border-border shadow-2xl" onClick={(e) => e.stopPropagation()}>`
  - L290: `blur` → `<div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border px-5 pt-5 pb-4">`
  - L350: `filter` → `addressLines: [a.line1, a.line2, a.landmark, a.area].filter(Boolean) as string[],`
  - L395: `transform` → `<ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />`
  - L395: `rotate` → `<ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />`
  - L446: `filter` → `<Row k="Billing address" v={[billing.line1, billing.city, billing.state, billing.postal].filter(Boolean).join(", ") || "—"} />`
  - L542: `animate-` → `{loading && <div className="flex items-center gap-2 text-[12px] text-muted-foreground"><Loader2 className="size-3.5 animate-spin" /> Loading full payment & customer detail…</div>}`
  - L656: `filter` → `const filtered = useMemo(() => {`
  - L660: `filter` → `if (t) rows = rows.filter((o) =>`
  - L674: `animate-` → `<div className="min-h-[50vh] grid place-items-center"><Loader2 className="size-5 animate-spin text-accent" /></div>`
  - L694: `filter` → `const packedOrders = ords.filter((o) => /pack/i.test(stageStr(o)) && isActive(o));`
  - L695: `filter` → `const ofdOrders = ords.filter((o) => /out.?for.?delivery|ofd/i.test(stageStr(o)) && isActive(o));`
  - L698: `filter` → `const deliveredOrders = ords.filter((o) => o.delivered_at || /delivered|completed/i.test(o.status ?? ""));`
  - L699: `filter` → `const shippedOrders = ords.filter((o) => (o.shipped_at || /shipped/i.test(stageStr(o))) && !o.delivered_at && !/delivered|completed/i.test(o.status ?? "") && !ofdOrders.includes(o)`
  - … 15 more matching lines omitted for brevity

### `src/routes/admin-payments.tsx`
- Summary: `animate-`×2, `filter`×1, `opacity`×2, `translate`×1
  - L124: `filter` → `() => (method === "all" ? rows : rows.filter((r) => (r.method ?? "").toLowerCase() === method)),`
  - L145: `animate-` → `<Radio className={`size-3 ${pulse ? "text-accent animate-ping" : ""}`} /> Live`
  - L148: `translate` → `<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />`
  - L227: `animate-` → `{loading && <div className="p-6 grid place-items-center"><Loader2 className="size-5 animate-spin text-accent" /></div>}`
  - L235: `opacity` → `className="rounded-full border border-white/10 p-1.5 hover:bg-white/5 disabled:opacity-40"><ChevronLeft className="size-4" /></button>`
  - L238: `opacity` → `className="rounded-full border border-white/10 p-1.5 hover:bg-white/5 disabled:opacity-40"><ChevronRight className="size-4" /></button>`

### `src/routes/admin-performance.tsx`
- Summary: `animate-`×1, `blur`×2, `filter`×8
  - L17: `filter` → `const [filter, setFilter] = useState<PerfTier | "all">("all");`
  - L27: `filter` → `const filtered = useMemo(`
  - L28: `filter` → `() => (data ?? []).filter((d) => filter === "all" || d.tier === filter),`
  - L29: `filter` → `[data, filter],`
  - L38: `filter` → `<button key={t} onClick={() => setFilter(filter === t ? "all" : t)} className="text-left">`
  - L46: `blur` → `<div className="px-5 py-3 border-b border-border flex items-center justify-between sticky top-0 bg-card/80 backdrop-blur z-10">`
  - L51: `filter` → `className={`text-[9px] font-mono uppercase tracking-widest px-2 py-1 rounded-full border ${filter === t ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreg`
  - L58: `animate-` → `<div className="p-8"><Loader2 className="size-4 animate-spin text-muted-foreground" /></div>`
  - L62: `blur` → `<thead className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground border-b border-border sticky top-[49px] bg-card/80 backdrop-blur">`
  - L74: `filter` → `{filtered.map((d) => {`
  - L102: `filter` → `{filtered.length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-center text-xs text-muted-foreground">No products.</td></tr>}`

### `src/routes/admin-product.$slug.details.tsx`
- Summary: `filter`×5, `opacity`×1, `rotate`×2, `scale`×4, `transform`×1
  - L71: `filter` → `features: f.features.map((x) => x.trim()).filter(Boolean),`
  - L118: `transform` → `<ChevronDown className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />`
  - L118: `rotate` → `<ChevronDown className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />`
  - L199: `scale` → `className={`rounded-lg border px-2 py-2 text-[11px] font-semibold transition-all active:scale-[0.98] ${`
  - L220: `scale` → `className="rounded-full border border-white/10 bg-white/[0.02] px-2.5 py-1 text-[10px] font-medium text-muted-foreground transition-all hover:text-foreground active:scale-95">`
  - L255: `filter` → `const okCount = checks.filter((c) => c.ok).length;`
  - L257: `filter` → `const warnings = checks.filter((c) => !c.ok);`
  - L279: `filter` → `const kw = f.keywords.trim() || parseList([f.name, f.brand, f.category, f.product_type, f.tags].filter(Boolean).join(", ")).join(", ");`
  - L286: `filter` → `const seoScore = [f.seo_title, f.seo_description, f.keywords].filter((x) => x.trim()).length;`
  - L307: `rotate` → `<svg viewBox="0 0 36 36" className="size-full -rotate-90">`
  - L325: `scale` → `className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all active:scale-[0.97] disabled:opacity-50 ${status === "published" ? "bor`
  - L325: `opacity` → `className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all active:scale-[0.97] disabled:opacity-50 ${status === "published" ? "bor`
  - L435: `scale` → `className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3.5 py-1.5 text-xs font-semibold text-accent transition-all hover:bg-accent/20 acti`

### `src/routes/admin-product.$slug.index.tsx`
- Summary: `animate-`×4, `filter`×5, `opacity`×1, `rotate`×1, `scale`×2, `transform`×1
  - L259: `filter` → `const okCount = allItems.filter((i) => i.ok).length;`
  - L261: `filter` → `const missingItems = allItems.filter((i) => !i.ok);`
  - L263: `filter` → `const placements = MERCH_FLAGS.filter((f) => !!r[f]);`
  - L393: `scale` → `className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-2 text-xs font-semibold text-accent-foreground hover:brightness-110 active:scale-[0.98] transition-all"`
  - L451: `filter` → `const ok = cat.items.filter((i) => i.ok).length;`
  - L489: `filter` → `{PRODUCT_SECTIONS.filter((s) => s.key !== "analytics" && s.key !== "preview").map((s) => {`
  - L511: `transform` → `<ChevronDown className={`size-4 text-muted-foreground transition-transform ${showAnalytics ? "rotate-180" : ""}`} />`
  - L511: `rotate` → `<ChevronDown className={`size-4 text-muted-foreground transition-transform ${showAnalytics ? "rotate-180" : ""}`} />`
  - L555: `animate-` → `<div className="grid place-items-center py-6"><Loader2 className="size-4 animate-spin text-accent" /></div>`
  - L581: `animate-` → `<div className="grid place-items-center py-6"><Loader2 className="size-4 animate-spin text-accent" /></div>`
  - L620: `animate-` → `<div className="grid place-items-center py-6"><Loader2 className="size-4 animate-spin text-accent" /></div>`
  - L672: `scale` → `const base = "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-all disabled:opacity-50 active:scale-[0.98]";`
  - L672: `opacity` → `const base = "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-all disabled:opacity-50 active:scale-[0.98]";`
  - L680: `animate-` → `{busy ? <Loader2 className="size-3.5 animate-spin" /> : icon} {label}`

### `src/routes/admin-product.$slug.preview.tsx`
- Summary: `shadow-`×1
  - L34: `shadow-` → `<div className={`${cardWidth} max-w-full rounded-2xl overflow-hidden border border-white/10 bg-card shadow-[var(--shadow-ember)]`}>`

### `src/routes/admin-products.tsx`
- Summary: `animate-`×4, `animation`×1, `blur`×1, `filter`×55, `opacity`×6, `translate`×1
  - L357: `filter` → `setProducts((list) => list?.filter((x) => x.id !== p.id) ?? list);`
  - L379: `filter` → `const oos = list.filter((p) => p.stock_quantity <= 0).length;`
  - L380: `filter` → `const low = list.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold).length;`
  - L388: `filter` → `const live = list.filter((p) => !p.deleted_at);`
  - L391: `filter` → `active: list.filter((p) => p.in_stock).length,`
  - L392: `filter` → `inactive: list.filter((p) => !p.in_stock).length,`
  - L393: `filter` → `featured: list.filter((p) => p.featured).length,`
  - L394: `filter` → `india: live.filter((p) => p.india_visible !== false).length,`
  - L395: `filter` → `international: live.filter((p) => p.international_visible !== false).length,`
  - L396: `filter` → `missingSku: live.filter((p) => !(p.sku && p.sku.trim())).length,`
  - L406: `filter` → `const live = (products ?? []).filter((p) => !p.deleted_at);`
  - L407: `filter` → `const indiaList = live.filter((p) => p.india_visible !== false);`
  - L408: `filter` → `const intlList = live.filter((p) => p.international_visible !== false);`
  - L423: `filter` → `return [...m.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 4);`
  - L432: `filter` → `.filter((x) => x.units > 0)`
  - L453: `filter` → `const filtered = useMemo(() => {`
  - L455: `filter` → `list = view === "recycle" ? list.filter((p) => p.deleted_at) : list.filter((p) => !p.deleted_at);`
  - L456: `filter` → `// Catalog tab (region / merchandising lens) — applied before secondary filters.`
  - L459: `filter` → `case "india": list = list.filter((p) => p.india_visible !== false); break;`
  - L460: `filter` → `case "international": list = list.filter((p) => p.international_visible !== false); break;`
  - … 48 more matching lines omitted for brevity

### `src/routes/admin-quality.tsx`
- Summary: `animate-`×1, `blur`×1, `filter`×10
  - L29: `filter` → `const [filter, setFilter] = useState<QualityIssue | "all">("all");`
  - L44: `filter` → `const filtered = useMemo(`
  - L45: `filter` → `() => (rows ?? []).filter((r) => filter === "all" || r.issues.includes(filter)),`
  - L46: `filter` → `[rows, filter],`
  - L56: `filter` → `<button key={i} onClick={() => setFilter(filter === i ? "all" : i)} className="text-left">`
  - L68: `blur` → `<div className="px-5 py-3 border-b border-border flex flex-wrap items-center justify-between gap-2 sticky top-0 bg-card/80 backdrop-blur z-10">`
  - L69: `filter` → `<h2 className="text-sm font-medium flex items-center gap-2"><ShieldCheck className="size-4 text-accent" /> {filtered.length} flagged</h2>`
  - L71: `filter` → `<button onClick={() => setFilter("all")} className={`text-[9px] font-mono uppercase tracking-widest px-2 py-1 rounded-full border ${filter === "all" ? "border-accent bg-accent/10 t`
  - L73: `filter` → `<button key={i} onClick={() => setFilter(i)} className={`text-[9px] font-mono uppercase tracking-widest px-2 py-1 rounded-full border ${filter === i ? "border-accent bg-accent/10 t`
  - L80: `animate-` → `<div className="p-8"><Loader2 className="size-4 animate-spin text-muted-foreground" /></div>`
  - L83: `filter` → `{filtered.map((r) => (`
  - L106: `filter` → `{filtered.length === 0 && <li className="px-5 py-10 text-center text-xs text-muted-foreground">No issues found. Catalog is healthy.</li>}`

### `src/routes/admin-region.tsx`
- Summary: `animate-`×2, `filter`×1, `opacity`×4
  - L196: `filter` → `const pending = requests.filter((r) => r.status === "pending");`
  - L241: `animate-` → `<Loader2 className="size-5 animate-spin" />`
  - L276: `opacity` → `className="inline-flex items-center gap-1.5 rounded-xl border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs text-accent hover:brightness-110 disabled:opacity-60"`
  - L283: `opacity` → `className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs hover:bg-white/5 disabled:opacity-60"`
  - L332: `opacity` → `className="rounded-lg border border-border px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider hover:border-accent/40 disabled:opacity-40"`
  - L396: `animate-` → `<Loader2 className="size-5 animate-spin" />`
  - L419: `opacity` → `className="rounded-xl border border-border px-3 py-1.5 text-[11px] font-mono uppercase tracking-widest hover:border-accent/40 disabled:opacity-50"`

### `src/routes/admin-reports.tsx`
- Summary: `filter`×1, `opacity`×1
  - L56: `filter` → `const r = orders.filter((o) => o.status === "refunded" || o.status === "returned");`
  - L95: `opacity` → `<button onClick={() => run(r.id)} disabled={busy === r.id} className="mt-4 inline-flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 rounded-full text-xs uppercase `

### `src/routes/admin-returns.tsx`
- Summary: `animate-`×1, `filter`×10
  - L44: `filter` → `const [filter, setFilter] = useState<Filter>("All");`
  - L76: `filter` → `const filtered = useMemo(`
  - L77: `filter` → `() => (returns ?? []).filter((r) => matchesFilter(r, filter)),`
  - L78: `filter` → `[returns, filter],`
  - L83: `filter` → `for (const f of FILTERS) map[f] = (returns ?? []).filter((r) => matchesFilter(r, f)).length;`
  - L87: `filter` → `const active = useMemo(() => filtered.find((r) => r.id === activeId) ?? (returns ?? []).find((r) => r.id === activeId) ?? null, [filtered, returns, activeId]);`
  - L104: `filter` → `filter === f`
  - L111: `filter` → `<span className={`text-[9px] ${filter === f ? "text-accent" : "text-muted-foreground/70"}`}>`
  - L120: `animate-` → `<Loader2 className="size-4 animate-spin text-muted-foreground" />`
  - L121: `filter` → `) : filtered.length === 0 ? (`
  - L125: `filter` → `{filtered.map((r) => (`

### `src/routes/admin-search.tsx`
- Summary: `animate-`×1, `filter`×1, `opacity`×1
  - L36: `filter` → `const noResults = ranked.filter((r) => r.zero / r.total > 0.5).slice(0, 20);`
  - L46: `animate-` → `{rows === null ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> :`
  - L75: `opacity` → `{noResults.length === 0 && <li className="px-5 py-8 text-center text-xs text-muted-foreground"><Search className="size-4 mx-auto mb-2 opacity-30" /> No zero-result queries.</li>}`

### `src/routes/admin-security.tsx`
- Summary: `animate-`×2, `filter`×15, `opacity`×5, `translate`×1
  - L39: `filter` → `() => new Set(locks.filter((l) => l.locked).map((l) => l.user_id)),`
  - L44: `filter` → `const openA = alerts.filter((a) => a.status === "open" || a.status === "reviewing");`
  - L47: `filter` → `critical: openA.filter((a) => a.severity === "critical").length,`
  - L48: `filter` → `high: openA.filter((a) => a.severity === "high").length,`
  - L51: `filter` → `resolved: alerts.filter((a) => a.status === "resolved" || a.status === "dismissed").length,`
  - L55: `filter` → `const filtered = useMemo(() => {`
  - L58: `filter` → `.filter((a) => (typeFilter === "all" ? true : a.fraud_type === typeFilter))`
  - L59: `filter` → `.filter((a) => (sevFilter === "all" ? true : a.severity === sevFilter))`
  - L60: `filter` → `.filter((a) => {`
  - L65: `filter` → `.filter((a) => !term ||`
  - L104: `filter` → `const rows = filtered.map((a) => ({`
  - L117: `animate-` → `<Loader2 className="size-6 animate-spin text-accent" />`
  - L133: `animate-` → `<RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} /> Scan`
  - L157: `filter` → `const count = alerts.filter((a) => a.fraud_type === t && (a.status === "open" || a.status === "reviewing")).length;`
  - L179: `translate` → `<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />`
  - L205: `filter` → `{filtered.length === 0 && (`
  - L208: `filter` → `No alerts match the current filters.`
  - L211: `filter` → `{filtered.map((a) => {`
  - L245: `opacity` → `<button disabled={busy === a.id} onClick={() => changeStatus(a, "reviewing")} className="inline-flex items-center gap-1 rounded-lg border border-amber-400/30 bg-amber-400/10 px-2.5`
  - L249: `opacity` → `<button disabled={busy === a.id} onClick={() => changeStatus(a, "resolved")} className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-`
  - … 3 more matching lines omitted for brevity

### `src/routes/admin-seed.tsx`
- Summary: `animate-`×3, `opacity`×3, `scale`×4, `transform`×1, `translate`×1
  - L38: `scale` → `const [scale, setScale] = useState(1);`
  - L65: `scale` → `await seedAllFn({ data: { scale } } as any);`
  - L124: `transform` → `<span className={`absolute top-1 left-1 size-5 rounded-full bg-background transition-transform ${status?.includeInAnalytics ? "translate-x-5" : ""}`} />`
  - L124: `translate` → `<span className={`absolute top-1 left-1 size-5 rounded-full bg-background transition-transform ${status?.includeInAnalytics ? "translate-x-5" : ""}`} />`
  - L136: `scale` → `<input type="range" min={0.5} max={5} step={0.5} value={scale}`
  - L138: `scale` → `<span className="text-xs font-mono w-8">{scale}×</span>`
  - L140: `opacity` → `className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium disabled:opacity-50">`
  - L141: `animate-` → `{busy === "all" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}`
  - L167: `opacity` → `className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-xs disabled:opacity-50">`
  - L168: `animate-` → `{busy === g.kind ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}`
  - L188: `opacity` → `className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium disabled:opacity-50">`
  - L189: `animate-` → `{busy === "remove" ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}`

### `src/routes/admin-seo-health.tsx`
- Summary: `animate-`×4, `opacity`×3, `rotate`×1
  - L80: `rotate` → `<svg viewBox="0 0 36 36" className="size-16 -rotate-90">`
  - L103: `opacity` → `className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-xs font-medium text-accent-foreground disabled:opacity-50"`
  - L105: `animate-` → `{busy === "seo" ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}`
  - L111: `opacity` → `className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-xs font-medium disabled:opacity-50"`
  - L113: `animate-` → `{busy === "alt" ? <Loader2 className="size-3.5 animate-spin" /> : <ImageIcon className="size-3.5" />}`
  - L119: `opacity` → `className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-xs font-medium disabled:opacity-50"`
  - L121: `animate-` → `<RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} /> Validate`
  - L127: `animate-` → `<div className="p-8"><Loader2 className="size-4 animate-spin text-muted-foreground" /></div>`

### `src/routes/admin-seo-intelligence.tsx`
- Summary: `animate-`×3
  - L117: `animate-` → `<RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh`
  - L120: `animate-` → `<RotateCcw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} /> Sync Search Console`
  - L125: `animate-` → `<div className="flex items-center justify-center py-20 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>`

### `src/routes/admin-serviceability.tsx`
- Summary: `animate-`×1
  - L128: `animate-` → `<div className="grid place-items-center py-20"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>`

### `src/routes/admin-shipments.tsx`
- Summary: `animate-`×5, `blur`×2, `contain`×1, `filter`×26, `opacity`×8, `rotate`×1, `shadow-`×3, `transform`×1, `translate`×2
  - L191: `shadow-` → `<span className={`size-2 rounded-full shrink-0 transition-colors duration-300 ${done ? "bg-accent shadow-[0_0_8px_color-mix(in_oklab,var(--accent)_60%,transparent)]" : "bg-border"}`
  - L224: `filter` → `type ExportScope = "selected" | "filtered" | "all";`
  - L233: `contain` → `const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };`
  - L237: `filter` → `const scope: ExportScope = selectedCount > 0 ? "selected" : "filtered";`
  - L238: `filter` → `const scopeLabel = selectedCount > 0 ? `${selectedCount} selected` : "filtered view";`
  - L249: `transform` → `<Download className="size-3.5" /> Export <ChevronDown className={`size-3 transition-transform ${open ? "rotate-180" : ""}`} />`
  - L249: `rotate` → `<Download className="size-3.5" /> Export <ChevronDown className={`size-3 transition-transform ${open ? "rotate-180" : ""}`} />`
  - L252: `shadow-` → `<div className="absolute right-0 z-30 mt-1.5 w-56 rounded-xl border border-border bg-background/95 backdrop-blur-xl p-1.5 shadow-xl">`
  - L252: `blur` → `<div className="absolute right-0 z-30 mt-1.5 w-56 rounded-xl border border-border bg-background/95 backdrop-blur-xl p-1.5 shadow-xl">`
  - L292: `opacity` → `<span className={`absolute inline-flex h-full w-full rounded-full opacity-60 ${online ? "bg-emerald-400 animate-ping" : "bg-muted-foreground"}`} />`
  - L292: `animate-` → `<span className={`absolute inline-flex h-full w-full rounded-full opacity-60 ${online ? "bg-emerald-400 animate-ping" : "bg-muted-foreground"}`} />`
  - L308: `shadow-` → `<span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_color-mix(in_oklab,var(--accent)_60%,transparent)]" />`
  - L456: `filter` → `.filter((n) => /ship|order|deliver/i.test(`${n.type} ${n.title}`))`
  - L559: `filter` → `.filter((pair) => pairMatchesQueue(pair, queue, delayById))`
  - L560: `filter` → `.filter((pair) => pairMatchesSearch(pair, term));`
  - L567: `filter` → `const waitingToday = shipments.filter((s) => s.status === "out_for_delivery" || (s.estimated_delivery && isSameDay(s.estimated_delivery) && !["delivered", "cancelled"].includes(s.s`
  - L568: `filter` → `const delayedCustomers = shipments.filter((s) => delayById.get(s.id)?.delayed).length;`
  - L569: `filter` → `const failed = shipments.filter((s) => s.status === "failed_delivery").length;`
  - L570: `filter` → `const returns = shipments.filter((s) => s.status === "returned").length;`
  - L571: `filter` → `const pendingRefunds = (orders ?? []).filter((o) => ["returned", "cancelled"].includes(o.status) && (o.payment_status === "succeeded" || o.payment_status === "paid")).length;`
  - … 29 more matching lines omitted for brevity

### `src/routes/admin-support.tsx`
- Summary: `animate-`×5, `blur`×1, `filter`×28, `opacity`×3, `shadow-`×1, `translate`×2
  - L138: `filter` → `setFraudUsers(new Set(((fr.data as { subject_id: string | null; subject_type: string | null }[]) ?? []).filter((f) => f.subject_type === "user").map((f) => f.subject_id).filter(Boo`
  - L216: `filter` → `}).filter((m) => m.lastActiveAt || m.id === user?.id)`
  - L225: `filter` → `.filter((e) => e.firstStaffReplyAt != null && sameDay(e.firstStaffReplyAt) && e.firstReply.answeredInMin != null)`
  - L235: `filter` → `const list = enriched.filter((e) => {`
  - L259: `filter` → `s === "all" ? enriched.length : s === "overdue" ? enriched.filter((e) => e.sla.overdue).length : enriched.filter((e) => e.stage === s).length;`
  - L291: `animate-` → `<div className="grid place-items-center py-20"><Loader2 className="size-5 animate-spin text-accent" /></div>`
  - L360: `filter` → `const list = numbers.split("\n").map((n) => n.trim()).filter(Boolean).slice(0, 10);`
  - L414: `opacity` → `className="bg-accent text-accent-foreground rounded-full px-6 py-2.5 text-xs uppercase tracking-widest font-bold disabled:opacity-50 hover:brightness-110 transition-all inline-flex`
  - L415: `animate-` → `{saving ? <><Loader2 className="size-4 animate-spin" /> Saving…</> : "Save settings"}`
  - L423: `filter` → `const critical = enriched.filter((e) => e.sla.critical).slice(0, 6);`
  - L424: `filter` → `const escalations = enriched.filter((e) => e.escalations.length && e.stage !== "resolved" && e.stage !== "closed").slice(0, 6);`
  - L428: `filter` → `const openTickets = enriched.filter(isOpen);`
  - L431: `filter` → `waitingCustomer: openTickets.filter((e) => e.stage === "pending_customer").length,`
  - L432: `filter` → `waitingStaff: openTickets.filter((e) => !isStaffSender(e.lastSenderRole)).length,`
  - L433: `filter` → `breached: openTickets.filter((e) => e.firstReply.status === "breached").length,`
  - L434: `filter` → `dueSoon: openTickets.filter((e) => e.firstReply.status === "due_soon").length,`
  - L435: `filter` → `unassigned: openTickets.filter((e) => !e.ticket.assigned_to).length,`
  - L436: `filter` → `urgent: openTickets.filter((e) => e.sla.priority === "urgent").length,`
  - L438: `filter` → `const breachedList = openTickets.filter((e) => e.firstReply.status === "breached").slice(0, 6);`
  - L520: `translate` → `<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />`
  - … 20 more matching lines omitted for brevity

### `src/routes/admin-system-health.tsx`
- Summary: `animate-`×2
  - L98: `animate-` → `<RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />`
  - L104: `animate-` → `<Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading system health…`

### `src/routes/admin-traffic.tsx`
- Summary: `animate-`×3, `filter`×4, `rotate`×1
  - L65: `rotate` → `<svg viewBox="0 0 36 36" className="size-20 -rotate-90">`
  - L89: `animate-` → `<span className="size-1.5 rounded-full bg-accent animate-pulse" /> Live · {data?.live.active ?? 0}`
  - L90: `animate-` → `{refreshing && <Loader2 className="size-3 animate-spin" />}`
  - L101: `animate-` → `<div className="flex items-center justify-center py-32"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>`
  - L247: `filter` → `const converting = [...data.products].filter((p) => p.purchases > 0).sort((a, b) => b.conversion - a.conversion).slice(0, 8);`
  - L248: `filter` → `const lowConv = [...data.products].filter((p) => p.views >= 5).sort((a, b) => a.conversion - b.conversion).slice(0, 8);`
  - L249: `filter` → `const abandoned = [...data.products].filter((p) => p.addToCart > 0).sort((a, b) => (b.addToCart - b.purchases) - (a.addToCart - a.purchases)).slice(0, 8);`
  - L380: `filter` → `const problem = data.devices.filter((d) => d.sessions > 5 && d.bounceRate > 65);`

### `src/routes/admin-users.tsx`
- Summary: `animate-`×3, `blur`×1, `filter`×12, `shadow-`×1, `transform`×1, `translate`×1
  - L41: `animate-` → `return <span className={`inline-block size-2 rounded-full ${map[status]} ${status === "online" ? "animate-pulse" : ""}`} />;`
  - L82: `transform` → `th{background:#f4f4f5;text-transform:uppercase;font-size:9px;letter-spacing:.05em}`
  - L115: `shadow-` → `<div className="absolute right-0 mt-1 z-20 w-32 rounded-lg border border-border bg-popover shadow-lg overflow-hidden">`
  - L168: `blur` → `<div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} />`
  - L246: `filter` → `const filtered = useMemo(() => {`
  - L248: `filter` → `return data.users.filter((u) => {`
  - L259: `filter` → `<Card actions={<ExportMenu rows={filtered} name="user-directory" />} title={`Directory · ${filtered.length}`} icon={<Users className="size-4 text-accent" />}>`
  - L262: `translate` → `<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />`
  - L277: `filter` → `{filtered.length === 0 ? <p className="text-xs text-muted-foreground p-4 text-center">No users match.</p>`
  - L278: `filter` → `: filtered.slice(0, 300).map((u) => <UserRow key={u.id} u={u} onClick={() => onSelect(u)} />)}`
  - L290: `animate-` → `<div className="min-h-[50vh] grid place-items-center"><Loader2 className="size-5 animate-spin text-accent" /></div>`
  - L303: `filter` → `const online = data.users.filter((u) => u.onlineStatus !== "offline").sort((a, b) => (b.lastActivityAt ?? 0) - (a.lastActivityAt ?? 0));`
  - L312: `animate-` → `{refreshing && <Loader2 className="size-3.5 animate-spin text-accent" />}`
  - L364: `filter` → `<p className="text-[11px] text-muted-foreground mb-2">Reactivation target — {b.users.filter((u) => u.ordersCount > 0).length} are past buyers worth {inr(b.users.reduce((x, u) => x `
  - L412: `filter` → `{data.users.filter((u) => u.multiCountry).length === 0 ? <p className="text-[11px] text-muted-foreground">None detected.</p>`
  - L413: `filter` → `: <div className="divide-y divide-border/50 -mx-2 max-h-80 overflow-y-auto">{data.users.filter((u) => u.multiCountry).map((u) => <UserRow key={u.id} u={u} onClick={() => setSel(u)}`
  - L416: `filter` → `{data.users.filter((u) => u.multiDevice).length === 0 ? <p className="text-[11px] text-muted-foreground">None detected.</p>`
  - L417: `filter` → `: <div className="divide-y divide-border/50 -mx-2 max-h-80 overflow-y-auto">{data.users.filter((u) => u.multiDevice).map((u) => <UserRow key={u.id} u={u} onClick={() => setSel(u)} `
  - L421: `filter` → `{data.staff.filter((u) => u.lastAdminAction).sort((a, b) => (b.lastAdminAction ?? 0) - (a.lastAdminAction ?? 0)).map((u) => (`

### `src/routes/admin-vendors.tsx`
- Summary: `animate-`×2, `filter`×4, `opacity`×3
  - L47: `filter` → `active: m.vendors.filter((v) => v.status === "active").length,`
  - L50: `filter` → `.filter((c) => c.status === "pending")`
  - L53: `filter` → `.filter((p) => p.status === "pending")`
  - L55: `filter` → `openTickets: m.tickets.filter((t) => t.status === "open").length,`
  - L65: `animate-` → `return <div className="min-h-[40vh] grid place-items-center"><Loader2 className="size-5 animate-spin text-accent" /></div>;`
  - L81: `opacity` → `initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}`
  - L105: `opacity` → `className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${enabled ? "bg-white/5 border border-white/10 hover:b`
  - L107: `animate-` → `{busy ? <Loader2 className="size-4 animate-spin" /> : <Power className="size-4" />}`
  - L134: `opacity` → `<span className="text-[10px] opacity-70">{t.count}</span>`

### `src/routes/admin.tsx`
- Summary: `animate-`×11, `blur`×7, `filter`×6, `mask`×1, `opacity`×17, `scale`×4, `shadow-`×4, `translate`×1
  - L126: `filter` → `setSubscribers((prev) => prev?.filter((s) => s.id !== id) ?? null);`
  - L188: `animate-` → `return <div className="min-h-[60vh] grid place-items-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>;`
  - L228: `translate` → `<div className="orb absolute -top-32 left-1/2 -translate-x-1/2 size-[40rem] opacity-40" style={{ background: "var(--gradient-ember)" }} />`
  - L228: `opacity` → `<div className="orb absolute -top-32 left-1/2 -translate-x-1/2 size-[40rem] opacity-40" style={{ background: "var(--gradient-ember)" }} />`
  - L229: `opacity` → `<div className="orb absolute top-1/3 -right-40 size-[30rem] opacity-25" style={{ background: "radial-gradient(circle, oklch(0.55 0.18 280 / 0.5), transparent 70%)" }} />`
  - L230: `opacity` → `<div className="orb absolute bottom-0 -left-40 size-[34rem] opacity-25" style={{ background: "var(--gradient-ember-soft)" }} />`
  - L231: `opacity` → `<div className="absolute inset-0 opacity-[0.5]" style={{ background: "radial-gradient(ellipse at 50% 0%, transparent 40%, oklch(0.1 0.01 260 / 0.6) 100%)" }} />`
  - L235: `filter` → `initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}`
  - L235: `opacity` → `initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}`
  - L235: `blur` → `initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}`
  - L236: `filter` → `animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}`
  - L236: `opacity` → `animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}`
  - L236: `blur` → `animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}`
  - L238: `shadow-` → `className="relative overflow-hidden rounded-[1.75rem] glass-strong glass-reflect noise-layer p-6 md:p-10 mb-8 shadow-[var(--shadow-float),0_40px_120px_-40px_oklch(0.74_0.19_49/0.25`
  - L240: `opacity` → `<div className="orb absolute -top-24 -left-24 size-72 opacity-60 animate-orb" style={{ background: "var(--gradient-ember-soft)" }} />`
  - L240: `animate-` → `<div className="orb absolute -top-24 -left-24 size-72 opacity-60 animate-orb" style={{ background: "var(--gradient-ember-soft)" }} />`
  - L241: `opacity` → `<div className="orb absolute -bottom-32 -right-20 size-80 opacity-40 animate-orb" style={{ background: "radial-gradient(circle, oklch(0.55 0.18 280 / 0.5), transparent 70%)" }} />`
  - L241: `animate-` → `<div className="orb absolute -bottom-32 -right-20 size-80 opacity-40 animate-orb" style={{ background: "radial-gradient(circle, oklch(0.55 0.18 280 / 0.5), transparent 70%)" }} />`
  - L242: `opacity` → `<div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(oklch(1 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0) 1px, transparent`
  - L242: `mask` → `<div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(oklch(1 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0) 1px, transparent`
  - … 31 more matching lines omitted for brevity

### `src/routes/api/public/razorpay-webhook.ts`
- Summary: `filter`×2
  - L91: `filter` → `const slugs = [...new Set((items ?? []).map((i: any) => i.product_slug).filter(Boolean))];`
  - L322: `filter` → `? [token.vpa.username, token.vpa.handle].filter(Boolean).join("@")`

### `src/routes/auth.callback.tsx`
- Summary: `blur`×1, `filter`×1, `opacity`×3, `rotate`×1, `scale`×2, `shadow-`×3, `translate`×1
  - L99: `translate` → `className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] max-w-[600px] h-[50vh] rounded-full opacity-25"`
  - L99: `opacity` → `className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] max-w-[600px] h-[50vh] rounded-full opacity-25"`
  - L102: `filter` → `filter: "blur(110px)",`
  - L102: `blur` → `filter: "blur(110px)",`
  - L108: `opacity` → `initial={{ opacity: 0, y: 12 }}`
  - L109: `opacity` → `animate={{ opacity: 1, y: 0 }}`
  - L114: `shadow-` → `<div className="size-20 rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-[0_20px_60px_-12px_rgba(255,122,0,0.4)] bg-white/[0.04] grid place-items-center">`
  - L122: `rotate` → `animate={{ rotate: 360 }}`
  - L128: `scale` → `initial={{ scale: 0 }}`
  - L129: `scale` → `animate={{ scale: 1 }}`
  - L131: `shadow-` → `className="absolute -bottom-1 -right-1 size-7 rounded-full grid place-items-center shadow-[0_0_18px_rgba(255,122,0,0.6)]"`
  - L169: `shadow-` → `className="px-6 py-3 rounded-full text-sm font-semibold text-black shadow-[0_10px_30px_-10px_rgba(255,122,0,0.6)] hover:brightness-110 transition-all"`

### `src/routes/auth.tsx`
- Summary: `animate-`×3, `blur`×7, `filter`×3, `opacity`×25, `rotate`×2, `scale`×6, `shadow-`×6, `transform`×1, `translate`×5
  - L198: `opacity` → `initial={{ opacity: 0 }}`
  - L199: `opacity` → `animate={{ opacity: 0.22 }}`
  - L201: `translate` → `className="absolute top-[6%] left-1/2 -translate-x-1/2 w-[95vw] max-w-[720px] h-[58vh] rounded-full"`
  - L204: `filter` → `filter: "blur(120px)",`
  - L204: `blur` → `filter: "blur(120px)",`
  - L208: `opacity` → `className="absolute bottom-[2%] right-[-10%] w-[55vw] max-w-[480px] h-[40vh] rounded-full opacity-[0.14]"`
  - L211: `filter` → `filter: "blur(90px)",`
  - L211: `blur` → `filter: "blur(90px)",`
  - L216: `opacity` → `className="absolute inset-0 opacity-[0.025] mix-blend-overlay"`
  - L225: `opacity` → `initial={{ opacity: 0, y: 14 }}`
  - L226: `opacity` → `animate={{ opacity: 1, y: 0 }}`
  - L236: `scale` → `animate={{ opacity: [0.45, 0.8, 0.45], scale: [1, 1.08, 1] }}`
  - L236: `opacity` → `animate={{ opacity: [0.45, 0.8, 0.45], scale: [1, 1.08, 1] }}`
  - L241: `filter` → `filter: "blur(22px)",`
  - L241: `blur` → `filter: "blur(22px)",`
  - L244: `shadow-` → `<div className="relative size-[76px] rounded-[20px] overflow-hidden ring-1 ring-white/15 shadow-[0_24px_70px_-14px_rgba(255,122,0,0.55),inset_0_1px_0_rgba(255,255,255,0.08)] bg-whi`
  - L248: `rotate` → `initial={{ scale: 0, rotate: -20 }}`
  - L248: `scale` → `initial={{ scale: 0, rotate: -20 }}`
  - L249: `rotate` → `animate={{ scale: 1, rotate: 0 }}`
  - L249: `scale` → `animate={{ scale: 1, rotate: 0 }}`
  - … 38 more matching lines omitted for brevity

### `src/routes/blog.$slug.tsx`
- Summary: `animate-`×1
  - L90: `animate-` → `if (loading) return <div className="min-h-[60vh] grid place-items-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>;`

### `src/routes/blog.tsx`
- Summary: `animate-`×1, `scale`×1, `transform`×1
  - L46: `animate-` → `<div className="py-24 grid place-items-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>`
  - L55: `transform` → `<img src={p.cover_image} alt={`${p.title} — article cover`} className="size-full object-cover group-hover:scale-105 transition-transform duration-700" />`
  - L55: `scale` → `<img src={p.cover_image} alt={`${p.title} — article cover`} className="size-full object-cover group-hover:scale-105 transition-transform duration-700" />`

### `src/routes/cart.tsx`
- Summary: `animate-`×3, `blur`×2, `opacity`×9, `rotate`×1, `scale`×7, `shadow-`×3, `transform`×4, `translate`×1
  - L92: `scale` → `initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}`
  - L92: `opacity` → `initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}`
  - L118: `animate-` → `<div className="mb-8 h-9 w-44 animate-pulse rounded-lg bg-white/10" />`
  - L121: `animate-` → `<div key={i} className="h-24 animate-pulse rounded-2xl bg-white/[0.06]" />`
  - L150: `opacity` → `initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}`
  - L182: `opacity` → `initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}`
  - L183: `opacity` → `exit={{ opacity: 0, x: -40, transition: { duration: 0.2 } }}`
  - L227: `transform` → `<button onClick={() => setQty(item.slug, item.qty - 1)} aria-label="Decrease" className="size-9 grid place-items-center hover:text-accent active:scale-90 transition-transform">`
  - L227: `scale` → `<button onClick={() => setQty(item.slug, item.qty - 1)} aria-label="Decrease" className="size-9 grid place-items-center hover:text-accent active:scale-90 transition-transform">`
  - L230: `scale` → `<motion.span key={item.qty} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="w-8 text-center text-xs font-mono">{item.qty}</motion.span>`
  - L235: `transform` → `className="size-9 grid place-items-center hover:text-accent active:scale-90 transition-transform disabled:opacity-40"`
  - L235: `scale` → `className="size-9 grid place-items-center hover:text-accent active:scale-90 transition-transform disabled:opacity-40"`
  - L235: `opacity` → `className="size-9 grid place-items-center hover:text-accent active:scale-90 transition-transform disabled:opacity-40"`
  - L332: `opacity` → `initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}`
  - L357: `scale` → `<motion.dd key={total} initial={{ scale: 1.08 }} animate={{ scale: 1 }} className="font-mono text-accent">{format(total)}</motion.dd>`
  - L363: `opacity` → `className={`group w-full mt-5 bg-accent text-accent-foreground font-bold py-3.5 rounded-full text-xs uppercase tracking-widest hover:brightness-110 transition-all inline-flex items`
  - L363: `shadow-` → `className={`group w-full mt-5 bg-accent text-accent-foreground font-bold py-3.5 rounded-full text-xs uppercase tracking-widest hover:brightness-110 transition-all inline-flex items`
  - L366: `transform` → `<ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />`
  - L366: `translate` → `<ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />`
  - L406: `shadow-` → `className="pointer-events-auto rounded-2xl p-1 pl-4 flex items-center gap-3 border border-white/10 shadow-[0_24px_60px_-18px_oklch(0_0_0/0.9),0_0_28px_-14px_hsl(var(--accent)/0.45)`
  - … 10 more matching lines omitted for brevity

### `src/routes/categories.tsx`
- Summary: `blur`×1, `contain`×2, `filter`×1, `scale`×1, `transform`×2, `translate`×1
  - L24: `contain` → `unless they actually contain real products. */`
  - L75: `contain` → `style={{ contentVisibility: "auto", containIntrinsicSize: "360px" }}`
  - L84: `transform` → `className="size-full object-cover [transition:transform_700ms_cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"`
  - L84: `scale` → `className="size-full object-cover [transition:transform_700ms_cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"`
  - L120: `blur` → `<span className="mt-auto inline-flex h-8 w-fit items-center gap-1 rounded-full border border-accent/40 bg-white/[0.04] px-3.5 text-[13px] font-semibold text-accent backdrop-blur-sm`
  - L122: `transform` → `<ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />`
  - L122: `translate` → `<ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />`
  - L154: `filter` → `.filter((cat) => !isPlaceholder(cat) || totalFor(cat) > 0)`

### `src/routes/category.$main.$sub.tsx`
- Summary: `animate-`×1, `blur`×1, `filter`×1, `opacity`×2
  - L57: `filter` → `() => products.filter((p) => p.category === sub || (p.categories ?? []).includes(sub)),`
  - L88: `opacity` → `<div aria-hidden className="absolute -right-16 -top-16 size-64 rounded-full blur-3xl opacity-40" style={{ background: "var(--gradient-ember)" }} />`
  - L88: `blur` → `<div aria-hidden className="absolute -right-16 -top-16 size-64 rounded-full blur-3xl opacity-40" style={{ background: "var(--gradient-ember)" }} />`
  - L90: `opacity` → `<img src={cat.banner_image} alt="" loading="lazy" className="absolute inset-0 size-full object-cover opacity-25" />`
  - L101: `animate-` → `<div className="py-24 grid place-items-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>`

### `src/routes/category.$slug.tsx`
- Summary: `animate-`×1, `blur`×3, `box-shadow`×1, `filter`×2, `opacity`×2, `shadow-`×1
  - L66: `filter` → `() => products.filter((p) => matches(p, slug) || childSlugs.some((c) => matches(p, c))).length,`
  - L83: `filter` → `() => products.filter((p) => matches(p, slug)),`
  - L113: `opacity` → `<div aria-hidden className="absolute -right-16 -top-16 size-64 rounded-full blur-3xl opacity-40" style={{ background: "var(--gradient-ember)" }} />`
  - L113: `blur` → `<div aria-hidden className="absolute -right-16 -top-16 size-64 rounded-full blur-3xl opacity-40" style={{ background: "var(--gradient-ember)" }} />`
  - L115: `opacity` → `<img src={cat.banner_image} alt="" loading="lazy" className="absolute inset-0 size-full object-cover opacity-25" />`
  - L121: `blur` → `<span className="rounded-full border border-accent/30 bg-background/40 px-3 py-1 text-xs text-muted-foreground backdrop-blur">`
  - L125: `blur` → `<span className="rounded-full border border-accent/30 bg-background/40 px-3 py-1 text-xs text-muted-foreground backdrop-blur">`
  - L134: `animate-` → `<div className="py-24 grid place-items-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>`
  - L147: `box-shadow` → `className="group product-card-glass relative flex flex-col overflow-hidden rounded-3xl p-0 transition-[box-shadow,border-color] duration-300 hover:shadow-[0_18px_50px_-12px_color-m`
  - L147: `shadow-` → `className="group product-card-glass relative flex flex-col overflow-hidden rounded-3xl p-0 transition-[box-shadow,border-color] duration-300 hover:shadow-[0_18px_50px_-12px_color-m`

### `src/routes/checkout.tsx`
- Summary: `animate-`×11, `animation`×1, `blur`×2, `contain`×1, `filter`×5, `opacity`×10, `scale`×8, `shadow-`×2, `transform`×3, `translate`×3
  - L344: `filter` → `payment_options: "all-enabled (no client method filter)",`
  - L392: `filter` → `// IMPORTANT: No custom `config.display` and no `method` filter.`
  - L462: `contain` → `// NOTE: Do not log the Razorpay config or payload — it contains customer`
  - L499: `filter` → `// account supports for this currency (no client-side filtering applied).`
  - L510: `filter` → `metadata: { currency: created.currency, region: created.debug?.market ?? null, filter: "none" },`
  - L724: `animate-` → `return <div className="min-h-[60vh] grid place-items-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>;`
  - L777: `animate-` → `<Loader2 className="size-3 text-accent shrink-0 animate-spin" />`
  - L813: `opacity` → `initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}`
  - L830: `scale` → `className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-accent inline-flex items-center gap-1.5 transition-colors active:scale-95">`
  - L838: `animate-` → `<div className="h-24 rounded-2xl bg-white/[0.03] animate-pulse" />`
  - L839: `animate-` → `<div className="h-24 rounded-2xl bg-white/[0.03] animate-pulse" />`
  - L897: `filter` → `{[selectedAddress.line1, selectedAddress.line2, selectedAddress.city, selectedAddress.state, selectedAddress.postal].filter(Boolean).join(", ")}`
  - L918: `scale` → `<motion.button type="button" onClick={() => setPayMethod("razorpay")} whileTap={{ scale: 0.99 }}`
  - L919: `shadow-` → `className={`w-full text-left border rounded-2xl p-4 transition-all duration-300 ${payMethod === "razorpay" ? "border-accent bg-accent/[0.07] shadow-[0_0_0_1px_var(--color-accent),0`
  - L924: `scale` → `<motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="size-2 rounded-full bg-accent" />`
  - L947: `opacity` → `<div className={`mt-3 w-full text-left border rounded-2xl p-4 transition-all duration-300 ${!codAllowed ? "opacity-50" : payMethod === "cod" ? "border-accent bg-accent/[0.07]" : "b`
  - L965: `opacity` → `<span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-1 opacity-50"><CreditCard className="size-3" /> EMI off</span>`
  - L966: `opacity` → `<span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-1 opacity-50"><Clock className="size-3" /> Pay Later off</span>`
  - L1045: `opacity` → `className="hidden lg:inline-flex w-full mt-5 min-h-[56px] group relative overflow-hidden bg-accent text-accent-foreground font-bold py-3.5 rounded-full text-xs uppercase tracking-w`
  - L1046: `animate-` → `{busy ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-3.5" />}`
  - … 26 more matching lines omitted for brevity

### `src/routes/compare.tsx`
- Summary: `filter`×1, `opacity`×1
  - L28: `filter` → `.filter((p): p is Product => Boolean(p));`
  - L158: `opacity` → `className="w-full inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground px-4 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest hover:brig`

### `src/routes/continue-shopping.tsx`
- Summary: `animate-`×2, `blur`×2, `filter`×5, `opacity`×6, `shadow-`×4
  - L88: `opacity` → `className="w-full h-full object-cover transition-opacity duration-500"`
  - L90: `blur` → `<span className={`product-typography absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium backdrop-blur ${meta.tone}`}>`
  - L94: `blur` → `<span className="product-typography absolute right-2 top-2 inline-flex items-center rounded-full bg-background/85 backdrop-blur px-2 py-0.5 text-[10px] font-semibold text-muted-for`
  - L119: `shadow-` → `className="mt-3 inline-flex h-11 sm:h-12 w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-accent px-4 sm:px-5 text-[11px] sm:text-xs font-semibol`
  - L135: `filter` → `const [filter, setFilter] = useState<FilterKey>("all");`
  - L239: `filter` → `const filtered = filter === "all" ? entries : entries.filter((e) => e.kind === filter);`
  - L240: `filter` → `const sorted = [...filtered];`
  - L245: `filter` → `}, [entries, filter, sort, priceOf]);`
  - L259: `opacity` → `<motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>`
  - L279: `shadow-` → `<Link to="/auth" className="inline-flex items-center gap-2 bg-accent text-accent-foreground rounded-full px-6 py-3 text-[11px] uppercase tracking-widest font-bold hover:brightness-`
  - L291: `filter` → `const active = filter === f.key;`
  - L297: `opacity` → `className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed ${`
  - L298: `shadow-` → `active ? "bg-accent text-accent-foreground shadow-[var(--shadow-ember)]" : "border border-border hover:border-accent/40 hover:text-accent"`
  - L302: `opacity` → `<span className={`text-[10px] tabular-nums ${active ? "opacity-80" : "text-muted-foreground"}`}>{n}</span>`
  - L321: `opacity` → `initial={{ opacity: 0 }}`
  - L322: `opacity` → `animate={{ opacity: 1 }}`
  - L337: `animate-` → `<div className="size-16 mx-auto mb-5 grid place-items-center rounded-full bg-accent/15 border border-accent/30 text-accent animate-[float-soft_3s_ease-in-out_infinite]">`
  - L344: `shadow-` → `<Link to="/" className="inline-flex items-center gap-2 bg-accent text-accent-foreground rounded-full px-6 py-3 text-[11px] uppercase tracking-widest font-bold hover:brightness-110 `
  - L353: `animate-` → `<div key={i} className="aspect-[3/4] rounded-2xl bg-white/[0.05] animate-pulse" />`

### `src/routes/deals.tsx`
- Summary: `animate-`×6, `animation`×2, `blur`×4, `contain`×1, `filter`×5, `opacity`×10, `scale`×6, `shadow-`×3, `transform`×2, `translate`×2
  - L37: `opacity` → `initial: { opacity: 0, y: 14 },`
  - L38: `opacity` → `animate: { opacity: 1, y: 0 },`
  - L76: `filter` → `.filter((i) => i.product.flashDeal || i.product.hotDeal)`
  - L93: `filter` → `() => (activeCat === "all" ? dealProducts : dealProducts.filter((p) => p.category === activeCat)),`
  - L106: `animate-` → `<Loader2 className="size-5 animate-spin text-muted-foreground" />`
  - L115: `animate-` → `<div className="orb animate-orb -top-[10%] left-[10%] size-[60vw] max-w-[520px]" style={{ background: "var(--gradient-ember)" }} />`
  - L116: `animate-` → `<div className="orb animate-orb [animation-delay:-8s] top-[30%] right-[5%] size-[50vw] max-w-[440px]" style={{ background: "var(--gradient-violet)" }} />`
  - L116: `animation` → `<div className="orb animate-orb [animation-delay:-8s] top-[30%] right-[5%] size-[50vw] max-w-[440px]" style={{ background: "var(--gradient-violet)" }} />`
  - L119: `opacity` → `className="absolute inset-0 opacity-[0.03] mix-blend-overlay"`
  - L120: `filter` → `style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFr`
  - L124: `contain` → `<div className="container-page py-6 sm:py-10 lg:py-14 space-y-7 sm:space-y-10">`
  - L132: `filter` → `<div className="absolute -top-32 -right-16 size-[440px] rounded-full opacity-60 animate-glow" style={{ background: "var(--gradient-ember)", filter: "blur(90px)" }} />`
  - L132: `opacity` → `<div className="absolute -top-32 -right-16 size-[440px] rounded-full opacity-60 animate-glow" style={{ background: "var(--gradient-ember)", filter: "blur(90px)" }} />`
  - L132: `blur` → `<div className="absolute -top-32 -right-16 size-[440px] rounded-full opacity-60 animate-glow" style={{ background: "var(--gradient-ember)", filter: "blur(90px)" }} />`
  - L132: `animate-` → `<div className="absolute -top-32 -right-16 size-[440px] rounded-full opacity-60 animate-glow" style={{ background: "var(--gradient-ember)", filter: "blur(90px)" }} />`
  - L133: `filter` → `<div className="absolute -bottom-40 -left-24 size-[400px] rounded-full opacity-50 animate-glow [animation-delay:-2s]" style={{ background: "var(--gradient-violet)", filter: "blur(1`
  - L133: `opacity` → `<div className="absolute -bottom-40 -left-24 size-[400px] rounded-full opacity-50 animate-glow [animation-delay:-2s]" style={{ background: "var(--gradient-violet)", filter: "blur(1`
  - L133: `blur` → `<div className="absolute -bottom-40 -left-24 size-[400px] rounded-full opacity-50 animate-glow [animation-delay:-2s]" style={{ background: "var(--gradient-violet)", filter: "blur(1`
  - L133: `animate-` → `<div className="absolute -bottom-40 -left-24 size-[400px] rounded-full opacity-50 animate-glow [animation-delay:-2s]" style={{ background: "var(--gradient-violet)", filter: "blur(1`
  - L133: `animation` → `<div className="absolute -bottom-40 -left-24 size-[400px] rounded-full opacity-50 animate-glow [animation-delay:-2s]" style={{ background: "var(--gradient-violet)", filter: "blur(1`
  - … 21 more matching lines omitted for brevity

### `src/routes/email/unsubscribe.ts`
- Summary: `contain`×1
  - L63: `contain` → `// containing "List-Unsubscribe=One-Click". Email clients (Gmail, Apple Mail,`

### `src/routes/help.seller-assistance.tsx`
- Summary: `animate-`×5, `blur`×17, `opacity`×33, `scale`×8, `shadow-`×7, `transform`×1, `translate`×4
  - L96: `opacity` → `initial={{ opacity: 0.5 }}`
  - L97: `opacity` → `animate={{ opacity: [0.5, 0.75, 0.5] }}`
  - L99: `blur` → `className="absolute -top-32 -left-24 size-[520px] rounded-full blur-[160px]"`
  - L103: `opacity` → `initial={{ opacity: 0.4 }}`
  - L104: `opacity` → `animate={{ opacity: [0.4, 0.6, 0.4] }}`
  - L106: `blur` → `className="absolute top-1/3 -right-32 size-[460px] rounded-full blur-[160px]"`
  - L110: `opacity` → `<div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] bg-`
  - L350: `opacity` → `initial={{ opacity: 0, y: 18 }}`
  - L351: `opacity` → `animate={{ opacity: 1, y: 0 }}`
  - L353: `blur` → `className="relative mt-5 rounded-[28px] border border-white/10 bg-white/[0.025] backdrop-blur-2xl overflow-hidden"`
  - L360: `blur` → `className="absolute -top-24 -right-24 size-[340px] rounded-full blur-[110px]"`
  - L368: `shadow-` → `className="grid place-items-center size-9 rounded-xl border border-white/10 shadow-[0_8px_30px_-10px_rgba(255,122,0,0.6)]"`
  - L392: `blur` → `<span key={b.label} className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur">`
  - L401: `shadow-` → `className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white shadow-[0_10px_30px_-8px_rgba(255,122,0,0.55)] transition hover:brightness-110`
  - L405: `translate` → `<ArrowRight className="size-4 group-hover:translate-x-0.5 transition" />`
  - L425: `opacity` → `initial={{ opacity: 0, y: 14 }}`
  - L426: `opacity` → `whileInView={{ opacity: 1, y: 0 }}`
  - L430: `scale` → `whileTap={{ scale: 0.985 }}`
  - L431: `blur` → `className="group relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 overflow-hidden hover:border-white/20 transition"`
  - L434: `opacity` → `className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-500"`
  - … 55 more matching lines omitted for brevity

### `src/routes/help.tsx`
- Summary: `animate-`×8, `blur`×23, `contain`×1, `filter`×7, `opacity`×30, `rotate`×1, `scale`×5, `shadow-`×10, `transform`×1, `translate`×7
  - L133: `translate` → `<div className="absolute -top-40 left-1/2 -translate-x-1/2 size-[640px] rounded-full blur-3xl opacity-40"`
  - L133: `opacity` → `<div className="absolute -top-40 left-1/2 -translate-x-1/2 size-[640px] rounded-full blur-3xl opacity-40"`
  - L133: `blur` → `<div className="absolute -top-40 left-1/2 -translate-x-1/2 size-[640px] rounded-full blur-3xl opacity-40"`
  - L135: `opacity` → `<div className="absolute top-1/3 -left-20 size-[420px] rounded-full blur-3xl opacity-30"`
  - L135: `blur` → `<div className="absolute top-1/3 -left-20 size-[420px] rounded-full blur-3xl opacity-30"`
  - L137: `opacity` → `<div className="absolute inset-0 opacity-[0.04]"`
  - L143: `opacity` → `animate={{ y: [0, -20, 0], opacity: [0.2, 0.8, 0.2] }}`
  - L159: `opacity` → `<motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}`
  - L160: `blur` → `className="relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden">`
  - L161: `opacity` → `<div aria-hidden className="absolute inset-0 opacity-30"`
  - L165: `opacity` → `<span className="absolute inset-0 rounded-full animate-ping opacity-70" style={{ background: color }} />`
  - L165: `animate-` → `<span className="absolute inset-0 rounded-full animate-ping opacity-70" style={{ background: color }} />`
  - L215: `blur` → `className="group relative text-left rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4 overflow-hidden hover:border-emerald-400/40 transition">`
  - L216: `opacity` → `<div className="absolute -inset-12 rounded-full opacity-0 group-hover:opacity-30 transition-opacity blur-3xl"`
  - L216: `blur` → `<div className="absolute -inset-12 rounded-full opacity-0 group-hover:opacity-30 transition-opacity blur-3xl"`
  - L224: `opacity` → `<span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-70" />`
  - L224: `animate-` → `<span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-70" />`
  - L233: `translate` → `Open chat <ArrowRight className="size-3.5 group-hover:translate-x-1 transition" />`
  - L239: `blur` → `className="group relative text-left rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4 overflow-hidden hover:border-[#25D366]/40 transition">`
  - L240: `opacity` → `<div className="absolute -inset-12 rounded-full opacity-0 group-hover:opacity-30 transition-opacity blur-3xl"`
  - … 73 more matching lines omitted for brevity

### `src/routes/index.tsx`
- Summary: `animate-`×2, `blur`×4, `contain`×1, `filter`×6, `opacity`×5, `rotate`×1, `scale`×6, `shadow-`×7, `transform`×5, `translate`×8
  - L116: `scale` → `className="mt-4 flex items-center justify-center gap-2 w-full rounded-2xl glass-strong border-2 border-accent py-3.5 text-[11px] font-mono font-semibold uppercase tracking-[0.25em]`
  - L301: `blur` → `<div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />`
  - L304: `shadow-` → `className="relative z-10 w-full max-w-sm rounded-3xl border border-accent/25 bg-background/95 p-5 backdrop-blur-2xl shadow-[0_30px_80px_-20px_oklch(0.74_0.19_49/0.5)]"`
  - L304: `blur` → `className="relative z-10 w-full max-w-sm rounded-3xl border border-accent/25 bg-background/95 p-5 backdrop-blur-2xl shadow-[0_30px_80px_-20px_oklch(0.74_0.19_49/0.5)]"`
  - L335: `transform` → `<span className={`absolute top-0.5 size-4 rounded-full bg-white transition-transform ${draftActive ? "translate-x-[1.125rem]" : "translate-x-0.5"}`} />`
  - L335: `translate` → `<span className={`absolute top-0.5 size-4 rounded-full bg-white transition-transform ${draftActive ? "translate-x-[1.125rem]" : "translate-x-0.5"}`} />`
  - L349: `opacity` → `className="ml-auto inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-semibold text-accent-foreground transition-all hover:brightness-110 disabled:opacity`
  - L351: `animate-` → `{saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}`
  - L411: `filter` → `return POPULAR_SEARCHES.filter((s) => s.toLowerCase().includes(q));`
  - L429: `filter` → `products.filter((p) => p.trending),`
  - L438: `filter` → `.filter((p) => p.newArrival)`
  - L447: `filter` → `products.filter((p) => p.bestseller),`
  - L456: `filter` → `products.filter((p) => p.featured || p.homepageHero),`
  - L467: `filter` → `? categories.filter((c) => !c.parent_id)`
  - L487: `translate` → `<div className="absolute left-1/2 -top-[6%] -translate-x-1/2 h-[420px] w-[140%] opacity-70" style={{ background: "radial-gradient(ellipse at 50% 0%, oklch(0.74 0.19 49 / 0.16), tra`
  - L487: `opacity` → `<div className="absolute left-1/2 -top-[6%] -translate-x-1/2 h-[420px] w-[140%] opacity-70" style={{ background: "radial-gradient(ellipse at 50% 0%, oklch(0.74 0.19 49 / 0.16), tra`
  - L510: `shadow-` → `<div className={`relative glass-strong rounded-full ring-1 transition-all duration-300 ${searchFocused ? "ring-accent/50 shadow-[0_0_0_4px_oklch(0.74_0.19_49/0.10),0_0_36px_-4px_ok`
  - L511: `translate` → `<Search className={`absolute left-5 sm:left-6 top-1/2 -translate-y-1/2 size-[22px] sm:size-6 transition-colors duration-300 ${searchFocused ? "text-accent" : "text-muted-foreground`
  - L528: `scale` → `className="absolute left-0 right-0 top-[calc(100%+0.6rem)] z-20 origin-top animate-scale-in rounded-3xl glass-strong ring-1 ring-white/12 shadow-[var(--shadow-float)] p-2 sm:p-3 ma`
  - L528: `contain` → `className="absolute left-0 right-0 top-[calc(100%+0.6rem)] z-20 origin-top animate-scale-in rounded-3xl glass-strong ring-1 ring-white/12 shadow-[var(--shadow-float)] p-2 sm:p-3 ma`
  - … 25 more matching lines omitted for brevity

### `src/routes/lovable/email/queue/process.ts`
- Summary: `filter`×1
  - L136: `filter` → `.filter((id: string | null): id is string => Boolean(id))`

### `src/routes/orders.$id.tsx`
- Summary: `animate-`×1, `contain`×1, `filter`×1, `opacity`×10
  - L87: `animate-` → `<Loader2 className="size-5 animate-spin text-muted-foreground" />`
  - L138: `contain` → `<div className="container-page py-10 sm:py-16 max-w-4xl">`
  - L144: `opacity` → `initial={{ opacity: 0, y: 12 }}`
  - L145: `opacity` → `animate={{ opacity: 1, y: 0 }}`
  - L155: `opacity` → `initial={{ opacity: 0, y: 12 }}`
  - L156: `opacity` → `animate={{ opacity: 1, y: 0 }}`
  - L208: `opacity` → `initial={{ opacity: 0, y: 12 }}`
  - L209: `opacity` → `animate={{ opacity: 1, y: 0 }}`
  - L241: `opacity` → `initial={{ opacity: 0, y: 12 }}`
  - L242: `opacity` → `animate={{ opacity: 1, y: 0 }}`
  - L253: `filter` → `<p>{[addr.city, addr.region, addr.postal_code].filter(Boolean).join(", ")}</p>`
  - L307: `opacity` → `initial={{ opacity: 0, y: 12 }}`
  - L308: `opacity` → `animate={{ opacity: 1, y: 0 }}`

### `src/routes/pages.$slug.tsx`
- Summary: `animate-`×1
  - L53: `animate-` → `if (loading) return <div className="min-h-[60vh] grid place-items-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>;`

### `src/routes/pages.shipping.tsx`
- Summary: `blur`×5, `contain`×1, `opacity`×17, `shadow-`×1, `translate`×1
  - L101: `translate` → `className="absolute -top-40 left-1/2 -translate-x-1/2 size-[640px] rounded-full blur-3xl opacity-30"`
  - L101: `opacity` → `className="absolute -top-40 left-1/2 -translate-x-1/2 size-[640px] rounded-full blur-3xl opacity-30"`
  - L101: `blur` → `className="absolute -top-40 left-1/2 -translate-x-1/2 size-[640px] rounded-full blur-3xl opacity-30"`
  - L108: `opacity` → `className="absolute top-1/3 -right-20 size-[420px] rounded-full blur-3xl opacity-20"`
  - L108: `blur` → `className="absolute top-1/3 -right-20 size-[420px] rounded-full blur-3xl opacity-20"`
  - L115: `opacity` → `className="absolute inset-0 opacity-[0.04]"`
  - L128: `blur` → `<span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-xl text-[10px] font-mono uppercase tracking-[0.3em] text`
  - L143: `contain` → `<div className="relative container-page py-10 sm:py-16 max-w-5xl">`
  - L146: `opacity` → `initial={{ opacity: 0, y: 14 }}`
  - L147: `opacity` → `animate={{ opacity: 1, y: 0 }}`
  - L169: `opacity` → `initial={{ opacity: 0, y: 10 }}`
  - L170: `opacity` → `animate={{ opacity: 1, y: 0 }}`
  - L172: `blur` → `className="mb-10 sm:mb-14 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden"`
  - L175: `shadow-` → `<div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 grid place-items-center shadow-lg shadow-orange-500/20">`
  - L205: `opacity` → `initial={{ opacity: 0, y: 10 }}`
  - L206: `opacity` → `animate={{ opacity: 1, y: 0 }}`
  - L221: `opacity` → `initial={{ opacity: 0, y: 8 }}`
  - L222: `opacity` → `animate={{ opacity: 1, y: 0 }}`
  - L263: `opacity` → `initial={{ opacity: 0, y: 10 }}`
  - L264: `opacity` → `animate={{ opacity: 1, y: 0 }}`
  - … 5 more matching lines omitted for brevity

### `src/routes/product-feed[.]xml.tsx`
- Summary: `filter`×2
  - L46: `filter` → `const list = (products ?? []).filter(`
  - L91: `filter` → `const additional = gallery.filter((u) => u !== main).slice(0, 10);`

### `src/routes/products.$slug.tsx`
- Summary: `animate-`×29, `animation`×1, `blur`×12, `filter`×7, `opacity`×26, `rotate`×1, `scale`×8, `shadow-`×9, `transform`×2, `translate`×5
  - L342: `filter` → `const extras = images.filter((img) => img.url && img.url !== product.image);`
  - L346: `filter` → `const galleryImages = galleryMedia.filter((m) => m.id !== "video");`
  - L384: `filter` → `<div className="absolute -top-32 -left-24 size-[36rem] rounded-full opacity-50 animate-orb" style={{ background: "var(--gradient-ember-soft)", filter: "blur(110px)" }} />`
  - L384: `opacity` → `<div className="absolute -top-32 -left-24 size-[36rem] rounded-full opacity-50 animate-orb" style={{ background: "var(--gradient-ember-soft)", filter: "blur(110px)" }} />`
  - L384: `blur` → `<div className="absolute -top-32 -left-24 size-[36rem] rounded-full opacity-50 animate-orb" style={{ background: "var(--gradient-ember-soft)", filter: "blur(110px)" }} />`
  - L384: `animate-` → `<div className="absolute -top-32 -left-24 size-[36rem] rounded-full opacity-50 animate-orb" style={{ background: "var(--gradient-ember-soft)", filter: "blur(110px)" }} />`
  - L385: `filter` → `<div className="absolute top-1/3 -right-32 size-[34rem] rounded-full opacity-40 animate-orb" style={{ background: "var(--gradient-violet)", filter: "blur(120px)", animationDelay: "`
  - L385: `opacity` → `<div className="absolute top-1/3 -right-32 size-[34rem] rounded-full opacity-40 animate-orb" style={{ background: "var(--gradient-violet)", filter: "blur(120px)", animationDelay: "`
  - L385: `blur` → `<div className="absolute top-1/3 -right-32 size-[34rem] rounded-full opacity-40 animate-orb" style={{ background: "var(--gradient-violet)", filter: "blur(120px)", animationDelay: "`
  - L385: `animate-` → `<div className="absolute top-1/3 -right-32 size-[34rem] rounded-full opacity-40 animate-orb" style={{ background: "var(--gradient-violet)", filter: "blur(120px)", animationDelay: "`
  - L385: `animation` → `<div className="absolute top-1/3 -right-32 size-[34rem] rounded-full opacity-40 animate-orb" style={{ background: "var(--gradient-violet)", filter: "blur(120px)", animationDelay: "`
  - L419: `opacity` → `initial={{ opacity: 0, y: 12 }}`
  - L420: `opacity` → `animate={{ opacity: 1, y: 0 }}`
  - L426: `filter` → `<div aria-hidden className="absolute -inset-10 -z-10 rounded-[3rem] opacity-70 animate-pulse" style={{ background: "var(--gradient-ember-soft)", filter: "blur(80px)" }} />`
  - L426: `opacity` → `<div aria-hidden className="absolute -inset-10 -z-10 rounded-[3rem] opacity-70 animate-pulse" style={{ background: "var(--gradient-ember-soft)", filter: "blur(80px)" }} />`
  - L426: `blur` → `<div aria-hidden className="absolute -inset-10 -z-10 rounded-[3rem] opacity-70 animate-pulse" style={{ background: "var(--gradient-ember-soft)", filter: "blur(80px)" }} />`
  - L426: `animate-` → `<div aria-hidden className="absolute -inset-10 -z-10 rounded-[3rem] opacity-70 animate-pulse" style={{ background: "var(--gradient-ember-soft)", filter: "blur(80px)" }} />`
  - L427: `translate` → `<div aria-hidden className="absolute left-1/2 top-1/2 -z-10 size-2/3 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40" style={{ background: "radial-gradient(circle, oklch(`
  - L427: `filter` → `<div aria-hidden className="absolute left-1/2 top-1/2 -z-10 size-2/3 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40" style={{ background: "radial-gradient(circle, oklch(`
  - L427: `opacity` → `<div aria-hidden className="absolute left-1/2 top-1/2 -z-10 size-2/3 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40" style={{ background: "radial-gradient(circle, oklch(`
  - … 80 more matching lines omitted for brevity

### `src/routes/products.best-sellers.tsx`
- Summary: `filter`×1
  - L21: `filter` → `filterFlag="bestseller"`

### `src/routes/products.trending.tsx`
- Summary: `filter`×1
  - L21: `filter` → `filterFlag="trending"`

### `src/routes/recently-viewed.tsx`
- Summary: `animate-`×2, `filter`×1, `opacity`×8, `scale`×1, `shadow-`×1
  - L29: `filter` → `return slugs.map((s) => map.get(s)).filter(Boolean) as Product[];`
  - L35: `animate-` → `<div className="h-8 w-56 rounded bg-white/[0.05] animate-pulse mb-8" />`
  - L45: `opacity` → `initial={{ opacity: 0, y: 12 }}`
  - L46: `opacity` → `animate={{ opacity: 1, y: 0 }}`
  - L63: `scale` → `className="shrink-0 inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-[11px] uppercase tracking-widest font-bold hover:border-accent/40 hove`
  - L74: `opacity` → `initial={{ opacity: 0, y: 16 }}`
  - L75: `opacity` → `animate={{ opacity: 1, y: 0 }}`
  - L79: `animate-` → `<div className="size-16 mx-auto mb-5 grid place-items-center rounded-full bg-accent/15 border border-accent/30 text-accent animate-[float-soft_3s_ease-in-out_infinite]">`
  - L89: `shadow-` → `className="inline-flex items-center gap-2 bg-accent text-accent-foreground rounded-full px-6 py-3 text-[11px] uppercase tracking-widest font-bold hover:brightness-110 transition-al`
  - L110: `opacity` → `initial={{ opacity: 0 }}`
  - L111: `opacity` → `animate={{ opacity: 1 }}`
  - L118: `opacity` → `initial={{ opacity: 0, y: 20 }}`
  - L119: `opacity` → `animate={{ opacity: 1, y: 0 }}`

### `src/routes/reset-password.tsx`
- Summary: `animate-`×2, `blur`×2, `filter`×1, `opacity`×4, `translate`×1
  - L60: `translate` → `<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] max-w-[600px] h-[50vh] rounded-full opacity-25"`
  - L60: `opacity` → `<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] max-w-[600px] h-[50vh] rounded-full opacity-25"`
  - L61: `filter` → `style={{ background: "radial-gradient(circle, #FF7A00 0%, transparent 70%)", filter: "blur(110px)" }} />`
  - L61: `blur` → `style={{ background: "radial-gradient(circle, #FF7A00 0%, transparent 70%)", filter: "blur(110px)" }} />`
  - L65: `opacity` → `initial={{ opacity: 0, y: 12 }}`
  - L66: `opacity` → `animate={{ opacity: 1, y: 0 }}`
  - L68: `blur` → `className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8 backdrop-blur-xl"`
  - L78: `animate-` → `<Loader2 className="size-4 animate-spin" /> Verifying your reset link…`
  - L116: `opacity` → `className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-semibold text-black disabled:opacity-60"`
  - L118: `animate-` → `{busy ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}`

### `src/routes/returns.tsx`
- Summary: `animate-`×3, `blur`×10, `contain`×1, `drop-shadow`×1, `filter`×1, `opacity`×16, `rotate`×1, `scale`×9, `transform`×2, `translate`×2
  - L129: `opacity` → `<div className="absolute inset-0 opacity-[0.035]" style={{`
  - L138: `contain` → `<div className="container-page max-w-5xl py-10 sm:py-16 px-4 sm:px-6">`
  - L140: `opacity` → `<motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>`
  - L156: `opacity` → `initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}`
  - L160: `blur` → `<div key={label} className="shrink-0 flex items-center gap-2 rounded-full px-3 py-2 ring-1 ring-white/10 backdrop-blur-md" style={{ background: "rgba(255,255,255,0.03)" }}>`
  - L170: `opacity` → `initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}`
  - L171: `blur` → `className="relative mt-8 rounded-3xl p-5 sm:p-7 ring-1 ring-white/10 backdrop-blur-xl"`
  - L174: `opacity` → `<div className="absolute -inset-px rounded-3xl pointer-events-none opacity-70" style={{`
  - L182: `translate` → `<Package className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" />`
  - L190: `translate` → `<Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" />`
  - L199: `animate-` → `{m.isPending ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}`
  - L209: `opacity` → `<motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-8 space-y-3">`
  - L219: `opacity` → `initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}`
  - L220: `blur` → `className="mt-8 rounded-3xl p-8 sm:p-10 text-center ring-1 ring-white/10 backdrop-blur-xl"`
  - L240: `opacity` → `initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}`
  - L246: `opacity` → `initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}`
  - L247: `blur` → `className="relative rounded-3xl p-5 sm:p-6 ring-1 ring-white/10 backdrop-blur-xl overflow-hidden"`
  - L281: `opacity` → `initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}`
  - L282: `blur` → `className="relative rounded-3xl p-5 sm:p-6 ring-1 ring-accent/20 backdrop-blur-xl overflow-hidden"`
  - L285: `opacity` → `<div aria-hidden className="absolute -top-16 -right-16 size-48 rounded-full blur-3xl opacity-40" style={{ background: "radial-gradient(circle, #FF7A00, transparent 70%)" }} />`
  - … 26 more matching lines omitted for brevity

### `src/routes/search.tsx`
- Summary: `blur`×1, `filter`×23, `opacity`×2, `shadow-`×2, `translate`×5
  - L48: `filter` → `{ property: "og:description", content: "Search and filter thousands of curated products on FoundOurMarket." },`
  - L75: `filter` → `return rows.filter((p) => Boolean(p.trending)).sort((a, b) => b.viewsCount - a.viewsCount);`
  - L78: `filter` → `return rows.filter((p) => Boolean(p.bestseller)).sort((a, b) => b.soldCount - a.soldCount);`
  - L81: `filter` → `return rows.filter((p) => discountOf(p) > 0).sort((a, b) => discountOf(b) - discountOf(a));`
  - L100: `filter` → `// The price filter operates on the base (USD) price column server-side; for`
  - L101: `translate` → `// Indian shoppers we only translate the *displayed* numbers into ₹ so the UI`
  - L153: `filter` → `{/* Rating filter */}`
  - L240: `filter` → `const next = [{ q, ts: Date.now() }, ...arr.filter((x) => x.q !== q)].slice(0, 20);`
  - L248: `filter` → `// Reset and fetch the first page whenever the query / RPC-handled filters change.`
  - L256: `filter` → `category_filter: search.cat ?? null,`
  - L288: `filter` → `// Load the next page and append (deduped by slug) — preserves filters/sorting.`
  - L294: `filter` → `category_filter: search.cat ?? null,`
  - L306: `filter` → `return [...prev, ...rows.filter((r: Product) => !seen.has(r.slug))];`
  - L312: `filter` → `// Client-side filters / sorts that the RPC does not handle, applied to the`
  - L316: `filter` → `if (search.stock === "in") rows = rows.filter((p) => p.inStock);`
  - L317: `filter` → `if (search.free === "1") rows = rows.filter((p) => shippingFeeOf(p) <= 0);`
  - L318: `filter` → `if (search.disc === "1") rows = rows.filter((p) => discountPercent(p.price, compareOf(p)) != null);`
  - L333: `filter` → `const activeFilterCount = [search.cat, search.stock, search.min, search.max, search.rating, search.free, search.disc].filter(Boolean).length;`
  - L358: `blur` → `className={`fixed inset-x-0 top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl transition-all duration-300 ${`
  - L359: `translate` → `scrolled ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"`
  - … 13 more matching lines omitted for brevity

### `src/routes/track.tsx`
- Summary: `animate-`×5, `blur`×3, `filter`×4, `opacity`×18, `scale`×2, `shadow-`×3, `transform`×2, `translate`×3
  - L104: `filter` → `const next = [vars, ...recent.filter((r) => r.orderId !== vars.orderId)].slice(0, 4);`
  - L230: `translate` → `<div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[680px] h-[680px] rounded-full blur-3xl opacity-30"`
  - L230: `opacity` → `<div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[680px] h-[680px] rounded-full blur-3xl opacity-30"`
  - L230: `blur` → `<div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[680px] h-[680px] rounded-full blur-3xl opacity-30"`
  - L232: `opacity` → `<div className="absolute top-1/3 -right-40 w-[420px] h-[420px] rounded-full blur-3xl opacity-20"`
  - L232: `blur` → `<div className="absolute top-1/3 -right-40 w-[420px] h-[420px] rounded-full blur-3xl opacity-20"`
  - L239: `opacity` → `initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}`
  - L245: `opacity` → `<span className="absolute inset-0 rounded-full bg-accent animate-ping opacity-75" />`
  - L245: `animate-` → `<span className="absolute inset-0 rounded-full bg-accent animate-ping opacity-75" />`
  - L257: `opacity` → `initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}`
  - L259: `shadow-` → `className="relative glass-strong rounded-3xl p-5 sm:p-7 ring-1 ring-white/10 shadow-[var(--shadow-float)] space-y-4 overflow-hidden"`
  - L285: `scale` → `whileTap={{ scale: 0.97 }}`
  - L286: `transform` → `className="relative w-full overflow-hidden bg-accent text-accent-foreground font-bold py-3.5 rounded-full text-xs uppercase tracking-[0.2em] disabled:opacity-60 inline-flex items-c`
  - L286: `opacity` → `className="relative w-full overflow-hidden bg-accent text-accent-foreground font-bold py-3.5 rounded-full text-xs uppercase tracking-[0.2em] disabled:opacity-60 inline-flex items-c`
  - L286: `shadow-` → `className="relative w-full overflow-hidden bg-accent text-accent-foreground font-bold py-3.5 rounded-full text-xs uppercase tracking-[0.2em] disabled:opacity-60 inline-flex items-c`
  - L290: `animate-` → `<Loader2 className="size-4 animate-spin" />`
  - L299: `transform` → `<span aria-hidden className="absolute inset-0 -translate-x-full hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transpare`
  - L299: `translate` → `<span aria-hidden className="absolute inset-0 -translate-x-full hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transpare`
  - L341: `opacity` → `initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}`
  - L361: `opacity` → `initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}`
  - … 20 more matching lines omitted for brevity

### `src/routes/unsubscribe.tsx`
- Summary: `opacity`×1, `shadow-`×1
  - L76: `shadow-` → `<div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-2xl">`
  - L94: `opacity` → `className="mt-6 w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"`

### `src/routes/wishlist.tsx`
- Summary: `animate-`×5, `blur`×2, `filter`×27, `opacity`×5, `scale`×10, `shadow-`×8, `translate`×1
  - L102: `filter` → `const [filter, setFilter] = useState<FilterKey>("all");`
  - L118: `filter` → `() => products.filter((p) => slugs.has(p.slug)),`
  - L182: `filter` → `const filtered = useMemo(() => {`
  - L185: `filter` → `switch (filter) {`
  - L187: `filter` → `return items.filter((p) => p.inStock);`
  - L189: `filter` → `return items.filter((p) => !p.inStock);`
  - L191: `filter` → `return items.filter(lowStockOf);`
  - L193: `filter` → `return items.filter((p) => (drops[p.slug] ?? 0) > 0);`
  - L195: `filter` → `return items.filter((p) => shippingFeeOf(p) <= 0);`
  - L213: `filter` → `}, [items, filter, drops, shippingFeeOf, priceOf, compareOf]);`
  - L257: `filter` → `() => items.filter((p) => selected.has(p.slug)).reduce((s, p) => s + priceOf(p), 0),`
  - L271: `filter` → `const allSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.slug));`
  - L274: `filter` → `allSelected ? new Set() : new Set(filtered.map((p) => p.slug)),`
  - L279: `filter` → `.filter((p) => selected.has(p.slug) && p.inStock)`
  - L310: `filter` → `const chosen = items.filter((p) => selected.has(p.slug));`
  - L316: `filter` → `const addAll = () => items.filter((p) => p.inStock).forEach((p) => add(p.slug, 1));`
  - L321: `animate-` → `<div className="h-8 w-48 rounded bg-white/[0.05] animate-pulse mb-8" />`
  - L350: `opacity` → `<span className="text-[11px] uppercase tracking-widest font-mono opacity-80">`
  - L363: `scale` → `className="h-10 inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-4 text-[11px] uppercase tracking-widest font-bold leading-none hover:bord`
  - L371: `scale` → `className="h-10 inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-4 text-[11px] uppercase tracking-widest font-bold leading-none hover:bord`
  - … 38 more matching lines omitted for brevity

### `src/styles.css`
- Summary: `animate-`×33, `animation`×68, `backdrop-filter`×20, `blur`×21, `box-shadow`×63, `clip-path`×2, `contain`×23, `filter`×31, `isolation`×9, `mask`×7, `mix-blend-mode`×3, `opacity`×54, `perspective`×3, `rotate`×2, `scale`×41, `shadow-`×31, `transform`×102, `translate`×61, `translateZ`×1, `will-change`×8
  - L3: `animate-` → `@import "tw-animate-css";`
  - L151: `shadow-` → `--shadow-ember: 0 10px 60px -10px oklch(0.74 0.19 49 / 0.45);`
  - L152: `shadow-` → `--shadow-card: 0 8px 32px -12px oklch(0 0 0 / 0.6);`
  - L153: `shadow-` → `--shadow-float: 0 30px 80px -30px oklch(0 0 0 / 0.7), 0 8px 24px -12px oklch(0 0 0 / 0.5);`
  - L154: `shadow-` → `--shadow-glow: 0 0 0 1px oklch(0.74 0.19 49 / 0.3), 0 12px 40px -8px oklch(0.74 0.19 49 / 0.4);`
  - L156: `shadow-` → `--shadow-soft: 0 6px 20px -10px oklch(0 0 0 / 0.55);`
  - L160: `transform` → `from { opacity: 0; transform: translateY(20px); }`
  - L160: `translate` → `from { opacity: 0; transform: translateY(20px); }`
  - L160: `opacity` → `from { opacity: 0; transform: translateY(20px); }`
  - L161: `transform` → `to { opacity: 1; transform: translateY(0); }`
  - L161: `translate` → `to { opacity: 1; transform: translateY(0); }`
  - L161: `opacity` → `to { opacity: 1; transform: translateY(0); }`
  - L164: `transform` → `from { transform: translateY(20px); }`
  - L164: `translate` → `from { transform: translateY(20px); }`
  - L165: `transform` → `to { transform: translateY(0); }`
  - L165: `translate` → `to { transform: translateY(0); }`
  - L168: `transform` → `from { opacity: 0; transform: translateY(120%); }`
  - L168: `translate` → `from { opacity: 0; transform: translateY(120%); }`
  - L168: `opacity` → `from { opacity: 0; transform: translateY(120%); }`
  - L169: `transform` → `to { opacity: 1; transform: translateY(0); }`
  - … 563 more matching lines omitted for brevity

## Effects, observers, timers, animation loops, event listeners, Suspense/lazy

Terms scanned: `useEffect`, `setInterval`, `setTimeout`, `requestAnimationFrame`, `IntersectionObserver`, `ResizeObserver`, `MutationObserver`, `addEventListener`, `removeEventListener`, `lazy(`, `Suspense`.

### `src/components/account/OrderDetailsDrawer.tsx`
- Summary: `setInterval`×1, `setTimeout`×3, `useEffect`×5
  - L1: `useEffect` → `import { useEffect, useMemo, useRef, useState } from "react";`
  - L151: `useEffect` → `useEffect(() => {`
  - L158: `useEffect` → `useEffect(() => {`
  - L160: `setTimeout` → `let t: ReturnType<typeof setTimeout> | null = null;`
  - L161: `setTimeout` → `const refresh = () => { if (t) clearTimeout(t); t = setTimeout(() => load(orderId, false), 400); };`
  - L175: `useEffect` → `useEffect(() => {`
  - L187: `useEffect` → `useEffect(() => {`
  - L189: `setInterval` → `const t = setInterval(() => setNow(Date.now()), 30_000);`
  - L653: `setTimeout` → `try { await navigator.clipboard.writeText(v); setCopied(true); toast.success("Copied"); setTimeout(() => setCopied(false), 1500); }`

### `src/components/admin/AIOperationsCenter.tsx`
- Summary: `requestAnimationFrame`×1, `setTimeout`×2, `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useState } from "react";`
  - L178: `useEffect` → `useEffect(() => {`
  - L183: `setTimeout` → `const t = setTimeout(() => {`
  - L188: `setTimeout` → `setTimeout(() => el.classList.remove("deep-link-flash"), 2000);`
  - L210: `requestAnimationFrame` → `<motion.button onClick={() => { setTab("actions"); requestAnimationFrame(() => document.getElementById(`cat-${c}`)?.scrollIntoView({ behavior: "smooth", block: "start" })); }} key=`

### `src/components/admin/AcquisitionSummary.tsx`
- Summary: `useEffect`×2
  - L8: `useEffect` → `import { useEffect, useState } from "react";`
  - L25: `useEffect` → `useEffect(() => {`

### `src/components/admin/AdminCommandCenter.tsx`
- Summary: `setTimeout`×2, `useEffect`×3
  - L1: `useEffect` → `import { useEffect, useMemo, useRef, useState } from "react";`
  - L53: `setTimeout` → `const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);`
  - L91: `useEffect` → `useEffect(() => {`
  - L103: `useEffect` → `useEffect(() => {`
  - L112: `setTimeout` → `debounce.current = setTimeout(async () => {`

### `src/components/admin/AdminCustomersTab.tsx`
- Summary: `setTimeout`×1, `useEffect`×3
  - L1: `useEffect` → `import { useCallback, useEffect, useMemo, useRef, useState } from "react";`
  - L41: `useEffect` → `useEffect(() => { const t = setTimeout(() => setSearch(query), 300); return () => clearTimeout(t); }, [query]);`
  - L41: `setTimeout` → `useEffect(() => { const t = setTimeout(() => setSearch(query), 300); return () => clearTimeout(t); }, [query]);`
  - L56: `useEffect` → `useEffect(() => { setRows(null); load(); }, [load]);`

### `src/components/admin/AdminNavDrawer.tsx`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useState } from "react";`
  - L18: `useEffect` → `useEffect(() => { setOpen(false); }, [path]);`

### `src/components/admin/AdminProductPanel.tsx`
- Summary: `useEffect`×3
  - L1: `useEffect` → `import { useState, useEffect } from "react";`
  - L102: `useEffect` → `useEffect(() => {`
  - L110: `useEffect` → `useEffect(() => {`

### `src/components/admin/AdminShell.tsx`
- Summary: `useEffect`×5
  - L1: `useEffect` → `import { useEffect, useMemo, useState, type ReactNode } from "react";`
  - L136: `useEffect` → `useEffect(() => {`
  - L165: `useEffect` → `useEffect(() => { if (!loading && !user) nav({ to: "/auth" }); }, [loading, user, nav]);`
  - L166: `useEffect` → `useEffect(() => { setOpen(false); }, [path, activeTab]);`
  - L168: `useEffect` → `useEffect(() => {`

### `src/components/admin/AnnouncementAdminSheet.tsx`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useState } from "react";`
  - L74: `useEffect` → `useEffect(() => {`

### `src/components/admin/AutomationSummaryWidget.tsx`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useCallback, useEffect, useMemo, useState } from "react";`
  - L51: `useEffect` → `useEffect(() => {`

### `src/components/admin/BadgeEditorModal.tsx`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useMemo, useState } from "react";`
  - L136: `useEffect` → `useEffect(() => {`

### `src/components/admin/BadgeSettingsEditor.tsx`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useState } from "react";`
  - L83: `useEffect` → `useEffect(() => {`

### `src/components/admin/BannerAdminSheet.tsx`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useRef, useState } from "react";`
  - L97: `useEffect` → `useEffect(() => {`

### `src/components/admin/BulkVisibilityPanel.tsx`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useMemo, useState } from "react";`
  - L42: `useEffect` → `useEffect(() => {`

### `src/components/admin/CategoryAdminSheet.tsx`
- Summary: `setTimeout`×1, `useEffect`×3
  - L1: `useEffect` → `import { useCallback, useEffect, useMemo, useRef, useState } from "react";`
  - L223: `useEffect` → `useEffect(() => {`
  - L228: `useEffect` → `useEffect(() => {`
  - L297: `setTimeout` → `setTimeout(() => setProgress(0), 400);`

### `src/components/admin/CustomerActionsMenu.tsx`
- Summary: `addEventListener`×2, `removeEventListener`×2, `useEffect`×3
  - L1: `useEffect` → `import { useEffect, useRef, useState } from "react";`
  - L37: `useEffect` → `useEffect(() => {`
  - L40: `addEventListener` → `document.addEventListener("keydown", onKey);`
  - L42: `removeEventListener` → `return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };`
  - L215: `useEffect` → `useEffect(() => {`
  - L219: `addEventListener` → `document.addEventListener("keydown", onKey);`
  - L220: `removeEventListener` → `return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };`

### `src/components/admin/CustomerMarketingCard.tsx`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useMemo, useState } from "react";`
  - L24: `useEffect` → `useEffect(() => {`

### `src/components/admin/CustomerMarketingHub.tsx`
- Summary: `useEffect`×4
  - L1: `useEffect` → `import { useEffect, useMemo, useState, useCallback } from "react";`
  - L50: `useEffect` → `useEffect(() => { void load(); }, [load]);`
  - L53: `useEffect` → `useEffect(() => {`
  - L73: `useEffect` → `useEffect(() => {`

### `src/components/admin/DraftActivityWidget.tsx`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useState } from "react";`
  - L37: `useEffect` → `useEffect(() => {`

### `src/components/admin/ExecutiveDashboard.tsx`
- Summary: `requestAnimationFrame`×1, `setTimeout`×1, `useEffect`×2
  - L1: `useEffect` → `import { useCallback, useEffect, useState } from "react";`
  - L121: `useEffect` → `useEffect(() => {`
  - L125: `requestAnimationFrame` → `requestAnimationFrame(() => {`
  - L130: `setTimeout` → `setTimeout(() => el.classList.remove("deep-link-flash"), 2000);`

### `src/components/admin/FinancialMarketingCard.tsx`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useMemo, useState } from "react";`
  - L21: `useEffect` → `useEffect(() => {`

### `src/components/admin/FinancialMarketingHub.tsx`
- Summary: `requestAnimationFrame`×1, `setTimeout`×1, `useEffect`×5
  - L1: `useEffect` → `import { useCallback, useEffect, useMemo, useState } from "react";`
  - L24: `useEffect` → `useEffect(() => { if (data) setLive(data); }, [data]);`
  - L32: `useEffect` → `useEffect(() => { if (!data) void reload(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);`
  - L35: `useEffect` → `useEffect(() => {`
  - L46: `useEffect` → `useEffect(() => {`
  - L55: `requestAnimationFrame` → `requestAnimationFrame(() => {`
  - L58: `setTimeout` → `if (el) { el.classList.add("deep-link-flash"); setTimeout(() => el.classList.remove("deep-link-flash"), 1800); }`

### `src/components/admin/InventoryMarketingHub.tsx`
- Summary: `useEffect`×3
  - L1: `useEffect` → `import { useEffect, useMemo, useState, useCallback } from "react";`
  - L46: `useEffect` → `useEffect(() => { void load(); }, [load]);`
  - L49: `useEffect` → `useEffect(() => {`

### `src/components/admin/MarketingAutomationCard.tsx`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useState } from "react";`
  - L22: `useEffect` → `useEffect(() => {`

### `src/components/admin/MarketingExecutionsCenter.tsx`
- Summary: `requestAnimationFrame`×1, `useEffect`×3
  - L1: `useEffect` → `import { useCallback, useEffect, useMemo, useState } from "react";`
  - L83: `useEffect` → `useEffect(() => {`
  - L87: `requestAnimationFrame` → `requestAnimationFrame(() => document.getElementById("automation-health")?.scrollIntoView({ behavior: "smooth", block: "center" }));`
  - L96: `useEffect` → `useEffect(() => {`

### `src/components/admin/MediaUploader.tsx`
- Summary: `addEventListener`×1, `removeEventListener`×1, `useEffect`×2
  - L7: `useEffect` → `import { useEffect, useRef, useState } from "react";`
  - L50: `useEffect` → `useEffect(() => {`
  - L66: `addEventListener` → `document.addEventListener("paste", onPaste);`
  - L67: `removeEventListener` → `return () => document.removeEventListener("paste", onPaste);`

### `src/components/admin/OrderIntegrityMonitor.tsx`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useCallback, useEffect, useState } from "react";`
  - L49: `useEffect` → `useEffect(() => {`

### `src/components/admin/PaymentDiagnostics.tsx`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useState } from "react";`
  - L72: `useEffect` → `useEffect(() => {`

### `src/components/admin/PaymentIntelDrawer.tsx`
- Summary: `setTimeout`×1, `useEffect`×3
  - L1: `useEffect` → `import { useCallback, useEffect, useState, type ReactNode } from "react";`
  - L33: `setTimeout` → `onClick={() => { navigator.clipboard.writeText(v); setCopied(true); setTimeout(() => setCopied(false), 1200); }}`
  - L88: `useEffect` → `useEffect(() => {`
  - L94: `useEffect` → `useEffect(() => {`

### `src/components/admin/ProductCardAdminControlsGate.tsx`
- Summary: `Suspense`×3, `lazy(`×1
  - L1: `Suspense` → `import { lazy, Suspense } from "react";`
  - L15: `lazy(` → `const ProductCardAdminControls = lazy(() =>`
  - L26: `Suspense` → `<Suspense fallback={null}>`
  - L28: `Suspense` → `</Suspense>`

### `src/components/admin/ProductFaqManager.tsx`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useState } from "react";`
  - L46: `useEffect` → `useEffect(() => {`

### `src/components/admin/ProductMarketingPanel.tsx`
- Summary: `useEffect`×3
  - L1: `useEffect` → `import { useEffect, useState, useCallback } from "react";`
  - L43: `useEffect` → `useEffect(() => { void load(); }, [load]);`
  - L46: `useEffect` → `useEffect(() => {`

### `src/components/admin/ProductQuickEditSheet.tsx`
- Summary: `addEventListener`×1, `removeEventListener`×1, `useEffect`×3
  - L1: `useEffect` → `import { useEffect, useState } from "react";`
  - L74: `useEffect` → `useEffect(() => {`
  - L78: `useEffect` → `useEffect(() => {`
  - L83: `addEventListener` → `window.addEventListener("keydown", onKey);`
  - L84: `removeEventListener` → `return () => window.removeEventListener("keydown", onKey);`

### `src/components/admin/ProductRatingManager.tsx`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useState, useCallback } from "react";`
  - L72: `useEffect` → `useEffect(() => {`

### `src/components/admin/SectionAnalyticsPanel.tsx`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useState } from "react";`
  - L21: `useEffect` → `useEffect(() => {`

### `src/components/admin/SegmentedTabs.tsx`
- Summary: `requestAnimationFrame`×1
  - L33: `requestAnimationFrame` → `requestAnimationFrame(() => {`

### `src/components/admin/StorefrontDashboardPanel.tsx`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useMemo, useState } from "react";`
  - L57: `useEffect` → `useEffect(() => {`

### `src/components/admin/SupportSatisfactionPanel.tsx`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useCallback, useEffect, useMemo, useState } from "react";`
  - L90: `useEffect` → `useEffect(() => {`

### `src/components/admin/SwipeRow.tsx`
- Summary: `setTimeout`×2
  - L44: `setTimeout` → `const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);`
  - L52: `setTimeout` → `pressTimer.current = setTimeout(() => {`

### `src/components/admin/TestimonialsEditor.tsx`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useState, useCallback } from "react";`
  - L95: `useEffect` → `useEffect(() => { reload(); }, [reload]);`

### `src/components/admin/TicketOpsSheet.tsx`
- Summary: `setTimeout`×2, `useEffect`×2
  - L1: `useEffect` → `import { useCallback, useEffect, useMemo, useRef, useState } from "react";`
  - L103: `setTimeout` → `const reloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);`
  - L165: `useEffect` → `useEffect(() => {`
  - L167: `setTimeout` → `const schedule = () => { if (reloadTimer.current) clearTimeout(reloadTimer.current); reloadTimer.current = setTimeout(() => void load(), 400); };`

### `src/components/admin/VersionHistorySheet.tsx`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useState } from "react";`
  - L52: `useEffect` → `useEffect(() => {`

### `src/components/admin/product-editor/category-selector.tsx`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useMemo, useState } from "react";`
  - L64: `useEffect` → `useEffect(() => {`

### `src/components/admin/product-editor/field-builders.tsx`
- Summary: `requestAnimationFrame`×2
  - L114: `requestAnimationFrame` → `requestAnimationFrame(() => {`
  - L132: `requestAnimationFrame` → `requestAnimationFrame(() => el.focus());`

### `src/components/admin/product-editor/kit.tsx`
- Summary: `setTimeout`×4, `useEffect`×6
  - L1: `useEffect` → `import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";`
  - L143: `useEffect` → `useEffect(() => {`
  - L211: `useEffect` → `useEffect(() => {`
  - L306: `setTimeout` → `const savedFlash = useRef<ReturnType<typeof setTimeout> | null>(null);`
  - L311: `setTimeout` → `const timer = useRef<ReturnType<typeof setTimeout> | null>(null);`
  - L317: `useEffect` → `useEffect(() => {`
  - L344: `useEffect` → `useEffect(() => {`
  - L383: `setTimeout` → `savedFlash.current = setTimeout(() => setJustSaved(false), 2000);`
  - L393: `useEffect` → `useEffect(() => {`
  - L399: `setTimeout` → `timer.current = setTimeout(() => void doSave(true), 2000);`

### `src/components/admin/product-editor/media-fields.tsx`
- Summary: `setTimeout`×1, `useEffect`×3
  - L8: `useEffect` → `import { useCallback, useEffect, useRef, useState } from "react";`
  - L60: `useEffect` → `useEffect(() => {`
  - L110: `setTimeout` → `setTimeout(() => setUploads((u) => u.filter((x) => x.error)), 1200);`
  - L416: `useEffect` → `useEffect(() => { if (!value) setMeta({ size: 0, duration: 0 }); }, [value]);`

### `src/components/builder/BlockAnalyticsPanel.tsx`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useState } from "react";`
  - L23: `useEffect` → `useEffect(() => {`

### `src/components/builder/BlockEditorSheet.tsx`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useMemo, useState } from "react";`
  - L81: `useEffect` → `useEffect(() => {`

### `src/components/builder/HomepageBuilder.tsx`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useMemo, useState } from "react";`
  - L65: `useEffect` → `useEffect(() => {`

### `src/components/chat/LiveChat.tsx`
- Summary: `addEventListener`×1, `removeEventListener`×1, `requestAnimationFrame`×2, `setTimeout`×1, `useEffect`×9
  - L1: `useEffect` → `import { useCallback, useEffect, useMemo, useRef, useState } from "react";`
  - L131: `useEffect` → `useEffect(() => { openRef.current = open; if (open) setUnread(0); }, [open]);`
  - L141: `useEffect` → `useEffect(() => {`
  - L147: `requestAnimationFrame` → `requestAnimationFrame(() => {`
  - L155: `addEventListener` → `window.addEventListener("scroll", onScroll, { passive: true });`
  - L156: `removeEventListener` → `return () => window.removeEventListener("scroll", onScroll);`
  - L168: `useEffect` → `useEffect(() => {`
  - L173: `useEffect` → `useEffect(() => {`
  - L180: `useEffect` → `useEffect(() => {`
  - L195: `useEffect` → `useEffect(() => {`
  - L202: `useEffect` → `useEffect(() => {`
  - L205: `requestAnimationFrame` → `if (el) requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });`
  - L656: `useEffect` → `useEffect(() => {`
  - L657: `setTimeout` → `const t = setTimeout(onDismiss, 6000);`

### `src/components/chat/SupportReplyWatcher.tsx`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useRef } from "react";`
  - L25: `useEffect` → `useEffect(() => {`

### `src/components/site/AdaptiveProductMedia.tsx`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { memo, useEffect, useState } from "react";`
  - L27: `useEffect` → `useEffect(() => setLoadedSrc(null), [src]);`

### `src/components/site/AddressForm.tsx`
- Summary: `Suspense`×3, `lazy(`×1, `setTimeout`×1, `useEffect`×6
  - L1: `useEffect` → `import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";`
  - L1: `Suspense` → `import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";`
  - L16: `lazy(` → `const MapPicker = lazy(() => import("@/components/site/MapPicker"));`
  - L160: `useEffect` → `useEffect(() => {`
  - L167: `useEffect` → `useEffect(() => {`
  - L178: `useEffect` → `useEffect(() => {`
  - L245: `useEffect` → `useEffect(() => {`
  - L331: `setTimeout` → `const timer = setTimeout(() => controller.abort(), 8000);`
  - L399: `useEffect` → `useEffect(() => {`
  - L592: `Suspense` → `<Suspense`
  - L605: `Suspense` → `</Suspense>`

### `src/components/site/AnnouncementBar.tsx`
- Summary: `Suspense`×4, `lazy(`×2, `setInterval`×2, `useEffect`×4
  - L1: `useEffect` → `import { useEffect, useMemo, useState, lazy, Suspense } from "react";`
  - L1: `Suspense` → `import { useEffect, useMemo, useState, lazy, Suspense } from "react";`
  - L7: `lazy(` → `const MotionAnnouncement = lazy(() => import("@/components/site/AnnouncementMessage.motion"));`
  - L9: `lazy(` → `const AnnouncementAdminSheet = lazy(() =>`
  - L51: `useEffect` → `useEffect(() => {`
  - L53: `setInterval` → `const t = setInterval(() => setNow(Date.now()), 1000);`
  - L101: `useEffect` → `useEffect(() => {`
  - L113: `useEffect` → `useEffect(() => {`
  - L116: `setInterval` → `const t = setInterval(() => setI((p) => (p + 1) % items.length), 4500);`
  - L143: `Suspense` → `<Suspense fallback={<StaticAnnouncement current={current} countdown={countdown} />}>`
  - L145: `Suspense` → `</Suspense>`
  - L173: `Suspense` → `{canEdit && editing && <Suspense fallback={null}><AnnouncementAdminSheet onClose={() => setEditing(false)} onChanged={fetchItems} /></Suspense>}`

### `src/components/site/AnnouncementMessage.tsx`
- Summary: `Suspense`×1
  - L6: `Suspense` → `* render and as the Suspense fallback while the motion-enhanced version loads.`

### `src/components/site/CouponInput.tsx`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useState } from "react";`
  - L73: `useEffect` → `useEffect(() => {`

### `src/components/site/CurrencySwitcher.tsx`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useState } from "react";`
  - L11: `useEffect` → `useEffect(() => setMounted(true), []);`

### `src/components/site/DesktopAccountDock.tsx`
- Summary: `addEventListener`×1, `removeEventListener`×1, `useEffect`×3
  - L3: `useEffect` → `import { useCallback, useEffect, useRef, useState } from "react";`
  - L54: `useEffect` → `useEffect(() => {`
  - L60: `useEffect` → `useEffect(() => {`
  - L62: `addEventListener` → `window.addEventListener("resize", onResize);`
  - L63: `removeEventListener` → `return () => window.removeEventListener("resize", onResize);`

### `src/components/site/DocPage.tsx`
- Summary: `IntersectionObserver`×4, `addEventListener`×2, `removeEventListener`×2, `useEffect`×4
  - L2: `useEffect` → `import { useEffect, useRef, useState, type ReactNode, type ComponentType } from "react";`
  - L17: `useEffect` → `useEffect(() => {`
  - L24: `addEventListener` → `window.addEventListener("scroll", onScroll, { passive: true });`
  - L25: `addEventListener` → `window.addEventListener("resize", onScroll);`
  - L27: `removeEventListener` → `window.removeEventListener("scroll", onScroll);`
  - L28: `removeEventListener` → `window.removeEventListener("resize", onScroll);`
  - L38: `useEffect` → `useEffect(() => {`
  - L41: `IntersectionObserver` → `if (typeof IntersectionObserver === "undefined") { setShown(true); return; }`
  - L42: `IntersectionObserver` → `const io = new IntersectionObserver(`
  - L67: `useEffect` → `useEffect(() => {`
  - L68: `IntersectionObserver` → `if (typeof IntersectionObserver === "undefined") return;`
  - L69: `IntersectionObserver` → `const io = new IntersectionObserver(`

### `src/components/site/FlashDeals.tsx`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";`
  - L228: `useEffect` → `useEffect(() => {`

### `src/components/site/FlashSaleStrip.tsx`
- Summary: `setInterval`×1, `useEffect`×3
  - L1: `useEffect` → `import { useEffect, useState } from "react";`
  - L22: `useEffect` → `useEffect(() => {`
  - L24: `setInterval` → `const id = setInterval(() => setNow(Date.now()), 1000);`
  - L47: `useEffect` → `useEffect(() => {`

### `src/components/site/HeroCarousel.tsx`
- Summary: `IntersectionObserver`×2, `setInterval`×1, `useEffect`×5
  - L1: `useEffect` → `import { useCallback, useEffect, useMemo, useRef, useState } from "react";`
  - L60: `useEffect` → `useEffect(() => {`
  - L78: `useEffect` → `useEffect(() => {`
  - L81: `IntersectionObserver` → `if (!el || typeof IntersectionObserver === "undefined") return;`
  - L82: `IntersectionObserver` → `const io = new IntersectionObserver(`
  - L93: `useEffect` → `useEffect(() => {`
  - L96: `setInterval` → `const id = window.setInterval(() => {`
  - L109: `useEffect` → `useEffect(() => {`

### `src/components/site/HomePersonalized.tsx`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useState } from "react";`
  - L12: `useEffect` → `useEffect(() => {`

### `src/components/site/ImageLightbox.tsx`
- Summary: `addEventListener`×1, `removeEventListener`×1, `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useState, useCallback } from "react";`
  - L37: `useEffect` → `useEffect(() => {`
  - L44: `addEventListener` → `window.addEventListener("keydown", onKey);`
  - L47: `removeEventListener` → `window.removeEventListener("keydown", onKey);`

### `src/components/site/InstallPrompt.tsx`
- Summary: `addEventListener`×2, `removeEventListener`×2, `setTimeout`×1, `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useState } from "react";`
  - L18: `useEffect` → `useEffect(() => {`
  - L29: `setTimeout` → `setTimeout(() => setVisible(true), 2500);`
  - L31: `addEventListener` → `window.addEventListener("beforeinstallprompt", onPrompt);`
  - L37: `addEventListener` → `window.addEventListener("appinstalled", onInstalled);`
  - L40: `removeEventListener` → `window.removeEventListener("beforeinstallprompt", onPrompt);`
  - L41: `removeEventListener` → `window.removeEventListener("appinstalled", onInstalled);`

### `src/components/site/LazyMount.tsx`
- Summary: `IntersectionObserver`×4, `setTimeout`×1, `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useRef, useState } from "react";`
  - L11: `IntersectionObserver` → `* IntersectionObserver, plus a safety timeout that guarantees the section`
  - L31: `useEffect` → `useEffect(() => {`
  - L39: `IntersectionObserver` → `let io: IntersectionObserver | null = null;`
  - L41: `setTimeout` → `const fallback = window.setTimeout(() => setShow(true), 4000);`
  - L43: `IntersectionObserver` → `if (typeof IntersectionObserver === "undefined") {`
  - L46: `IntersectionObserver` → `io = new IntersectionObserver(`

### `src/components/site/MapPicker.tsx`
- Summary: `addEventListener`×1, `removeEventListener`×1, `setTimeout`×6, `useEffect`×5
  - L1: `useEffect` → `import { useEffect, useRef, useState, useCallback } from "react";`
  - L85: `setTimeout` → `const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);`
  - L91: `setTimeout` → `previewTimer.current = setTimeout(async () => {`
  - L95: `setTimeout` → `const timer = setTimeout(() => controller.abort(), 6000);`
  - L119: `useEffect` → `useEffect(() => {`
  - L146: `setTimeout` → `setTimeout(() => map.invalidateSize(), 80);`
  - L160: `useEffect` → `useEffect(() => {`
  - L167: `addEventListener` → `window.addEventListener("keydown", onKey);`
  - L171: `removeEventListener` → `window.removeEventListener("keydown", onKey);`
  - L289: `useEffect` → `useEffect(() => {`
  - L292: `setTimeout` → `const t = setTimeout(() => acquireLocation(true), 250);`
  - L333: `useEffect` → `useEffect(() => {`
  - L335: `setTimeout` → `const id = setTimeout(() => mapRef.current?.invalidateSize(), dragging ? 0 : 220);`

### `src/components/site/MegaMenu.tsx`
- Summary: `setTimeout`×4
  - L117: `setTimeout` → `const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);`
  - L118: `setTimeout` → `const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);`
  - L129: `setTimeout` → `openTimer.current = setTimeout(() => setActive(slug), 160);`
  - L134: `setTimeout` → `closeTimer.current = setTimeout(() => setActive(null), 160);`

### `src/components/site/Nav.tsx`
- Summary: `Suspense`×3, `addEventListener`×2, `lazy(`×1, `removeEventListener`×2, `requestAnimationFrame`×1, `setTimeout`×1, `useEffect`×8
  - L2: `useEffect` → `import { Suspense, lazy, useEffect, useRef, useState } from "react";`
  - L2: `Suspense` → `import { Suspense, lazy, useEffect, useRef, useState } from "react";`
  - L12: `lazy(` → `const SearchCommand = lazy(() =>`
  - L83: `useEffect` → `useEffect(() => {`
  - L89: `useEffect` → `useEffect(() => {`
  - L99: `useEffect` → `useEffect(() => {`
  - L106: `addEventListener` → `window.addEventListener("keydown", onKey);`
  - L107: `removeEventListener` → `return () => window.removeEventListener("keydown", onKey);`
  - L119: `useEffect` → `useEffect(() => {`
  - L126: `useEffect` → `useEffect(() => {`
  - L156: `useEffect` → `useEffect(() => {`
  - L168: `addEventListener` → `window.addEventListener("scroll", onScroll, { passive: true });`
  - L169: `removeEventListener` → `return () => window.removeEventListener("scroll", onScroll);`
  - L173: `useEffect` → `useEffect(() => {`
  - L176: `requestAnimationFrame` → `const raf = requestAnimationFrame(() => setDrawerVisible(true));`
  - L180: `setTimeout` → `const t = setTimeout(() => setDrawerMounted(false), 320);`
  - L352: `Suspense` → `<Suspense fallback={null}>`
  - L354: `Suspense` → `</Suspense>`

### `src/components/site/OrderSupportSection.tsx`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useCallback, useEffect, useState } from "react";`
  - L129: `useEffect` → `useEffect(() => {`

### `src/components/site/PhoneInput.tsx`
- Summary: `addEventListener`×1, `removeEventListener`×1, `useEffect`×6
  - L1: `useEffect` → `import { useEffect, useMemo, useRef, useState } from "react";`
  - L96: `useEffect` → `useEffect(() => {`
  - L102: `useEffect` → `useEffect(() => {`
  - L117: `useEffect` → `useEffect(() => {`
  - L125: `useEffect` → `useEffect(() => {`
  - L134: `useEffect` → `useEffect(() => {`
  - L139: `addEventListener` → `document.addEventListener("mousedown", onDoc);`
  - L140: `removeEventListener` → `return () => document.removeEventListener("mousedown", onDoc);`

### `src/components/site/ProductCard.tsx`
- Summary: `setTimeout`×2
  - L171: `setTimeout` → `window.setTimeout(() => setJustSaved(false), 600);`
  - L217: `setTimeout` → `window.setTimeout(() => setJustAdded(false), 800);`

### `src/components/site/ProductImage.tsx`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { memo, useCallback, useEffect, useRef } from "react";`
  - L55: `useEffect` → `useEffect(() => {`

### `src/components/site/ProductQA.tsx`
- Summary: `useEffect`×5
  - L1: `useEffect` → `import { useEffect, useRef, useState } from "react";`
  - L58: `useEffect` → `useEffect(() => {`
  - L62: `useEffect` → `useEffect(() => {`
  - L70: `useEffect` → `useEffect(() => {`
  - L77: `useEffect` → `useEffect(() => {`

### `src/components/site/ProductReviews.tsx`
- Summary: `addEventListener`×1, `removeEventListener`×1, `useEffect`×8
  - L1: `useEffect` → `import { useCallback, useEffect, useMemo, useRef, useState } from "react";`
  - L148: `useEffect` → `useEffect(() => { setLoading(true); load(); }, [load]);`
  - L149: `useEffect` → `useEffect(() => { loadMyVotes(); }, [loadMyVotes]);`
  - L150: `useEffect` → `useEffect(() => { loadEligibility(); }, [loadEligibility]);`
  - L153: `useEffect` → `useEffect(() => {`
  - L233: `useEffect` → `useEffect(() => { setVisibleCount(6); }, [filter, sort]);`
  - L1084: `useEffect` → `useEffect(() => {`
  - L1259: `useEffect` → `useEffect(() => {`
  - L1266: `addEventListener` → `window.addEventListener("keydown", onKey);`
  - L1268: `removeEventListener` → `return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };`

### `src/components/site/PromoBannerCarousel.tsx`
- Summary: `Suspense`×3, `lazy(`×1, `setInterval`×1, `useEffect`×4
  - L1: `useEffect` → `import { useEffect, useRef, useState, lazy, Suspense } from "react";`
  - L1: `Suspense` → `import { useEffect, useRef, useState, lazy, Suspense } from "react";`
  - L8: `lazy(` → `const BannerAdminSheet = lazy(() =>`
  - L76: `useEffect` → `useEffect(() => {`
  - L88: `useEffect` → `useEffect(() => {`
  - L91: `setInterval` → `const id = setInterval(() => setIdx((i) => (i + 1) % banners.length), 6000);`
  - L97: `useEffect` → `useEffect(() => {`
  - L123: `Suspense` → `{editing && <Suspense fallback={null}><BannerAdminSheet defaultType={types[0]} onClose={() => setEditing(false)} onChanged={fetchBanners} /></Suspense>}`
  - L234: `Suspense` → `{canEdit && editing && <Suspense fallback={null}><BannerAdminSheet defaultType={types[0]} onClose={() => setEditing(false)} onChanged={fetchBanners} /></Suspense>}`

### `src/components/site/RecentlyViewed.tsx`
- Summary: `setTimeout`×1
  - L53: `setTimeout` → `window.setTimeout(() => setJustAdded(false), 900);`

### `src/components/site/RecommendationStrip.tsx`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useState } from "react";`
  - L17: `useEffect` → `useEffect(() => {`

### `src/components/site/RegionLockCard.tsx`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useState } from "react";`
  - L32: `useEffect` → `useEffect(() => {`

### `src/components/site/RegionSelectModal.tsx`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useState } from "react";`
  - L93: `useEffect` → `useEffect(() => {`

### `src/components/site/ReturnRequestDialog.tsx`
- Summary: `setTimeout`×1, `useEffect`×2
  - L1: `useEffect` → `import { useRef, useState, useEffect } from "react";`
  - L57: `useEffect` → `useEffect(() => {`
  - L59: `setTimeout` → `const t = setTimeout(() => handleOpenChange(false), 1800);`

### `src/components/site/Reveal.tsx`
- Summary: `Suspense`×5, `lazy(`×2
  - L1: `Suspense` → `import { Suspense, lazy, type ReactNode } from "react";`
  - L15: `lazy(` → `const MotionReveal = lazy(() =>`
  - L18: `lazy(` → `const MotionCounter = lazy(() =>`
  - L53: `Suspense` → `<Suspense fallback={<div className={className}>{children}</div>}>`
  - L57: `Suspense` → `</Suspense>`
  - L80: `Suspense` → `<Suspense fallback={<span>{formatted}</span>}>`
  - L82: `Suspense` → `</Suspense>`

### `src/components/site/SearchCommand.tsx`
- Summary: `addEventListener`×1, `removeEventListener`×1, `requestAnimationFrame`×1, `useEffect`×6
  - L1: `useEffect` → `import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";`
  - L48: `useEffect` → `useEffect(() => {`
  - L54: `requestAnimationFrame` → `requestAnimationFrame(() => inputRef.current?.focus());`
  - L115: `useEffect` → `useEffect(() => { setLimit(PRODUCT_PAGE); }, [term]);`
  - L131: `useEffect` → `useEffect(() => { setActive(0); }, [items.length]);`
  - L155: `useEffect` → `useEffect(() => {`
  - L171: `addEventListener` → `window.addEventListener("keydown", onKey);`
  - L172: `removeEventListener` → `return () => window.removeEventListener("keydown", onKey);`
  - L176: `useEffect` → `useEffect(() => {`

### `src/components/site/ShareDialog.tsx`
- Summary: `setTimeout`×1, `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useState } from "react";`
  - L83: `useEffect` → `useEffect(() => onOpenShareDialog((d) => {`
  - L96: `setTimeout` → `setTimeout(() => setCopied(false), 2000);`

### `src/components/site/TestimonialsCarousel.tsx`
- Summary: `setInterval`×1, `useEffect`×3
  - L1: `useEffect` → `import { useEffect, useRef, useState } from "react";`
  - L62: `useEffect` → `useEffect(() => {`
  - L64: `setInterval` → `const id = setInterval(() => {`
  - L71: `useEffect` → `useEffect(() => {`

### `src/components/site/TicketRatingPrompt.tsx`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useCallback, useEffect, useState } from "react";`
  - L32: `useEffect` → `useEffect(() => { void check(); }, [check]);`

### `src/components/site/VirtualizedProductGrid.tsx`
- Summary: `IntersectionObserver`×2, `useEffect`×3
  - L1: `useEffect` → `import { memo, useEffect, useRef, useState } from "react";`
  - L39: `IntersectionObserver` → `* grow the visible window in small batches via an IntersectionObserver`
  - L65: `useEffect` → `useEffect(() => {`
  - L69: `useEffect` → `useEffect(() => {`
  - L72: `IntersectionObserver` → `const io = new IntersectionObserver(`

### `src/components/site/WishlistCard.tsx`
- Summary: `setTimeout`×1, `useEffect`×2
  - L2: `useEffect` → `import { useEffect, useState } from "react";`
  - L78: `setTimeout` → `window.setTimeout(() => setJustAdded(false), 900);`
  - L81: `useEffect` → `useEffect(() => {`

### `src/components/site/motion-primitives.tsx`
- Summary: `useEffect`×2
  - L2: `useEffect` → `import { useEffect, useRef, type ReactNode } from "react";`
  - L68: `useEffect` → `useEffect(() => {`

### `src/components/ui/calendar.tsx`
- Summary: `useEffect`×1
  - L148: `useEffect` → `React.useEffect(() => {`

### `src/components/ui/carousel.tsx`
- Summary: `useEffect`×2
  - L85: `useEffect` → `React.useEffect(() => {`
  - L93: `useEffect` → `React.useEffect(() => {`

### `src/components/ui/sidebar.tsx`
- Summary: `addEventListener`×1, `removeEventListener`×1, `useEffect`×1
  - L97: `useEffect` → `React.useEffect(() => {`
  - L105: `addEventListener` → `window.addEventListener("keydown", handleKeyDown);`
  - L106: `removeEventListener` → `return () => window.removeEventListener("keydown", handleKeyDown);`

### `src/hooks/use-autosave.ts`
- Summary: `addEventListener`×2, `removeEventListener`×2, `setTimeout`×2, `useEffect`×3
  - L1: `useEffect` → `import { useCallback, useEffect, useRef, useState } from "react";`
  - L46: `setTimeout` → `const timer = useRef<ReturnType<typeof setTimeout> | null>(null);`
  - L78: `useEffect` → `useEffect(() => {`
  - L84: `setTimeout` → `timer.current = setTimeout(() => {`
  - L94: `useEffect` → `useEffect(() => {`
  - L100: `addEventListener` → `document.addEventListener("visibilitychange", onHide);`
  - L101: `addEventListener` → `window.addEventListener("pagehide", onHide);`
  - L103: `removeEventListener` → `document.removeEventListener("visibilitychange", onHide);`
  - L104: `removeEventListener` → `window.removeEventListener("pagehide", onHide);`

### `src/hooks/use-compare.ts`
- Summary: `addEventListener`×1, `removeEventListener`×1, `useEffect`×2
  - L1: `useEffect` → `import { useCallback, useEffect, useState } from "react";`
  - L26: `useEffect` → `useEffect(() => {`
  - L31: `addEventListener` → `window.addEventListener("storage", onStorage);`
  - L32: `removeEventListener` → `return () => { subs.delete(sub); window.removeEventListener("storage", onStorage); };`

### `src/hooks/use-editor-protection.ts`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useCallback, useEffect, useMemo, useRef, useState } from "react";`
  - L82: `useEffect` → `useEffect(() => {`

### `src/hooks/use-mobile.tsx`
- Summary: `addEventListener`×1, `removeEventListener`×1, `useEffect`×1
  - L8: `useEffect` → `React.useEffect(() => {`
  - L13: `addEventListener` → `mql.addEventListener("change", onChange);`
  - L15: `removeEventListener` → `return () => mql.removeEventListener("change", onChange);`

### `src/hooks/use-recently-viewed.ts`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useCallback, useEffect, useRef, useState } from "react";`
  - L101: `useEffect` → `useEffect(() => {`

### `src/hooks/use-selection.ts`
- Summary: `setTimeout`×2
  - L12: `setTimeout` → `const timer = useRef<ReturnType<typeof setTimeout> | null>(null);`
  - L40: `setTimeout` → `timer.current = setTimeout(() => {`

### `src/hooks/use-undo-redo.ts`
- Summary: `addEventListener`×1, `removeEventListener`×1, `useEffect`×2
  - L1: `useEffect` → `import { useCallback, useEffect, useRef, useState } from "react";`
  - L75: `useEffect` → `useEffect(() => {`
  - L89: `addEventListener` → `window.addEventListener("keydown", onKey);`
  - L90: `removeEventListener` → `return () => window.removeEventListener("keydown", onKey);`

### `src/hooks/use-unsaved-guard.ts`
- Summary: `addEventListener`×1, `removeEventListener`×1, `useEffect`×2
  - L1: `useEffect` → `import { useEffect } from "react";`
  - L13: `useEffect` → `useEffect(() => {`
  - L20: `addEventListener` → `window.addEventListener("beforeunload", handler);`
  - L21: `removeEventListener` → `return () => window.removeEventListener("beforeunload", handler);`

### `src/lib/admin-mode.tsx`
- Summary: `useEffect`×2
  - L5: `useEffect` → `useEffect,`
  - L30: `useEffect` → `useEffect(() => {`

### `src/lib/auth.tsx`
- Summary: `useEffect`×3
  - L1: `useEffect` → `import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";`
  - L24: `useEffect` → `useEffect(() => {`
  - L38: `useEffect` → `useEffect(() => {`

### `src/lib/badge-visibility.tsx`
- Summary: `setInterval`×1, `useEffect`×2
  - L1: `useEffect` → `import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";`
  - L149: `useEffect` → `useEffect(() => {`
  - L150: `setInterval` → `const id = setInterval(() => setNow(Date.now()), 60_000);`

### `src/lib/bulk-products.ts`
- Summary: `setTimeout`×1
  - L53: `setTimeout` → `setTimeout(() => URL.revokeObjectURL(url), 1000);`

### `src/lib/cart.tsx`
- Summary: `useEffect`×7
  - L1: `useEffect` → `import { createContext, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";`
  - L92: `useEffect` → `useEffect(() => {`
  - L102: `useEffect` → `useEffect(() => {`
  - L177: `useEffect` → `useEffect(() => {`
  - L207: `useEffect` → `useEffect(() => {`
  - L373: `useEffect` → `useEffect(() => {`
  - L377: `useEffect` → `useEffect(() => {`

### `src/lib/chat-orders.ts`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useCallback, useEffect, useMemo, useRef, useState } from "react";`
  - L77: `useEffect` → `useEffect(() => {`

### `src/lib/chunk-recovery.ts`
- Summary: `Suspense`×1, `addEventListener`×3, `lazy(`×1, `setTimeout`×1
  - L58: `Suspense` → `* sees a working app instead of a blank Suspense boundary.`
  - L64: `lazy(` → `return lazy(async () => {`
  - L73: `setTimeout` → `await new Promise((r) => setTimeout(r, baseDelay * (attempt + 1)));`
  - L98: `addEventListener` → `window.addEventListener("vite:preloadError", (event) => {`
  - L104: `addEventListener` → `window.addEventListener("unhandledrejection", (event) => {`
  - L113: `addEventListener` → `window.addEventListener(`

### `src/lib/command-center.tsx`
- Summary: `addEventListener`×1, `removeEventListener`×1, `useEffect`×2
  - L1: `useEffect` → `import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";`
  - L16: `useEffect` → `useEffect(() => {`
  - L23: `addEventListener` → `window.addEventListener("keydown", onKey);`
  - L24: `removeEventListener` → `return () => window.removeEventListener("keydown", onKey);`

### `src/lib/crisp.ts`
- Summary: `addEventListener`×3, `removeEventListener`×2, `setTimeout`×2
  - L91: `setTimeout` → `setTimeout(finish, 0);`
  - L130: `setTimeout` → `else setTimeout(start, 2000);`
  - L134: `addEventListener` → `else window.addEventListener("load", schedule, { once: true });`
  - L156: `addEventListener` → `window.addEventListener(OPEN_EVENT, cb);`
  - L157: `removeEventListener` → `return () => window.removeEventListener(OPEN_EVENT, cb);`
  - L162: `addEventListener` → `window.addEventListener(CLOSE_EVENT, cb);`
  - L163: `removeEventListener` → `return () => window.removeEventListener(CLOSE_EVENT, cb);`

### `src/lib/error-capture.ts`
- Summary: `addEventListener`×3
  - L11: `addEventListener` → `if (typeof globalThis.addEventListener === "function") {`
  - L12: `addEventListener` → `globalThis.addEventListener("error", (event) => record((event as ErrorEvent).error ?? event));`
  - L13: `addEventListener` → `globalThis.addEventListener("unhandledrejection", (event) =>`

### `src/lib/layout-metrics.tsx`
- Summary: `MutationObserver`×1, `ResizeObserver`×1, `addEventListener`×2, `removeEventListener`×2, `requestAnimationFrame`×3, `useEffect`×2
  - L5: `useEffect` → `useEffect,`
  - L116: `requestAnimationFrame` → `requestAnimationFrame(measure);`
  - L124: `requestAnimationFrame` → `requestAnimationFrame(measure);`
  - L129: `useEffect` → `useEffect(() => {`
  - L134: `requestAnimationFrame` → `frame = requestAnimationFrame(measure);`
  - L138: `addEventListener` → `window.addEventListener("resize", schedule, { passive: true });`
  - L139: `addEventListener` → `window.addEventListener("orientationchange", schedule, { passive: true });`
  - L144: `ResizeObserver` → `const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(schedule) : null;`
  - L148: `MutationObserver` → `const mutationObserver = new MutationObserver(schedule);`
  - L153: `removeEventListener` → `window.removeEventListener("resize", schedule);`
  - L154: `removeEventListener` → `window.removeEventListener("orientationchange", schedule);`

### `src/lib/media-engine.ts`
- Summary: `addEventListener`×1
  - L205: `addEventListener` → `signal.addEventListener("abort", () => xhr.abort(), { once: true });`

### `src/lib/notifications.tsx`
- Summary: `MutationObserver`×2, `useEffect`×5
  - L1: `useEffect` → `import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode, type MouseEvent } from "react";`
  - L233: `MutationObserver` → `* Uses a MutationObserver so the prefix survives TanStack head() title swaps on`
  - L250: `useEffect` → `useEffect(() => {`
  - L255: `MutationObserver` → `const obs = new MutationObserver(() => apply());`
  - L260: `useEffect` → `useEffect(() => { apply(); }, [unread, apply]);`
  - L283: `useEffect` → `useEffect(() => { refresh(); }, [refresh]);`
  - L285: `useEffect` → `useEffect(() => {`

### `src/lib/oauth-return.ts`
- Summary: `setTimeout`×2
  - L56: `setTimeout` → `let timer: ReturnType<typeof setTimeout> | undefined;`
  - L61: `setTimeout` → `timer = setTimeout(() => reject(new Error("OAuth session exchange timed out")), timeoutMs);`

### `src/lib/perf-monitor.ts`
- Summary: `requestAnimationFrame`×2, `setInterval`×1
  - L47: `requestAnimationFrame` → `requestAnimationFrame(tick);`
  - L49: `requestAnimationFrame` → `requestAnimationFrame(tick);`
  - L56: `setInterval` → `setInterval(() => {`

### `src/lib/pincode-lookup.server.ts`
- Summary: `setTimeout`×1
  - L53: `setTimeout` → `const timer = setTimeout(() => controller.abort(), ms);`

### `src/lib/promo-code.ts`
- Summary: `addEventListener`×2, `removeEventListener`×2, `useEffect`×2
  - L1: `useEffect` → `import { useCallback, useEffect, useState } from "react";`
  - L24: `useEffect` → `useEffect(() => {`
  - L26: `addEventListener` → `window.addEventListener(EVT, sync);`
  - L27: `addEventListener` → `window.addEventListener("storage", sync);`
  - L29: `removeEventListener` → `window.removeEventListener(EVT, sync);`
  - L30: `removeEventListener` → `window.removeEventListener("storage", sync);`

### `src/lib/razorpay-loader.ts`
- Summary: `addEventListener`×2, `setTimeout`×2
  - L75: `addEventListener` → `existing.addEventListener("load", () => (window.Razorpay ? resolve() : reject(new Error("Failed to load Razorpay"))));`
  - L76: `addEventListener` → `existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay. Check your network.")));`
  - L83: `setTimeout` → `const timeout = setTimeout(() => reject(new Error("Failed to load Razorpay. Check your network.")), 12000);`
  - L111: `setTimeout` → `await new Promise((r) => setTimeout(r, 600));`

### `src/lib/region.tsx`
- Summary: `setTimeout`×1, `useEffect`×6
  - L4: `useEffect` → `useEffect,`
  - L172: `useEffect` → `useEffect(() => {`
  - L180: `useEffect` → `useEffect(() => {`
  - L188: `useEffect` → `useEffect(() => {`
  - L200: `useEffect` → `useEffect(() => {`
  - L202: `setTimeout` → `const t = setTimeout(() => {`
  - L211: `useEffect` → `useEffect(() => {`

### `src/lib/rotation.ts`
- Summary: `setInterval`×1, `setTimeout`×2, `useEffect`×3
  - L1: `useEffect` → `import { useEffect, useState } from "react";`
  - L11: `useEffect` → `useEffect(() => {`
  - L12: `setInterval` → `const id = setInterval(() => setSeed(orderWindowSeed(Date.now())), 60_000);`
  - L73: `useEffect` → `useEffect(() => {`
  - L74: `setTimeout` → `let timer: ReturnType<typeof setTimeout>;`
  - L81: `setTimeout` → `timer = setTimeout(() => {`

### `src/lib/section-analytics.ts`
- Summary: `IntersectionObserver`×2, `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useRef } from "react";`
  - L16: `useEffect` → `useEffect(() => {`
  - L18: `IntersectionObserver` → `// scrolls when multiple IntersectionObservers fire alongside product-grid`
  - L24: `IntersectionObserver` → `const io = new IntersectionObserver(`

### `src/lib/share.ts`
- Summary: `addEventListener`×1, `removeEventListener`×1
  - L78: `addEventListener` → `window.addEventListener(SHARE_EVENT, listener);`
  - L79: `removeEventListener` → `return () => window.removeEventListener(SHARE_EVENT, listener);`

### `src/lib/startup-diagnostics.ts`
- Summary: `MutationObserver`×2, `addEventListener`×14, `setInterval`×2, `setTimeout`×3, `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useRef } from "react";`
  - L73: `setTimeout` → `else window.setTimeout(persist, 250);`
  - L146: `addEventListener` → `navigator.serviceWorker.addEventListener("controllerchange", () => {`
  - L149: `addEventListener` → `navigator.serviceWorker.addEventListener("message", (event) => {`
  - L164: `addEventListener` → `registration.addEventListener("updatefound", () => {`
  - L207: `setTimeout` → `else window.setTimeout(() => snapshot(label), 750);`
  - L216: `MutationObserver` → `if (!isUltraLowEndAndroid() || typeof MutationObserver === "undefined") return;`
  - L231: `setInterval` → `const timer = window.setInterval(flush, 3000);`
  - L232: `MutationObserver` → `const observer = new MutationObserver((mutations) => {`
  - L253: `setTimeout` → `window.setTimeout(() => {`
  - L262: `addEventListener` → `document.addEventListener(`
  - L271: `addEventListener` → `document.addEventListener(`
  - L281: `addEventListener` → `window.addEventListener("pageshow", () => scheduleSnapshot("pageshow"));`
  - L282: `addEventListener` → `window.addEventListener("orientationchange", () => scheduleSnapshot("orientationchange"));`
  - L283: `addEventListener` → `document.addEventListener(`
  - L328: `addEventListener` → `window.addEventListener("error", (event) => {`
  - L340: `addEventListener` → `window.addEventListener("unhandledrejection", (event) => {`
  - L344: `addEventListener` → `window.addEventListener("pageshow", (event) => {`
  - … 5 more matching lines omitted for brevity

### `src/lib/support-presence.ts`
- Summary: `setInterval`×2, `setTimeout`×2, `useEffect`×4
  - L1: `useEffect` → `import { useCallback, useEffect, useRef, useState } from "react";`
  - L47: `useEffect` → `useEffect(() => {`
  - L55: `setInterval` → `const poll = setInterval(() => setTick(Date.now()), 30000);`
  - L98: `useEffect` → `useEffect(() => {`
  - L105: `setInterval` → `const poll = setInterval(load, 60000);`
  - L123: `setTimeout` → `const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);`
  - L125: `useEffect` → `useEffect(() => {`
  - L133: `setTimeout` → `hideTimer.current = setTimeout(() => setOtherTyping(false), 5000);`

### `src/lib/theme.tsx`
- Summary: `addEventListener`×1, `removeEventListener`×1, `useEffect`×4
  - L1: `useEffect` → `import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";`
  - L62: `useEffect` → `useEffect(() => {`
  - L69: `useEffect` → `useEffect(() => {`
  - L77: `useEffect` → `useEffect(() => {`
  - L85: `addEventListener` → `mql.addEventListener("change", onChange);`
  - L86: `removeEventListener` → `return () => mql.removeEventListener("change", onChange);`

### `src/lib/traffic-export.ts`
- Summary: `setTimeout`×1
  - L17: `setTimeout` → `setTimeout(() => URL.revokeObjectURL(url), 1000);`

### `src/lib/use-addresses.ts`
- Summary: `useEffect`×3
  - L1: `useEffect` → `import { useCallback, useEffect, useMemo, useState } from "react";`
  - L98: `useEffect` → `useEffect(() => {`
  - L104: `useEffect` → `useEffect(() => {`

### `src/lib/use-admin.ts`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useState } from "react";`
  - L87: `useEffect` → `useEffect(() => {`

### `src/lib/use-ai-operations.ts`
- Summary: `useEffect`×5
  - L1: `useEffect` → `import { useCallback, useEffect, useMemo, useRef, useState } from "react";`
  - L50: `useEffect` → `useEffect(() => {`
  - L62: `useEffect` → `useEffect(() => {`
  - L82: `useEffect` → `useEffect(() => {`
  - L108: `useEffect` → `useEffect(() => {`

### `src/lib/use-badge-settings.ts`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useState } from "react";`
  - L98: `useEffect` → `useEffect(() => {`

### `src/lib/use-categories.ts`
- Summary: `useEffect`×4
  - L1: `useEffect` → `import { useEffect, useState } from "react";`
  - L79: `useEffect` → `useEffect(() => {`
  - L131: `useEffect` → `useEffect(() => {`
  - L169: `useEffect` → `useEffect(() => {`

### `src/lib/use-checkout-analytics.ts`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useCallback, useEffect, useMemo, useState } from "react";`
  - L192: `useEffect` → `useEffect(() => {`

### `src/lib/use-checkout-funnel.ts`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useCallback, useEffect, useMemo, useState } from "react";`
  - L215: `useEffect` → `useEffect(() => {`

### `src/lib/use-customer-intel-summary.ts`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useState } from "react";`
  - L49: `useEffect` → `useEffect(() => {`

### `src/lib/use-executive-intelligence.ts`
- Summary: `setInterval`×1, `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useMemo, useState } from "react";`
  - L19: `useEffect` → `useEffect(() => {`
  - L35: `setInterval` → `const poll = setInterval(load, 60_000);`

### `src/lib/use-financial-marketing.ts`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useMemo, useState } from "react";`
  - L25: `useEffect` → `useEffect(() => {`

### `src/lib/use-flash-deals.ts`
- Summary: `setInterval`×1, `useEffect`×3
  - L1: `useEffect` → `import { useEffect, useMemo, useState } from "react";`
  - L47: `useEffect` → `useEffect(() => {`
  - L49: `setInterval` → `const id = setInterval(() => setNow(Date.now()), intervalMs);`
  - L80: `useEffect` → `useEffect(() => {`

### `src/lib/use-fraud-intelligence.ts`
- Summary: `useEffect`×3
  - L1: `useEffect` → `import { useCallback, useEffect, useRef, useState } from "react";`
  - L64: `useEffect` → `useEffect(() => {`
  - L99: `useEffect` → `useEffect(() => {`

### `src/lib/use-homepage-sections.ts`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useState } from "react";`
  - L60: `useEffect` → `useEffect(() => {`

### `src/lib/use-image-palette.ts`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useState } from "react";`
  - L33: `useEffect` → `useEffect(() => {`

### `src/lib/use-low-end-device.ts`
- Summary: `addEventListener`×3, `removeEventListener`×3, `useEffect`×6
  - L1: `useEffect` → `import { useEffect, useState } from "react";`
  - L42: `useEffect` → `useEffect(() => {`
  - L47: `addEventListener` → `mq.addEventListener?.("change", onChange);`
  - L48: `removeEventListener` → `return () => mq.removeEventListener?.("change", onChange);`
  - L112: `useEffect` → `useEffect(() => {`
  - L120: `useEffect` → `useEffect(() => {`
  - L125: `addEventListener` → `mq.addEventListener?.("change", onChange);`
  - L126: `removeEventListener` → `return () => mq.removeEventListener?.("change", onChange);`
  - L134: `useEffect` → `useEffect(() => {`
  - L176: `useEffect` → `useEffect(() => {`
  - L181: `addEventListener` → `mq.addEventListener?.("change", onChange);`
  - L182: `removeEventListener` → `return () => mq.removeEventListener?.("change", onChange);`

### `src/lib/use-marketplace.ts`
- Summary: `useEffect`×3
  - L1: `useEffect` → `import { useCallback, useEffect, useState } from "react";`
  - L66: `useEffect` → `useEffect(() => { load(); }, [load]);`
  - L69: `useEffect` → `useEffect(() => {`

### `src/lib/use-order-operations.ts`
- Summary: `setInterval`×1, `setTimeout`×2, `useEffect`×3
  - L1: `useEffect` → `import { useCallback, useEffect, useRef, useState } from "react";`
  - L18: `setTimeout` → `const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);`
  - L32: `useEffect` → `useEffect(() => {`
  - L38: `useEffect` → `useEffect(() => {`
  - L41: `setTimeout` → `debounce.current = setTimeout(() => load(true), 3000);`
  - L56: `setInterval` → `const poll = setInterval(() => load(true), 30000);`

### `src/lib/use-payment-gateways.ts`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useState } from "react";`
  - L60: `useEffect` → `useEffect(() => {`

### `src/lib/use-payment-methods.ts`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useCallback, useEffect, useRef, useState } from "react";`
  - L61: `useEffect` → `useEffect(() => {`

### `src/lib/use-product-badges.ts`
- Summary: `useEffect`×3
  - L1: `useEffect` → `import { useEffect, useMemo, useState, useSyncExternalStore } from "react";`
  - L230: `useEffect` → `useEffect(() => {`
  - L258: `useEffect` → `useEffect(() => {`

### `src/lib/use-products.ts`
- Summary: `addEventListener`×2, `useEffect`×3
  - L1: `useEffect` → `import { useEffect, useState } from "react";`
  - L37: `addEventListener` → `window.addEventListener("focus", refreshFromBrowserEvent);`
  - L38: `addEventListener` → `document.addEventListener("visibilitychange", refreshFromBrowserEvent);`
  - L67: `useEffect` → `useEffect(() => {`
  - L83: `useEffect` → `useEffect(() => {`

### `src/lib/use-realtime.ts`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useEffect } from "react";`
  - L10: `useEffect` → `useEffect(() => {`

### `src/lib/use-rotation-nonce.ts`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useState } from "react";`
  - L14: `useEffect` → `useEffect(() => {`

### `src/lib/use-serviceability-analytics.ts`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useCallback, useEffect, useMemo, useState } from "react";`
  - L137: `useEffect` → `useEffect(() => {`

### `src/lib/use-store-settings.ts`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useState } from "react";`
  - L35: `useEffect` → `useEffect(() => {`

### `src/lib/use-storefront-blocks.ts`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useState } from "react";`
  - L113: `useEffect` → `useEffect(() => {`

### `src/lib/use-support-settings.ts`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useState } from "react";`
  - L45: `useEffect` → `useEffect(() => {`

### `src/lib/use-support-unread.ts`
- Summary: `useEffect`×3
  - L1: `useEffect` → `import { useCallback, useEffect, useState } from 'react'`
  - L19: `useEffect` → `useEffect(() => {`
  - L47: `useEffect` → `useEffect(() => {`

### `src/lib/use-testimonials.ts`
- Summary: `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useState } from "react";`
  - L77: `useEffect` → `useEffect(() => {`

### `src/lib/use-traffic-intelligence.ts`
- Summary: `setInterval`×1, `setTimeout`×2, `useEffect`×3
  - L1: `useEffect` → `import { useCallback, useEffect, useRef, useState } from "react";`
  - L16: `setTimeout` → `const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);`
  - L28: `useEffect` → `useEffect(() => {`
  - L35: `useEffect` → `useEffect(() => {`
  - L38: `setTimeout` → `debounce.current = setTimeout(() => load(true), 2500);`
  - L47: `setInterval` → `const poll = setInterval(() => load(true), 20000);`

### `src/lib/use-traffic-summary.ts`
- Summary: `setInterval`×1, `setTimeout`×2, `useEffect`×2
  - L1: `useEffect` → `import { useEffect, useRef, useState } from "react";`
  - L15: `setTimeout` → `const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);`
  - L17: `useEffect` → `useEffect(() => {`
  - L30: `setTimeout` → `debounce.current = setTimeout(load, 3000);`
  - L38: `setInterval` → `const poll = setInterval(load, 30000);`

### `src/lib/use-user-intelligence.ts`
- Summary: `setInterval`×1, `setTimeout`×2, `useEffect`×3
  - L1: `useEffect` → `import { useCallback, useEffect, useRef, useState } from "react";`
  - L17: `setTimeout` → `const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);`
  - L31: `useEffect` → `useEffect(() => {`
  - L37: `useEffect` → `useEffect(() => {`
  - L40: `setTimeout` → `debounce.current = setTimeout(() => load(true), 3000);`
  - L50: `setInterval` → `const poll = setInterval(() => load(true), 30000);`

### `src/lib/wishlist-alerts.tsx`
- Summary: `useEffect`×4
  - L5: `useEffect` → `useEffect,`
  - L93: `useEffect` → `useEffect(() => {`
  - L98: `useEffect` → `useEffect(() => {`
  - L121: `useEffect` → `useEffect(() => {`

### `src/lib/wishlist.tsx`
- Summary: `useEffect`×4
  - L1: `useEffect` → `import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";`
  - L43: `useEffect` → `useEffect(() => {`
  - L79: `useEffect` → `useEffect(() => {`
  - L83: `useEffect` → `useEffect(() => {`

### `src/routes/__root.tsx`
- Summary: `Suspense`×5, `addEventListener`×4, `setTimeout`×4, `useEffect`×10
  - L2: `useEffect` → `import { Suspense, useEffect, useState } from "react";`
  - L2: `Suspense` → `import { Suspense, useEffect, useState } from "react";`
  - L77: `setTimeout` → `try { setTimeout(commit, 0); } catch(x) {}`
  - L81: `addEventListener` → `else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', commit, { once: true });`
  - L93: `addEventListener` → `window.addEventListener('vite:preloadError', function(e){ try { e.preventDefault(); } catch(x) {} window.__fomRecover(e && e.payload || e); });`
  - L94: `addEventListener` → `window.addEventListener('unhandledrejection', function(e){ if (isEntryFailure(e.reason)) { try { e.preventDefault(); } catch(x) {} window.__fomRecover(e.reason); } });`
  - L95: `addEventListener` → `window.addEventListener('error', function(e){ var t = e && e.target; var src = t && (t.src || t.href) || ''; if (isEntryFailure(e && e.message) || isEntryFailure(src)) window.__fom`
  - L359: `useEffect` → `useEffect(() => {`
  - L373: `setTimeout` → `const t = setTimeout(() => setReady(true), 1500);`
  - L381: `Suspense` → `<Suspense fallback={null}>`
  - L383: `Suspense` → `</Suspense>`
  - L388: `Suspense` → `<Suspense fallback={null}>`
  - L398: `Suspense` → `</Suspense>`
  - L463: `useEffect` → `useEffect(() => {`
  - L471: `setTimeout` → `const t = window.setTimeout(() => {`
  - L478: `useEffect` → `useEffect(() => {`
  - L497: `useEffect` → `useEffect(() => {`
  - L500: `useEffect` → `useEffect(() => {`
  - … 5 more matching lines omitted for brevity

### `src/routes/account.tsx`
- Summary: `setInterval`×2, `useEffect`×7
  - L3: `useEffect` → `import { useEffect, useMemo, useState, type ReactNode } from "react";`
  - L134: `useEffect` → `useEffect(() => {`
  - L138: `useEffect` → `useEffect(() => {`
  - L786: `useEffect` → `useEffect(() => {`
  - L804: `useEffect` → `useEffect(() => {`
  - L824: `useEffect` → `useEffect(() => {`
  - L826: `setInterval` → `const t = setInterval(() => setNow(Date.now()), 1000);`
  - L889: `useEffect` → `useEffect(() => {`
  - L890: `setInterval` → `const t = setInterval(() => setI((p) => (p + 1) % messages.length), 3000);`

### `src/routes/account_.addresses.tsx`
- Summary: `useEffect`×2
  - L2: `useEffect` → `import { useEffect, useMemo, useState } from "react";`
  - L59: `useEffect` → `useEffect(() => {`

### `src/routes/account_.history.tsx`
- Summary: `useEffect`×5
  - L2: `useEffect` → `import { useEffect, useMemo, useState, useRef } from "react";`
  - L67: `useEffect` → `useEffect(() => {`
  - L89: `useEffect` → `useEffect(() => {`
  - L93: `useEffect` → `useEffect(() => { setSearchHistory(readSearchHistory()); }, []);`
  - L95: `useEffect` → `useEffect(() => {`

### `src/routes/account_.orders.tsx`
- Summary: `setTimeout`×2, `useEffect`×5
  - L2: `useEffect` → `import { useEffect, useMemo, useState } from "react";`
  - L253: `useEffect` → `useEffect(() => {`
  - L309: `useEffect` → `useEffect(() => {`
  - L318: `useEffect` → `useEffect(() => {`
  - L320: `setTimeout` → `let t: ReturnType<typeof setTimeout> | null = null;`
  - L321: `setTimeout` → `const refresh = () => { if (t) clearTimeout(t); t = setTimeout(load, 400); };`
  - L382: `useEffect` → `useEffect(() => { setVisible(PAGE); }, [filter, q]);`

### `src/routes/account_.payment-methods.add.tsx`
- Summary: `setTimeout`×1, `useEffect`×2
  - L2: `useEffect` → `import { useEffect, useState } from "react";`
  - L71: `useEffect` → `useEffect(() => {`
  - L110: `setTimeout` → `setTimeout(() => nav({ to: "/account/payments" }), 1100);`

### `src/routes/account_.payments.tsx`
- Summary: `useEffect`×2
  - L2: `useEffect` → `import { useEffect, useMemo, useState } from "react";`
  - L168: `useEffect` → `useEffect(() => {`

### `src/routes/account_.preferences.tsx`
- Summary: `useEffect`×2
  - L2: `useEffect` → `import { useEffect, useState } from "react";`
  - L81: `useEffect` → `useEffect(() => {`

### `src/routes/account_.profile.tsx`
- Summary: `addEventListener`×1, `removeEventListener`×1, `setTimeout`×2, `useEffect`×6
  - L2: `useEffect` → `import { useEffect, useMemo, useRef, useState } from "react";`
  - L155: `useEffect` → `useEffect(() => {`
  - L159: `useEffect` → `useEffect(() => {`
  - L191: `useEffect` → `useEffect(() => {`
  - L197: `useEffect` → `useEffect(() => {`
  - L201: `setTimeout` → `const t = setTimeout(() => {`
  - L295: `setTimeout` → `setTimeout(() => nav({ to: "/account" }), 900);`
  - L575: `useEffect` → `useEffect(() => {`
  - L580: `addEventListener` → `document.addEventListener("mousedown", onDoc);`
  - L581: `removeEventListener` → `return () => document.removeEventListener("mousedown", onDoc);`

### `src/routes/account_.returns.tsx`
- Summary: `addEventListener`×3, `removeEventListener`×3, `setTimeout`×2, `useEffect`×6
  - L2: `useEffect` → `import { useEffect, useMemo, useState } from "react";`
  - L380: `useEffect` → `useEffect(() => { if (!loading && !user) nav({ to: "/auth" }); }, [loading, user, nav]);`
  - L393: `setTimeout` → `setTimeout(() => setCopied(false), 1800);`
  - L406: `addEventListener` → `document.addEventListener("visibilitychange", onHide, { once: true });`
  - L407: `addEventListener` → `window.addEventListener("blur", onHide, { once: true });`
  - L413: `setTimeout` → `window.setTimeout(() => {`
  - L414: `removeEventListener` → `document.removeEventListener("visibilitychange", onHide);`
  - L415: `removeEventListener` → `window.removeEventListener("blur", onHide);`
  - L427: `useEffect` → `useEffect(() => {`
  - L429: `addEventListener` → `window.addEventListener("scroll", onScroll, { passive: true });`
  - L430: `removeEventListener` → `return () => window.removeEventListener("scroll", onScroll);`
  - L433: `useEffect` → `useEffect(() => {`
  - L443: `useEffect` → `useEffect(() => {`
  - L460: `useEffect` → `useEffect(() => {`

### `src/routes/account_.security.tsx`
- Summary: `setTimeout`×1
  - L73: `setTimeout` → `setTimeout(() => setSuccess(false), 2200);`

### `src/routes/account_.support.tsx`
- Summary: `useEffect`×9
  - L2: `useEffect` → `import { useCallback, useEffect, useMemo, useRef, useState } from "react";`
  - L160: `useEffect` → `useEffect(() => { if (!loading && !user) nav({ to: "/auth" }); }, [loading, user, nav]);`
  - L163: `useEffect` → `useEffect(() => {`
  - L170: `useEffect` → `useEffect(() => {`
  - L195: `useEffect` → `useEffect(() => {`
  - L397: `useEffect` → `useEffect(() => {`
  - L415: `useEffect` → `useEffect(() => {`
  - L428: `useEffect` → `useEffect(() => {`
  - L640: `useEffect` → `useEffect(() => {`

### `src/routes/account_.support_.new.tsx`
- Summary: `useEffect`×3
  - L2: `useEffect` → `import { useEffect, useMemo, useState } from "react";`
  - L76: `useEffect` → `useEffect(() => {`
  - L81: `useEffect` → `useEffect(() => {`

### `src/routes/account_.support_.ticket.$ticketId.tsx`
- Summary: `useEffect`×6
  - L2: `useEffect` → `import { useCallback, useEffect, useMemo, useRef, useState } from "react";`
  - L116: `useEffect` → `useEffect(() => { if (!loading && !user) nav({ to: "/auth" }); }, [loading, user, nav]);`
  - L129: `useEffect` → `useEffect(() => {`
  - L147: `useEffect` → `useEffect(() => {`
  - L159: `useEffect` → `useEffect(() => {`
  - L170: `useEffect` → `useEffect(() => { autoGrow(); }, [reply, autoGrow]);`

### `src/routes/admin-acquisition-intelligence.tsx`
- Summary: `useEffect`×4
  - L2: `useEffect` → `import { useCallback, useEffect, useMemo, useState } from "react";`
  - L134: `useEffect` → `useEffect(() => { void load(); }, [load]);`
  - L135: `useEffect` → `useEffect(() => { logActivity("acquisition_intelligence_open", "marketing"); }, []);`
  - L138: `useEffect` → `useEffect(() => {`

### `src/routes/admin-activity.tsx`
- Summary: `useEffect`×2
  - L2: `useEffect` → `import { useEffect, useState } from "react";`
  - L17: `useEffect` → `useEffect(() => {`

### `src/routes/admin-ai-operations.tsx`
- Summary: `useEffect`×2
  - L2: `useEffect` → `import { useEffect } from "react";`
  - L19: `useEffect` → `useEffect(() => { logActivity("ai_operations_open", "ai_operations", undefined, view ? { view } : undefined); }, [view]);`

### `src/routes/admin-analytics.tsx`
- Summary: `setInterval`×1, `setTimeout`×2, `useEffect`×3
  - L2: `useEffect` → `import { useCallback, useEffect, useMemo, useRef, useState } from "react";`
  - L58: `useEffect` → `useEffect(() => { mv.set(value); }, [value, mv]);`
  - L156: `setTimeout` → `const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);`
  - L165: `useEffect` → `useEffect(() => {`
  - L168: `setTimeout` → `debounce.current = setTimeout(() => refetch(), 1500);`
  - L176: `setInterval` → `const poll = setInterval(() => refetch(), 45_000);`

### `src/routes/admin-badges-analytics.tsx`
- Summary: `useEffect`×3
  - L2: `useEffect` → `import { useEffect, useMemo, useRef, useState } from "react";`
  - L44: `useEffect` → `useEffect(() => {`
  - L79: `useEffect` → `useEffect(() => {`

### `src/routes/admin-badges.tsx`
- Summary: `useEffect`×4
  - L2: `useEffect` → `import { useEffect, useMemo, useRef, useState } from "react";`
  - L31: `useEffect` → `useEffect(() => {`
  - L124: `useEffect` → `useEffect(() => { setOrder(sorted.map((b) => b.id)); }, [sorted]);`
  - L127: `useEffect` → `useEffect(() => {`

### `src/routes/admin-bulk-badges.tsx`
- Summary: `useEffect`×2
  - L2: `useEffect` → `import { useCallback, useEffect, useMemo, useState } from "react";`
  - L69: `useEffect` → `useEffect(() => { void load(); }, [load]);`

### `src/routes/admin-categories-manage.tsx`
- Summary: `useEffect`×2
  - L2: `useEffect` → `import { useCallback, useEffect, useState } from "react";`
  - L33: `useEffect` → `useEffect(() => {`

### `src/routes/admin-categories.tsx`
- Summary: `useEffect`×2
  - L2: `useEffect` → `import { useEffect, useMemo, useState } from "react";`
  - L50: `useEffect` → `useEffect(() => {`

### `src/routes/admin-cms.tsx`
- Summary: `useEffect`×2
  - L2: `useEffect` → `import { useEffect, useState } from "react";`
  - L46: `useEffect` → `useEffect(() => { void load(); }, []);`

### `src/routes/admin-customer-intelligence.tsx`
- Summary: `requestAnimationFrame`×1, `setTimeout`×1, `useEffect`×3
  - L4: `useEffect` → `import { useEffect, useMemo, useState } from "react";`
  - L62: `useEffect` → `useEffect(() => {`
  - L75: `useEffect` → `useEffect(() => {`
  - L87: `requestAnimationFrame` → `if (id) requestAnimationFrame(() => {`
  - L92: `setTimeout` → `setTimeout(() => el.classList.remove("deep-link-flash"), 1800);`

### `src/routes/admin-customers.$customerId.tsx`
- Summary: `requestAnimationFrame`×1, `setTimeout`×3, `useEffect`×4
  - L2: `useEffect` → `import { useCallback, useEffect, useRef, useState } from "react";`
  - L81: `setTimeout` → `onClick={() => { navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 1200); }}`
  - L207: `useEffect` → `useEffect(() => { load(); loadNotes(); loadEmails(); loadTags(); loadTimeline(); }, [load, loadNotes, loadEmails, loadTags, loadTimeline]);`
  - L264: `useEffect` → `useEffect(() => {`
  - L269: `requestAnimationFrame` → `if (el) requestAnimationFrame(() => el.scrollIntoView({ behavior: "smooth", block: "start" }));`
  - L276: `useEffect` → `useEffect(() => {`
  - L277: `setTimeout` → `const ping = () => { setPulse(true); setTimeout(() => setPulse(false), 1000); load(); };`
  - L311: `setTimeout` → `setCopiedAll(true); setTimeout(() => setCopiedAll(false), 1500);`

### `src/routes/admin-customers.tsx`
- Summary: `setTimeout`×2, `useEffect`×5
  - L2: `useEffect` → `import { useCallback, useEffect, useMemo, useRef, useState } from "react";`
  - L98: `useEffect` → `useEffect(() => { const t = setTimeout(() => setSearch(query), 300); return () => clearTimeout(t); }, [query]);`
  - L98: `setTimeout` → `useEffect(() => { const t = setTimeout(() => setSearch(query), 300); return () => clearTimeout(t); }, [query]);`
  - L99: `useEffect` → `useEffect(() => { setPage(0); }, [search]);`
  - L117: `useEffect` → `useEffect(() => { load(); }, [load]);`
  - L119: `useEffect` → `useEffect(() => {`
  - L120: `setTimeout` → `const ping = () => { setPulse(true); setTimeout(() => setPulse(false), 1000); load(); };`

### `src/routes/admin-emails.tsx`
- Summary: `useEffect`×1
  - L2: `useEffect` → `import { useEffect, useMemo, useState } from "react";`

### `src/routes/admin-executive.tsx`
- Summary: `useEffect`×2
  - L2: `useEffect` → `import { useEffect } from "react";`
  - L20: `useEffect` → `useEffect(() => { logActivity("executive_dashboard_open", "executive", undefined, view ? { view } : undefined); }, [view]);`

### `src/routes/admin-financial.tsx`
- Summary: `setInterval`×1, `setTimeout`×2, `useEffect`×7
  - L2: `useEffect` → `import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";`
  - L59: `useEffect` → `useEffect(() => { mv.set(value); }, [value, mv]);`
  - L60: `useEffect` → `useEffect(() => spring.on("change", (v) => setTxt(decimals ? fmt2(v, currency) : fmt(v, currency))), [spring, currency, decimals]);`
  - L144: `setTimeout` → `const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);`
  - L147: `useEffect` → `useEffect(() => {`
  - L163: `useEffect` → `useEffect(() => { load(); }, [load]);`
  - L166: `useEffect` → `useEffect(() => {`
  - L169: `setTimeout` → `debounce.current = setTimeout(() => load(true), 900);`
  - L178: `setInterval` → `const poll = setInterval(() => load(true), 45_000);`
  - L639: `useEffect` → `useEffect(() => {`

### `src/routes/admin-flash-deals.tsx`
- Summary: `useEffect`×2
  - L2: `useEffect` → `import { useEffect, useMemo, useState } from "react";`
  - L119: `useEffect` → `useEffect(() => {`

### `src/routes/admin-inbox-placement.tsx`
- Summary: `useEffect`×2
  - L2: `useEffect` → `import { useEffect, useState } from "react";`
  - L74: `useEffect` → `useEffect(() => {`

### `src/routes/admin-inventory-intelligence.tsx`
- Summary: `useEffect`×2
  - L4: `useEffect` → `import { useEffect, useMemo, useState } from "react";`
  - L45: `useEffect` → `useEffect(() => {`

### `src/routes/admin-inventory.tsx`
- Summary: `useEffect`×2
  - L2: `useEffect` → `import { useEffect, useMemo, useState } from "react";`
  - L22: `useEffect` → `useEffect(() => { load(); }, []);`

### `src/routes/admin-live.tsx`
- Summary: `setInterval`×3, `useEffect`×8
  - L2: `useEffect` → `import { useCallback, useEffect, useMemo, useRef, useState } from "react";`
  - L63: `useEffect` → `useEffect(() => { mv.set(value); }, [value, mv]);`
  - L189: `useEffect` → `useEffect(() => {`
  - L190: `setInterval` → `const t = setInterval(() => force((n) => n + 1), 10_000);`
  - L195: `useEffect` → `useEffect(() => {`
  - L196: `setInterval` → `const t = setInterval(() => setEmptyIdx((i) => (i + 1) % EMPTY_MESSAGES.length), 4_000);`
  - L201: `useEffect` → `useEffect(() => {`
  - L218: `useEffect` → `useEffect(() => {`
  - L220: `setInterval` → `const t = setInterval(loadMetrics, 25_000);`
  - L225: `useEffect` → `useEffect(() => {`
  - L246: `useEffect` → `useEffect(() => {`

### `src/routes/admin-low-stock.tsx`
- Summary: `useEffect`×2
  - L2: `useEffect` → `import { useEffect, useMemo, useState } from "react";`
  - L32: `useEffect` → `useEffect(() => { fetchProducts().then(setProducts); }, []);`

### `src/routes/admin-marketing-automation.tsx`
- Summary: `requestAnimationFrame`×1, `useEffect`×4
  - L4: `useEffect` → `import { useEffect, useMemo, useState } from "react";`
  - L62: `useEffect` → `useEffect(() => {`
  - L74: `useEffect` → `useEffect(() => {`
  - L89: `requestAnimationFrame` → `requestAnimationFrame(() => {`
  - L477: `useEffect` → `useEffect(() => {`

### `src/routes/admin-marketing-growth.tsx`
- Summary: `setTimeout`×2, `useEffect`×4
  - L2: `useEffect` → `import { useCallback, useEffect, useMemo, useRef, useState } from "react";`
  - L87: `setTimeout` → `const tRef = useRef<ReturnType<typeof setTimeout> | null>(null);`
  - L120: `useEffect` → `useEffect(() => { void load(); void loadExecs(); }, [load, loadExecs]);`
  - L121: `useEffect` → `useEffect(() => {`
  - L126: `useEffect` → `useEffect(() => {`
  - L129: `setTimeout` → `tRef.current = setTimeout(() => { void load(true); void loadExecs(); void loadAttr(); }, 1500);`

### `src/routes/admin-marketing-metrics.tsx`
- Summary: `useEffect`×3
  - L2: `useEffect` → `import { useCallback, useEffect, useMemo, useState } from "react";`
  - L55: `useEffect` → `useEffect(() => { void load(); }, [load]);`
  - L58: `useEffect` → `useEffect(() => {`

### `src/routes/admin-marketing.tsx`
- Summary: `useEffect`×2
  - L2: `useEffect` → `import { useEffect, useRef, useState } from "react";`
  - L64: `useEffect` → `useEffect(() => { load(); }, []);`

### `src/routes/admin-marketplace-quality.tsx`
- Summary: `useEffect`×2
  - L2: `useEffect` → `import { useEffect, useMemo, useState } from "react";`
  - L86: `useEffect` → `useEffect(() => { logActivity("marketplace_quality_open", "marketplace_quality"); load(); }, []);`

### `src/routes/admin-media.tsx`
- Summary: `IntersectionObserver`×1, `useEffect`×3
  - L2: `useEffect` → `import { useCallback, useEffect, useRef, useState } from "react";`
  - L59: `useEffect` → `useEffect(() => {`
  - L67: `useEffect` → `useEffect(() => {`
  - L70: `IntersectionObserver` → `const io = new IntersectionObserver((entries) => {`

### `src/routes/admin-merchandising.tsx`
- Summary: `useEffect`×3
  - L2: `useEffect` → `import { useEffect, useMemo, useRef, useState } from "react";`
  - L43: `useEffect` → `useEffect(() => { fetchMerchProducts().then(setRows).catch((e) => toast.error("Load failed", { description: e.message })); }, []);`
  - L46: `useEffect` → `useEffect(() => {`

### `src/routes/admin-notifications.tsx`
- Summary: `useEffect`×4
  - L2: `useEffect` → `import { useCallback, useEffect, useMemo, useRef, useState } from "react";`
  - L128: `useEffect` → `useEffect(() => { oldest.current = null; load(true); }, [load]);`
  - L131: `useEffect` → `useEffect(() => {`
  - L140: `useEffect` → `useEffect(() => {`

### `src/routes/admin-orders-ops.tsx`
- Summary: `requestAnimationFrame`×1, `setTimeout`×1, `useEffect`×2
  - L2: `useEffect` → `import { useMemo, useState, useEffect } from "react";`
  - L204: `setTimeout` → `onClick={() => { navigator.clipboard?.writeText(value); setDone(true); setTimeout(() => setDone(false), 1200); }}`
  - L259: `useEffect` → `useEffect(() => {`
  - L759: `requestAnimationFrame` → `requestAnimationFrame(() => document.getElementById("recent-orders")?.scrollIntoView({ behavior: "smooth", block: "start" }));`

### `src/routes/admin-payments.tsx`
- Summary: `setTimeout`×2, `useEffect`×5
  - L2: `useEffect` → `import { useCallback, useEffect, useMemo, useRef, useState } from "react";`
  - L85: `useEffect` → `useEffect(() => { const t = setTimeout(() => setSearch(query), 300); return () => clearTimeout(t); }, [query]);`
  - L85: `setTimeout` → `useEffect(() => { const t = setTimeout(() => setSearch(query), 300); return () => clearTimeout(t); }, [query]);`
  - L86: `useEffect` → `useEffect(() => { setPage(0); }, [search, status]);`
  - L104: `useEffect` → `useEffect(() => { load(); }, [load]);`
  - L107: `useEffect` → `useEffect(() => {`
  - L108: `setTimeout` → `const ping = () => { setPulse(true); setTimeout(() => setPulse(false), 1000); load(); };`

### `src/routes/admin-performance.tsx`
- Summary: `useEffect`×2
  - L2: `useEffect` → `import { useEffect, useMemo, useState } from "react";`
  - L19: `useEffect` → `useEffect(() => { fetchProductPerformance(90).then(setData); }, []);`

### `src/routes/admin-product.$slug.index.tsx`
- Summary: `useEffect`×4
  - L2: `useEffect` → `import { useEffect, useMemo, useState } from "react";`
  - L144: `useEffect` → `useEffect(() => {`
  - L213: `useEffect` → `useEffect(() => {`
  - L606: `useEffect` → `useEffect(() => {`

### `src/routes/admin-products.tsx`
- Summary: `setTimeout`×2, `useEffect`×7
  - L7: `useEffect` → `import { useCallback, useEffect, useMemo, useRef, useState } from "react";`
  - L212: `useEffect` → `useEffect(() => {`
  - L213: `setTimeout` → `const t = setTimeout(() => setSearchTerm(query.trim().toLowerCase()), 250);`
  - L269: `setTimeout` → `setTimeout(() => setPulse(false), 1000);`
  - L275: `useEffect` → `useEffect(() => { loadProducts(); loadCategories(); loadStats(); loadSummary(); }, [loadProducts, loadCategories, loadStats, loadSummary]);`
  - L278: `useEffect` → `useEffect(() => {`
  - L495: `useEffect` → `useEffect(() => { setPage(1); }, [cat, state, stock, tag, searchTerm, sort, view, catalogTab]);`
  - L498: `useEffect` → `useEffect(() => {`
  - L1129: `useEffect` → `useEffect(() => { setStockInput(String(p.stock_quantity)); }, [p.stock_quantity]);`

### `src/routes/admin-quality.tsx`
- Summary: `useEffect`×2
  - L2: `useEffect` → `import { useEffect, useMemo, useState } from "react";`
  - L31: `useEffect` → `useEffect(() => {`

### `src/routes/admin-region.tsx`
- Summary: `useEffect`×3
  - L2: `useEffect` → `import { useEffect, useState, useCallback, type ReactNode } from "react";`
  - L158: `useEffect` → `useEffect(() => {`
  - L162: `useEffect` → `useEffect(() => {`

### `src/routes/admin-reports.tsx`
- Summary: `useEffect`×2
  - L2: `useEffect` → `import { useEffect, useState } from "react";`
  - L28: `useEffect` → `useEffect(() => {`

### `src/routes/admin-returns.tsx`
- Summary: `useEffect`×2
  - L2: `useEffect` → `import { useEffect, useMemo, useState } from "react";`
  - L55: `useEffect` → `useEffect(() => { void load(); }, []);`

### `src/routes/admin-search.tsx`
- Summary: `useEffect`×2
  - L2: `useEffect` → `import { useEffect, useState } from "react";`
  - L18: `useEffect` → `useEffect(() => {`

### `src/routes/admin-seed.tsx`
- Summary: `useEffect`×2
  - L2: `useEffect` → `import { useEffect, useState } from "react";`
  - L50: `useEffect` → `useEffect(() => { load(); }, []);`

### `src/routes/admin-seo-health.tsx`
- Summary: `useEffect`×2
  - L3: `useEffect` → `import { useCallback, useEffect, useState } from "react";`
  - L40: `useEffect` → `useEffect(() => { refresh(); }, [refresh]);`

### `src/routes/admin-seo-intelligence.tsx`
- Summary: `useEffect`×2
  - L2: `useEffect` → `import { useCallback, useEffect, useMemo, useState } from "react";`
  - L83: `useEffect` → `useEffect(() => { load(); }, [load]);`

### `src/routes/admin-shipments.tsx`
- Summary: `addEventListener`×1, `removeEventListener`×1, `setTimeout`×2, `useEffect`×5
  - L2: `useEffect` → `import { useEffect, useMemo, useRef, useState } from "react";`
  - L232: `useEffect` → `useEffect(() => {`
  - L234: `addEventListener` → `document.addEventListener("mousedown", onDoc);`
  - L235: `removeEventListener` → `return () => document.removeEventListener("mousedown", onDoc);`
  - L372: `setTimeout` → `const reloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);`
  - L374: `useEffect` → `useEffect(() => { void load(); }, []);`
  - L376: `useEffect` → `useEffect(() => {`
  - L391: `useEffect` → `useEffect(() => {`
  - L394: `setTimeout` → `reloadTimer.current = setTimeout(() => void load(true), 600);`

### `src/routes/admin-support.tsx`
- Summary: `setInterval`×1, `setTimeout`×2, `useEffect`×7
  - L2: `useEffect` → `import { useCallback, useEffect, useMemo, useRef, useState } from "react";`
  - L104: `setTimeout` → `const reloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);`
  - L108: `useEffect` → `useEffect(() => {`
  - L109: `setInterval` → `const id = setInterval(() => setNowTick(Date.now()), 30000);`
  - L115: `useEffect` → `useEffect(() => {`
  - L141: `useEffect` → `useEffect(() => {`
  - L143: `setTimeout` → `const schedule = () => { if (reloadTimer.current) clearTimeout(reloadTimer.current); reloadTimer.current = setTimeout(() => void load(), 600); };`
  - L349: `useEffect` → `useEffect(() => {`
  - L907: `useEffect` → `useEffect(() => {`
  - L1000: `useEffect` → `useEffect(() => {`

### `src/routes/admin.tsx`
- Summary: `useEffect`×7
  - L2: `useEffect` → `import { Fragment, useEffect, useState } from "react";`
  - L82: `useEffect` → `useEffect(() => { if (tabParam) setTab(tabParam); }, [tabParam]);`
  - L92: `useEffect` → `useEffect(() => { if (!loading && !user) nav({ to: "/auth" }); }, [loading, user, nav]);`
  - L94: `useEffect` → `useEffect(() => {`
  - L101: `useEffect` → `useEffect(() => {`
  - L735: `useEffect` → `useEffect(() => { load(); }, [slug]);`
  - L796: `useEffect` → `useEffect(() => { load(); }, [slug]);`

### `src/routes/auth.callback.tsx`
- Summary: `setTimeout`×4, `useEffect`×2
  - L2: `useEffect` → `import { useEffect, useState } from "react";`
  - L34: `useEffect` → `useEffect(() => {`
  - L36: `setTimeout` → `let timer: ReturnType<typeof setTimeout>;`
  - L43: `setTimeout` → `setTimeout(() => {`
  - L60: `setTimeout` → `timer = setTimeout(check, 400);`
  - L76: `setTimeout` → `const fail = setTimeout(() => {`

### `src/routes/auth.tsx`
- Summary: `useEffect`×3
  - L2: `useEffect` → `import { useEffect, useState } from "react";`
  - L90: `useEffect` → `useEffect(() => {`
  - L111: `useEffect` → `useEffect(() => {`

### `src/routes/blog.$slug.tsx`
- Summary: `useEffect`×2
  - L2: `useEffect` → `import { useEffect, useState } from "react";`
  - L62: `useEffect` → `useEffect(() => {`

### `src/routes/blog.tsx`
- Summary: `useEffect`×2
  - L2: `useEffect` → `import { useEffect, useState } from "react";`
  - L26: `useEffect` → `useEffect(() => {`

### `src/routes/cart.tsx`
- Summary: `useEffect`×2
  - L3: `useEffect` → `import { useEffect, useMemo, useState } from "react";`
  - L67: `useEffect` → `useEffect(() => { refreshProducts(); }, []);`

### `src/routes/category.$main.$sub.tsx`
- Summary: `useEffect`×2
  - L2: `useEffect` → `import { useCallback, useEffect, useMemo } from "react";`
  - L61: `useEffect` → `useEffect(() => {`

### `src/routes/category.$slug.tsx`
- Summary: `useEffect`×2
  - L2: `useEffect` → `import { useCallback, useEffect, useMemo } from "react";`
  - L87: `useEffect` → `useEffect(() => {`

### `src/routes/checkout.tsx`
- Summary: `IntersectionObserver`×2, `setInterval`×1, `setTimeout`×2, `useEffect`×17
  - L2: `useEffect` → `import { useEffect, useMemo, useRef, useState } from "react";`
  - L106: `useEffect` → `useEffect(() => {`
  - L111: `useEffect` → `useEffect(() => { refreshProducts(); }, []);`
  - L116: `useEffect` → `useEffect(() => {`
  - L129: `useEffect` → `useEffect(() => {`
  - L133: `useEffect` → `useEffect(() => {`
  - L141: `useEffect` → `useEffect(() => {`
  - L146: `useEffect` → `useEffect(() => {`
  - L148: `setInterval` → `const t = setInterval(() => setReserveLeft((s) => (s > 0 ? s - 1 : 0)), 1000);`
  - L160: `useEffect` → `useEffect(() => {`
  - L183: `useEffect` → `useEffect(() => {`
  - L212: `useEffect` → `useEffect(() => {`
  - L295: `setTimeout` → `await new Promise((r) => setTimeout(r, 600));`
  - L373: `setTimeout` → `setTimeout(() => resolve(LOGO_PRIMARY), 1500);`
  - L618: `useEffect` → `useEffect(() => {`
  - L689: `useEffect` → `useEffect(() => {`
  - L702: `useEffect` → `useEffect(() => { if (stage === "review") fireOnce("checkout_started"); }, [stage]); // eslint-disable-line react-hooks/exhaustive-deps`
  - L703: `useEffect` → `useEffect(() => { if (checkoutState.addressValid) fireOnce("address_selected"); }, [checkoutState.addressValid]); // eslint-disable-line react-hooks/exhaustive-deps`
  - … 4 more matching lines omitted for brevity

### `src/routes/continue-shopping.tsx`
- Summary: `useEffect`×2
  - L2: `useEffect` → `import { useEffect, useMemo, useState } from "react";`
  - L147: `useEffect` → `useEffect(() => {`

### `src/routes/deals.tsx`
- Summary: `setInterval`×1, `useEffect`×2
  - L2: `useEffect` → `import { useCallback, useEffect, useMemo, useState } from "react";`
  - L49: `useEffect` → `useEffect(() => {`
  - L50: `setInterval` → `const id = setInterval(() => setNow(Date.now()), 1000);`

### `src/routes/help.seller-assistance.tsx`
- Summary: `addEventListener`×1, `removeEventListener`×1, `setInterval`×1, `setTimeout`×7, `useEffect`×3
  - L2: `useEffect` → `import { useEffect, useRef, useState } from "react";`
  - L161: `useEffect` → `useEffect(() => {`
  - L164: `setInterval` → `const id = setInterval(tick, 30_000);`
  - L166: `addEventListener` → `document.addEventListener("visibilitychange", onVis);`
  - L167: `removeEventListener` → `return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVis); };`
  - L192: `setTimeout` → `const calendlyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);`
  - L194: `useEffect` → `useEffect(() => {`
  - L201: `setTimeout` → `calendlyTimeoutRef.current = setTimeout(() => {`
  - L219: `setTimeout` → `calendlyTimeoutRef.current = setTimeout(() => {`
  - L253: `setTimeout` → `setTimeout(() => {`
  - L260: `setTimeout` → `setTimeout(() => {`
  - L274: `setTimeout` → `setTimeout(() => {`
  - L333: `setTimeout` → `await new Promise((r) => setTimeout(r, 1100));`

### `src/routes/help.tsx`
- Summary: `setTimeout`×4, `useEffect`×4
  - L2: `useEffect` → `import { useEffect, useMemo, useRef, useState } from "react";`
  - L196: `setTimeout` → `setTimeout(() => setCopied(null), 1800);`
  - L512: `useEffect` → `useEffect(() => { scrollRef.current?.scrollTo({ top: 9999, behavior: "smooth" }); }, [messages, typing]);`
  - L520: `setTimeout` → `setTimeout(() => {`
  - L623: `setTimeout` → `onBlur={() => setTimeout(() => setFocus(false), 150)}`
  - L677: `useEffect` → `useEffect(() => { const t = setTimeout(() => setLoaded(true), 350); return () => clearTimeout(t); }, []);`
  - L677: `setTimeout` → `useEffect(() => { const t = setTimeout(() => setLoaded(true), 350); return () => clearTimeout(t); }, []);`
  - L679: `useEffect` → `useEffect(() => {`

### `src/routes/index.tsx`
- Summary: `Suspense`×3, `addEventListener`×1, `lazy(`×1, `removeEventListener`×1, `setInterval`×1, `setTimeout`×1, `useEffect`×3
  - L2: `useEffect` → `import { Suspense, lazy, useEffect, useMemo, useState } from "react";`
  - L2: `Suspense` → `import { Suspense, lazy, useEffect, useMemo, useState } from "react";`
  - L16: `lazy(` → `const CategoryAdminSheet = lazy(() =>`
  - L62: `useEffect` → `useEffect(() => {`
  - L64: `setInterval` → `const id = setInterval(() => setIdx((i) => (i + 1) % PLACEHOLDERS.length), 2800);`
  - L376: `useEffect` → `useEffect(() => {`
  - L379: `addEventListener` → `window.addEventListener("resize", onResize);`
  - L380: `removeEventListener` → `return () => window.removeEventListener("resize", onResize);`
  - L517: `setTimeout` → `onBlur={() => setTimeout(() => setSearchFocused(false), 120)}`
  - L671: `Suspense` → `<Suspense fallback={null}>`
  - L673: `Suspense` → `</Suspense>`

### `src/routes/lovable/email/queue/process.ts`
- Summary: `setTimeout`×1
  - L317: `setTimeout` → `await new Promise((r) => setTimeout(r, sendDelayMs))`

### `src/routes/orders.$id.tsx`
- Summary: `useEffect`×3
  - L2: `useEffect` → `import { useEffect, useState } from "react";`
  - L57: `useEffect` → `useEffect(() => {`
  - L61: `useEffect` → `useEffect(() => {`

### `src/routes/pages.$slug.tsx`
- Summary: `useEffect`×2
  - L2: `useEffect` → `import { useEffect, useState } from "react";`
  - L24: `useEffect` → `useEffect(() => {`

### `src/routes/products.$slug.tsx`
- Summary: `Suspense`×5, `addEventListener`×3, `lazy(`×2, `removeEventListener`×3, `requestAnimationFrame`×2, `setTimeout`×2, `useEffect`×9
  - L6: `useEffect` → `import { useState, useEffect, useMemo, lazy, Suspense } from "react";`
  - L6: `Suspense` → `import { useState, useEffect, useMemo, lazy, Suspense } from "react";`
  - L31: `lazy(` → `const AdminProductPanel = lazy(() =>`
  - L34: `lazy(` → `const AdminImageManager = lazy(() =>`
  - L215: `useEffect` → `useEffect(() => {`
  - L220: `useEffect` → `useEffect(() => {`
  - L240: `useEffect` → `useEffect(() => {`
  - L244: `setTimeout` → `const t = setTimeout(() => {`
  - L251: `useEffect` → `useEffect(() => { refreshProducts(); }, []);`
  - L253: `useEffect` → `useEffect(() => {`
  - L256: `setTimeout` → `const fallback = window.setTimeout(() => { if (active) setDataReady(true); }, 1200);`
  - L288: `useEffect` → `useEffect(() => {`
  - L309: `requestAnimationFrame` → `window.requestAnimationFrame(evaluate);`
  - L313: `addEventListener` → `window.addEventListener("scroll", onScroll, { passive: true });`
  - L314: `addEventListener` → `window.addEventListener("resize", onScroll, { passive: true });`
  - L315: `addEventListener` → `window.visualViewport?.addEventListener("resize", onScroll, { passive: true });`
  - L317: `removeEventListener` → `window.removeEventListener("scroll", onScroll);`
  - L318: `removeEventListener` → `window.removeEventListener("resize", onScroll);`
  - … 8 more matching lines omitted for brevity

### `src/routes/reset-password.tsx`
- Summary: `setTimeout`×2, `useEffect`×2
  - L2: `useEffect` → `import { useEffect, useState } from "react";`
  - L24: `useEffect` → `useEffect(() => {`
  - L32: `setTimeout` → `const t = setTimeout(async () => {`
  - L54: `setTimeout` → `setTimeout(() => nav({ to: "/account" }), 1400);`

### `src/routes/returns.tsx`
- Summary: `setInterval`×1, `useEffect`×2
  - L4: `useEffect` → `import { useEffect, useMemo, useRef, useState } from "react";`
  - L499: `useEffect` → `useEffect(() => {`
  - L500: `setInterval` → `const t = setInterval(() => setNow(Date.now()), 1000);`

### `src/routes/search.tsx`
- Summary: `addEventListener`×1, `removeEventListener`×1, `useEffect`×6
  - L2: `useEffect` → `import { useCallback, useEffect, useMemo, useState } from "react";`
  - L209: `useEffect` → `useEffect(() => {`
  - L216: `addEventListener` → `window.addEventListener("scroll", onScroll, { passive: true });`
  - L217: `removeEventListener` → `return () => window.removeEventListener("scroll", onScroll);`
  - L232: `useEffect` → `useEffect(() => { if (drawerOpen) setDraft(currentFilters); /* eslint-disable-next-line */ }, [drawerOpen]);`
  - L234: `useEffect` → `useEffect(() => {`
  - L249: `useEffect` → `useEffect(() => {`
  - L277: `useEffect` → `useEffect(() => {`

### `src/routes/track.tsx`
- Summary: `setInterval`×1, `useEffect`×6
  - L4: `useEffect` → `import { useEffect, useMemo, useRef, useState } from "react";`
  - L92: `useEffect` → `useEffect(() => {`
  - L126: `useEffect` → `useEffect(() => {`
  - L144: `useEffect` → `useEffect(() => {`
  - L173: `useEffect` → `useEffect(() => {`
  - L194: `useEffect` → `useEffect(() => {`
  - L196: `setInterval` → `const id = setInterval(() => setTick((t) => t + 1), 1000);`

### `src/routes/unsubscribe.tsx`
- Summary: `useEffect`×2
  - L2: `useEffect` → `import { useEffect, useState } from 'react'`
  - L36: `useEffect` → `useEffect(() => {`

### `src/routes/wishlist.tsx`
- Summary: `useEffect`×5
  - L2: `useEffect` → `import { useEffect, useMemo, useState } from "react";`
  - L112: `useEffect` → `useEffect(() => {`
  - L123: `useEffect` → `useEffect(() => {`
  - L148: `useEffect` → `useEffect(() => {`
  - L676: `useEffect` → `useEffect(() => {`

## Image decoding, canvas, palette extraction, WebGL

Terms scanned: `canvas`, `getContext`, `createImageBitmap`, `ImageBitmap`, `decode()`, `new Image`, `drawImage`, `getImageData`, `webgl`, `WebGL`.

### `src/components/admin/CategoryAdminSheet.tsx`
- Summary: `ImageBitmap`×1, `canvas`×5, `createImageBitmap`×1, `drawImage`×1, `getContext`×1
  - L102: `createImageBitmap` → `const bitmap = await createImageBitmap(file);`
  - L102: `ImageBitmap` → `const bitmap = await createImageBitmap(file);`
  - L107: `canvas` → `const canvas = document.createElement("canvas");`
  - L108: `canvas` → `canvas.width = w;`
  - L109: `canvas` → `canvas.height = h;`
  - L110: `canvas` → `const ctx = canvas.getContext("2d");`
  - L110: `getContext` → `const ctx = canvas.getContext("2d");`
  - L112: `drawImage` → `ctx.drawImage(bitmap, 0, 0, w, h);`
  - L114: `canvas` → `canvas.toBlob((b) => res(b), "image/jpeg", 0.82),`

### `src/components/builder/BlockPreview.tsx`
- Summary: `canvas`×1
  - L26: `canvas` → `* Schematic live preview of a block on the builder canvas. Reflects block data`

### `src/components/site/HeroCarousel.tsx`
- Summary: `new Image`×1
  - L115: `new Image` → `const img = new Image();`

### `src/components/ui/sidebar.tsx`
- Summary: `canvas`×8
  - L158: `canvas` → `collapsible?: "offcanvas" | "icon" | "none";`
  - L165: `canvas` → `collapsible = "offcanvas",`
  - L226: `canvas` → `"group-data-[collapsible=offcanvas]:w-0",`
  - L237: `canvas` → `? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"`
  - L238: `canvas` → `: "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",`
  - L302: `canvas` → `"group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:bg-sidebar",`
  - L303: `canvas` → `"[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",`
  - L304: `canvas` → `"[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",`

### `src/lib/image-palette.ts`
- Summary: `canvas`×6, `drawImage`×1, `getContext`×1, `getImageData`×1, `new Image`×1
  - L4: `canvas` → `// outer edges/corners on a downscaled offscreen canvas, then exposes that exact`
  - L119: `new Image` → `const img = new Image();`
  - L132: `canvas` → `const canvas = document.createElement("canvas");`
  - L133: `canvas` → `canvas.width = size;`
  - L134: `canvas` → `canvas.height = size;`
  - L135: `canvas` → `const ctx = canvas.getContext("2d", { willReadFrequently: true });`
  - L135: `getContext` → `const ctx = canvas.getContext("2d", { willReadFrequently: true });`
  - L137: `drawImage` → `ctx.drawImage(img, 0, 0, size, size);`
  - L138: `getImageData` → `const { data } = ctx.getImageData(0, 0, size, size);`
  - L146: `canvas` → `// never downloads the full-resolution original just to draw a 32px canvas.`

### `src/lib/media-engine.ts`
- Summary: `ImageBitmap`×3, `canvas`×11, `drawImage`×2, `getContext`×2, `new Image`×1
  - L74: `ImageBitmap` → `export function loadImageBitmap(file: Blob): Promise<HTMLImageElement> {`
  - L77: `new Image` → `const img = new Image();`
  - L101: `canvas` → `const canvas = document.createElement("canvas");`
  - L102: `canvas` → `canvas.width = w;`
  - L103: `canvas` → `canvas.height = h;`
  - L104: `canvas` → `const ctx = canvas.getContext("2d");`
  - L104: `getContext` → `const ctx = canvas.getContext("2d");`
  - L107: `drawImage` → `ctx.drawImage(source, 0, 0, w, h);`
  - L109: `canvas` → `canvas.toBlob(`
  - L128: `ImageBitmap` → `const img = await loadImageBitmap(file);`
  - L133: `canvas` → `const canvas = document.createElement("canvas");`
  - L134: `canvas` → `canvas.width = rotated ? ch : cw;`
  - L135: `canvas` → `canvas.height = rotated ? cw : ch;`
  - L136: `canvas` → `const ctx = canvas.getContext("2d");`
  - L136: `getContext` → `const ctx = canvas.getContext("2d");`
  - L138: `canvas` → `ctx.translate(canvas.width / 2, canvas.height / 2);`
  - L140: `drawImage` → `ctx.drawImage(`
  - L152: `canvas` → `canvas.toBlob(`
  - L248: `ImageBitmap` → `const img = await loadImageBitmap(file);`

### `src/lib/startup-diagnostics.ts`
- Summary: `webgl`×2
  - L263: `webgl` → `"webglcontextlost",`
  - L272: `webgl` → `"webglcontextrestored",`

### `src/lib/use-image-palette.ts`
- Summary: `canvas`×2
  - L16: `canvas` → `* a SECOND time into a canvas (extra decode + canvas/GPU memory per card). On`
  - L34: `canvas` → `// Constrained devices never sample: skip the second decode + canvas memory.`

### `src/routes/checkout.tsx`
- Summary: `new Image`×1
  - L368: `new Image` → `const probe = new Image();`

### `src/styles.css`
- Summary: `canvas`×1
  - L600: `canvas` → `img, video, svg, canvas { max-width: 100%; height: auto; }`

## Ultra Low-End Android implementation checklist

- Synchronous `<html data-ultra-low-end="true">` before first paint for Android + constrained signal.
- Last CSS block disables animations, transitions, transforms, perspective, filters, backdrop filters, blend modes, masks, will-change, contain/content-visibility, isolation and decorative glows only in ultra mode.
- Product media uses a static path in ultra mode: no palette wait, no skeleton shimmer, no opacity reveal transition.
- Product image recycling avoids clearing `src/srcset` on unmount in ultra mode, preventing forced texture teardown during scroll.
- Storage image variants are capped smaller in ultra mode to reduce decoded texture size.
- Deferred lazy overlays are skipped in ultra mode to avoid late Suspense/code-split memory spikes.
- Diagnostics log GPU context loss, image decode errors and short-lived compositor-layer candidate mutations.