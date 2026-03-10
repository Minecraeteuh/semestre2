import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Dashboard.css";

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
      const res = await api.get(`/boards?populate=*&sort=createdAt:desc`);
      const allBoards = res.data.data || [];

      // filtrage
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
    const title = prompt("Nom du projet");
    if (!title) return;

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
      alert("Une erreur est survenue lors de la récupération de vos projets.");
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

  if (loading) return <div className="dash-loader">Chargement...</div>;

  return (
      <div className="dash-page">
        <nav className="dash-nav">
          <h1 className="dash-logo">Tableau Kanban</h1>
          <div className="dash-user-zone">
            <span className="dash-username">{user?.username}</span>
            <button onClick={handleLogout} className="dash-logout-btn">Déconnexion</button>
          </div>
        </nav>
        <div className="dash-content">
          <div className="dash-header">
            <h2 className="dash-subtitle">Mes projets</h2>
            <button onClick={onCreateBoard} className="dash-create-btn">+ Nouveau projet</button>
          </div>
          <div className="dash-grid">
            {boards.length === 0 ? (
                <div className="dash-empty">Aucun projet trouvé. Cliquer sur "+ Nouveau projet".</div>
            ) : (
                boards.map((b) => (
                    <div key={b.id} onClick={() => navigate(`/board/${b.documentId || b.id}`)} className="dash-card">
                      <h3 className="dash-card-title">{b.title || b.attributes?.title}</h3>
                      <button onClick={(e) => onDeleteBoard(b, e)} className="dash-del-btn">×</button>
                    </div>
                ))
            )}
          </div>
        </div>
      </div>
  );
}
