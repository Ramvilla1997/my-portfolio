import * as THREE from 'three';
import { roster, type AgentId } from '../../agents/roster';
import { planToWorld } from './math';

export interface RobotRig {
  readonly group: THREE.Group;
  readonly upper: THREE.Group;
  readonly head: THREE.Group;
  readonly legL: THREE.Group;
  readonly legR: THREE.Group;
  readonly armL: THREE.Group;
  readonly armR: THREE.Group;
  readonly eyes: THREE.Mesh[];
  readonly seed: number;
}

export interface Office {
  readonly robots: Record<AgentId, RobotRig>;
  readonly lights: THREE.Light[];
}

const unitBox = new THREE.BoxGeometry(1, 1, 1);
const unitSphere = new THREE.SphereGeometry(1, 20, 14);
const materialCache = new Map<string, THREE.MeshStandardMaterial>();

function material(color: string, emissive?: string): THREE.MeshStandardMaterial {
  const key = `${color}|${emissive ?? ''}`;
  const cached = materialCache.get(key);
  if (cached) {
    return cached;
  }
  const made = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.78,
    metalness: 0.02,
    emissive: new THREE.Color(emissive ?? '#000000'),
    emissiveIntensity: emissive ? 1.1 : 0,
  });
  materialCache.set(key, made);
  return made;
}

function block(parent: THREE.Object3D, w: number, h: number, d: number, color: string, x: number, y: number, z: number, emissive?: string): THREE.Mesh {
  const mesh = new THREE.Mesh(unitBox, material(color, emissive));
  mesh.scale.set(w, h, d);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function ball(parent: THREE.Object3D, radius: number, color: string, x: number, y: number, z: number): THREE.Mesh {
  const mesh = new THREE.Mesh(unitSphere, material(color));
  mesh.scale.setScalar(radius);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

function group(parent: THREE.Object3D, x: number, y: number, z: number, rotationY = 0): THREE.Group {
  const holder = new THREE.Group();
  holder.position.set(x, y, z);
  holder.rotation.y = rotationY;
  parent.add(holder);
  return holder;
}

function desk(parent: THREE.Object3D, x: number, z: number, facing: number): void {
  const holder = group(parent, x, 0, z, facing);
  block(holder, 1.7, 0.08, 0.85, '#b98a57', 0, 0.78, 0);
  for (const [dx, dz] of [[-0.78, -0.36], [0.78, -0.36], [-0.78, 0.36], [0.78, 0.36]]) {
    block(holder, 0.08, 0.76, 0.08, '#8a6038', dx, 0.38, dz);
  }
  block(holder, 0.74, 0.46, 0.06, '#23272f', 0, 1.14, -0.2);
  block(holder, 0.64, 0.36, 0.01, '#a8dcff', 0, 1.14, -0.16, '#6cc3ff');
  block(holder, 0.14, 0.12, 0.14, '#23272f', 0, 0.9, -0.2);
  block(holder, 0.5, 0.05, 0.22, '#e9e4d8', 0.35, 0.84, 0.18);
}

function chair(parent: THREE.Object3D, x: number, z: number, rotationY: number): void {
  const holder = group(parent, x, 0, z, rotationY);
  block(holder, 0.6, 0.08, 0.6, '#56708f', 0, 0.5, 0);
  block(holder, 0.6, 0.62, 0.08, '#56708f', 0, 0.82, -0.26);
  block(holder, 0.06, 0.5, 0.06, '#2b3038', 0, 0.25, 0);
}

function plant(parent: THREE.Object3D, x: number, z: number, scale = 1): void {
  block(parent, 0.42 * scale, 0.42 * scale, 0.42 * scale, '#a86a3a', x, 0.21 * scale, z);
  ball(parent, 0.46 * scale, '#4f9a4a', x, 0.72 * scale, z);
  ball(parent, 0.32 * scale, '#6fb35f', x + 0.2 * scale, 0.98 * scale, z - 0.1 * scale);
}

function bookcase(parent: THREE.Object3D, x: number, z: number, rotationY: number): void {
  const holder = group(parent, x, 0, z, rotationY);
  block(holder, 1.2, 1.7, 0.42, '#9c6b3f', 0, 0.85, 0);
  const books = ['#c94f4f', '#4f7ec9', '#e3b04b', '#5fae6a', '#8c5fc9'];
  for (let shelf = 0; shelf < 3; shelf += 1) {
    books.forEach((color, index) => {
      block(holder, 0.14, 0.34, 0.3, color, -0.44 + index * 0.22, 0.4 + shelf * 0.5, 0.02);
    });
  }
}

function cabinets(parent: THREE.Object3D, x: number, z: number, count: number): void {
  for (let index = 0; index < count; index += 1) {
    block(parent, 0.58, 1.1, 0.6, '#c8ccd3', x + index * 0.6, 0.55, z);
    block(parent, 0.3, 0.04, 0.02, '#8e939c', x + index * 0.6, 0.85, z + 0.31);
  }
}

function crates(parent: THREE.Object3D, x: number, z: number): void {
  const tan = '#c49a64';
  block(parent, 0.6, 0.6, 0.6, tan, x, 0.3, z);
  block(parent, 0.6, 0.6, 0.6, '#b68b58', x + 0.62, 0.3, z);
  block(parent, 0.6, 0.6, 0.6, '#b68b58', x, 0.3, z + 0.62);
  block(parent, 0.6, 0.6, 0.6, tan, x + 0.2, 0.9, z + 0.2);
}

function sofa(parent: THREE.Object3D, x: number, z: number, rotationY: number): void {
  const holder = group(parent, x, 0, z, rotationY);
  block(holder, 1.9, 0.4, 0.8, '#3d5f9a', 0, 0.2, 0);
  block(holder, 1.9, 0.6, 0.22, '#3d5f9a', 0, 0.58, -0.3);
  block(holder, 0.2, 0.5, 0.8, '#345589', -0.92, 0.45, 0);
  block(holder, 0.2, 0.5, 0.8, '#345589', 0.92, 0.45, 0);
  block(holder, 0.9, 0.12, 0.5, '#e6d3b0', 0.4, 0.46, 0.05);
}

function roundTable(parent: THREE.Object3D, x: number, z: number): void {
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.08, 28), material('#b98a57'));
  top.position.set(x, 0.78, z);
  top.castShadow = true;
  top.receiveShadow = true;
  parent.add(top);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.74, 14), material('#8a6038'));
  stem.position.set(x, 0.38, z);
  stem.castShadow = true;
  parent.add(stem);
  for (let index = 0; index < 4; index += 1) {
    const angle = (Math.PI / 2) * index + Math.PI / 4;
    const cx = x + Math.cos(angle) * 1.35;
    const cz = z + Math.sin(angle) * 1.35;
    chair(parent, cx, cz, Math.atan2(x - cx, z - cz));
  }
}

