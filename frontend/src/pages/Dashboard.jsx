import { useEffect, useState } from "react";
import api from "../api/auth"; // Ton instance axios

export default function Dashboard() {
  const [boards, setBoards] = useState([]);

  useEffect(() => {
    // On récupère les tableaux depuis Strapi
    const fetchBoards = async () => {
      try {
        const res = await api.get("/boards"); // L'URL de ton Strapi
        setBoards(res.data.data);
      } catch (err) {
        console.error("Erreur boards:", err);
      }
    };
    fetchBoards();
  }, []);

  return (
    <div style={{ padding: '30px' }}>
      <h1>Mes Projets SupTaskFlow</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        {boards.map(board => (
          <div key={board.id} style={{ padding: '20px', background: '#007bff', color: 'white', borderRadius: '8px' }}>
            {board.attributes.title}
          </div>
        ))}
        {/* Bouton pour ajouter un tableau (7 pts) */}
        <button style={{ border: '2px dashed #ccc', borderRadius: '8px', cursor: 'pointer' }}>
          + Nouveau Tableau
        </button>
      </div>
    </div>
  );
}