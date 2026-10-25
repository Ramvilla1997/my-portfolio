'use client';

import { about, education, jobs, openSource, profile, projects, summary, type Project } from '../content/portfolio';
import { SparkField } from './SparkField';
import { timing } from '../agents/roster';
import { useSectionEffect } from './EffectsContext';

function sectionClass(base: string, effect: string | null): string {
  return effect === null ? base : `${base} fx-${effect}`;
}

interface SectionHeadProps {
  readonly index: string;
  readonly label: string;
  readonly title: string;
  readonly titleId: string;
}

export function SectionHead({ index, label, title, titleId }: SectionHeadProps) {
  return (
    <div className="section-head" data-reveal>
      <p className="section-index">
        <span>{index}</span> {label}
      </p>
      <h2 id={titleId}>{title}</h2>
    </div>
  );
}

export function About() {
  const effect = useSectionEffect('about');
  return (
    <section id="about" className={sectionClass('section', effect)} aria-labelledby="about-title">
      <div className="wrap">
        <SectionHead index="02" label="About" title="Built to ship. Built to last." titleId="about-title" />
        <p className="statement" data-reveal>
          {about.summary}
        </p>
        <p className="prose" data-reveal>
          {summary}
        </p>
        <div className="skills">
          {about.skills.map((group, index) => (
            <div key={group.name} className="skill-group" data-reveal style={{ transitionDelay: `${index * 60}ms` }}>
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
        <SectionHead index="03" label="Experience" title="Where I’ve shipped." titleId="exp-title" />
        <ol className="jobs">
          {jobs.map((job, index) => (
            <li key={`${job.org}-${job.period}`} className="job" data-reveal>
              <div className="job-meta">
                <span className="job-period">{job.period}</span>
                <span>{job.place}</span>
              </div>
              <div>
                <h3>{job.org}</h3>
                <p className="job-org">{job.title}</p>
                <ul>
                  {job.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
              {index === 0 ? <span className="filed">Current</span> : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function ProjectCard({ project, index }: { readonly project: Project; readonly index: number }) {
  return (
    <article className={index === 0 ? 'case case--feature' : 'case'} data-reveal>
      {project.image ? (
        <div className="case-media">
          <img src={project.image} alt="" width={1264} height={848} loading="lazy" />
        </div>
      ) : null}
      <div className="case-body">
        <p className="case-meta">
          <span>{String(index + 1).padStart(2, '0')}</span>
          <span>{project.tag}</span>
        </p>
        <h3>{project.title}</h3>
        <p>{project.summary}</p>
        <p className="stack">{project.stack}</p>
        {project.status === 'in-progress' ? <span className="badge">In progress</span> : null}
      </div>
    </article>
  );
}

export function Projects() {
  const effect = useSectionEffect('projects');
  return (
    <section id="projects" className={sectionClass('section section--sparks', effect)} aria-labelledby="proj-title">
      <SparkField active={effect === 'sparks'} durationMs={timing.workMs} color="#FFB547" />
      <div className="wrap">
        <SectionHead index="04" label="Selected work" title="Things I’ve built." titleId="proj-title" />
        <div className="cases">
          {projects.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>

        <h3 className="subhead">More on GitHub</h3>
        <ul className="oss">
          {openSource.map((project) => (
            <li key={project.id} className="oss-item" data-reveal>
              <span>
                <strong>{project.title}</strong> · {project.summary}
              </span>
              <span className="links">
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

export function Resume() {
  const effect = useSectionEffect('resume');
  return (
    <section id="resume" className={sectionClass('section', effect)} aria-labelledby="resume-title">
      <div className="wrap">
        <div className="resume-head" data-reveal>
          <div>
            <p className="section-index">
              <span>05</span> Resume
            </p>
            <h2 id="resume-title">The short version.</h2>
            <p className="resume-role">
              {profile.name} · {profile.title} · {profile.location}
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
          <div data-reveal>
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

          <div data-reveal>
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
    <section id="contact" className="section contact" aria-labelledby="contact-title">
      <div className="wrap">
        <p className="section-index" data-reveal>
          <span>06</span> Contact
        </p>
        <h2 id="contact-title" data-reveal>
          <a href={`mailto:${profile.email}`}>
            Let’s build <em>something</em> great.
          </a>
        </h2>
        <div className="contact-row" data-reveal>
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
