import { describe, expect, it } from 'vitest';
import { passages, search } from '../agents/search';

describe('playground search', () => {
  it('sends a project question to the projects passages', () => {
    const [best] = search('what projects have you built');
    expect(best?.passage.section).toBe('projects');
  });

  it('sends an experience question to the timeline', () => {
    const [best] = search('where did you work at Ontario Health');
    expect(best?.passage.section).toBe('experience');
  });

  it('answers a skills question from the skill groups', () => {
    const [best] = search('do you know Bedrock or AWS');
    expect(best?.passage.title).toContain('Skills');
  });

  it('finds nothing for a question the page cannot answer', () => {
    expect(search('what is your favourite football team')).toEqual([]);
  });

  it('has a passage for every section a visitor can ask about', () => {
    const sections = new Set(passages().map((passage) => passage.section));
    expect(sections).toEqual(new Set(['about', 'experience', 'projects', 'resume']));
  });
});
