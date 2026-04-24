import { useEffect, useRef, useState } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';
import {
  getTrendingGifs,
  isGiphyConfigured,
  searchGifs,
} from '../../services/giphyService';
import './GifPicker.css';

const SEARCH_DEBOUNCE = 350;

function GifPicker({ isOpen, onClose, onSelect }) {
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    setError(null);
    const t = setTimeout(() => inputRef.current?.focus(), 80);

    const onDocClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose?.();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;
    if (!isGiphyConfigured()) {
      setError('尚未設定 GIPHY API Key');
      return undefined;
    }
    let alive = true;
    setLoading(true);
    setError(null);

    const trimmed = query.trim();
    const t = setTimeout(() => {
      const fetcher = trimmed ? searchGifs(trimmed) : getTrendingGifs();
      fetcher
        .then((list) => {
          if (alive) setGifs(list);
        })
        .catch((err) => {
          if (alive) setError(err.message || '載入失敗');
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
    }, trimmed ? SEARCH_DEBOUNCE : 0);

    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [isOpen, query]);

  if (!isOpen) return null;

  return (
    <div className="gif-picker" ref={panelRef} role="dialog" aria-label="選擇 GIF">
      <div className="gif-picker-header">
        <input
          ref={inputRef}
          className="gif-picker-input"
          type="text"
          placeholder="搜尋 GIF（English works best）"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="button"
          className="gif-picker-close"
          onClick={onClose}
          aria-label="關閉"
        >
          ×
        </button>
      </div>

      <div className="gif-picker-body">
        {loading && (
          <div className="gif-picker-state">
            <LoadingSpinner size={28} />
          </div>
        )}
        {!loading && error && <p className="gif-picker-error">⚠️ {error}</p>}
        {!loading && !error && gifs.length === 0 && (
          <p className="gif-picker-empty">沒有找到符合的 GIF</p>
        )}
        {!loading && !error && gifs.length > 0 && (
          <div className="gif-picker-grid">
            {gifs.map((g) => {
              const img = g.images?.fixed_height || g.images?.original;
              return (
                <button
                  key={g.id}
                  type="button"
                  className="gif-picker-cell"
                  onClick={() => onSelect?.(img.url, g)}
                  title={g.title || 'GIF'}
                >
                  <img src={img.url} alt={g.title || 'GIF'} loading="lazy" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="gif-picker-footer">
        <span className="gif-picker-credit">Powered by GIPHY</span>
      </div>
    </div>
  );
}

export default GifPicker;
