import { useEffect, useRef } from "react";
import YouTube, { type YouTubeProps } from "react-youtube";
import { toast } from "sonner";

interface VideoProgress {
  currentTime: number;
  duration: number;
  percent: number;
}

interface VideoPlayerProps {
  videoId: string;
  startTime?: number;
  onStateChange?: (state: string) => void;
  onProgress?: (progress: VideoProgress) => void;
}

export function VideoPlayer({
  videoId,
  startTime = 0,
  onStateChange,
  onProgress,
}: VideoPlayerProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playerRef = useRef<any>(null);

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startTracking = (player: any) => {
    clearTimer();
    intervalRef.current = setInterval(() => {
      const currentTime = player.getCurrentTime();
      const duration = player.getDuration();
      const percent = (currentTime / duration) * 100;

      onProgress?.({
        currentTime,
        duration,
        percent: Math.round(percent),
      });
    }, 1000);
  };

  const onPlayerStateChange: YouTubeProps["onStateChange"] = (event) => {
    const player = event.target;
    playerRef.current = player;

    const states: Record<number, string> = {
      1: "PLAYING",
      2: "PAUSED",
      0: "ENDED",
    };

    const currentState = states[event.data];
    if (currentState) {
      onStateChange?.(currentState);
    }

    if (event.data === 1) {
      // PLAYING
      startTracking(player);
    } else {
      clearTimer();
    }

    if (event.data === 0) {
      // ENDED
      toast.success("Video finished! Progress saved.");
    }
  };

  useEffect(() => {
    return () => clearTimer();
  }, []);

  const opts: YouTubeProps["opts"] = {
    height: "100%",
    width: "100%",
    playerVars: {
      autoplay: 1,
      start: Math.floor(startTime),
      rel: 0,
    },
  };

  return (
    <div className="md:aspect-video portrait:h-dvw w-full overflow-hidden rounded-xl bg-black shadow-2xl">
      <YouTube
        videoId={videoId}
        opts={opts}
        onStateChange={onPlayerStateChange}
        className="h-full w-full"
      />
    </div>
  );
}
