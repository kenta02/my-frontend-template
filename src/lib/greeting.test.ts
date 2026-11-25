import { describe, expect, it } from "vitest";
import { resolveGreeting } from "./greeting";

describe("resolveGreeting", () => {
  it("設定値をそのまま返す", () => {
    expect(resolveGreeting("こんにちは")).toBe("こんにちは");
  });

  it.each([undefined, "", "   "])("未設定や空 (%j) は既定の文言を返す", (value) => {
    expect(resolveGreeting(value)).toBe("Hello");
  });
});
