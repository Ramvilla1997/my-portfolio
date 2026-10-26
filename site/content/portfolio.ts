export interface SkillGroup {
  readonly name: string;
  readonly items: readonly string[];
}

export interface Job {
  readonly period: string;
  readonly place: string;
  readonly title: string;
  readonly org: string;
  readonly summary: string;
  readonly tags: readonly string[];
  readonly points: readonly string[];
}

export interface Capability {
  readonly title: string;
  readonly summary: string;
  readonly tags: readonly string[];
}

export interface Project {
  readonly id: string;
  readonly title: string;
  readonly tag: string;
  readonly summary: string;
  readonly stack: string;
  readonly status: 'shipped' | 'in-progress';
  readonly links?: readonly { readonly label: string; readonly href: string }[];
}

export interface Education {
  readonly degree: string;
  readonly school: string;
  readonly period: string;
}

export const profile = {
  name: 'Ram Villa',
  title: 'Senior Full-Stack Engineer',
  location: 'Ottawa, ON',
  eyebrow: 'Senior Full-Stack Engineer · Ottawa',
  intro:
    'Six years building production web applications for healthcare and fintech. React and TypeScript frontends on serverless AWS, with releases that roll back safely.',
  email: 'ramvilla2203@gmail.com',
  phone: '+1 613 263 1403',
  phoneHref: 'tel:+16132631403',
  linkedin: 'https://www.linkedin.com/in/ramvilla/',
  github: 'https://github.com/Ramvilla1997',
  resumePdf: '/assets/Ram%20-%20Resume.pdf',
} as const;

export const summary =
  'Senior full-stack engineer with 6+ years building production web applications in regulated environments, across healthcare and fintech. Builds React and TypeScript frontends on serverless AWS backends (Lambda, Glue, DynamoDB, EventBridge), and designs releases that can be rolled back safely: blue-green data cutovers and staged feature-flag rollouts. Recently built an LLM chatbot on AWS Bedrock and AI developer tooling used in daily development. Builds to AODA and WCAG accessibility standards and works with health data under PHIPA.';

export const about = {
  summary:
    'Six years in regulated environments. I ship releases that can be rolled back safely, and I build to AODA and WCAG from the first commit.',
  skills: [
    { name: 'Frontend', items: ['React', 'Angular', 'TypeScript', 'JavaScript', 'Redux', 'React Native', 'React Hook Form', 'Zod', 'Vite', 'Bootstrap'] },
    { name: 'Backend & data', items: ['Node.js', 'Express', 'REST APIs', 'WebSocket', 'PostgreSQL', 'DynamoDB', 'Redis', 'Python', 'Java'] },
    { name: 'AWS', items: ['Lambda', 'API Gateway', 'EventBridge', 'SQS', 'SNS', 'S3', 'Glue', 'SSM Parameter Store', 'Secrets Manager', 'CloudFront', 'SAM', 'Bedrock'] },
    { name: 'DevOps & testing', items: ['Docker', 'Jenkins', 'GitHub Actions', 'Git', 'Bitbucket', 'Jest', 'Cypress'] },
    { name: 'AI tooling', items: ['RAG', 'MCP', 'Claude Code', 'GitHub Copilot agents'] },
    { name: 'Standards', items: ['AODA', 'WCAG', 'i18n', 'FHIR', 'OAuth 2.0', 'OIDC', 'PHIPA'] },
  ] satisfies SkillGroup[],
  certifications: ['AWS Certified Developer – Associate'],
};

export const capabilities: readonly Capability[] = [
  {
    title: 'Frontend platforms',
    summary: 'Large React and TypeScript apps, migrated from Angular without a feature freeze.',
    tags: ['React', 'TypeScript', 'Angular', 'React Native', 'WCAG & AODA', 'i18n'],
  },
  {
    title: 'Serverless AWS',
    summary: 'Event-driven backends and data pipelines, defined as infrastructure as code.',
    tags: ['Lambda', 'EventBridge', 'SQS', 'Glue', 'DynamoDB', 'AWS SAM'],
  },
  {
    title: 'AI & LLM systems',
    summary: 'Grounded RAG chatbots and agentic developer tooling used every day.',
    tags: ['RAG', 'AWS Bedrock', 'Claude', 'MCP', 'Copilot agents'],
  },
  {
    title: 'Release safety & quality',
    summary: 'Changes that roll back with a config switch, backed by automated tests.',
    tags: ['Blue-green', 'Feature flags', 'CI/CD', 'Jest', 'Cypress', 'Docker'],
  },
];

