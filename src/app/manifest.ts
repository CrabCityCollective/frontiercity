import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Frontier City",
    short_name: "Frontier City",
    description: "De Eerste Vuren — Het Hertenpad-volk",
    start_url: "/",
    display: "standalone",
    background_color: "#3d2e26",
    theme_color: "#3d2e26",
    icons: [
      {
        src: "/icons/icon-192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
