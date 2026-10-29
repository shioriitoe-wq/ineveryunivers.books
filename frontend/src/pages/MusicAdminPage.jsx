import { useCallback, useEffect, useState } from "react";
import "./MusicAdminPage.css";

const API_BASE =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "https://ineveryunivers-books-api.onrender.com/api";

const EMPTY_FORM = {
  title: "",
  slug: "",
  artist: "",
  book_id: "",
  audio_url: "",
  cover_url: "",
  duration_seconds: 0,
  mood_tags: "",
  genre_tags: "",
  scene: "",
  description: "",
  author_comment: "",
  lyrics_lines: "",
  allow_download: false,
  published: false,
  sort_order: 0,
};

function fromTrack(track) {
  return {
    ...EMPTY_FORM,
    ...track,
    book_id: track.book_id == null ? "" : String(track.book_id),
    mood_tags: Array.isArray(track.mood_tags)
      ? track.mood_tags.join(", ")
      : "",
    genre_tags: Array.isArray(track.genre_tags)
      ? track.genre_tags.join(", ")
      : "",
    lyrics_lines: Array.isArray(track.lyrics_lines)
      ? track.lyrics_lines.join("\n")
      : "",
  };
}

function toPayload(form) {
  return {
    ...form,
    book_id: form.book_id || null,
    duration_seconds: Number(form.duration_seconds) || 0,
    sort_order: Number(form.sort_order) || 0,
    mood_tags: form.mood_tags.split(",").map((item) => item.trim()).filter(Boolean),
    genre_tags: form.genre_tags.split(",").map((item) => item.trim()).filter(Boolean),
    lyrics_lines: form.lyrics_lines.split("\n"),
  };
}

