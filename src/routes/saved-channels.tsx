// routes/saved-channels.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getSavedChannels, auth } from "../services/firebase"; // Ensure auth is exported
import { ChannelCard } from "../components/ChannelCard";
import { Loader2, BookmarkX } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/saved-channels")({
  component: SavedChannelsPage,
});

function SavedChannelsPage() {
  const [userId, setUserId] = useState<string | null>(
    auth.currentUser?.uid || null,
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null);
    });
    return () => unsubscribe();
  }, []);

  const {
    data: saved,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["saved-channels", userId],
    queryFn: getSavedChannels,
    enabled: !!userId,
  });

  if (isLoading || (!userId && !saved)) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Saved Channels</h1>
        {isFetching && (
          <Loader2 className="animate-spin h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {saved?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <BookmarkX className="h-12 w-12 mb-4 opacity-20" />
          <p>You haven't saved any channels yet.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {saved?.map((channel) => (
            <ChannelCard key={channel.id} channel={channel} isSaved={true} />
          ))}
        </div>
      )}
    </div>
  );
}
