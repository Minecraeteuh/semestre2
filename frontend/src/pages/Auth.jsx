import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

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
        // 🔐 CONNEXION : Strapi attend "identifier" et "password"
        const res = await api.post("/auth/local", {
          identifier: email, // Strapi utilise 'identifier' pour l'email ou le username
          password: password,
        });
        
        localStorage.setItem("jwt", res.data.jwt);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        navigate("/dashboard");
      } else {
        // 📝 INSCRIPTION
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
    <div style={s.page}>
      <div style={s.container}>
        <h1 style={s.logo}>SupTaskFlow</h1>
        <p style={s.status}>&gt;_AUTH_REQUIRED</p>

        <form onSubmit={handleSubmit} style={s.form}>
          {error && <div style={s.errorBadge}>ERREUR_SYSTEM: {error}</div>}
          
          {!isLogin && (
            <input name="username" placeholder="USERNAME" style={s.input} required />
          )}
          
          <input 
            name="email" 
            type="text" 
            placeholder="EMAIL_OR_USER" 
            style={s.input} 
            required 
          />
          
          <input 
            name="password" 
            type="password" 
            placeholder="PASSWORD" 
            style={s.input} 
            required 
          />

          <button type="submit" style={s.btn} disabled={loading}>
            {loading ? "_PROCESSING..." : `[ ${isLogin ? "LOGIN" : "REGISTER"} ]`}
          </button>
        </form>

        <button onClick={() => setIsLogin(!isLogin)} style={s.switch}>
          // {isLogin ? "No account? register_here" : "Have account? login_here"}
        </button>
      </div>
    </div>
  );
}

const s = {
  page: { height: "100vh", backgroundColor: "#050505", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: "monospace" },
  container: { width: "350px", padding: "40px", borderLeft: "2px solid #111" },
  logo: { color: "#00ff88", fontSize: "28px", marginBottom: "5px", textAlign: "center" },
  status: { color: "#333", fontSize: "10px", textAlign: "center", marginBottom: "40px" },
  form: { display: "flex", flexDirection: "column", gap: "15px" },
  input: { backgroundColor: "#000", border: "1px solid #111", padding: "12px", color: "#00ff88", outline: "none" },
  btn: { backgroundColor: "#00ff88", color: "#000", border: "none", padding: "12px", fontWeight: "bold", cursor: "pointer", marginTop: "10px" },
  errorBadge: { border: "1px solid #ff4444", color: "#ff4444", padding: "10px", fontSize: "11px", marginBottom: "10px" },
  switch: { background: "none", border: "none", color: "#222", fontSize: "10px", marginTop: "20px", cursor: "pointer", width: "100%" }
};