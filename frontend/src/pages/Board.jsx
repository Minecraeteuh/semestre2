import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Board.css";

// Imports de DND-Kit
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// --- COMPOSANT 1 : LA CARTE DND ---
function SortableCard({ card, onEdit }) {
  const id = String(card.documentId || card.id);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `card-${id}`,
    data: { type: "Card", card },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    borderLeft: card.attributes?.label || card.label ? `5px solid ${card.attributes?.label || card.label}` : "none",
    cursor: "grab",
  };

  const d = card.attributes || card;

  return (
    <article ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={() => onEdit(card)} className="board-card">
      <div className="board-card-title">{d.title}</div>
      {d.duedate && <div className="board-date">📅 {new Date(d.duedate).toLocaleDateString()}</div>}
    </article>
  );
}

// --- COMPOSANT 2 : LA COLONNE DND ---
function SortableColumn({ list, onAddCard, onEditCard }) {
  const id = String(list.documentId || list.id);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `col-${id}`,
    data: { type: "Column", list },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const cards = list.cards || list.attributes?.cards?.data || [];
  const sortedCards = [...cards].sort((a, b) => (a.attributes?.order ?? a.order ?? 0) - (b.attributes?.order ?? b.order ?? 0));

  return (
    <section ref={setNodeRef} style={style} className="board-list">
      <div className="board-list-head" {...attributes} {...listeners} style={{ cursor: "grab" }}>
        {list.name || list.attributes?.name}
      </div>
      
      <div className="board-card-stack">
        <SortableContext items={sortedCards.map(c => `card-${c.documentId || c.id}`)} strategy={verticalListSortingStrategy}>
          {sortedCards.map((c) => (
            <SortableCard key={c.id} card={c} onEdit={onEditCard} />
          ))}
        </SortableContext>
      </div>

      <button onClick={() => onAddCard(id)} className="board-add-btn">+ Ajouter une tâche</button>
    </section>
  );
}


