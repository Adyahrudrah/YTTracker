import { queryOptions } from "@tanstack/react-query";
import { yt } from "./youtube";

export const ytQueries = {
  video_details: (videoIds: string) =>
    queryOptions({
      queryKey: ["video-details", videoIds],
      queryFn: () => yt.getVideoDetails(videoIds),
    }),
};
