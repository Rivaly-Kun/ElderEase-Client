import { useEffect, useState } from "react";
import "./App.css";
import { auth } from "./Services/firebase";
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (showErrorModal) {
      const previouslyFocused = document.activeElement;
      const closeButton = document.getElementById("login-error-close");
      closeButton?.focus();

      return () => {
        previouslyFocused instanceof HTMLElement && previouslyFocused.focus();
      };
    }
  }, [showErrorModal]);

  const getFriendlyError = (code) => {
    switch (code) {
      case "auth/user-not-found":
        return "No account exists with that email. Double-check the address or contact your local administrator.";
      case "auth/wrong-password":
        return "Incorrect password. Please try again or get assistance from your local administrator.";
      case "auth/too-many-requests":
        return "Too many attempts. Please wait a moment before trying again.";
      case "auth/invalid-email":
        return "The email address format looks incorrect. Please review and try again.";
      default:
        return "We could not sign you in. Please confirm your credentials or contact your local administrator.";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // set persistence based on "Remember me" checkbox
      await setPersistence(
        auth,
        remember ? browserLocalPersistence : browserSessionPersistence
      );

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      setLoading(false);
      // navigate to dashboard on successful login
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setLoading(false);
      const message = getFriendlyError(err?.code);
      setError(message);
      setShowErrorModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowErrorModal(false);
  };

  return (
    <div className="container">
      {showErrorModal && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-error-title"
        >
          <div className="modal-content">
            <h3 id="login-error-title">Login Attempt Unsuccessful</h3>
            <p>{error}</p>
            <p className="modal-note">
              Need help? Contact your local administrator for password support.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                id="login-error-close"
                className="modal-btn"
                onClick={handleCloseModal}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="left-section">
        <div className="login-card">
          <div className="title-section">
            <h1 className="app-title">ELDER EASE</h1>
            <p className="subtitle">
              Association of Senior Citizens of Brgy. Pinagbuhatan, Pasig City
              Incorporated
            </p>
          </div>

          <div className="form-container">
            <h2 className="login-title">LOG IN</h2>
            <form onSubmit={handleSubmit}>
              <label className="form-label">EMAIL</label>
              <input
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                required
              />

              <label className="form-label">PASSWORD</label>
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    // Eye Off SVG
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="icon"
                    >
                      <path d="M17.94 17.94A10.12 10.12 0 0112 20C7 20 2.73 16.11 1 12c.74-1.8 2.16-3.8 4.08-5.44M9.9 4.24A9.12 9.12 0 0112 4c5 0 9.27 3.89 11 8-1 2.44-3.14 4.74-5.66 6.08M1 1l22 22" />
                    </svg>
                  ) : (
                    // Eye SVG
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="icon"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              <div className="options-row">
                <label className="remember-me">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  Remember me
                </label>
                <span className="support-text">
                  Need access? Contact your local administrator.
                </span>
              </div>
              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? "Signing in..." : "Log In"}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="right-section">
        <img src="/img/imgbg.jpg" alt="San Sebastian Parish" />
        <div className="overlay" />
        <div className="right-gradient" />
      </div>
    </div>
  );
}

export default App;
