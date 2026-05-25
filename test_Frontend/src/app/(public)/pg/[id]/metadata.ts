import type { Metadata } from "next";
import { getPGById } from "@/lib/db/pgs";

const BASE_URL = "https://savion.netlify.app";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const pg = await getPGById(params.id).catch(() => null);

  if (!pg) {
    return {
      title: "PG Not Found",
      description: "This property may have been removed.",
    };
  }

  const title = `${pg.name} — ${pg.location} | Verified PG`;
  const description = pg.description
    ? pg.description.slice(0, 160)
    : `Book ${pg.name} in ${pg.location}. ${pg.type} PG accommodation with ${(pg.facilities || []).slice(0, 4).join(", ")}. Starting from ${pg.price}/month.`;

  const image = pg.img || `${BASE_URL}/og-image.jpg`;

  // JSON-LD for individual property
  const propertySchema = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: pg.name,
    description: description,
    url: `${BASE_URL}/pg/${pg.id}`,
    image: image,
    address: {
      "@type": "PostalAddress",
      streetAddress: pg.location,
      addressLocality: pg.city || pg.location,
      addressCountry: "IN",
    },
    priceRange: pg.price,
    amenityFeature: (pg.facilities || []).map((f: string) => ({
      "@type": "LocationFeatureSpecification",
      name: f,
      value: true,
    })),
    ...(pg.lat && pg.lng
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: pg.lat,
            longitude: pg.lng,
          },
        }
      : {}),
    ...(pg.rating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: pg.rating,
            bestRating: 5,
            worstRating: 1,
            ratingCount: 1,
          },
        }
      : {}),
  };

  return {
    title,
    description,
    keywords: [
      pg.name,
      `PG in ${pg.city || pg.location}`,
      `${pg.type} PG`,
      `PG accommodation ${pg.location}`,
      "verified PG",
      "paying guest",
      "book PG online",
      ...(pg.facilities || []).slice(0, 5),
    ],
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/pg/${pg.id}`,
      images: [{ url: image, width: 1200, height: 630, alt: pg.name }],
      type: "website",
      siteName: "Savion",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    alternates: {
      canonical: `${BASE_URL}/pg/${pg.id}`,
    },
    other: {
      "script:ld+json": JSON.stringify(propertySchema),
    },
  };
}