function lamp(parent: THREE.Object3D, x: number, z: number): THREE.PointLight {
  block(parent, 0.06, 1.6, 0.06, '#2a2d33', x, 0.8, z);
  block(parent, 0.42, 0.3, 0.42, '#fff1c9', x, 1.7, z, '#ffd28a');
  const light = new THREE.PointLight('#ffc878', 1.4, 6, 2);
  light.position.set(x, 1.5, z);
  parent.add(light);
  return light;
}

function plantRow(parent: THREE.Object3D): void {
  plant(parent, -6.5, 6.2, 1.1);
  plant(parent, 6.3, -6.2, 1.1);
  plant(parent, 6.4, 0.6);
  plant(parent, -0.6, 6.5);
  plant(parent, -6.4, 3.4);
}

function wallDecor(parent: THREE.Object3D): void {
  block(parent, 2.2, 1.2, 0.06, '#f5f5f2', -3.2, 1.45, -6.92);
  block(parent, 0.5, 0.36, 0.02, '#f4c96a', -3.8, 1.5, -6.88);
  block(parent, 0.5, 0.36, 0.02, '#7ecf9a', -2.9, 1.2, -6.88);
  block(parent, 1.8, 1.0, 0.06, '#38302a', 1.6, 1.5, -6.92);
  block(parent, 1.6, 0.9, 0.02, '#ffe7b0', 1.6, 1.5, -6.88, '#ffd28a');
  block(parent, 0.06, 1.1, 0.06, '#c9c2b4', 6.92, 1.5, 1.6);
  block(parent, 0.02, 1.0, 1.4, '#ffe7b0', 6.9, 1.5, 1.6, '#ffd28a');
}

function buildRobot(parent: THREE.Object3D, color: string, seed: number): RobotRig {
  const rig = new THREE.Group();
  rig.scale.setScalar(1.3);
  parent.add(rig);
  const upper = new THREE.Group();
  rig.add(upper);

  block(upper, 0.5, 0.46, 0.4, '#f4f5f7', 0, 0.9, 0);
  block(upper, 0.52, 0.08, 0.42, color, 0, 1.08, 0);
  block(upper, 0.3, 0.16, 0.02, '#20242c', 0, 0.9, 0.205);

  const head = new THREE.Group();
  head.position.set(0, 1.22, 0);
  upper.add(head);
  block(head, 0.52, 0.36, 0.42, '#f4f5f7', 0, 0, 0);
  block(head, 0.44, 0.22, 0.02, '#1f2430', 0, 0, 0.215);
  const eyeL = block(head, 0.1, 0.1, 0.02, color, -0.11, 0, 0.23, color);
  const eyeR = block(head, 0.1, 0.1, 0.02, color, 0.11, 0, 0.23, color);
  block(head, 0.04, 0.2, 0.04, '#9aa0aa', 0, 0.28, 0);
  ball(head, 0.06, color, 0, 0.4, 0);

  const legL = group(upper, -0.13, 0.66, 0);
  block(legL, 0.15, 0.6, 0.17, '#2b3038', 0, -0.3, 0);
  const legR = group(upper, 0.13, 0.66, 0);
  block(legR, 0.15, 0.6, 0.17, '#2b3038', 0, -0.3, 0);

  const armL = group(upper, -0.33, 1.0, 0);
  block(armL, 0.1, 0.42, 0.12, '#f4f5f7', 0, -0.21, 0);
  const armR = group(upper, 0.33, 1.0, 0);
  block(armR, 0.1, 0.42, 0.12, '#f4f5f7', 0, -0.21, 0);

  return { group: rig, upper, head, legL, legR, armL, armR, eyes: [eyeL, eyeR], seed };
}

