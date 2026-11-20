#!/usr/bin/env node
/**
 * Fetch the public YouTube Atom feeds at build time and write
 * src/data/youtube-latest.json. If a fetch fails, keep the committed snapshot.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const CHANNELS = {
  teslatobi: "UCdLf42OiodkKn7bXl0fUr2g",
  techtalktobi: "UCunvRGFhuYpFygjMnHJPcDA",
};

export const FEED_URL = (channelId) =>
  `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

const SNAPSHOT = fileURLToPath(new URL("../src/data/youtube-latest.json", import.meta.url));

export function decodeXmlEntities(text) {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function parseYouTubeFeed(xml) {
  const entries = [];
  for (const chunk of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const body = chunk[1];
    const id = body.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1]?.trim();
    const titleRaw = body.match(/<title>([\s\S]*?)<\/title>/)?.[1];
    const published = body.match(/<published>([^<]+)<\/published>/)?.[1]?.trim();
    if (!id || titleRaw == null || !published) continue;
    entries.push({
      id,
      title: decodeXmlEntities(titleRaw.trim()),
      published,
    });
  }
  return entries;
}

export function readSnapshot(path = SNAPSHOT) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export async function fetchChannelFeed(channelId, fetcher = fetch) {
  const res = await fetcher(FEED_URL(channelId), {
    headers: { "user-agent": "techtalktobi-build/1.0" },
  });
  if (!res.ok) throw new Error(`YouTube RSS ${channelId} HTTP ${res.status}`);
  return parseYouTubeFeed(await res.text());
}

export async function loadLatestVideos({ fetcher = fetch, snapshotPath = SNAPSHOT } = {}) {
  const snapshot = readSnapshot(snapshotPath);
  const channels = { ...snapshot.channels };
  const errors = [];
  let live = 0;
  for (const [key, channelId] of Object.entries(CHANNELS)) {
    try {
      const items = await fetchChannelFeed(channelId, fetcher);
      if (!items.length) throw new Error("empty feed");
      channels[key] = items;
      live += 1;
    } catch (err) {
      errors.push(`${key}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return {
    fetchedAt: live > 0 ? new Date().toISOString() : snapshot.fetchedAt,
    source: live === Object.keys(CHANNELS).length ? "live" : live > 0 ? "mixed" : "snapshot",
    channels,
    errors,
  };
}

export function writeSnapshot(data, path = SNAPSHOT) {
  const out = {
    fetchedAt: data.fetchedAt,
    source: data.source,
    channels: data.channels,
  };
  writeFileSync(path, `${JSON.stringify(out, null, 2)}\n`);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const data = await loadLatestVideos();
  if (data.source !== "snapshot") writeSnapshot(data);
  if (data.errors.length) {
    console.warn(`fetch-youtube-rss: using fallback for ${data.errors.join("; ")}`);
  } else {
    console.log(
      `fetch-youtube-rss: wrote ${Object.values(data.channels).reduce((n, a) => n + a.length, 0)} videos (${data.source})`,
    );
  }
}
