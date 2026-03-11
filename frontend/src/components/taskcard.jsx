import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function TaskCard({ card, onEdit }) {
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