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
  readonly shadow: THREE.Mesh;
  readonly seed: number;
}

export interface Office {
  readonly robots: Record<AgentId, RobotRig>;
  readonly lights: THREE.Light[];
  update(time: number): void;
}

const unitBox = new THREE.BoxGeometry(1, 1, 1);
const unitSphere = new THREE.SphereGeometry(1, 24, 16);
const materialCache = new Map<string, THREE.MeshStandardMaterial>();

function material(color: string, options: { emissive?: string | undefined; roughness?: number; metalness?: number } = {}): THREE.MeshStandardMaterial {
  const key = `${color}|${options.emissive ?? ''}|${options.roughness ?? ''}|${options.metalness ?? ''}`;
  const cached = materialCache.get(key);
  if (cached) {
    return cached;
  }
  const made = new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.72,
    metalness: options.metalness ?? 0.04,
    emissive: new THREE.Color(options.emissive ?? '#000000'),
    emissiveIntensity: options.emissive ? 1.4 : 0,
  });
  materialCache.set(key, made);
  return made;
}

function canvasTexture(width: number, height: number, draw: (context: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (context) {
    draw(context);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function floorTexture(): THREE.CanvasTexture {
  return canvasTexture(512, 512, (context) => {
    const tiles = 4;
    const size = 512 / tiles;
    for (let row = 0; row < tiles; row += 1) {
      for (let column = 0; column < tiles; column += 1) {
        context.fillStyle = (row + column) % 2 === 0 ? '#ecdcbf' : '#e4d1b1';
        context.fillRect(column * size, row * size, size, size);
      }
    }
    context.strokeStyle = 'rgba(120,88,48,0.35)';
    context.lineWidth = 3;
    context.strokeRect(0, 0, 512, 512);
  });
}

function screenTexture(color: string): THREE.CanvasTexture {
  return canvasTexture(256, 160, (context) => {
    const background = context.createLinearGradient(0, 0, 0, 160);
    background.addColorStop(0, '#16202f');
    background.addColorStop(1, '#0c1119');
    context.fillStyle = background;
    context.fillRect(0, 0, 256, 160);
    context.fillStyle = color;
    context.fillRect(0, 0, 256, 18);
    for (let row = 0; row < 7; row += 1) {
      const width = 40 + ((row * 37) % 110);
      context.fillStyle = row % 3 === 0 ? color : '#3a4a63';
      context.fillRect(14, 32 + row * 16, width, 7);
      context.fillStyle = '#2a3648';
      context.fillRect(20 + width, 32 + row * 16, 200 - width, 7);
    }
  });
}

function glowTexture(): THREE.CanvasTexture {
  return canvasTexture(128, 128, (context) => {
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255,220,150,0.9)');
    gradient.addColorStop(0.4, 'rgba(255,200,120,0.25)');
    gradient.addColorStop(1, 'rgba(255,200,120,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
  });
}

function shadowTexture(): THREE.CanvasTexture {
  return canvasTexture(128, 128, (context) => {
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(40,24,8,0.55)');
    gradient.addColorStop(1, 'rgba(40,24,8,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
  });
}

function block(parent: THREE.Object3D, w: number, h: number, d: number, color: string, x: number, y: number, z: number, emissive?: string): THREE.Mesh {
  const mesh = new THREE.Mesh(unitBox, material(color, { emissive }));
  mesh.scale.set(w, h, d);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function ball(parent: THREE.Object3D, radius: number, color: string, x: number, y: number, z: number, scale: [number, number, number] = [1, 1, 1]): THREE.Mesh {
  const mesh = new THREE.Mesh(unitSphere, material(color, { roughness: 0.6 }));
  mesh.scale.set(radius * scale[0], radius * scale[1], radius * scale[2]);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

function capsule(parent: THREE.Object3D, radius: number, length: number, color: string, x: number, y: number, z: number): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 6, 14), material(color, { roughness: 0.45, metalness: 0.08 }));
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

function desk(parent: THREE.Object3D, x: number, z: number, facing: number, screen: THREE.Texture): void {
  const holder = group(parent, x, 0, z, facing);
  block(holder, 1.7, 0.07, 0.86, '#c28f5c', 0, 0.8, 0);
  block(holder, 1.66, 0.02, 0.82, '#a8744a', 0, 0.765, 0);
  for (const [dx, dz] of [[-0.78, -0.37], [0.78, -0.37], [-0.78, 0.37], [0.78, 0.37]]) {
    block(holder, 0.07, 0.77, 0.07, '#7a5232', dx, 0.385, dz);
  }
  block(holder, 0.42, 0.3, 0.6, '#b07a4a', -0.5, 0.6, 0.02);
  block(holder, 0.74, 0.46, 0.05, '#222832', 0, 1.16, -0.2);
  const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.4), new THREE.MeshStandardMaterial({ map: screen, emissiveMap: screen, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0.7, roughness: 0.3 }));
  screenMesh.position.set(0, 1.16, -0.173);
  screenMesh.rotation.y = Math.PI;
  holder.add(screenMesh);
  block(holder, 0.14, 0.14, 0.14, '#222832', 0, 0.9, -0.2);
  block(holder, 0.5, 0.03, 0.2, '#e9e4d8', 0.25, 0.8, 0.22);
  ball(holder, 0.04, '#f2efe8', 0.6, 0.86, 0.22, [1, 1.3, 1]);
}

function chair(parent: THREE.Object3D, x: number, z: number, rotationY: number): void {
  const holder = group(parent, x, 0, z, rotationY);
  block(holder, 0.6, 0.1, 0.6, '#4f6a8e', 0, 0.5, 0);
  block(holder, 0.6, 0.66, 0.1, '#4f6a8e', 0, 0.84, -0.26);
  block(holder, 0.05, 0.5, 0.05, '#2b3038', 0, 0.25, 0);
  block(holder, 0.42, 0.04, 0.42, '#2b3038', 0, 0.02, 0);
}

function plant(parent: THREE.Object3D, x: number, z: number, scale = 1): void {
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * scale, 0.17 * scale, 0.42 * scale, 18), material('#b8714a', { roughness: 0.8 }));
  pot.position.set(x, 0.21 * scale, z);
  pot.castShadow = true;
  parent.add(pot);
  ball(parent, 0.4 * scale, '#4f9a4a', x, 0.72 * scale, z, [1, 0.9, 1]);
  ball(parent, 0.28 * scale, '#6fb35f', x + 0.22 * scale, 0.96 * scale, z - 0.1 * scale);
  ball(parent, 0.24 * scale, '#3f8a3e', x - 0.2 * scale, 0.92 * scale, z + 0.12 * scale);
}

