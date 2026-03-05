import { PlaySquare, Users, Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
import { type YouTubeChannel, formatSubscribers } from '../services/youtube';
import { saveChannel, removeChannel } from '../services/firebase';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { useNavigate } from '@tanstack/react-router';

export function ChannelCard({ channel, isSaved }: { channel: YouTubeChannel, isSaved?: boolean }) {
  const queryClient = useQueryClient();
const navigate = useNavigate()
  const { mutate: toggleSave, isPending } = useMutation({
    mutationFn: () => isSaved ? removeChannel(channel.id) : saveChannel(channel),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-channels'] });
    },
  });

  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-md"
    onClick={() => navigate({ to: '/channel/$channelId', params: { channelId: channel.id } })}>
      {/* Save Button - Positioned in the top right */}
      <div className="absolute right-2 top-2 z-10">
        <Button 
          variant="ghost" 
          size="icon" 
         onClick={(e) => {
            e.stopPropagation(); // Prevents navigation
            toggleSave();
          }}
          disabled={isPending}
          className="rounded-full hover:bg-muted"
        >
          {isPending ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : isSaved ? (
            <BookmarkCheck className="h-5 w-5 text-blue-600 fill-blue-600" />
          ) : (
            <Bookmark className="h-5 w-5 text-muted-foreground" />
          )}
        </Button>
      </div>

      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <Avatar className="h-14 w-14 border">
          <AvatarImage src={channel.snippet.thumbnails.medium.url} />
          <AvatarFallback>{channel.snippet.title[0]}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col pr-8"> {/* Added padding-right so text doesn't hit the button */}
          <CardTitle className="text-lg line-clamp-1">{channel.snippet.title}</CardTitle>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1 font-medium text-blue-600">
              <Users className="h-3.5 w-3.5" />
              {formatSubscribers(channel.statistics.subscriberCount)}
            </span>
            <span className="flex items-center gap-1">
              <PlaySquare className="h-3.5 w-3.5" />
              {channel.statistics.videoCount}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-xs text-muted-foreground line-clamp-2 italic">
          {channel.snippet.description || "No channel description provided."}
        </p>
      </CardContent>
    </Card>
  );
}