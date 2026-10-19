import React, { useEffect, useRef, useState } from "react";
import AuthShowcase from "./AuthShowcase";

function Login({ onLogin, onShowRegister, authError, message }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // A successful login unmounts this component, so guard the state update.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onLogin(username.trim(), password);
    } finally {
      if (mounted.current) setSubmitting(false);
    }
  };

  return (
    <main className="auth">
      <AuthShowcase
        title="Bring order to your inventory."
        text="A calmer way to manage products, keep an eye on stock, and stay on top of the details that matter."
        footer="Thoughtfully organized. Ready for your workday."
      />

      <div className="auth-main">
        <div className="auth-mobile-brand">
          <img src="/logbook-logo.png" alt="LogBook logo" className="logo-image logo-image-mobile" />
        </div>

        <form onSubmit={handleSubmit} className="auth-card">
          <h1>Sign in to LogBook</h1>
          <p className="auth-lead">Enter your account details to continue to your workspace.</p>

          <div className="auth-fields">
            <div className="field">
              <label htmlFor="login-username">Username</label>
              <input
                id="login-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="login-password">Password</label>
              <div className="password-wrap">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-pressed={showPassword}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          </div>

          {message && (
            <div className="notice notice-success" role="status">
              <span className="notice-mark" aria-hidden="true">
                <span>✓</span>
              </span>
              {message}
            </div>
          )}

          {authError && (
            <div className="notice notice-error" role="alert">
              <span className="notice-mark" aria-hidden="true">
                <span>!</span>
              </span>
              {authError}
            </div>
          )}

          <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>

          <p className="auth-switch">
            New to LogBook?{" "}
            <button type="button" className="link-btn" onClick={onShowRegister}>
              Create an account
            </button>
          </p>
        </form>
      </div>
    </main>
  );
}

export default Login;
