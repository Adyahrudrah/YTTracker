import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Play, Eye, Calendar, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog";
import { VideoPlayer } from "./VideoPlayer";
import type { YTVideo } from "#/types/yt";
import {
  formatNumToShort,
  formatYouTubeDuration,
  openYtExt,
} from "#/utils/base";
import { formatDistanceToNow } from "date-fns"; // Standard for modern apps
import { toast } from "sonner";
import { updateVideoProgress } from "#/services/firebase";
import { useQueryClient } from "@tanstack/react-query";

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

  const handleDialogChange = (open: boolean) => {
    setIsOpen(open);

    if (!open && currentProgress.currentTime > 0) {
      updateVideoProgress(
        snippet.channelId,
        video.snippet.resourceId.videoId,
        currentProgress,
      );

      toast.info(`Saved progress: ${currentProgress.percent}%`);
      queryClient.invalidateQueries({ queryKey: ["saved-videos"] });
      queryClient.invalidateQueries({ queryKey: ["root-latest-videos"] });
    }
  };

  const handleProgress = (progress: {
    currentTime: number;
    percent: number;
  }) => {
    setCurrentProgress(progress);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Card className="group cursor-pointer overflow-hidden border-none bg-transparent hover:bg-accent/10 transition-colors duration-300">
          {/* Thumbnail Container */}
          <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent opening the Dialog
                openYtExt(
                  video.snippet.resourceId.videoId,
                  video.details?.lastPlayed,
                );
              }}
              className="z-1 absolute top-2 right-2 p-2 bg-black/60 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary"
              title="Open in YouTube"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
            <img
              src={
                snippet.thumbnails.maxres?.url || snippet.thumbnails.medium.url
              }
              alt={snippet.title}
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
            />

            {details?.progressPercent && details?.progressPercent > 0 && (
              <div className="absolute bottom-0 left-0 w-full h-1.5 bg-black/40">
                <div
                  className="h-full bg-red-600 transition-all duration-500"
                  style={{ width: `${video.details.progressPercent}%` }}
                />
              </div>
            )}

            {/* Play Overlay */}
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-primary/90 p-3 rounded-full shadow-xl">
                <Play className="text-primary-foreground h-6 w-6 fill-current" />
              </div>
            </div>

            {/* Duration Badge */}
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 backdrop-blur-sm text-white text-[11px] font-medium rounded-md">
              {formatYouTubeDuration(details.duration)}
            </div>
          </div>

          {/* Metadata */}
          <CardContent className="px-1 py-3">
            <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {snippet.title}
            </h3>

            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {formatNumToShort(details.viewCount)} views
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

      <DialogContent
        className="p-0 bg-black md:min-w-4xl  border-none overflow-hidden sm:rounded-2xl"
        aria-description={snippet.title}
      >
        <DialogTitle>
          <p className="text-transparent">{snippet.title}</p>
        </DialogTitle>
        {isOpen && (
          <div className="aspect-video w-full h-full">
            <VideoPlayer
              videoId={snippet.resourceId.videoId}
              onProgress={handleProgress}
              startTime={details.lastPlayed}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default VideoCard;
