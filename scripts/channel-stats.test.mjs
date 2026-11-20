import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

const statsSrc = source("src/data/channel-stats.ts");
const copy = source("src/data/copy.ts");
const grid = source("src/components/channel-stats-grid.tsx");
const media = source("src/pages/media.tsx");
const kit = source("src/pages/media-kit.tsx");
const mediaLinks = source("src/data/media.ts");

test("TeslaTobi gender is the standalone 95.7 / 4.2 / 0.1 report, not 97.1 / 2.9", () => {
  assert.match(statsSrc, /male: 0\.957/);
  assert.match(statsSrc, /female: 0\.042/);
  assert.match(statsSrc, /userSpecified: 0\.001/);
  assert.doesNotMatch(statsSrc, /0\.971|97\.1|0\.029|2\.9/);
  assert.doesNotMatch(grid, /97\.1|2\.9/);
  assert.doesNotMatch(kit, /97\.1|2\.9/);
  assert.doesNotMatch(media, /97\.1|2\.9/);
});

test("both channels keep current figures and add the kit sponsor numbers", () => {
  // TeslaTobi: existing + 90-day views/watch, median/mean, countries, gender, age
  assert.match(statsSrc, /subscribers: 10_600/);
  assert.match(statsSrc, /totalViews: 3_952_927/);
  assert.match(statsSrc, /views90d: 1_098_391/);
  assert.match(statsSrc, /watchHours90d: 55_045/);
  assert.match(statsSrc, /medianViews: 9_965/);
  assert.match(statsSrc, /meanViews: 12_729/);
  assert.match(statsSrc, /dachShare90d: 0\.926/);
  assert.match(statsSrc, /code: "DE", share: 0\.772/);
  assert.match(statsSrc, /code: "AT", share: 0\.084/);
  assert.match(statsSrc, /code: "CH", share: 0\.07/);
  assert.match(statsSrc, /band: "13-17", share: 0\.01/);
  assert.match(statsSrc, /band: "65\+", share: 0\.161/);
  // TechTalk-Tobi
  assert.match(statsSrc, /subscribers: 271/);
  assert.match(statsSrc, /totalViews: 32_234/);
  assert.match(statsSrc, /views90d: 25_346/);
  assert.match(statsSrc, /watchHours90d: 418\.5/);
  assert.match(statsSrc, /medianViews: 522/);
  assert.match(statsSrc, /meanViews: 2_786/);
  assert.match(statsSrc, /male: 0\.982/);
  assert.match(statsSrc, /female: 0\.017/);
  assert.match(statsSrc, /band: "35-44", share: 0\.377/);
  // 28-day TechTalk-Tobi figures stay off the site
  assert.doesNotMatch(statsSrc, /\b424\b/);
  assert.doesNotMatch(statsSrc, /9\.7/);
});

test("the stats grid and as-of line appear on the kit and media pages", () => {
  assert.match(grid, /copy\.statsAsOf/);
  assert.match(grid, /copy\.subscribers/);
  assert.match(grid, /copy\.totalViews/);
  assert.match(grid, /copy\.views90d/);
  assert.match(grid, /copy\.watch90d/);
  assert.match(grid, /copy\.medianViews/);
  assert.match(grid, /copy\.meanViews/);
  assert.match(grid, /copy\.dachShare/);
  assert.match(grid, /copy\.topCountries/);
  assert.match(grid, /copy\.gender/);
  assert.match(grid, /copy\.age/);
  assert.match(kit, /ChannelStatsGrid/);
  assert.match(media, /ChannelStatsGrid/);
  assert.match(
    copy,
    /statsAsOf: "As of November 2026 \(YouTube Analytics, 90 days to Nov 17, 2026\)"/,
  );
  assert.match(
    copy,
    /statsAsOf: "Stand: November 2026 \(YouTube Analytics, 90 Tage bis 17\. Nov\. 2026\)"/,
  );
});

test("the October 2026 Studio export PDF path is unchanged and relabeled", () => {
  assert.match(mediaLinks, /mediaKit: "\/TeslaTobi_MediaKit_Oct_2026\.pdf"/);
  assert.match(media, /href=\{links\.mediaKit\}/);
  assert.match(kit, /href=\{links\.mediaKit\}/);
  assert.match(copy, /mediaKitCta: "October 2026 YouTube Studio export \(PDF\)"/);
  assert.match(copy, /mediaKitCta: "YouTube-Studio-Export, Oktober 2026 \(PDF\)"/);
  assert.match(copy, /studioExport: "October 2026 YouTube Studio export \(PDF\)"/);
  assert.match(copy, /studioExport: "YouTube-Studio-Export, Oktober 2026 \(PDF\)"/);
  assert.doesNotMatch(copy, /Media Kit October 2026 \(PDF\)/);
  assert.doesNotMatch(copy, /Media Kit Oktober 2026 \(PDF\)/);
});

test("new copy has no em dashes", () => {
  assert.doesNotMatch(copy, /\u2014/);
});
