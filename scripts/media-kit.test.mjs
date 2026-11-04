import assert from "node:assert/strict";
import test from "node:test";
import { mergeKitRedirects } from "./media-kit.mjs";

test("mergeKitRedirects refreshes kit aliases and keeps bare page redirects", () => {
  const existing = [
    {
      source: "/media-kit.pdf",
      destination: "/TeslaTobi_MediaKit_July_2026.pdf",
      permanent: true,
    },
    {
      source: "/TeslaTobi_MediaKit_July_2026.pdf",
      destination: "/TeslaTobi_MediaKit_July_2026.pdf",
      permanent: true,
    },
    { source: "/about", destination: "/en/about", permanent: true },
    {
      source: "/ai-robotics/Humanoid_Robotics_Stack_May2026.pdf",
      destination: "/research/Humanoid_Robotics_Stack_May2026.pdf",
      permanent: true,
    },
  ];
  const cfg = {
    current: "TeslaTobi_MediaKit_Oct_2026.pdf",
    alias: "media-kit.pdf",
    old: ["TeslaTobi_MediaKit_July_2026.pdf", "TeslaTobi_MediaKit_Sep_2026.pdf"],
  };
  const out = mergeKitRedirects(existing, cfg);
  assert.deepEqual(
    out.filter((r) => r.source === "/about"),
    [{ source: "/about", destination: "/en/about", permanent: true }],
  );
  assert.deepEqual(
    out.filter((r) => r.source.startsWith("/ai-robotics")),
    [
      {
        source: "/ai-robotics/Humanoid_Robotics_Stack_May2026.pdf",
        destination: "/research/Humanoid_Robotics_Stack_May2026.pdf",
        permanent: true,
      },
    ],
  );
  assert.deepEqual(
    out.filter((r) => r.source === "/media-kit.pdf"),
    [
      {
        source: "/media-kit.pdf",
        destination: "/TeslaTobi_MediaKit_Oct_2026.pdf",
        permanent: true,
      },
    ],
  );
  assert.equal(
    out.filter((r) => r.source === "/TeslaTobi_MediaKit_July_2026.pdf")[0]
      .destination,
    "/TeslaTobi_MediaKit_Oct_2026.pdf",
  );
});
