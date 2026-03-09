import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "Auth.css";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.target);
    const email = formData.get("email");
    const password = formData.get("password");
    const username = formData.get("username");

    try {
      if (isLogin) {
        // Connexion
        const res = await api.post("/auth/local", {
          identifier: email,
          password: password,
        });
        
        localStorage.setItem("jwt", res.data.jwt);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        navigate("/dashboard");
      } else {
        // Register
        const res = await api.post("/auth/local/register", {
          username: username,
          email: email,
          password: password,
        });
        
        localStorage.setItem("jwt", res.data.jwt);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("DÉTAILS ERREUR AUTH:", err.response?.data);
      setError(err.response?.data?.error?.message || "Identifiants invalides.");
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="auth-page">
        <div className="auth-container">
          <h1 className="auth-logo">SupTaskFlow</h1>
          <p className="auth-status">&gt;_AUTH_REQUIRED</p>
          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="auth-error-badge">ERREUR_SYSTEM: {error}</div>}
            {!isLogin && (
                <input name="username" placeholder="USERNAME" className="auth-input" required />
            )}
            <input
                name="email"
                type="text"
                placeholder="EMAIL_OR_USER"
                className="auth-input"
                required
            />
            <input
                name="password"
                type="password"
                placeholder="PASSWORD"
                className="auth-input"
                required
            />
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? "_PROCESSING..." : `[ ${isLogin ? "LOGIN" : "REGISTER"} ]`}
            </button>
          </form>

          <button onClick={() => setIsLogin(!isLogin)} className="auth-switch">
            // {isLogin ? "No account? register_here" : "Have account? login_here"}
          </button>
        </div>
      </div>
  );
}