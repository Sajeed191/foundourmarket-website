import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Region = "IN" | "INTL";
type Ctx = {
  region: Region;
  currency: "INR" | "USD";
  symbol: "₹" | "$";
  setRegion: (r: Region) => void;
  format: (usd: number) => string;
};

const INR_RATE = 83; // static placeholder rate

const RegionContext = createContext<Ctx | null>(null);

export function RegionProvider({ children }: { children: ReactNode }) {
  const [region, setRegionState] = useState<Region>("INTL");

  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("region")) as Region | null;
    if (saved === "IN" || saved === "INTL") {
      setRegionState(saved);
      return;
    }
    // Auto-detect via browser locale
    const lang = typeof navigator !== "undefined" ? navigator.language : "";
    if (lang.toLowerCase().includes("in")) setRegionState("IN");
  }, []);

  const setRegion = (r: Region) => {
    setRegionState(r);
    if (typeof window !== "undefined") localStorage.setItem("region", r);
  };

  const currency = region === "IN" ? "INR" : "USD";
  const symbol = region === "IN" ? "₹" : "$";

  const format = (usd: number) => {
    if (region === "IN") {
      const v = Math.round(usd * INR_RATE);
      return `₹${v.toLocaleString("en-IN")}`;
    }
    return `$${usd.toFixed(2)}`;
  };

  return (
    <RegionContext.Provider value={{ region, currency, symbol, setRegion, format }}>
      {children}
    </RegionContext.Provider>
  );
}

export function useRegion() {
  const ctx = useContext(RegionContext);
  if (!ctx) throw new Error("useRegion must be inside RegionProvider");
  return ctx;
}
