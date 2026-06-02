import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy/alias path — there is no standalone /login page. Redirect to the
// canonical, branded /auth screen so the route never 404s and Google never
// indexes an orphaned login wall.
export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  beforeLoad: () => {
    throw redirect({ to: "/auth" });
  },
  component: () => null,
});