export const domains = {
  title: 'Healthcare & fintech',
  summary: 'Regulated products where security, privacy and accessibility are requirements, not extras.',
  tags: ['PHIPA', 'FHIR', 'OAuth 2.0', 'OIDC', 'WCAG'],
} as const;

export const jobs: readonly Job[] = [
  {
    period: 'Feb 2025 – Present',
    place: 'Ottawa, ON',
    title: 'Senior Software Engineer (Full-Stack)',
    org: 'Ontario Health',
    summary: 'Full-stack delivery on Ontario Health platforms: an LLM chatbot on AWS Bedrock, a serverless ingestion pipeline, and an incremental Angular-to-React migration.',
    tags: ['React', 'Angular', 'TypeScript', 'AWS Bedrock', 'Lambda', 'DynamoDB', 'PostgreSQL', 'FHIR', 'OAuth 2.0'],
    points: [
      'Built the ONE Health chatbot with RAG over Ontario Health docs, using Claude on AWS Bedrock.',
      'Kept chatbot answers grounded in approved sources only, so responses stay within published Ontario Health documentation.',
      'Co-designed the S3, EventBridge, SQS, Lambda, and Glue ingestion pipeline into versioned DynamoDB tables, defined in AWS SAM.',
      'Ran blue-green DynamoDB cutovers via SSM Parameter Store pointers, making rollback a config change.',
      'Staged feature rollouts at 10/50/100% behind feature flags, limiting the blast radius of a bad release.',
      'Migrated multiple workspaces from Angular to React incrementally, shipping sprint by sprint, with Angular and React running side by side and no feature freeze.',
      'Built a multi-step registration wizard with React Hook Form and Zod validation, to AODA and WCAG standards, with full i18n support.',
      'Delivered Canada Post address autocomplete end to end: a debounced React search backed by a Lambda lookup.',
      'Cut provider-search latency from 850 ms to 120 ms with composite PostgreSQL indexes on a table of about 500K rows.',
      'Shrank the frontend bundle from 2.1 MB to 1.3 MB.',
      'Created an audit-logging npm package used in all three monorepo workspaces.',
      'Wrote Jest unit tests and Cypress end-to-end tests for the workspaces.',
      'Worked on FHIR, OAuth 2.0, and OIDC integrations for health-data exchange and sign-in.',
      'Fixed a privilege-escalation bug in a SMART on FHIR broker with OAuth 2.0 scope-based authorization.',
    ],
  },
  {
    period: 'Jun 2024 – Jan 2025',
    place: 'Ottawa, ON',
    title: 'Full-Stack Developer',
    org: 'Independent Projects',
    summary: 'Built four full-stack products end to end: PDF Chat, Screenshot to Code, a real-time whiteboard and a task CLI.',
    tags: ['TypeScript', 'React', 'Node.js', 'WebSocket'],
    points: [
      'Built PDF Chat, an app for asking questions over PDF documents, in TypeScript and React.',
      'Built Screenshot to Code, which turns UI screenshots into front-end code.',
      'Built a real-time whiteboard that syncs drawing live across connected users.',
      'Built a task CLI in Node.js for managing to-dos from the terminal.',
    ],
  },
  {
    period: 'May 2023 – Apr 2024',
    place: 'Ottawa, ON',
    title: 'Software Engineer (Co-op)',
    org: 'University of Ottawa',
    summary: 'React features for a healthcare app handling patient data under PHIPA, shipped through CI/CD pipelines.',
    tags: ['React', 'Redux', 'Jenkins', 'GitHub Actions', 'PHIPA'],
    points: [
      'Built React features with Hooks and Redux for a healthcare app, handling patient data under PHIPA.',
      'Shipped changes through Jenkins and GitHub Actions pipelines for testing and deployment.',
      'Worked with product managers and QA to prioritize features and clear dependencies.',
    ],
  },
  {
    period: 'Dec 2021 – Aug 2022',
    place: 'India',
    title: 'Senior Programmer',
    org: 'Ionixx Technologies',
    summary: 'Frontend screens and APIs for a multi-exchange crypto trading platform and a community travel app.',
    tags: ['React', 'React Native', 'Node.js', 'JWT & OAuth', 'Docker'],
    points: [
      'Wrote React and React Native screens for Bitsian, a multi-exchange crypto trading platform, and built its Node.js APIs.',
      'Built frontend screens and API endpoints for Voyaj, a community travel app.',
      'Implemented JWT and OAuth authentication to protect users’ financial data.',
      'Containerized services with Docker during a move to microservices, and ran UI A/B tests.',
    ],
  },
  {
    period: 'Jul 2018 – Dec 2021',
    place: 'Hyderabad, India',
    title: 'Junior Software Developer',
    org: 'Sims Healthcare Pvt Ltd',
    summary: 'IoT patient-monitoring platform with real-time 12-lead ECG streaming and medical-device integration.',
    tags: ['React Native', 'Node.js', 'PostgreSQL', 'WebSocket', 'Docker'],
    points: [
      'Built an IoT patient-monitoring system with React Native, Node.js, and PostgreSQL.',
      'Built 12-lead ECG waveform streaming and integrated medical devices with the monitoring platform.',
      'Added real-time provider-patient communication over WebSocket.',
      'Wrote secure REST APIs with encryption for patient data, and gathered requirements with clinicians.',
      'Containerized services with Docker to keep dev and prod environments at parity.',
    ],
  },
];

