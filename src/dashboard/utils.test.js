import { describe, expect, it } from "vitest";
import {
  clamp01,
  formatDateKey,
  normalizeAction,
  normalizeSentiment,
  parseArray,
  parseDateValue,
  parseObject,
  toBool,
  toNumber,
} from "./utils";

describe("dashboard utils", () => {
  it("normalizes supported sentiment and action values", () => {
    expect(normalizeSentiment("POSITIVE")).toBe("positive");
    expect(normalizeSentiment("weird")).toBe("unknown");

    expect(normalizeAction("FOLLOW_UP")).toBe("follow_up");
    expect(normalizeAction("something-else")).toBe("unknown");
  });

  it("parses array/object json safely", () => {
    expect(parseArray("[\"a\",\"b\"]")).toEqual(["a", "b"]);
    expect(parseArray("bad-json")).toEqual([]);

    expect(parseObject("{\"k\":1}")).toEqual({ k: 1 });
    expect(parseObject("[]")).toEqual({});
  });

  it("parses numeric and boolean values predictably", () => {
    expect(toNumber("1.5")).toBe(1.5);
    expect(toNumber("x", 7)).toBe(7);

    expect(toBool("t")).toBe(true);
    expect(toBool("false")).toBe(false);
  });

  it("parses date and key format", () => {
    const date = parseDateValue("2026-01-17 10:39:03.848789+00");
    expect(date).not.toBeNull();
    expect(formatDateKey(date)).toBe("2026-01-17");
  });

  it("clamps values into [0, 1]", () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(2)).toBe(1);
    expect(clamp01(0.42)).toBe(0.42);
  });
});
