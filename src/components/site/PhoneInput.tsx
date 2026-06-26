import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

/** Convert an ISO country code (e.g. "IN") into its flag emoji. */
function flagEmoji(cc: string): string {
  return cc
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

// Friendly country names without pulling an extra dependency.
const REGION_NAMES =
  typeof Intl !== "undefined" && "DisplayNames" in Intl
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;

type CountryOption = { cc: string; name: string; dial: string };

/**
 * Build the full international country list lazily. Computing ~250 entries with
 * Intl.DisplayNames is only needed for the International market, so we defer it
 * until the selector is actually opened (Indian users never pay this cost).
 */
let COUNTRY_CACHE: CountryOption[] | null = null;
function buildCountries(): CountryOption[] {
  if (COUNTRY_CACHE) return COUNTRY_CACHE;
  COUNTRY_CACHE = getCountries()
    .map((cc) => ({
      cc,
      name: REGION_NAMES?.of(cc) ?? cc,
      dial: getCountryCallingCode(cc),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return COUNTRY_CACHE;
}

type Props = {
  /** Stored value in E.164 format (e.g. +919876543210) */
  value: string;
  /** Emits E.164 (or "" while empty) plus validity */
  onChange: (e164: string, valid: boolean) => void;
  onBlur?: () => void;
  defaultCountry?: CountryCode;
  /**
   * When false, the component will NOT auto-detect the country from the
   * browser locale. Use this when the parent supplies a region-derived
   * `defaultCountry` so an en-GB browser never forces +44 on an Indian user.
   */
  autoDetect?: boolean;
  /**
   * When set, the country is FIXED and the selector is hidden entirely.
   * Used for the India-only market: 🇮🇳 +91, no dropdown, no flag picker,
   * and validation is locked to Indian mobile numbers.
   */
  lockCountry?: CountryCode;
  invalid?: boolean;
  id?: string;
  placeholder?: string;
};

export function PhoneInput({
  value,
  onChange,
  onBlur,
  defaultCountry = "IN",
  autoDetect = true,
  lockCountry,
  invalid,
  id,
  placeholder = "Phone number",
}: Props) {
  const locked = !!lockCountry;
  const parsed = useMemo(
    () => (value ? parsePhoneNumberFromString(value) : undefined),
    [value]
  );
  const [country, setCountry] = useState<CountryCode>(
    lockCountry ?? (parsed?.country as CountryCode) ?? defaultCountry
  );
  const [national, setNational] = useState<string>(
    parsed ? parsed.formatNational() : ""
  );
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const autoDetected = useRef(false);

  // Country is permanently fixed in locked mode — keep state pinned to it.
  useEffect(() => {
    if (lockCountry) setCountry(lockCountry);
  }, [lockCountry]);

  // Auto-detect country once, only when there is no value yet AND the parent
  // has not supplied an authoritative region-derived default. Never in locked mode.
  useEffect(() => {
    if (locked || autoDetected.current || value || !autoDetect) return;
    autoDetected.current = true;
    try {
      const locale = navigator.language || "";
      const region = locale.split("-")[1]?.toUpperCase();
      if (region && (getCountries() as string[]).includes(region)) {
        setCountry(region as CountryCode);
      }
    } catch {
      /* keep default */
    }
  }, [value, autoDetect, locked]);

  // Follow a region-derived default country while the field is still empty.
  useEffect(() => {
    if (locked || value) return;
    setCountry(defaultCountry);
  }, [defaultCountry, value, locked]);


  // Keep local country in sync if a parsed value arrives later (edit mode).
  // In locked mode the country stays fixed regardless of the parsed value.
  useEffect(() => {
    if (locked) return;
    if (parsed?.country) {
      setCountry(parsed.country as CountryCode);
      setNational(parsed.formatNational());
    }
  }, [parsed, locked]);

  // Close dropdown on outside click.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const emit = (nationalInput: string, cc: CountryCode) => {
    const formatter = new AsYouType(cc);
    const formatted = formatter.input(nationalInput);
    setNational(formatted);
    const number = formatter.getNumber();
    if (number) onChange(number.number, number.isValid());
    else onChange(nationalInput.trim() ? "" : "", false);
  };

  const pickCountry = (cc: CountryCode) => {
    setCountry(cc);
    setOpen(false);
    setQuery("");
    // Re-emit with new country context.
    const digits = national.replace(/\D/g, "");
    emit(digits, cc);
  };

  // Only build the heavy international list when the picker is actually used.
  const filtered = useMemo(() => {
    if (locked || !open) return [];
    const all = buildCountries();
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.cc.toLowerCase().includes(q) ||
        c.dial.includes(q)
    );
  }, [query, open, locked]);

  return (
    <div ref={rootRef} className="relative">
      <div
        className={`flex items-stretch rounded-2xl border bg-background/60 transition-all focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/40 ${
          invalid ? "border-destructive/60" : "border-border"
        }`}
      >
        {locked ? (
          <div
            aria-label={`Country code +${getCountryCallingCode(country)}`}
            className="flex items-center gap-1.5 pl-3 pr-2.5 text-sm border-r border-border/70 shrink-0 select-none"
          >
            <span className="text-base leading-none">{flagEmoji(country)}</span>
            <span className="font-mono text-xs text-muted-foreground">
              +{getCountryCallingCode(country)}
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label="Select country"
            aria-expanded={open}
            className="flex items-center gap-1.5 pl-3 pr-2.5 text-sm border-r border-border/70 shrink-0"
          >
            <span className="text-base leading-none">{flagEmoji(country)}</span>
            <span className="font-mono text-xs text-muted-foreground">
              +{getCountryCallingCode(country)}
            </span>
            <ChevronDown className="size-3 text-muted-foreground" />
          </button>
        )}
        <input
          id={id}
          inputMode="tel"
          autoComplete="tel"
          placeholder={placeholder}
          value={national}
          onChange={(e) => emit(e.target.value, country)}
          onBlur={onBlur}
          className="flex-1 min-w-0 bg-transparent px-3 py-3 text-sm outline-none"
        />
      </div>

      {!locked && open && (
        <div className="absolute z-50 mt-1.5 w-full max-h-64 overflow-hidden rounded-2xl border border-border bg-popover shadow-xl">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="size-3.5 text-muted-foreground" />
            <input
              autoFocus
              placeholder="Search country"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.map((c) => (
              <li key={c.cc}>
                <button
                  type="button"
                  onClick={() => pickCountry(c.cc as CountryCode)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-accent/10"
                >
                  <span className="text-base leading-none">{flagEmoji(c.cc)}</span>
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">+{c.dial}</span>
                  {c.cc === country && <Check className="size-3.5 text-accent" />}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-4 text-center text-xs text-muted-foreground">No matches</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
