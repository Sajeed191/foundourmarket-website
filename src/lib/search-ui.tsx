import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

// Single source of truth for the app-wide immersive search surface. Every entry
// point (top nav search icon, bottom nav search tab, ⌘K, etc.) calls the same
// `openSearch()` handler so the exact same UI, state, and animation opens no
// matter where the user triggers it from.
type SearchUIContextValue = {
  open: boolean;
  openSearch: () => void;
  closeSearch: () => void;
};

const SearchUIContext = createContext<SearchUIContextValue | null>(null);

export function SearchUIProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openSearch = useCallback(() => setOpen(true), []);
  const closeSearch = useCallback(() => setOpen(false), []);
  return (
    <SearchUIContext.Provider value={{ open, openSearch, closeSearch }}>
      {children}
    </SearchUIContext.Provider>
  );
}

export function useSearchUI(): SearchUIContextValue {
  const ctx = useContext(SearchUIContext);
  if (!ctx) {
    // Safe no-op fallback so triggers rendered outside the provider never crash.
    return { open: false, openSearch: () => {}, closeSearch: () => {} };
  }
  return ctx;
}
