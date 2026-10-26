'use client';

import { about, education, jobs, openSource, profile, projects, summary } from '../content/portfolio';
import { SparkField } from './SparkField';
import { timing } from '../agents/roster';
import { useSectionEffect } from './EffectsContext';
import { Tags } from './Tags';

function sectionClass(base: string, effect: string | null): string {
  return effect === null ? base : `${base} fx-${effect}`;
}

interface SectionHeadProps {
  readonly index: string;
  readonly title: string;
  readonly titleId: string;
  readonly aside?: string;
}

export function SectionHead({ index, title, titleId, aside }: SectionHeadProps) {
  return (
    <div className="section-head" data-reveal>
      <h2 id={titleId}>{title}</h2>
      <p className="label">
        {index}
        {aside ? ` — ${aside}` : ''}
      </p>
    </div>
  );
}

export function Projects() {
  const effect = useSectionEffect('projects');
  return (
    <section id="projects" className={sectionClass('section section--sparks', effect)} aria-labelledby="proj-title">
      <SparkField active={effect === 'sparks'} durationMs={timing.workMs} color="#FF5A1F" />
      <SectionHead index="02" title="Selected work" titleId="proj-title" aside="2024 to now" />
      <div className="cases">
        {projects.map((project, index) => (
          <article key={project.id} className={index === 1 ? 'tile tile--accent case' : 'tile tile--paper case'} data-reveal>
            <span className="chip">{project.tag}</span>
            <h3>{project.title}</h3>
            <p>{project.summary}</p>
            <Tags items={project.stack.split(' · ')} tone={index === 1 ? 'ink' : 'paper'} />
          </article>
        ))}
      </div>
      <div className="tile tile--paper oss" data-reveal>
        <h3 className="label">More on GitHub</h3>
        <ul>
          {openSource.map((project) => (
            <li key={project.id}>
              <span>
                <strong>{project.title}</strong> — {project.summary}
              </span>
              <span className="oss-links">
                {project.links?.map((link) => (
                  <a key={link.href} href={link.href} target="_blank" rel="noopener">
                    {link.label} ↗
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

export function Experience() {
  const effect = useSectionEffect('experience');
  return (
    <section id="experience" className={sectionClass('section', effect)} aria-labelledby="exp-title">
      <SectionHead index="03" title="Experience" titleId="exp-title" aside="6+ years, 5 roles" />
      <div className="tile tile--paper jobs" data-reveal>
        {jobs.map((job, index) => (
          <details key={`${job.org}-${job.period}`} className="job">
            <summary>
              <span className="label">{job.period}</span>
              <span className="job-head">
                <strong>{job.org}</strong>
                <span className="job-title">{job.title}</span>
              </span>
              {index === 0 ? <span className="filed">Current</span> : null}
              <span className="job-toggle" aria-hidden="true">
                +
              </span>
              <span className="job-summary">{job.summary}</span>
              <span className="job-tags">
                <Tags items={job.tags} />
              </span>
            </summary>
            <ul>
              {job.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </section>
  );
}

export function About() {
  const effect = useSectionEffect('about');
  return (
    <section id="about" className={sectionClass('section', effect)} aria-labelledby="about-title">
      <SectionHead index="04" title="Toolkit" titleId="about-title" aside="what I reach for" />
      <p className="statement" data-reveal>
        {summary}
      </p>
      <div className="skills">
        {about.skills.map((group) => (
          <div key={group.name} className="tile tile--paper skill-group" data-reveal>
            <h3 className="label">{group.name}</h3>
            <ul>
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Resume() {
  const effect = useSectionEffect('resume');
  return (
    <section id="resume" className={sectionClass('section', effect)} aria-labelledby="resume-title">
      <div className="resume tile tile--ink" data-reveal>
        <div className="resume-head">
          <div>
            <p className="label">05 — Resume</p>
            <h2 id="resume-title">The one-page version.</h2>
          </div>
          <div className="cta-row">
            <a className="btn btn-accent" href={profile.resumePdf} target="_blank" rel="noopener">
              Download PDF
            </a>
            <a className="btn btn-line-light" href={`mailto:${profile.email}`}>
              Email me
            </a>
          </div>
        </div>
        <div className="resume-grid">
          <div>
            <h3 className="label">Education</h3>
            <ul className="resume-list">
              {education.map((item) => (
                <li key={item.degree}>
                  <strong>{item.degree}</strong>
                  <span>
                    {item.school} · {item.period}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="label">Certification</h3>
            <ul className="resume-list">
              {about.certifications.map((item) => (
                <li key={item}>
                  <strong>{item}</strong>
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
      <div className="tile tile--accent contact" data-reveal>
        <p className="label">06 — Contact</p>
        <h2 id="contact-title">
          <a href={`mailto:${profile.email}`}>Let’s build it.</a>
        </h2>
        <div className="contact-row">
          <a href={`mailto:${profile.email}`}>{profile.email}</a>
          <a href={profile.phoneHref}>{profile.phone}</a>
          <a href={profile.linkedin} target="_blank" rel="noopener">
            LinkedIn ↗
          </a>
          <a href={profile.github} target="_blank" rel="noopener">
            GitHub ↗
          </a>
        </div>
      </div>
    </section>
  );
}
