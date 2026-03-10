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
    } catch (e) {
      console.error("Erreur lors de la récupération des données du tableau:", e);
    }
  };

  const onUpdateCard = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    const formData = new FormData(e.target);

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
      console.error("Erreur de mise à jour:", err);
      alert("Impossible d'enregistrer les modifications de la tâche. Veuillez réessayer plus tard.");
    } finally {
      setIsUpdating(false);
    }
  };

  const onAddList = async () => {
    const name = prompt("Saisissez le nom de la nouvelle liste :");
    if (!name) return;

    try {
      await api.post("/lists", { data: { name, board: board.id, publishedAt: new Date() } });
      fetchAll();
    } catch (err) {
      console.error("Erreur de création de liste:", err);
    }
  };

  const onAddCard = async (listId) => {
    const title = prompt("Saisissez le titre de la nouvelle tâche :");
    if (!title) return;

    try {
      await api.post("/cards", { data: { title, list: listId, publishedAt: new Date() } });
      fetchAll();
    } catch (err) {
      console.error("Erreur de création de tâche:", err);
    }
  };

  const onDeleteCard = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette tâche ? Cette action est irréversible.")) return;

    try {
      const docId = editingCard.documentId || editingCard.id;
      await api.delete(`/cards/${docId}`);
      setEditingCard(null);
      fetchAll();
    } catch (err) {
      console.error("Erreur de suppression:", err);
    }
  };

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
    } catch (err) {
      console.error("Erreur lors du déplacement:", err);
    }
  };

  if (!board) return <div className="board-loader">Chargement du tableau...</div>;

  return (
      <div className="board-page">
        <header className="board-nav">
          <div className="board-nav-left">
            <button onClick={() => navigate("/dashboard")} className="board-back-btn">Retour</button>
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
                            <div className="board-card-title">{d.title}</div>
                            {d.duedate && <div className="board-date">📅 {new Date(d.duedate).toLocaleDateString()}</div>}
                          </article>
                      );
                    })}
                  </div>
                  <button onClick={() => onAddCard(listId)} className="board-add-btn">+ Ajouter une tâche</button>
                </section>
            );
          })}
          <button onClick={onAddList} className="board-new-column">+ Nouvelle liste</button>
        </main>

        {editingCard && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h2 className="modal-title">Modifier la tâche</h2>
                <form onSubmit={onUpdateCard} className="modal-form">
                  <input name="title" defaultValue={editingCard.title || editingCard.attributes?.title} className="modal-input" required placeholder="Titre de la tâche" />
                  <textarea name="description" defaultValue={editingCard.description || editingCard.attributes?.description} className="modal-area" placeholder="Description détaillée..." />

                  <div className="modal-group">
                    <div className="modal-flex-1">
                      <label className="modal-mini-label">Échéance</label>
                      <input type="date" name="duedate" defaultValue={(editingCard.duedate || editingCard.attributes?.duedate)?.split('T')[0]} className="modal-input" />
                    </div>
                    <div className="modal-flex-1">
                      <label className="modal-mini-label">Étiquette</label>
                      <input name="label" defaultValue={editingCard.label || editingCard.attributes?.label} className="modal-input" placeholder="Ex: Urgent, Bug..." />
                    </div>
                  </div>

                  <input type="hidden" name="order" defaultValue={editingCard.order || editingCard.attributes?.order || 0} />

                  <div className="modal-actions">
                    <button type="button" onClick={onDeleteCard} className="modal-btn modal-del-btn">Supprimer</button>
                    <button type="button" onClick={() => setEditingCard(null)} className="modal-btn modal-close-btn">Annuler</button>
                    <button type="submit" className="modal-btn modal-save-btn" disabled={isUpdating}>{isUpdating ? "Enregistrement..." : "Enregistrer"}</button>
                  </div>
                </form>
              </div>
            </div>
        )}
      </div>
  );
}