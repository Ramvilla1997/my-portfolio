'use client';

import { About, Contact, Experience, Projects, Resume } from './Sections';
import { EffectsProvider } from './EffectsContext';
import { Playground } from './Playground';
import { profile } from '../content/portfolio';

const HERO_STATS = [
  { value: '6+', label: 'years in production' },
  { value: '850 → 120 ms', label: 'provider search latency' },
  { value: '2.1 → 1.3 MB', label: 'frontend bundle' },
  { value: 'AWS', label: 'Certified Developer' },
] as const;

export function Site() {
  return (
    <EffectsProvider>
      <header className="nav">
        <div className="wrap nav-inner">
          <a className="mark" href="#top">
            {profile.name}
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
                <a href="#projects">Projects</a>
              </li>
              <li>
                <a href="#resume">Resume</a>
              </li>
              <li>
                <a href="#contact">Contact</a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main id="main">
        <section id="top" className="hero">
          <div className="hero-backdrop" aria-hidden="true" />
          <div className="wrap hero-inner">
            <p className="eyebrow reveal" style={{ animationDelay: '0.05s' }}>
              {profile.eyebrow}
            </p>
            <h1 className="hero-title">
              <span className="reveal" style={{ animationDelay: '0.15s' }}>
                Ram Villa
              </span>
            </h1>
            <p className="lede reveal" style={{ animationDelay: '0.3s' }}>
              {profile.intro}
            </p>
            <div className="cta-row reveal" style={{ animationDelay: '0.45s' }}>
              <a className="btn btn-primary" href="#workspace">
                Ask the office
              </a>
              <a className="btn" href="#projects">
                See projects
              </a>
              <a className="btn btn-ghost" href={profile.resumePdf} target="_blank" rel="noopener">
                Download resume (PDF)
              </a>
            </div>
            <dl className="stats reveal" style={{ animationDelay: '0.6s' }}>
              {HERO_STATS.map((stat) => (
                <div key={stat.label} className="stat">
                  <dt>{stat.label}</dt>
                  <dd>{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

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
          <span>{profile.location}</span>
        </div>
      </footer>
    </EffectsProvider>
  );
}
