import { useEffect, useRef, useState } from 'react';
import { sendMessage, editMessage } from '../../services/messageService';
import { uploadMessageImage } from '../../services/imgbbService';
import { sanitizeInput } from '../../utils/sanitize';
import { MESSAGE_TYPES } from '../../utils/constants';
import GifPicker from './GifPicker';
import EmojiPicker from './EmojiPicker';
import './MessageInput.css';

function MessageInput({
  chatroomId,
  currentUser,
  userProfile,
  disabled = false,
  disabledReason = '',
  editingMessage = null,
  onCancelEdit,
}) {
  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingImage, setPendingImage] = useState(null); // { file, previewUrl }
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState('');
  const [gifOpen, setGifOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setValue('');
    setPendingImage(null);
    setImageError('');
    setGifOpen(false);
    setEmojiOpen(false);
  }, [chatroomId]);

  useEffect(() => {
    if (editingMessage) {
      setValue(editingMessage.content || '');
      setPendingImage(null);
      textareaRef.current?.focus();
    } else {
      setValue('');
    }
  }, [editingMessage]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`;
  }, [value]);

  useEffect(() => {
    return () => {
      if (pendingImage?.previewUrl) URL.revokeObjectURL(pendingImage.previewUrl);
    };
  }, [pendingImage]);

  const isEditing = !!editingMessage;

  const send = async () => {
    if (sending || !chatroomId || !currentUser) return;

    if (isEditing) {
      const content = sanitizeInput(value).trim();
      if (!content) return;
      setSending(true);
      try {
        await editMessage(chatroomId, editingMessage.id, content);
        onCancelEdit?.();
      } catch (err) {
        console.error('editMessage:', err);
      } finally {
        setSending(false);
      }
      return;
    }

    if (pendingImage) {
      setUploading(true);
      setImageError('');
      try {
        const url = await uploadMessageImage(chatroomId, pendingImage.file);
        await sendMessage(chatroomId, {
          type: MESSAGE_TYPES.IMAGE,
          content: url,
          senderId: currentUser.uid,
          senderName: userProfile?.username || currentUser.displayName || '使用者',
          senderPhoto: userProfile?.photoURL || currentUser.photoURL || '',
        });
        URL.revokeObjectURL(pendingImage.previewUrl);
        setPendingImage(null);
      } catch (err) {
        console.error('uploadMessageImage:', err);
        setImageError(err?.message || '圖片上傳失敗');
      } finally {
        setUploading(false);
      }
      return;
    }

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
    if (e.key === 'Escape' && isEditing) {
      e.preventDefault();
      onCancelEdit?.();
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handlePickImage = () => {
    if (isEditing || disabled) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImageError('');
    if (!file.type?.startsWith('image/')) {
      setImageError('檔案格式不支援（僅支援圖片）');
      return;
    }
    if (file.size > 32 * 1024 * 1024) {
      setImageError('圖片太大（上限 32 MB）');
      return;
    }
    if (pendingImage?.previewUrl) URL.revokeObjectURL(pendingImage.previewUrl);
    setPendingImage({ file, previewUrl: URL.createObjectURL(file) });
  };

  const cancelImage = () => {
    if (pendingImage?.previewUrl) URL.revokeObjectURL(pendingImage.previewUrl);
    setPendingImage(null);
    setImageError('');
  };

  const handleInsertEmoji = (emoji) => {
    const ta = textareaRef.current;
    if (!ta) {
      setValue((v) => v + emoji);
      return;
    }
    const start = ta.selectionStart ?? value.length;
    const end = ta.selectionEnd ?? value.length;
    const next = value.slice(0, start) + emoji + value.slice(end);
    setValue(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + emoji.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  const handleSelectGif = async (gifUrl) => {
    setGifOpen(false);
    if (!chatroomId || !currentUser || sending) return;
    setSending(true);
    try {
      await sendMessage(chatroomId, {
        type: MESSAGE_TYPES.GIF,
        content: gifUrl,
        senderId: currentUser.uid,
        senderName: userProfile?.username || currentUser.displayName || '使用者',
        senderPhoto: userProfile?.photoURL || currentUser.photoURL || '',
      });
    } catch (err) {
      console.error('sendGif:', err);
    } finally {
      setSending(false);
    }
  };

  const sendDisabled =
    disabled ||
    sending ||
    uploading ||
    (isEditing
      ? !value.trim()
      : pendingImage
        ? false
        : !value.trim());

  return (
    <div className="message-input-wrap">
      {disabled && disabledReason && (
        <div className="message-input-blocked-banner">🚫 {disabledReason}</div>
      )}

      {isEditing && (
        <div className="message-input-edit-banner">
          <span className="message-input-edit-banner-label">✏️ 正在編輯訊息</span>
          <button type="button" className="message-input-edit-banner-cancel" onClick={onCancelEdit}>
            取消
          </button>
        </div>
      )}

      {pendingImage && !isEditing && (
        <div className="message-input-preview">
          <img src={pendingImage.previewUrl} alt="預覽" className="message-input-preview-img" />
          <div className="message-input-preview-meta">
            <span className="message-input-preview-name" title={pendingImage.file.name}>
              {pendingImage.file.name}
            </span>
            <button
              type="button"
              className="message-input-preview-cancel"
              onClick={cancelImage}
              disabled={uploading}
            >
              移除
            </button>
          </div>
        </div>
      )}

      {imageError && <p className="message-input-error">{imageError}</p>}

      <div className="message-input">
        <GifPicker
          isOpen={gifOpen}
          onClose={() => setGifOpen(false)}
          onSelect={handleSelectGif}
        />
        <EmojiPicker
          isOpen={emojiOpen}
          onClose={() => setEmojiOpen(false)}
          onSelect={(emoji) => {
            handleInsertEmoji(emoji);
          }}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleFileChange}
        />
        <button
          type="button"
          className="message-input-icon"
          onClick={handlePickImage}
          disabled={disabled || isEditing || uploading}
          title={isEditing ? '編輯模式不可附加圖片' : '附加圖片'}
          aria-label="附加圖片"
        >
          📎
        </button>
        <button
          type="button"
          className="message-input-icon message-input-gif-btn"
          onClick={() => setGifOpen((s) => !s)}
          disabled={disabled || isEditing || uploading || sending}
          title={isEditing ? '編輯模式不可發送 GIF' : '發送 GIF'}
          aria-label="發送 GIF"
        >
          GIF
        </button>
        <button
          type="button"
          className="message-input-icon"
          onClick={() => setEmojiOpen((s) => !s)}
          disabled={disabled || uploading}
          title="插入表情符號"
          aria-label="插入表情符號"
        >
          😊
        </button>
        <textarea
          ref={textareaRef}
          className="message-input-textarea"
          placeholder={
            disabled
              ? '無法發送訊息'
              : isEditing
                ? '編輯訊息... (Enter 儲存，Esc 取消)'
                : '輸入訊息... (Enter 發送，Shift+Enter 換行)'
          }
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || sending || uploading}
          rows={1}
        />
        <button
          type="button"
          className="message-input-send"
          onClick={send}
          disabled={sendDisabled}
          title={isEditing ? '儲存編輯' : '發送'}
        >
          {uploading ? '⏳' : isEditing ? '✓' : '➤'}
        </button>
      </div>
    </div>
  );
}

export default MessageInput;
