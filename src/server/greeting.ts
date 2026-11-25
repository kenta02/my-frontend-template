import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { resolveGreeting } from "../lib/greeting";

export const getGreeting = createServerFn({ method: "GET" }).handler(() =>
  resolveGreeting(env.GREETING),
);
