import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  decodeXmlEntities,
  loadLatestVideos,
  parseYouTubeFeed,
} from "./fetch-youtube-rss.mjs";

const source = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const fixture = readFileSync(new URL("./fixtures/youtube-feed.xml", import.meta.url), "utf8");
const snapshot = JSON.parse(source("src/data/youtube-latest.json"));

test("YouTube RSS parser reads ids, dates and decoded titles", () => {
  assert.equal(decodeXmlEntities("KI &amp; Roboter: &quot;ChatGPT moment&quot;"), 'KI & Roboter: "ChatGPT moment"');
  const items = parseYouTubeFeed(fixture);
  assert.equal(items.length, 2);
  assert.deepEqual(items[0], {
    id: "abc123XYZ-_",
    title: 'KI & Roboter: "ChatGPT moment"',
    published: "2026-11-19T12:00:00+00:00",
  });
  assert.equal(items[1].id, "secondId000");
});

test("a failed fetch keeps the committed snapshot", async () => {
  const dir = mkdtempSync(join(tmpdir(), "yt-rss-"));
  const path = join(dir, "youtube-latest.json");
  writeFileSync(path, JSON.stringify(snapshot));
  const data = await loadLatestVideos({
    fetcher: async () => new Response("nope", { status: 500 }),
    snapshotPath: path,
  });
  assert.equal(data.source, "snapshot");
  assert.equal(data.channels.teslatobi[0].id, snapshot.channels.teslatobi[0].id);
  assert.equal(data.errors.length, 2);
  assert.deepEqual(JSON.parse(readFileSync(path, "utf8")), snapshot);
});

test("a successful fetch returns live items", async () => {
  const dir = mkdtempSync(join(tmpdir(), "yt-rss-"));
  const path = join(dir, "youtube-latest.json");
  writeFileSync(path, JSON.stringify(snapshot));
  const data = await loadLatestVideos({
    fetcher: async () => new Response(fixture, { status: 200 }),
    snapshotPath: path,
  });
  assert.equal(data.source, "live");
  assert.equal(data.channels.teslatobi[0].id, "abc123XYZ-_");
  assert.equal(data.channels.techtalktobi[1].title, "Plain title");
});

test("snapshot includes the research companion videos and current uploads", () => {
  const teslaIds = snapshot.channels.teslatobi.map((v) => v.id);
  for (const id of ["1gjQ84Uj8N4", "dpFS0SMJIC8", "fC7smnPZzmQ"]) {
    assert.ok(teslaIds.includes(id), id);
  }
  assert.ok(snapshot.channels.teslatobi.length >= 9);
  assert.ok(snapshot.channels.techtalktobi.length >= 9);
});

test("research pieces link the companion videos", () => {
  const research = source("src/data/research.ts");
  assert.match(research, /slug: "tuev-adac-ev-tests",\s*videoId: "1gjQ84Uj8N4"/);
  assert.match(research, /slug: "mercedes-mb-drive-assist-pro",\s*videoId: "dpFS0SMJIC8"/);
  assert.match(research, /slug: "tesla-gruenheide",\s*videoId: "fC7smnPZzmQ"/);
  const detail = source("src/pages/research-detail.tsx");
  assert.match(detail, /copy\.research\.watchVideo/);
  assert.match(detail, /piece\.videoId/);
  const copy = source("src/data/copy.ts");
  assert.match(copy, /watchVideo: "Watch the video"/);
  assert.match(copy, /watchVideo: "Zum Video"/);
});

test("media page shows latest RSS videos per channel", () => {
  const media = source("src/pages/media.tsx");
  assert.match(media, /latestChannelVideos\("teslatobi", 9\)/);
  assert.match(media, /latestChannelVideos\("techtalktobi", 9\)/);
  assert.match(media, /copy\.media\.latest/);
});

test("media kit headshot and stats use only the recorded figures", () => {
  const statsSrc = source("src/data/channel-stats.ts");
  assert.match(statsSrc, /subscribers: 10_600/);
  assert.match(statsSrc, /totalViews: 3_952_927/);
  assert.match(statsSrc, /dachShare90d: 0\.926/);
  assert.match(statsSrc, /views90d: 25_346/);
  assert.match(statsSrc, /watchHours90d: 418\.5/);
  const kit = source("src/pages/media-kit.tsx");
  const grid = source("src/components/channel-stats-grid.tsx");
  const media = source("src/pages/media.tsx");
  assert.match(kit, /\/images\/tobias-goebel-headshot\.jpg/);
  assert.match(kit, /copy\.mediaKit\.headshot/);
  assert.match(kit, /ChannelStatsGrid/);
  assert.match(grid, /channelStats\.teslatobi/);
  assert.match(grid, /channelStats\.techtalktobi/);
  assert.match(grid, /views90d/);
  assert.match(grid, /watchHours90d/);
  assert.match(media, /ChannelStatsGrid/);
  assert.match(media, /links\.mediaKit/);
  assert.doesNotMatch(statsSrc, /\b424\b/);
  assert.doesNotMatch(statsSrc, /9\.7/);
  assert.match(source("package.json"), /fetch-youtube-rss\.mjs/);
});
