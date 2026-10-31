import { useCallback, useEffect, useMemo, useState } from "react";
import "./MusicAdminPage.css";

const API_BASE =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "https://ineveryunivers-books-api.onrender.com/api";

const MOOD_OPTIONS = [
  "Romantická",
  "Energická",
  "Temná",
  "Epická",
  "Snová",
  "Melancholická",
  "Napínavá",
  "Nostalgická",
  "Tajemná",
  "Veselá",
];

const GENRE_OPTIONS = [
  "Ambient",
  "Pop",
  "Rock",
  "Metal",
  "Orchestrální",
  "Indie",
  "Elektronická",
  "Akustická",
  "Soundtrack",
  "Alternativní",
  "Stories",
];

const EMPTY_FORM = {
  title: "",
  slug: "",
  artist: "",
  book_id: "",
  volume_id: "",
  character_names: [],
  audio_url: "",
  cover_url: "",
  duration_seconds: 0,
  mood_tags: [],
  genre_tags: [],
  custom_moods: "",
  custom_genres: "",
  custom_characters: "",
  scene: "",
  author_comment: "",
  lyrics_lines: [],
  allow_download: false,
  published: false,
  sort_order: 0,
};

function parseArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function formatLyricsTime(value) {
  if (value === "" || value == null) return "";
  const milliseconds = Number(value);
  if (!Number.isFinite(milliseconds) || milliseconds < 0) return "";
  const totalSeconds = Math.floor(milliseconds / 1000);
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

function parseLyricsTime(value) {
  const input = String(value ?? "").trim();
  if (!input) return null;
  const match = input.match(/^(\d+):([0-5]?\d)$/);
  if (!match) return null;
  return (Number(match[1]) * 60 + Number(match[2])) * 1000;
}

function normalizeLyrics(lines) {
  if (!Array.isArray(lines)) return [];
  return lines.map((line) => {
    if (typeof line === "string") {
      return { text_original: line, text_cs: "", start_ms: "", end_ms: "" };
    }
    return {
      text_original: line?.text_original ?? line?.text_en ?? line?.en ?? "",
      text_cs: line?.text_cs ?? line?.cs ?? "",
      start_ms: formatLyricsTime(line?.start_ms ?? line?.startMs ?? ""),
      end_ms: formatLyricsTime(line?.end_ms ?? line?.endMs ?? ""),
    };
  });
}

function fromTrack(track) {
  return {
    ...EMPTY_FORM,
    ...track,
    book_id: track.book_id == null ? "" : String(track.book_id),
    volume_id: track.volume_id == null ? "" : String(track.volume_id),
    character_names: parseArray(track.character_names),
    mood_tags: parseArray(track.mood_tags).filter((tag) => MOOD_OPTIONS.includes(tag)),
    genre_tags: parseArray(track.genre_tags).filter((tag) => GENRE_OPTIONS.includes(tag)),
    custom_moods: parseArray(track.mood_tags).filter((tag) => !MOOD_OPTIONS.includes(tag)).join(", "),
    custom_genres: parseArray(track.genre_tags).filter((tag) => !GENRE_OPTIONS.includes(tag)).join(", "),
    custom_characters: "",
    duration_seconds: Number(track.duration_seconds) || 0,
    lyrics_lines: normalizeLyrics(track.lyrics_lines),
  };
}

function toPayload(form) {
  const moodTags = [...new Set([
    ...form.mood_tags,
    ...parseArray(form.custom_moods),
  ])];
  const genreTags = [...new Set([
    ...form.genre_tags,
    ...parseArray(form.custom_genres),
  ])];
  const characterNames = [...new Set([
    ...form.character_names,
    ...parseArray(form.custom_characters),
  ])];

  return {
    title: form.title,
    slug: form.slug,
    artist: form.artist,
    book_id: form.book_id || null,
    volume_id: form.volume_id || null,
    character_names: characterNames,
    audio_url: form.audio_url,
    cover_url: form.cover_url,
    duration_seconds: Number(form.duration_seconds) || 0,
    mood_tags: moodTags,
    genre_tags: genreTags,
    scene: form.scene,
    author_comment: form.author_comment,
    lyrics_lines: form.lyrics_lines.map((line) => ({
      text_original: line.text_original || "",
      text_cs: line.text_cs || "",
      start_ms: parseLyricsTime(line.start_ms),
      end_ms: parseLyricsTime(line.end_ms),
    })),
    allow_download: Boolean(form.allow_download),
    published: Boolean(form.published),
    sort_order: Number(form.sort_order) || 0,
  };
}

function toggleInArray(values, value) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function MusicAdminPage() {
  const [tracks, setTracks] = useState([]);
  const [books, setBooks] = useState([]);
  const [volumes, setVolumes] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [lyricsBulkText, setLyricsBulkText] = useState("");

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

  useEffect(() => {
    let cancelled = false;
    async function loadVolumes() {
      if (!form.book_id) {
        setVolumes([]);
        return;
      }
      try {
        const data = await request(`/books/${form.book_id}/volumes`);
        if (!cancelled) setVolumes(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setVolumes([]);
      }
    }
    loadVolumes();
    return () => {
      cancelled = true;
    };
  }, [form.book_id, request]);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "book_id" ? { volume_id: "" } : {}),
    }));
  }

  function updateLyrics(index, field, value) {
    setForm((current) => ({
      ...current,
      lyrics_lines: current.lyrics_lines.map((line, lineIndex) =>
        lineIndex === index ? { ...line, [field]: value } : line
      ),
    }));
  }

  function addLyricLine(afterIndex = null) {
    setForm((current) => {
      const next = [...current.lyrics_lines];
      const insertAt = afterIndex == null ? next.length : afterIndex + 1;
      next.splice(insertAt, 0, { text_original: "", text_cs: "", start_ms: "", end_ms: "" });
      return { ...current, lyrics_lines: next };
    });
  }

  function moveLyricLine(index, direction) {
    setForm((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.lyrics_lines.length) return current;
      const next = [...current.lyrics_lines];
      [next[index], next[target]] = [next[target], next[index]];
      return { ...current, lyrics_lines: next };
    });
  }

  function importLyricsText() {
    const lines = lyricsBulkText
      .split(/\r?\n/)
      .map((text) => text.trim())
      .filter(Boolean)
      .map((text) => ({ text_original: text, text_cs: "", start_ms: "", end_ms: "" }));
    if (!lines.length) return;
    setForm((current) => ({ ...current, lyrics_lines: lines }));
    setLyricsBulkText("");
    setNotice(`Načteno ${lines.length} řádků textu. Časování můžeš doplnit později.`);
  }

  function removeLyricLine(index) {
    setForm((current) => ({
      ...current,
      lyrics_lines: current.lyrics_lines.filter((_, lineIndex) => lineIndex !== index),
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

    if (isAudio) {
      const objectUrl = URL.createObjectURL(file);
      const audio = new Audio();
      audio.preload = "metadata";
      audio.onloadedmetadata = () => {
        if (Number.isFinite(audio.duration) && audio.duration > 0) {
          setForm((current) => ({
            ...current,
            duration_seconds: Math.round(audio.duration),
          }));
        }
        URL.revokeObjectURL(objectUrl);
      };
      audio.onerror = () => URL.revokeObjectURL(objectUrl);
      audio.src = objectUrl;
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
        ? "Audio bylo nahráno do úložiště a délka se načetla z metadat. Nezapomeň uložit skladbu."
        : "Obal byl nahrán do úložiště. Nezapomeň uložit skladbu.");
    } catch (err) {
      setError(err.message || "Soubor se nepodařilo nahrát.");
    } finally {
      setUploading("");
    }
  }

  function resetForm() {
    setForm({ ...EMPTY_FORM, mood_tags: [], genre_tags: [], character_names: [], lyrics_lines: [] });
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
      setNotice(track.published
        ? "Skladba byla skryta z veřejné stránky."
        : "Skladba byla publikována.");
      await loadData();
    } catch (err) {
      setError(err.message || "Stav publikování se nepodařilo změnit.");
    }
  }

  async function deleteTrack(track) {
    if (!window.confirm(`Opravdu chceš smazat skladbu „${track.title}“?`)) return;

    setError("");
    setNotice("");
    try {
      await request(`/admin/soundtracks/${track.id}`, { method: "DELETE" });
      if (editingId === track.id) resetForm();
      setNotice("Skladba byla odstraněna.");
      await loadData();
    } catch (err) {
      setError(err.message || "Skladbu se nepodařilo odstranit.");
    }
  }

  const knownCharacters = useMemo(() => {
    const names = tracks.flatMap((track) => parseArray(track.character_names));
    return [...new Set([...names, ...form.character_names])].sort((a, b) => a.localeCompare(b, "cs"));
  }, [tracks, form.character_names]);

  const filteredTracks = tracks.filter((track) =>
    `${track.title || ""} ${track.artist || ""} ${(track.character_names || []).join(" ")} ${track.book_title || ""}`
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
            Spravuj soundtracky, texty, postavy, přiřazení ke knihám a publikování.
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
            Postavy (více postav = duet/skupina)
            <div className="music-admin-options">
              {knownCharacters.map((character) => (
                <label className="music-admin-checkbox" key={character}>
                  <input
                    type="checkbox"
                    checked={form.character_names.includes(character)}
                    onChange={() => setForm((current) => ({
                      ...current,
                      character_names: toggleInArray(current.character_names, character),
                    }))}
                  />
                  {character}
                </label>
              ))}
            </div>
            <input
              name="custom_characters"
              value={form.custom_characters}
              onChange={updateField}
              placeholder="Přidat novou postavu (odděluj čárkami)"
            />
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
            Konkrétní díl knihy
            <select
              name="volume_id"
              value={form.volume_id}
              onChange={updateField}
              disabled={!form.book_id || volumes.length === 0}
            >
              <option value="">Celá kniha / bez dílu</option>
              {volumes.map((volume) => (
                <option key={volume.id} value={volume.id}>
                  {volume.number != null ? `${volume.number}. ` : ""}{volume.title}
                </option>
              ))}
            </select>
            {form.book_id && volumes.length === 0 && <small>Pro tuto knihu nejsou dostupné díly.</small>}
          </label>
          <label>
            Délka skladby (sekundy; doplní se z MP3)
            <input name="duration_seconds" type="number" min="0" value={form.duration_seconds} onChange={updateField} />
          </label>

          <fieldset className="music-admin-wide">
            <legend>Žánry</legend>
            <div className="music-admin-options">
              {GENRE_OPTIONS.map((genre) => (
                <label className="music-admin-checkbox" key={genre}>
                  <input
                    type="checkbox"
                    checked={form.genre_tags.includes(genre)}
                    onChange={() => setForm((current) => ({
                      ...current,
                      genre_tags: toggleInArray(current.genre_tags, genre),
                    }))}
                  />
                  {genre}
                </label>
              ))}
            </div>
            <label>
              Vlastní žánry
              <input
                name="custom_genres"
                value={form.custom_genres}
                onChange={updateField}
                placeholder="Např. dark ambient, folk (odděluj čárkami)"
              />
            </label>
          </fieldset>

          <fieldset className="music-admin-wide">
            <legend>Nálady</legend>
            <div className="music-admin-options">
              {MOOD_OPTIONS.map((mood) => (
                <label className="music-admin-checkbox" key={mood}>
                  <input
                    type="checkbox"
                    checked={form.mood_tags.includes(mood)}
                    onChange={() => setForm((current) => ({
                      ...current,
                      mood_tags: toggleInArray(current.mood_tags, mood),
                    }))}
                  />
                  {mood}
                </label>
              ))}
            </div>
            <label>
              Vlastní nálady
              <input
                name="custom_moods"
                value={form.custom_moods}
                onChange={updateField}
                placeholder="Např. hrozivá, triumfální (odděluj čárkami)"
              />
            </label>
          </fieldset>

          <label>
            Scéna / použití
            <input name="scene" value={form.scene} onChange={updateField} />
          </label>
          <label>
            Pořadí
            <input name="sort_order" type="number" min="0" value={form.sort_order} onChange={updateField} />
          </label>
          <label className="music-admin-wide">
            Komentář autorky
            <textarea name="author_comment" value={form.author_comment} onChange={updateField} rows="3" />
          </label>
        </div>

        <div className="music-admin-lyrics music-admin-wide">
          <div className="music-admin-form-heading">
            <h3>Text písně a karaoke</h3>
            <button className="music-admin-secondary" type="button" onClick={() => addLyricLine()}>
              + Přidat řádek
            </button>
          </div>
          <p>Každý řádek může obsahovat začátek, konec, originál i překlad. Čas zadávej jako minuty:sekundy (např. 01:12). Pokud karaoke nechceš, nech časy prázdné.</p>

          <div className="music-admin-lyrics-import">
            <label>
              Rychlé vložení celého textu
              <textarea
                rows="5"
                value={lyricsBulkText}
                onChange={(event) => setLyricsBulkText(event.target.value)}
                placeholder="Vlož celý text písně. Každý nový řádek se převede na samostatný řádek textu bez časování."
              />
            </label>
            <button className="music-admin-secondary" type="button" onClick={importLyricsText} disabled={!lyricsBulkText.trim()}>
              Nahradit řádky vloženým textem
            </button>
          </div>

          <div className="music-admin-lyrics-table-wrap">
            <div className="music-admin-lyrics-table-head">
              <span>ZAČÁTEK (MM:SS)</span>
              <span>KONEC (MM:SS)</span>
              <span>ORIGINÁL</span>
              <span>ČESKÝ PŘEKLAD</span>
              <span>POŘADÍ</span>
            </div>
            {form.lyrics_lines.length === 0 && (
              <p className="music-admin-empty">Zatím nejsou přidané žádné řádky textu.</p>
            )}
            {form.lyrics_lines.map((line, index) => (
              <div className="music-admin-lyric-row" key={index}>
                <label>
                  <span className="music-admin-lyric-mobile-label">Začátek (mm:ss)</span>
                  <input type="text" inputMode="numeric" value={line.start_ms} placeholder="00:00" onChange={(event) => updateLyrics(index, "start_ms", event.target.value)} />
                </label>
                <label>
                  <span className="music-admin-lyric-mobile-label">Konec (mm:ss)</span>
                  <input type="text" inputMode="numeric" value={line.end_ms} placeholder="00:00" onChange={(event) => updateLyrics(index, "end_ms", event.target.value)} />
                </label>
                <label>
                  <span className="music-admin-lyric-mobile-label">Originál</span>
                  <textarea rows="2" value={line.text_original} onChange={(event) => updateLyrics(index, "text_original", event.target.value)} />
                </label>
                <label>
                  <span className="music-admin-lyric-mobile-label">Český překlad</span>
                  <textarea rows="2" value={line.text_cs} onChange={(event) => updateLyrics(index, "text_cs", event.target.value)} />
                </label>
                <div className="music-admin-lyric-controls">
                  <strong>{index + 1}</strong>
                  <button type="button" className="music-admin-secondary" title="Posunout nahoru" aria-label={`Posunout řádek ${index + 1} nahoru`} disabled={index === 0} onClick={() => moveLyricLine(index, -1)}>↑</button>
                  <button type="button" className="music-admin-secondary" title="Posunout dolů" aria-label={`Posunout řádek ${index + 1} dolů`} disabled={index === form.lyrics_lines.length - 1} onClick={() => moveLyricLine(index, 1)}>↓</button>
                  <button type="button" className="music-admin-secondary" title="Vložit řádek pod tento" aria-label={`Vložit řádek pod ${index + 1}`} onClick={() => addLyricLine(index)}>+</button>
                  <button type="button" className="music-admin-danger" title="Odebrat řádek" aria-label={`Odebrat řádek ${index + 1}`} onClick={() => removeLyricLine(index)}>×</button>
                </div>
              </div>
            ))}
          </div>
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
                <p>
                  {parseArray(track.character_names).join(" + ") || track.artist || "Bez přiřazené postavy"}
                  {track.book_title ? ` · ${track.book_title}` : ""}
                  {track.volume_title ? ` · ${track.volume_number != null ? `${track.volume_number}. ` : ""}${track.volume_title}` : ""}
                </p>
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
