import { useEffect, useRef, useState } from 'react';
import { updateProfile } from 'firebase/auth';
import { auth } from '../../config/firebase';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import { updateUserProfile } from '../../services/userService';
import { uploadProfileImage } from '../../services/imgbbService';
import { logout } from '../../services/authService';
import { sanitizeInput } from '../../utils/sanitize';
import './ProfileModal.css';

const MAX_IMAGE_MB = 32;

function ProfileModal({ isOpen, onClose, currentUser, userProfile }) {
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setUsername(userProfile?.username || currentUser?.displayName || '');
    setPhone(userProfile?.phone || '');
    setAddress(userProfile?.address || '');
    setPendingFile(null);
    setPreviewUrl('');
    setError('');
    setSaving(false);
  }, [isOpen, userProfile, currentUser]);

  useEffect(() => {
    if (!pendingFile) {
      setPreviewUrl('');
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  const pickFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('請選擇圖片檔');
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setError(`圖片太大（上限 ${MAX_IMAGE_MB} MB）`);
      return;
    }
    setError('');
    setPendingFile(file);
  };

  const cancelPendingFile = () => setPendingFile(null);

  const handleSave = async () => {
    if (saving) return;
    setError('');

    const cleanUsername = sanitizeInput(username).trim();
    const cleanPhone = sanitizeInput(phone).trim();
    const cleanAddress = sanitizeInput(address).trim();

    if (!cleanUsername) {
      setError('請輸入使用者名稱');
      return;
    }
    if (cleanUsername.length < 2) {
      setError('使用者名稱至少 2 個字');
      return;
    }

    setSaving(true);
    try {
      let photoURL = userProfile?.photoURL || '';
      if (pendingFile) {
        photoURL = await uploadProfileImage(currentUser.uid, pendingFile);
      }

      await updateUserProfile(currentUser.uid, {
        username: cleanUsername,
        phone: cleanPhone,
        address: cleanAddress,
        photoURL,
      });

      try {
        await updateProfile(auth.currentUser, {
          displayName: cleanUsername,
          photoURL,
        });
      } catch (authErr) {
        console.warn('Auth profile update skipped:', authErr);
      }

      onClose?.();
    } catch (err) {
      console.error('profile save failed:', err);
      setError(err.message || '儲存失敗');
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error(err);
    }
  };

  const displayName = username || userProfile?.username || '使用者';
  const avatarSrc = previewUrl || userProfile?.photoURL;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="個人資料"
      size="md"
      footer={
        <>
          <button
            type="button"
            className="btn-ghost-danger"
            onClick={handleLogout}
            disabled={saving}
          >
            登出
          </button>
          <div className="profile-modal-footer-right">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              取消
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '儲存中...' : '儲存'}
            </button>
          </div>
        </>
      }
    >
      <div className="profile-modal">
        <div className="profile-avatar-area">
          <button
            type="button"
            className="profile-avatar-btn"
            onClick={() => fileInputRef.current?.click()}
            title="點擊更換頭像"
            disabled={saving}
          >
            <Avatar src={avatarSrc} name={displayName} size={96} />
            <span className="profile-avatar-hint">更換頭像</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={pickFile}
          />
          {pendingFile && (
            <button
              type="button"
              className="profile-avatar-cancel"
              onClick={cancelPendingFile}
              disabled={saving}
            >
              取消新圖
            </button>
          )}
        </div>

        <div className="profile-fields">
          <div className="profile-field">
            <label htmlFor="profile-username">使用者名稱</label>
            <input
              id="profile-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={saving}
              maxLength={40}
            />
          </div>

          <div className="profile-field">
            <label htmlFor="profile-email">Email</label>
            <input
              id="profile-email"
              type="email"
              value={currentUser?.email || ''}
              readOnly
              disabled
            />
          </div>

          <div className="profile-field">
            <label htmlFor="profile-phone">電話</label>
            <input
              id="profile-phone"
              type="tel"
              placeholder="選填"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={saving}
              maxLength={20}
            />
          </div>

          <div className="profile-field">
            <label htmlFor="profile-address">地址</label>
            <input
              id="profile-address"
              type="text"
              placeholder="選填"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={saving}
              maxLength={120}
            />
          </div>

          {error && <div className="profile-error">{error}</div>}
        </div>
      </div>
    </Modal>
  );
}

export default ProfileModal;
