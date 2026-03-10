import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getLatestVideosFromAllChannels, auth } from "../services/firebase";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { Loader2, Tv } from "lucide-react";
import VideoCard from "#/components/VideoCard";

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

  const { data: latestVideos, isLoading: isQueryLoading } = useQuery({
    queryKey: ["root-latest-videos", userId],
    queryFn: getLatestVideosFromAllChannels,
    enabled: !!userId,
  });

  const isLoading = authLoading || isQueryLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-900" />
      </div>
    );
  }

  return (
    <main className="page-wrap px-4 pb-8 pt-14 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Feed
          </h1>
          <p className="text-muted-foreground mt-1">
            Latest updates from your saved channels
          </p>
        </div>
        <Tv className="h-8 w-8 text-blue-600 opacity-20" />
      </div>

      {!latestVideos || latestVideos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/30 rounded-2xl border-2 border-dashed p-6">
          <p className="text-muted-foreground">
            No videos found. Save some channels to see your feed!
          </p>
          <Link
            to="/search"
            className="mt-4 text-blue-600 font-medium hover:underline"
          >
            Go to Search →
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {latestVideos.map((video) => (
            <VideoCard video={video} key={video.id} />
          ))}
        </div>
      )}
    </main>
  );
}
