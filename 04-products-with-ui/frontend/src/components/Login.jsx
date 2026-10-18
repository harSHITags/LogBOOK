
import React, { useState } from "react";

function Login({ onLogin, onShowRegister, authError })  {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h1>Welcome to LogBook</h1>
        <p>Login to manage your products</p>

        <label>Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter username"
          required
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          required
        />

        <button type="submit" className="btn">
              Login
        </button>

 {authError && (
          <div className="error-msg">{authError}</div>
        )}

        <p>
          Don't have an account?{" "}
          <button
            type="button"
            className="register-link"
            onClick={onShowRegister}
          >
            Register
          </button>
        </p>
      </form>
    </div>
  );
}

export default Login;
