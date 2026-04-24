import { useEffect, useRef } from 'react';
import './EmojiPicker.css';

const GROUPS = [
  {
    name: '表情',
    items: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
      '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
      '😘', '😗', '☺️', '😚', '😙', '🥲', '😋', '😛',
      '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
      '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄',
      '😬', '😮‍💨', '🤥', '😌', '😔', '😪', '🤤', '😴',
    ],
  },
  {
    name: '心情',
    items: [
      '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺',
      '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱',
      '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤',
      '😡', '😠', '🤬', '🥵', '🥶', '😎', '🤓', '🧐',
    ],
  },
  {
    name: '手勢',
    items: [
      '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '👊',
      '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🙏',
      '💪', '👋', '🤚', '🖐️', '✋', '🖖', '👉', '👈',
    ],
  },
  {
    name: '愛心',
    items: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
      '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
      '💘', '💝', '💟', '♥️', '💯', '💢', '💥', '💫',
    ],
  },
  {
    name: '其他',
    items: [
      '🔥', '✨', '🎉', '🎊', '🎁', '🎂', '🍰', '🍕',
      '🍔', '🍟', '☕', '🍺', '🍻', '🌹', '🌸', '🌟',
      '⭐', '🌈', '☀️', '🌙', '⚡', '💡', '💬', '💭',
      '✅', '❌', '❓', '❗', '‼️', '⚠️', '🆗', '🆒',
    ],
  },
];

function EmojiPicker({ isOpen, onClose, onSelect }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onDocClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose?.();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="emoji-picker" ref={panelRef} role="dialog" aria-label="選擇表情符號">
      <div className="emoji-picker-body">
        {GROUPS.map((group) => (
          <section key={group.name} className="emoji-picker-group">
            <p className="emoji-picker-group-title">{group.name}</p>
            <div className="emoji-picker-grid">
              {group.items.map((emoji, i) => (
                <button
                  key={`${group.name}-${i}`}
                  type="button"
                  className="emoji-picker-cell"
                  onClick={() => onSelect?.(emoji)}
                  aria-label={`插入 ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export default EmojiPicker;
