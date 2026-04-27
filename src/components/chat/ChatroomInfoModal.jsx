import { useState } from 'react';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import { useAuth } from '../../contexts/AuthContext';
import { useUsers } from '../../contexts/UsersContext';
import { blockUser, unblockUser } from '../../services/userService';
import { leaveGroup } from '../../services/chatroomService';
import { sanitizeInput } from '../../utils/sanitize';
import './ChatroomInfoModal.css';

function ChatroomInfoModal({ isOpen, onClose, chatroom, onLeft }) {
  const { currentUser, userProfile } = useAuth();
  const { usersById } = useUsers();
  const [busyUid, setBusyUid] = useState(null);
  const [error, setError] = useState(null);
  const [leaving, setLeaving] = useState(false);

  if (!chatroom) return null;

  const isGroup = chatroom.type === 'group';
  const blockedSet = new Set(userProfile?.blockedUsers || []);
  const memberUids = chatroom.members || [];

  const handleLeave = async () => {
    if (!isGroup || !currentUser?.uid || leaving) return;
    const ok = window.confirm('確定要離開此群組嗎？離開後將無法看到後續訊息，需重新被邀請才能加入。');
    if (!ok) return;
    setLeaving(true);
    setError(null);
    try {
      const displayName = userProfile?.username || currentUser.displayName || '使用者';
      await leaveGroup(chatroom.id, currentUser.uid, displayName);
      onLeft?.(chatroom.id);
      onClose?.();
    } catch (err) {
      console.error('leaveGroup:', err);
      setError(err?.message || '離開群組失敗');
    } finally {
      setLeaving(false);
    }
  };

  const handleToggleBlock = async (uid) => {
    if (!currentUser?.uid || uid === currentUser.uid) return;
    setBusyUid(uid);
    setError(null);
    try {
      if (blockedSet.has(uid)) {
        await unblockUser(currentUser.uid, uid);
      } else {
        const ok = window.confirm('封鎖後，雙方在私聊將無法繼續對話，群聊也會互相隱藏訊息。確定？');
        if (!ok) {
          setBusyUid(null);
          return;
        }
        await blockUser(currentUser.uid, uid);
      }
    } catch (err) {
      console.error('toggleBlock:', err);
      setError(err?.message || '操作失敗');
    } finally {
      setBusyUid(null);
    }
  };

  const renderMemberRow = (uid) => {
    const isSelf = uid === currentUser?.uid;
    const user = usersById[uid];
    const name = sanitizeInput(user?.username || '使用者');
    const isBlocked = blockedSet.has(uid);
    const theyBlockedMe = Boolean(
      currentUser?.uid && user?.blockedUsers?.includes(currentUser.uid),
    );
    const buttonDisabled = busyUid === uid || (!isBlocked && theyBlockedMe);
    const buttonLabel = (() => {
      if (busyUid === uid) return '...';
      if (isBlocked) return '解除封鎖';
      if (theyBlockedMe) return '對方已封鎖你';
      return '封鎖';
    })();

    return (
      <li key={uid} className="info-member-row">
        <Avatar src={user?.photoURL} name={name} size="sm" />
        <div className="info-member-meta">
          <p className="info-member-name">
            {name}
            {isSelf && <span className="info-member-self-tag">（你）</span>}
            {!isSelf && isBlocked && (
              <span className="info-member-badge is-blocked-tag">已封鎖</span>
            )}
            {!isSelf && !isBlocked && theyBlockedMe && (
              <span className="info-member-badge is-blocked-tag">對方封鎖你</span>
            )}
          </p>
          <p className="info-member-email" title={user?.email || ''}>
            {user?.email || ''}
          </p>
        </div>
        {!isSelf && (
          <button
            type="button"
            className={`info-member-block-btn ${isBlocked ? 'is-blocked' : ''} ${theyBlockedMe && !isBlocked ? 'is-locked' : ''}`}
            onClick={() => handleToggleBlock(uid)}
            disabled={buttonDisabled}
            title={theyBlockedMe && !isBlocked ? '對方已封鎖你，無需再封鎖' : undefined}
          >
            {buttonLabel}
          </button>
        )}
      </li>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isGroup ? '群組資訊' : '聊天資訊'} size="md">
      <div className="info-body">
        <p className="info-section-title">
          {isGroup ? `成員（${memberUids.length}）` : '對方'}
        </p>
        <ul className="info-member-list">
          {memberUids.map(renderMemberRow)}
        </ul>
        {error && <p className="info-error">⚠️ {error}</p>}

        {isGroup && memberUids.includes(currentUser?.uid) && (
          <div className="info-danger-zone">
            <button
              type="button"
              className="info-leave-btn"
              onClick={handleLeave}
              disabled={leaving}
            >
              {leaving ? '離開中…' : '🚪 離開群組'}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default ChatroomInfoModal;
