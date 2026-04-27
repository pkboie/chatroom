import { useEffect, useState } from 'react';
import './SplashScreen.css';

const VISIBLE_MS = 1600;
const FADE_MS = 500;

function SplashScreen() {
  const [leaving, setLeaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), VISIBLE_MS);
    const t2 = setTimeout(() => setDone(true), VISIBLE_MS + FADE_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (done) return null;

  return (
    <div className={`splash ${leaving ? 'is-leaving' : ''}`} aria-hidden>
      <div className="splash-stage">
        <div className="splash-logo-wrap">
          <div className="splash-logo-glow" />
          <img className="splash-logo" src="/favicon.svg" alt="" />
        </div>
        <h1 className="splash-title">Chatroom</h1>
        <p className="splash-tagline">即時聊天，隨時連結</p>
      </div>
    </div>
  );
}

export default SplashScreen;
