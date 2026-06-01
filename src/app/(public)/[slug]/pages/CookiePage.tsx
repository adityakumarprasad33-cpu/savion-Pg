"use client";
import { PageHero, Section, SectionTitle, Paragraph, LegalSection, Card } from "@/components/layout/InfoPageWrapper";

export function CookiePage() {
  return (
    <div className="bg-background">
      <PageHero badge="Legal" title="Cookie Policy" subtitle="How we use cookies and similar technologies on the Savion platform." />

      <Section>
        <p className="text-sm text-muted-foreground mb-10 font-mono">Last Updated: May 1, 2026</p>

        <LegalSection number="1" title="What Are Cookies" content="Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences, maintain login sessions, and understand how you interact with the platform. Savion uses cookies and similar technologies (localStorage, sessionStorage) to provide a seamless experience." />

        <SectionTitle>Types of Cookies We Use</SectionTitle>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <Card>
            <div className="text-xs font-bold uppercase text-green-600 bg-green-50 px-2 py-1 rounded-full w-fit mb-3">Essential</div>
            <h3 className="font-bold text-foreground mb-2">Authentication Cookies</h3>
            <p className="text-sm text-muted-foreground">Maintain your login session so you don't have to log in on every page. These include Firebase Auth tokens and session identifiers. Cannot be disabled.</p>
          </Card>
          <Card>
            <div className="text-xs font-bold uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded-full w-fit mb-3">Functional</div>
            <h3 className="font-bold text-foreground mb-2">Preference Cookies</h3>
            <p className="text-sm text-muted-foreground">Remember your preferences like theme (light/dark mode), language, and last-viewed city. These improve your experience but aren't strictly necessary.</p>
          </Card>
          <Card>
            <div className="text-xs font-bold uppercase text-purple-600 bg-purple-50 px-2 py-1 rounded-full w-fit mb-3">Analytics</div>
            <h3 className="font-bold text-foreground mb-2">Analytics Cookies</h3>
            <p className="text-sm text-muted-foreground">Help us understand how users navigate the platform — which pages are popular, where users drop off, and how to improve the experience. Powered by Firebase Analytics.</p>
          </Card>
        </div>

        <LegalSection number="3" title="Third-Party Cookies" content="Some cookies are set by third-party services we use: (a) Google/Firebase — authentication and analytics; (b) Cloudinary — optimized image delivery. These third parties have their own privacy policies governing their cookie usage. We recommend reviewing Google's Privacy Policy and Cloudinary's Privacy Policy for details." />

        <LegalSection number="4" title="How to Manage Cookies" content="You can manage or delete cookies through your browser settings. Most browsers allow you to: (a) see what cookies are stored and delete them individually; (b) block third-party cookies; (c) block all cookies from specific sites; (d) block all cookies entirely. Note: blocking essential cookies will prevent you from logging in and using core platform features." />

        <LegalSection number="5" title="Cookie Consent" content="By continuing to use the Savion platform, you consent to the use of cookies as described in this policy. Essential cookies are always active. Functional and analytics cookies can be managed through your browser settings." />

        <LegalSection number="6" title="Changes to This Policy" content="We may update this Cookie Policy when we adopt new technologies or change our practices. The 'Last Updated' date at the top will reflect the most recent revision. Significant changes will be communicated via the platform." />

        <LegalSection number="7" title="Contact Us" content="For questions about our cookie practices, contact us at privacy@savion.app." />
      </Section>
    </div>
  );
}
