"use client";
import { motion } from "framer-motion";
import { ReactNode, useState } from "react";
import { ChevronDown } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 200, damping: 20 } },
};
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

export function PageHero({ title, subtitle, badge }: { title: string; subtitle: string; badge?: string }) {
  return (
    <section className="relative py-20 md:py-28 bg-gradient-to-br from-primary/5 via-background to-orange-50 overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <motion.div initial="hidden" animate="show" variants={stagger} className="container mx-auto px-4 md:px-6 max-w-4xl text-center relative z-10">
        {badge && (
          <motion.span variants={fadeUp} className="inline-block text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-6">{badge}</motion.span>
        )}
        <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-black tracking-tight text-foreground mb-4">{title}</motion.h1>
        <motion.p variants={fadeUp} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">{subtitle}</motion.p>
      </motion.div>
    </section>
  );
}

export function Section({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.section initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }} variants={stagger} className={`py-16 md:py-20 ${className}`}>
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">{children}</div>
    </motion.section>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <motion.h2 variants={fadeUp} className="text-2xl md:text-3xl font-black text-foreground mb-8 tracking-tight">{children}</motion.h2>;
}

export function Paragraph({ children }: { children: ReactNode }) {
  return <motion.p variants={fadeUp} className="text-muted-foreground leading-relaxed mb-4">{children}</motion.p>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={fadeUp} whileHover={{ y: -4 }} className={`bg-white dark:bg-zinc-900 border border-border/50 rounded-2xl p-6 shadow-sm dark:shadow-slate-900/50 hover:shadow-lg dark:shadow-zinc-900/50 transition-shadow ${className}`}>
      {children}
    </motion.div>
  );
}

export function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <motion.div variants={fadeUp} whileHover={{ scale: 1.05 }} className="text-center p-6 bg-white dark:bg-zinc-900 border rounded-2xl shadow-sm dark:shadow-slate-900/50">
      <div className="text-3xl md:text-4xl font-black text-primary mb-1">{value}</div>
      <div className="text-sm text-muted-foreground font-medium">{label}</div>
    </motion.div>
  );
}

export function FAQ({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div variants={fadeUp} className="border border-border/50 rounded-xl overflow-hidden bg-white dark:bg-zinc-900">
      <button onClick={() => setOpen(!open)} className="w-full flex justify-between items-center p-5 text-left hover:bg-slate-50 dark:bg-zinc-800/50 transition-colors">
        <span className="font-bold text-foreground pr-4">{question}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-5 h-5 text-primary shrink-0" />
        </motion.span>
      </button>
      <motion.div initial={false} animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
        <p className="px-5 pb-5 text-muted-foreground leading-relaxed">{answer}</p>
      </motion.div>
    </motion.div>
  );
}

export function ValueCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <motion.div variants={fadeUp} whileHover={{ y: -4 }} className="bg-white dark:bg-zinc-900 border rounded-2xl p-6 shadow-sm dark:shadow-slate-900/50 hover:shadow-lg dark:shadow-zinc-900/50 transition-all group">
      <span className="text-3xl mb-3 block">{icon}</span>
      <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </motion.div>
  );
}

export function StepCard({ step, title, desc }: { step: string; title: string; desc: string }) {
  return (
    <motion.div variants={fadeUp} whileHover={{ scale: 1.03 }} className="text-center p-6 bg-white dark:bg-zinc-900 border rounded-2xl shadow-sm dark:shadow-slate-900/50">
      <div className="w-12 h-12 rounded-full bg-primary text-white font-black text-lg flex items-center justify-center mx-auto mb-4">{step}</div>
      <h3 className="font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </motion.div>
  );
}

export function LegalSection({ number, title, content }: { number: string; title: string; content: string }) {
  return (
    <motion.div variants={fadeUp} className="mb-8">
      <h3 className="text-lg font-bold text-foreground mb-2">{number}. {title}</h3>
      <p className="text-muted-foreground leading-relaxed">{content}</p>
    </motion.div>
  );
}

export function JobCard({ title, location, type, desc }: { title: string; location: string; type: string; desc: string }) {
  return (
    <motion.div variants={fadeUp} whileHover={{ y: -4 }} className="bg-white dark:bg-zinc-900 border rounded-2xl p-6 shadow-sm dark:shadow-slate-900/50 hover:shadow-lg dark:shadow-zinc-900/50 hover:border-primary/30 transition-all group">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{title}</h3>
        <div className="flex gap-2">
          <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">{type}</span>
          <span className="text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-full">{location}</span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{desc}</p>
      <button className="mt-4 text-sm font-bold text-primary hover:underline">Apply Now →</button>
    </motion.div>
  );
}
