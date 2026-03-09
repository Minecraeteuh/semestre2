import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Dashboard() {
  const [boards, setBoards] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    // 🔐 SÉCURITÉ : On vérifie si l'utilisateur est là
    if (storedUser) {
      const u = JSON.parse(storedUser);
      setUser(u);
      fetchBoards(u.id);
    } else {
      // 🎯 CHANGEMENT : On redirige vers "/" (Ta page Auth)
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const fetchBoards = async (userId) => {
    try {
      setLoading(true);
      const res = await api.get(`/boards?populate=*`);
      setBoards(res.data.data || []);
    } catch (e) {
      console.error("Erreur fetch", e);
    } finally {
      setLoading(false);
    }
  };

  const onCreateBoard = async () => {
    const title = prompt("Nom du projet ?");
    if (!title) return;

    try {
      await api.post("/boards", { data: { title, publishedAt: new Date() } });
      fetchBoards(user.id);
    } catch (e) {
      console.error("Erreur création", e);
    }
  };

  const onDeleteBoard = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Supprimer ce projet ?")) return;
    try {
      const docId = id.documentId || id;
      await api.delete(`/boards/${docId}`);
      fetchBoards(user.id);
    } catch (e) { console.error(e); }
  };

  // 🚪 LA FONCTION LOGOUT MISE À JOUR
  const handleLogout = () => {
    localStorage.clear(); 
    // 🎯 CHANGEMENT : Direction "/" pour correspondre à ton App.jsx
    navigate("/", { replace: true }); 
  };

  if (loading) return <div style={s.loader}>_SYNC_...</div>;

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <h1 style={s.logo}>SUP_TASK_FLOW</h1>
        <div style={s.userZone}>
          <span style={s.username}>{user?.username}</span>
          <button onClick={handleLogout} style={s.logoutBtn}>[ DÉCONNEXION ]</button>
        </div>
      </nav>

      <div style={s.content}>
        <div style={s.header}>
          <h2 style={s.subtitle}>MES_PROJETS_ACTIFS</h2>
          <button onClick={onCreateBoard} style={s.createBtn}>+ NEW_PROJECT</button>
        </div>

        <div style={s.grid}>
          {boards.length === 0 ? (
            <div style={s.empty}>AUCUN PROJET TROUVÉ.</div>
          ) : (
            boards.map((b) => (
              <div key={b.id} onClick={() => navigate(`/board/${b.documentId || b.id}`)} style={s.card}>
                <h3 style={s.cardTitle}>{b.title || b.attributes?.title}</h3>
                <button onClick={(e) => onDeleteBoard(b, e)} style={s.delBtn}>×</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { padding: "40px", backgroundColor: "#050505", minHeight: "100vh", color: "#eee", fontFamily: "monospace" },
  loader: { padding: "100px", color: "#00ff88", textAlign: "center" },
  nav: { display: "flex", justifyContent: "space-between", marginBottom: "60px", borderBottom: "1px solid #111", paddingBottom: "20px" },
  logo: { fontSize: "20px", color: "#00ff88", letterSpacing: "2px" },
  userZone: { display: "flex", gap: "20px", alignItems: "center" },
  username: { color: "#666" },
  logoutBtn: { background: "none", border: "none", color: "#ff4444", cursor: "pointer", fontWeight: "bold" },
  content: { maxWidth: "1200px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", marginBottom: "40px" },
  subtitle: { color: "#444" },
  createBtn: { backgroundColor: "#00ff88", color: "#000", border: "none", padding: "12px 25px", fontWeight: "bold", cursor: "pointer" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "20px" },
  card: { backgroundColor: "#0a0a0a", border: "1px solid #111", padding: "20px", cursor: "pointer", position: "relative" },
  cardTitle: { color: "#fff", margin: 0 },
  delBtn: { position: "absolute", top: "5px", right: "5px", background: "none", border: "none", color: "#333", cursor: "pointer", fontSize: "18px" }
};