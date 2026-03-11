import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { auth, getLatestVideos, getWatchingVideos } from "../services/firebase";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { Loader2, History, Sparkles } from "lucide-react";
import VideoCard from "#/components/VideoCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  const { data: videosInProgress, isLoading: isQueryLoading } = useQuery({
    queryKey: ["videos-inprogress", userId],
    queryFn: getWatchingVideos,
    enabled: !!userId,
    refetchOnWindowFocus: false,
  });

  const { data: latestVideos, isLoading: isVLLoading } = useQuery({
    queryKey: ["latest-videos", userId],
    queryFn: getLatestVideos,
    enabled: !!userId,
    refetchOnWindowFocus: false,
  });

  const isLoading = authLoading || isQueryLoading || isVLLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-900" />
      </div>
    );
  }

  const hasContent =
    (videosInProgress?.length || 0) > 0 || (latestVideos?.length || 0) > 0;

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
            <TabsList className="grid w-full max-w-100 grid-cols-2">
              <TabsTrigger value="latest" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Latest
              </TabsTrigger>
              <TabsTrigger value="watching" className="flex items-center gap-2">
                <History className="h-4 w-4" /> Watching
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="latest" className="mt-0 outline-none">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {latestVideos?.map((video) => (
                <VideoCard
                  video={video}
                  key={video.snippet.resourceId.videoId}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="watching" className="mt-0 outline-none">
            {videosInProgress && videosInProgress.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {videosInProgress.map((video) => (
                  <VideoCard video={video} key={video.id} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 border rounded-xl ">
                <p className="text-muted-foreground">
                  You haven't started watching any videos yet.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </main>
  );
}
