const DEFAULT_GREETING = "Hello";

export function resolveGreeting(value: string | undefined): string {
  return value?.trim() ? value : DEFAULT_GREETING;
}
