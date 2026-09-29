import { createFileRoute } from "@tanstack/react-router";
import { handleHelgaWebhook } from "@/lib/helga-recording.server";

function methodNotAllowed(): Response {
  return new Response(null, {
    status: 405,
    headers: { allow: "POST", "cache-control": "no-store" },
  });
}

export const Route = createFileRoute("/api/helga/webhook")({
  server: {
    handlers: {
      POST: ({ request }) => handleHelgaWebhook(request),
      GET: () => methodNotAllowed(),
      OPTIONS: () => methodNotAllowed(),
      PUT: () => methodNotAllowed(),
      PATCH: () => methodNotAllowed(),
      DELETE: () => methodNotAllowed(),
      HEAD: () => methodNotAllowed(),
    },
  },
});
