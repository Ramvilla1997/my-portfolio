'use client';

import { useEffect, useRef } from 'react';

interface SparkFieldProps {
  readonly active: boolean;
  readonly durationMs: number;
  readonly color: string;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
}

const SPAWN_PER_FRAME = 6;
const GRAVITY = 0.06;
const FADE_PER_FRAME = 0.02;

export function SparkField({ active, durationMs, color }: SparkFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!active || !canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const box = canvas.getBoundingClientRect();
      canvas.width = box.width * dpr;
      canvas.height = box.height * dpr;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const sparks: Spark[] = [];
    const start = performance.now();
    let last = start;
    let frame = 0;

    const spawn = (width: number, height: number) => {
      for (let index = 0; index < SPAWN_PER_FRAME; index += 1) {
        sparks.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 2.4,
          vy: (Math.random() - 0.8) * 2.4,
          life: 1,
          size: 1 + Math.random() * 2.2,
        });
      }
    };

    const tick = (now: number) => {
      const elapsed = now - start;
      const step = Math.min(32, now - last) / 16.67;
      last = now;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (elapsed < durationMs) {
        spawn(width, height);
      }

      context.clearRect(0, 0, width, height);
      for (let index = sparks.length - 1; index >= 0; index -= 1) {
        const spark = sparks[index];
        spark.x += spark.vx * step;
        spark.y += spark.vy * step;
        spark.vy += GRAVITY * step;
        spark.life -= FADE_PER_FRAME * step;
        if (spark.life <= 0) {
          sparks.splice(index, 1);
          continue;
        }
        context.globalAlpha = spark.life;
        context.fillStyle = color;
        context.beginPath();
        context.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;

      if (elapsed < durationMs || sparks.length > 0) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      context.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [active, durationMs, color]);

  return <canvas ref={canvasRef} className="spark-field" data-active={active} aria-hidden="true" />;
}
