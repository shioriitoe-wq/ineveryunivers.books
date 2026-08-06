import { useEffect, useState } from "react";

function ProjectForm({ onSaveProject, selectedProject }) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("Rozpracováno");
  const [type, setType] = useState("standalone");

  useEffect(() => {
    if (selectedProject) {
      setTitle(selectedProject.title);
      setStatus(selectedProject.status);
      setType(selectedProject.type);
    } else {
      setTitle("");
      setStatus("Rozpracováno");
      setType("standalone");
    }
  }, [selectedProject]);

  async function handleSubmit(event) {
    event.preventDefault();

    await onSaveProject({
      title,
      status,
      type,
      parent_id: selectedProject?.parent_id ?? null,
    });

    setTitle("");
    setStatus("Rozpracováno");
    setType("standalone");
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="title">Název projektu</label>
        <br />
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <br />

      <div>
        <label htmlFor="type">Typ projektu</label>
        <br />
        <select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="standalone">📖 Samostatná kniha</option>
          <option value="series">📚 Série</option>
        </select>
      </div>

      <br />

      <div>
        <label htmlFor="status">Stav</label>
        <br />
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option>Rozpracováno</option>
          <option>Plánováno</option>
          <option>Dokončeno</option>
        </select>
      </div>

      <br />

      <button type="submit">
        {selectedProject ? "Uložit změny" : "Přidat projekt"}
      </button>
    </form>
  );
}

export default ProjectForm;