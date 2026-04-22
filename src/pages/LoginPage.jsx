import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuthErrorMessage, loginWithEmail, loginWithGoogle } from '../services/authService';
import { sanitizeInput } from '../utils/sanitize';
import GoogleLoginBtn from '../components/auth/GoogleLoginBtn';
import './auth.css';

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const cleanEmail = sanitizeInput(email).trim();
    if (!cleanEmail || !password) {
      setError('請填寫 Email 與密碼');
      return;
    }
    setSubmitting(true);
    try {
      await loginWithEmail(cleanEmail, password);
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
          <h1>Chatroom</h1>
          <p>歡迎回來，請登入您的帳號</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="login-password">密碼</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="輸入您的密碼"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? '登入中...' : '登入'}
          </button>
        </form>

        <div className="auth-divider">或</div>
        <GoogleLoginBtn onClick={handleGoogle} disabled={submitting} />

        <p className="auth-switch">
          還沒有帳號？<Link to="/register">立即註冊</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
