import { describe, expect, it } from "vitest";
import { schemas } from "../src/validation.js";
import { youtubeEmbedUrl, youtubeVideoId } from "../../shared/youtube.js";

describe("annual report YouTube setting", () => {
  it("accepts common HTTPS YouTube links and builds a safe autoplay embed", () => {
    for (const value of [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://youtu.be/dQw4w9WgXcQ",
      "https://www.youtube.com/shorts/dQw4w9WgXcQ",
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    ]) {
      expect(youtubeVideoId(value)).toBe("dQw4w9WgXcQ");
      expect(
        schemas.settings.safeParse({
          key: "annualReportYoutubeUrl",
          value,
          public: true,
        }).success,
      ).toBe(true);
    }
    expect(youtubeEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toContain(
      "autoplay=1&mute=1",
    );
  });

  it("rejects non-YouTube, insecure, and malformed video URLs", () => {
    for (const value of [
      "http://youtube.com/watch?v=dQw4w9WgXcQ",
      "https://example.com/watch?v=dQw4w9WgXcQ",
      "https://youtube.com/watch?v=invalid",
    ]) {
      expect(
        schemas.settings.safeParse({
          key: "annualReportYoutubeUrl",
          value,
          public: true,
        }).success,
      ).toBe(false);
    }
  });
});
