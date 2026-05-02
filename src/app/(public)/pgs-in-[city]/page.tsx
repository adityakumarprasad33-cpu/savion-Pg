import type { Metadata } from "next";
import Link from "next/link";
import { getPGs } from "@/lib/db/pgs";

const BASE_URL = "https://savion.netlify.app";

const CITIES = [
  { slug: "bangalore", name: "Bangalore", alt: ["Bengaluru"] },
  { slug: "mumbai", name: "Mumbai", alt: ["Bombay"] },
  { slug: "delhi", name: "Delhi", alt: ["New Delhi"] },
  { slug: "pune", name: "Pune", alt: [] },
  { slug: "hyderabad", name: "Hyderabad", alt: [] },
  { slug: "chennai", name: "Chennai", alt: ["Madras"] },
  { slug: "kolkata", name: "Kolkata", alt: ["Calcutta"] },
  { slug: "jaipur", name: "Jaipur", alt: [] },
  { slug: "noida", name: "Noida", alt: [] },
  { slug: "gurgaon", name: "Gurgaon", alt: ["Gurugram"] },
  { slug: "ahmedabad", name: "Ahmedabad", alt: [] },
  { slug: "chandigarh", name: "Chandigarh", alt: [] },
  { slug: "phagwara", name: "Phagwara", alt: [] },
  { slug: "ludhiana", name: "Ludhiana", alt: [] },
  { slug: "amritsar", name: "Amritsar", alt: [] },
];

export function generateStaticParams() {
  return CITIES.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { city: string };
}): Promise<Metadata> {
  const cityInfo = CITIES.find((c) => c.slug === params.city);
  const cityName = cityInfo?.name || params.city;

  return {
    title: `PG in ${cityName} — Verified Paying Guest Rooms | Savion`,
    description: `Find verified PG accommodations in ${cityName}. Boys PG, girls PG, co-living & furnished rooms with WiFi, food, AC. Book online instantly with digital contracts. Best PG near you in ${cityName}.`,
    keywords: [
      `PG in ${cityName}`,
      `paying guest in ${cityName}`,
      `${cityName} PG accommodation`,
      `boys PG in ${cityName}`,
      `girls PG in ${cityName}`,
      `co-living ${cityName}`,
      `furnished PG ${cityName}`,
      `PG with food ${cityName}`,
      `affordable PG ${cityName}`,
      `PG near me ${cityName}`,
      `room for rent ${cityName}`,
      `student accommodation ${cityName}`,
      ...(cityInfo?.alt.map((a) => `PG in ${a}`) || []),
    ],
    openGraph: {
      title: `PG in ${cityName} | Savion`,
      description: `Browse verified PG rooms in ${cityName}. Book online with instant confirmation.`,
      url: `${BASE_URL}/pgs-in-${params.city}`,
      images: [{ url: `${BASE_URL}/og-image.jpg`, width: 1200, height: 630 }],
    },
    alternates: {
      canonical: `${BASE_URL}/pgs-in-${params.city}`,
    },
  };
}

