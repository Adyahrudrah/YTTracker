import {
  PlaySquare,
  Users,
  Bookmark,
  BookmarkCheck,
  Loader2,
} from "lucide-react";
import {
  saveChannel,
  removeChannel,
  isChannelExist,
} from "../services/firebase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { useNavigate } from "@tanstack/react-router";
import type { YTChannel } from "#/types/yt";
import { formatNumToShort } from "#/utils/base";
import { toast } from "sonner";

interface ChannelCardProps {
  channel: YTChannel;
  isSaved?: boolean;
}

export function ChannelCard({ channel }: ChannelCardProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: isSaved } = useQuery({
    queryKey: ["channel", channel],
    queryFn: () => isChannelExist(channel.id),
  });

  const { mutate: toggleSave, isPending } = useMutation({
    mutationFn: () =>
      isSaved ? removeChannel(channel.id) : saveChannel(channel),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-channels"] });

      toast.success(
        channel.snippet.title + `${isSaved ? " Removed" : " Saved"}`,
      );
    },
  });

  const handleCardClick = () => {
    navigate({
      to: "/channel/$channelId",
      params: { channelId: channel.id },
    });
  };

  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSave();
  };

  return (
    <Card
      className="relative overflow-hidden transition-all hover:shadow-md cursor-pointer group"
      onClick={handleCardClick}
    >
      {/* Save Button */}
      <div className="absolute right-2 top-2 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleSave}
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
          <AvatarImage
            src={channel.snippet.thumbnails.medium.url}
            alt={channel.snippet.title}
          />
          <AvatarFallback>{channel.snippet.title[0]}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col pr-8">
          <CardTitle className="text-lg line-clamp-1 group-hover:text-blue-600 transition-colors">
            {channel.snippet.title}
          </CardTitle>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1 font-medium text-blue-600">
              <Users className="h-3.5 w-3.5" />
              {formatNumToShort(channel.statistics.subscriberCount)}
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
