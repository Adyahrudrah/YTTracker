import { queryOptions } from "@tanstack/react-query";
import { fetchChannels, yt } from "./youtube";
import {
  getSavedChannelIds,
  getSavedChannels,
  isChannelExist,
} from "./firebase";

export const ytQueries = {
  video_details: (videoIds: string) =>
    queryOptions({
      queryKey: ["video-details", videoIds],
      queryFn: () => yt.getVideoDetails(videoIds),
    }),
  searchYtChannels: (q: string | undefined) =>
    queryOptions({
      queryKey: ["search-yt-channels", q],
      queryFn: () => fetchChannels(q || ""),
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 60 * 5,
    }),
};

export const fbQueries = {
  savedYTChannelIds: (channelIds: string[]) =>
    queryOptions({
      queryKey: ["saved-channel-ids", channelIds],
      queryFn: () => getSavedChannelIds(),
      refetchOnWindowFocus: false,
      staleTime: Infinity,
    }),

  savedYTChannels: (userId: string | undefined) =>
    queryOptions({
      queryKey: ["saved-channels", userId],
      queryFn: getSavedChannels,
      enabled: !!userId,
    }),

  isChannelExist: (channelId: string, userId: string | null | undefined) =>
    queryOptions({
      queryKey: ["is-channel-exist", channelId, userId],
      queryFn: () => isChannelExist(channelId),
      enabled: !!userId,
    }),
};
