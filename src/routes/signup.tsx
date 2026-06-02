import { createFileRoute, redirect } from "@tanstack/react-router";

// Alias path — redirect to the canonical, branded /auth screen.
export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  beforeLoad: () => {
    throw redirect({ to: "/auth" });
  },
  component: () => null,
});
