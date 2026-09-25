import { createFileRoute } from "@tanstack/react-router";
import { handleHelgaAuthorize } from "@/lib/helga-authorize.server";

function methodNotAllowed(): Response {
  return new Response(null, {
    status: 405,
    headers: { allow: "POST", "cache-control": "no-store" },
  });
}

export const Route = createFileRoute("/api/helga/authorize")({
  server: {
    handlers: {
      POST: ({ request }) => handleHelgaAuthorize(request),
      GET: () => methodNotAllowed(),
      OPTIONS: () => methodNotAllowed(),
      PUT: () => methodNotAllowed(),
      PATCH: () => methodNotAllowed(),
      DELETE: () => methodNotAllowed(),
      HEAD: () => methodNotAllowed(),
    },
  },
});
