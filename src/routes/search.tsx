// routes/search.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, SearchX } from "lucide-react";
import { ChannelCard } from "#/components/ChannelCard";
import { useEffect, useMemo } from "react";
import { fbQueries, ytQueries } from "#/services/query-factory";

// Define search params type for type-safety
type SearchParams = {
  q?: string;
};

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      q: (search.q as string) || "",
    };
  },
  component: SearchResults,
});

function SearchResults() {
  const { q } = Route.useSearch();

  const { data: ytChannels, isLoading } = useQuery(
    ytQueries.searchYtChannels(q),
  );

  const channelIds = useMemo(() => {
    return ytChannels?.map((c) => c.id) || [];
  }, [ytChannels]);

  const { data: channelIdsInFb } = useQuery(
    fbQueries.savedYTChannelIds(channelIds),
  );

  useEffect(() => {
    console.log(channelIds, channelIdsInFb);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!q) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <SearchX className="h-12 w-12 mb-4" />
        <p>Enter a search term to find channels.</p>
      </div>
    );
  }
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Channel results for "{q}"</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {channelIdsInFb &&
          ytChannels?.map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              isSaved={channelIdsInFb.has(channel.id) ?? false}
            />
          ))}
      </div>
    </div>
  );
}
