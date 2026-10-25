'use client';

import { About, Contact, Experience, Projects, Resume } from './Sections';
import { EffectsProvider } from './EffectsContext';
import { Workspace } from './Workspace';
import { profile } from '../content/portfolio';

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
                <a href="#workspace">Workspace</a>
              </li>
              <li>
                <a href="#about">About</a>
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
          <div className="wrap">
            <p className="eyebrow">{profile.eyebrow}</p>
            <h1>{profile.name}</h1>
            <p className="lede">{profile.intro}</p>
            <div className="cta-row">
              <a className="btn btn-primary" href="#workspace">
                Meet the agents
              </a>
              <a className="btn" href="#projects">
                See my work
              </a>
              <a className="btn" href="#resume">
                Request resume
              </a>
            </div>
          </div>
        </section>

        <Workspace />
        <About />
        <Experience />
        <Projects />
        <Resume />
        <Contact />
      </main>

      <footer className="footer">
        <div className="wrap">© 2026 {profile.name}</div>
      </footer>
    </EffectsProvider>
  );
}
