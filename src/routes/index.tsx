import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { auth, getFeedVideos } from "../services/firebase";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { Loader2, History, Sparkles } from "lucide-react";
import VideoCard from "#/components/VideoCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { YTVideo } from "#/types/yt";

export const Route = createFileRoute("/")({ component: App });

function App() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(
    auth.currentUser?.uid || null,
  );
  const [authLoading, setAuthLoading] = useState(!auth.currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate({ to: "/login" });
      } else {
        setUserId(user.uid);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  const { data: feedVideos, isLoading: isQueryLoading } = useQuery({
    queryKey: ["feed-videos", userId],
    queryFn: getFeedVideos,
    enabled: !!userId,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 60 * 24,
  });

  const isLoading = authLoading || isQueryLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-900" />
      </div>
    );
  }

  // Filter videos by status
  const latestVideos =
    feedVideos?.filter((v) => v.details.status === "next") || [];
  const watchingVideos =
    feedVideos?.filter((v) => v.details.status === "watching") || [];

  const hasContent = (feedVideos?.length || 0) > 0;

  return (
    <main className="page-wrap px-4 py-8 max-w-7xl mx-auto">
      {!hasContent ? (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/30 rounded-2xl border-2 border-dashed p-6">
          <p className="text-muted-foreground">
            No videos found. Save some channels to see your feed!
          </p>
          <Link to="/search" className="mt-4 font-medium hover:underline">
            Go to Search →
          </Link>
        </div>
      ) : (
        <Tabs defaultValue="latest" className="w-full">
          <div className="flex justify-start mb-8">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="latest" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Latest
              </TabsTrigger>
              <TabsTrigger value="watching" className="flex items-center gap-2">
                <History className="h-4 w-4" /> Watching
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="latest" className="mt-0 outline-none">
            <VideoGrid
              videos={latestVideos}
              emptyMessage="No new videos in your feed."
            />
          </TabsContent>

          <TabsContent value="watching" className="mt-0 outline-none">
            <VideoGrid
              videos={watchingVideos}
              emptyMessage="You haven't started watching any videos yet."
            />
          </TabsContent>
        </Tabs>
      )}
    </main>
  );
}

// Sub-component to keep the code clean
function VideoGrid({
  videos,
  emptyMessage,
}: {
  videos: YTVideo[];
  emptyMessage: string;
}) {
  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border rounded-xl bg-muted/10">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {videos.map((video) => (
        <VideoCard
          video={video}
          key={video.snippet?.resourceId?.videoId || video.id}
        />
      ))}
    </div>
  );
}
