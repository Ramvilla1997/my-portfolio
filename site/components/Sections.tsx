'use client';

import { about, education, jobs, openSource, profile, projects } from '../content/portfolio';
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
                <h3>{job.title}</h3>
                <p className="job-org">{job.org}</p>
                <ul>
                  {job.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
              {index === 0 ? (
                <span className="filed" style={{ animationDelay: '0.2s' }}>
                  Current
                </span>
              ) : null}
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
      <SparkField active={effect === 'sparks'} durationMs={timing.workMs} color="#FFB547" />
      <div className="wrap">
        <p className="eyebrow">Projects</p>
        <h2 id="proj-title">Things I’ve built.</h2>
        <div className="cards">
          {projects.map((project) => (
            <article key={project.id} className="card">
              <div className="card-body">
                <p className="tag">{project.tag}</p>
                <h3>{project.title}</h3>
                <p>{project.summary}</p>
                <p className="stack">{project.stack}</p>
                {project.status === 'in-progress' ? <span className="badge">In progress</span> : null}
              </div>
            </article>
          ))}
        </div>

        <h3 className="subhead">More on GitHub</h3>
        <ul className="oss">
          {openSource.map((project) => (
            <li key={project.id} className="oss-item">
              <span>
                <strong>{project.title}</strong> · {project.summary}
              </span>
              <span className="links">
                {project.links?.map((link) => (
                  <a key={link.href} href={link.href} target="_blank" rel="noopener">
                    {link.label}
                  </a>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Resume() {
  const effect = useSectionEffect('resume');
  return (
    <section id="resume" className={sectionClass('section', effect)} aria-labelledby="resume-title">
      <div className="wrap">
        <div className="resume-head">
          <div>
            <p className="eyebrow">Resume</p>
            <h2 id="resume-title">Ram Villa</h2>
            <p className="resume-role">
              {profile.title} · {profile.location}
            </p>
          </div>
          <div className="resume-actions">
            <a className="btn btn-primary" href={profile.resumePdf} target="_blank" rel="noopener">
              Download PDF
            </a>
            <a className="btn" href={`mailto:${profile.email}`}>
              Email me
            </a>
          </div>
        </div>

        <div className="resume-grid">
          <div>
            <h3 className="subhead">Experience</h3>
            <ol className="resume-list">
              {jobs.map((job) => (
                <li key={`${job.org}-${job.period}`}>
                  <p className="resume-line">
                    <strong>{job.title}</strong>, {job.org}
                  </p>
                  <p className="resume-period">
                    {job.period} · {job.place}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <h3 className="subhead">Education</h3>
            <ul className="resume-list">
              {education.map((item) => (
                <li key={item.degree}>
                  <p className="resume-line">
                    <strong>{item.degree}</strong>
                  </p>
                  <p className="resume-period">
                    {item.school} · {item.period}
                  </p>
                </li>
              ))}
            </ul>

            <h3 className="subhead">Certifications</h3>
            <ul className="resume-list">
              {about.certifications.map((item) => (
                <li key={item}>
                  <p className="resume-line">{item}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
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
        <p className="lede">
          {profile.email} · {profile.phone}
        </p>
        <div className="cta-row">
          <a className="btn" href={profile.linkedin} target="_blank" rel="noopener">
            LinkedIn
          </a>
          <a className="btn" href={profile.github} target="_blank" rel="noopener">
            GitHub
          </a>
          <a className="btn" href={profile.phoneHref}>
            Call
          </a>
        </div>
      </div>
    </section>
  );
}