function MusicAdminPage() {
  const [tracks, setTracks] = useState([]);
  const [books, setBooks] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");

  const request = useCallback(async (path, options = {}) => {
    const token = sessionStorage.getItem("adminToken");
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(options.body && !(options.body instanceof FormData)
  ? { "Content-Type": "application/json" }
  : {}),
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || `Požadavek selhal (${response.status}).`);
    }
    return data;
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [trackData, bookData] = await Promise.all([
        request("/admin/soundtracks"),
        request("/books"),
      ]);
      setTracks(Array.isArray(trackData) ? trackData : []);
      setBooks(Array.isArray(bookData) ? bookData : []);
    } catch (err) {
      setError(err.message || "Nepodařilo se načíst data.");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function uploadFile(file, type) {
    if (!file) return;

    const isAudio = type === "audio";
    const maxSize = isAudio ? 25 * 1024 * 1024 : 5 * 1024 * 1024;
    const allowedExtensions = isAudio ? /\.mp3$/i : /\.(jpe?g|png|webp)$/i;

    setError("");
    setNotice("");

    if (!allowedExtensions.test(file.name)) {
      setError(isAudio
        ? "Vyber audio soubor ve formátu MP3."
        : "Vyber obrázek ve formátu JPG, PNG nebo WebP.");
      return;
    }

    if (file.size > maxSize) {
      setError(isAudio
        ? "MP3 soubor může mít maximálně 25 MB."
        : "Obal může mít maximálně 5 MB.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    setUploading(type);

    try {
      const result = await request("/admin/soundtracks/upload", {
        method: "POST",
        body: formData,
      });

      const field = isAudio ? "audio_url" : "cover_url";
      setForm((current) => ({ ...current, [field]: result.url }));
      setNotice(isAudio
        ? "Audio bylo nahráno do úložiště. Nezapomeň uložit skladbu."
        : "Obal byl nahrán do úložiště. Nezapomeň uložit skladbu.");
    } catch (err) {
      setError(err.message || "Soubor se nepodařilo nahrát.");
    } finally {
      setUploading("");
    }
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
    setNotice("");
  }

  function editTrack(track) {
    setForm(fromTrack(track));
    setEditingId(track.id);
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveTrack(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = toPayload(form);
      if (editingId != null) {
        await request(`/admin/soundtracks/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setNotice("Skladba byla uložena.");
      } else {
        await request("/admin/soundtracks", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setNotice("Nová skladba byla vytvořena.");
      }

      resetForm();
      await loadData();
    } catch (err) {
      setError(err.message || "Skladbu se nepodařilo uložit.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(track) {
    setError("");
    setNotice("");
    try {
      await request(`/admin/soundtracks/${track.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...track,
          published: !track.published,
        }),
      });
      setNotice(
        track.published
          ? "Skladba byla skryta z veřejné stránky."
          : "Skladba byla publikována."
      );
      await loadData();
    } catch (err) {
      setError(err.message || "Stav publikování se nepodařilo změnit.");
    }
  }

  async function deleteTrack(track) {
    if (!window.confirm(`Opravdu chceš smazat skladbu „${track.title}“?`)) {
      return;
    }

    setError("");
    setNotice("");
    try {
      await request(`/admin/soundtracks/${track.id}`, {
        method: "DELETE",
      });
      if (editingId === track.id) resetForm();
      setNotice("Skladba byla odstraněna.");
      await loadData();
    } catch (err) {
      setError(err.message || "Skladbu se nepodařilo odstranit.");
    }
  }

  const filteredTracks = tracks.filter((track) =>
    `${track.title || ""} ${track.artist || ""} ${track.book_title || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <section className="music-admin">
      <div className="music-admin-heading">
        <div>
          <p className="music-admin-eyebrow">ADMINISTRACE / OBSAH</p>
          <h1>Správa hudby</h1>
          <p className="music-admin-description">
            Spravuj soundtracky, jejich texty, přiřazení ke knihám a publikování.
          </p>
        </div>
        <button className="music-admin-button" type="button" onClick={resetForm}>
          + Nová skladba
        </button>
      </div>

      {error && <div className="music-admin-message is-error" role="alert">{error}</div>}
      {notice && <div className="music-admin-message is-success" role="status">{notice}</div>}

      <form className="music-admin-form" onSubmit={saveTrack}>
        <div className="music-admin-form-heading">
          <h2>{editingId != null ? "Upravit skladbu" : "Nová skladba"}</h2>
          {editingId != null && (
            <button className="music-admin-text-button" type="button" onClick={resetForm}>
              Zrušit úpravy
            </button>
          )}
        </div>

        <div className="music-admin-fields">
          <label>
            Název skladby *
            <input name="title" value={form.title} onChange={updateField} required />
          </label>
          <label>
            Interpret
            <input name="artist" value={form.artist} onChange={updateField} />
          </label>
          <label>
            URL audia
            <input name="audio_url" type="url" value={form.audio_url} onChange={updateField} placeholder="https://…" />
          </label>
          <label>
            URL obalu
            <input name="cover_url" type="url" value={form.cover_url} onChange={updateField} placeholder="https://…" />
          </label>
          <label>
            Nahrát audio (MP3, max. 25 MB)
            <input
              type="file"
              accept=".mp3,audio/mpeg"
              disabled={uploading !== ""}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) uploadFile(file, "audio");
              }}
            />
            {uploading === "audio" && <small>Nahrávám audio…</small>}
          </label>
          <label>
            Nahrát obal (JPG, PNG nebo WebP, max. 5 MB)
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              disabled={uploading !== ""}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) uploadFile(file, "cover");
              }}
            />
            {uploading === "cover" && <small>Nahrávám obal…</small>}
          </label>
          <label>
            Přiřazená kniha
            <select name="book_id" value={form.book_id} onChange={updateField}>
              <option value="">Bez přiřazené knihy</option>
              {books.map((book) => (
                <option key={book.id} value={book.id}>{book.title}</option>
              ))}
            </select>
          </label>
          <label>
            Délka (sekundy)
            <input name="duration_seconds" type="number" min="0" value={form.duration_seconds} onChange={updateField} />
          </label>
          <label>
            Žánry
            <input name="genre_tags" value={form.genre_tags} onChange={updateField} placeholder="fantasy, dark ambient" />
            <small>Odděluj čárkami.</small>
          </label>
          <label>
            Nálady
            <input name="mood_tags" value={form.mood_tags} onChange={updateField} placeholder="temná, romantická" />
            <small>Odděluj čárkami.</small>
          </label>
          <label>
            Scéna / použití
            <input name="scene" value={form.scene} onChange={updateField} />
          </label>
          <label>
            Pořadí
            <input name="sort_order" type="number" min="0" value={form.sort_order} onChange={updateField} />
          </label>
          <label className="music-admin-wide">
            Popis
            <textarea name="description" value={form.description} onChange={updateField} rows="3" />
          </label>
          <label className="music-admin-wide">
            Komentář autorky
            <textarea name="author_comment" value={form.author_comment} onChange={updateField} rows="3" />
          </label>
          <label className="music-admin-wide">
            Text písně
            <textarea name="lyrics_lines" value={form.lyrics_lines} onChange={updateField} rows="7" placeholder="Každý řádek textu na samostatný řádek." />
          </label>
        </div>

        <div className="music-admin-options">
          <label className="music-admin-checkbox">
            <input name="published" type="checkbox" checked={form.published} onChange={updateField} />
            Publikovat na webu
          </label>
          <label className="music-admin-checkbox">
            <input name="allow_download" type="checkbox" checked={form.allow_download} onChange={updateField} />
            Povolit stažení
          </label>
        </div>

        <div className="music-admin-form-actions">
          <button className="music-admin-button" type="submit" disabled={saving}>
            {saving ? "Ukládám…" : editingId != null ? "Uložit změny" : "Vytvořit skladbu"}
          </button>
          {editingId != null && (
            <button className="music-admin-secondary" type="button" onClick={resetForm}>
              Zrušit
            </button>
          )}
        </div>
      </form>

      <div className="music-admin-list-heading">
        <div>
          <h2>Uložené skladby</h2>
          <p>{tracks.length} celkem · {tracks.filter((track) => track.published).length} publikovaných</p>
        </div>
        <input
          className="music-admin-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Hledat skladbu…"
          aria-label="Hledat skladbu"
        />
      </div>

      {loading ? (
        <p className="music-admin-empty">Načítám skladby…</p>
      ) : filteredTracks.length === 0 ? (
        <p className="music-admin-empty">
          {tracks.length ? "Žádné skladby neodpovídají hledání." : "Zatím tu nejsou žádné skladby. Můžeš přidat první."}
        </p>
      ) : (
        <div className="music-admin-track-list">
          {filteredTracks.map((track) => (
            <article className="music-admin-track" key={track.id}>
              {track.cover_url ? (
                <img className="music-admin-cover" src={track.cover_url} alt="" />
              ) : (
                <div className="music-admin-cover music-admin-cover-empty">♫</div>
              )}
              <div className="music-admin-track-info">
                <h3>{track.title}</h3>
                <p>{track.artist || "Bez interpreta"}{track.book_title ? ` · ${track.book_title}` : ""}</p>
                <div className="music-admin-tags">
                  <span className={track.published ? "is-published" : "is-draft"}>
                    {track.published ? "Publikováno" : "Koncept"}
                  </span>
                  {track.genre_tags?.map((tag) => <span key={tag}>{tag}</span>)}
                </div>
              </div>
              <div className="music-admin-track-actions">
                <button type="button" className="music-admin-secondary" onClick={() => editTrack(track)}>
                  Upravit
                </button>
                <button type="button" className="music-admin-secondary" onClick={() => togglePublished(track)}>
                  {track.published ? "Skrýt" : "Publikovat"}
                </button>
                <button type="button" className="music-admin-danger" onClick={() => deleteTrack(track)}>
                  Smazat
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default MusicAdminPage;
