import { Gauge, Settings } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
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

  const [currentSpeed, setCurrentSpeed] = useState(() => {
    const saved = localStorage.getItem("yt-player-speed");
    return saved ? parseFloat(saved) : 1;
  });

  const [currentQuality, setCurrentQuality] = useState(() => {
    return localStorage.getItem("yt-player-quality") || "default";
  });

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

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

  const onPlayerReady: YouTubeProps["onReady"] = (event) => {
    const player = event.target;
    playerRef.current = player;
    player.setPlaybackRate(currentSpeed);
    player.setPlaybackQuality(currentQuality);
  };

  const onPlayerStateChange: YouTubeProps["onStateChange"] = (event) => {
    const player = event.target;
    const states: Record<number, string> = {
      1: "PLAYING",
      2: "PAUSED",
      0: "ENDED",
    };
    const currentState = states[event.data];

    if (currentState) onStateChange?.(currentState);
    if (event.data === 1) startTracking(player);
    else clearTimer();
    if (event.data === 0) toast.success("Video finished!");
  };

  const updateSpeed = (speed: number) => {
    if (playerRef.current) {
      playerRef.current.setPlaybackRate(speed);
      setCurrentSpeed(speed);
      localStorage.setItem("yt-player-speed", speed.toString());
    }
  };

  const updateQuality = (quality: string) => {
    if (playerRef.current) {
      playerRef.current.setPlaybackQuality(quality);
      setCurrentQuality(quality);
      localStorage.setItem("yt-player-quality", quality);
    }
  };

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const opts: YouTubeProps["opts"] = {
    height: "100%",
    width: "100%",
    playerVars: {
      autoplay: 1,
      start: Math.floor(startTime),
      rel: 0,
      controls: 1, // Restoring native controls for the player layout
    },
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Video Container - Layout remains unchanged */}
      <div className="md:aspect-video portrait:h-[80dvw] w-full overflow-hidden rounded-xl bg-black shadow-2xl">
        <YouTube
          videoId={videoId}
          opts={opts}
          onReady={onPlayerReady}
          onStateChange={onPlayerStateChange}
          className="h-full w-full"
        />
      </div>

      {/* External Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-secondary/50 border border-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2 py-1 bg-background rounded-lg border border-border">
            <Gauge className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-tight">
              Speed
            </span>
          </div>
          <div className="flex gap-1">
            {[1, 1.25, 1.5, 2].map((speed) => (
              <button
                type="button"
                key={speed}
                onTouchStart={() => updateSpeed(speed)}
                onClick={() => updateSpeed(speed)}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                  currentSpeed === speed
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-background hover:bg-accent text-foreground"
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2 py-1 bg-background rounded-lg border border-border">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-tight">
              Quality
            </span>
          </div>
          <div className="flex gap-1">
            {["hd1080", "hd720", "medium", "small"].map((quality) => (
              <button
                type="button"
                key={quality}
                onTouchStart={() => updateQuality(quality)}
                onClick={() => updateQuality(quality)}
                className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase transition-all active:scale-95 ${
                  currentQuality === quality
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-background hover:bg-accent text-foreground"
                }`}
              >
                {quality.replace("hd", "")}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
