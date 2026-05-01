"use client";
import { PageHero, Section, SectionTitle, Paragraph, FAQ } from "@/components/layout/InfoPageWrapper";

export function HelpCenterPage() {
  return (
    <div className="bg-background">
      <PageHero badge="Support" title="How Can We Help You?" subtitle="Find answers to common questions about booking, payments, verification, and more." />

      <Section>
        <SectionTitle>Booking & Payments</SectionTitle>
        <div className="space-y-3">
          <FAQ question="How do I book a PG on Savion?" answer="Search for PGs by city or location, select a room, complete your KYC verification (Aadhaar or government ID), sign the digital rental agreement, and pay via UPI. You'll receive instant confirmation once payment is verified." />
          <FAQ question="What payment methods are accepted?" answer="We currently support UPI payments (Google Pay, PhonePe, Paytm, BHIM). After booking, you'll be shown a QR code linked to the owner's verified UPI ID. Enter your UTR number after payment for instant verification." />
          <FAQ question="Can I book a room without paying immediately?" answer="Yes! During booking, you can choose 'Pay Later' (inquiry mode). The owner will review your request and approve it. Once approved, you can complete the payment from your tenant dashboard." />
          <FAQ question="Is my payment secure?" answer="Absolutely. Payments go directly from your UPI app to the owner's verified UPI ID. Savion never holds your money. We only record the transaction for your payment history and receipt generation." />
          <FAQ question="Can I pay rent monthly through Savion?" answer="Yes. Your tenant dashboard has a dedicated 'Pay Rent' section. Each month, you can initiate a payment session, scan the QR code, pay via UPI, and submit the UTR for verification." />
        </div>
      </Section>

      <Section className="bg-slate-50">
        <SectionTitle>Account & Verification</SectionTitle>
        <div className="space-y-3">
          <FAQ question="Why do I need to verify my identity?" answer="KYC verification protects both tenants and owners. It ensures that every person on the platform is who they claim to be. We accept Aadhaar cards, driving licenses, and passports." />
          <FAQ question="How long does verification take?" answer="Most verifications are reviewed and approved within 24 hours. You can check your verification status anytime from your dashboard's verification banner." />
          <FAQ question="What happens if my verification is rejected?" answer="You'll receive a reason for the rejection (e.g., blurry document, name mismatch). You can re-submit your documents immediately from the verification modal. There's no limit on resubmissions." />
          <FAQ question="Can I change my role (tenant/owner) after signing up?" answer="Currently, roles are set during account creation. If you need to change your role, please contact support at support@savion.app with your registered email." />
        </div>
      </Section>

      <Section>
        <SectionTitle>Move-In & Move-Out</SectionTitle>
        <div className="space-y-3">
          <FAQ question="How does the move-in process work?" answer="After your booking is confirmed and payment is verified, your move-in date is set in the rental agreement. Simply arrive at the PG on that date — the owner/caretaker will have your room ready." />
          <FAQ question="How do I give a move-out notice?" answer="Go to your tenant dashboard, find your active booking, and click 'Give Move-Out Notice'. This initiates a 7-day notice period. The owner must approve the notice, and checkout happens automatically at 5:00 PM on the move-out date." />
          <FAQ question="What happens to my data after checkout?" answer="After checkout, your booking, contract, and complaints are automatically deleted. However, your payment history and reviews are permanently preserved for financial auditing and community trust." />
          <FAQ question="Can I cancel my move-out notice?" answer="Once the owner has approved your move-out notice, it cannot be reversed. If you haven't received approval yet, contact the owner or raise a support request." />
        </div>
      </Section>

      <Section className="bg-slate-50">
        <SectionTitle>Complaints & Disputes</SectionTitle>
        <div className="space-y-3">
          <FAQ question="How do I file a complaint?" answer="From your tenant dashboard, go to the 'Complaints' tab and click 'New Complaint'. Select a category (maintenance, security, cleanliness, etc.), describe the issue, and submit. The owner is notified instantly." />
          <FAQ question="How long does complaint resolution take?" answer="Owners are notified in real-time. Most maintenance complaints are resolved within 48-72 hours. You can track the status (open → in-progress → resolved) from your dashboard." />
          <FAQ question="What if my complaint is not resolved?" answer="If a complaint remains unresolved for more than 7 days, you can escalate it by contacting support@savion.app. We'll mediate between you and the property owner." />
        </div>
      </Section>

      <Section>
        <SectionTitle>Still Need Help?</SectionTitle>
        <Paragraph>Our support team is available to assist you with any issue not covered above.</Paragraph>
        <Paragraph><strong>Email:</strong> <a href="mailto:support@savion.app" className="text-primary font-bold hover:underline">support@savion.app</a></Paragraph>
        <Paragraph><strong>Response Time:</strong> Within 24 hours on business days.</Paragraph>
        <Paragraph><strong>Emergency:</strong> For safety-related emergencies, please call local emergency services (112) immediately, then notify us.</Paragraph>
      </Section>
    </div>
  );
}
