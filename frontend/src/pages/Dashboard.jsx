import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

// 1. On récupère l'utilisateur ICI (une seule fois au chargement de la page)
const userString = localStorage.getItem("user");
const user = userString ? JSON.parse(userString) : null;

// 2. Vérifie bien que c'est "author" TOUT EN MINUSCULE dans Strapi
const NOM_DU_CHAMP_STRAPI = "author"; 

export default function Dashboard() {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fonction pour charger les projets
  const fetchBoards = async () => {
    if (!user) return;
    try {
      // On demande les projets avec le filtre
      const res = await api.get(`/boards?filters[${NOM_DU_CHAMP_STRAPI}][id][$eq]=${user.id}`);
      setBoards(res.data.data || []);
    } catch (e) {
      console.warn("Filtre échoué, chargement sans filtre...");
      const res = await api.get("/boards");
      setBoards(res.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  // Ce useEffect ne s'exécute QU'UNE SEULE FOIS au démarrage
  useEffect(() => {
    if (!user) {
      navigate("/");
    } else {
      fetchBoards();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const createBoard = async () => {
    const title = prompt("Nom du nouveau projet ?");
    if (!title) return;
    
    try {
      await api.post("/boards", {
        data: { 
          title, 
          publishedAt: new Date().toISOString(),
          [NOM_DU_CHAMP_STRAPI]: user.id 
        }
      });
      fetchBoards();
    } catch (e) {
      console.error("ERREUR_CREATION:", e.response?.data?.error);
      alert("Erreur de création. Vérifie la console (F12)");
    }
  };

  const deleteBoard = async (e, id) => {
    e.stopPropagation();
    if (!confirm("Supprimer ?")) return;
    try {
      await api.delete(`/boards/${id}`);
      fetchBoards();
    } catch (e) { console.error(e); }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/"; // Force le rechargement propre
  };

  if (loading) return <div style={{textAlign: 'center', color: '#00ff88', marginTop: '100px'}}>_system_reboot...</div>;

  return (
    <div style={s.page}>
      <header style={s.header}>
        <h1 style={s.logo}>SupTaskFlow <span style={s.version}>v1.1.7</span></h1>
        <div style={s.headerActions}>
          <button onClick={createBoard} style={s.createBtn}>[+] NEW_PROJECT</button>
          <button onClick={handleLogout} style={s.logoutBtn}>[ LOGOUT ]</button>
        </div>
      </header>

      <div style={s.grid}>
        {boards.map((b) => (
          <div key={b.id} style={s.card} onClick={() => navigate(`/board/${b.documentId || b.id}`)}>
             <div style={s.cardHeader}>
                <h2 style={s.cardTitle}>{b.title}</h2>
                <button onClick={(e) => deleteBoard(e, b.documentId || b.id)} style={s.delBtn}>DEL</button>
             </div>
          </div>
        ))}
        {boards.length === 0 && <div style={s.empty}>// No projects found for {user?.username}.</div>}
      </div>
    </div>
  );
}

const s = {
  page: { padding: "50px", backgroundColor: "#050505", minHeight: "100vh", color: "#eee", fontFamily: "monospace" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "60px", borderBottom: "1px solid #111", paddingBottom: "20px" },
  headerActions: { display: "flex", gap: "15px" },
  logo: { fontSize: "20px", fontWeight: "bold" },
  version: { fontSize: "10px", color: "#444", marginLeft: "10px" },
  createBtn: { backgroundColor: "#00ff88", color: "#000", border: "none", padding: "10px 20px", fontWeight: "bold", cursor: "pointer" },
  logoutBtn: { backgroundColor: "transparent", color: "#ff4444", border: "1px solid #ff4444", padding: "10px 20px", cursor: "pointer" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "25px" },
  card: { backgroundColor: "#0a0a0a", border: "1px solid #111", padding: "20px", cursor: "pointer" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: "16px", margin: 0, color: "#fff", textTransform: "uppercase" },
  delBtn: { background: "none", border: "1px solid #222", color: "#444", fontSize: "10px", cursor: "pointer" },
  empty: { gridColumn: "1/-1", padding: "40px", color: "#222", border: "1px dashed #111", textAlign: "center" }
};