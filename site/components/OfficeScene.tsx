'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { roster, type AgentId } from '../agents/roster';
import { animateRobot, buildOffice } from './office/buildOffice';
import { planToWorld, positionAt, type Timed } from './office/math';

export type ScenePhase = 'idle' | 'walking' | 'working' | 'done';

export interface SceneAgent {
  readonly phase: ScenePhase;
  readonly walk: Timed;
  readonly startedAt: number;
}

interface OfficeSceneProps {
  readonly agents: Record<AgentId, SceneAgent>;
  readonly activity: Partial<Record<AgentId, string>>;
  readonly reduced: boolean;
}

const HALF_VIEW = 8.4;
const LABEL_HEIGHT = 2.9;

/* A short, plain description of what is happening, for screen readers. */
function speechSummary(agents: Record<AgentId, SceneAgent>, activity: Partial<Record<AgentId, string>>): string {
  const active = roster.filter((role) => agents[role.id].phase !== 'idle');
  if (active.length === 0) {
    return 'All agents are at their desks.';
  }
  return active.map((role) => `${role.name}: ${activity[role.id] ?? 'working'}`).join('. ');
}

export function OfficeScene({ agents, activity, reduced }: OfficeSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<Partial<Record<AgentId, HTMLDivElement | null>>>({});
  const agentsRef = useRef(agents);
  const reducedRef = useRef(reduced);

  useEffect(() => {
    agentsRef.current = agents;
  }, [agents]);

  useEffect(() => {
    reducedRef.current = reduced;
  }, [reduced]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.className = 'office-canvas-el';
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const office = buildOffice(scene);
    const { robots } = office;

    const camera = new THREE.OrthographicCamera(-HALF_VIEW, HALF_VIEW, HALF_VIEW, -HALF_VIEW, 0.1, 100);
    camera.position.set(22, 22, 22);
    camera.lookAt(0, 0, 0);

    let width = 1;
    let height = 1;
    const fit = () => {
      width = Math.max(1, mount.clientWidth);
      height = Math.max(1, mount.clientHeight);
      renderer.setSize(width, height, false);
      const aspect = width / height;
      camera.left = -HALF_VIEW * aspect;
      camera.right = HALF_VIEW * aspect;
      camera.top = HALF_VIEW;
      camera.bottom = -HALF_VIEW;
      camera.updateProjectionMatrix();
    };
    fit();
    const resizeObserver = new ResizeObserver(fit);
    resizeObserver.observe(mount);

    let visible = true;
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
    });
    visibility.observe(mount);

    const previous: Partial<Record<AgentId, { x: number; z: number }>> = {};
    const projected = new THREE.Vector3();
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const time = (now - start) / 1000;
      const state = agentsRef.current;
      office.update(time);

      for (const role of roster) {
        const rig = robots[role.id];
        const agent = state[role.id];
        const elapsed = (now - agent.startedAt) / 1000;
        const plan = reducedRef.current ? positionAt(agent.walk, Number.POSITIVE_INFINITY) : positionAt(agent.walk, elapsed);
        const world = planToWorld(plan);
        const last = previous[role.id] ?? world;
        const dx = world.x - last.x;
        const dz = world.z - last.z;
        const moving = Math.hypot(dx, dz) > 0.0005;
        if (moving) {
          rig.group.rotation.y = Math.atan2(dx, dz);
        }
        previous[role.id] = world;
        rig.group.position.set(world.x, 0, world.z);
        animateRobot(rig, agent.phase, time, moving && !reducedRef.current);

        const label = labelRefs.current[role.id];
        if (label) {
          projected.set(world.x, LABEL_HEIGHT, world.z).project(camera);
          const screenX = ((projected.x + 1) / 2) * width;
          const screenY = ((1 - projected.y) / 2) * height;
          label.style.transform = `translate(${screenX.toFixed(1)}px, ${screenY.toFixed(1)}px) translate(-50%, -100%)`;
          label.style.opacity = agent.phase === 'idle' ? '0' : '1';
        }
      }

      if (visible) {
        renderer.render(scene, camera);
      }
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibility.disconnect();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div className="office-wrap" role="group" aria-label="The agent office. Agents are at their desks unless you ask a question.">
      <p className="sr-only" aria-live="polite">{speechSummary(agents, activity)}</p>
      <div ref={mountRef} className="office-mount" />
      {roster.map((role) => (
        <div
          key={role.id}
          className="office-label"
          ref={(element) => {
            labelRefs.current[role.id] = element;
          }}
        >
          <span className="office-label-main">
            <span className="office-dot" style={{ background: role.color }} />
            <span>{role.name}</span>
            <small>{role.role}</small>
          </span>
          {activity[role.id] ? <span className="office-activity">{activity[role.id]}</span> : null}
        </div>
      ))}
    </div>
  );
}
