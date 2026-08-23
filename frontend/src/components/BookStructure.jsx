import { useEffect, useMemo, useState } from "react";
import {
  addPart,
  addVolume,
  deletePart,
  deleteVolume,
  getParts,
  getVolumes,
  updatePart,
  updateVolume,
  addChapter,
  deleteChapter,
  getChapters,
  updateChapter,
} from "../services/booksService";
import ChapterEditor from "./ChapterEditor";
import "./BookStructure.css";

function BookStructure({ book }) {
  const [volumes, setVolumes] = useState([]);
  const [parts, setParts] = useState([]);
  const [chapters, setChapters] = useState([]);

  const [selectedVolumeId, setSelectedVolumeId] = useState(null);
  const [selectedPartId, setSelectedPartId] = useState(null);
  const [selectedChapterId, setSelectedChapterId] = useState(null);

  const [volumeTitle, setVolumeTitle] = useState("");
  const [volumeNumber, setVolumeNumber] = useState("");
  const [editingVolumeId, setEditingVolumeId] = useState(null);
  const [showVolumeForm, setShowVolumeForm] = useState(false);

  const [partTitle, setPartTitle] = useState("");
  const [partNumber, setPartNumber] = useState("");
  const [partVolumeId, setPartVolumeId] = useState("");
  const [partTheme, setPartTheme] = useState("summer");
  const [editingPartId, setEditingPartId] = useState(null);
  const [showPartForm, setShowPartForm] = useState(false);

  const [editingChapterId, setEditingChapterId] = useState(null);
  const [chapterNumber, setChapterNumber] = useState("");
  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterVolumeId, setChapterVolumeId] = useState("");
  const [chapterPartId, setChapterPartId] = useState("");
  const [chapterContent, setChapterContent] = useState("");
  const [chapterStatus, setChapterStatus] = useState("concept");

  const [showChapterForm, setShowChapterForm] = useState(false);
  const [message, setMessage] = useState("");

  const selectedVolume =
    volumes.find((volume) => volume.id === selectedVolumeId) || null;

  const selectedPart =
    parts.find((part) => part.id === selectedPartId) || null;

  const selectedChapter =
    chapters.find((chapter) => chapter.id === selectedChapterId) || null;

  const visibleParts = useMemo(() => {
    if (!book.uses_parts) return [];

    // U samostatné knihy nejsou díly, takže části zobrazujeme rovnou.
    if (!book.uses_volumes) return parts;

    if (!selectedVolumeId) return [];

    return parts.filter(
      (part) =>
        !part.volume_id ||
        Number(part.volume_id) === Number(selectedVolumeId)
    );
  }, [book.uses_parts, book.uses_volumes, parts, selectedVolumeId]);

  const visibleChapters = useMemo(() => {
    if (book.uses_volumes && !selectedVolumeId) return [];
    if (book.uses_parts && selectedVolumeId && visibleParts.length > 0 && !selectedPartId) return [];

    return chapters.filter((chapter) => {
      const belongsToVolume =
        !selectedVolumeId ||
        !chapter.volume_id ||
        Number(chapter.volume_id) === Number(selectedVolumeId);

      // Pokud je vybraná část, zobrazujeme kapitoly této části.
      if (selectedPartId) {
        return (
          belongsToVolume &&
          (!chapter.part_id || Number(chapter.part_id) === Number(selectedPartId))
        );
      }

      // Pokud vybraný díl nemá žádné části, zobrazíme přímo
      // kapitoly, které nejsou přiřazené k žádné části.
      return belongsToVolume && !chapter.part_id;
    });
  }, [book.uses_volumes, book.uses_parts, chapters, selectedPartId, selectedVolumeId, visibleParts.length]);

  const availableChapterParts = useMemo(() => {
    if (!book.uses_parts || !chapterVolumeId) return parts;
    return parts.filter(
      (part) =>
        !part.volume_id ||
        Number(part.volume_id) === Number(chapterVolumeId)
    );
  }, [book.uses_parts, chapterVolumeId, parts]);

  async function loadStructure() {
    try {
      const [loadedVolumes, loadedParts, loadedChapters] = await Promise.all([
        book.uses_volumes ? getVolumes(book.id) : Promise.resolve([]),
        book.uses_parts ? getParts(book.id) : Promise.resolve([]),
        getChapters(book.id),
      ]);

      setVolumes(loadedVolumes);
      setParts(loadedParts);
      setChapters(loadedChapters);

      setSelectedVolumeId((current) =>
        loadedVolumes.some((item) => item.id === current) ? current : null
      );
      setSelectedPartId((current) =>
        loadedParts.some((item) => item.id === current) ? current : null
      );
      setSelectedChapterId((current) =>
        loadedChapters.some((item) => item.id === current) ? current : null
      );

      return loadedChapters;
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    resetAll();
    loadStructure();
  }, [book.id, book.uses_volumes, book.uses_parts]);

  function resetVolumeForm() {
    setEditingVolumeId(null);
    setVolumeTitle("");
    setVolumeNumber("");
    setShowVolumeForm(false);
  }

  function resetPartForm() {
    setEditingPartId(null);
    setPartTitle("");
    setPartNumber("");
    setPartVolumeId(selectedVolumeId || "");
    setPartTheme("summer");
    setShowPartForm(false);
  }

  function resetChapterForm() {
    setEditingChapterId(null);
    setChapterNumber("");
    setChapterTitle("");
    setChapterVolumeId(book.uses_volumes ? selectedVolumeId || "" : "");
    setChapterPartId(book.uses_parts ? selectedPartId || "" : "");
    setChapterContent("");
    setChapterStatus("concept");
    setShowChapterForm(false);
  }

  function resetAll() {
    setSelectedVolumeId(null);
    setSelectedPartId(null);
    setSelectedChapterId(null);
    setMessage("");
    setEditingVolumeId(null);
    setEditingPartId(null);
    setEditingChapterId(null);
    setShowVolumeForm(false);
    setShowPartForm(false);
    setShowChapterForm(false);
  }

  async function handleVolumeSubmit(event) {
    event.preventDefault();

    try {
      const data = {
        title: volumeTitle,
        number: volumeNumber === "" ? null : Number(volumeNumber),
      };

      if (editingVolumeId) {
        await updateVolume(book.id, editingVolumeId, data);
        setMessage("Díl byl upraven.");
      } else {
        await addVolume(book.id, data);
        setMessage("Díl byl přidán.");
      }

      resetVolumeForm();
      await loadStructure();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handlePartSubmit(event) {
    event.preventDefault();

    try {
      const data = {
        title: partTitle,
        number: partNumber === "" ? null : Number(partNumber),
        volume_id: partVolumeId === "" ? null : Number(partVolumeId),
        theme: partTheme,
      };

      if (editingPartId) {
        await updatePart(book.id, editingPartId, data);
        setMessage("Část byla upravena.");
      } else {
        await addPart(book.id, data);
        setMessage("Část byla přidána.");
      }

      resetPartForm();
      await loadStructure();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function editVolume(volume) {
    setEditingVolumeId(volume.id);
    setVolumeTitle(volume.title || "");
    setVolumeNumber(volume.number ?? "");
    setShowVolumeForm(true);
  }

  function editPart(part) {
    setEditingPartId(part.id);
    setPartTitle(part.title || "");
    setPartNumber(part.number ?? "");
    setPartVolumeId(part.volume_id ?? selectedVolumeId ?? "");
    setPartTheme(part.theme || "summer");
    setShowPartForm(true);
  }

  async function removeVolume(volume) {
    if (!window.confirm(`Opravdu smazat díl „${volume.title}“?`)) return;

    try {
      await deleteVolume(book.id, volume.id);
      setSelectedVolumeId(null);
      setSelectedPartId(null);
      setSelectedChapterId(null);
      setMessage("Díl byl smazán.");
      await loadStructure();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function removePart(part) {
    if (!window.confirm(`Opravdu smazat část „${part.title}“?`)) return;

    try {
      await deletePart(book.id, part.id);
      setSelectedPartId(null);
      setSelectedChapterId(null);
      setMessage("Část byla smazána.");
      await loadStructure();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function createNewChapter() {
    setSelectedChapterId(null);
    setEditingChapterId(null);
    setChapterNumber("");
    setChapterTitle("");
    setChapterVolumeId(book.uses_volumes ? selectedVolumeId || "" : "");
    setChapterPartId(book.uses_parts ? selectedPartId || "" : "");
    setChapterContent("");
    setChapterStatus("concept");
    setShowChapterForm(true);
    setMessage("");
  }

  function editChapter(chapter) {
    setSelectedChapterId(chapter.id);
    setEditingChapterId(chapter.id);
    setChapterNumber(chapter.number ?? "");
    setChapterTitle(chapter.title || "");
    setChapterVolumeId(
      book.uses_volumes ? chapter.volume_id ?? selectedVolumeId ?? "" : ""
    );
    setChapterPartId(
      book.uses_parts ? chapter.part_id ?? selectedPartId ?? "" : ""
    );
    setChapterContent(chapter.content_html || "");
    setChapterStatus(chapter.status || "concept");
    setShowChapterForm(true);
    setMessage("");
  }

  async function handleChapterSubmit(event) {
    event.preventDefault();

    try {
      const data = {
        number: chapterNumber === "" ? "" : Number(chapterNumber),
        title: chapterTitle,
        volume_id:
          book.uses_volumes && chapterVolumeId !== ""
            ? Number(chapterVolumeId)
            : null,
        part_id:
          book.uses_parts && chapterPartId !== ""
            ? Number(chapterPartId)
            : null,
        content_html: chapterContent,
        status: chapterStatus,
      };

      let savedChapter;

      if (editingChapterId) {
        savedChapter = await updateChapter(
          book.id,
          editingChapterId,
          data
        );
        setMessage("Kapitola byla upravena.");
      } else {
        savedChapter = await addChapter(book.id, data);
        setMessage("Kapitola byla přidána.");
      }

      // Backend může po POST/PUT vrátit jen {message}. Proto vždy znovu
      // načteme skutečný seznam kapitol a následně otevřeme uloženou kapitolu.
      const refreshedChapters = await loadStructure();

      const savedId =
        savedChapter?.id ??
        savedChapter?.chapter?.id ??
        savedChapter?.data?.id ??
        savedChapter?.chapter_id;

      const normalizedPartId =
        chapterPartId === "" ? null : Number(chapterPartId);
      const normalizedVolumeId =
        chapterVolumeId === "" ? null : Number(chapterVolumeId);

      const sameRelation = (chapter, key, expected) => {
        const value = chapter?.[key] ?? chapter?.[key.replace("_", "")] ?? null;
        return expected === null
          ? value === null || value === undefined || value === ""
          : Number(value) === Number(expected);
      };

      const refreshedChapter = savedId
        ? refreshedChapters?.find(
            (chapter) => Number(chapter.id) === Number(savedId)
          )
        : refreshedChapters?.find(
            (chapter) =>
              String(chapter.title || "").trim() === String(chapterTitle || "").trim() &&
              String(chapter.number ?? "") === String(chapterNumber ?? "") &&
              sameRelation(chapter, "part_id", normalizedPartId) &&
              sameRelation(chapter, "volume_id", normalizedVolumeId)
          );

      if (refreshedChapter?.id) {
        setSelectedChapterId(refreshedChapter.id);
        setEditingChapterId(refreshedChapter.id);
      }

      // Zavřeme formulář až po úspěšném reloadu. Seznam kapitol tak zůstane
      // okamžitě synchronizovaný s databází.
      setShowChapterForm(false);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function removeChapter(chapter) {
    if (!window.confirm(`Opravdu smazat kapitolu „${chapter.title}“?`)) return;

    try {
      await deleteChapter(book.id, chapter.id);
      if (selectedChapterId === chapter.id) setSelectedChapterId(null);
      setShowChapterForm(false);
      setEditingChapterId(null);
      setMessage("Kapitola byla smazána.");
      await loadStructure();
    } catch (error) {
      setMessage(error.message);
    }
  }

  const volumeName = (volume) =>
    volume.number
      ? `Díl ${volume.number}${volume.title ? ` – ${volume.title}` : ""}`
      : volume.title;

  const partName = (part) =>
    part.number
      ? `Část ${part.number}${part.title ? ` – ${part.title}` : ""}`
      : part.title;

  const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("cs-CZ");
  };

  const chapterInfo = selectedChapter || null;

  const canOpenChapters =
    (!book.uses_volumes || !!selectedVolumeId) &&
    (!book.uses_parts || visibleParts.length === 0 || !!selectedPartId);

  const chaptersContext = selectedPart
    ? partName(selectedPart)
    : selectedVolume
      ? `${volumeName(selectedVolume)} · bez částí`
      : "";

  return (
    <div className="book-structure">
      <div className="book-structure-columns">
        {/* 1. DÍLY */}
        <section className="structure-panel volumes-panel">
          <div className="structure-panel-header">
            <div>
              <span>STRUKTURA</span>
              <h2>Díly</h2>
            </div>
            <b>{volumes.length}</b>
          </div>

          <div className="structure-panel-body">
            {!book.uses_volumes ? (
              <p className="structure-muted">Tato kniha díly nepoužívá.</p>
            ) : (
              <>
                <div className="structure-list">
                  {volumes.map((volume) => (
                    <article
                      key={volume.id}
                      className={`structure-card ${
                        selectedVolumeId === volume.id ? "is-selected" : ""
                      }`}
                      onClick={() => {
                        setSelectedVolumeId(volume.id);
                        setSelectedPartId(null);
                        setSelectedChapterId(null);
                        setShowPartForm(false);
                        setShowChapterForm(false);
                      }}
                    >
                      <div className="structure-card-title">
                        {volumeName(volume)}
                      </div>

                      <div className="structure-card-actions">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            editVolume(volume);
                          }}
                        >
                          Upravit
                        </button>
                        <button
                          type="button"
                          className="danger"
                          onClick={(event) => {
                            event.stopPropagation();
                            removeVolume(volume);
                          }}
                        >
                          Smazat
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                <button
                  type="button"
                  className="structure-add-button"
                  onClick={() => {
                    setEditingVolumeId(null);
                    setVolumeTitle("");
                    setVolumeNumber("");
                    setShowVolumeForm((value) => !value);
                  }}
                >
                  ＋ {showVolumeForm ? "Zavřít" : "Přidat díl"}
                </button>

                {showVolumeForm && (
                  <form className="structure-form" onSubmit={handleVolumeSubmit}>
                    <label>Číslo dílu</label>
                    <input
                      type="number"
                      min="1"
                      value={volumeNumber}
                      onChange={(e) => setVolumeNumber(e.target.value)}
                    />

                    <label>Název dílu</label>
                    <input
                      type="text"
                      value={volumeTitle}
                      onChange={(e) => setVolumeTitle(e.target.value)}
                      required
                    />

                    <div className="structure-form-actions">
                      <button type="submit">
                        {editingVolumeId ? "Uložit změny" : "Přidat díl"}
                      </button>
                      <button type="button" onClick={resetVolumeForm}>
                        Zrušit
                      </button>
                    </div>
                  </form>
                )}

                {!selectedVolumeId && (
                  <p className="structure-hint">
                    Klikni na díl. Teprve potom se zobrazí jeho části.
                  </p>
                )}
              </>
            )}
          </div>
        </section>

        {/* 2. ČÁSTI */}
        <section className="structure-panel parts-panel">
          <div className="structure-panel-header">
            <div>
              <span>STRUKTURA</span>
              <h2>Části</h2>
            </div>
            <b>{selectedVolumeId ? visibleParts.length : 0}</b>
          </div>

          {book.uses_volumes && !selectedVolumeId ? (
            <div className="structure-locked">
              <span>02</span>
              <p>Nejdříve vyber díl.</p>
            </div>
          ) : !book.uses_parts ? (
            <div className="structure-locked">
              <p>Tato kniha části nepoužívá.</p>
            </div>
          ) : (
            <div className="structure-panel-body">
              <div className="structure-context">
                {selectedVolume
                  ? volumeName(selectedVolume)
                  : "Samostatná kniha"}
              </div>

              <div className="structure-list">
                {visibleParts.map((part) => (
                  <article
                    key={part.id}
                    className={`structure-card ${
                      selectedPartId === part.id ? "is-selected" : ""
                    }`}
                    onClick={() => {
                      setSelectedPartId(part.id);
                      setSelectedChapterId(null);
                      setShowChapterForm(false);
                    }}
                  >
                    <div className="structure-card-title">{partName(part)}</div>
                    <div className="structure-card-actions">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          editPart(part);
                        }}
                      >
                        Upravit
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={(event) => {
                          event.stopPropagation();
                          removePart(part);
                        }}
                      >
                        Smazat
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <button
                type="button"
                className="structure-add-button"
                onClick={() => {
                  setEditingPartId(null);
                  setPartTitle("");
                  setPartNumber("");
                  setPartVolumeId(selectedVolumeId || "");
                  setPartTheme("summer");
                  setShowPartForm((value) => !value);
                }}
              >
                ＋ {showPartForm ? "Zavřít" : "Přidat část"}
              </button>

              {showPartForm && (
                <form className="structure-form" onSubmit={handlePartSubmit}>
                  <label>Číslo části</label>
                  <input
                    type="number"
                    min="1"
                    value={partNumber}
                    onChange={(e) => setPartNumber(e.target.value)}
                  />

                  <label>Název části</label>
                  <input
                    type="text"
                    value={partTitle}
                    onChange={(e) => setPartTitle(e.target.value)}
                    required
                  />
                  <label>Design části</label>
<select
  value={partTheme}
  onChange={(e) => setPartTheme(e.target.value)}
>
  <option value="summer">Léto</option>
  <option value="autumn">Podzim</option>
  <option value="winter">Zima</option>
  <option value="spring">Jaro</option>
</select>

                  <div className="structure-form-actions">
                    <button type="submit">
                      {editingPartId ? "Uložit změny" : "Přidat část"}
                    </button>
                    <button type="button" onClick={resetPartForm}>
                      Zrušit
                    </button>
                  </div>
                </form>
              )}

              {!selectedPartId && visibleParts.length > 0 && (
                <p className="structure-hint">
                  Klikni na část. Teprve potom se zobrazí kapitoly.
                </p>
              )}
            </div>
          )}
        </section>

        {/* 3. KAPITOLY */}
        <section className="structure-panel chapters-panel">
          <div className="structure-panel-header">
            <div>
              <span>OBSAH</span>
              <h2>Kapitoly</h2>
            </div>
            <b>{canOpenChapters ? visibleChapters.length : 0}</b>
          </div>

          {!canOpenChapters ? (
            <div className="structure-locked">
              <span>03</span>
              <p>Nejdříve vyber část.</p>
            </div>
          ) : (
            <div className="structure-panel-body">
              <div className="structure-context">
                {chaptersContext || (book.uses_parts ? "Bez části" : "Samostatná kniha")}
              </div>

              <button
                type="button"
                className="structure-add-button primary"
                onClick={createNewChapter}
              >
                ＋ Nová kapitola
              </button>

              <div className="structure-list chapter-list chapter-list-visible">
                {visibleChapters.map((chapter) => (
                  <article
                    key={chapter.id}
                    className={`structure-card chapter-card ${
                      selectedChapterId === chapter.id ? "is-selected" : ""
                    }`}
                    onClick={() => editChapter(chapter)}
                  >
                    <div>
                      <div className="structure-card-title">
                        {chapter.number ? `${chapter.number}. ` : ""}
                        {chapter.title}
                      </div>
                      <small>
                        {chapter.status === "published"
                          ? "● Publikováno"
                          : "● Koncept"}
                      </small>
                    </div>

                  </article>
                ))}
              </div>

              {!visibleChapters.length && (
                <p className="structure-hint">Zatím tu není žádná kapitola.</p>
              )}
            </div>
          )}
        </section>

        {/* 4. EDITOR */}
        <section className="structure-panel editor-panel">
          {!showChapterForm && !chapterInfo ? (
            <div className="structure-locked editor-empty">
              <span>04</span>
              <p>Vyber kapitolu nebo vytvoř novou.</p>
            </div>
          ) : (
            <form className="chapter-workspace" onSubmit={handleChapterSubmit}>
              <div className="chapter-workspace-header">
                <div>
                  <span>{editingChapterId ? "ÚPRAVA KAPITOLY" : "NOVÁ KAPITOLA"}</span>
                  <h2>{editingChapterId ? chapterTitle : "Nová kapitola"}</h2>
                </div>

              </div>

              <div className="chapter-form-grid">
                <label>
                  Číslo kapitoly
                  <input
                    type="number"
                    min="1"
                    value={chapterNumber}
                    onChange={(e) => setChapterNumber(e.target.value)}
                    required
                  />
                </label>

                <label className="chapter-title-field">
                  Název kapitoly
                  <input
                    type="text"
                    value={chapterTitle}
                    onChange={(e) => setChapterTitle(e.target.value)}
                    required
                  />
                </label>
              </div>

              <div className="chapter-form-grid">
                {book.uses_volumes && (
                  <label>
                    Díl
                    <select
                      value={chapterVolumeId}
                      onChange={(e) => {
                        setChapterVolumeId(e.target.value);
                        setChapterPartId("");
                      }}
                    >
                      <option value="">Bez dílu</option>
                      {volumes.map((volume) => (
                        <option key={volume.id} value={volume.id}>
                          {volumeName(volume)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {book.uses_parts && (
                  <label>
                    Část
                    <select
                      value={chapterPartId}
                      onChange={(e) => setChapterPartId(e.target.value)}
                    >
                      <option value="">Bez části</option>
                      {availableChapterParts.map((part) => (
                        <option key={part.id} value={part.id}>
                          {partName(part)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>

              <div className="editor-label">TEXT KAPITOLY</div>
              <ChapterEditor
                value={chapterContent}
                onChange={setChapterContent}
              />

              <div className="chapter-workspace-footer">
                <label>
                  Stav
                  <select
                    value={chapterStatus}
                    onChange={(e) => setChapterStatus(e.target.value)}
                  >
                    <option value="concept">Koncept</option>
                    <option value="published">Publikováno</option>
                  </select>
                </label>

                <div>
                  {editingChapterId && selectedChapter && (
                    <button
                      type="button"
                      className="chapter-delete-bottom"
                      onClick={() => removeChapter(selectedChapter)}
                    >
                      Smazat kapitolu
                    </button>
                  )}

                  <button type="submit" className="structure-save-button">
                    Uložit kapitolu
                  </button>
                  <button
                    type="button"
                    className="structure-cancel-button"
                    onClick={() => {
                      setShowChapterForm(false);
                      setEditingChapterId(null);
                    }}
                  >
                    Zrušit
                  </button>
                </div>
              </div>
            </form>
          )}
        </section>

        {/* 5. INFORMACE */}
        <aside className="structure-panel info-panel">
          <div className="structure-panel-header">
            <div>
              <span>ⓘ INFORMACE</span>
              <h2>O kapitole</h2>
            </div>
          </div>

          {!chapterInfo ? (
            <div className="structure-locked">
              <span>05</span>
              <p>Vyber kapitolu ze seznamu.</p>
            </div>
          ) : (
            <div className="chapter-info">
              <div className="chapter-info-title">
                {chapterInfo.number ? `${chapterInfo.number}. ` : ""}
                {chapterInfo.title}
              </div>

              <div className="info-row">
                <span>Číslo kapitoly</span>
                <strong>{chapterInfo.number ?? "—"}</strong>
              </div>

              <div className="info-row">
                <span>Stav</span>
                <strong>
                  {chapterInfo.status === "published"
                    ? "Publikováno"
                    : "Koncept"}
                </strong>
              </div>

              <div className="info-row">
                <span>Pořadí</span>
                <strong>{chapterInfo.order ?? chapterInfo.position ?? chapterInfo.number ?? "—"}</strong>
              </div>

              <div className="info-row">
                <span>Datum vytvoření</span>
                <strong>
                  {formatDate(
                    chapterInfo.created_at ||
                      chapterInfo.createdAt ||
                      chapterInfo.created
                  )}
                </strong>
              </div>

              <div className="info-row">
                <span>Poslední úprava</span>
                <strong>
                  {formatDate(
                    chapterInfo.updated_at ||
                      chapterInfo.updatedAt ||
                      chapterInfo.modified_at ||
                      chapterInfo.modified
                  )}
                </strong>
              </div>

              <div className="info-publish">
                <span>Publikovat</span>
                <span
                  className={`status-pill ${
                    chapterInfo.status === "published" ? "published" : ""
                  }`}
                >
                  {chapterInfo.status === "published"
                    ? "Ano"
                    : "Ne"}
                </span>
              </div>

              <button
                type="button"
                className="info-edit-button"
                onClick={() => editChapter(chapterInfo)}
              >
                ✎ Upravit kapitolu
              </button>
            </div>
          )}
        </aside>
      </div>

      {message && <div className="structure-message">{message}</div>}
    </div>
  );
}

export default BookStructure;