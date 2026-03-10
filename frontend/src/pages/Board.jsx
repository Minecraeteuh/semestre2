import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Board.css";

import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
  arrayMove
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const dropAnimationConfig = {
  duration: 250,
  easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0.2" } },
  }),
};

function SortableCard({ card, onEdit }) {
  const id = String(card.documentId || card.id);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `card-${id}`,
    data: { type: "Card", card },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: transition || "transform 0.2s ease",
    opacity: isDragging ? 0 : 1, 
    borderLeft: card.attributes?.label || card.label ? `5px solid ${card.attributes?.label || card.label}` : "none",
    cursor: "grab",
  };

  const d = card.attributes || card;

  return (
    <article ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={() => onEdit(card)} className="board-card">
      <div className="board-card-title">{d.title}</div>
      {d.duedate && <div className="board-date">{new Date(d.duedate).toLocaleDateString()}</div>}
    </article>
  );
}

function SortableColumn({ list, onAddCard, onEditCard, onDeleteList, onRenameList }) {
  const id = String(list.documentId || list.id);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `col-${id}`,
    data: { type: "Column", list },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: transition || "transform 0.25s ease",
    opacity: isDragging ? 0.3 : 1,
    display: "flex",
    flexDirection: "column",
  };

  const cards = list.cards || list.attributes?.cards?.data || [];
  const sortedCards = [...cards].sort((a, b) => (a.attributes?.order ?? a.order ?? 0) - (b.attributes?.order ?? b.order ?? 0));
  const listName = list.name || list.attributes?.name;

  return (
    <section ref={setNodeRef} style={style} className="board-list">
      <div className="board-list-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #ddd", paddingBottom: "10px", marginBottom: "10px" }}>
        <div 
          {...attributes} {...listeners} 
          style={{ cursor: "grab", flex: 1, display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold" }}
          onDoubleClick={() => onRenameList(id, listName)}
        >
          <span style={{ color: "#7f8c8d", fontSize: "16px", fontWeight: "bold" }}>::</span>
          {listName}
        </div>
        <button 
          onPointerDown={(e) => e.stopPropagation()} 
          onClick={() => onDeleteList(id)}
          style={{ background: "none", border: "none", color: "#e74c3c", cursor: "pointer", fontSize: "16px", padding: "4px", fontWeight: "bold" }}
        >
          X
        </button>
      </div>
      
      <div className="board-card-stack" style={{ minHeight: "150px", flex: 1, paddingBottom: "10px" }}>
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

export default function Board() {
  const { id: boardId } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [editingCard, setEditingCard] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [activeColumn, setActiveColumn] = useState(null);
  const [activeCard, setActiveCard] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
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
    } catch (e) { console.error(e); }
  };

  const onDeleteList = async (listId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette colonne ET toutes les tâches à l'intérieur ?")) return;
    try {
      const listToDelete = lists.find(l => String(l.documentId || l.id) === String(listId));
      const cards = listToDelete?.cards || listToDelete?.attributes?.cards?.data || [];
      await Promise.all(cards.map(c => api.delete(`/cards/${c.documentId || c.id}`)));
      await api.delete(`/lists/${listId}`);
      fetchAll();
    } catch (err) { console.error(err); }
  };

  const onRenameList = async (listId, currentName) => {
    const newName = prompt("Nouveau nom de la colonne :", currentName);
    if (!newName || newName === currentName) return;
    try {
      await api.put(`/lists/${listId}`, { data: { name: newName } });
      fetchAll();
    } catch (err) { console.error(err); }
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
        order: parseInt(formData.get("order"), 10) || 1
      }
    };
    try {
      const docId = editingCard.documentId || editingCard.id;
      await api.put(`/cards/${docId}`, payload);
      setEditingCard(null);
      fetchAll();
    } catch (err) { console.error(err); } 
    finally { setIsUpdating(false); }
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
    const targetList = lists.find(l => String(l.documentId || l.id) === String(listId));
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

  const handleDragStart = (event) => {
    const { active } = event;
    const id = String(active.id);
    if (id.startsWith("col-")) {
      setActiveColumn(lists.find(l => String(l.documentId || l.id) === id.replace("col-", "")));
    } else if (id.startsWith("card-")) {
      const realId = id.replace("card-", "");
      let foundCard = null;
      for (const list of lists) {
        const cards = list.cards || list.attributes?.cards?.data || [];
        foundCard = cards.find(c => String(c.documentId || c.id) === realId);
        if (foundCard) break;
      }
      setActiveCard(foundCard);
    }
  };

  const handleDragCancel = () => {
    setActiveColumn(null);
    setActiveCard(null);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    if (activeId.startsWith("card-")) {
      setLists((prev) => {
        const newLists = prev.map(l => ({ ...l }));
        
        const sourceIdx = newLists.findIndex(l => (l.cards || l.attributes?.cards?.data || []).some(c => `card-${c.documentId || c.id}` === activeId));
        let targetIdx = -1;
        
        if (overId.startsWith("col-")) targetIdx = newLists.findIndex(l => `col-${l.documentId || l.id}` === overId);
        else if (overId.startsWith("card-")) targetIdx = newLists.findIndex(l => (l.cards || l.attributes?.cards?.data || []).some(c => `card-${c.documentId || c.id}` === overId));

        if (sourceIdx === -1 || targetIdx === -1) return prev; 
        
        if (sourceIdx === targetIdx) return prev;

        const sCards = [...(newLists[sourceIdx].cards || newLists[sourceIdx].attributes?.cards?.data || [])].sort((a,b) => (a.attributes?.order??a.order??0) - (b.attributes?.order??b.order??0));
        const tCards = [...(newLists[targetIdx].cards || newLists[targetIdx].attributes?.cards?.data || [])].sort((a,b) => (a.attributes?.order??a.order??0) - (b.attributes?.order??b.order??0));

        const activeCardIdx = sCards.findIndex(c => `card-${c.documentId || c.id}` === activeId);
        if (activeCardIdx === -1) return prev; 
        
        const [draggedCard] = sCards.splice(activeCardIdx, 1);

        let dropIndex = tCards.length;
        if (overId.startsWith("card-")) {
          const overCardIdx = tCards.findIndex(c => `card-${c.documentId || c.id}` === overId);
          if (overCardIdx !== -1) dropIndex = overCardIdx;
        }
        
        tCards.splice(dropIndex, 0, draggedCard);

        sCards.forEach((c, i) => { if (c.attributes) c.attributes.order = i + 1; else c.order = i + 1; });
        tCards.forEach((c, i) => { if (c.attributes) c.attributes.order = i + 1; else c.order = i + 1; });

        if (newLists[sourceIdx].attributes) newLists[sourceIdx].attributes.cards.data = sCards; else newLists[sourceIdx].cards = sCards;
        if (newLists[targetIdx].attributes) newLists[targetIdx].attributes.cards.data = tCards; else newLists[targetIdx].cards = tCards;

        return newLists;
      });
    }
  };

  const handleDragEnd = async (event) => {
    setActiveColumn(null);
    setActiveCard(null);

    const { active, over } = event;
    if (!over) return;

    try {
      if (String(active.id).startsWith("col-")) {
        let overColumnId = String(over.id);
        if (overColumnId.startsWith("card-")) {
          const targetList = lists.find(l => (l.cards || l.attributes?.cards?.data || []).some(card => `card-${card.documentId || card.id}` === overColumnId));
          if (targetList) overColumnId = `col-${targetList.documentId || targetList.id}`;
        }
        if (active.id === overColumnId) return;

        const sortedLists = [...lists].sort((a, b) => (a.attributes?.order ?? a.order ?? 0) - (b.attributes?.order ?? b.order ?? 0));
        const oldIndex = sortedLists.findIndex(l => `col-${l.documentId || l.id}` === active.id);
        const newIndex = sortedLists.findIndex(l => `col-${l.documentId || l.id}` === overColumnId);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newLists = arrayMove(sortedLists, oldIndex, newIndex);
          newLists.forEach((l, i) => { if (l.attributes) l.attributes.order = i + 1; else l.order = i + 1; });
          setLists(newLists);
          await Promise.all(newLists.map((l, index) => api.put(`/lists/${l.documentId || l.id}`, { data: { order: index + 1 } })));
          fetchAll();
        }
        return;
      }

      if (String(active.id).startsWith("card-")) {
        const activeId = String(active.id);
        const overId = String(over.id);

        let targetList = lists.find(l => (l.cards || l.attributes?.cards?.data || []).some(c => `card-${c.documentId || c.id}` === activeId));
        if (!targetList) return;

        let cards = [...(targetList.cards || targetList.attributes?.cards?.data || [])].sort((a,b) => (a.attributes?.order??a.order??0) - (b.attributes?.order??b.order??0));
        const oldIndex = cards.findIndex(c => `card-${c.documentId || c.id}` === activeId);
        
        let newIndex = oldIndex;
        if (overId.startsWith("card-")) {
          newIndex = cards.findIndex(c => `card-${c.documentId || c.id}` === overId);
        }

        if (oldIndex !== newIndex && newIndex !== -1) {
          cards = arrayMove(cards, oldIndex, newIndex);
        }

        cards.forEach((c, i) => { if (c.attributes) c.attributes.order = i + 1; else c.order = i + 1; });

        setLists(prev => {
          const newLists = prev.map(l => ({...l}));
          const idx = newLists.findIndex(l => l.id === targetList.id);
          if (newLists[idx].attributes) newLists[idx].attributes.cards.data = cards; else newLists[idx].cards = cards;
          return newLists;
        });

        const targetListDocId = String(targetList.documentId || targetList.id);
        const promises = cards.map((card, index) => {
          return api.put(`/cards/${card.documentId || card.id}`, { data: { order: index + 1, list: targetListDocId } });
        });

        await Promise.all(promises);
        fetchAll(); 
      }
    } catch (err) {
      console.error("Erreur Drag & Drop :", err);
      fetchAll();
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

      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCorners} 
        onDragStart={handleDragStart} 
        onDragOver={handleDragOver} 
        onDragEnd={handleDragEnd} 
        onDragCancel={handleDragCancel}
      >
        <main className="board-container">
          <SortableContext items={sortedLists.map(l => `col-${l.documentId || l.id}`)} strategy={horizontalListSortingStrategy}>
            {sortedLists.map((list) => (
              <SortableColumn 
                key={list.id} list={list} onAddCard={onAddCard} onEditCard={setEditingCard} 
                onDeleteList={onDeleteList} onRenameList={onRenameList}
              />
            ))}
          </SortableContext>
          <button onClick={onAddList} className="board-new-column">+ Nouvelle liste</button>
        </main>

        <DragOverlay dropAnimation={dropAnimationConfig} zIndex={9999}>
          {activeColumn && (
            <div className="board-list" style={{ opacity: 0.9, boxShadow: "0px 10px 20px rgba(0,0,0,0.15)", cursor: "grabbing" }}>
              <div className="board-list-head" style={{ borderBottom: "1px solid #ddd", paddingBottom: "10px", fontWeight: "bold" }}>
                <span style={{ color: "#7f8c8d", fontSize: "16px", marginRight: "8px", fontWeight: "bold" }}>::</span>
                {activeColumn.name || activeColumn.attributes?.name}
              </div>
            </div>
          )}
          {activeCard && (
            <div className="board-card" style={{ opacity: 0.95, borderLeft: "5px solid gray", boxShadow: "0px 8px 16px rgba(0,0,0,0.15)", cursor: "grabbing" }}>
              <div className="board-card-title">{activeCard.title || activeCard.attributes?.title}</div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

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