/* A tilted, warm office: four rooms of furniture, a meeting table, lamps, and one robot per agent. */
export function buildOffice(scene: THREE.Scene): Office {
  scene.background = new THREE.Color('#1b1d23');

  const floor = new THREE.Mesh(new THREE.BoxGeometry(14.6, 0.2, 14.6), material('#e8d9bb'));
  floor.position.set(0, -0.1, 0);
  floor.receiveShadow = true;
  scene.add(floor);

  const walls = new THREE.Group();
  scene.add(walls);
  block(walls, 14.8, 1.6, 0.3, '#e7e3da', 0, 0.8, -7.15);
  block(walls, 0.3, 1.6, 14.8, '#e7e3da', -7.15, 0.8, 0);
  block(walls, 14.8, 0.36, 0.3, '#d5d0c4', 0, 0.18, 7.15);
  block(walls, 0.3, 0.36, 14.8, '#d5d0c4', 7.15, 0.18, 0);
  wallDecor(walls);

  const rug = block(scene, 3.4, 0.02, 2.6, '#7c9a7c', 4.6, 0.01, 3.4);
  rug.receiveShadow = true;

  const robots = {} as Record<AgentId, RobotRig>;
  roster.forEach((role, index) => {
    const home = planToWorld(role.desk);
    const deskX = home.x;
    const deskZ = home.z - 0.75;
    desk(scene, deskX, deskZ, Math.PI);
    const rig = buildRobot(scene, role.color, index * 1.7);
    rig.group.position.set(home.x, 0, home.z);
    rig.group.rotation.y = Math.PI;
    robots[role.id] = rig;
  });

  bookcase(scene, -6.6, -1.6, Math.PI / 2);
  cabinets(scene, 3.1, -6.5, 4);
  crates(scene, -4.8, 6.0);
  crates(scene, 5.2, 5.8);
  sofa(scene, 4.6, 5.2, Math.PI);
  roundTable(scene, 0, 0);
  plantRow(scene);

  const lights: THREE.Light[] = [
    lamp(scene, 6.5, -1.8),
    lamp(scene, -2.6, -1.8),
  ];

  const hemi = new THREE.HemisphereLight('#fff4e0', '#8c6a46', 1.1);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#ffd9a0', 1.6);
  sun.position.set(-8, 14, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -11;
  sun.shadow.camera.right = 11;
  sun.shadow.camera.top = 11;
  sun.shadow.camera.bottom = -11;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 40;
  sun.shadow.bias = -0.0008;
  scene.add(sun);
  lights.push(hemi, sun);

  return { robots, lights };
}

/* Gentle idle, a walking stride, a typing pose while working, and arms up when done. */
export function animateRobot(rig: RobotRig, phase: string, t: number, moving: boolean): void {
  const seed = rig.seed;
  const bob = moving ? Math.abs(Math.sin(t * 9 + seed)) * 0.06 : Math.sin(t * 2 + seed) * 0.025;
  rig.upper.position.y = bob;

  if (moving) {
    const stride = Math.sin(t * 9 + seed) * 0.6;
    rig.legL.rotation.x = stride;
    rig.legR.rotation.x = -stride;
    rig.armL.rotation.x = -stride * 0.8;
    rig.armR.rotation.x = stride * 0.8;
    rig.head.rotation.x = 0;
  } else if (phase === 'working') {
    rig.legL.rotation.x = 0;
    rig.legR.rotation.x = 0;
    rig.armL.rotation.x = -1.25 + Math.sin(t * 12 + seed) * 0.12;
    rig.armR.rotation.x = -1.25 + Math.sin(t * 12 + seed + 1.6) * 0.12;
    rig.head.rotation.x = 0.15;
  } else if (phase === 'done') {
    rig.legL.rotation.x = 0;
    rig.legR.rotation.x = 0;
    rig.armL.rotation.x = -2.6;
    rig.armR.rotation.x = -2.6;
    rig.head.rotation.x = -0.1;
  } else {
    rig.legL.rotation.x = 0;
    rig.legR.rotation.x = 0;
    rig.armL.rotation.x = Math.sin(t * 1.4 + seed) * 0.05;
    rig.armR.rotation.x = -Math.sin(t * 1.4 + seed) * 0.05;
    rig.head.rotation.x = 0;
  }

  const closed = Math.sin(t * 0.7 + seed) > 0.985;
  for (const eye of rig.eyes) {
    eye.scale.y = closed ? 0.012 : 0.1;
  }
}