// --- COMPOSANT PRINCIPAL ---
export default function Board() {
  const { id: boardId } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [editingCard, setEditingCard] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Éléments pour le DragOverlay (L'ombre quand on déplace)
  const [activeColumn, setActiveColumn] = useState(null);
  const [activeCard, setActiveCard] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }), // Distance de 3px pour éviter les clics accidentels
    useSensor(KeyboardSensor)
  );

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
      console.error("Erreur Strapi:", e);
    }
  };

  // --- ACTIONS CRUD DE BASE ---
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
        order: parseInt(formData.get("order"), 10) || 1
      }
    };

    try {
      const docId = editingCard.documentId || editingCard.id;
      await api.put(`/cards/${docId}`, payload);
      setEditingCard(null);
      fetchAll();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour.");
    } finally {
      setIsUpdating(false);
    }
  };

  const onAddList = async () => {
    const name = prompt("Saisissez le nom de la nouvelle liste :");
    if (!name) return;
    const newOrder = lists.length > 0 ? Math.max(...lists.map(l => l.attributes?.order ?? l.order ?? 0)) + 1 : 1;
    try {
      await api.post("/lists", { data: { name, board: board.id, order: newOrder, publishedAt: new Date() } });
      fetchAll();
    } catch (err) { console.error(err); }
  };

  const onAddCard = async (listId) => {
    const title = prompt("Saisissez le titre de la nouvelle tâche :");
    if (!title) return;
    
    const targetList = lists.find(l => String(l.documentId || l.id) === listId);
    const cards = targetList?.cards || targetList?.attributes?.cards?.data || [];
    const newOrder = cards.length > 0 ? Math.max(...cards.map(c => c.attributes?.order ?? c.order ?? 0)) + 1 : 1;

    try {
      await api.post("/cards", { data: { title, list: listId, order: newOrder, publishedAt: new Date() } });
      fetchAll();
    } catch (err) { console.error(err); }
  };

  const onDeleteCard = async () => {
    if (!window.confirm("Supprimer cette tâche ?")) return;
    try {
      const docId = editingCard.documentId || editingCard.id;
      await api.delete(`/cards/${docId}`);
      setEditingCard(null);
      fetchAll();
    } catch (err) { console.error(err); }
  };


  // --- LOGIQUE DND-KIT ---
  const handleDragStart = (event) => {
    const { active } = event;
    if (active.data.current?.type === "Column") setActiveColumn(active.data.current.list);
    if (active.data.current?.type === "Card") setActiveCard(active.data.current.card);
  };

  const handleDragEnd = async (event) => {
    setActiveColumn(null);
    setActiveCard(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    try {
      // 1. DÉPLACEMENT DE COLONNE
      if (active.data.current?.type === "Column" && over.data.current?.type === "Column") {
        const sortedLists = [...lists].sort((a, b) => (a.attributes?.order ?? a.order ?? 0) - (b.attributes?.order ?? b.order ?? 0));
        const oldIndex = sortedLists.findIndex(l => `col-${l.documentId || l.id}` === activeId);
        const newIndex = sortedLists.findIndex(l => `col-${l.documentId || l.id}` === overId);

        // Mise à jour locale (optimiste)
        const [draggedList] = sortedLists.splice(oldIndex, 1);
        sortedLists.splice(newIndex, 0, draggedList);
        setLists(sortedLists);

        // Mise à jour API
        await Promise.all(sortedLists.map((l, index) => 
          api.put(`/lists/${l.documentId || l.id}`, { data: { order: index + 1 } })
        ));
      }

      // 2. DÉPLACEMENT DE CARTE (Sur une autre carte OU dans une colonne vide)
      if (active.data.current?.type === "Card") {
        const activeCardObj = active.data.current.card;
        const activeDocId = activeCardObj.documentId || activeCardObj.id;

        // Trouver la liste source
        let sourceList = lists.find(l => {
          const c = l.cards || l.attributes?.cards?.data || [];
          return c.some(card => `card-${card.documentId || card.id}` === activeId);
        });

        // Trouver la liste cible
        let targetList = null;
        if (over.data.current?.type === "Column") {
          targetList = over.data.current.list;
        } else if (over.data.current?.type === "Card") {
          targetList = lists.find(l => {
            const c = l.cards || l.attributes?.cards?.data || [];
            return c.some(card => `card-${card.documentId || card.id}` === overId);
          });
        }

        if (!sourceList || !targetList) return;
        const targetListId = targetList.documentId || targetList.id;

        // Récupérer et trier les cartes cibles
        let targetCards = [...(targetList.cards || targetList.attributes?.cards?.data || [])]
          .sort((a, b) => (a.attributes?.order ?? a.order ?? 0) - (b.attributes?.order ?? b.order ?? 0));

        let newOrder = 1;
        if (over.data.current?.type === "Card") {
          const targetIndex = targetCards.findIndex(c => `card-${c.documentId || c.id}` === overId);
          newOrder = targetIndex + 1; // +1 car basé sur l'index array
        } else {
          newOrder = targetCards.length + 1; // Lâché en bas de liste
        }

        // On push l'update à l'API
        await api.put(`/cards/${activeDocId}`, { 
          data: { 
            list: targetListId,
            order: newOrder 
          } 
        });

        // Comme le décalage de plusieurs cartes peut être lourd on recharge tout proprement
        fetchAll();
      }
    } catch (err) {
      console.error("Erreur Drag & Drop :", err);
      fetchAll(); // Rollback visuel en cas d'erreur ! (Barème : "Retour à la position initiale si erreur API")
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

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <main className="board-container">
          <SortableContext items={sortedLists.map(l => `col-${l.documentId || l.id}`)} strategy={horizontalListSortingStrategy}>
            {sortedLists.map((list) => (
              <SortableColumn key={list.id} list={list} onAddCard={onAddCard} onEditCard={setEditingCard} />
            ))}
          </SortableContext>
          <button onClick={onAddList} className="board-new-column">+ Nouvelle liste</button>
        </main>

        {/* L'ombre de l'élément pendant qu'on le déplace */}
        <DragOverlay>
          {activeColumn && (
            <div className="board-list" style={{ opacity: 0.8 }}>
              <div className="board-list-head">{activeColumn.name || activeColumn.attributes?.name}</div>
            </div>
          )}
          {activeCard && (
            <div className="board-card" style={{ opacity: 0.8, borderLeft: "5px solid gray" }}>
              <div className="board-card-title">{activeCard.title || activeCard.attributes?.title}</div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* --- MODAL EDIT --- */}
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
                  <input type="color" name="label" defaultValue={editingCard.label || editingCard.attributes?.label || "#cccccc"} className="modal-input" style={{ height: "40px", padding: "2px", cursor: "pointer" }} />
                </div>
                <div className="modal-flex-1">
                  <label className="modal-mini-label">Position (Ordre)</label>
                  <input type="number" name="order" defaultValue={editingCard.order || editingCard.attributes?.order || 1} className="modal-input" />
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