"use client";

import Link from "next/link";
import { Squircle } from "@squircle-js/react";
import { useAuthStore, backendRoleToUiRole } from "@/store/auth-store";
import { ROLE_HOME } from "@/constants/navigation";

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
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const initialized = useAuthStore((s) => s.initialized);
  const isLoggedIn = initialized && !!user && !!accessToken;
  const dashboardHref = user ? ROLE_HOME[backendRoleToUiRole(user)] : "/student";

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <div className="blob-container">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <nav className="fixed top-0 left-0 right-0 z-[200]">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between h-16 px-6 md:px-12">
          <Link href="/" className="flex items-center gap-[7px] z-[201]">
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

          <Squircle
            cornerRadius={16}
            cornerSmoothing={1}
            className="hidden md:flex items-center gap-7 border border-[hsl(0_0%_78%_/_0.7)] px-7 py-[10px]"
            style={{
              background: "hsl(0 0% 96% / 0.55)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              boxShadow: "0 2px 16px var(--shadow), inset 0 1px 0 var(--glow)",
            }}
          >
            {[
              { label: "Explore Events", href: "/explore-events" },
              { label: "How it works", href: "#how-it-works" },
              { label: "About", href: "#about" },
              { label: "Contact", href: "#contact" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-[0.8rem] text-[var(--col-secondary)] font-normal cursor-pointer transition-colors duration-300 hover:text-[var(--col-primary)] font-[family-name:var(--font-ui)]"
              >
                {item.label}
              </Link>
            ))}
          </Squircle>

          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-4">
            {isLoggedIn ? (
              <Link
                href={dashboardHref}
                className="text-[0.8rem] font-medium px-[22px] py-[9px] rounded-full bg-[var(--col-primary)] text-[var(--bg)] transition-all duration-300 shadow-[0_2px_12px_var(--shadow-lg)] hover:opacity-80 hover:scale-[1.02] active:scale-[0.98] font-[family-name:var(--font-display)]"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="text-[0.8rem] text-[var(--col-secondary)] font-medium transition-colors duration-300 hover:text-[var(--col-primary)] font-[family-name:var(--font-display)]"
                >
                  Register
                </Link>
                <Link
                  href="/login"
                  className="text-[0.8rem] font-medium px-[22px] py-[9px] rounded-full bg-[var(--col-primary)] text-[var(--bg)] transition-all duration-300 shadow-[0_2px_12px_var(--shadow-lg)] hover:opacity-80 hover:scale-[1.02] active:scale-[0.98] font-[family-name:var(--font-display)]"
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        <section className="section-transparent min-h-screen flex items-center pt-24 pb-14">
          <div className="max-w-[1280px] mx-auto px-6 md:px-12 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-12 items-center">
              <div className="max-w-[620px]">
                <div className="flex items-center gap-[10px] text-[0.68rem] tracking-[0.22em] uppercase text-[var(--col-dim)] mb-5 font-[family-name:var(--font-mono)]">
                  <span className="inline-block w-5 h-px bg-[var(--accent)] flex-shrink-0" />
                  PUVerse Campus Platform
                </div>

                <div className="mb-5">
                  <h1 className="text-[clamp(3rem,5vw,4rem)] font-bold tracking-[-0.03em] leading-[1.03] text-[var(--col-primary)] font-[family-name:var(--font-display)]">
                    PUVerse <br className="hidden md:block" />for campus life.
                  </h1>
                </div>

                <p className="text-[1rem] leading-[1.8] max-w-[620px] text-[var(--col-secondary)] font-[family-name:var(--font-ui)] mb-8">
                  PUVerse is a university engagement platform that connects students, clubs, faculty, and campus teams through one digital space for programs, access, community, and participation.
                </p>

                <div className="flex flex-wrap items-center gap-3 mb-9">
                  <Link
                    href="#platform"
                    className="text-[0.78rem] font-medium px-[22px] py-[10px] rounded-full bg-[var(--col-primary)] text-[var(--bg)] transition-all duration-300 shadow-[0_2px_12px_var(--shadow-lg)] hover:opacity-80 hover:scale-[1.02] active:scale-[0.98] font-[family-name:var(--font-display)]"
                  >
                    Explore platform
                  </Link>
                  <Link
                    href="#how-it-works"
                    className="text-[0.78rem] font-medium px-[22px] py-[10px] rounded-full bg-[hsl(0_0%_96%_/_0.55)] text-[var(--col-primary)] transition-all duration-300 hover:bg-[hsl(0_0%_96%_/_0.8)] font-[family-name:var(--font-display)] border border-[hsl(0_0%_85%_/_0.5)]"
                  >
                    How it works
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-[560px]">
                  {campusPrograms.map((item) => (
                    <div key={item} className="rounded-full border border-[hsl(0_0%_85%_/_0.5)] px-4 py-2 text-center bg-[hsl(0_0%_96%_/_0.3)]">
                      <span className="text-[0.7rem] uppercase tracking-[0.12em] text-[var(--col-dim)] font-[family-name:var(--font-mono)]">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="hidden lg:block">
                <Squircle
                  cornerRadius={34}
                  cornerSmoothing={1.0}
                  className="relative overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.74), rgba(244,238,230,0.42))",
                    WebkitBackdropFilter: "blur(20px)",
                    backdropFilter: "blur(20px)",
                    boxShadow: "0 2px 20px var(--shadow), inset 0 1px 0 var(--glow)",
                    padding: "0",
                    minHeight: "460px",
                    transition: "all 0.6s ease",
                  }}
                >
                  <div className="absolute inset-0">
                    <img
                      src="https://images.unsplash.com/photo-1523580846011-d3a5bcf09046?auto=format&fit=crop&w=1800&q=80"
                      alt="PUVerse campus community"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,18,20,0.08),rgba(18,18,20,0.72))]" />
                  </div>

                  <div className="absolute top-8 left-8 right-8 flex items-center justify-between z-10">
                    <span className="inline-block px-4 py-2 rounded-full border border-white/70 bg-black/20 text-[0.68rem] font-semibold tracking-[0.18em] uppercase text-white backdrop-blur-sm">
                      PUVerse
                    </span>
                    <span className="rounded-full border border-white/70 bg-white/90 px-4 py-2 text-[0.68rem] font-semibold tracking-[0.14em] uppercase text-[var(--col-primary)] backdrop-blur-sm">
                      Campus OS
                    </span>
                  </div>

                  <div className="absolute bottom-8 left-8 right-8 z-10 text-white">
                    <div className="mb-4 flex items-center gap-2">
                      <span className="w-7 h-px bg-[var(--accent)]" />
                      <span className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/80 font-[family-name:var(--font-mono)]">
                        PUVerse Network
                      </span>
                    </div>

                    <h2 className="text-[clamp(2rem,3vw,2.8rem)] font-bold leading-[1.2] tracking-[-0.03em] text-white font-[family-name:var(--font-display)]">
                      Campus life, connected.
                    </h2>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <span className="inline-flex items-center rounded-full border border-white/70 bg-white/12 px-4 py-2 text-[0.7rem] font-medium uppercase tracking-[0.12em] text-white backdrop-blur-sm">
                        Campus
                      </span>
                      <span className="inline-flex items-center rounded-full border border-white/70 bg-white/12 px-4 py-2 text-[0.7rem] font-medium uppercase tracking-[0.12em] text-white backdrop-blur-sm">
                        Access
                      </span>
                      <span className="inline-flex items-center rounded-full border border-white/70 bg-white/12 px-4 py-2 text-[0.7rem] font-medium uppercase tracking-[0.12em] text-white backdrop-blur-sm">
                        Programs
                      </span>
                    </div>
                  </div>
                </Squircle>
              </div>
            </div>
          </div>
        </section>

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
