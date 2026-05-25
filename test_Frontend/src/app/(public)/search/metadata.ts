import type { Metadata } from "next";

const BASE_URL = "https://savion.netlify.app";

export const metadata: Metadata = {
  title: "Search PG Rooms — Find Verified Paying Guest Accommodations",
  description:
    "Browse hundreds of verified PG accommodations, boys PG, girls PG, and co-living spaces. Filter by price, amenities, WiFi, AC, food, and more. Book instantly online.",
  keywords: [
    "search PG rooms",
    "find PG accommodation",
    "boys PG near me",
    "girls PG near me",
    "PG with food included",
    "AC PG rooms",
    "affordable PG rooms",
    "PG under 10000",
    "co-living spaces",
    "furnished PG rooms",
  ],
  openGraph: {
    title: "Search Verified PG Rooms | Savion",
    description:
      "Find your perfect paying guest accommodation. Hundreds of verified PG rooms with real photos, prices, and instant booking.",
    url: `${BASE_URL}/search`,
    images: [{ url: `${BASE_URL}/og-image.jpg`, width: 1200, height: 630 }],
  },
  alternates: {
    canonical: `${BASE_URL}/search`,
  },
};
