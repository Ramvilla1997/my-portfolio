'use client';

import { About, Contact, Experience, Projects, Resume } from './Sections';
import { EffectsProvider } from './EffectsContext';
import { Playground } from './Playground';
import { useReveal } from './useReveal';
import { about, profile } from '../content/portfolio';

const HERO_STATS = [
  { value: '6+', label: 'Years in production' },
  { value: '850→120ms', label: 'Provider search latency' },
  { value: '2.1→1.3MB', label: 'Frontend bundle' },
  { value: 'AWS', label: 'Certified Developer' },
] as const;

const MARQUEE = about.skills.flatMap((group) => group.items).slice(0, 24);

export function Site() {
  useReveal();
  return (
    <EffectsProvider>
      <header className="nav">
        <div className="wrap nav-inner">
          <a className="mark" href="#top">
            RV<span>.</span>
          </a>
          <nav aria-label="Primary">
            <ul className="nav-links">
              <li>
                <a href="#workspace">Playground</a>
              </li>
              <li>
                <a href="#experience">Experience</a>
              </li>
              <li>
                <a href="#projects">Work</a>
              </li>
              <li>
                <a href="#resume">Resume</a>
              </li>
              <li>
                <a className="nav-cta" href="#contact">
                  Let’s talk
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main id="main">
        <section id="top" className="hero">
          <div className="hero-art" aria-hidden="true">
            <img src="/assets/img/hero.webp" alt="" width={1376} height={768} fetchPriority="high" />
          </div>
          <div className="hero-backdrop" aria-hidden="true" />
          <div className="wrap hero-inner">
            <p className="kicker reveal" style={{ animationDelay: '0.05s' }}>
              <span className="pulse" aria-hidden="true" /> Currently at Ontario Health · {profile.location}
            </p>
            <h1 className="hero-title">
              <span className="line reveal" style={{ animationDelay: '0.12s' }}>
                Ram
              </span>
              <span className="line line--outline reveal" style={{ animationDelay: '0.22s' }}>
                Villa
              </span>
            </h1>
            <p className="hero-role reveal" style={{ animationDelay: '0.32s' }}>
              {profile.title}
            </p>
            <p className="lede reveal" style={{ animationDelay: '0.4s' }}>
              {profile.intro}
            </p>
            <div className="cta-row reveal" style={{ animationDelay: '0.5s' }}>
              <a className="btn btn-primary" href="#workspace">
                Ask the office
              </a>
              <a className="btn" href="#projects">
                See the work
              </a>
              <a className="btn btn-ghost" href={profile.resumePdf} target="_blank" rel="noopener">
                Resume PDF ↗
              </a>
            </div>
          </div>
          <div className="wrap">
            <dl className="stats reveal" style={{ animationDelay: '0.65s' }}>
              {HERO_STATS.map((stat) => (
                <div key={stat.label} className="stat">
                  <dd>{stat.value}</dd>
                  <dt>{stat.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <div className="marquee" aria-hidden="true">
          <div className="marquee-track">
            {[...MARQUEE, ...MARQUEE].map((item, index) => (
              <span key={`${item}-${index}`}>{item}</span>
            ))}
          </div>
        </div>

        <Playground />
        <About />
        <Experience />
        <Projects />
        <Resume />
        <Contact />
      </main>

      <footer className="footer">
        <div className="wrap footer-inner">
          <span>© {new Date().getFullYear()} {profile.name}</span>
          <span>Designed and built by Ram · Next.js on Vercel</span>
        </div>
      </footer>
    </EffectsProvider>
  );
}
