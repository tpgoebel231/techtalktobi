import snapshot from "./youtube-latest.json";

export type FeedVideo = {
  id: string;
  title: string;
  published: string;
};

export type YoutubeLatest = {
  fetchedAt: string;
  source: string;
  channels: {
    teslatobi: FeedVideo[];
    techtalktobi: FeedVideo[];
  };
};

export const youtubeLatest = snapshot as YoutubeLatest;

export function latestChannelVideos(
  channel: keyof YoutubeLatest["channels"],
  limit = 9,
): FeedVideo[] {
  return youtubeLatest.channels[channel].slice(0, limit);
}
