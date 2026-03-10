import { createFileRoute } from "@tanstack/react-router";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { fetchChannelVideos } from "../services/youtube";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  RefreshCw,
  Smartphone,
  PlayCircle,
  SortAsc,
} from "lucide-react";
import { useMemo, useEffect, useState } from "react";
import { toast } from "sonner";
import VideoCard from "#/components/VideoCard";
import {
  auth,
  getSavedVideosForChannel,
  isChannelExist,
  saveVideosToChannel,
} from "#/services/firebase";
import type { YTVideo } from "#/types/yt";
import { VideoCardSkeleton } from "#/components/ui/skeletons.tsx/dd";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseISO8601ToSeconds } from "#/utils/base";

export const Route = createFileRoute("/channel/$channelId")({
  validateSearch: (search) => search,
  component: ChannelVideosPage,
});

type SortOption = "time" | "views" | "duration";

function ChannelVideosPage() {
  const { channelId } = Route.useParams();
  const userId = auth.currentUser?.uid;
  const queryClient = useQueryClient();
  const queryKey = ["channel-videos", channelId, userId];

  const [sortBy, setSortBy] = useState<SortOption>("time");
  const [shouldLoadAll, setShouldLoadAll] = useState(false);

  const { data: isSaved } = useQuery({
    queryKey: ["saved-channel", channelId],
    queryFn: () => isChannelExist(channelId),
    enabled: !!userId,
  });

  const { data: savedVideos, isLoading: isLoadingSaved } = useQuery({
    queryKey: ["saved-videos", channelId],
    queryFn: () => getSavedVideosForChannel(channelId),
    enabled: !!userId,
  });

  const isFirebaseEmpty =
    !isLoadingSaved && (!savedVideos || savedVideos.length === 0);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey,
      queryFn: ({ pageParam }) => fetchChannelVideos(channelId, pageParam),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.nextPageToken,
      refetchOnWindowFocus: false,
      enabled: !!userId && isFirebaseEmpty,
    });

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && shouldLoadAll) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, shouldLoadAll]);

  const sortVideos = (videos: YTVideo[], criterion: SortOption) => {
    const items = [...videos];
    switch (criterion) {
      case "views":
        return items.sort(
          (a, b) =>
            Number(b.details?.viewCount || 0) -
            Number(a.details?.viewCount || 0),
        );
      case "duration":
        return items.sort(
          (a, b) =>
            (parseISO8601ToSeconds(b.details?.duration) || 0) -
            (parseISO8601ToSeconds(a.details?.duration) || 0),
        );
      case "time":
      default:
        return items.sort(
          (a, b) =>
            new Date(b.snippet.publishedAt).getTime() -
            new Date(a.snippet.publishedAt).getTime(),
        );
    }
  };

  const allVideos = useMemo(() => {
    let baseVideos: YTVideo[] = [];
    if (savedVideos && savedVideos.length > 0) {
      baseVideos = savedVideos;
    } else {
      baseVideos = data?.pages.flatMap((page) => page.videos) || [];
    }
    return sortVideos(baseVideos, sortBy);
  }, [data, savedVideos, sortBy]);

  useEffect(() => {
    if (
      allVideos.length > 0 &&
      !hasNextPage &&
      !isFetchingNextPage &&
      isFirebaseEmpty &&
      !isLoading &&
      userId &&
      shouldLoadAll &&
      isSaved
    ) {
      saveVideosToChannel(channelId, allVideos);
      toast.success(`Saved ${allVideos.length} videos to database!`);
    }
  }, [
    allVideos,
    hasNextPage,
    isFetchingNextPage,
    channelId,
    isFirebaseEmpty,
    isLoading,
    userId,
    shouldLoadAll,
  ]);

  const { mutate: refreshForNew, isPending: isRefreshing } = useMutation({
    mutationFn: async () => {
      const latestVideoDate =
        allVideos.length > 0 ? allVideos[0].snippet.publishedAt : undefined;
      const response = await fetchChannelVideos(
        channelId,
        undefined,
        latestVideoDate,
      );
      return response.videos;
    },
    onSuccess: (newVideos) => {
      if (newVideos.length === 0) {
        toast.info("No new videos found.");
        return;
      }

      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any, i: number) =>
            i === 0
              ? { ...page, videos: [...newVideos, ...page.videos] }
              : page,
          ),
        };
      });

      toast.success(`Added ${newVideos.length} new videos!`);
    },
  });

  const videosOnly = useMemo(
    () => allVideos.filter((v) => !v.details.isShorts),
    [allVideos],
  );

  const shortsOnly = useMemo(
    () => allVideos.filter((v) => v.details.isShorts),
    [allVideos],
  );

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <header className="mb-8 border-b pb-6 space-y-4">
          <div className="h-10 w-48 rounded bg-muted animate-pulse" />
          <div className="h-5 w-32 rounded bg-muted animate-pulse" />
        </header>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <VideoCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <header className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6 border-b pb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Channel Feed</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {allVideos.length} total items synced
              {isFetchingNextPage && " (syncing...)"}
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refreshForNew()}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Check for New
        </Button>
      </header>

      <Tabs defaultValue="videos" className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <TabsList className="grid w-full max-w-100 grid-cols-2">
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <PlayCircle className="h-4 w-4" />
              Videos
              <span className="ml-1 text-xs opacity-50">
                ({videosOnly.length})
              </span>
            </TabsTrigger>
            <TabsTrigger value="shorts" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Shorts
              <span className="ml-1 text-xs opacity-50">
                ({shortsOnly.length})
              </span>
            </TabsTrigger>
          </TabsList>

          <div className="flex justify-between w-full items-center gap-2 sm:w-auto">
            <SortAsc className="h-4 w-4 text-muted-foreground" /> SortBy
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as SortOption)}
            >
              <SelectTrigger className="w-45">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="time">Most Recent</SelectItem>
                <SelectItem value="views">Most Views</SelectItem>
                <SelectItem value="duration">Longest Duration</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="videos" className="border-none p-0 outline-none">
          {videosOnly.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {videosOnly.map((video) => (
                <VideoCard
                  video={video}
                  key={video.snippet.resourceId.videoId}
                />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-muted-foreground">
              No long-form videos found.
            </div>
          )}
        </TabsContent>

        <TabsContent value="shorts" className="border-none p-0 outline-none">
          {shortsOnly.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {shortsOnly.map((video) => (
                <VideoCard
                  video={video}
                  key={video.snippet.resourceId.videoId}
                />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-muted-foreground">
              No Shorts found.
            </div>
          )}
        </TabsContent>
      </Tabs>

      <footer className="flex flex-col items-center mt-12">
        {hasNextPage && (
          <div className="w-full max-w-md">
            {shouldLoadAll ? (
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground italic">
                  Downloading full channel history...
                </p>
              </div>
            ) : (
              <div className="w-full flex justify-center">
                <Button onClick={() => setShouldLoadAll(true)} className="px-8">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync All Videos
                </Button>
              </div>
            )}
          </div>
        )}
      </footer>
    </div>
  );
}
