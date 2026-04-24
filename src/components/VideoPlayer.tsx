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

  // Initialize state from localStorage or defaults
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

    // Apply persisted settings on load
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
      toast.info(`Speed saved: ${speed}x`);
    }
  };

  const updateQuality = (quality: string) => {
    if (playerRef.current) {
      playerRef.current.setPlaybackQuality(quality);
      setCurrentQuality(quality);
      localStorage.setItem("yt-player-quality", quality);
      toast.info(`Quality saved: ${quality}`);
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
      controls: 0,
    },
  };

  return (
    <div className="group relative md:aspect-video portrait:h-dvw w-full overflow-hidden rounded-xl bg-black shadow-2xl">
      <YouTube
        videoId={videoId}
        opts={opts}
        onReady={onPlayerReady}
        onStateChange={onPlayerStateChange}
        className="h-full w-full"
      />

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 bg-linear-to-t from-black/90 via-black/40 to-transparent p-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-white/70" />
            {[1, 1.25, 1.5, 2].map((speed) => (
              <button
                type="button"
                key={speed}
                onClick={() => updateSpeed(speed)}
                className={`rounded px-3 py-1 text-xs font-medium transition-all ${
                  currentSpeed === speed
                    ? "bg-white text-black scale-105 shadow-lg"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-white/70" />
            {["hd1080", "hd720", "medium", "small"].map((quality) => (
              <button
                type="button"
                key={quality}
                onClick={() => updateQuality(quality)}
                className={`rounded px-3 py-1 text-xs font-medium uppercase transition-all ${
                  currentQuality === quality
                    ? "bg-white text-black scale-105 shadow-lg"
                    : "bg-white/10 text-white hover:bg-white/20"
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
