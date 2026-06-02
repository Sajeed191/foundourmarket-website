import { useCallback, useSyncExternalStore, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

/**
 * Accordion open/closed state lives OUTSIDE React component state so that it
 * survives re-renders, query refetches, and remounts of the editor subtree.
 * Each module is keyed by a stable id (defaults to its title). Editing a field
 * can never collapse a section because the open flag is not part of form data
 * and is not recreated on render.
 */
const openStore = new Map<string, boolean>();
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function getOpen(id: string, defaultOpen: boolean): boolean {
  return openStore.has(id) ? (openStore.get(id) as boolean) : defaultOpen;
}

function setOpen(id: string, value: boolean) {
  openStore.set(id, value);
  emit();
}

/** Collapse every tracked section (for a "Collapse All" control). */
export function collapseAllModules() {
  for (const key of openStore.keys()) openStore.set(key, false);
  emit();
}

/** Expand every tracked section (for an "Expand All" control). */
export function expandAllModules() {
  for (const key of openStore.keys()) openStore.set(key, true);
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function CollapsibleModule({
  eyebrow, title, badge, defaultOpen = true, sectionId, children,
}: {
  eyebrow?: string;
  title: string;
  badge?: ReactNode;
  defaultOpen?: boolean;
  /** Stable id for persistence; defaults to the title (titles are unique). */
  sectionId?: string;
  children: ReactNode;
}) {
  const id = sectionId ?? title;
  const open = useSyncExternalStore(
    subscribe,
    () => getOpen(id, defaultOpen),
    () => defaultOpen,
  );
  const toggle = useCallback(() => setOpen(id, !getOpen(id, defaultOpen)), [id, defaultOpen]);

  return (
    <div className="relative overflow-hidden card-premium rounded-2xl">
      <div
        className="pointer-events-none absolute -top-20 -right-20 size-40 rounded-full opacity-30"
        style={{ background: "var(--gradient-ember-soft)", filter: "blur(28px)" }}
      />
      <button
        type="button"
        onClick={toggle}
        className="relative w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
      >
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-muted-foreground">{eyebrow}</p>
          )}
          <h2 className="text-sm font-medium mt-0.5 truncate">{title}</h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {badge}
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}>
            <ChevronDown className="size-4 text-muted-foreground" />
          </motion.span>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 34, opacity: { duration: 0.2 } }}
            className="overflow-hidden"
          >
            <div className="relative px-4 pb-4 pt-0">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
