import { useEffect, useState } from "react";
import { uploadBookMedia } from "../services/booksService";

function ProjectForm({
  onSaveProject,
  selectedProject,
}) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("Rozpracováno");
  const [type, setType] = useState("standalone");
  const [usesVolumes, setUsesVolumes] = useState(false);
  const [usesParts, setUsesParts] = useState(false);
  const [coverUrl, setCoverUrl] = useState("");
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverError, setCoverError] = useState("");

  useEffect(() => {
    if (selectedProject) {
      setTitle(selectedProject.title || "");
      setStatus(selectedProject.status || "Rozpracováno");
      setType(selectedProject.type || "standalone");
      setUsesVolumes(Boolean(selectedProject.uses_volumes));
      setUsesParts(Boolean(selectedProject.uses_parts));
      setCoverUrl(selectedProject.cover_url || "");
      setCoverError("");
    } else {
      setTitle("");
      setStatus("Rozpracováno");
      setType("standalone");
      setUsesVolumes(false);
      setUsesParts(false);
      setCoverUrl("");
      setCoverError("");
    }
  }, [selectedProject]);

  async function handleCoverUpload(file) {
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setCoverError("Vyber obrázek JPG, PNG nebo WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCoverError("Obálka může mít maximálně 5 MB.");
      return;
    }

    setCoverUploading(true);
    setCoverError("");
    try {
      const result = await uploadBookMedia(file, "book_cover");
      setCoverUrl(result.url);
    } catch (error) {
      setCoverError(error.message || "Obálku se nepodařilo nahrát.");
    } finally {
      setCoverUploading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const projectData = {
      title: title.trim(),
      status,
      type,
      uses_volumes: usesVolumes,
      uses_parts: usesParts,
      parent_id: selectedProject?.parent_id ?? null,
      cover_url: coverUrl.trim(),
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

      <div className="project-cover-field">
        <label htmlFor="book-cover-url">Obálka knihy</label>
        <input
          id="book-cover-url"
          type="url"
          value={coverUrl}
          onChange={(event) => setCoverUrl(event.target.value)}
          placeholder="Vlož URL obrázku nebo nahraj soubor"
        />
        <label htmlFor="book-cover-file" className="project-cover-upload-label">
          Nahrát obálku (JPG, PNG nebo WebP, max. 5 MB)
        </label>
        <input
          id="book-cover-file"
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          disabled={coverUploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) handleCoverUpload(file);
          }}
        />
        {coverUploading && <small>Nahrávám obálku…</small>}
        {coverError && <small className="project-cover-error">{coverError}</small>}
        {coverUrl && (
          <div className="project-cover-preview-wrap">
            <img className="project-cover-preview" src={coverUrl} alt="Náhled obálky knihy" />
            <button type="button" onClick={() => setCoverUrl("")}>Odebrat obálku</button>
          </div>
        )}
        <small>Obálka se použije také v knihovně soundtracků a v sekci Videa.</small>
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


      <button type="submit" disabled={coverUploading}>

        {selectedProject?.id
          ? "Uložit změny"
          : "Přidat knihu"}

      </button>

    </form>
  );
}

export default ProjectForm;