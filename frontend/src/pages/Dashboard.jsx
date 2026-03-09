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
    if (storedUser) {
      const u = JSON.parse(storedUser);
      setUser(u);
      fetchBoards(u.id);
    } else {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const fetchBoards = async (userId) => {
    try {
      setLoading(true);
      // On récupère tout sans demander à Strapi de filtrer
      const res = await api.get(`/boards?populate=*&sort=createdAt:desc`);
      const allBoards = res.data.data || [];

      // SÉCURITÉ : On filtre nous-mêmes. Personne ne verra les projets des autres.
      const myBoards = allBoards.filter((b) => {
        const boardAuthorId = b.authorId || b.attributes?.authorId;
        return String(boardAuthorId) === String(userId);
      });

      setBoards(myBoards);
    } catch (e) {
      console.error("Erreur fetch:", e);
    } finally {
      setLoading(false);
    }
  };

  const onCreateBoard = async () => {
    const title = prompt("Nom du projet ?");
    if (!title) return;

    // LE PAYLOAD QUI PASSE À 100% : Un simple texte
    const payload = {
      data: {
        title: title,
        authorId: String(user.id), 
        publishedAt: new Date().toISOString()
      }
    };

    try {
      await api.post("/boards", payload);
      fetchBoards(user.id); 
    } catch (e) {
      console.error("ERREUR:", e.response?.data);
      alert("Erreur de connexion au serveur.");
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

  const handleLogout = () => {
    localStorage.clear();
    navigate("/", { replace: true });
  };

  if (loading) return <div style={s.loader}>_CHARGEMENT_...</div>;

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
            <div style={s.empty}>AUCUN PROJET TROUVÉ. CLIQUEZ SUR + NEW_PROJECT.</div>
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
  header: { display: "flex", justifyContent: "space-between", marginBottom: "40px", alignItems: "center" },
  subtitle: { color: "#444" },
  createBtn: { backgroundColor: "#00ff88", color: "#000", border: "none", padding: "12px 25px", fontWeight: "bold", cursor: "pointer" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "25px" },
  empty: { gridColumn: "1/-1", textAlign: "center", padding: "50px", border: "1px dashed #222", color: "#555" },
  card: { backgroundColor: "#0a0a0a", border: "1px solid #111", padding: "25px", cursor: "pointer", position: "relative" },
  cardTitle: { color: "#fff", margin: "0 0 15px 0" },
  delBtn: { position: "absolute", top: "10px", right: "10px", background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: "20px" }
};