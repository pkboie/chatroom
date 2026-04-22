import { useState } from 'react';
import Modal from '../common/Modal';
import UserPicker from './UserPicker';
import { createChatroom, findPrivateChatroom } from '../../services/chatroomService';
import { sanitizeInput } from '../../utils/sanitize';
import './CreateRoomModal.css';

function CreateRoomModal({ isOpen, onClose, currentUser, onCreated }) {
  const [type, setType] = useState('private');
  const [groupName, setGroupName] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setType('private');
    setGroupName('');
    setSelectedIds([]);
    setSelectedUsers([]);
    setError('');
    setSubmitting(false);
  };

  const close = () => {
    reset();
    onClose?.();
  };

  const handleChange = (ids, allUsers) => {
    setSelectedIds(ids);
    setSelectedUsers(allUsers.filter((u) => ids.includes(u.uid)));
  };

  const handleSubmit = async () => {
    setError('');

    if (selectedIds.length === 0) {
      setError(type === 'private' ? '請選擇一位聊天對象' : '請至少選擇一位成員');
      return;
    }
    if (type === 'private' && selectedIds.length !== 1) {
      setError('私聊只能選一位對象');
      return;
    }

    const cleanGroupName = sanitizeInput(groupName).trim();
    if (type === 'group' && !cleanGroupName) {
      setError('請輸入群組名稱');
      return;
    }

    setSubmitting(true);
    try {
      if (type === 'private') {
        const otherUid = selectedIds[0];
        const existing = await findPrivateChatroom(currentUser.uid, otherUid);
        if (existing) {
          onCreated?.(existing.id);
          close();
          return;
        }
        const otherUser = selectedUsers[0];
        const newId = await createChatroom({
          name: otherUser?.username || '私聊',
          type: 'private',
          members: [currentUser.uid, otherUid],
          createdBy: currentUser.uid,
        });
        onCreated?.(newId);
      } else {
        const newId = await createChatroom({
          name: cleanGroupName,
          type: 'group',
          members: [currentUser.uid, ...selectedIds],
          createdBy: currentUser.uid,
        });
        onCreated?.(newId);
      }
      close();
    } catch (err) {
      console.error(err);
      setError('建立失敗，請稍後再試');
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title="新聊天"
      size="md"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={close} disabled={submitting}>
            取消
          </button>
          <button type="button" className="btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? '建立中...' : '建立'}
          </button>
        </>
      }
    >
      <div className="create-room">
        <div className="create-room-tabs">
          <button
            type="button"
            className={`create-room-tab ${type === 'private' ? 'is-active' : ''}`}
            onClick={() => {
              setType('private');
              setSelectedIds([]);
              setSelectedUsers([]);
            }}
          >
            私聊
          </button>
          <button
            type="button"
            className={`create-room-tab ${type === 'group' ? 'is-active' : ''}`}
            onClick={() => {
              setType('group');
              setSelectedIds([]);
              setSelectedUsers([]);
            }}
          >
            群聊
          </button>
        </div>

        {type === 'group' && (
          <input
            type="text"
            className="create-room-name"
            placeholder="群組名稱"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            maxLength={40}
          />
        )}

        <UserPicker
          excludeUid={currentUser?.uid}
          multi={type === 'group'}
          selectedIds={selectedIds}
          onChange={handleChange}
        />

        {error && <div className="create-room-error">{error}</div>}
      </div>
    </Modal>
  );
}

export default CreateRoomModal;
