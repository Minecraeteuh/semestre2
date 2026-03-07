import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (isLogin) {
        const res = await api.post("/auth/local", {
          identifier: formData.email,
          password: formData.password,
        });
        localStorage.setItem("jwt", res.data.jwt);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        navigate("/dashboard");
      } else {
        const res = await api.post("/auth/local/register", {
          username: formData.username,
          email: formData.email,
          password: formData.password,
        });
        localStorage.setItem("jwt", res.data.jwt);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        navigate("/dashboard");
      }
    } catch (err) {
      setError("ERREUR_SYSTEM: Identifiants invalides.");
      console.error(err);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.box}>
        <h1 style={s.title}>SupTaskFlow</h1>
        <p style={s.subtitle}>{isLogin ? ">_AUTH_REQUIRED" : ">_CREATE_IDENTITY"}</p>

        {error && <div style={s.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={s.form}>
          {!isLogin && (
            <input
              type="text"
              name="username"
              placeholder="USERNAME"
              onChange={handleChange}
              style={s.input}
              required
            />
          )}
          <input
            type="email"
            name="email"
            placeholder="EMAIL_ADDRESS"
            onChange={handleChange}
            style={s.input}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="PASSWORD"
            onChange={handleChange}
            style={s.input}
            required
          />
          <button type="submit" style={s.submitBtn}>
            {isLogin ? "[ LOGIN ]" : "[ REGISTER ]"}
          </button>
        </form>

        <button onClick={() => setIsLogin(!isLogin)} style={s.switchBtn}>
          {isLogin ? "// No account? register_here" : "// Back to login"}
        </button>
      </div>
    </div>
  );
}

const s = {
  page: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#050505", fontFamily: "monospace", color: "#eee" },
  box: { backgroundColor: "#0a0a0a", padding: "40px", border: "1px solid #111", width: "100%", maxWidth: "380px" },
  title: { color: "#00ff88", margin: "0", fontSize: "22px", letterSpacing: "3px", textAlign: "center" },
  subtitle: { color: "#444", fontSize: "11px", textAlign: "center", marginBottom: "30px" },
  form: { display: "flex", flexDirection: "column", gap: "15px" },
  input: { backgroundColor: "#050505", border: "1px solid #222", color: "#00ff88", padding: "12px", fontFamily: "monospace", outline: "none" },
  submitBtn: { backgroundColor: "#00ff88", color: "#000", border: "none", padding: "12px", fontWeight: "bold", cursor: "pointer", marginTop: "10px" },
  switchBtn: { background: "none", border: "none", color: "#444", width: "100%", marginTop: "20px", cursor: "pointer", fontSize: "11px" },
  error: { color: "#ff4444", border: "1px solid #ff4444", padding: "10px", marginBottom: "15px", fontSize: "12px", textAlign: "center" }
};