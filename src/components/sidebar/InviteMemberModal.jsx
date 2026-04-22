import { useState } from 'react';
import Modal from '../common/Modal';
import UserPicker from './UserPicker';
import { inviteMembers } from '../../services/chatroomService';
import './CreateRoomModal.css';

function InviteMemberModal({ isOpen, onClose, chatroom, currentUser }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const close = () => {
    setSelectedIds([]);
    setError('');
    setSubmitting(false);
    onClose?.();
  };

  const handleSubmit = async () => {
    setError('');
    if (selectedIds.length === 0) {
      setError('請至少選擇一位成員');
      return;
    }
    setSubmitting(true);
    try {
      await inviteMembers(chatroom.id, selectedIds);
      close();
    } catch (err) {
      console.error(err);
      setError('邀請失敗，請稍後再試');
      setSubmitting(false);
    }
  };

  if (!chatroom) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title="邀請成員"
      size="md"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={close} disabled={submitting}>
            取消
          </button>
          <button type="button" className="btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? '邀請中...' : '邀請'}
          </button>
        </>
      }
    >
      <div className="create-room">
        <UserPicker
          excludeUid={currentUser?.uid}
          excludeUids={chatroom.members || []}
          multi
          selectedIds={selectedIds}
          onChange={(ids) => setSelectedIds(ids)}
          emptyText="沒有可邀請的使用者"
        />
        {error && <div className="create-room-error">{error}</div>}
      </div>
    </Modal>
  );
}

export default InviteMemberModal;
