import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Board() {
  const { id: boardId } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [editingCard, setEditingCard] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (boardId) fetchAll();
  }, [boardId]);

  const fetchAll = async () => {
    try {
      const b = await api.get(`/boards/${boardId}`);
      setBoard(b.data.data);
      const l = await api.get(`/lists?filters[board][documentId][$eq]=${boardId}&populate=*`);
      setLists(l.data.data || []);
    } catch (e) { console.error("Erreur fetchAll:", e); }
  };

  // 🚀 LA FONCTION DE MISE À JOUR SYNCHRONISÉE AVEC TON STRAPI
  const onUpdateCard = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    const formData = new FormData(e.target);
    
    // On récupère la date du formulaire (format AAAA-MM-JJ)
    const rawDate = formData.get("duedate");

    const payload = {
      data: {
        title: formData.get("title"),
        description: formData.get("description") || "",
        label: formData.get("label") || "",
        // 🎯 On utilise EXACTEMENT 'duedate' comme dans ton Strapi (image_231235.png)
        // On ajoute l'heure pour le type Datetime
        duedate: rawDate ? `${rawDate}T12:00:00.000Z` : null,
        // On s'assure que order est un nombre
        order: parseInt(formData.get("order"), 10) || 0
      }
    };

    try {
      // Strapi 5 : Utilisation du documentId pour l'URL
      const docId = editingCard.documentId || editingCard.id;
      
      await api.put(`/cards/${docId}`, payload);
      
      setEditingCard(null);
      fetchAll();
    } catch (err) {
      console.error("Détails Erreur API:", err.response?.data);
      alert(`ERREUR 400 : Vérifie dans Strapi que le rôle 'Authenticated' a la permission 'update' sur les 'Cards'.`);
    } finally {
      setIsUpdating(false);
    }
  };

  const onAddList = async () => {
    const name = prompt("Nom de la colonne ?");
    if (!name) return;
    await api.post("/lists", { data: { name, board: board.id, publishedAt: new Date() } });
    fetchAll();
  };

  const onAddCard = async (listId) => {
    const title = prompt("Titre de la tâche ?");
    if (!title) return;
    await api.post("/cards", { data: { title, list: listId, publishedAt: new Date() } });
    fetchAll();
  };

  const onDeleteCard = async () => {
    if (!confirm("Supprimer cette tâche ?")) return;
    const docId = editingCard.documentId || editingCard.id;
    await api.delete(`/cards/${docId}`);
    setEditingCard(null);
    fetchAll();
  };

  // --- LOGIQUE DRAG & DROP ---
  const handleDragStart = (e, card, sourceListId) => {
    e.dataTransfer.setData("cardId", card.documentId || card.id);
    e.dataTransfer.setData("sourceListId", sourceListId);
  };

  const handleDrop = async (e, targetListId) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData("cardId");
    if (e.dataTransfer.getData("sourceListId") === targetListId) return;
    try {
      await api.put(`/cards/${cardId}`, { data: { list: targetListId } });
      fetchAll();
    } catch (err) { console.error("Erreur DND:", err); }
  };

  if (!board) return <div style={s.loader}>_INITIALISATION_SYSTÈME_...</div>;

  return (
    <div style={s.page}>
      <header style={s.nav}>
        <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
          <button onClick={() => navigate("/dashboard")} style={s.backBtn}>←</button>
          <h1 style={s.title}>{board.title || board.attributes?.title}</h1>
        </div>
        <div style={s.status}>FLUX_SYNCHRONISÉ</div>
      </header>

      <main style={s.board}>
        {lists.map(list => {
          const listId = list.documentId || list.id;
          const cards = list.cards || list.attributes?.cards?.data || [];
          return (
            <section key={list.id} style={s.list} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, listId)}>
              <div style={s.listHead}>{list.name || list.attributes?.name}</div>
              <div style={s.cardStack}>
                {cards.map(c => {
                  const d = c.attributes || c;
                  return (
                    <article key={c.id} style={s.card} draggable onDragStart={e => handleDragStart(e, c, listId)} onClick={() => setEditingCard(c)}>
                      {d.label && <span style={s.badge}>{d.label}</span>}
                      <div style={{fontWeight:'bold'}}>{d.title}</div>
                      {d.duedate && <div style={s.date}>📅 {new Date(d.duedate).toLocaleDateString()}</div>}
                    </article>
                  );
                })}
              </div>
              <button onClick={() => onAddCard(listId)} style={s.addBtn}>+ NEW_TASK</button>
            </section>
          );
        })}
        <button onClick={onAddList} style={s.newColumn}>+ NEW_COLUMN</button>
      </main>

      {editingCard && (
        <div style={s.modalOverlay}>
          <div style={s.modalContent}>
            <h2 style={s.modalTitle}>&gt;_ÉDITION_TÂCHE</h2>
            <form onSubmit={onUpdateCard} style={s.modalForm}>
              <input name="title" defaultValue={editingCard.title || editingCard.attributes?.title} style={s.modalInput} required />
              <textarea name="description" defaultValue={editingCard.description || editingCard.attributes?.description} style={s.modalArea} placeholder="DESCRIPTION" rows="4" />
              <div style={{display:'flex', gap:'10px'}}>
                <div style={{flex:1}}>
                  <label style={s.miniLabel}>DATE D'ÉCHÉANCE</label>
                  <input type="date" name="duedate" defaultValue={(editingCard.duedate || editingCard.attributes?.duedate)?.split('T')[0]} style={s.modalInput} />
                </div>
                <div style={{flex:1}}>
                  <label style={s.miniLabel}>LABEL</label>
                  <input name="label" defaultValue={editingCard.label || editingCard.attributes?.label} style={s.modalInput} placeholder="LABEL" />
                </div>
              </div>
              <input type="hidden" name="order" defaultValue={editingCard.order || editingCard.attributes?.order || 0} />
              <div style={s.modalActions}>
                <button type="button" onClick={onDeleteCard} style={s.delBtn}>[ SUPPRIMER ]</button>
                <button type="submit" style={s.saveBtn} disabled={isUpdating}>{isUpdating ? "_ENVOI..." : "[ ENREGISTRER ]"}</button>
                <button type="button" onClick={() => setEditingCard(null)} style={s.closeBtn}>[ X ]</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page: { padding: "40px", backgroundColor: "#050505", minHeight: "100vh", color: "#eee", fontFamily: "monospace" },
  loader: { padding: "100px", color: "#00ff88", textAlign: "center", fontSize: "18px" },
  nav: { display: "flex", justifyContent: "space-between", marginBottom: "40px", borderBottom: "1px solid #111", paddingBottom: "20px" },
  title: { fontSize: "20px", color: "#00ff88", margin: 0, textTransform: "uppercase" },
  backBtn: { background: "none", border: "1px solid #333", color: "#666", padding: "5px 15px", cursor: "pointer" },
  status: { color: "#00ff88", fontSize: "12px" },
  board: { display: "flex", gap: "20px", overflowX: "auto", paddingBottom: "20px" },
  list: { backgroundColor: "#0a0a0a", border: "1px solid #111", width: "280px", minWidth: "280px", padding: "15px", borderRadius: "4px" },
  listHead: { fontWeight: "bold", marginBottom: "20px", color: "#00ff88", textTransform: "uppercase" },
  cardStack: { display: "flex", flexDirection: "column", gap: "10px", minHeight: "50px" },
  card: { backgroundColor: "#050505", border: "1px solid #222", padding: "12px", cursor: "grab" },
  badge: { fontSize: "9px", backgroundColor: "#00ff88", color: "#000", padding: "2px 6px", marginBottom: "8px", display: "inline-block", fontWeight: "bold" },
  date: { fontSize: "10px", color: "#555", marginTop: "8px" },
  addBtn: { width: "100%", marginTop: "15px", background: "none", border: "none", color: "#444", cursor: "pointer", textAlign: "left", fontSize: "11px" },
  newColumn: { minWidth: "280px", border: "1px dashed #222", background: "none", color: "#222", cursor: "pointer", height: "100px" },
  modalOverlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.9)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 },
  modalContent: { backgroundColor: "#0a0a0a", border: "1px solid #333", padding: "30px", width: "480px" },
  modalTitle: { color: "#00ff88", fontSize: "16px", marginBottom: "20px" },
  miniLabel: { fontSize: "9px", color: "#444", marginBottom: "5px", display: "block" },
  modalForm: { display: "flex", flexDirection: "column", gap: "15px" },
  modalInput: { backgroundColor: "#000", border: "1px solid #222", color: "#fff", padding: "10px", fontFamily: "monospace", width: "100%", boxSizing: "border-box" },
  modalArea: { backgroundColor: "#000", border: "1px solid #222", color: "#fff", padding: "10px", fontFamily: "monospace", width: "100%", resize: "none", boxSizing: "border-box" },
  modalActions: { display: "flex", gap: "10px", marginTop: "10px" },
  saveBtn: { backgroundColor: "#00ff88", color: "#000", border: "none", padding: "12px", fontWeight: "bold", cursor: "pointer", flex: 2 },
  delBtn: { backgroundColor: "transparent", border: "1px solid #ff4444", color: "#ff4444", padding: "12px", cursor: "pointer", flex: 1 },
  closeBtn: { backgroundColor: "transparent", border: "1px solid #333", color: "#666", padding: "12px", cursor: "pointer", flex: 1 }
};