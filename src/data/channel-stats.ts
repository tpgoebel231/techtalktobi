/**
 * Channel figures from Mr. Beast2, 20 November 2026.
 * TeslaTobi subscribers are the public rounded figure.
 * TechTalk-Tobi uses the 90-day window (20 Aug to 17 Nov 2026), not 28-day.
 * Do not invent additional numbers.
 */
export const CHANNEL_STATS_AS_OF = "2026-11" as const;

export const channelStats = {
  teslatobi: {
    subscribers: 10_600,
    totalViews: 3_952_927,
    dachShare90d: 0.926,
  },
  techtalktobi: {
    views90d: 25_346,
    watchHours90d: 418.5,
  },
} as const;
