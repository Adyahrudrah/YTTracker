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
import { useInView } from "react-intersection-observer";
import { toast } from "sonner";
import VideoCard from "#/components/VideoCard";
import {
  auth,
  getSavedVideosForChannel,
  saveVideosToChannel,
} from "#/services/firebase";
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
import { fbQueries } from "#/services/query-factory";

export const Route = createFileRoute("/channel/$channelId")({
  validateSearch: (search) => search,
  component: ChannelVideosPage,
});

type SortOption = "time" | "views" | "duration";

function ChannelVideosPage() {
  const { channelId } = Route.useParams();
  const userId = auth.currentUser?.uid;
  const queryClient = useQueryClient();

  const [sortBy, setSortBy] = useState<SortOption>("time");
  const [shouldLoadAll, setShouldLoadAll] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: "400px",
  });

  // 1. Check if channel is saved in DB
  const { data: isSaved } = useQuery(
    fbQueries.isChannelExist(channelId, userId),
  );

  // 2. Fetch saved videos using Infinite Scroll (Cursor Pagination)
  const {
    data: savedData,
    fetchNextPage: fetchNextSavedPage,
    hasNextPage: hasNextSavedPage,
    isLoading: isLoadingSaved,
    isFetchingNextPage: isFetchingSavedNext,
  } = useInfiniteQuery({
    queryKey: ["saved-videos-infinite", channelId],
    queryFn: ({ pageParam }) =>
      getSavedVideosForChannel(channelId, 24, pageParam),
    initialPageParam: undefined as any,
    getNextPageParam: (lastPage) => lastPage.lastDoc,
    enabled: !!userId,
  });

  const savedVideos = useMemo(
    () => savedData?.pages.flatMap((page) => page.videos) || [],
    [savedData],
  );

  const isFirebaseEmpty = !isLoadingSaved && savedVideos.length === 0;

  // 3. YouTube API Query (Only if Firebase is empty)
  const {
    data: ytData,
    fetchNextPage: fetchNextYtPage,
    hasNextPage: hasNextYtPage,
    isFetchingNextPage: isFetchingYtNext,
    isLoading: isLoadingYt,
  } = useInfiniteQuery({
    queryKey: ["channel-videos-yt", channelId],
    queryFn: ({ pageParam }) => fetchChannelVideos(channelId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextPageToken,
    enabled: !!userId && isFirebaseEmpty,
    refetchOnWindowFocus: false,
  });

  // Sync Logic for "Sync All" button
  useEffect(() => {
    if (hasNextYtPage && !isFetchingYtNext && shouldLoadAll) {
      fetchNextYtPage();
    }
  }, [hasNextYtPage, isFetchingYtNext, fetchNextYtPage, shouldLoadAll]);

  // Observer Logic: Trigger next page (Saved or YT)
  useEffect(() => {
    if (inView) {
      if (isFirebaseEmpty && hasNextYtPage && !isFetchingYtNext) {
        fetchNextYtPage();
      } else if (!isFirebaseEmpty && hasNextSavedPage && !isFetchingSavedNext) {
        fetchNextSavedPage();
      }
    }
  }, [
    inView,
    isFirebaseEmpty,
    hasNextYtPage,
    isFetchingYtNext,
    hasNextSavedPage,
    isFetchingSavedNext,
    fetchNextYtPage,
    fetchNextSavedPage,
  ]);

  const allVideos = useMemo(() => {
    const baseVideos = isFirebaseEmpty
      ? ytData?.pages.flatMap((p) => p.videos) || []
      : savedVideos;

    const items = [...baseVideos];
    switch (sortBy) {
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
  }, [ytData, savedVideos, sortBy, isFirebaseEmpty]);

  // Write Logic (Saving new videos to Firebase)
  const existingIds = useMemo(
    () => new Set(savedVideos.map((v) => v.snippet.resourceId.videoId)),
    [savedVideos],
  );

  useEffect(() => {
    const syncToFirebase = async () => {
      if (
        allVideos.length > 0 &&
        !hasNextYtPage &&
        !isFetchingYtNext &&
        isFirebaseEmpty &&
        !isLoadingYt &&
        userId &&
        isSaved &&
        !isSaving
      ) {
        setIsSaving(true);
        const loadingToast = toast.loading("Saving to database...");
        try {
          allVideos[0].details.status = "next";
          const savedCount = await saveVideosToChannel(
            channelId,
            allVideos,
            existingIds,
          );
          toast.success(`Saved ${savedCount} new videos!`, {
            id: loadingToast,
          });
          queryClient.invalidateQueries({
            queryKey: ["saved-videos-infinite", channelId],
          });

          queryClient.invalidateQueries({
            queryKey: ["feed-videos", channelId],
          });
          setShouldLoadAll(false);
        } catch (error) {
          toast.error("Failed to save.", { id: loadingToast });
        } finally {
          setIsSaving(false);
        }
      }
    };
    syncToFirebase();
  }, [
    allVideos,
    hasNextYtPage,
    isFetchingYtNext,
    isFirebaseEmpty,
    isLoadingYt,
    userId,
    shouldLoadAll,
    isSaved,
    isSaving,
    queryClient,
    existingIds,
    channelId,
  ]);

  const { mutate: refreshForNew, isPending: isRefreshing } = useMutation({
    mutationFn: async () => {
      const latestVideoDate =
        allVideos.length > 0 ? allVideos[0].snippet.publishedAt : undefined;
      return (await fetchChannelVideos(channelId, undefined, latestVideoDate))
        .videos;
    },
    onSuccess: (newVideos) => {
      if (newVideos.length === 0) return toast.info("No new videos found.");
      queryClient.invalidateQueries({
        queryKey: ["saved-videos-infinite", channelId],
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

  if (isLoadingYt || isLoadingSaved) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
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
          <p className="text-sm text-muted-foreground">
            {allVideos.length} items loaded
          </p>
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <TabsList className="grid w-full max-w-100 grid-cols-2">
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <PlayCircle className="h-4 w-4" /> Videos ({videosOnly.length})
            </TabsTrigger>
            <TabsTrigger value="shorts" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" /> Shorts ({shortsOnly.length})
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <SortAsc className="h-4 w-4 text-muted-foreground" />
            <Select
              value={sortBy}
              onValueChange={(v) => setSortBy(v as SortOption)}
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

        {isFirebaseEmpty && hasNextYtPage && (
          <div className="flex flex-col items-center py-10 bg-muted/30 rounded-lg mb-8 border-2 border-dashed">
            {shouldLoadAll ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium">Syncing items...</p>
              </div>
            ) : (
              <Button onClick={() => setShouldLoadAll(true)} size="lg">
                <RefreshCw className="mr-2 h-4 w-4" /> Sync Full Channel
              </Button>
            )}
          </div>
        )}

        <TabsContent
          value="videos"
          className="m-0 p-0 border-none outline-none"
        >
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {videosOnly.map((v) => (
              <VideoCard video={v} key={v.snippet.resourceId.videoId} />
            ))}
          </div>
        </TabsContent>

        <TabsContent
          value="shorts"
          className="m-0 p-0 border-none outline-none"
        >
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shortsOnly.map((v) => (
              <VideoCard video={v} key={v.snippet.resourceId.videoId} />
            ))}
          </div>
        </TabsContent>

        <div ref={ref} className="h-20 flex items-center justify-center mt-8">
          {(hasNextSavedPage || (isFirebaseEmpty && hasNextYtPage)) && (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          )}
        </div>
      </Tabs>
    </div>
  );
}