export const projects: readonly Project[] = [
  {
    id: 'docsync',
    title: 'AI developer tooling',
    tag: 'AI tooling · Ontario Health',
    summary:
      'DocSync, a GitHub Copilot agent for an Angular 19 and React monorepo. It opens draft doc-update PRs from merged diffs. Five specialized Copilot agents now handle code search, replacing one.',
    stack: 'MCP · Claude Code · GitHub Copilot',
    status: 'shipped',
  },
  {
    id: 'jarvis',
    title: 'Jarvis',
    tag: 'Agents · in progress',
    summary: 'A three-agent pipeline that turns a Jira ticket into a plan, code, and a PR, with a human approval at each step.',
    stack: 'GitHub Copilot custom agents',
    status: 'in-progress',
  },
  {
    id: 'trading',
    title: 'AI Trading Simulator',
    tag: 'Fintech · in progress',
    summary: 'An educational paper-trading app on Alpaca market data, with AI news analysis. Paper trading only, no real funds at risk.',
    stack: 'React · Vite · Express · PostgreSQL · Claude Haiku',
    status: 'in-progress',
  },
  {
    id: 'spendvoice',
    title: 'SpendVoice',
    tag: 'PWA · in progress',
    summary: 'A voice-driven expense tracker that parses spoken entries and projects 10-year savings from tracked spending.',
    stack: 'React PWA · Claude Haiku',
    status: 'in-progress',
  },
  {
    id: 'pdf-chat',
    title: 'PDF Chat',
    tag: 'Product',
    summary: 'Ask questions over PDF documents and get answers from the file itself.',
    stack: 'TypeScript · React',
    status: 'shipped',
  },
  {
    id: 'whiteboard',
    title: 'Real-time whiteboard',
    tag: 'Realtime',
    summary: 'A shared drawing board where every connected user sees strokes as they are drawn.',
    stack: 'React · WebSocket',
    status: 'shipped',
  },
];

export const openSource: readonly Project[] = [
  {
    id: 'dashboard',
    title: 'Analytics dashboard',
    tag: 'Dashboard',
    summary: 'Every API response is validated against a schema before the UI renders it, so a bad payload fails loudly.',
    stack: 'React · TanStack Query · Zod',
    status: 'shipped',
    links: [
      { label: 'Demo', href: 'https://ramvilla1997.github.io/react-analytics-dashboard/' },
      { label: 'Code', href: 'https://github.com/Ramvilla1997/react-analytics-dashboard' },
    ],
  },
  {
    id: 'rag',
    title: 'Document Q&A',
    tag: 'RAG',
    summary: 'Ask questions about your documents and get answers that cite their sources.',
    stack: 'Node.js · Express · TypeScript · BM25',
    status: 'shipped',
    links: [{ label: 'Code', href: 'https://github.com/Ramvilla1997/rag-document-qa' }],
  },
  {
    id: 'nl-sql',
    title: 'Natural language to SQL',
    tag: 'Data',
    summary: 'Plain-English questions become read-only SQL over Postgres, with a SELECT-only role.',
    stack: 'Node.js · Express · PostgreSQL',
    status: 'shipped',
    links: [{ label: 'Code', href: 'https://github.com/Ramvilla1997/nl-to-sql-assistant' }],
  },
  {
    id: 'mcp',
    title: 'MCP tool server',
    tag: 'AI tooling',
    summary: 'Sandboxed, read-only tools for AI clients, tested over the real protocol with the MCP Inspector.',
    stack: 'TypeScript · MCP SDK',
    status: 'shipped',
    links: [{ label: 'Code', href: 'https://github.com/Ramvilla1997/mcp-tool-server' }],
  },
];

export const education: readonly Education[] = [
  { degree: 'Master of Engineering', school: 'University of Ottawa, Ottawa, ON', period: 'Sep 2022 – Dec 2023' },
  { degree: 'Bachelor of Technology', school: 'JNTU, Hyderabad, India', period: 'Sep 2014 – May 2018' },
];
