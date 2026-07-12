import { describe, expect, it } from "vitest";
import { normalizeYouTubeEmbedUrl } from "@/lib/youtube";

const EMBED = "https://www.youtube.com/embed/dQw4w9WgXcQ";

describe("normalizeYouTubeEmbedUrl", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", EMBED],
    ["https://youtube.com/watch?v=dQw4w9WgXcQ&t=42s", EMBED],
    ["https://www.youtube.com/watch?list=PL123&v=dQw4w9WgXcQ", EMBED],
    ["https://youtu.be/dQw4w9WgXcQ?t=10", EMBED],
    ["https://m.youtube.com/watch?v=dQw4w9WgXcQ", EMBED],
    ["https://www.youtube.com/shorts/dQw4w9WgXcQ", EMBED],
    ["https://www.youtube.com/live/dQw4w9WgXcQ", EMBED],
    ["  https://www.youtube.com/watch?v=dQw4w9WgXcQ  ", EMBED],
  ])("chuyển %s về dạng embed", (input, expected) => {
    expect(normalizeYouTubeEmbedUrl(input)).toBe(expected);
  });

  it("giữ nguyên link embed sẵn có và link không phải YouTube", () => {
    expect(normalizeYouTubeEmbedUrl(EMBED)).toBe(EMBED);
    expect(normalizeYouTubeEmbedUrl("https://vimeo.com/123")).toBe("https://vimeo.com/123");
    expect(normalizeYouTubeEmbedUrl("đang gõ dở")).toBe("đang gõ dở");
  });
});
