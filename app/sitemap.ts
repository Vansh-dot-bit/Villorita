import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://villorita.in",
      lastModified: new Date(),
    },
    {
      url: "https://villorita.in/cakes",
      lastModified: new Date(),
    },
    {
      url: "https://villorita.in/delivery",
      lastModified: new Date(),
    }
  ];
}
