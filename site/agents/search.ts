import { about, capabilities, domains, education, jobs, openSource, profile, projects, summary } from '../content/portfolio';
import type { AgentId, SectionId } from './roster';

export interface Passage {
  readonly id: string;
  readonly section: SectionId;
  readonly agent: AgentId;
  readonly title: string;
  readonly text: string;
}

export interface Hit {
  readonly passage: Passage;
  readonly score: number;
}

const SECTION_AGENT: Readonly<Record<SectionId, AgentId>> = {
  about: 'scout',
  experience: 'archivist',
  projects: 'builder',
  resume: 'courier',
};

const STOP = new Set(['the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'is', 'are', 'was', 'you', 'your', 'do', 'does', 'what', 'where', 'how', 'did', 'i', 'me', 'my', 'about', 'tell', 'show', 'can', 'that', 'this', 'it', 'at', 'by', 'be', 'as', 'have', 'has', 'any']);

/* Everything the page says, split into passages a visitor can be answered from. */
export function passages(): Passage[] {
  const list: Passage[] = [
    { id: 'about', section: 'about', agent: SECTION_AGENT.about, title: 'About', text: summary },
  ];
  for (const group of about.skills) {
    list.push({
      id: `skills-${group.name}`,
      section: 'about',
      agent: SECTION_AGENT.about,
      title: `Skills: ${group.name}`,
      text: `${group.name} skills: ${group.items.join(', ')}.`,
    });
  }
  for (const capability of [...capabilities, domains]) {
    list.push({
      id: `capability-${capability.title}`,
      section: 'about',
      agent: SECTION_AGENT.about,
      title: `Skills: ${capability.title}`,
      text: `${capability.title}: ${capability.summary} ${capability.tags.join(', ')}.`,
    });
  }
  jobs.forEach((job, index) => {
    list.push({
      id: `job-${index}`,
      section: 'experience',
      agent: SECTION_AGENT.experience,
      title: `${job.title}, ${job.org}`,
      text: `${job.title} at ${job.org}, ${job.period}, ${job.place}. ${job.summary} ${job.points.join(' ')}`,
    });
  });
  for (const project of [...projects, ...openSource]) {
    list.push({
      id: `project-${project.id}`,
      section: 'projects',
      agent: SECTION_AGENT.projects,
      title: project.title,
      text: `${project.title}: ${project.summary} Stack: ${project.stack}. ${project.status === 'in-progress' ? 'In progress.' : ''}`.trim(),
    });
  }
  for (const item of education) {
    list.push({
      id: `education-${item.degree}`,
      section: 'resume',
      agent: SECTION_AGENT.resume,
      title: 'Education',
      text: `${item.degree}, ${item.school}, ${item.period}.`,
    });
  }
  list.push({
    id: 'resume',
    section: 'resume',
    agent: SECTION_AGENT.resume,
    title: 'Resume',
    text: `The resume is available as a PDF download on this page. Email ${profile.email} for anything it does not cover.`,
  });
  list.push({
    id: 'contact',
    section: 'resume',
    agent: SECTION_AGENT.resume,
    title: 'Contact',
    text: `Email ${profile.email}, phone ${profile.phone}, LinkedIn or GitHub.`,
  });
  return list;
}

export function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .map((word) => word.replace(/(ing|ed|es|s)$/, ''))
    .filter((word) => word.length > 1 && !STOP.has(word));
}

/* Words that name a section. A question that names one gets a bonus for that section's passages. */
const SECTION_WORDS: Readonly<Record<SectionId, readonly string[]>> = {
  about: ['about', 'skill', 'stack', 'background', 'tech'],
  experience: ['experience', 'work', 'job', 'role', 'company', 'employer', 'career'],
  projects: ['project', 'built', 'build', 'app', 'demo', 'product'],
  resume: ['resume', 'cv', 'contact', 'email', 'hire', 'reach'],
};
const SECTION_BONUS = 6;

const K1 = 1.2;
const B = 0.75;

/* BM25 over the passages. Returns the best matches first, with no match below a score of zero. */
export function search(query: string, list: readonly Passage[] = passages(), limit = 3): Hit[] {
  const terms = [...new Set(tokens(query))];
  if (terms.length === 0) {
    return [];
  }
  const indexed = list.map((passage) => ({ passage, words: tokens(`${passage.title} ${passage.text}`) }));
  const average = indexed.reduce((total, item) => total + item.words.length, 0) / Math.max(1, indexed.length);
  const documentFrequency = new Map<string, number>();
  for (const item of indexed) {
    for (const word of new Set(item.words)) {
      documentFrequency.set(word, (documentFrequency.get(word) ?? 0) + 1);
    }
  }
  return indexed
    .map(({ passage, words }) => {
      let score = 0;
      for (const term of terms) {
        const frequency = words.filter((word) => word === term || word.startsWith(term)).length;
        if (frequency === 0) {
          continue;
        }
        const documents = documentFrequency.get(term) ?? 0;
        const idf = Math.log(1 + (indexed.length - documents + 0.5) / (documents + 0.5));
        score += (idf * frequency * (K1 + 1)) / (frequency + K1 * (1 - B + (B * words.length) / average));
      }
      return { passage, score };
    })
    .map((hit) => {
      const words = terms.map((term) => term.replace(/(ing|ed|es|s)$/, ''));
      const named = SECTION_WORDS[hit.passage.section].some((word) => words.includes(word));
      return named ? { passage: hit.passage, score: hit.score + SECTION_BONUS } : hit;
    })
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
