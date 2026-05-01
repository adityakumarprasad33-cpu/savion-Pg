"use client";
import { PageHero, Section, SectionTitle, Paragraph, StatCard, ValueCard, StepCard } from "@/components/layout/InfoPageWrapper";

export function AboutPage() {
  return (
    <div className="bg-background">
      <PageHero badge="Our Story" title="Reimagining How India Finds a Home Away From Home" subtitle="Savion was born from a simple frustration — finding a PG shouldn't involve shady brokers, fake photos, or surprise fees. We're building the platform we wished existed." />

      <Section>
        <SectionTitle>Our Mission</SectionTitle>
        <Paragraph>Every year, millions of students and working professionals in India leave home to chase their dreams. They deserve a safe, clean, affordable place to live — without the stress. Savion exists to make that happen.</Paragraph>
        <Paragraph>We connect verified PG owners with tenants through a transparent, digital-first platform. No broker fees. No hidden charges. No fake listings. Just real rooms, real prices, and real peace of mind.</Paragraph>
      </Section>

      <Section className="bg-slate-50">
        <SectionTitle>How It Works</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StepCard step="1" title="Search & Discover" desc="Browse hundreds of verified PGs across 15+ cities. Filter by price, amenities, location, and gender preference." />
          <StepCard step="2" title="Verify & Book" desc="Complete quick KYC verification, sign your digital rental agreement, and pay securely via UPI." />
          <StepCard step="3" title="Move In & Thrive" desc="Move into your verified room. Manage payments, raise complaints, and give reviews — all from your dashboard." />
        </div>
      </Section>

      <Section>
        <SectionTitle>Our Values</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ValueCard icon="🛡️" title="Trust First" desc="Every property is physically verified. Every owner is identity-checked. We don't list what we can't vouch for." />
          <ValueCard icon="🔍" title="Radical Transparency" desc="Real photos, accurate pricing, honest reviews. What you see on Savion is exactly what you get in reality." />
          <ValueCard icon="⚡" title="Technology-Driven" desc="Digital contracts, real-time dashboards, automated checkout — we use technology to eliminate every friction point." />
          <ValueCard icon="🏠" title="Tenant-First Design" desc="Every feature we build starts with one question: does this make the tenant's life easier? If not, we don't ship it." />
        </div>
      </Section>

      <Section className="bg-slate-50">
        <SectionTitle>Savion in Numbers</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatCard value="15+" label="Cities Covered" />
          <StatCard value="500+" label="Verified PGs" />
          <StatCard value="10K+" label="Happy Tenants" />
          <StatCard value="4.8★" label="Average Rating" />
        </div>
      </Section>

      <Section>
        <SectionTitle>The Team Behind Savion</SectionTitle>
        <Paragraph>We're a small but fiercely focused team of engineers, designers, and operations experts based in India. United by a shared belief that finding a home should be as easy as ordering food online.</Paragraph>
        <Paragraph>Our founding team brings experience from top Indian startups and tech companies. We've lived in PGs ourselves — we know the pain, and we're fixing it.</Paragraph>
        <Paragraph>Interested in joining us? Check out our <a href="/careers" className="text-primary font-bold hover:underline">open positions</a>.</Paragraph>
      </Section>
    </div>
  );
}
