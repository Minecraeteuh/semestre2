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

      const myBoards = allBoards.filter((b) => {
        const boardAuthorId = b.authorId || b.attributes?.authorId;
        return String(boardAuthorId) === String(userId);
      });

      setBoards(myBoards);
    } catch (e) {
      console.error("Erreur de récupération des projets:", e);
    } finally {
      setLoading(false);
    }
  };

  const onCreateBoard = async () => {
    const title = window.prompt("Saisissez le nom du nouveau projet :");
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
      console.error("Erreur de création du projet:", e);
      alert("Impossible de créer le projet. Vérifiez votre connexion.");
    }
  };

  const onDeleteBoard = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce projet ? Toutes les données associées seront perdues.")) return;

    try {
      const docId = id.documentId || id;
      await api.delete(`/boards/${docId}`);
      fetchBoards(user.id);
    } catch (e) {
      console.error("Erreur de suppression du projet:", e);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/", { replace: true });
  };

  if (loading) return <div className="dash-loader">Chargement des projets...</div>;

  return (
      <div className="dash-page">
        <nav className="dash-nav">
          <h1 className="dash-logo">SupTaskFlow</h1>
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
                <div className="dash-empty">Aucun projet trouvé. Créez votre premier projet pour commencer.</div>
            ) : (
                boards.map((b) => (
                    <div key={b.id} onClick={() => navigate(`/board/${b.documentId || b.id}`)} className="dash-card">
                      <h3 className="dash-card-title">{b.title || b.attributes?.title}</h3>
                      <button onClick={(e) => onDeleteBoard(b, e)} className="dash-del-btn" title="Supprimer le projet">×</button>
                    </div>
                ))
            )}
          </div>
        </div>
      </div>
  );
}