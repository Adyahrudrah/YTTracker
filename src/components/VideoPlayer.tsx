// components/VideoPlayer.tsx
import YouTube, { type YouTubeProps } from 'react-youtube';
import { toast } from 'sonner';

interface VideoPlayerProps {
  videoId: string;
  onStateChange?: (state: string) => void;
}

export function VideoPlayer({ videoId, onStateChange }: VideoPlayerProps) {
  const onPlayerStateChange: YouTubeProps['onStateChange'] = (event) => {
    // 1 = Playing, 2 = Paused, 0 = Ended
    const states: Record<number, string> = {
      1: 'PLAYING',
      2: 'PAUSED',
      0: 'ENDED',
    };
    
    const currentState = states[event.data];
    if (currentState) {
      console.log(`Video status: ${currentState}`);
      onStateChange?.(currentState);
    }

    if (event.data === 0) {
      toast.success("Video finished! Progress saved.");
    }
  };

  const opts: YouTubeProps['opts'] = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
    },
  };

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl bg-black shadow-2xl">
      <YouTube 
        videoId={videoId} 
        opts={opts} 
        onStateChange={onPlayerStateChange} 
        className="h-full w-full"
      />
    </div>
  );
}