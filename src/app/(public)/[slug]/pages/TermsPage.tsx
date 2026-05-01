"use client";
import { PageHero, Section, SectionTitle, LegalSection } from "@/components/layout/InfoPageWrapper";

export function TermsPage() {
  return (
    <div className="bg-background">
      <PageHero badge="Legal" title="Terms of Service" subtitle="These terms govern your use of the Savion platform. Please read them carefully." />

      <Section>
        <p className="text-sm text-muted-foreground mb-10 font-mono">Last Updated: May 1, 2026</p>

        <LegalSection number="1" title="Acceptance of Terms" content="By accessing or using the Savion platform (website and mobile application), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the platform. Continued use after modifications constitutes acceptance of the updated terms." />

        <LegalSection number="2" title="Platform Description & Eligibility" content="Savion is a digital platform connecting paying guest (PG) property owners with tenants seeking accommodation. You must be at least 18 years old and legally capable of entering into binding agreements to use our services. By registering, you represent that you meet these eligibility requirements." />

        <LegalSection number="3" title="User Accounts & Registration" content="You must create an account to access most features. You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate, current, and complete information during registration. Savion reserves the right to suspend or terminate accounts that violate these terms or provide false information." />

        <LegalSection number="4" title="Booking & Payment Terms" content="Bookings made through Savion constitute a binding agreement between the tenant and the property owner. All payments are processed via UPI directly between the tenant and owner — Savion does not act as a payment intermediary or escrow service. Payment amounts are determined by the property listing and are non-negotiable through the platform." />

        <LegalSection number="5" title="Digital Rental Agreements" content="Upon booking confirmation, a digital rental agreement is generated and signed electronically by the tenant. This agreement is legally binding under the Information Technology Act, 2000 and the Indian Contract Act, 1872. Both parties receive a copy accessible through their respective dashboards." />

        <LegalSection number="6" title="User Conduct & Prohibited Activities" content="Users agree not to: (a) provide false or misleading information; (b) impersonate another person; (c) use the platform for any illegal purpose; (d) harass, threaten, or abuse other users; (e) attempt to circumvent platform security measures; (f) scrape, crawl, or extract data from the platform without authorization; (g) list properties they do not own or have authority to list." />

        <LegalSection number="7" title="Property Listings & Owner Obligations" content="Property owners are responsible for the accuracy of their listings including photos, pricing, amenities, and availability. Owners must maintain properties to the standard represented in their listings. Savion conducts verification but does not guarantee the condition of any property beyond the time of inspection." />

        <LegalSection number="8" title="Identity Verification (KYC)" content="Savion requires identity verification for certain actions including booking. Documents submitted for KYC (Aadhaar, driving license, passport) are encrypted and stored securely. Verification is subject to admin approval. Savion reserves the right to reject verification documents that appear fraudulent or manipulated." />

        <LegalSection number="9" title="Cancellation & Refund Policy" content="Cancellation terms are detailed in our Cancellation Options page. In summary: cancellations within 48 hours of booking (before move-in) receive a full refund. Post move-in cancellations require a 7-day notice period. Security deposit refunds are subject to property condition assessment." />

        <LegalSection number="10" title="Limitation of Liability" content="Savion acts as a technology platform connecting tenants and owners. We are not a real estate broker, property manager, or landlord. Savion is not liable for: (a) disputes between tenants and owners; (b) property damage or personal injury; (c) payment disputes; (d) inaccuracies in listings. Our total liability shall not exceed the amount paid by the user in the preceding 12 months." />

        <LegalSection number="11" title="Intellectual Property" content="All content on the Savion platform — including logos, text, design, software, and graphics — is owned by Savion Technologies and protected by intellectual property laws. Users may not reproduce, distribute, or create derivative works without explicit written permission." />

        <LegalSection number="12" title="Dispute Resolution & Governing Law" content="These terms are governed by the laws of India. Any disputes arising from these terms shall first be attempted to be resolved through good-faith mediation. If mediation fails, disputes shall be subject to the exclusive jurisdiction of the courts in Bangalore, Karnataka, India." />

        <LegalSection number="13" title="Modifications to Terms" content="Savion reserves the right to modify these terms at any time. Users will be notified of significant changes via email or platform notification. Continued use of the platform after changes constitutes acceptance of the modified terms." />

        <LegalSection number="14" title="Contact Information" content="For questions regarding these Terms of Service, contact us at legal@savion.app or write to: Savion Technologies, Bangalore, Karnataka, India." />
      </Section>
    </div>
  );
}
