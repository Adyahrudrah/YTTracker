export interface YTPlayListResponse {
  kind: string;
  etag: string;
  prevPageToken?: string;
  nextPageToken?: string;
  items: YTVideo[];
  pageInfo: PageInfo;
}

export type ytVideoStatus =
  | "queued"
  | "watching"
  | "next"
  | "finished"
  | "watch";

export interface YTVideo {
  kind: string;
  id: string;
  snippet: YTVideoSnippet;
  details: {
    isShorts: boolean;
    duration: string;
    viewCount: string;
    status: ytVideoStatus;
    lastPlayed?: number;
    progressPercent?: number;
    nextId: string | null;
    prevId: string | null;
  };
}

export interface YTVideoSnippet {
  publishedAt: Date;
  channelId: string;
  title: string;
  description: string;
  thumbnails: YTVideoThumbnails;
  channelTitle: string;
  playlistId: string;
  position: number;
  resourceId: ResourceID;
  videoOwnerChannelTitle: string;
  videoOwnerChannelId: string;
}

export interface ResourceID {
  kind: string;
  videoId: string;
}

export interface YTVideoThumbnails {
  default: YTVideoDefault;
  medium: YTVideoDefault;
  high: YTVideoDefault;
  standard: YTVideoDefault;
  maxres: YTVideoDefault;
}

export interface YTVideoDefault {
  url: string;
  width: number;
  height: number;
}

export interface PageInfo {
  totalResults: number;
  resultsPerPage: number;
}

export interface YTChannelIdsResponse {
  kind: string;
  etag: string;
  regionCode: string;
  pageInfo: PageInfo;
  items: YTChannelId[];
}

export interface YTChannelId {
  kind: string;
  etag: string;
  id: ID;
  snippet: YTChannelIdSnippet;
}

export interface ID {
  kind: string;
  channelId: string;
}

export interface YTChannelIdSnippet {
  publishedAt: Date;
  channelId: string;
  title: string;
  description: string;
  thumbnails: YTChannelIdThumbnails;
  channelTitle: string;
  liveBroadcastContent: string;
  publishTime: Date;
}

export interface YTChannelIdThumbnails {
  default: YTChannelIdDefault;
  medium: YTChannelIdDefault;
  high: YTChannelIdDefault;
}

export interface YTChannelIdDefault {
  url: string;
}

export interface YTChannelResponse {
  kind: string;
  etag: string;
  pageInfo: PageInfo;
  items: YTChannel[];
}

export interface YTChannel {
  kind: Kind;
  etag: string;
  id: string;
  snippet: YTChannelSnippet;
  statistics: YTChannelStatistics;
}

export enum Kind {
  YoutubeChannel = "youtube#channel",
}

export interface YTChannelSnippet {
  title: string;
  description: string;
  customUrl: string;
  publishedAt: Date;
  thumbnails: YTChannelThumbnails;
  localized: Localized;
  country?: string;
  defaultLanguage?: string;
}

export interface Localized {
  title: string;
  description: string;
}

export interface YTChannelThumbnails {
  default: YTChannelDefault;
  medium: YTChannelDefault;
  high: YTChannelDefault;
}

export interface YTChannelDefault {
  url: string;
  width: number;
  height: number;
}

export interface YTChannelStatistics {
  viewCount: string;
  subscriberCount: string;
  hiddenSubscriberCount: boolean;
  videoCount: string;
}

export interface VideoResponse {
  videos: YTVideo[];
  nextPageToken?: string;
  prevPageToken?: string;
  reachedKnownVideo?: boolean;
}

export interface YTVideoContentResponse {
  kind: string;
  etag: string;
  items: YTVideoContent[];
  pageInfo: PageInfo;
}

export interface YTVideoContent {
  kind: Kind;
  etag: string;
  id: string;
  contentDetails: ContentDetails;
  statistics: YTVideoContentStatistics;
}

export interface ContentDetails {
  duration: string;
  dimension: Dimension;
  definition: Definition;
  caption: string;
  licensedContent: boolean;
  contentRating: ContentRating;
  projection: Projection;
}

export interface ContentRating {}

export enum Definition {
  HD = "hd",
  SD = "sd",
}

export enum Dimension {
  The2D = "2d",
}

export enum Projection {
  Rectangular = "rectangular",
}

export enum Kind {
  YoutubeVideo = "youtube#video",
}

export interface YTVideoContentStatistics {
  viewCount: string;
  likeCount: string;
  favoriteCount: string;
  commentCount: string;
}
