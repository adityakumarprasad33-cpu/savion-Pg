"use client";
import { PageHero, Section, SectionTitle, Paragraph, Card, ValueCard } from "@/components/layout/InfoPageWrapper";

export function SafetyPage() {
  return (
    <div className="bg-background">
      <PageHero badge="Safety" title="Your Safety is Non-Negotiable" subtitle="Every property on Savion passes a rigorous verification process. Here's how we keep you safe." />

      <Section>
        <SectionTitle>Our 24-Point Verification Checklist</SectionTitle>
        <Paragraph>Before any PG is listed on Savion, our team conducts a comprehensive on-site inspection covering these critical areas:</Paragraph>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <Card><h3 className="font-bold mb-1">🏗️ Building & Structure</h3><p className="text-sm text-muted-foreground">Structural integrity, ventilation, natural lighting, staircase safety, emergency exits, and fire extinguisher placement.</p></Card>
          <Card><h3 className="font-bold mb-1">🔒 Security Systems</h3><p className="text-sm text-muted-foreground">CCTV cameras at entry/exit points, secure door locks, visitor log system, and 24/7 security guard or warden presence.</p></Card>
          <Card><h3 className="font-bold mb-1">🚰 Water & Sanitation</h3><p className="text-sm text-muted-foreground">Clean drinking water availability, functional bathrooms, proper drainage, and regular pest control schedules.</p></Card>
          <Card><h3 className="font-bold mb-1">⚡ Electrical Safety</h3><p className="text-sm text-muted-foreground">Proper wiring, circuit breakers, power backup system, and safe placement of electrical outlets in all rooms.</p></Card>
          <Card><h3 className="font-bold mb-1">🍽️ Food & Hygiene</h3><p className="text-sm text-muted-foreground">Kitchen cleanliness (if meals provided), food handling standards, and compliance with local food safety regulations.</p></Card>
          <Card><h3 className="font-bold mb-1">👤 Owner Verification</h3><p className="text-sm text-muted-foreground">Property ownership documents, owner's government ID verification, and local police verification of the premises.</p></Card>
        </div>
      </Section>

      <Section className="bg-slate-50">
        <SectionTitle>Safety for Tenants</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ValueCard icon="📱" title="Share Your Location" desc="Always share your PG address with a trusted family member or friend when moving to a new city." />
          <ValueCard icon="🔐" title="Secure Your Belongings" desc="Use the room lock provided. Don't share keys. Report any lock issues immediately via the complaint system." />
          <ValueCard icon="🚨" title="Know Emergency Exits" desc="Familiarize yourself with emergency exits and fire extinguisher locations on your first day." />
        </div>
      </Section>

      <Section>
        <SectionTitle>Safety for Owners</SectionTitle>
        <Paragraph>We protect property owners too. Every tenant on Savion goes through mandatory KYC verification before booking. This includes government ID verification (Aadhaar, driving license, or passport) and selfie matching.</Paragraph>
        <Paragraph>Owners receive real-time notifications for every booking, complaint, and payment. The digital contract system ensures legal protection for both parties.</Paragraph>
      </Section>

      <Section className="bg-slate-50">
        <SectionTitle>Report a Safety Concern</SectionTitle>
        <Paragraph>If you encounter any safety issue at a Savion-listed property, report it immediately:</Paragraph>
        <Paragraph><strong>Dashboard:</strong> File a complaint under the "Security" category from your tenant dashboard.</Paragraph>
        <Paragraph><strong>Email:</strong> <a href="mailto:safety@savion.app" className="text-primary font-bold hover:underline">safety@savion.app</a> — for urgent safety matters.</Paragraph>
        <Paragraph><strong>Emergency:</strong> Call <strong>112</strong> (India Emergency) for immediate threats to life or safety. Then notify us.</Paragraph>
      </Section>
    </div>
  );
}
