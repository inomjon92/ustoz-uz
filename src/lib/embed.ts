/** YouTube havolasini iframe uchun embed manziliga aylantiradi */
export function toEmbedUrl(url: string | null | undefined) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : url;
}
