import { createFileRoute } from "@tanstack/react-router";
import { handleHelgaPreflight } from "@/lib/helga-authorize.server";
import { HELGA_RECORDING_ALLOW_HEADERS, handleHelgaRecording } from "@/lib/helga-recording.server";

function methodNotAllowed(): Response {
  return new Response(null, {
    status: 405,
    headers: { allow: "POST", "cache-control": "no-store" },
  });
}

export const Route = createFileRoute("/api/helga/recording")({
  server: {
    handlers: {
      POST: ({ request }) => handleHelgaRecording(request),
      OPTIONS: ({ request }) =>
        handleHelgaPreflight(request, { allowHeaders: HELGA_RECORDING_ALLOW_HEADERS }),
      GET: () => methodNotAllowed(),
      PUT: () => methodNotAllowed(),
      PATCH: () => methodNotAllowed(),
      DELETE: () => methodNotAllowed(),
      HEAD: () => methodNotAllowed(),
    },
  },
});
