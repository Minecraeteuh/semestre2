import { useEffect, useState } from "react";
import api from "../services/api"; // Ton instance avec le token

export default function Dashboard() {
  const [boards, setBoards] = useState([]);

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const res = await api.get("/boards");
      // Strapi V5 renvoie souvent les données dans res.data.data
      setBoards(res.data.data || []);
    } catch (err) {
      console.error("Erreur lors du chargement des tableaux :", err);
    }
  };

  const handleCreateBoard = async () => {
    const title = prompt("Nom du nouveau tableau :");
    if (!title) return;

    try {
      // On envoie le titre à Strapi
      await api.post("/boards", { data: { title } });
      fetchBoards(); // On rafraîchit la liste
    } catch (err) {
      alert("Erreur : Vérifie les permissions 'create' dans Strapi");
    }
  };

  return (
    <div style={{ padding: "30px", color: "white" }}>
      <h1>Mes Projets SupTaskFlow</h1>
      
      <div style={{ display: "flex", gap: "20px", marginTop: "20px", flexWrap: "wrap" }}>
        {/* Affichage des tableaux existants */}
        {boards.map((board) => (
          <div key={board.id} style={{ 
            padding: "20px", 
            border: "1px solid #444", 
            borderRadius: "8px",
            minWidth: "150px",
            backgroundColor: "#222"
          }}>
            {board.attributes?.title || board.title}
          </div>
        ))}

        {/* LE BOUTON QUI MANQUE */}
        <button 
          onClick={handleCreateBoard}
          style={{
            padding: "20px",
            border: "2px dashed #666",
            borderRadius: "8px",
            backgroundColor: "transparent",
            color: "#aaa",
            cursor: "pointer",
            minWidth: "150px"
          }}
        >
          + Nouveau Tableau
        </button>
      </div>
    </div>
  );
}