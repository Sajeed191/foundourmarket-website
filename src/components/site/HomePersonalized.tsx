import { useEffect, useState } from "react";
import { TrendingUp, Sparkles } from "lucide-react";
import { fetchPersonalizedSlugs, fetchTrendingSlugs } from "@/lib/personalization";
import { RecommendationStrip } from "./RecommendationStrip";
import { useAuth } from "@/lib/auth";

export function HomePersonalized() {
  const { user } = useAuth();
  const [personal, setPersonal] = useState<string[]>([]);
  const [trending, setTrending] = useState<string[]>([]);

  useEffect(() => {
    fetchPersonalizedSlugs(8).then(setPersonal);
    fetchTrendingSlugs(8).then(setTrending);
  }, [user?.id]);

  if (!personal.length && !trending.length) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      {personal.length > 0 && (
        <RecommendationStrip
          title={user ? "Picked for you" : "Discover something you'll love"}
          subtitle={user ? "Based on what you've browsed recently" : "Curated highlights across the marketplace"}
          icon={<Sparkles className="size-3" />}
          slugs={personal}
        />
      )}
      {trending.length > 0 && (
        <RecommendationStrip
          title="Trending this week"
          subtitle="What everyone's shopping right now"
          icon={<TrendingUp className="size-3" />}
          slugs={trending}
        />
      )}
    </div>
  );
}
