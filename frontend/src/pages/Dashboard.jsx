import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { boardService } from "../services/boardService";
import "./Dashboard.css";

import Navbar from "../components/Navbar";
import ProjectCard from "../components/ProjectCard";

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
      loadBoards(u.id);
    } else {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const loadBoards = async (userId) => {
    try {
      setLoading(true);
      const myBoards = await boardService.getUserBoards(userId);
      setBoards(myBoards);
    } catch (e) {
      console.error("Erreur de récupération des projets:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async () => {
    const title = window.prompt("Saisissez le nom du nouveau projet :");
    if (!title) return;

    try {
      await boardService.createBoard(title, user.id);
      loadBoards(user.id);
    } catch (e) {
      console.error("Erreur de création du projet:", e);
      alert("Impossible de créer le projet. Vérifiez votre connexion.");
    }
  };

  const handleDeleteBoard = async (project) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce projet ? Toutes les données associées seront perdues.")) return;

    try {
      const docId = project.documentId || project.id;
      await boardService.deleteBoard(docId);
      loadBoards(user.id);
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
        <Navbar user={user} onLogout={handleLogout} />

        <div className="dash-content">
          <div className="dash-header">
            <h2 className="dash-subtitle">Mes projets</h2>
            <button onClick={handleCreateBoard} className="dash-create-btn">+ Nouveau projet</button>
          </div>

          <div className="dash-grid">
            {boards.length === 0 ? (
                <div className="dash-empty">Aucun projet trouvé. Créez votre premier projet pour commencer.</div>
            ) : (
                boards.map((b) => (
                    <ProjectCard
                        key={b.id}
                        project={b}
                        onClick={() => navigate(`/board/${b.documentId || b.id}`)}
                        onDelete={handleDeleteBoard}
                    />
                ))
            )}
          </div>
        </div>
      </div>
  );
}