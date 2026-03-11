import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TaskCard from "./TaskCard";

export default function BoardList({ list, onAddCard, onEditCard, onDeleteList, onRenameList }) {
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
                        <TaskCard key={c.id} card={c} onEdit={onEditCard} />
                    ))}
                </SortableContext>
            </div>

            <button onClick={() => onAddCard(id)} className="board-add-btn">+ Ajouter une tâche</button>
        </section>
    );
}