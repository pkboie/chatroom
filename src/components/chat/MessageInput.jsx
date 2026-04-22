import { useEffect, useRef, useState } from 'react';
import { sendMessage } from '../../services/messageService';
import { sanitizeInput } from '../../utils/sanitize';
import { MESSAGE_TYPES } from '../../utils/constants';
import './MessageInput.css';

function MessageInput({ chatroomId, currentUser, userProfile, disabled = false }) {
  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    setValue('');
  }, [chatroomId]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`;
  }, [value]);

  const send = async () => {
    if (sending || !chatroomId || !currentUser) return;
    const content = sanitizeInput(value).trim();
    if (!content) return;

    setSending(true);
    try {
      await sendMessage(chatroomId, {
        type: MESSAGE_TYPES.TEXT,
        content,
        senderId: currentUser.uid,
        senderName: userProfile?.username || currentUser.displayName || '使用者',
        senderPhoto: userProfile?.photoURL || currentUser.photoURL || '',
      });
      setValue('');
    } catch (err) {
      console.error('sendMessage:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="message-input">
      <textarea
        ref={textareaRef}
        className="message-input-textarea"
        placeholder={disabled ? '無法發送訊息' : '輸入訊息... (Enter 發送，Shift+Enter 換行)'}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled || sending}
        rows={1}
      />
      <button
        type="button"
        className="message-input-send"
        onClick={send}
        disabled={disabled || sending || !value.trim()}
        title="發送"
      >
        ➤
      </button>
    </div>
  );
}

export default MessageInput;
