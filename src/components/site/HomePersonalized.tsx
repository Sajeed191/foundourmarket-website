import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { fetchTrendingSlugs } from "@/lib/personalization";
import { RecommendationStrip } from "./RecommendationStrip";
import { RecommendedForYou } from "./RecommendedForYou";
import { useAuth } from "@/lib/auth";

export function HomePersonalized() {
  const { user } = useAuth();
  const [trending, setTrending] = useState<string[]>([]);

  useEffect(() => {
    fetchTrendingSlugs(8).then(setTrending);
  }, [user?.id]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <RecommendedForYou
        title={user ? "Recommended For You" : "Discover Something You'll Love"}
        subtitle={
          user
            ? "Curated from what you browse, save, and shop"
            : "Curated highlights across the marketplace"
        }
      />
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
