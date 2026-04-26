import { Gauge } from "lucide-react";
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
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playerRef = useRef<any>(null);

  const [showControls, setShowControls] = useState(true);
  const [currentSpeed, setCurrentSpeed] = useState(() => {
    const saved = localStorage.getItem("yt-player-speed");
    return saved ? parseFloat(saved) : 1;
  });

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
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
    resetHideTimer();
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
    if (event.data === 1) {
      startTracking(player);
      resetHideTimer();
    } else {
      clearTimer();
      setShowControls(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    }
    if (event.data === 0) toast.success("Video finished!");
  };

  const updateSpeed = (speed: number) => {
    if (playerRef.current) {
      playerRef.current.setPlaybackRate(speed);
      setCurrentSpeed(speed);
      localStorage.setItem("yt-player-speed", speed.toString());
      resetHideTimer();
    }
  };

  useEffect(() => {
    resetHideTimer();
    return () => {
      clearTimer();
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [clearTimer, resetHideTimer]);

  const opts: YouTubeProps["opts"] = {
    height: "100%",
    width: "100%",
    playerVars: {
      autoplay: 1,
      start: Math.floor(startTime),
      rel: 0,
      controls: 1,
      cc_load_policy: 0,
    },
  };

  const onPlaybackQualityChange: YouTubeProps["onPlaybackQualityChange"] = (
    event,
  ) => {
    const newQuality = event.data;
    console.log("Quality changed to:", newQuality);
  };

  return (
    <button
      type="button"
      className="flex flex-col gap-4 w-full transition-opacity duration-300"
      onTouchStart={resetHideTimer}
      onMouseMove={resetHideTimer}
    >
      <div className="md:aspect-video portrait:h-dvw w-full overflow-hidden rounded-xl bg-black shadow-2xl">
        <YouTube
          videoId={videoId}
          opts={opts}
          onReady={onPlayerReady}
          onStateChange={onPlayerStateChange}
          onPlaybackQualityChange={onPlaybackQualityChange}
          className="h-full w-full"
        />
      </div>

      <div
        className={`absolute top-2 left-1/2 -translate-x-1/2 flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-background border border-border transition-all duration-500 ${
          showControls
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
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
      </div>
    </button>
  );
}
