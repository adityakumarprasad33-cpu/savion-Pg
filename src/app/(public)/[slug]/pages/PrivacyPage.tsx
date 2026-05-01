"use client";
import { PageHero, Section, SectionTitle, LegalSection } from "@/components/layout/InfoPageWrapper";

export function PrivacyPage() {
  return (
    <div className="bg-background">
      <PageHero badge="Legal" title="Privacy Policy" subtitle="How we collect, use, and protect your personal information." />

      <Section>
        <p className="text-sm text-muted-foreground mb-10 font-mono">Last Updated: May 1, 2026</p>

        <LegalSection number="1" title="Information We Collect" content="We collect the following types of information: (a) Personal Information: name, email address, phone number, and government ID (Aadhaar, driving license, or passport) provided during registration and KYC verification. (b) Device Information: browser type, IP address, device type, and operating system. (c) Usage Data: pages visited, features used, booking history, and interaction patterns." />

        <LegalSection number="2" title="How We Use Your Information" content="We use your data to: (a) create and manage your account; (b) process bookings and payments; (c) verify your identity through KYC; (d) generate digital rental agreements; (e) communicate important updates about your booking; (f) improve platform features and user experience; (g) prevent fraud and ensure platform security." />

        <LegalSection number="3" title="Identity Verification (KYC) Data" content="Government ID documents submitted for verification are encrypted in transit (TLS 1.3) and at rest (AES-256). Documents are stored on Cloudinary with restricted access. Only authorized admin personnel can view KYC documents for verification purposes. Selfie images used for face matching are processed and not retained after verification completion." />

        <LegalSection number="4" title="Data Sharing & Third Parties" content="We share data with the following third parties strictly for operational purposes: (a) Firebase (Google) — authentication, database, and analytics; (b) Cloudinary — secure image and document storage; (c) UPI Payment Providers — payment processing (we do not store UPI PINs or bank details). We never sell, rent, or trade your personal data to advertisers or data brokers." />

        <LegalSection number="5" title="Data Security Measures" content="We implement industry-standard security measures including: (a) encrypted data transmission via HTTPS; (b) Firebase Security Rules restricting database access by user role; (c) server-side session validation for payment processing; (d) automatic session expiry for inactive accounts; (e) regular security audits of our codebase and infrastructure." />

        <LegalSection number="6" title="Data Retention & Deletion" content="Active booking data (contracts, complaints, booking records) is automatically deleted after tenant checkout as part of our Auto-Vanish system. Payment history and reviews are retained permanently for financial auditing and community trust. Account data is retained as long as your account is active. You may request complete account deletion at any time." />

        <LegalSection number="7" title="Your Rights" content="Under applicable Indian data protection laws, you have the right to: (a) Access — request a copy of all personal data we hold about you; (b) Correction — update or correct inaccurate data; (c) Deletion — request deletion of your account and associated data; (d) Portability — receive your data in a structured, machine-readable format; (e) Objection — opt out of non-essential data processing. To exercise any of these rights, email privacy@savion.app." />

        <LegalSection number="8" title="Children's Privacy" content="Savion is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If we discover that a child under 18 has provided us with personal data, we will delete it immediately." />

        <LegalSection number="9" title="Changes to This Policy" content="We may update this Privacy Policy periodically. Significant changes will be communicated via email and/or a prominent notice on the platform. The 'Last Updated' date at the top reflects the most recent revision." />

        <LegalSection number="10" title="Contact Us" content="For privacy-related questions or to exercise your data rights, contact our Data Protection Officer at privacy@savion.app or write to: Data Protection Officer, Savion Technologies, Bangalore, Karnataka, India." />
      </Section>
    </div>
  );
}
