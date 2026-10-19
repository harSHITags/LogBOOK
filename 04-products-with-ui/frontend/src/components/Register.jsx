
import React, { useEffect, useRef, useState } from "react";
import AuthShowcase from "./AuthShowcase";

function Register({ onRegister, onShowLogin, authError, message }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // A successful registration unmounts this component, so guard the state update.
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
      await onRegister(username.trim(), email.trim(), password);
    } finally {
      if (mounted.current) setSubmitting(false);
    }
  };

  return (
    <main className="auth">
      <AuthShowcase
        title="A little more order. A lot less clutter."
        text="Create your LogBook account and bring product details, pricing, and stock information into one simple workspace."
        footer="A fresh start for a more organized workday."
      />

      <div className="auth-main">
        <div className="auth-mobile-brand">
          <img src="/logbook-logo.png" alt="LogBook logo" className="logo-image logo-image-mobile" />
        </div>

        <form onSubmit={handleSubmit} className="auth-card">
          <h1>Create your account</h1>
          <p className="auth-lead">Set up your account to start managing your inventory.</p>

          <div className="auth-fields">
            <div className="field">
              <label htmlFor="register-username">Username</label>
              <input
                id="register-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="register-email">Email address</label>
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="register-password">Password</label>
              <div className="password-wrap">
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
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
            {submitting ? "Creating account…" : "Create account"}
          </button>

          <p className="auth-switch">
            Already have an account?{" "}
            <button type="button" className="link-btn" onClick={onShowLogin}>
              Sign in
            </button>
          </p>
        </form>
      </div>
    </main>
  );
}

export default Register;