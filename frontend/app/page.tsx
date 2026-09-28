"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Squircle } from "@squircle-js/react";
import { useAuthStore, backendRoleToUiRole } from "@/store/auth-store";
import { ROLE_HOME } from "@/constants/navigation";
import LandingNav from "@/components/shared/LandingNav";

const platformFeatures = [
 { title: "Campus network", detail: "Connect clubs, students, faculty, and campus teams in one shared university space." },
 { title: "Student access", detail: "Give learners one simple place to discover programs, communities, and opportunities." },
 { title: "Engagement records", detail: "Track participation, approvals, and campus activity through a clean digital workflow." },
];

const campusPrograms = [
 "Campus",
 "Clubs",
 "Access",
 "Programs",
];

export default function LandingPage() {
 // Auth state is consumed inside LandingNav; page only needs user for personalisation
 const user = useAuthStore((s) => s.user);
 const accessToken = useAuthStore((s) => s.accessToken);
 const initialized = useAuthStore((s) => s.initialized);
 const isLoggedIn = initialized && !!user && !!accessToken;
 const dashboardHref = "/student";

 return (
 <div className="min-h-screen relative overflow-x-hidden">
 <div className="blob-container">
 <div className="blob blob-1" />
 <div className="blob blob-2" />
 <div className="blob blob-3" />
 </div>

 <LandingNav />

 <main className="relative z-10">
 {/* Hero Section */}
 <section className="section-transparent min-h-screen flex items-center pt-8 pb-14 w-full max-w-full overflow-x-hidden">
 <div className="max-w-[1280px] mx-auto px-6 md:px-12 w-full">

 <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12 items-center">

 {/* B. Left — Hero copy + actions */}
 <motion.div
 initial={{ opacity: 0, y: 12 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.4, delay: 0.08 }}
 className="max-w-[620px]"
 >
 {/* Eyebrow label */}
 <div className="flex items-center gap-[10px] text-[0.68rem] tracking-[0.22em] uppercase text-[var(--col-dim)] mb-6 font-[family-name:var(--font-mono)]">
 <span className="inline-block w-5 h-px bg-[var(--accent)] flex-shrink-0" />
 Unite. Participate.Lead.
 </div>

 {/* Headline */}
 <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] text-[var(--col-primary)] font-[family-name:var(--font-display)] mb-6">
 PUVerse Campus Platform
 <br className="hidden sm:block" />
 <span className="block text-[0.6em] font-semibold tracking-[-0.01em] text-[var(--col-secondary)] mt-2 leading-snug font-[family-name:var(--font-display)]">
 The Single Hub for All Campus Events,
 <br className="hidden sm:block" /> Clubs &amp; Student Communities.
 </span>
 </h1>

 {/* Subtext */}
 <p className="text-[0.96rem] leading-[1.8] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] mb-8 max-w-[520px]">
 The official university ecosystem for event discovery, instant QR passes, club chapters, and student forums.
 </p>

 {/* CTA Buttons */}
 <div className="flex flex-col sm:flex-row gap-3 mb-9">
 <Link
 href="/explore-events"
 className="inline-flex items-center justify-center gap-2 text-[0.82rem] font-semibold px-6 py-[11px] rounded-full bg-[var(--col-primary)] text-[var(--bg)] transition-all duration-200 hover:opacity-85 active:scale-95 font-[family-name:var(--font-display)]"
 style={{ boxShadow: "0 2px 12px var(--shadow-lg)" }}
 >
  Explore Events
 </Link>
 <Link
 href="/student"
 className="inline-flex items-center justify-center gap-2 text-[0.82rem] font-semibold px-6 py-[11px] rounded-full border border-[hsl(0_0%_78%_/_0.6)] bg-[hsl(0_0%_96%_/_0.55)] text-[var(--col-primary)] transition-all duration-200 hover:bg-[hsl(0_0%_96%_/_0.85)] active:scale-95 font-[family-name:var(--font-display)]"
 >
 Login to Dashboard
 </Link>
 </div>

 {/* Tag pills */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-[480px]">
 {campusPrograms.map((item) => (
 <div key={item} className="rounded-full border border-[hsl(0_0%_85%_/_0.5)] px-4 py-2 text-center bg-[hsl(0_0%_96%_/_0.3)]">
 <span className="text-[0.68rem] uppercase tracking-[0.12em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">
 {item}
 </span>
 </div>
 ))}
 </div>
 </motion.div>

 {/* C. Right — Floating Ticket Card */}
 <motion.div
 initial={{ opacity: 0, y: 12 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.4, delay: 0.18 }}
 className="hidden lg:flex flex-col gap-4"
 >
 {/* Hero image card */}
 <Squircle
 cornerRadius={28}
 cornerSmoothing={1}
 className="relative overflow-hidden"
 style={{
 background: "linear-gradient(135deg, rgba(255,255,255,0.72), rgba(244,238,230,0.40))",
 backdropFilter: "blur(20px)",
 WebkitBackdropFilter: "blur(20px)",
 boxShadow: "0 2px 20px var(--shadow), inset 0 1px 0 var(--glow)",
 minHeight: "300px",
 }}
 >
 <img
 src="https://images.unsplash.com/photo-1523580846011-d3a5bcf09046?auto=format&fit=crop&w=1200&q=80"
 alt="PUVerse campus community"
 className="h-full w-full object-cover absolute inset-0"
 />
 <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,18,20,0.05),rgba(18,18,20,0.65))]" />
 <div className="absolute bottom-6 left-6 right-6 z-10">
 <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-white/70 font-[family-name:var(--font-mono)] mb-1">
 PUVerse Network
 </p>
 <p className="text-[1.3rem] font-bold text-white font-[family-name:var(--font-display)] leading-tight">
 Campus life, connected.
 </p>
 </div>
 </Squircle>

 {/* Event Ticket Card */}
 <Squircle
 cornerRadius={22}
 cornerSmoothing={1}
 className="p-5"
 style={{
 background: "hsl(0 0% 96% / 0.72)",
 backdropFilter: "blur(24px) saturate(1.4)",
 WebkitBackdropFilter: "blur(24px) saturate(1.4)",
 border: "1px solid hsl(25 65% 45% / 0.22)",
 boxShadow: "0 2px 16px var(--shadow), inset 0 1px 0 var(--glow)",
 }}
 >
 {/* Ticket header */}
 <div className="flex items-center justify-between mb-3">
 <span className="inline-flex items-center gap-1.5 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[var(--accent)] font-[family-name:var(--font-mono)]">
 Next Big Event
 </span>
 <span
 className="inline-flex items-center gap-1 text-[0.58rem] font-semibold px-2.5 py-1 rounded-full font-[family-name:var(--font-mono)]"
 style={{ background: "hsl(142 50% 45% / 0.1)", color: "hsl(142 50% 35%)", border: "1px solid hsl(142 50% 45% / 0.2)" }}
 >
 <span className="w-1.5 h-1.5 rounded-full bg-[hsl(142_50%_45%)]" />
 Open
 </span>
 </div>

 {/* Event name */}
 <p className="text-[0.92rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)] leading-snug mb-3">
 AWS Community Day 2026
 </p>

 {/* Meta row */}
 <div className="flex flex-col gap-1.5 mb-4">
 <span className="flex items-center gap-2 text-[0.72rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
  Oct 1, 2026
 </span>
 <span className="flex items-center gap-2 text-[0.72rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
  Seminar Hall 2
 </span>
 <span className="flex items-center gap-2 text-[0.72rem] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
 <span>🟢</span> 120 Seats Left
 </span>
 </div>

 {/* Dashed separator */}
 <div
 className="h-px mb-4"
 style={{ backgroundImage: "repeating-linear-gradient(90deg, hsl(0 0% 75% / 0.5) 0px, hsl(0 0% 75% / 0.5) 5px, transparent 5px, transparent 10px)" }}
 />

 {/* CTA */}
 <Link
 href="/explore-events"
 className="w-full inline-flex items-center justify-center gap-2 text-[0.76rem] font-semibold py-2.5 rounded-[12px] bg-[var(--col-primary)] text-[var(--bg)] transition-all duration-200 hover:opacity-85 active:scale-95 font-[family-name:var(--font-display)]"
 >
 Register Now →
 </Link>
 </Squircle>
 </motion.div>
 </div>
 </div>
 </section>

 {/* Section 2: Metrics & Impact Bar */}
 <motion.section
 id="metrics"
 initial={{ opacity: 0, y: 12 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true, margin: "-60px" }}
 transition={{ duration: 0.4 }}
 className="relative z-10 w-full max-w-full overflow-x-hidden border-t border-b border-[hsl(0_0%_85%_/_0.45)] bg-[hsl(0_0%_96%_/_0.38)] backdrop-blur-sm"
 >
 <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-10">
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-0">
 {[
 { value: "50+", label: "Active Clubs", live: false },
 { value: "10,000+", label: "Registrations", live: true },
 { value: "100+", label: "Campus Events", live: false },
 { value: "99%", label: "Instant Gate Check-in Speed", live: true },
 ].map((metric, i) => (
 <div
 key={metric.label}
 className={[
 "flex flex-col items-center justify-center text-center px-6 py-7",
 "rounded-[22px] md:rounded-none",
 "border border-[hsl(0_0%_85%_/_0.5)] md:border-0",
 "md:border-r md:border-[hsl(0_0%_85%_/_0.45)] last:border-r-0",
 "bg-[hsl(0_0%_96%_/_0.42)] md:bg-transparent",
 "hover:-translate-y-0.5 transition-transform duration-200",
 ].join(" ")}
 >
 {/* Value */}
 <span className="text-2xl sm:text-4xl font-extrabold tracking-[-0.03em] text-[var(--col-primary)] font-[family-name:var(--font-mono)] tabular-nums leading-none mb-2">
 {metric.value}
 </span>

 {/* Label + live indicator */}
 <span className="flex items-center justify-center gap-1.5 text-xs sm:text-sm text-[var(--col-secondary)] font-[family-name:var(--font-ui)] leading-snug text-center">
 {metric.live && (
 <span className="relative flex-shrink-0 w-2 h-2">
 {/* Pulsing ring */}
 <span className="absolute inset-0 rounded-full bg-[hsl(142_50%_45%_/_0.35)] animate-ping" />
 <span className="relative block w-2 h-2 rounded-full bg-[hsl(142_50%_42%)]" />
 </span>
 )}
 {metric.label}
 </span>
 </div>
 ))}
 </div>
 </div>
 </motion.section>

 <section id="platform" className="relative z-10 py-14 border-t border-[hsl(0_0%_85%_/_0.45)]">
 <div className="max-w-[1280px] mx-auto px-6 md:px-12">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
 {platformFeatures.map((feature, index) => (
 <div key={feature.title} className="rounded-[28px] border border-[hsl(0_0%_85%_/_0.5)] bg-[hsl(0_0%_96%_/_0.42)] p-7 backdrop-blur-sm">
 <div className="flex items-center justify-between mb-5">
 <span className="w-9 h-9 rounded-full border border-[var(--accent)] flex items-center justify-center text-[var(--accent)] font-[family-name:var(--font-display)]">
 0{index + 1}
 </span>
 <span className="w-14 h-px bg-[var(--accent)]" />
 </div>
 <h3 className="text-[1.2rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)] mb-3">
 {feature.title}
 </h3>
 <p className="text-[0.84rem] leading-[1.7] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
 {feature.detail}
 </p>
 </div>
 ))}
 </div>
 </div>
 </section>

 <section id="how-it-works" className="relative z-10 py-14">
 <div className="max-w-[1280px] mx-auto px-6 md:px-12">
 <div className="flex flex-col md:flex-row items-end justify-between gap-6">
 <div>
 <p className="text-[0.68rem] tracking-[0.22em] uppercase text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-3">
 How PUVerse works
 </p>
 <h2 className="text-[clamp(2rem,3vw,2.8rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--col-primary)] font-[family-name:var(--font-display)]">
 One digital campus rhythm.
 </h2>
 </div>
 <Link href="/register" className="text-[0.78rem] font-medium px-[22px] py-[10px] rounded-full border border-[hsl(0_0%_85%_/_0.55)] text-[var(--col-primary)] hover:bg-[hsl(0_0%_96%_/_0.8)] transition-all duration-300 font-[family-name:var(--font-display)]">
 Join PUVerse
 </Link>
 </div>

 <div className="mt-9 grid grid-cols-1 md:grid-cols-3 gap-5">
 {[
 ["01", "Create a community", "Campus groups publish opportunities and maintain a shared university presence.", "#"],
 ["02", "Open access", "Students discover programs, activities, and resources through one connected platform.", "#"],
 ["03", "Manage engagement", "Faculty and administrators coordinate records, participation, and communication.", "#"],
 ].map(([step, title, text, href]) => (
 <div key={step} className="rounded-[24px] border border-[hsl(0_0%_85%_/_0.5)] bg-[hsl(0_0%_96%_/_0.25)] p-7">
 <div className="flex items-center gap-3 mb-5">
 <span className="text-[0.72rem] font-bold tracking-[0.22em] text-[var(--accent)] font-[family-name:var(--font-mono)]">{step}</span>
 <span className="w-12 h-px bg-[var(--line)]" />
 </div>
 <h3 className="text-[1rem] font-bold text-[var(--col-primary)] font-[family-name:var(--font-display)] mb-3">
 {title}
 </h3>
 <p className="text-[0.84rem] leading-[1.7] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
 {text}
 </p>
 </div>
 ))}
 </div>
 </div>
 </section>

 <footer id="about" className="relative z-10 border-t border-[hsl(0_0%_85%_/_0.45)] bg-[hsl(0_0%_96%_/_0.45)]">
 <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-12">
 <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
 <div>
 <Link href="/" className="flex items-center gap-[7px]">
 <div className="w-[7px] h-[7px] rounded-full bg-[var(--accent)] flex-shrink-0 shadow-[0_1px_4px_var(--shadow-lg)]" />
 <div className="text-[1.1rem] leading-none">
 <span className="font-extrabold text-[var(--col-primary)] tracking-[-0.02em] font-[family-name:var(--font-display)]">
 PU
 </span>
 <span className="font-normal text-[var(--col-secondary)] font-[family-name:var(--font-cursive)]">
 verse
 </span>
 </div>
 </Link>
 <p className="mt-4 text-[0.82rem] leading-[1.7] text-[var(--col-secondary)] font-[family-name:var(--font-ui)]">
 A university engagement platform built to connect people, programs, and campus life.
 </p>
 </div>
 <div>
 <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-4">
 Platform
 </p>
 <ul className="space-y-3 text-[0.82rem] text-[var(--col-secondary)]">
 <li><Link href="#platform">Campus</Link></li>
 <li><Link href="#how-it-works">Programs</Link></li>
 <li><Link href="#about">Access</Link></li>
 </ul>
 </div>
 <div>
 <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-4">
 University
 </p>
 <ul className="space-y-3 text-[0.82rem] text-[var(--col-secondary)]">
 <li><Link href="#about">About PUVerse</Link></li>
 <li><Link href="#contact">Contact</Link></li>
 <li><Link href="/login">Login</Link></li>
 </ul>
 </div>
 <div id="contact">
 <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[var(--col-dim)] font-[family-name:var(--font-mono)] mb-4">
 Connect
 </p>
 <div className="flex items-center gap-3">
 <a href="mailto:hello@puverse.edu" className="text-[0.82rem] text-[var(--col-secondary)] hover:text-[var(--col-primary)]">
 hello@puverse.edu
 </a>
 </div>
 </div>
 </div>
 <div className="mt-10 pt-6 border-t border-[hsl(0_0%_85%_/_0.45)] flex flex-col sm:flex-row justify-between gap-4 text-[0.76rem] text-[var(--col-dim)] font-[family-name:var(--font-ui)]">
 <span>© 2026 PUVerse. All rights reserved.</span>
 <span>Privacy · Terms · Campus Access</span>
 </div>
 </div>
 </footer>
 </main>
 </div>
 );
}
