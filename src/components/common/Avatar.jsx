import { useState } from 'react';
import './Avatar.css';

const SIZE_PX = { sm: 32, md: 40, lg: 56, xl: 96 };

function Avatar({ src, alt = '', name = '', size = 'md' }) {
  const [errored, setErrored] = useState(false);
  const px = typeof size === 'number' ? size : SIZE_PX[size] ?? SIZE_PX.md;
  const initial = (name || alt || '?').trim().charAt(0).toUpperCase();
  const showImage = src && !errored;

  return (
    <div
      className="avatar"
      style={{ width: px, height: px, fontSize: Math.max(12, px * 0.42) }}
      aria-label={alt || name}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt || name}
          onError={() => setErrored(true)}
          loading="lazy"
        />
      ) : (
        <span className="avatar-fallback">{initial}</span>
      )}
    </div>
  );
}

export default Avatar;
