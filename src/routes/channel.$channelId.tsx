import { createFileRoute } from '@tanstack/react-router'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchChannelVideos } from '../services/youtube'
import { auth, getSavedVideosForChannel, saveVideosToChannel } from '../services/firebase'
import { Button } from '@/components/ui/button'
import { 
  CloudUpload, Loader2, Database, Youtube, 
  RefreshCw, CheckCircle2 
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from "sonner"
import { onAuthStateChanged } from 'firebase/auth'
import VideoCard from '#/components/VideoCard'

export const Route = createFileRoute('/channel/$channelId')({
  component: ChannelVideosPage,
})

function ChannelVideosPage() {
  const { channelId } = Route.useParams()
  const queryClient = useQueryClient()
  
  // 1. Track Auth State
  const [userId, setUserId] = useState<string | null>(auth.currentUser?.uid || null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null)
    })
    return () => unsubscribe()
  }, [])

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    // 2. Add userId to the queryKey so it refetches when login completes
    queryKey: ['channel-videos', channelId, userId], 
    queryFn: async ({ pageParam }) => {
      // 3. Strict Check: If no userId, we can't check Firebase
      if (!userId) throw new Error("Not authenticated")

      if (pageParam === undefined) {
        console.log("Checking Firestore for channel:", channelId)
        const savedVideos = await getSavedVideosForChannel(channelId)
        
        if (savedVideos.length > 0) {
          console.log("Found videos in Firestore")
          return { 
            videos: savedVideos, 
            nextPageToken: undefined, 
            source: 'firebase' as const 
          }
        }
      }

      console.log("Firestore empty or loading more, fetching from YouTube...")
      const youtubeData = await fetchChannelVideos(channelId, pageParam)
      return { ...youtubeData, source: 'youtube' as const }
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextPageToken,
    // 4. Crucial: Don't run the query until we have a userId
    enabled: !!userId, 
  })

  const allVideos = useMemo(() => data?.pages.flatMap((page) => page.videos) || [], [data])
  const isFromFirebase = data?.pages[0]?.source === 'firebase'

  // 2. Identify the latest video date for incremental refresh
  const latestVideoDate = useMemo(() => {
    if (!allVideos.length) return null;
    const timestamps = allVideos.map(v => new Date(v.snippet.publishedAt).getTime());
    return new Date(Math.max(...timestamps)).toISOString();
  }, [allVideos]);

  // 3. Mutation: Refresh logic (Fetch only NEW videos)
  const { mutate: refreshForNew, isPending: isRefreshing } = useMutation({
    mutationFn: () => fetchChannelVideos(channelId, undefined, latestVideoDate || undefined),
    onSuccess: (response) => {
      if (response.videos.length === 0) {
        toast.info("No new videos found.");
        return;
      }

      // Prepend new videos to the TanStack Query Cache
      queryClient.setQueryData(['channel-videos', channelId], (old: any) => ({
        ...old,
        pages: old.pages.map((page: any, i: number) => 
          i === 0 ? { ...page, videos: [...response.videos, ...page.videos], source: 'youtube' } : page
        )
      }));
      toast.success(`Fetched ${response.videos.length} new videos!`);
    }
  })

  // 4. Mutation: Save current list to Firestore
  const { mutate: handleSaveAll, isPending: isSaving } = useMutation({
    mutationFn: () => saveVideosToChannel(channelId, allVideos),
    onSuccess: () => {
      toast.success("Library updated successfully!");
      queryClient.invalidateQueries({ queryKey: ['channel-videos', channelId] });
    }
  })

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-100 space-y-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-muted-foreground">Syncing channel data...</p>
    </div>
  )

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <header className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6 border-b pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Channel Archive</h1>
          <div className="flex items-center gap-3">
            {isFromFirebase ? (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                <Database className="h-3 w-3" /> Firestore Library
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                <Youtube className="h-3 w-3" /> YouTube Live
              </span>
            )}
            <span className="text-sm text-muted-foreground">{allVideos.length} videos available</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refreshForNew()} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Check for New
          </Button>
          {!isFromFirebase && (
            <Button size="sm" onClick={() => handleSaveAll()} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          )}
        </div>
      </header>

      {/* Grid Display */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {allVideos.sort((a,b)=> parseInt(b.snippet.publishedAt) - parseInt(a.snippet.publishedAt)).map((video) => (
        <VideoCard video={video}  key={video.id.videoId}/>
        ))}
      </div>

      {/* Pagination / Status Footer */}
      <footer className="mt-16 flex flex-col items-center py-10 border-t">
        {hasNextPage ? (
          <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} variant="secondary" className="w-full max-w-xs">
            {isFetchingNextPage ? <Loader2 className="animate-spin" /> : 'Load Older Videos'}
          </Button>
        ) : (
          <div className="flex flex-col items-center text-center space-y-2">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <p className="font-medium">All videos loaded</p>
            <p className="text-sm text-muted-foreground">Showing the complete available history for this channel.</p>
          </div>
        )}
      </footer>
    </div>
  )
}