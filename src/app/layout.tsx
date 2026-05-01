import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ClientWrapper } from "@/components/layout/ClientWrapper";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const BASE_URL = "https://savion.netlify.app";

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Savion — Find & Book Verified PG Accommodations Online",
    template: "%s | Savion",
  },
  description:
    "Savion is India's smartest PG booking platform. Find verified paying guest accommodations, boys PG, girls PG, co-living spaces with Wi-Fi, food, AC & more. Book online instantly with digital contracts.",
  keywords: [
    "PG accommodation",
    "paying guest",
    "PG near me",
    "boys PG",
    "girls PG",
    "co-living",
    "PG booking online",
    "furnished PG",
    "PG with food",
    "PG with WiFi",
    "hostel booking",
    "room for rent",
    "PG rooms",
    "verified PG",
    "affordable PG",
    "monthly room rental",
    "student accommodation India",
    "working professional PG",
    "book PG online",
    "digital rental agreement",
  ],
  authors: [{ name: "Savion Platform", url: BASE_URL }],
  creator: "Savion",
  publisher: "Savion Technologies",
  category: "Real Estate",
  applicationName: "Savion",
  referrer: "origin-when-cross-origin",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: BASE_URL,
    siteName: "Savion",
    title: "Savion — Find & Book Verified PG Accommodations Online",
    description:
      "Search hundreds of verified PG rooms, boys PG, girls PG & co-living spaces. Book online with digital contracts and instant confirmations.",
    images: [
      {
        url: `${BASE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "Savion — India's Smartest PG Booking Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Savion — Find & Book Verified PG Accommodations Online",
    description:
      "India's smartest PG booking platform. Verified rooms, digital contracts, instant bookings.",
    images: [`${BASE_URL}/og-image.jpg`],
    creator: "@SavionApp",
  },
  alternates: {
    canonical: BASE_URL,
  },
  verification: {
    // Add Google Search Console verification code here when available
    // google: "your-google-verification-code",
  },
};

// JSON-LD Structured Data
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Savion",
  url: BASE_URL,
  description:
    "India's smartest PG booking platform with verified accommodations, digital contracts, and instant booking.",
  applicationCategory: "RealEstate",
  operatingSystem: "Web",
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "INR",
    description: "Monthly PG room rentals starting from ₹3,000/month",
  },
  provider: {
    "@type": "Organization",
    name: "Savion",
    url: BASE_URL,
    sameAs: [],
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How do I find and book a PG accommodation on Savion?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Search by city or location on Savion, browse verified PG listings, select a room, sign digitally, and pay via UPI for instant confirmation.",
      },
    },
    {
      "@type": "Question",
      name: "Is Savion free to use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, Savion is completely free for tenants. You only pay the monthly rent to the owner.",
      },
    },
    {
      "@type": "Question",
      name: "Are all PG listings on Savion verified?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Every property goes through an owner verification process with real photos and transparent pricing.",
      },
    },
    {
      "@type": "Question",
      name: "What types of PG accommodations are available?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Savion lists boys PG, girls PG, co-living spaces, and furnished rooms across multiple Indian cities with amenities like WiFi, AC, food, and CCTV.",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}
