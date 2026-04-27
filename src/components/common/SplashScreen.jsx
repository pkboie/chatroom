import { useEffect, useMemo, useState } from 'react';
import './SplashScreen.css';

const TOTAL_MS = 2600;
const FADE_MS = 500;
const VISIBLE_MS = TOTAL_MS - FADE_MS; // 2100ms

const GRID = 6; // 6x6 = 36 shards (smoother than 8x8)
const MAX_SHARD_DELAY = 600; // ms — diagonal-wave stagger

function buildShards() {
  const cellSize = 100 / GRID;
  const shards = [];
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      // Burst direction: outward from center, with light jitter so it's not perfectly radial.
      const cxOff = c - (GRID - 1) / 2;
      const cyOff = r - (GRID - 1) / 2;
      const baseAngle = Math.atan2(cyOff, cxOff || 0.0001);
      const angle = baseAngle + (Math.random() - 0.5) * 0.7;
      const dist = 220 + Math.random() * 220;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;
      const tz = -200 - Math.random() * 360; // start behind the camera

      // Tame rotations — gentler interpolation = smoother motion.
      const rx = (Math.random() - 0.5) * 240;
      const ry = (Math.random() - 0.5) * 240;
      const rz = (Math.random() - 0.5) * 200;

      // Diagonal-wave delay: corners fly home first, center arrives last.
      const distFromCenter = Math.hypot(cxOff, cyOff);
      const maxDist = Math.hypot(GRID / 2, GRID / 2);
      const delay = (1 - distFromCenter / maxDist) * MAX_SHARD_DELAY + Math.random() * 60;

      const xL = c * cellSize;
      const xR = (c + 1) * cellSize;
      const yT = r * cellSize;
      const yB = (r + 1) * cellSize;
      const clipPath = `polygon(${xL}% ${yT}%, ${xR}% ${yT}%, ${xR}% ${yB}%, ${xL}% ${yB}%)`;

      shards.push({ key: `${r}-${c}`, tx, ty, tz, rx, ry, rz, delay, clipPath });
    }
  }
  return shards;
}

function SplashScreen() {
  const [leaving, setLeaving] = useState(false);
  const [done, setDone] = useState(false);

  const shards = useMemo(buildShards, []);

  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), VISIBLE_MS);
    const t2 = setTimeout(() => setDone(true), TOTAL_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (done) return null;

  return (
    <div className={`splash ${leaving ? 'is-leaving' : ''}`} aria-hidden>
      <div className="splash-stage">
        <div className="splash-logo-glow" />
        <div className="splash-shard-stage">
          {shards.map((s) => (
            <div
              key={s.key}
              className="splash-shard"
              style={{
                clipPath: s.clipPath,
                animationDelay: `${s.delay}ms`,
                '--tx': `${s.tx}px`,
                '--ty': `${s.ty}px`,
                '--tz': `${s.tz}px`,
                '--rx': `${s.rx}deg`,
                '--ry': `${s.ry}deg`,
                '--rz': `${s.rz}deg`,
              }}
            />
          ))}
        </div>
        <h1 className="splash-title">Chatroom</h1>
        <p className="splash-tagline">即時聊天，隨時連結</p>
      </div>
    </div>
  );
}

export default SplashScreen;
