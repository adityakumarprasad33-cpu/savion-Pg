"use client";
import { PageHero, Section, SectionTitle, Paragraph, Card } from "@/components/layout/InfoPageWrapper";

export function PressPage() {
  return (
    <div className="bg-background">
      <PageHero badge="Press & Media" title="Savion in the News" subtitle="For press inquiries, media kits, and brand partnerships — we'd love to hear from you." />

      <Section>
        <SectionTitle>Press Releases</SectionTitle>
        <div className="space-y-4">
          <Card>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
              <h3 className="font-bold text-foreground">Savion Launches Verified PG Platform in 15+ Indian Cities</h3>
              <span className="text-xs text-muted-foreground font-mono shrink-0">May 2026</span>
            </div>
            <p className="text-sm text-muted-foreground">Savion today announced the launch of its verified PG accommodation platform, serving students and working professionals across 15 major Indian cities with digital contracts and instant booking.</p>
          </Card>
          <Card>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
              <h3 className="font-bold text-foreground">Digital Rental Agreements: How Savion is Eliminating Paperwork</h3>
              <span className="text-xs text-muted-foreground font-mono shrink-0">April 2026</span>
            </div>
            <p className="text-sm text-muted-foreground">Savion's fully digital rental agreement system allows tenants to sign contracts online with e-signatures, eliminating the need for physical paperwork and in-person meetings.</p>
          </Card>
          <Card>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
              <h3 className="font-bold text-foreground">Identity-First Booking: Savion Introduces Aadhaar-Based KYC Verification</h3>
              <span className="text-xs text-muted-foreground font-mono shrink-0">March 2026</span>
            </div>
            <p className="text-sm text-muted-foreground">To ensure safety for both tenants and property owners, Savion now requires government ID verification before confirming any booking — a first in the Indian PG industry.</p>
          </Card>
        </div>
      </Section>

      <Section className="bg-slate-50 dark:bg-zinc-800/50">
        <SectionTitle>Brand Guidelines</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <h3 className="font-bold text-foreground mb-2">Logo & Name</h3>
            <p className="text-sm text-muted-foreground">Always use "Savion" with a capital S. Never abbreviate, alter colors, or add effects to the logo. Minimum clear space: 16px on all sides.</p>
          </Card>
          <Card>
            <h3 className="font-bold text-foreground mb-2">Color Palette</h3>
            <div className="flex gap-2 mt-2">
              <div className="w-10 h-10 rounded-lg bg-primary" title="Primary" />
              <div className="w-10 h-10 rounded-lg bg-orange-500" title="Accent" />
              <div className="w-10 h-10 rounded-lg bg-slate-900" title="Dark" />
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-zinc-800 border" title="Light" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Primary: Brand Red • Accent: Orange • Dark/Light for text</p>
          </Card>
          <Card>
            <h3 className="font-bold text-foreground mb-2">Tone of Voice</h3>
            <p className="text-sm text-muted-foreground">Confident, friendly, direct. We speak like a helpful friend, not a corporate robot. Active voice. Short sentences. No jargon.</p>
          </Card>
        </div>
      </Section>

      <Section>
        <SectionTitle>Media Contact</SectionTitle>
        <Paragraph>For press inquiries, interviews, or media partnerships, please reach out to our communications team:</Paragraph>
        <Paragraph><strong>Email:</strong> <a href="mailto:press@savion.app" className="text-primary font-bold hover:underline">press@savion.app</a></Paragraph>
        <Paragraph>We aim to respond to all media inquiries within 24 hours.</Paragraph>
      </Section>
    </div>
  );
}
