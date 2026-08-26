import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/pages/home";

export const Route = createFileRoute("/$locale/")({
  component: HomePage,
});