function bookcase(parent: THREE.Object3D, x: number, z: number, rotationY: number): void {
  const holder = group(parent, x, 0, z, rotationY);
  block(holder, 1.2, 1.7, 0.42, '#9c6b3f', 0, 0.85, 0);
  const books = ['#c94f4f', '#4f7ec9', '#e3b04b', '#5fae6a', '#8c5fc9', '#e7e0cf'];
  for (let shelf = 0; shelf < 3; shelf += 1) {
    books.forEach((color, index) => {
      block(holder, 0.13, 0.32 + ((index * 7) % 3) * 0.03, 0.3, color, -0.46 + index * 0.18, 0.4 + shelf * 0.5, 0.03);
    });
  }
}

function cabinets(parent: THREE.Object3D, x: number, z: number, count: number): void {
  for (let index = 0; index < count; index += 1) {
    block(parent, 0.58, 1.1, 0.6, '#cfd3da', x + index * 0.6, 0.55, z);
    block(parent, 0.3, 0.04, 0.02, '#8e939c', x + index * 0.6, 0.85, z + 0.31);
    block(parent, 0.3, 0.04, 0.02, '#8e939c', x + index * 0.6, 0.45, z + 0.31);
  }
}

function crates(parent: THREE.Object3D, x: number, z: number): void {
  block(parent, 0.6, 0.6, 0.6, '#c49a64', x, 0.3, z);
  block(parent, 0.6, 0.6, 0.6, '#b68b58', x + 0.62, 0.3, z);
  block(parent, 0.6, 0.6, 0.6, '#b68b58', x, 0.3, z + 0.62);
  block(parent, 0.6, 0.6, 0.6, '#c49a64', x + 0.2, 0.9, z + 0.2);
}

function sofa(parent: THREE.Object3D, x: number, z: number, rotationY: number): void {
  const holder = group(parent, x, 0, z, rotationY);
  block(holder, 1.9, 0.38, 0.8, '#3d5f9a', 0, 0.2, 0);
  block(holder, 1.9, 0.62, 0.22, '#3d5f9a', 0, 0.56, -0.3);
  block(holder, 0.2, 0.52, 0.8, '#345589', -0.92, 0.42, 0);
  block(holder, 0.2, 0.52, 0.8, '#345589', 0.92, 0.42, 0);
  block(holder, 0.9, 0.12, 0.5, '#e6d3b0', 0.4, 0.44, 0.05);
}

function roundTable(parent: THREE.Object3D, x: number, z: number): void {
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.08, 36), material('#c28f5c'));
  top.position.set(x, 0.78, z);
  top.castShadow = true;
  top.receiveShadow = true;
  parent.add(top);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.74, 18), material('#7a5232'));
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

