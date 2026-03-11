import editIcon from '../assets/edit-icon.svg';

export default function ProjectCard({ project, onClick, onDelete, onEdit }) {
    const title = project.title || project.attributes?.title;

    return (
        <div onClick={onClick} className="dash-card">
            <div className="dash-card-title-group">
                <h3 className="dash-card-title">{title}</h3>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(project);
                    }}
                    className="dash-edit-btn"
                    title="Modifier le nom du projet"
                >
                    <img src={editIcon} alt="Modifier" className="dash-edit-icon" />
                </button>
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(project);
                }}
                className="dash-del-btn"
                title="Supprimer le projet"
            >
                ×
            </button>
        </div>
    );
}