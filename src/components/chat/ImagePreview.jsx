import { useEffect } from 'react';
import './ImagePreview.css';

function ImagePreview({ src, onClose }) {
  useEffect(() => {
    if (!src) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      className="image-preview-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <button
        type="button"
        className="image-preview-close"
        onClick={onClose}
        aria-label="關閉預覽"
      >
        ×
      </button>
      <img className="image-preview-img" src={src} alt="圖片預覽" />
    </div>
  );
}

export default ImagePreview;
