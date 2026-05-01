"use client";
import { PageHero, Section, SectionTitle, Paragraph, JobCard, ValueCard } from "@/components/layout/InfoPageWrapper";

export function CareersPage() {
  return (
    <div className="bg-background">
      <PageHero badge="We're Hiring" title="Build the Future of Student Housing" subtitle="Join a mission-driven team that's reimagining how millions of Indians find their home away from home. Remote-first. Impact-driven. No bureaucracy." />

      <Section>
        <SectionTitle>Why Savion?</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ValueCard icon="🚀" title="Real Impact" desc="Your code directly helps students find safe, affordable housing. No vanity metrics — real people, real outcomes." />
          <ValueCard icon="🌍" title="Remote-First" desc="Work from anywhere in India. We care about output, not office hours. Async by default, meetings when needed." />
          <ValueCard icon="📈" title="Grow Fast" desc="We're early-stage. You'll wear many hats, ship fast, and grow faster than at any big corporation." />
        </div>
      </Section>

      <Section className="bg-slate-50">
        <SectionTitle>Open Positions</SectionTitle>
        <div className="space-y-4">
          <JobCard title="Full-Stack Engineer" location="Remote (India)" type="Full-time" desc="Build and scale our Next.js + Firebase platform. You'll own features end-to-end — from database schema to pixel-perfect UI. Strong TypeScript and React skills required." />
          <JobCard title="Operations Lead — City Expansion" location="Bangalore / Mumbai" type="Full-time" desc="Lead our expansion into new cities. You'll onboard PG owners, manage local verification teams, and ensure quality standards across every listing." />
          <JobCard title="Campus Ambassador" location="Any Indian College" type="Part-time" desc="Represent Savion at your university. Spread the word, gather feedback, and help fellow students find better housing. Earn stipend + perks." />
          <JobCard title="UI/UX Designer" location="Remote (India)" type="Full-time" desc="Design beautiful, intuitive experiences for our tenant and owner dashboards. Figma expertise and a strong portfolio of web/mobile design required." />
        </div>
      </Section>

      <Section>
        <SectionTitle>Perks & Benefits</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ValueCard icon="💰" title="Competitive Pay + Equity" desc="We pay market-rate salaries with meaningful equity. When Savion wins, you win." />
          <ValueCard icon="📚" title="Learning Budget" desc="₹50,000/year for courses, conferences, books, and tools to keep growing." />
          <ValueCard icon="🏖️" title="Unlimited PTO" desc="Take the time you need. We trust you to manage your workload responsibly." />
          <ValueCard icon="💻" title="Setup Allowance" desc="₹75,000 one-time for your home office — laptop, chair, monitor, whatever you need." />
        </div>
      </Section>

      <Section className="bg-primary/5 rounded-3xl mx-4 md:mx-8">
        <SectionTitle>How to Apply</SectionTitle>
        <Paragraph>Send your resume and a brief note about why you're excited about Savion to <a href="mailto:careers@savion.app" className="text-primary font-bold hover:underline">careers@savion.app</a>. Include links to your portfolio, GitHub, or any relevant work.</Paragraph>
        <Paragraph>We review every application personally. No ATS, no automated filters. Expect a response within 5 business days.</Paragraph>
      </Section>
    </div>
  );
}
