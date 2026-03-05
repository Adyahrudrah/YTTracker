// services/youtube.ts
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const BASE_URL = "https://www.googleapis.com/youtube/v3";

export interface YouTubeChannel {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: { medium: { url: string } };
  };
  statistics: {
    subscriberCount: string;
    videoCount: string;
  };
}

export const fetchChannels = async (query: string): Promise<YouTubeChannel[]> => {
  if (!query) return [];
  
  const searchRes = await fetch(
    `${BASE_URL}/search?part=snippet&type=channel&maxResults=50&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}`
  );
  const searchData = await searchRes.json();
  const channelIds = searchData.items?.map((item: any) => item.id.channelId).join(',');

  if (!channelIds) return [];

  const statsRes = await fetch(
    `${BASE_URL}/channels?part=snippet,statistics&id=${channelIds}&key=${YOUTUBE_API_KEY}`
  );
  const statsData = await statsRes.json();

  const channels: YouTubeChannel[] = statsData.items;

  // Sort channels by subscriberCount (highest to lowest)
  return channels.sort((a, b) => {
    const subsA = parseInt(a.statistics.subscriberCount) || 0;
    const subsB = parseInt(b.statistics.subscriberCount) || 0;
    return subsB - subsA;
  });
};

export const formatSubscribers = (count: string) => {
  const num = parseInt(count);
  if (isNaN(num)) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

export interface YouTubeVideo {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    thumbnails: { medium: { url: string } };
    publishedAt: string;
  };
}

export interface VideoResponse {
  videos: YouTubeVideo[];
  nextPageToken?: string;
}

export const fetchChannelVideos = async (
  channelId: string, 
  pageToken?: string,
  publishedAfter?: string // New parameter
): Promise<VideoResponse> => {
  const pageParam = pageToken ? `&pageToken=${pageToken}` : '';
  const dateParam = publishedAfter ? `&publishedAfter=${publishedAfter}` : '';
  
  const url = `${BASE_URL}/search?part=snippet&channelId=${channelId}&maxResults=50&order=date&type=video${pageParam}${dateParam}&key=${YOUTUBE_API_KEY}`;
  
  const res = await fetch(url);
  const data = await res.json();
  
  return {
    videos: data.items || [],
    nextPageToken: data.nextPageToken,
  };
};