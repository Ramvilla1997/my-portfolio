export interface SkillGroup {
  readonly name: string;
  readonly items: readonly string[];
}

export interface Job {
  readonly period: string;
  readonly place: string;
  readonly title: string;
  readonly org: string;
  readonly points: readonly string[];
}

export interface Project {
  readonly id: string;
  readonly title: string;
  readonly tag: string;
  readonly summary: string;
  readonly stack: string;
  readonly image?: string;
  readonly liveUrl?: string;
  readonly codeUrl?: string;
  readonly inProgress?: boolean;
}

export const profile = {
  name: 'Ram Villa',
  eyebrow: 'Senior Full-Stack Engineer · Ottawa',
  intro:
    'I build React and TypeScript products on serverless AWS, for healthcare and fintech teams where getting it wrong has a cost.',
  email: 'ramvilla2203@gmail.com',
  phone: '+1 613 263 1403',
  phoneHref: 'tel:+16132631403',
  linkedin: 'https://www.linkedin.com/in/ramvilla/',
  github: 'https://github.com/Ramvilla1997',
  resumePdf: 'assets/Ram - Resume.pdf',
} as const;

export const about = {
  summary:
    'Six years of production web applications in regulated environments. I ship releases that can be rolled back safely, and I build accessibility to AODA and WCAG in from the first commit.',
  skills: [
    { name: 'Frontend', items: ['React', 'TypeScript', 'Redux', 'Zod', 'Vite', 'WCAG'] },
    { name: 'Backend & data', items: ['Node.js', 'Express', 'PostgreSQL', 'DynamoDB', 'Redis', 'FHIR'] },
    { name: 'AWS & AI', items: ['Lambda', 'EventBridge', 'Glue', 'Bedrock', 'SAM', 'MCP'] },
  ] satisfies SkillGroup[],
};

export const jobs: readonly Job[] = [
  {
    period: 'Feb 2025 – Present',
    place: 'Ottawa, ON',
    title: 'Senior Software Engineer, Full-Stack',
    org: 'Ontario Health',
    points: [
      'Built the ONE Health chatbot: RAG over approved documents, using Claude on AWS Bedrock.',
      'Cut provider-search latency from 850 ms to 120 ms with composite PostgreSQL indexes.',
      'Ran blue-green DynamoDB cutovers, so a bad config rolls back in one change.',
    ],
  },
  {
    period: 'Jun 2024 – Jan 2025',
    place: 'Ottawa, ON',
    title: 'Full-Stack Developer',
    org: 'Independent projects',
    points: ['Built PDF Chat, Screenshot to Code, a real-time collaborative whiteboard, and a task CLI in Node.js.'],
  },
  {
    period: 'May 2023 – Apr 2024',
    place: 'Ottawa, ON',
    title: 'Software Engineer (Co-op)',
    org: 'University of Ottawa',
    points: ['Built React features with Hooks and Redux for a healthcare app handling patient data under PHIPA.'],
  },
  {
    period: 'Dec 2021 – Aug 2022',
    place: 'India',
    title: 'Senior Programmer',
    org: 'Ionixx Technologies',
    points: ['Built React and React Native screens and Node.js APIs for a multi-exchange crypto trading platform.'],
  },
  {
    period: 'Jul 2018 – Dec 2021',
    place: 'Hyderabad, India',
    title: 'Junior Software Developer',
    org: 'Sims Healthcare',
    points: ['Built an IoT patient-monitoring system with React Native, Node.js, and PostgreSQL, including 12-lead ECG streaming.'],
  },
];

export const projects: readonly Project[] = [
  {
    id: 'spendvoice',
    title: 'SpendVoice',
    tag: 'Product · PWA',
    summary:
      'Log an expense in one sentence. You confirm before anything saves, and amounts are stored as whole cents. The app works offline.',
    stack: 'React · TypeScript · IndexedDB',
    image: 'assets/projects/spendvoice.png',
    liveUrl: 'https://ramvilla1997.github.io/spendvoice/',
    codeUrl: 'https://github.com/Ramvilla1997/spendvoice',
  },
  {
    id: 'dashboard',
    title: 'Analytics dashboard',
    tag: 'Dashboard',
    summary:
      'Every API response is validated against a schema before the UI renders it, so a bad payload fails loudly instead of showing a wrong number.',
    stack: 'React · TanStack Query · Zod',
    image: 'assets/projects/dashboard.png',
    liveUrl: 'https://ramvilla1997.github.io/react-analytics-dashboard/',
    codeUrl: 'https://github.com/Ramvilla1997/react-analytics-dashboard',
  },
  {
    id: 'rag',
    title: 'Document Q&A',
    tag: 'RAG',
    summary: 'Ask questions about your documents and get answers that cite their sources.',
    stack: 'Node.js · Express · TypeScript · BM25',
    codeUrl: 'https://github.com/Ramvilla1997/rag-document-qa',
  },
  {
    id: 'nl-sql',
    title: 'Natural language to SQL',
    tag: 'Data',
    summary: 'Plain-English questions become read-only SQL over Postgres, with a SELECT-only role.',
    stack: 'Node.js · Express · PostgreSQL',
    codeUrl: 'https://github.com/Ramvilla1997/nl-to-sql-assistant',
  },
  {
    id: 'mcp',
    title: 'MCP tool server',
    tag: 'AI tooling',
    summary: 'Sandboxed, read-only tools for AI clients, tested over the real protocol with the MCP Inspector.',
    stack: 'TypeScript · MCP SDK',
    codeUrl: 'https://github.com/Ramvilla1997/mcp-tool-server',
  },
  {
    id: 'jarvis',
    title: 'Jarvis',
    tag: 'In progress',
    summary: 'Three agents turn a Jira ticket into a plan, code, and a pull request, with a person approving each step.',
    stack: 'Agents · Jira · GitHub',
    inProgress: true,
  },
];
