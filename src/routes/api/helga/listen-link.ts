import { createFileRoute } from "@tanstack/react-router";
import { handleHelgaListenLink } from "@/lib/helga-recording.server";

function methodNotAllowed(): Response {
  return new Response(null, {
    status: 405,
    headers: { allow: "POST", "cache-control": "no-store" },
  });
}

export const Route = createFileRoute("/api/helga/listen-link")({
  server: {
    handlers: {
      POST: ({ request }) => handleHelgaListenLink(request),
      GET: () => methodNotAllowed(),
      OPTIONS: () => methodNotAllowed(),
      PUT: () => methodNotAllowed(),
      PATCH: () => methodNotAllowed(),
      DELETE: () => methodNotAllowed(),
      HEAD: () => methodNotAllowed(),
    },
  },
});
