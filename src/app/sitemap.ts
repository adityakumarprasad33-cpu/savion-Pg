import { MetadataRoute } from "next";

const BASE_URL = "https://savion.netlify.app";

const CITIES = [
  "bangalore", "mumbai", "delhi", "pune", "hyderabad",
  "chennai", "kolkata", "jaipur", "noida", "gurgaon",
  "ahmedabad", "chandigarh", "phagwara", "ludhiana", "amritsar",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.95,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/signup`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/community`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.8,
    },
  ];

  // City-specific pages — highest SEO value
  const cityPages: MetadataRoute.Sitemap = CITIES.map((city) => ({
    url: `${BASE_URL}/pgs-in-${city}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  // Footer / info pages
  const infoSlugs = ["about", "careers", "press", "help-center", "safety", "cancellation-options", "terms-of-service", "privacy-policy", "cookie-policy"];
  const infoPages: MetadataRoute.Sitemap = infoSlugs.map((slug) => ({
    url: `${BASE_URL}/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...staticPages, ...cityPages, ...infoPages];
}
