
import React, { useState } from "react";

function Register({ onRegister, onShowLogin, authError, message }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onRegister(username, email, password);
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h1>Create Account</h1>
        <p>Join LogBook to manage your products</p>

        <label>Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Choose a username"
          required
        />

        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Choose a password"
          required
        />

        <button type="submit" className="btn">
          Register
        </button>

        {message && (
          <div className="success-msg">{message}</div>
        )}

        {authError && (
          <div className="error-msg">{authError}</div>
        )}

        <p>
          Already have an account?{" "}
          <button
            type="button"
            className="register-link"
            onClick={onShowLogin}
          >
            Login
          </button>
        </p>
      </form>
    </div>
  );
}

export default Register;
