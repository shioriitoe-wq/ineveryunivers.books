import { useEffect, useState } from "react";

function ProjectForm({
  onSaveProject,
  selectedProject,
}) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("Rozpracováno");
  const [type, setType] = useState("standalone");
  const [usesVolumes, setUsesVolumes] = useState(false);
  const [usesParts, setUsesParts] = useState(false);

  useEffect(() => {
    if (selectedProject) {
      setTitle(selectedProject.title || "");
      setStatus(selectedProject.status || "Rozpracováno");
      setType(selectedProject.type || "standalone");
      setUsesVolumes(Boolean(selectedProject.uses_volumes));
      setUsesParts(Boolean(selectedProject.uses_parts));
    } else {
      setTitle("");
      setStatus("Rozpracováno");
      setType("standalone");
      setUsesVolumes(false);
      setUsesParts(false);
    }
  }, [selectedProject]);

  async function handleSubmit(event) {
    event.preventDefault();

    const projectData = {
      title: title.trim(),
      status,
      type,
      uses_volumes: usesVolumes,
      uses_parts: usesParts,
      parent_id: selectedProject?.parent_id ?? null,
    };

    await onSaveProject(projectData);
  }

  return (
    <form onSubmit={handleSubmit}>

      <div>

        <label htmlFor="title">
          Název knihy
        </label>

        <br />

        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) =>
            setTitle(e.target.value)
          }
          required
        />

      </div>


      <br />


      <div>

        <label htmlFor="type">
          Typ
        </label>

        <br />

        <select
          id="type"
          value={type}
          onChange={(e) =>
            setType(e.target.value)
          }
        >

          <option value="standalone">
            📖 Samostatná kniha
          </option>

          <option value="series">
            📚 Série
          </option>

        </select>

      </div>


      <br />


      <div>

        <label htmlFor="status">
          Stav
        </label>

        <br />

        <select
          id="status"
          value={status}
          onChange={(e) =>
            setStatus(e.target.value)
          }
        >

          <option>
            Rozpracováno
          </option>

          <option>
            Plánováno
          </option>

          <option>
            Dokončeno
          </option>

        </select>

      </div>


      <br />


      <fieldset>

        <legend>
          Struktura této knihy
        </legend>


        <label>

          <input
            type="checkbox"
            checked={usesVolumes}
            onChange={(e) =>
              setUsesVolumes(e.target.checked)
            }
          />

          Používat díly

        </label>


        <br />


        <label>

          <input
            type="checkbox"
            checked={usesParts}
            onChange={(e) =>
              setUsesParts(e.target.checked)
            }
          />

          Používat části

        </label>

      </fieldset>


      <br />


      <button type="submit">

        {selectedProject?.id
          ? "Uložit změny"
          : "Přidat knihu"}

      </button>

    </form>
  );
}

export default ProjectForm;