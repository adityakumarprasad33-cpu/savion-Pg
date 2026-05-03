"use client";
import { PageHero, Section, SectionTitle, Paragraph, Card, StepCard } from "@/components/layout/InfoPageWrapper";

export function CancellationPage() {
  return (
    <div className="bg-background">
      <PageHero badge="Policies" title="Flexible Plans, Fair Policies" subtitle="We believe in transparency. Here's exactly how cancellations, refunds, and move-out procedures work." />

      <Section>
        <SectionTitle>Before Move-In</SectionTitle>
        <Card>
          <h3 className="font-bold text-foreground mb-2">48-Hour Free Cancellation</h3>
          <p className="text-muted-foreground">If you cancel your booking within 48 hours of confirmation and before your move-in date, you'll receive a 100% refund of any amount paid. No questions asked.</p>
          <div className="mt-4 p-3 bg-green-50 rounded-xl text-sm text-green-800 font-medium">✅ Full refund — processed within 5-7 business days</div>
        </Card>
        <Card className="mt-4">
          <h3 className="font-bold text-foreground mb-2">After 48 Hours / Before Move-In</h3>
          <p className="text-muted-foreground">If you cancel after 48 hours but before your move-in date, a processing fee of ₹500 may apply. The remaining amount is refunded within 7 business days.</p>
          <div className="mt-4 p-3 bg-amber-50 rounded-xl text-sm text-amber-800 font-medium">⚠️ Partial refund — ₹500 processing fee may apply</div>
        </Card>
      </Section>

      <Section className="bg-slate-50 dark:bg-zinc-800/50">
        <SectionTitle>After Move-In (Move-Out Process)</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StepCard step="1" title="Give Notice" desc="Click 'Give Move-Out Notice' on your dashboard. A 7-day notice period begins." />
          <StepCard step="2" title="Owner Approval" desc="The owner reviews and approves your move-out request. Your status changes to 'notice_approved'." />
          <StepCard step="3" title="Clear Dues" desc="Ensure all outstanding rent payments are cleared before the move-out date." />
          <StepCard step="4" title="Auto Checkout" desc="At 5:00 PM on your move-out date, checkout happens automatically. Your booking and contract records are deleted." />
        </div>
      </Section>

      <Section>
        <SectionTitle>Security Deposit</SectionTitle>
        <Paragraph>The security deposit (typically equal to one month's rent) is collected at the time of booking. Here's how refunds work:</Paragraph>
        <div className="space-y-4 mt-4">
          <Card>
            <h3 className="font-bold text-foreground mb-1">Full Refund</h3>
            <p className="text-sm text-muted-foreground">If the room is returned in its original condition with no damages, the full security deposit is refunded within 15 business days of checkout.</p>
          </Card>
          <Card>
            <h3 className="font-bold text-foreground mb-1">Partial Refund</h3>
            <p className="text-sm text-muted-foreground">If there are damages to the room or property, the cost of repairs is deducted from the security deposit. You'll receive an itemized deduction list from the owner.</p>
          </Card>
          <Card>
            <h3 className="font-bold text-foreground mb-1">Disputes</h3>
            <p className="text-sm text-muted-foreground">If you disagree with any deductions, raise a dispute by emailing support@savion.app within 7 days of receiving the deduction notice. We'll mediate between both parties.</p>
          </Card>
        </div>
      </Section>

      <Section className="bg-slate-50 dark:bg-zinc-800/50">
        <SectionTitle>Refund Timeline</SectionTitle>
        <Paragraph>All refunds are processed to the original UPI payment method. Expected timelines:</Paragraph>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <Card className="text-center"><div className="text-2xl font-black text-primary">5-7 Days</div><p className="text-sm text-muted-foreground mt-1">Pre move-in cancellation</p></Card>
          <Card className="text-center"><div className="text-2xl font-black text-primary">15 Days</div><p className="text-sm text-muted-foreground mt-1">Security deposit (no damage)</p></Card>
          <Card className="text-center"><div className="text-2xl font-black text-primary">30 Days</div><p className="text-sm text-muted-foreground mt-1">Disputed deductions</p></Card>
        </div>
      </Section>
    </div>
  );
}
