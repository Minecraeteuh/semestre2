import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function Dashboard() {
  const [boards, setBoards] = useState([]);

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const res = await api.get("/boards");
      setBoards(res.data.data || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des tableaux:", err);
    }
  };

  const handleCreateBoard = async () => {
    const title = prompt("Entrez le titre du nouveau tableau :");
    if (!title) return;

    try {
      // Structure Strapi 5 : les données doivent être dans un objet 'data'
      await api.post("/boards", {
        data: {
          title: title,
          publishedAt: new Date().toISOString(), // Pour qu'il soit visible immédiatement
        },
      });
      fetchBoards(); // Rafraîchir la liste après la création
    } catch (err) {
      alert("Erreur lors de la création du tableau. Vérifiez vos permissions Strapi.");
      console.error(err);
    }
  };

  return (
    <div style={{ padding: "30px", color: "white", backgroundColor: "#121212", minHeight: "100vh" }}>
      <h1 style={{ marginBottom: "30px" }}>Mes Projets SupTaskFlow</h1>
      
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        {/* Affichage des tableaux existants */}
        {boards.map((board) => (
          <Link 
            key={board.id} 
            // C'EST ICI LA CORRECTION POUR STRAPI 5 👇
            to={`/board/${board.documentId || board.id}`} 
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div style={{ 
              padding: "20px", 
              border: "1px solid #444", 
              borderRadius: "8px", 
              backgroundColor: "#222", 
              minWidth: "150px",
              textAlign: "center"
            }}>
              {board.attributes?.title || board.title}
            </div>
          </Link>
        ))}

        {/* LE BOUTON POUR AJOUTER */}
        <button 
          onClick={handleCreateBoard}
          style={{ 
            padding: "20px", 
            border: "2px dashed #444", 
            borderRadius: "8px", 
            backgroundColor: "transparent", 
            color: "#888", 
            minWidth: "190px",
            cursor: "pointer",
            fontSize: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "0.3s"
          }}
          onMouseOver={(e) => (e.target.style.borderColor = "#3b82f6", e.target.style.color = "#3b82f6")}
          onMouseOut={(e) => (e.target.style.borderColor = "#444", e.target.style.color = "#888")}
        >
          + Nouveau Tableau
        </button>
      </div>
    </div>
  );
}