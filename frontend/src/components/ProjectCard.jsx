function ProjectCard({ project, onDelete, onEdit }) {
  function handleDeleteClick() {
    const confirmed = window.confirm(
      `Opravdu chcete smazat projekt "${project.title}"?`
    );

    if (!confirmed) {
      return;
    }

    onDelete(project.id);
  }

  function getProjectTypeLabel() {
    switch (project.type) {
      case "series":
        return "📚 Série";
      case "standalone":
        return "📖 Samostatná kniha";
      case "volume":
        return "📄 Díl série";
      default:
        return "❓ Neznámý typ";
    }
  }

  return (
    <div className="book-card">
      <h3>{project.title}</h3>

      <p>{getProjectTypeLabel()}</p>

      <p>Stav: {project.status}</p>

      <button onClick={() => onEdit(project)}>
        ✏️ Upravit
      </button>

      <button onClick={handleDeleteClick}>
        🗑️ Smazat
      </button>
    </div>
  );
}

export default ProjectCard;