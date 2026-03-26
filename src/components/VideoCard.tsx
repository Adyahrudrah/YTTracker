import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import {
  Play,
  Eye,
  Calendar,
  ExternalLink,
  CheckCircle,
  RotateCcw,
  X,
  ListPlus,
  ListMinus,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog";
import { VideoPlayer } from "./VideoPlayer";
import type { YTVideo, ytVideoStatus } from "#/types/yt";
import {
  formatNumToShort,
  formatYouTubeDuration,
  openYtExt,
} from "#/utils/base";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { updateVideoProgress } from "#/services/firebase";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "#/lib/utils";
import { Link } from "@tanstack/react-router"; // Added for navigation

interface VideoCardProps {
  video: YTVideo;
}

function VideoCard({ video }: VideoCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const [currentProgress, setCurrentProgress] = useState({
    currentTime: 0,
    percent: 0,
  });

  const { snippet, details } = video;
  const isFullyWatched = details?.progressPercent === 100;
  const hasProgress =
    details?.progressPercent !== undefined && details.progressPercent > 0;
  const isInList = video.details.status === "watch";

  const handleUpdateProgress = async (
    percent: number,
    message: string,
    status: ytVideoStatus,
  ) => {
    try {
      await updateVideoProgress(
        snippet.channelId,
        video.snippet.resourceId.videoId,
        { currentTime: 0, percent },
        status,
      );

      queryClient.invalidateQueries({ queryKey: ["feed-videos"] });
      queryClient.invalidateQueries({
        queryKey: ["saved-videos-infinite", snippet.channelId],
      });

      toast.success(message);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleToggleWatched = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newPercent = isFullyWatched ? 0 : 100;

    await handleUpdateProgress(
      newPercent,
      newPercent === 100 ? "Marked as watched" : "Progress cleared",
      newPercent === 100 ? "finished" : "queued",
    );
  };

  const handleToggleWatchList = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await handleUpdateProgress(
      0,
      isInList ? "Removed from WatchList" : "Added to WatchList",
      isInList ? "queued" : "watch",
    );
  };

  const handleDismissProgress = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleUpdateProgress(0, "Removed from continue watching", "queued");
  };

  const handleDialogChange = async (open: boolean) => {
    setIsOpen(open);

    // Only sync to DB when closing the player
    if (!open && currentProgress.currentTime > 0) {
      const isFinished = currentProgress.percent >= 98;
      const videoId = video.snippet.resourceId.videoId;

      try {
        await updateVideoProgress(
          snippet.channelId,
          videoId,
          currentProgress,
          isFinished ? "finished" : "watching",
        );

        queryClient.invalidateQueries({ queryKey: ["feed-videos"] });
        queryClient.invalidateQueries({
          queryKey: ["saved-videos-infinite", snippet.channelId],
        });
      } catch (error) {
        console.error("Failed to sync closing progress", error);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Card className="group cursor-pointer overflow-hidden border-none bg-transparent hover:bg-accent/10 transition-colors duration-300">
          <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
            {/* Action Buttons Row */}
            <div className="z-10 absolute top-2 right-2 flex gap-1.5">
              {/* Dismiss/Reset Button (The 'X') */}
              {hasProgress && (
                <button
                  onClick={handleDismissProgress}
                  className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white shadow-lg opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all hover:bg-destructive"
                  title="Clear progress"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              <button
                onClick={handleToggleWatchList}
                className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white shadow-lg opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all hover:bg-foreground hover:text-accent"
                title={!isInList ? "Add to WatchList" : "Remove from WatchList"}
              >
                {!isInList ? (
                  <ListPlus className="h-4 w-4" />
                ) : (
                  <ListMinus className="h-4 w-4" />
                )}
              </button>

              {/* External Link Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openYtExt(
                    video.snippet.resourceId.videoId,
                    details?.lastPlayed,
                  );
                }}
                className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white shadow-lg opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity hover:bg-primary"
                title="Open in YouTube"
              >
                <ExternalLink className="h-4 w-4" />
              </button>

              {/* Toggle Watched Button */}
              <button
                onClick={handleToggleWatched}
                className={cn(
                  "p-2 backdrop-blur-md rounded-full text-white transition-all shadow-lg active:scale-90",
                  "opacity-100 lg:opacity-0 lg:group-hover:opacity-100",
                  isFullyWatched
                    ? "bg-green-600 lg:opacity-100"
                    : "bg-black/60 hover:bg-green-600",
                )}
                title={isFullyWatched ? "Mark as unwatched" : "Mark as watched"}
              >
                {isFullyWatched ? (
                  <RotateCcw className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
              </button>
            </div>

            <img
              src={
                snippet.thumbnails.maxres?.url || snippet.thumbnails.medium.url
              }
              alt={snippet.title}
              className={cn(
                "object-cover w-full h-full transition-all duration-500 lg:group-hover:scale-105",
                isFullyWatched && "opacity-50 grayscale-[0.5]",
              )}
            />

            {hasProgress && (
              <div className="absolute bottom-0 left-0 w-full h-1.5 bg-black/40 z-10">
                <div
                  className={cn(
                    "h-full transition-all duration-500",
                    isFullyWatched ? "bg-green-500" : "bg-red-600",
                  )}
                  style={{ width: `${details.progressPercent}%` }}
                />
              </div>
            )}

            <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-primary/90 p-3 rounded-full shadow-xl">
                <Play className="text-primary-foreground h-6 w-6 fill-current" />
              </div>
            </div>

            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 backdrop-blur-sm text-white text-[11px] font-medium rounded-md z-10">
              {formatYouTubeDuration(details.duration)}
            </div>
          </div>

          <CardContent className="px-1 py-3">
            <h3
              className={cn(
                "font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors",
                isFullyWatched && "text-muted-foreground font-normal",
              )}
            >
              {snippet.title}
            </h3>

            {/* CHANNEL NAME LINK */}
            <Link
              to="/channel/$channelId"
              params={{ channelId: snippet.channelId }}
              className="mt-1 block font-bold text-muted-foreground hover:text-primary transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {snippet.channelTitle}
            </Link>

            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {formatNumToShort(details.viewCount)}
              </span>
              <span className="text-muted-foreground/40">•</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDistanceToNow(new Date(snippet.publishedAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="p-0 bg-black md:min-w-4xl border-none overflow-hidden sm:rounded-2xl portrait:rotate-90 portrait:min-w-dvh portrait:max-h-dvw [&>button]:left-5 [&>button]:w-max">
        <DialogTitle className="sr-only">{snippet.title}</DialogTitle>
        {isOpen && (
          <div className="w-full h-full ">
            <VideoPlayer
              videoId={snippet.resourceId.videoId}
              onProgress={(p) => setCurrentProgress(p)}
              startTime={details.lastPlayed}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default VideoCard;
