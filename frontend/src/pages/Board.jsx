import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Board.css";

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

  // fonction de mise à jour
  const onUpdateCard = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    const formData = new FormData(e.target);

    // date du formulaire
    const rawDate = formData.get("duedate");

    const payload = {
      data: {
        title: formData.get("title"),
        description: formData.get("description") || "",
        label: formData.get("label") || "",
        duedate: rawDate ? `${rawDate}T12:00:00.000Z` : null,
        order: parseInt(formData.get("order"), 10) || 0
      }
    };

    try {
      const docId = editingCard.documentId || editingCard.id;

      await api.put(`/cards/${docId}`, payload);

      setEditingCard(null);
      fetchAll();
    } catch (err) {
      console.error("Détails Erreur API:", err.response?.data);
      alert(`ERREUR 400 : Impossible d'enregistrer les modifications de la tâche.`);
    } finally {
      setIsUpdating(false);
    }
  };

  const onAddList = async () => {
    const name = prompt("Nom de la colonne");
    if (!name) return;
    await api.post("/lists", { data: { name, board: board.id, publishedAt: new Date() } });
    fetchAll();
  };

  const onAddCard = async (listId) => {
    const title = prompt("Titre de la tâche");
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

  //drag and drop
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

  if (!board) return <div className="board-loader">Chargement du tableau...</div>;

  return (
      <div className="board-page">
        <header className="board-nav">
          <div className="board-nav-left">
            <button onClick={() => navigate("/dashboard")} className="board-back-btn">←</button>
            <h1 className="board-title">{board.title || board.attributes?.title}</h1>
          </div>
          <div className="board-status">Tableau à jour</div>
        </header>

        <main className="board-container">
          {lists.map(list => {
            const listId = list.documentId || list.id;
            const cards = list.cards || list.attributes?.cards?.data || [];
            return (
                <section key={list.id} className="board-list" onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, listId)}>
                  <div className="board-list-head">{list.name || list.attributes?.name}</div>
                  <div className="board-card-stack">
                    {cards.map(c => {
                      const d = c.attributes || c;
                      return (
                          <article key={c.id} className="board-card" draggable onDragStart={e => handleDragStart(e, c, listId)} onClick={() => setEditingCard(c)}>
                            {d.label && <span className="board-badge">{d.label}</span>}
                            <div className="fw-bold">{d.title}</div>
                            {d.duedate && <div className="board-date">{new Date(d.duedate).toLocaleDateString()}</div>}
                          </article>
                      );
                    })}
                  </div>
                  <button onClick={() => onAddCard(listId)} className="board-add-btn">+ Nouvelle tâche</button>
                </section>
            );
          })}
          <button onClick={onAddList} className="board-new-column">+ NEW_COLUMN</button>
        </main>

        {editingCard && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h2 className="modal-title">Modifier la tâche</h2>
                <form onSubmit={onUpdateCard} className="modal-form">
                  <input name="title" defaultValue={editingCard.title || editingCard.attributes?.title} className="modal-input" required />
                  <textarea name="description" defaultValue={editingCard.description || editingCard.attributes?.description} className="modal-area" placeholder="description" rows="4" />
                  <div className="modal-group">
                    <div className="modal-flex-1">
                      <label className="modal-mini-label">DATE D'ÉCHÉANCE</label>
                      <input type="date" name="duedate" defaultValue={(editingCard.duedate || editingCard.attributes?.duedate)?.split('T')[0]} className="modal-input" />
                    </div>
                    <div className="modal-flex-1">
                      <label className="modal-mini-label">LABEL</label>
                      <input name="label" defaultValue={editingCard.label || editingCard.attributes?.label} className="modal-input" placeholder="label" />
                    </div>
                  </div>
                  <input type="hidden" name="order" defaultValue={editingCard.order || editingCard.attributes?.order || 0} />
                  <div className="modal-actions">
                    <button type="button" onClick={onDeleteCard} className="modal-del-btn">[ SUPPRIMER ]</button>
                    <button type="submit" className="modal-save-btn" disabled={isUpdating}>{isUpdating ? "_envoi..." : "enregistrer"}</button>
                    <button type="button" onClick={() => setEditingCard(null)} className="modal-close-btn">[ X ]</button>
                  </div>
                </form>
              </div>
            </div>
        )}
      </div>
  );
}
