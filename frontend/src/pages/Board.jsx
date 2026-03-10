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
        label: formData.get("label") || "#cccccc",
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
      alert("Impossible d'enregistrer les modifications.");
    } finally {
      setIsUpdating(false);
    }
  };

  const onAddList = async () => {
    const name = prompt("Saisissez le nom de la nouvelle liste :");
    if (!name) return;

    try {
      await api.post("/lists", { data: { name, board: board.id, order: lists.length, publishedAt: new Date() } });
      fetchAll();
    } catch (err) {
      console.error("Erreur de création de liste:", err);
    }
  };

  const onAddCard = async (listId, currentCardsCount) => {
    const title = prompt("Saisissez le titre de la nouvelle tâche :");
    if (!title) return;

    try {
      await api.post("/cards", { data: { title, list: listId, order: currentCardsCount, publishedAt: new Date() } });
      fetchAll();
    } catch (err) {
      console.error("Erreur de création de tâche:", err);
    }
  };

  const onDeleteCard = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette tâche ?")) return;

    try {
      const docId = editingCard.documentId || editingCard.id;
      await api.delete(`/cards/${docId}`);
      setEditingCard(null);
      fetchAll();
    } catch (err) {
      console.error("Erreur de suppression:", err);
    }
  };

  // --- NOUVELLE LOGIQUE DE DRAG & DROP ---

  const handleDragStart = (e, type, item, sourceListId = null) => {
    e.stopPropagation(); 
    e.dataTransfer.setData("type", type); // "list" ou "card"
    e.dataTransfer.setData("itemId", item.documentId || item.id);
    e.dataTransfer.setData("itemOrder", item.order || item.attributes?.order || 0);
    
    if (type === "card" && sourceListId) {
      e.dataTransfer.setData("sourceListId", sourceListId);
    }
  };

  // Dépôt sur une CARTE (pour réorganiser l'ordre des cartes)
  const handleDropOnCard = async (e, targetCard, targetListId) => {
    e.preventDefault();
    e.stopPropagation(); // Empêche l'événement de remonter à la liste
    
    const type = e.dataTransfer.getData("type");
    if (type !== "card") return; // On ne peut pas déposer une liste sur une carte

    const itemId = e.dataTransfer.getData("itemId");
    const sourceListId = e.dataTransfer.getData("sourceListId");
    const targetCardId = targetCard.documentId || targetCard.id;

    if (itemId === String(targetCardId)) return; // On lâche la carte sur elle-même

    const draggedOrder = parseInt(e.dataTransfer.getData("itemOrder"), 10) || 0;
    const targetOrder = targetCard.attributes?.order ?? targetCard.order ?? 0;

    try {
      if (sourceListId === String(targetListId)) {
        // Même liste : on échange (swap) l'ordre des deux cartes
        await api.put(`/cards/${itemId}`, { data: { order: targetOrder } });
        await api.put(`/cards/${targetCardId}`, { data: { order: draggedOrder } });
      } else {
        // Liste différente : la carte glissée prend la place de la cible, et on décale la cible
        await api.put(`/cards/${itemId}`, { data: { list: targetListId, order: targetOrder } });
        await api.put(`/cards/${targetCardId}`, { data: { order: targetOrder + 1 } });
      }
      fetchAll();
    } catch (err) {
      console.error("Erreur lors du déplacement de la carte:", err);
    }
  };

  // Dépôt sur une LISTE (pour changer de liste ou réorganiser les listes)
  const handleDropOnList = async (e, targetList) => {
    e.preventDefault();
    e.stopPropagation();

    const type = e.dataTransfer.getData("type");
    const itemId = e.dataTransfer.getData("itemId");
    const targetListId = targetList.documentId || targetList.id;

    try {
      if (type === "list") {
        if (itemId === String(targetListId)) return;

        // On échange l'ordre des deux listes
        const draggedOrder = parseInt(e.dataTransfer.getData("itemOrder"), 10) || 0;
        const targetOrder = targetList.attributes?.order ?? targetList.order ?? 0;

        await api.put(`/lists/${itemId}`, { data: { order: targetOrder } });
        await api.put(`/lists/${targetListId}`, { data: { order: draggedOrder } });
        fetchAll();
      } 
      else if (type === "card") {
        // Si on lâche une carte dans une liste vide ou tout en bas
        const targetCards = targetList.cards || targetList.attributes?.cards?.data || [];
        const newOrder = targetCards.length > 0 ? Math.max(...targetCards.map(c => c.attributes?.order ?? c.order ?? 0)) + 1 : 0;
        
        await api.put(`/cards/${itemId}`, { data: { list: targetListId, order: newOrder } });
        fetchAll();
      }
    } catch (err) {
      console.error("Erreur lors du déplacement vers la liste:", err);
    }
  };

  if (!board) return <div className="board-loader">Chargement du tableau...</div>;

  const sortedLists = [...lists].sort((a, b) => {
    const orderA = a.attributes?.order ?? a.order ?? 0;
    const orderB = b.attributes?.order ?? b.order ?? 0;
    return orderA - orderB;
  });

  return (
      <div className="board-page">
        <header className="board-nav">
          <div className="board-nav-left">
            <button onClick={() => navigate("/dashboard")} className="board-back-btn">Retour</button>
            <h1 className="board-title">{board.title || board.attributes?.title}</h1>
          </div>
        </header>

        <main className="board-container">
          {sortedLists.map(list => {
            const listId = list.documentId || list.id;
            const cards = list.cards || list.attributes?.cards?.data || [];
            
            const sortedCards = [...cards].sort((a, b) => {
              const orderA = a.attributes?.order ?? a.order ?? 0;
              const orderB = b.attributes?.order ?? b.order ?? 0;
              return orderA - orderB;
            });

            return (
                <section 
                  key={list.id} 
                  className="board-list" 
                  draggable
                  onDragStart={(e) => handleDragStart(e, "list", list)}
                  onDragOver={e => e.preventDefault()} 
                  onDrop={e => handleDropOnList(e, list)}
                >
                  <div className="board-list-head">{list.name || list.attributes?.name}</div>
                  
                  <div className="board-card-stack">
                    {sortedCards.map(c => {
                      const d = c.attributes || c;
                      return (
                          <article 
                            key={c.id} 
                            className="board-card" 
                            draggable
                            onDragStart={e => handleDragStart(e, "card", c, listId)}
                            // Important : on empêche l'événement de traverser pour relâcher SUR une carte
                            onDragOver={e => { e.preventDefault(); e.stopPropagation(); }} 
                            onDrop={e => handleDropOnCard(e, c, listId)}
                            onClick={() => setEditingCard(c)}
                            style={{ borderLeft: d.label ? `5px solid ${d.label}` : "none" }}
                          >
                            <div className="board-card-title">{d.title}</div>
                            {d.duedate && <div className="board-date">📅 {new Date(d.duedate).toLocaleDateString()}</div>}
                          </article>
                      );
                    })}
                  </div>
                  <button onClick={() => onAddCard(listId, sortedCards.length)} className="board-add-btn">+ Ajouter une tâche</button>
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
                      <label className="modal-mini-label">Code Couleur</label>
                      <input 
                        type="color" 
                        name="label" 
                        defaultValue={editingCard.label || editingCard.attributes?.label || "#cccccc"} 
                        className="modal-input" 
                        style={{ height: "40px", padding: "2px", cursor: "pointer" }}
                      />
                    </div>
                    <div className="modal-flex-1">
                      <label className="modal-mini-label">Position (Ordre)</label>
                      <input 
                        type="number" 
                        name="order" 
                        defaultValue={editingCard.order || editingCard.attributes?.order || 0} 
                        className="modal-input" 
                      />
                    </div>
                  </div>

                  <div className="modal-group">
                     <div className="modal-flex-1">
                      <label className="modal-mini-label">Échéance</label>
                      <input type="date" name="duedate" defaultValue={(editingCard.duedate || editingCard.attributes?.duedate)?.split('T')[0]} className="modal-input" />
                    </div>
                  </div>

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