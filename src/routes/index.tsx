import { createFileRoute } from "@tanstack/react-router";
import { getGreeting } from "../server/greeting";

export const Route = createFileRoute("/")({
  loader: () => getGreeting(),
  component: Home,
});

function Home() {
  const greeting = Route.useLoaderData();
  return <h1>{greeting}</h1>;
}
