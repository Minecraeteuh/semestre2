import editIcon from '../assets/edit-icon.svg';

export default function ProjectCard({ project, onClick, onDelete }) {
    const title = project.title || project.attributes?.title;

    return (
        <div onClick={onClick} className="dash-card">
            <h3 className="dash-card-title">{title}</h3>
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