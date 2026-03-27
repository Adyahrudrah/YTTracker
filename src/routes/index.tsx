import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { auth, getFeedVideos } from "../services/firebase";
import { useState, useEffect, useMemo } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { Loader2, Sparkles, Save } from "lucide-react";
import VideoCard from "#/components/VideoCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
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
      if (!user) navigate({ to: "/login" });
      else setUserId(user.uid);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  const { data: feedVideos, isLoading: isQueryLoading } = useQuery({
    queryKey: ["feed-videos", userId],
    queryFn: getFeedVideos,
    enabled: !!userId,
    staleTime: 1000 * 60 * 60 * 24,
  });

  const groupedSavedVideos = useMemo(() => {
    const saved = feedVideos?.filter((v) => v.details.status === "watch") || [];
    return saved.reduce(
      (acc, video) => {
        const channel = video.snippet.channelTitle || "Unknown Channel";
        if (!acc[channel]) acc[channel] = [];
        acc[channel].push(video);
        return acc;
      },
      {} as Record<string, YTVideo[]>,
    );
  }, [feedVideos]);

  const watchingVideos =
    feedVideos?.filter((v) => v.details.status === "watching") || [];

  if (authLoading || isQueryLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-900" />
      </div>
    );
  }

  return (
    <main className="page-wrap px-4 py-8 max-w-7xl mx-auto">
      <Tabs defaultValue="watching" className="w-full">
        <div className="flex justify-start mb-8">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="watching" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Watching
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <Save className="h-4 w-4" /> Saved
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="watching" className="mt-0 outline-none">
          <VideoGrid
            videos={watchingVideos}
            emptyMessage="No new videos in your feed."
          />
        </TabsContent>

        <TabsContent
          value="saved"
          className="mt-0 outline-none space-y-16 pb-20"
        >
          {Object.entries(groupedSavedVideos).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border rounded-xl bg-muted/10">
              <p className="text-muted-foreground">No saved videos found.</p>
            </div>
          ) : (
            Object.entries(groupedSavedVideos).map(([channel, videos]) => (
              <div key={channel} className="space-y-4">
                <h2 className="text-xl font-bold tracking-tight px-1">
                  {channel}
                </h2>
                <Carousel
                  opts={{
                    align: "start",
                    loop: false,
                  }}
                  className="w-full"
                >
                  <CarouselContent className="-ml-4">
                    {videos.map((video) => (
                      <CarouselItem
                        key={video.snippet?.resourceId?.videoId || video.id}
                        className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4 max-w-[80dvw]"
                      >
                        <div className="p-1 ">
                          <VideoCard video={video} />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <div className="hidden md:block">
                    <CarouselPrevious className="-left-12 border-none bg-transparent hover:bg-muted" />
                    <CarouselNext className="-right-12 border-none bg-transparent hover:bg-muted" />
                  </div>
                </Carousel>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}

function VideoGrid({
  videos,
  emptyMessage,
}: {
  videos: YTVideo[];
  emptyMessage: string;
}) {
  if (videos.length === 0)
    return (
      <div className="text-center py-20 border rounded-xl">{emptyMessage}</div>
    );
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
