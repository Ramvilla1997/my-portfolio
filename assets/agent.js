/* Mini: a small assistant that lives on the page. It answers only from this page's own text
   (retrieval, no model, no key), and hops to the section it is talking about. */
(function () {
  const STOP = new Set(['the','a','an','and','or','of','to','in','on','for','with','is','are','was','you','your','do','does','what','where','how','did','i','me','my','about','tell','show','can','that','this','it','at','by','be','as']);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const agent = document.getElementById('agent');
  if (!agent) return;

  const toggle = agent.querySelector('.agent-figure');
  const panel = agent.querySelector('.agent-panel');
  const log = agent.querySelector('.agent-log');
  const form = agent.querySelector('.agent-form');
  const input = agent.querySelector('#agent-q');

  // Build the index from the page itself, so answers always match what is visible.
  const docs = [...document.querySelectorAll('body section[id], body header[id]')].map((el) => {
    const heading = el.querySelector('h1, h2, h3');
    const text = el.textContent.replace(/\s+/g, ' ').trim();
    return { id: el.id, title: heading ? heading.textContent.trim() : el.id, el, text, sentences: text.split(/(?<=[.!?])\s+/) };
  });

  const IRREGULAR = { built: 'build', wrote: 'write', shipped: 'ship', ran: 'run', made: 'make' };
  const SYNONYMS = {
    project: ['work', 'build', 'product', 'app'],
    experience: ['job', 'role', 'career', 'employer'],
    contact: ['email', 'reach', 'hire', 'linkedin', 'github'],
    ai: ['llm', 'agent', 'rag', 'bedrock', 'mcp', 'copilot', 'model'],
    skill: ['stack', 'tech', 'technology', 'tool'],
  };
  function stem(w) {
    if (IRREGULAR[w]) return IRREGULAR[w];
    const trimmed = w.replace(/(ing|ed|es|s)$/, '');
    return trimmed.length >= 3 ? trimmed : w;
  }
  const tokens = (s) => s.toLowerCase().split(/[^a-z0-9+#.]+/).filter((t) => t.length > 1 && !STOP.has(t)).map(stem);
  function expand(terms) {
    const out = new Map(terms.map((t) => [t, 1]));
    terms.forEach((t) => (SYNONYMS[t] || []).forEach((syn) => { const st = stem(syn); if (!out.has(st)) out.set(st, 0.6); }));
    return out;
  }

  // BM25 over the page's sections: rare terms count for more, long sections are normalised.
  const K1 = 1.2, B = 0.75;
  // The section id is repeated so a question naming the section ("experience", "contact") routes there.
  const indexed = docs.map((d) => ({ d, words: tokens(`${d.id} ${d.id} ${d.id} ${d.title} ${d.text}`) }));
  const avgLen = indexed.reduce((n, x) => n + x.words.length, 0) / Math.max(1, indexed.length);
  const df = new Map();
  indexed.forEach((x) => new Set(x.words).forEach((w) => df.set(w, (df.get(w) || 0) + 1)));

  function search(query) {
    const terms = expand([...new Set(tokens(query))]);
    if (!terms.size) return null;
    const N = indexed.length;
    const scored = indexed.map(({ d, words }) => {
      let score = 0;
      terms.forEach((weight, t) => {
        const tf = words.filter((w) => w === t).length;
        if (!tf) return;
        const n = df.get(t) || 0;
        const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
        score += weight * idf * (tf * (K1 + 1)) / (tf + K1 * (1 - B + B * (words.length / avgLen)));
      });
      // A question that names a section ("projects", "experience") should land there, not on the most-repeated word.
      if (terms.has(stem(d.id))) score += 5;
      return { d, score, terms: [...terms.keys()] };
    }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score);
    return scored[0] || null;
  }

  function bestSentence(d, terms) {
    let best = d.sentences[0] || d.text, bestScore = -1;
    d.sentences.forEach((s) => {
      const sw = tokens(s);
      const score = terms.reduce((n, t) => n + (sw.includes(t) ? 1 : 0), 0);
      if (score > bestScore) { bestScore = score; best = s; }
    });
    return best.length > 280 ? best.slice(0, 277) + '…' : best;
  }

  function say(text, who) {
    const p = document.createElement('p');
    p.className = 'agent-msg agent-msg--' + (who || 'mini');
    p.textContent = text;
    log.appendChild(p);
    log.scrollTop = log.scrollHeight;
  }

  // Figure position: fixed at the viewport's bottom-right, moved with transform.
  let home = { x: 0, y: 0 };
  let pos = { x: 0, y: 0 };
  function placeHome() {
    home = { x: innerWidth - 84 - (innerWidth < 600 ? 16 : 40), y: innerHeight - 84 - 24 };
    if (!agent.dataset.moved) { pos = { ...home }; agent.style.transform = `translate(${pos.x}px, ${pos.y}px)`; }
  }
  addEventListener('resize', placeHome);
  placeHome();

  function hopTo(target) {
    const from = { ...pos };
    const to = { x: target.x, y: target.y };
    agent.dataset.moved = '1';
    pos = to;
    if (reduced) { agent.style.transform = `translate(${to.x}px, ${to.y}px)`; return; }
    const apexY = Math.min(from.y, to.y) - 140;
    const midX = (from.x + to.x) / 2;
    agent.animate([
      { transform: `translate(${from.x}px, ${from.y}px)`, offset: 0, easing: 'cubic-bezier(.3,0,.5,1)' },
      { transform: `translate(${midX}px, ${apexY}px)`, offset: 0.5, easing: 'cubic-bezier(.5,0,.7,1)' },
      { transform: `translate(${to.x}px, ${to.y}px)`, offset: 1 },
    ], { duration: 900, fill: 'forwards' });
    agent.style.transform = `translate(${to.x}px, ${to.y}px)`;
  }

  function goTo(d) {
    const heading = d.el.querySelector('h1, h2, h3') || d.el;
    d.el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    setTimeout(() => {
      const r = heading.getBoundingClientRect();
      hopTo({ x: Math.min(innerWidth - 84, Math.max(8, r.left - 96)), y: Math.max(8, r.top - 72) });
    }, reduced ? 0 : 450);
    d.el.classList.add('agent-highlight');
    setTimeout(() => d.el.classList.remove('agent-highlight'), 2600);
  }

  function ask(question) {
    say(question, 'you');
    const hit = search(question);
    if (!hit) {
      say("I couldn't find that on this page. Try Experience, Projects, the AI work, or Contact.");
      return;
    }
    say(`${hit.d.title}: ${bestSentence(hit.d, hit.terms)}`);
    goTo(hit.d);
  }

  function openPanel(open) {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    if (open) { input.focus(); if (!log.childElementCount) say("Hi, I'm Mini. I answer from this page only, and I'll show you where each answer lives."); }
  }

  toggle.addEventListener('click', () => openPanel(panel.hidden));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (q.length < 2) return;
    input.value = '';
    ask(q.slice(0, 200));
  });
  agent.querySelectorAll('.agent-chips button').forEach((b) => b.addEventListener('click', () => {
    openPanel(true);
    const target = docs.find((d) => d.id === b.dataset.target);
    say(b.textContent.trim(), 'you');
    if (!target) { ask(b.textContent.trim()); return; }
    say(`${target.title}: ${bestSentence(target, [])}`);
    goTo(target);
  }));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) openPanel(false); });
})();
