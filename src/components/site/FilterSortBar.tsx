import { useEffect, useState, type ReactNode } from "react";
import { SlidersHorizontal, ArrowUpDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type Option<K extends string> = { key: K; label: string };

/**
 * Reusable premium Filter + Sort bar.
 *
 * - Pure presentation: filtering/sorting logic stays in the parent.
 * - Radix DropdownMenu gives single-open behaviour (opening one closes the
 *   other via outside-click), keyboard support, focus management and
 *   screen-reader semantics for free.
 * - Selection is persisted to localStorage when `storageKey` is provided.
 *
 * Drop into Wishlist, Browse, Search, Recently Viewed, Recommended — anywhere
 * that already computes its own filtered/sorted product list.
 */
export function useFilterSort<F extends string, S extends string>(opts: {
  storageKey?: string;
  defaultFilter: F;
  defaultSort: S;
}) {
  const { storageKey, defaultFilter, defaultSort } = opts;
  const [filter, setFilterState] = useState<F>(defaultFilter);
  const [sort, setSortState] = useState<S>(defaultSort);

  // Hydrate persisted selection after mount (avoids SSR mismatch).
  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw) as { filter?: F; sort?: S };
        if (saved.filter) setFilterState(saved.filter);
        if (saved.sort) setSortState(saved.sort);
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const persist = (next: { filter: F; sort: S }) => {
    if (!storageKey || typeof window === "undefined") return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const setFilter = (f: F) => {
    setFilterState(f);
    persist({ filter: f, sort });
  };
  const setSort = (s: S) => {
    setSortState(s);
    persist({ filter, sort: s });
  };

  return { filter, sort, setFilter, setSort } as const;
}

const triggerClass =
  "inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-[11px] font-bold uppercase tracking-widest text-foreground transition-all duration-200 hover:border-accent/40 active:scale-[0.97] data-[state=open]:border-accent/60 data-[state=open]:bg-accent/10 data-[state=active]:border-accent/50";

const contentClass =
  "min-w-52 rounded-2xl border border-border bg-popover/95 p-1.5 shadow-2xl backdrop-blur-xl";

const itemClass =
  "flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-colors data-[highlighted]:bg-accent/10 data-[highlighted]:text-accent";

function Chip<K extends string>({
  icon,
  label,
  value,
  count,
  active,
  options,
  selected,
  onSelect,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  count?: number;
  active: boolean;
  options: Option<K>[];
  selected: K;
  onSelect: (k: K) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={triggerClass}
        data-active={active || undefined}
        aria-label={`${label}: ${value}`}
      >
        {icon}
        <span className="flex items-baseline gap-1.5 normal-case">
          <span className="text-muted-foreground">{label}</span>
          <span aria-hidden className="text-muted-foreground/50">
            •
          </span>
          <span className="max-w-28 truncate font-semibold text-foreground">{value}</span>
        </span>
        {count ? (
          <span className="ml-0.5 grid size-4 place-items-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground">
            {count}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={contentClass}>
        {options.map((o) => {
          const isSel = o.key === selected;
          return (
            <DropdownMenuItem
              key={o.key}
              onSelect={() => onSelect(o.key)}
              className={`${itemClass} ${isSel ? "bg-accent/10 text-accent" : ""}`}
            >
              {o.label}
              {isSel && <Check className="size-4 shrink-0 text-accent" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function FilterSortBar<F extends string, S extends string>({
  filterOptions,
  sortOptions,
  filter,
  sort,
  onFilterChange,
  onSortChange,
  isFilterActive,
  className,
}: {
  filterOptions: Option<F>[];
  sortOptions: Option<S>[];
  filter: F;
  sort: S;
  onFilterChange: (f: F) => void;
  onSortChange: (s: S) => void;
  /** When true, the filter chip shows the active-count badge. */
  isFilterActive?: boolean;
  className?: string;
}) {
  const activeFilter = filterOptions.find((f) => f.key === filter) ?? filterOptions[0];
  const activeSort = sortOptions.find((s) => s.key === sort) ?? sortOptions[0];

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <Chip
        icon={<SlidersHorizontal className="size-3.5 shrink-0" />}
        label="Filter"
        value={activeFilter.label}
        count={isFilterActive ? 1 : 0}
        active={!!isFilterActive}
        options={filterOptions}
        selected={filter}
        onSelect={onFilterChange}
      />
      <Chip
        icon={<ArrowUpDown className="size-3.5 shrink-0" />}
        label="Sort"
        value={activeSort.label}
        active={false}
        options={sortOptions}
        selected={sort}
        onSelect={onSortChange}
      />
    </div>
  );
}