export default async function CityPGPage({
  params,
}: {
  params: { city: string };
}) {
  const cityInfo = CITIES.find((c) => c.slug === params.city);
  const cityName = cityInfo?.name || params.city;

  // Fetch PGs and filter by city
  const allPgs = await getPGs().catch(() => []);
  const cityPgs = allPgs.filter(
    (pg) =>
      (pg.city || "").toLowerCase().includes(params.city) ||
      pg.location.toLowerCase().includes(params.city) ||
      (cityInfo?.alt || []).some((alt) =>
        pg.location.toLowerCase().includes(alt.toLowerCase())
      )
  );

  // JSON-LD for this city page
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `PG Accommodations in ${cityName}`,
    description: `Verified paying guest rooms in ${cityName}`,
    url: `${BASE_URL}/pgs-in-${params.city}`,
    numberOfItems: cityPgs.length,
    itemListElement: cityPgs.slice(0, 10).map((pg, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "LodgingBusiness",
        name: pg.name,
        url: `${BASE_URL}/pg/${pg.id}`,
        address: {
          "@type": "PostalAddress",
          streetAddress: pg.location,
          addressLocality: cityName,
          addressCountry: "IN",
        },
        priceRange: pg.price,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <div className="min-h-screen bg-background">
        {/* SEO-rich Hero — static, server-rendered, fully crawlable */}
        <section className="bg-card border-b py-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <div className="inline-block bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
              Verified PG in {cityName}
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
              PG Accommodation in {cityName}
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
              Browse{" "}
              <strong>{cityPgs.length > 0 ? cityPgs.length : "verified"}</strong>{" "}
              paying guest accommodations in {cityName} — boys PG, girls PG &
              co-living spaces with WiFi, food, AC and more. Book online with
              digital contracts and instant confirmation.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/search?location=${params.city}`}
                className="inline-flex items-center justify-center bg-primary text-white font-bold px-8 py-3 rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                Browse All PGs in {cityName} →
              </Link>
              <Link
                href="/search"
                className="inline-flex items-center justify-center bg-card text-foreground font-bold px-8 py-3 rounded-xl border border-border hover:bg-muted transition-all"
              >
                Search All Cities
              </Link>
            </div>
          </div>
        </section>

        {/* Listed PGs */}
        {cityPgs.length > 0 && (
          <section className="container mx-auto max-w-5xl px-4 py-12">
            <h2 className="text-2xl font-black text-slate-900 mb-6">
              Available PGs in {cityName}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cityPgs.map((pg) => (
                <Link
                  key={pg.id}
                  href={`/pg/${pg.id}`}
                  className="bg-card rounded-2xl border border-border p-5 hover:shadow-lg hover:border-primary/30 transition-all group"
                >
                  <h3 className="font-black text-lg text-slate-900 group-hover:text-primary transition-colors mb-1">
                    {pg.name}
                  </h3>
                  <p className="text-sm text-slate-500 mb-3">{pg.location}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-black text-lg">{pg.price}<span className="text-slate-400 font-normal text-sm">/mo</span></span>
                    <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">{pg.type}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* SEO Content — keyword-rich, static text for crawlers */}
        <section className="bg-card border-t py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-black text-slate-900 mb-4">
              Why Choose Savion for PG in {cityName}?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-600 text-sm leading-relaxed">
              <div>
                <h3 className="font-bold text-slate-800 mb-2">✅ Verified Properties</h3>
                <p>Every PG in {cityName} listed on Savion is manually verified. View real photos, accurate amenities, and transparent pricing before you book.</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-2">📝 Digital Rental Agreement</h3>
                <p>Sign your rental contract digitally. No paperwork hassle. Your agreement is stored securely and accessible anytime from your dashboard.</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-2">⚡ Instant Booking</h3>
                <p>Book your PG room in {cityName} online. Pay securely via UPI and get instant confirmation. No broker fees, no hidden charges.</p>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-2">🏠 All Types Available</h3>
                <p>Find boys PG, girls PG, co-living spaces, and furnished rooms in {cityName} — near colleges, IT parks, metro stations, and commercial hubs.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section for rich snippets */}
        <section className="bg-muted border-t py-12 px-4">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-2xl font-black text-slate-900 mb-6">
              Frequently Asked Questions — PG in {cityName}
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: `How do I find a verified PG in ${cityName}?`,
                  a: `Search on Savion for PG accommodations in ${cityName}. All listings are verified by our team. Use filters for price, amenities, and gender preference.`,
                },
                {
                  q: `What is the average cost of PG in ${cityName}?`,
                  a: `PG rent in ${cityName} typically ranges from ₹5,000 to ₹20,000 per month depending on the location, room type (single/double/triple), and amenities like AC, food, and WiFi.`,
                },
                {
                  q: `Is Savion free to use for finding PG?`,
                  a: `Yes, searching and browsing PG listings on Savion is completely free. You only pay the room rent directly to the owner after booking.`,
                },
                {
                  q: `Can I get a PG with food included in ${cityName}?`,
                  a: `Yes! Use the "Food Included" filter on Savion's search page to find PG accommodations in ${cityName} that provide meals.`,
                },
              ].map((faq, i) => (
                <details key={i} className="bg-card border border-border rounded-xl p-5 cursor-pointer group">
                  <summary className="font-bold text-slate-800 list-none flex justify-between items-center">
                    {faq.q}
                    <span className="text-primary group-open:rotate-180 transition-transform text-xl">+</span>
                  </summary>
                  <p className="text-slate-600 text-sm mt-3 leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
