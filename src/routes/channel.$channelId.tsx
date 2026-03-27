import { createFileRoute } from "@tanstack/react-router";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { fetchChannelVideos } from "../services/youtube";
import { Loader2, PlayCircle, SortAsc, LucideEye, Search } from "lucide-react";
import React, { useMemo, useEffect, useState, useDeferredValue } from "react";
import { useInView } from "react-intersection-observer";
import { toast } from "sonner";
import VideoCard from "#/components/VideoCard";
import {
  getSavedVideosForChannel,
  getUserId,
  saveVideosToChannel,
} from "#/services/firebase";
import { VideoCardSkeleton } from "#/components/ui/skeletons.tsx/dd";
import { Tabs, TabsList, TabsTrigger } from "#/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseISO8601ToSeconds } from "#/utils/base";
import { Input } from "#/components/ui/input";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import type { YTVideo } from "#/types/yt";
import PageFooter from "#/components/PageFooter";
import { fbQueries } from "#/services/query-factory";

const MemoizedVideoCard = React.memo(VideoCard);

export const Route = createFileRoute("/channel/$channelId")({
  validateSearch: (search) => search,
  component: ChannelVideosPage,
});

type SortOption = "time" | "views" | "duration";

function ChannelVideosPage() {
  const { channelId } = Route.useParams();
  const [userId, setUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("videos");
  const [isTabEmptyOrSmall, setIsTabEmptyOrSmall] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("time");
  const [shouldLoadAll, setShouldLoadAll] = useState(false);
  const [shouldLoadAllSaved, setShouldLoadAllSaved] = useState(false);
  const [query, setQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const debouncedQuery = useDebounce(query, 300);
  const deferredQuery = useDeferredValue(debouncedQuery);

  function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
      const handler = setTimeout(() => setDebouncedValue(value), delay);
      return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
  }

  useEffect(() => {
    const handleUserId = async () => {
      const id = await getUserId();
      setUserId(id);
    };
    handleUserId();
  }, []);

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    rootMargin: "600px",
  });

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

  useEffect(() => {
    if (hasNextYtPage && !isFetchingYtNext && shouldLoadAll) {
      fetchNextYtPage();
    }
  }, [hasNextYtPage, isFetchingYtNext, fetchNextYtPage, shouldLoadAll]);

  useEffect(() => {
    if (inView || shouldLoadAllSaved) {
      if (isFirebaseEmpty && hasNextYtPage && !isFetchingYtNext) {
        fetchNextYtPage();
      } else if (
        !isTabEmptyOrSmall &&
        !isFirebaseEmpty &&
        hasNextSavedPage &&
        !isFetchingSavedNext
      ) {
        fetchNextSavedPage();
      }
    }
  }, [
    inView,
    isFirebaseEmpty,
    hasNextYtPage,
    isFetchingYtNext,
    shouldLoadAllSaved,
    hasNextSavedPage,
    isFetchingSavedNext,
    fetchNextYtPage,
    fetchNextSavedPage,
  ]);

  const allVideos = useMemo(() => {
    const baseVideos = isFirebaseEmpty
      ? ytData?.pages.flatMap((p) => p.videos) || []
      : savedVideos;

    let items = [...baseVideos];

    if (deferredQuery.trim()) {
      const lowercaseQuery = deferredQuery.toLowerCase();
      items = items.filter((video) => {
        const title = video.snippet.title.toLowerCase();
        const channelTitle = video.snippet.channelTitle?.toLowerCase() || "";
        return (
          title.includes(lowercaseQuery) ||
          channelTitle.includes(lowercaseQuery)
        );
      });
    }

    const sortFns = {
      views: (a: YTVideo, b: YTVideo) =>
        Number(b.details?.viewCount || 0) - Number(a.details?.viewCount || 0),
      duration: (a: YTVideo, b: YTVideo) =>
        (parseISO8601ToSeconds(b.details?.duration) || 0) -
        (parseISO8601ToSeconds(a.details?.duration) || 0),
      time: (a: YTVideo, b: YTVideo) =>
        new Date(b.snippet.publishedAt).getTime() -
        new Date(a.snippet.publishedAt).getTime(),
    };

    return items.sort(sortFns[sortBy] || sortFns.time);
  }, [ytData, savedVideos, sortBy, isFirebaseEmpty, deferredQuery]);

  const existingIds = useMemo(
    () => new Set(savedVideos.map((v) => v.snippet.resourceId.videoId)),
    [savedVideos],
  );

  const videosOnly = useMemo(
    () =>
      allVideos.filter(
        (v) => !v.details.isShorts && v.details.status === "queued",
      ),
    [allVideos],
  );

  const watchedOnly = useMemo(
    () =>
      allVideos.filter(
        (v) => !v.details.isShorts && v.details.status === "finished",
      ),
    [allVideos],
  );

  const currentList = activeTab === "videos" ? videosOnly : watchedOnly;

  const columnCount = useMemo(() => {
    if (typeof window === "undefined") return 4;
    if (window.innerWidth >= 1280) return 4;
    if (window.innerWidth >= 1024) return 3;
    if (window.innerWidth >= 640) return 2;
    return 1;
  }, []);

  const rowCount = Math.ceil(currentList.length / columnCount);

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => 400,
    overscan: 3,
  });

  useEffect(() => {
    setIsTabEmptyOrSmall(currentList.length < 6);
  }, [currentList]);

  const { data: isSaved } = useQuery(
    fbQueries.isChannelExist(channelId, userId),
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
        allVideos.length > 0
          ? new Date(allVideos[0].snippet.publishedAt)
          : undefined;
      const response = await fetchChannelVideos(
        channelId,
        undefined,
        latestVideoDate,
      );
      if (response.videos.length > 0 && userId) {
        await saveVideosToChannel(channelId, response.videos, existingIds);
      }
      return response.videos;
    },
    onSuccess: (newVideos) => {
      if (newVideos.length === 0) return toast.info("No new videos found.");
      queryClient.invalidateQueries({
        queryKey: ["saved-videos-infinite", channelId],
      });
      toast.success(`Added ${newVideos.length} new videos!`);
    },
  });

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
      <Tabs
        defaultValue="videos"
        className="w-full"
        onValueChange={setActiveTab}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <TabsList className="grid w-full max-w-100 grid-cols-2">
            <TabsTrigger
              value="videos"
              className="flex items-center gap-2 text-xs"
            >
              <PlayCircle className="h-4 w-4" /> Queue ({videosOnly.length})
            </TabsTrigger>
            <TabsTrigger
              value="watched"
              className="flex items-center gap-2 text-xs"
            >
              <LucideEye className="h-4 w-4" /> Watched ({watchedOnly.length})
            </TabsTrigger>
          </TabsList>

          <form
            onSubmit={(e) => e.preventDefault()}
            className="relative group w-full"
          >
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-red-600 transition-colors" />
            <Input
              type="search"
              placeholder="Search Videos..."
              className="w-full pl-9 bg-muted/50 rounded-full focus-visible:ring-red-600"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>

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

        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => (
            <div
              key={virtualRow.key}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {currentList
                .slice(
                  virtualRow.index * columnCount,
                  (virtualRow.index + 1) * columnCount,
                )
                .map((v) => (
                  <MemoizedVideoCard
                    video={v}
                    key={v.snippet.resourceId.videoId}
                  />
                ))}
            </div>
          ))}
        </div>

        <div
          ref={loadMoreRef}
          className="h-20 flex items-center justify-center mt-8"
        >
          {(hasNextSavedPage || (isFirebaseEmpty && hasNextYtPage)) &&
            !isTabEmptyOrSmall && (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            )}
        </div>
      </Tabs>

      <PageFooter
        isFirebaseEmpty={isFirebaseEmpty}
        hasNextSavedPage={hasNextSavedPage}
        isLoadingSaved={isLoadingSaved}
        isFetchingSavedNext={isFetchingSavedNext}
        shouldLoadAllSaved={shouldLoadAllSaved}
        isRefreshing={isRefreshing}
        shouldLoadAll={shouldLoadAll}
        refreshForNew={refreshForNew}
        setShouldLoadAllSaved={setShouldLoadAllSaved}
        setShouldLoadAll={setShouldLoadAll}
      />
    </div>
  );
}
