'use client';

import { About, Contact, Experience, Projects, Resume } from './Sections';
import { EffectsProvider } from './EffectsContext';
import { Playground } from './Playground';
import { useReveal } from './useReveal';
import { capabilities, domains, profile } from '../content/portfolio';
import { Tags } from './Tags';

const MARQUEE = [
  'Full-stack architecture',
  'Serverless AWS',
  'LLM & RAG systems',
  'Agentic developer tooling',
  'Accessibility by default',
  'Healthcare data (PHIPA, FHIR)',
  'Release engineering',
  'Frontend migrations',
];

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
              <div className="tile tile--ink domain enter" style={{ animationDelay: '0.25s' }}>
                <p className="label">Domains</p>
                <p className="domain-title">{domains.title}</p>
                <p className="domain-text">{domains.summary}</p>
                <Tags items={domains.tags} tone="ink" />
              </div>
            </div>
          </section>

          <section className="capabilities" aria-label="Capabilities">
            {capabilities.map((capability, index) => (
              <article key={capability.title} className="tile tile--paper capability enter" style={{ animationDelay: `${0.3 + index * 0.06}s` }}>
                <p className="label">{String(index + 1).padStart(2, '0')}</p>
                <h2>{capability.title}</h2>
                <p className="capability-text">{capability.summary}</p>
                <Tags items={capability.tags} />
              </article>
            ))}
          </section>

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
