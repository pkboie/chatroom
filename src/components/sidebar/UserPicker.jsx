import { useEffect, useMemo, useState } from 'react';
import Avatar from '../common/Avatar';
import LoadingSpinner from '../common/LoadingSpinner';
import { getAllUsers } from '../../services/userService';
import { sanitizeInput } from '../../utils/sanitize';
import './UserPicker.css';

function UserPicker({
  excludeUid,
  excludeUids = [],
  multi = false,
  selectedIds = [],
  onChange,
  emptyText = '查無使用者',
}) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getAllUsers({ excludeUid })
      .then((list) => {
        if (alive) setUsers(list);
      })
      .catch((err) => console.error('UserPicker getAllUsers:', err))
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [excludeUid]);

  const filtered = useMemo(() => {
    const excludeSet = new Set(excludeUids);
    const q = sanitizeInput(keyword).trim().toLowerCase();
    return users
      .filter((u) => !excludeSet.has(u.uid))
      .filter((u) => {
        if (!q) return true;
        const username = (u.username || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        return username.includes(q) || email.includes(q);
      });
  }, [users, keyword, excludeUids]);

  const toggle = (user) => {
    if (multi) {
      const next = selectedIds.includes(user.uid)
        ? selectedIds.filter((id) => id !== user.uid)
        : [...selectedIds, user.uid];
      onChange?.(next, users);
    } else {
      onChange?.([user.uid], users);
    }
  };

  return (
    <div className="user-picker">
      <input
        type="text"
        className="user-picker-search"
        placeholder="搜尋使用者名稱或 Email"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />

      <div className="user-picker-list">
        {loading ? (
          <div className="user-picker-state"><LoadingSpinner size={24} /></div>
        ) : filtered.length === 0 ? (
          <p className="user-picker-state user-picker-empty">{emptyText}</p>
        ) : (
          filtered.map((u) => {
            const checked = selectedIds.includes(u.uid);
            return (
              <button
                type="button"
                key={u.uid}
                className={`user-picker-item ${checked ? 'is-selected' : ''}`}
                onClick={() => toggle(u)}
              >
                <Avatar src={u.photoURL} name={u.username} size="sm" />
                <div className="user-picker-meta">
                  <p className="user-picker-name">{u.username}</p>
                  <p className="user-picker-email">{u.email}</p>
                </div>
                <span className={`user-picker-check ${checked ? 'is-on' : ''}`}>
                  {checked ? '✓' : ''}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export default UserPicker;
