// Chuyển mọi dạng link YouTube phổ biến (watch/youtu.be/shorts/live) về dạng
// embed phát được trong iframe. Link không nhận diện được giữ nguyên.
export function normalizeYouTubeEmbedUrl(url: string): string {
  const match = url.trim().match(
    /^https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?[^#]*?v=|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/,
  );
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
}
