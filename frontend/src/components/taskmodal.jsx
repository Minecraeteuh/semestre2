export default function TaskModal({ editingCard, onClose, onUpdate, onDelete, isUpdating }) {
    if (!editingCard) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2 className="modal-title">Modifier la tâche</h2>
                <form onSubmit={onUpdate} className="modal-form">
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
                        <button type="button" onClick={onDelete} className="modal-btn modal-del-btn">Supprimer</button>
                        <button type="button" onClick={onClose} className="modal-btn modal-close-btn">Annuler</button>
                        <button type="submit" className="modal-btn modal-save-btn" disabled={isUpdating}>
                            {isUpdating ? "Enregistrement..." : "Enregistrer"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}