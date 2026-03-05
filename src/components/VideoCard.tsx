import type { YouTubeVideo } from '#/services/youtube'
import { useState } from 'react';
import { Card, CardContent } from './ui/card'
import { Play } from 'lucide-react'
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog"
import { VideoPlayer } from './VideoPlayer';

interface VideoCardProps {
    video: YouTubeVideo
}

function VideoCard({ video }: VideoCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleStatusUpdate = async (status: string) => {
    console.log(status)
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="group cursor-pointer overflow-hidden border-none shadow-sm hover:shadow-md transition-all">
          <div className="relative aspect-video overflow-hidden rounded-t-lg">
            <img src={video.snippet.thumbnails.medium.url} className="..." />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="text-white h-10 w-10 fill-white" />
            </div>
          </div>
          <CardContent className="p-4">
             <h3 className="font-semibold text-sm line-clamp-2">{video.snippet.title}</h3>
             {/* ... date ... */}
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-w-4xl p-0 bg-black border-none overflow-hidden">
        {isOpen && (
          <VideoPlayer 
            videoId={video.id.videoId} 
            onStateChange={handleStatusUpdate} 
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

export default VideoCard