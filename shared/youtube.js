const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

export function youtubeVideoId(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new globalThis.URL(value.trim());
    if (url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    let candidate = null;
    if (host === "youtu.be") {
      candidate = url.pathname.split("/").filter(Boolean)[0];
    } else if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      if (url.pathname === "/watch") candidate = url.searchParams.get("v");
      else if (/^\/(?:embed|shorts|live)\//.test(url.pathname))
        candidate = url.pathname.split("/").filter(Boolean)[1];
    }
    return VIDEO_ID.test(candidate || "") ? candidate : null;
  } catch {
    return null;
  }
}

export function youtubeEmbedUrl(value) {
  const id = youtubeVideoId(value);
  return id
    ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&controls=1&playsinline=1&rel=0`
    : null;
}
