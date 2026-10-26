import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ustoz.uz — ta'lim ekotizimi",
    short_name: "Ustoz.uz",
    description: "Repetitorlar, o'quv markazlari, kurslar, testlar va sertifikatlar",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#2453e0",
    lang: "uz",
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
