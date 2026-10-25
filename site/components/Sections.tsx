'use client';

import { about, jobs, profile, projects } from '../content/portfolio';
import { SparkField } from './SparkField';
import { timing } from '../agents/roster';
import { useSectionEffect } from './EffectsContext';

function sectionClass(base: string, effect: string | null): string {
  return effect === null ? base : `${base} fx-${effect}`;
}

export function About() {
  const effect = useSectionEffect('about');
  return (
    <section id="about" className={sectionClass('section', effect)} aria-labelledby="about-title">
      <div className="wrap">
        <p className="eyebrow">About</p>
        <h2 id="about-title">Built to ship, built to last.</h2>
        <p className="prose">{about.summary}</p>
        <div className="skills">
          {about.skills.map((group) => (
            <div key={group.name} className="skill-group">
              <h3>{group.name}</h3>
              <ul>
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Experience() {
  const effect = useSectionEffect('experience');
  return (
    <section id="experience" className={sectionClass('section', effect)} aria-labelledby="exp-title">
      <div className="wrap">
        <p className="eyebrow">Experience</p>
        <h2 id="exp-title">Where I’ve shipped.</h2>
        <ol className="jobs">
          {jobs.map((job, index) => (
            <li key={`${job.org}-${job.period}`} className="job">
              <div className="job-meta">
                <span>{job.period}</span>
                <span>{job.place}</span>
              </div>
              <div>
                <h3>
                  {job.title} <span className="org">· {job.org}</span>
                </h3>
                <ul>
                  {job.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
              <span className="filed" style={{ animationDelay: `${index * 0.25}s` }}>
                Filed
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Projects() {
  const effect = useSectionEffect('projects');
  return (
    <section id="projects" className={sectionClass('section section--sparks', effect)} aria-labelledby="proj-title">
      <SparkField active={effect === 'sparks'} durationMs={timing.workMs} color="#a8691b" />
      <div className="wrap">
        <p className="eyebrow">Projects</p>
        <h2 id="proj-title">Things I’ve built.</h2>
        <div className="cards">
          {projects.map((project) => (
            <article key={project.id} className={project.image ? 'card card--featured' : 'card'}>
              {project.image ? (
                <img src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/${project.image}`} alt={`${project.title} screenshot`} width={1280} height={800} loading="lazy" />
              ) : null}
              <div className="card-body">
                <p className="tag">{project.tag}</p>
                <h3>{project.title}</h3>
                <p>{project.summary}</p>
                <p className="stack">{project.stack}</p>
                <p className="links">
                  {project.liveUrl ? <a href={project.liveUrl} target="_blank" rel="noopener">Open the demo</a> : null}
                  {project.codeUrl ? <a href={project.codeUrl} target="_blank" rel="noopener">Code</a> : null}
                  {project.inProgress ? <span className="badge">In progress</span> : null}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Resume() {
  const effect = useSectionEffect('resume');
  return (
    <section id="resume" className={sectionClass('section', effect)} aria-labelledby="resume-title">
      <div className="wrap narrow">
        <p className="eyebrow">Resume</p>
        <h2 id="resume-title">Resume, on request.</h2>
        <p className="prose">Tell me who you are and why you’re asking, and I’ll send it back personally.</p>
        <form className="request" action={`mailto:${profile.email}`} method="post" encType="text/plain">
          <div className="field">
            <label htmlFor="r-name">Your name</label>
            <input id="r-name" name="name" required autoComplete="name" />
          </div>
          <div className="field">
            <label htmlFor="r-org">Company or project</label>
            <input id="r-org" name="company" required autoComplete="organization" />
          </div>
          <div className="field">
            <label htmlFor="r-why">Why you’re asking</label>
            <textarea id="r-why" name="reason" rows={3} required />
          </div>
          <button className="btn btn-primary" type="submit">
            Send request
          </button>
        </form>
      </div>
    </section>
  );
}

export function Contact() {
  return (
    <section id="contact" className="section" aria-labelledby="contact-title">
      <div className="wrap">
        <p className="eyebrow">Contact</p>
        <h2 id="contact-title">
          <a href={`mailto:${profile.email}`}>Let’s build it.</a>
        </h2>
        <div className="cta-row">
          <a className="btn" href={profile.linkedin} target="_blank" rel="noopener">
            LinkedIn
          </a>
          <a className="btn" href={profile.github} target="_blank" rel="noopener">
            GitHub
          </a>
          <a className="btn" href={profile.phoneHref}>
            {profile.phone}
          </a>
        </div>
      </div>
    </section>
  );
}
