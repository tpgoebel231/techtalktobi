import { createFileRoute } from "@tanstack/react-router";
import { handleHelgaListen } from "@/lib/helga-recording.server";

function methodNotAllowed(): Response {
  return new Response(null, {
    status: 405,
    headers: { allow: "GET", "cache-control": "no-store" },
  });
}

export const Route = createFileRoute("/api/helga/listen")({
  server: {
    handlers: {
      GET: ({ request }) => handleHelgaListen(request),
      POST: () => methodNotAllowed(),
      OPTIONS: () => methodNotAllowed(),
      PUT: () => methodNotAllowed(),
      PATCH: () => methodNotAllowed(),
      DELETE: () => methodNotAllowed(),
      HEAD: () => methodNotAllowed(),
    },
  },
});
