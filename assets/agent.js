/* The farm: four agents with desks on the floor plan. Choosing an agent in the hero walks it
   to the meeting room and back, then scrolls the page to that agent's section. Agents at section headings hop and
   show one line. No text input and no model. */
(function () {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WALK_MS = 1800;
  const SAY_MS = 4200;
  const timers = new Map();
  const floor = document.querySelector('.floor');

  document.querySelectorAll('[data-agent-go]').forEach((button) => {
    button.addEventListener('click', () => {
      const name = button.dataset.agentGo;
      if (button.classList.contains('farm-card')) {
        walkThenVisit(name);
        return;
      }
      settle(name);
    });
  });

  function walkThenVisit(name) {
    const agent = floor && floor.querySelector(`[data-fp="${name}"]`);
    if (!agent || reduced) {
      visitSection(name);
      return;
    }
    walk(agent);
    setTimeout(() => visitSection(name), WALK_MS);
  }

  function walk(agent) {
    const room = floor.querySelector('[data-room-id="meeting"]').getBBox();
    const desk = agent.dataset.desk.split(' ').map(Number);
    const stop = [room.x + room.width / 2, room.y + room.height / 2 + 14];
    const at = ([x, y]) => `translate(${x}px, ${y}px)`;
    agent.animate([
      { transform: at(desk), offset: 0 },
      { transform: at(stop), offset: 0.35 },
      { transform: at(stop), offset: 0.65 },
      { transform: at(desk), offset: 1 },
    ], { duration: 3600, easing: 'ease-in-out' });
  }

  function visitSection(name) {
    const home = document.querySelector(`[data-agent-home="${name}"]`);
    if (!home) return;
    home.closest('section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => settle(name), 450);
  }

  function settle(name) {
    const home = document.querySelector(`[data-agent-home="${name}"]`);
    if (!home) return;
    const resident = home.querySelector('.agent');
    resident.classList.remove('agent--hop');
    void resident.offsetWidth;
    resident.classList.add('agent--hop');

    const bubble = home.querySelector('.say');
    bubble.hidden = false;
    clearTimeout(timers.get(name));
    timers.set(name, setTimeout(() => { bubble.hidden = true; }, SAY_MS));
  }
})();
