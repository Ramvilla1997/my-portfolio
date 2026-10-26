'use client';

import { About, Contact, Experience, Projects, Resume } from './Sections';
import { EffectsProvider } from './EffectsContext';
import { Playground } from './Playground';
import { useReveal } from './useReveal';
import { about, profile } from '../content/portfolio';

const STATS = [
  { value: '6+', label: 'years in production' },
  { value: '2.1→1.3MB', label: 'frontend bundle' },
  { value: '10/50/100', label: '% staged feature rollouts' },
  { value: 'AWS', label: 'Certified Developer – Associate' },
] as const;

const MARQUEE = about.skills.flatMap((group) => group.items).slice(0, 20);

export function Site() {
  useReveal();
  return (
    <EffectsProvider>
      <div className="frame">
        <header className="nav">
          <a className="mark" href="#top">
            Ram Villa<span aria-hidden="true">●</span>
          </a>
          <nav aria-label="Primary">
            <ul className="nav-links">
              <li>
                <a href="#projects">Work</a>
              </li>
              <li>
                <a href="#experience">Experience</a>
              </li>
              <li>
                <a href="#workspace">Playground</a>
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
        </header>

        <main id="main">
          <section id="top" className="hero" aria-labelledby="hero-title">
            <div className="tile tile--paper hero-main enter" style={{ animationDelay: '0.05s' }}>
              <p className="label">Senior Full-Stack Engineer — {profile.location}</p>
              <h1 id="hero-title">
                Ram
                <br />
                Villa<span className="dot">.</span>
              </h1>
              <div className="hero-foot">
                <p className="hero-intro">{profile.intro}</p>
                <div className="cta-row">
                  <a className="btn btn-ink" href="#projects">
                    See the work
                  </a>
                  <a className="btn btn-line" href={profile.resumePdf} target="_blank" rel="noopener">
                    Resume PDF ↗
                  </a>
                </div>
              </div>
            </div>
            <div className="hero-side">
              <a className="tile tile--accent now enter" href="#experience" style={{ animationDelay: '0.15s' }}>
                <span className="label">Now</span>
                <span className="now-title">Senior Software Engineer at Ontario Health</span>
                <span className="now-arrow" aria-hidden="true">
                  ↘
                </span>
              </a>
              <div className="tile tile--ink metric enter" style={{ animationDelay: '0.25s' }}>
                <p className="metric-value">850→120ms</p>
                <p className="label">Provider-search latency with composite PostgreSQL indexes</p>
              </div>
            </div>
          </section>

          <dl className="stats">
            {STATS.map((stat, index) => (
              <div key={stat.label} className="tile tile--paper stat enter" style={{ animationDelay: `${0.3 + index * 0.06}s` }}>
                <dd>{stat.value}</dd>
                <dt className="label">{stat.label}</dt>
              </div>
            ))}
          </dl>

          <div className="marquee" aria-hidden="true">
            <div className="marquee-track">
              {[...MARQUEE, ...MARQUEE].map((item, index) => (
                <span key={`${item}-${index}`}>{item}</span>
              ))}
            </div>
          </div>

          <Playground />
          <Projects />
          <Experience />
          <About />
          <Resume />
          <Contact />
        </main>

        <footer className="footer">
          <span>© {new Date().getFullYear()} {profile.name}</span>
          <span>Built with Next.js · Hosted on Vercel</span>
        </footer>
      </div>
    </EffectsProvider>
  );
}
