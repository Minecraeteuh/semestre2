import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { boardService } from "../services/boardService";
import "./Dashboard.css";

import Navbar from "../components/Navbar";
import ProjectCard from "../components/ProjectCard";
import CustomPrompt from "../components/CustomPrompt";

export default function Dashboard() {
  const [boards, setBoards] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [promptConfig, setPromptConfig] = useState({
    isOpen: false,
    title: "",
    defaultValue: "",
    isConfirm: false,
    onConfirm: () => {}
  });

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
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const closePrompt = () => {
    setPromptConfig(prev => ({ ...prev, isOpen: false }));
  };

  const handleCreateBoard = () => {
    setPromptConfig({
      isOpen: true,
      title: "Saisissez le nom du nouveau projet :",
      defaultValue: "",
      isConfirm: false,
      onConfirm: async (title) => {
        if (!title) {
          closePrompt();
          return;
        }
        try {
          await boardService.createBoard(title, user.id);
          loadBoards(user.id);
        } catch (e) {
          console.error(e);
        }
        closePrompt();
      }
    });
  };

  const handleEditBoard = (project) => {
    const currentTitle = project.title || project.attributes?.title;

    setPromptConfig({
      isOpen: true,
      title: "Saisissez le nouveau nom du projet :",
      defaultValue: currentTitle,
      isConfirm: false,
      onConfirm: async (newTitle) => {
        if (!newTitle || newTitle === currentTitle) {
          closePrompt();
          return;
        }
        try {
          const docId = project.documentId || project.id;
          await boardService.updateBoard(docId, { title: newTitle });
          loadBoards(user.id);
        } catch (e) {
          console.error(e);
        }
        closePrompt();
      }
    });
  };

  const handleDeleteBoard = (project) => {
    setPromptConfig({
      isOpen: true,
      title: "Êtes-vous sûr de vouloir supprimer ce projet ? Toutes les données associées seront perdues.",
      defaultValue: "",
      isConfirm: true,
      onConfirm: async () => {
        try {
          const docId = project.documentId || project.id;
          await boardService.deleteBoard(docId);
          loadBoards(user.id);
        } catch (e) {
          console.error(e);
        }
        closePrompt();
      }
    });
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
                        onEdit={handleEditBoard}
                    />
                ))
            )}
          </div>
        </div>

        <CustomPrompt
            isOpen={promptConfig.isOpen}
            title={promptConfig.title}
            defaultValue={promptConfig.defaultValue}
            isConfirm={promptConfig.isConfirm}
            onConfirm={promptConfig.onConfirm}
            onCancel={closePrompt}
        />
      </div>
  );
}