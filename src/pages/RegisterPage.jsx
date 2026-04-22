import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuthErrorMessage, loginWithGoogle, registerWithEmail } from '../services/authService';
import { sanitizeInput } from '../utils/sanitize';
import GoogleLoginBtn from '../components/auth/GoogleLoginBtn';
import './auth.css';

function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const cleanUsername = sanitizeInput(username).trim();
    const cleanEmail = sanitizeInput(email).trim();

    if (!cleanUsername || !cleanEmail || !password) {
      setError('請填寫所有欄位');
      return;
    }
    if (cleanUsername.length < 2) {
      setError('使用者名稱至少 2 個字');
      return;
    }
    if (password.length < 6) {
      setError('密碼至少 6 個字元');
      return;
    }
    if (password !== confirm) {
      setError('兩次輸入的密碼不一致');
      return;
    }

    setSubmitting(true);
    try {
      await registerWithEmail(cleanEmail, password, cleanUsername);
      navigate('/', { replace: true });
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setSubmitting(true);
    try {
      await loginWithGoogle();
      navigate('/', { replace: true });
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <h1>建立帳號</h1>
          <p>加入 Chatroom，開始與朋友聊天</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="reg-username">使用者名稱</label>
            <input
              id="reg-username"
              type="text"
              autoComplete="nickname"
              placeholder="您的暱稱"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="reg-password">密碼</label>
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              placeholder="至少 6 個字元"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="reg-confirm">確認密碼</label>
            <input
              id="reg-confirm"
              type="password"
              autoComplete="new-password"
              placeholder="再次輸入密碼"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={submitting}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? '建立中...' : '註冊'}
          </button>
        </form>

        <div className="auth-divider">或</div>
        <GoogleLoginBtn onClick={handleGoogle} disabled={submitting} label="使用 Google 註冊" />

        <p className="auth-switch">
          已經有帳號？<Link to="/login">前往登入</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