function lamp(parent: THREE.Object3D, x: number, z: number): { light: THREE.PointLight; glow: THREE.Sprite } {
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.6, 12), material('#2a2d33', { metalness: 0.4 }));
  pole.position.set(x, 0.8, z);
  pole.castShadow = true;
  parent.add(pole);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.32, 24, 1, true), material('#fff1c9', { emissive: '#ffd28a' }));
  shade.position.set(x, 1.7, z);
  parent.add(shade);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  glow.scale.set(1.8, 1.8, 1);
  glow.position.set(x, 1.6, z);
  parent.add(glow);
  const light = new THREE.PointLight('#ffc878', 1.5, 6, 2);
  light.position.set(x, 1.5, z);
  parent.add(light);
  return { light, glow };
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

function buildRobot(parent: THREE.Object3D, color: string, seed: number, shadowTex: THREE.Texture): RobotRig {
  const rig = new THREE.Group();
  rig.scale.setScalar(1.25);
  parent.add(rig);
  const upper = new THREE.Group();
  rig.add(upper);

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.28, 6, 14), material('#eef1f5', { roughness: 0.45, metalness: 0.1 }));
  body.position.set(0, 0.8, 0);
  body.scale.set(1, 1, 0.9);
  body.castShadow = true;
  upper.add(body);
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 20), material(color, { emissive: color }));
  chest.rotation.x = Math.PI / 2;
  chest.position.set(0, 0.86, 0.17);
  upper.add(chest);

  const head = new THREE.Group();
  head.position.set(0, 1.3, 0);
  upper.add(head);
  ball(head, 0.25, '#eef1f5', 0, 0, 0, [1.05, 0.92, 0.95]);
  ball(head, 0.2, '#1b2230', 0, 0.02, 0.1, [0.92, 0.5, 0.4]);
  const eyeL = ball(head, 0.045, color, -0.075, 0.03, 0.2);
  const eyeR = ball(head, 0.045, color, 0.075, 0.03, 0.2);
  eyeL.material = material(color, { emissive: color });
  eyeR.material = material(color, { emissive: color });
  eyeL.userData.baseY = eyeL.scale.y;
  eyeR.userData.baseY = eyeR.scale.y;
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 8), material('#9aa0aa'));
  antenna.position.set(0, 0.28, 0);
  head.add(antenna);
  ball(head, 0.035, color, 0, 0.37, 0);

  const legL = group(upper, -0.1, 0.46, 0);
  capsule(legL, 0.075, 0.24, '#2b3038', 0, -0.2, 0);
  block(legL, 0.16, 0.06, 0.22, '#1d2026', 0, -0.44, 0.04);
  const legR = group(upper, 0.1, 0.46, 0);
  capsule(legR, 0.075, 0.24, '#2b3038', 0, -0.2, 0);
  block(legR, 0.16, 0.06, 0.22, '#1d2026', 0, -0.44, 0.04);

  const armL = group(upper, -0.25, 1.0, 0);
  capsule(armL, 0.06, 0.22, '#eef1f5', 0, -0.17, 0);
  ball(armL, 0.07, '#dfe4ea', 0, -0.4, 0);
  const armR = group(upper, 0.25, 1.0, 0);
  capsule(armR, 0.06, 0.22, '#eef1f5', 0, -0.17, 0);
  ball(armR, 0.07, '#dfe4ea', 0, -0.4, 0);

  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.012;
  parent.add(shadow);

  return { group: rig, upper, head, legL, legR, armL, armR, eyes: [eyeL, eyeR], shadow, seed };
}

