import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Board() {
  const { id: boardId } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);

  useEffect(() => {
    if (boardId) fetchAll();
  }, [boardId]);

  const fetchAll = async () => {
    try {
      const b = await api.get(`/boards/${boardId}`);
      setBoard(b.data.data);
      const l = await api.get(`/lists?filters[board][documentId][$eq]=${boardId}&populate=*`);
      setLists(l.data.data || []);
    } catch (e) { console.error("Pb fetch", e); }
  };

  const onAddList = async () => {
    const name = prompt("Titre de la liste ?");
    if (!name) return;
    await api.post("/lists", { data: { name, board: board.id, publishedAt: new Date() } });
    fetchAll();
  };

  const onAddCard = async (listId) => {
    const title = prompt("Tâche ?");
    if (!title) return;
    await api.post("/cards", { data: { title, list: listId, publishedAt: new Date() } });
    fetchAll();
  };

  const onDeleteList = async (id) => {
    if (!confirm("Supprimer cette liste ?")) return;
    await api.delete(`/lists/${id}`);
    fetchAll();
  };

  if (!board) return <div style={s.loader}>Initialisation...</div>;

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
          <button onClick={() => navigate("/dashboard")} style={s.backBtn}>←</button>
          <h1 style={s.title}>{board.title || board.attributes?.title}</h1>
        </div>
        <div style={s.status}>Live Editor</div>
      </nav>

      <main style={s.board}>
        {lists.map(list => {
          const cards = list.cards || list.attributes?.cards?.data || [];
          return (
            <section key={list.id} style={s.list}>
              <header style={s.listHead}>
                <h3 style={s.listName}>{list.name || list.attributes?.name}</h3>
                <button onClick={() => onDeleteList(list.documentId || list.id)} style={s.delBtn}>×</button>
              </header>
              
              <div style={s.cardStack}>
                {cards.map(c => (
                  <article key={c.id} style={s.card}>
                    {c.title || c.attributes?.title}
                  </article>
                ))}
              </div>

              <button onClick={() => onAddCard(list.id)} style={s.addBtn}>+ Add Card</button>
            </section>
          );
        })}

        <button onClick={onAddList} style={s.newColumn}>+ Add Column</button>
      </main>
    </div>
  );
}

const s = {
  page: {
    padding: "40px",
    backgroundColor: "#050505", // Noir pur pour le contraste
    minHeight: "100vh",
    color: "#eee",
    fontFamily: "monospace" // Style "code" plus brut
  },
  loader: { padding: "50px", color: "#444", textAlign: "center" },
  nav: { display: "flex", justifyContent: "space-between", marginBottom: "50px" },
  title: { fontSize: "22px", textTransform: "uppercase", letterSpacing: "2px", color: "#00ff88" }, // Vert néon
  backBtn: { background: "none", border: "1px solid #333", color: "#666", padding: "5px 10px", cursor: "pointer" },
  status: { fontSize: "10px", border: "1px solid #00ff88", color: "#00ff88", padding: "2px 8px", borderRadius: "3px" },
  
  board: { display: "flex", gap: "25px", alignItems: "flex-start" },
  list: {
    background: "rgba(255, 255, 255, 0.03)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    width: "280px",
    padding: "15px",
    borderRadius: "4px" // Moins d'arrondi = plus agressif
  },
  listHead: { display: "flex", justifyContent: "space-between", marginBottom: "15px" },
  listName: { fontSize: "14px", fontWeight: "bold", margin: 0, color: "#fff" },
  delBtn: { background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: "18px" },
  
  cardStack: { display: "flex", flexDirection: "column", gap: "8px" },
  card: {
    backgroundColor: "#0a0a0a",
    padding: "12px",
    borderLeft: "3px solid #00ff88", // Petite barre de couleur sur le côté
    fontSize: "13px",
    transition: "0.2s"
  },
  addBtn: { marginTop: "15px", width: "100%", background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: "12px", textAlign: "left" },
  newColumn: {
    minWidth: "280px",
    height: "100px",
    background: "none",
    border: "1px dashed #222",
    color: "#222",
    cursor: "pointer",
    transition: "0.3s"
  }
};