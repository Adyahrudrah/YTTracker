import type {
  VideoResponse,
  YTChannel,
  YTChannelIdsResponse,
  YTVideo,
  YTVideoContentResponse,
} from "#/types/yt";
import { parseISO8601ToSeconds } from "#/utils/base";

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const BASE_URL = "https://www.googleapis.com/youtube/v3";

const yt_api = async (
  path: string,
  params: Record<string, string | undefined> = {},
) => {
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.append(key, value);
  });
  url.searchParams.append("key", YOUTUBE_API_KEY);

  const res = await fetch(url.href);
  return res.json();
};

export const yt = {
  getChannelIds: (q: string): Promise<YTChannelIdsResponse> =>
    yt_api("/search", {
      part: "snippet",
      type: "channel",
      maxResults: "30",
      q,
    }),

  getChannelStats: (channelIds: string): Promise<{ items: YTChannel[] }> =>
    yt_api("/channels", { part: "snippet,statistics", id: channelIds }),

  getPlaylistItems: (playlistId: string, pageToken?: string) =>
    yt_api("/playlistItems", {
      playlistId,
      part: "snippet,contentDetails",
      maxResults: "50",
      pageToken,
    }),

  getVideoDetails: (videoIds: string): Promise<YTVideoContentResponse> =>
    yt_api("/videos", { part: "contentDetails,statistics", id: videoIds }),
};

export const fetchChannels = async (query: string): Promise<YTChannel[]> => {
  if (!query) return [];

  const searchData = await yt.getChannelIds(query);
  const channelIds = searchData.items
    ?.map((i) => i.id.channelId)
    .filter(Boolean)
    .join(",");

  if (!channelIds) return [];

  const statsData = await yt.getChannelStats(channelIds);
  const channels = statsData.items || [];

  return channels.sort(
    (a, b) =>
      (parseInt(b.statistics.subscriberCount) || 0) -
      (parseInt(a.statistics.subscriberCount) || 0),
  );
};

export const fetchChannelVideos = async (
  channelId: string,
  pageToken?: string,
  sinceDate?: Date,
): Promise<VideoResponse> => {
  const uploadsId = channelId.replace(/^UC/, "UU");
  const data = await yt.getPlaylistItems(uploadsId, pageToken);

  const videoIds = data.items
    .map((v: YTVideo) => v.snippet.resourceId.videoId)
    .join(",");
  const contentDetails: YTVideoContentResponse =
    await yt.getVideoDetails(videoIds);

  const detailsMap = new Map(
    contentDetails.items.map((item) => {
      const seconds = parseISO8601ToSeconds(item.contentDetails.duration);
      return [
        item.id,
        {
          isShorts: seconds > 0 && seconds <= 60,
          duration: item.contentDetails.duration,
          viewCount: item.statistics.viewCount,
        },
      ];
    }),
  );

  let videos: YTVideo[] = (data.items || []).map((item: YTVideo) => ({
    id: { videoId: item.snippet.resourceId.videoId },
    snippet: item.snippet,
    details: detailsMap.get(item.snippet.resourceId.videoId),
  }));

  let reachedKnownVideo = false;

  if (sinceDate) {
    const sinceTime = sinceDate.getTime();
    const cutoffIndex = videos.findIndex(
      (v) => new Date(v.snippet.publishedAt).getTime() <= sinceTime,
    );

    if (cutoffIndex !== -1) {
      videos = videos.slice(0, cutoffIndex);
      reachedKnownVideo = true;
    }
  }

  return {
    videos,
    nextPageToken: data.nextPageToken,
    prevPageToken: data.prevPageToken,
    reachedKnownVideo,
  };
};