/* A tilted, warm office: tiled floor, furniture with screens, lamps, dust, and one robot per agent. */
export function buildOffice(scene: THREE.Scene): Office {
  scene.background = new THREE.Color('#0a0d18');
  const shadowTex = shadowTexture();

  const floorTex = floorTexture();
  floorTex.wrapS = THREE.RepeatWrapping;
  floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(3, 3);
  const floor = new THREE.Mesh(new THREE.BoxGeometry(14.6, 0.2, 14.6), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.9 }));
  floor.position.set(0, -0.1, 0);
  floor.receiveShadow = true;
  scene.add(floor);

  const walls = new THREE.Group();
  scene.add(walls);
  block(walls, 14.8, 1.6, 0.3, '#e7e3da', 0, 0.8, -7.15);
  block(walls, 0.3, 1.6, 14.8, '#e7e3da', -7.15, 0.8, 0);
  block(walls, 14.8, 0.06, 0.34, '#cbc3b3', 0, 1.62, -7.15);
  block(walls, 0.34, 0.06, 14.8, '#cbc3b3', -7.15, 1.62, 0);
  block(walls, 14.8, 0.36, 0.3, '#d5d0c4', 0, 0.18, 7.15);
  block(walls, 0.3, 0.36, 14.8, '#d5d0c4', 7.15, 0.18, 0);
  wallDecor(walls);

  const rug = block(scene, 3.4, 0.02, 2.6, '#7c9a7c', 4.6, 0.01, 3.4);
  rug.receiveShadow = true;

  const robots = {} as Record<AgentId, RobotRig>;
  roster.forEach((role, index) => {
    const home = planToWorld(role.desk);
    desk(scene, home.x, home.z - 0.75, Math.PI, screenTexture(role.color));
    const rig = buildRobot(scene, role.color, index * 1.7, shadowTex);
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

  const lampA = lamp(scene, 6.5, -1.8);
  const lampB = lamp(scene, -2.6, -1.8);

  const hemi = new THREE.HemisphereLight('#fff4e0', '#8c6a46', 1.05);
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

  const dustCount = 160;
  const dustPositions = new Float32Array(dustCount * 3);
  for (let index = 0; index < dustCount; index += 1) {
    dustPositions[index * 3] = (Math.random() - 0.5) * 12;
    dustPositions[index * 3 + 1] = Math.random() * 3;
    dustPositions[index * 3 + 2] = (Math.random() - 0.5) * 12;
  }
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color: '#ffe2a8', size: 0.05, transparent: true, opacity: 0.55, depthWrite: false }));
  scene.add(dust);

  const lights: THREE.Light[] = [lampA.light, lampB.light, hemi, sun];
  const flicker = [lampA.glow, lampB.glow];

  return {
    robots,
    lights,
    update(time: number) {
      const positions = dustGeometry.getAttribute('position') as THREE.BufferAttribute;
      for (let index = 0; index < dustCount; index += 1) {
        const y = (positions.getY(index) + 0.004 + Math.sin(time * 0.5 + index) * 0.0006) % 3;
        positions.setY(index, y);
      }
      positions.needsUpdate = true;
      flicker.forEach((glow, index) => {
        glow.material.opacity = 0.9 + Math.sin(time * 3 + index * 2) * 0.05;
      });
    },
  };
}

/* Gentle idle, a stride while walking, a typing pose while working, and arms up when done. */
export function animateRobot(rig: RobotRig, phase: string, t: number, moving: boolean): void {
  const seed = rig.seed;
  const bob = moving ? Math.abs(Math.sin(t * 9 + seed)) * 0.05 : Math.sin(t * 2 + seed) * 0.02;
  rig.upper.position.y = bob;
  rig.shadow.position.x = rig.group.position.x;
  rig.shadow.position.z = rig.group.position.z;
  rig.shadow.scale.setScalar(moving ? 1.05 - Math.abs(Math.sin(t * 9 + seed)) * 0.08 : 1);

  if (moving) {
    const stride = Math.sin(t * 9 + seed) * 0.55;
    rig.legL.rotation.x = stride;
    rig.legR.rotation.x = -stride;
    rig.armL.rotation.x = -stride * 0.8;
    rig.armR.rotation.x = stride * 0.8;
    rig.head.rotation.x = 0.05;
  } else if (phase === 'working') {
    rig.legL.rotation.x = 0;
    rig.legR.rotation.x = 0;
    rig.armL.rotation.x = -1.3 + Math.sin(t * 12 + seed) * 0.1;
    rig.armR.rotation.x = -1.3 + Math.sin(t * 12 + seed + 1.6) * 0.1;
    rig.head.rotation.x = 0.18;
  } else if (phase === 'done') {
    rig.legL.rotation.x = 0;
    rig.legR.rotation.x = 0;
    rig.armL.rotation.x = -2.7;
    rig.armR.rotation.x = -2.7;
    rig.head.rotation.x = -0.1;
  } else {
    rig.legL.rotation.x = 0;
    rig.legR.rotation.x = 0;
    rig.armL.rotation.x = Math.sin(t * 1.4 + seed) * 0.05;
    rig.armR.rotation.x = -Math.sin(t * 1.4 + seed) * 0.05;
    rig.head.rotation.x = Math.sin(t * 0.6 + seed) * 0.04;
  }

  const closed = Math.sin(t * 0.7 + seed) > 0.985;
  for (const eye of rig.eyes) {
    const baseY = typeof eye.userData.baseY === 'number' ? eye.userData.baseY : eye.scale.y;
    eye.scale.y = closed ? baseY * 0.12 : baseY;
  }
}
