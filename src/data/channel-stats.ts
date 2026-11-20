/**
 * Channel figures from Mr. Beast2 media kit, pulled 20 November 2026, 12:20 PM ET.
 * Data API plus YouTube Analytics; analytics windows end 17 November 2026
 * (90 days: 20 Aug to 17 Nov 2026). TeslaTobi subscribers are the public rounded figure.
 * TeslaTobi gender is the standalone report (95.7% male, 4.2% female, 0.1% user-specified),
 * not the older split obtained by summing age-by-gender cells.
 * TechTalk-Tobi uses the 90-day window, not 28-day. Do not invent additional numbers.
 */
export const CHANNEL_STATS_AS_OF = "2026-11" as const;
export const CHANNEL_STATS_ANALYTICS_END = "2026-11-17" as const;

export const channelStats = {
  teslatobi: {
    subscribers: 10_600,
    totalViews: 3_952_927,
    views90d: 1_098_391,
    watchHours90d: 55_045,
    medianViews: 9_965,
    meanViews: 12_729,
    dachShare90d: 0.926,
    countries90d: [
      { code: "DE", share: 0.772 },
      { code: "AT", share: 0.084 },
      { code: "CH", share: 0.07 },
    ],
    gender90d: { male: 0.957, female: 0.042, userSpecified: 0.001 },
    age90d: [
      { band: "13-17", share: 0.01 },
      { band: "18-24", share: 0.012 },
      { band: "25-34", share: 0.086 },
      { band: "35-44", share: 0.221 },
      { band: "45-54", share: 0.254 },
      { band: "55-64", share: 0.256 },
      { band: "65+", share: 0.161 },
    ],
  },
  techtalktobi: {
    subscribers: 271,
    totalViews: 32_234,
    views90d: 25_346,
    watchHours90d: 418.5,
    medianViews: 522,
    meanViews: 2_786,
    gender90d: { male: 0.982, female: 0.017, userSpecified: 0.001 },
    age90d: [
      { band: "18-24", share: 0.02 },
      { band: "25-34", share: 0.259 },
      { band: "35-44", share: 0.377 },
      { band: "45-54", share: 0.248 },
      { band: "55-64", share: 0.08 },
      { band: "65+", share: 0.017 },
    ],
  },
} as const;

export type ChannelGender = (typeof channelStats.teslatobi)["gender90d"];
export type ChannelAgeBand = (typeof channelStats.teslatobi)["age90d"][number];
