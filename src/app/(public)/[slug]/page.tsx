import { notFound } from "next/navigation";
import { AboutPage } from "./pages/AboutPage";
import { CareersPage } from "./pages/CareersPage";
import { PressPage } from "./pages/PressPage";
import { HelpCenterPage } from "./pages/HelpCenterPage";
import { SafetyPage } from "./pages/SafetyPage";
import { CancellationPage } from "./pages/CancellationPage";
import { TermsPage } from "./pages/TermsPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { CookiePage } from "./pages/CookiePage";
import type { Metadata } from "next";

const META: Record<string, { title: string; description: string }> = {
  about: { title: "About Us", description: "Learn about Savion — India's smartest PG booking platform. Our mission, values, and how we're reimagining student housing." },
  careers: { title: "Careers", description: "Join the Savion team. Explore open positions in engineering, operations, and campus ambassador roles." },
  press: { title: "Press & Media", description: "Savion press releases, media kit, and brand guidelines. For press inquiries contact press@savion.app." },
  "help-center": { title: "Help Center", description: "Get help with your Savion booking, payments, verification, move-in, move-out, and more." },
  safety: { title: "Safety Standards", description: "Learn about Savion's 24-point property verification, tenant safety protocols, and emergency procedures." },
  "cancellation-options": { title: "Cancellation Options", description: "Understand Savion's flexible cancellation and refund policies for PG bookings." },
  "terms-of-service": { title: "Terms of Service", description: "Savion's terms of service governing platform usage, bookings, payments, and digital agreements." },
  "privacy-policy": { title: "Privacy Policy", description: "How Savion collects, uses, and protects your personal data including KYC verification documents." },
  "cookie-policy": { title: "Cookie Policy", description: "Learn about cookies used on Savion for authentication, analytics, and user experience." },
};

const COMPONENTS: Record<string, React.FC> = {
  about: AboutPage,
  careers: CareersPage,
  press: PressPage,
  "help-center": HelpCenterPage,
  safety: SafetyPage,
  "cancellation-options": CancellationPage,
  "terms-of-service": TermsPage,
  "privacy-policy": PrivacyPage,
  "cookie-policy": CookiePage,
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const meta = META[slug];
  if (!meta) return { title: "Page Not Found" };
  return { title: meta.title, description: meta.description };
}

export function generateStaticParams() {
  return Object.keys(META).map((slug) => ({ slug }));
}

export default async function InfoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const PageComponent = COMPONENTS[slug];
  if (!PageComponent) return notFound();
  return <PageComponent />;
}
