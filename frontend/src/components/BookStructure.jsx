import { useEffect, useMemo, useRef, useState } from "react";

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
  getCharacters,
} from "../services/booksService";

import {
  getChapterNarrator,
  setChapterNarrator,
} from "../services/aeilService";

import ChapterEditor from "./ChapterEditor";
import "./ChapterEditor.css";
import "./BookStructure.css";


function BookStructure({ book }) {
  /* =====================================================
     DATA
  ===================================================== */

  const [volumes, setVolumes] = useState([]);
  const [parts, setParts] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [aeilCharacters, setAeilCharacters] = useState([]);

  const [selectedVolumeId, setSelectedVolumeId] = useState(null);
  const [selectedPartId, setSelectedPartId] = useState(null);

  /* =====================================================
     DÍLY
  ===================================================== */

  const [volumeNumber, setVolumeNumber] = useState("");
  const [volumeTitle, setVolumeTitle] = useState("");
  const [editingVolumeId, setEditingVolumeId] = useState(null);

  /* =====================================================
     ČÁSTI
  ===================================================== */

  const [partNumber, setPartNumber] = useState("");
  const [partTitle, setPartTitle] = useState("");
  const [partVolumeId, setPartVolumeId] = useState("");
  const [editingPartId, setEditingPartId] = useState(null);

  /* =====================================================
     KAPITOLA / EDITOR
  ===================================================== */

  const [selectedChapterId, setSelectedChapterId] = useState(null);
  const [editingChapterId, setEditingChapterId] = useState(null);

  const [chapterNumber, setChapterNumber] = useState("");
  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterVolumeId, setChapterVolumeId] = useState("");
  const [chapterPartId, setChapterPartId] = useState("");
  const [chapterContent, setChapterContent] = useState("");
  const [chapterStatus, setChapterStatus] = useState("concept");
  const [chapterListTab, setChapterListTab] = useState("published");
  const [chapterNarratorId, setChapterNarratorId] = useState("");

  const [message, setMessage] = useState("");
  const loadSequence = useRef(0);

  /* =====================================================
     NAČTENÍ
  ===================================================== */

  async function loadStructure() {
    const requestId = ++loadSequence.current;
    const requestedBookId = Number(book.id);
    try {
      const [
        loadedVolumes,
        loadedParts,
        loadedChapters,
        loadedAeilCharacters,
      ] = await Promise.all([
        book.uses_volumes
          ? getVolumes(book.id)
          : Promise.resolve([]),

        book.uses_parts
          ? getParts(book.id)
          : Promise.resolve([]),

        getChapters(book.id, { includeConcepts: true }),

        Number(book.id) === 2
          ? getCharacters(book.id)
          : Promise.resolve([]),
      ]);

      // A response from a previously selected book must never overwrite the current book.
      if (requestId !== loadSequence.current) return;

      setVolumes(Array.isArray(loadedVolumes) ? loadedVolumes : []);
      setParts(Array.isArray(loadedParts) ? loadedParts : []);
      // Defensive client-side book isolation in addition to the API WHERE book_id filter.
      setChapters(
        (Array.isArray(loadedChapters) ? loadedChapters : []).filter(
          (chapter) => Number(chapter.book_id) === requestedBookId
        )
      );

      setSelectedVolumeId((current) =>
        loadedVolumes.some(
          (item) => Number(item.id) === Number(current)
        )
          ? current
          : null
      );

      setSelectedPartId((current) =>
        loadedParts.some(
          (item) => Number(item.id) === Number(current)
        )
          ? current
          : null
      );

      setAeilCharacters(
        Number(book.id) === 2 &&
        Array.isArray(loadedAeilCharacters)
          ? loadedAeilCharacters
          : []
      );

      /*
       * Pokud byla otevřená kapitola,
       * po reloadu ji znovu napojíme na nová data.
       */
      if (selectedChapterId) {
        const refreshedChapter = loadedChapters.find(
          (chapter) =>
            Number(chapter.book_id) === requestedBookId &&
            Number(chapter.id) === Number(selectedChapterId)
        );

        if (refreshedChapter) {
          setChapterNumber(refreshedChapter.number ?? "");
          setChapterTitle(refreshedChapter.title || "");
          setChapterVolumeId(
            refreshedChapter.volume_id ?? ""
          );
          setChapterPartId(
            refreshedChapter.part_id ?? ""
          );
          setChapterContent(
            refreshedChapter.content_html || ""
          );
          setChapterStatus(
            refreshedChapter.status || "concept"
          );

          if (Number(book.id) === 2) {
            try {
              const narrator =
                await getChapterNarrator(
                  refreshedChapter.id
                );
              if (requestId !== loadSequence.current) return;

              setChapterNarratorId(
                narrator?.character_id ?? ""
              );
            } catch (narratorError) {
              console.error(narratorError);
              setChapterNarratorId("");
            }
          }
        }
      }
    } catch (error) {
      if (requestId !== loadSequence.current) return;
      console.error(error);
      setMessage(error.message);
    }
  }

  useEffect(() => {
    // Invalidate in-flight requests immediately when the selected book changes.
    loadSequence.current += 1;
    setVolumes([]);
    setParts([]);
    setChapters([]);
    setSelectedVolumeId(null);
    setSelectedPartId(null);
    setSelectedChapterId(null);
    resetChapterEditor();
    loadStructure();
    return () => { loadSequence.current += 1; };
  }, [
    book.id,
    book.uses_volumes,
    book.uses_parts,
  ]);

  /* =====================================================
     NÁZVY
  ===================================================== */

  const volumeName = (volume) =>
    volume.number
      ? `Díl ${volume.number}${
          volume.title
            ? ` – ${volume.title}`
            : ""
        }`
      : volume.title;

  const partName = (part) =>
    part.number
      ? `Část ${part.number}${
          part.title
            ? ` – ${part.title}`
            : ""
        }`
      : part.title;

  const chapterLocation = (chapter) => {
    const volume = volumes.find(
      (item) => Number(item.id) === Number(chapter.volume_id)
    );

    const part = parts.find(
      (item) => Number(item.id) === Number(chapter.part_id)
    );

    const labels = [];

    if (volume) {
      labels.push(volumeName(volume));
    }

    if (part) {
      labels.push(partName(part));
    }

    return labels.join(" · ");
  };

  const selectedVolume =
    volumes.find(
      (volume) => Number(volume.id) === Number(selectedVolumeId)
    ) || null;

  const selectedPart =
    parts.find(
      (part) => Number(part.id) === Number(selectedPartId)
    ) || null;

  const visibleParts = useMemo(() => {
    if (!book.uses_parts) return [];

    if (!book.uses_volumes) {
      return parts;
    }

    if (!selectedVolumeId) {
      return [];
    }

    return parts.filter(
      (part) =>
        !part.volume_id ||
        Number(part.volume_id) === Number(selectedVolumeId)
    );
  }, [
    book.uses_parts,
    book.uses_volumes,
    parts,
    selectedVolumeId,
  ]);

  // Only show chapters belonging to the currently selected book and, when
  // a structure node is selected, to that exact volume/part.
  const visibleChapters = chapters.filter((chapter) => {
    if (Number(chapter.book_id) !== Number(book.id)) return false;
    if (selectedPartId) {
      return Number(chapter.part_id) === Number(selectedPartId);
    }
    if (selectedVolumeId) {
      return (
        Number(chapter.volume_id) === Number(selectedVolumeId) &&
        (chapter.part_id == null || chapter.part_id === "")
      );
    }
    return true;
  });

  // Chapters are kept in two separate administration folders. A missing status
  // is treated as a concept so unpublished content is never accidentally shown
  // as published in the editor.
  const publishedChapters = visibleChapters.filter(
    (chapter) => chapter.status === "published"
  );
  const conceptChapters = visibleChapters.filter(
    (chapter) => chapter.status !== "published"
  );
  const displayedChapters =
    chapterListTab === "concept" ? conceptChapters : publishedChapters;


  const canOpenChapters =
    (!book.uses_volumes || Boolean(selectedVolumeId)) &&
    (!book.uses_parts || Boolean(selectedPartId) || visibleParts.length === 0);

  const showVolumesPanel = Boolean(book.uses_volumes && !selectedVolumeId);
  const showPartsPanel = Boolean(
    book.uses_parts &&
    !selectedPartId &&
    (!book.uses_volumes || Boolean(selectedVolumeId))
  );

  const chaptersContext = selectedPart
    ? partName(selectedPart)
    : selectedVolume
      ? `${volumeName(selectedVolume)} · bez částí`
      : "";

  /* =====================================================
     DOSTUPNÉ ČÁSTI PRO KAPITOLU
  ===================================================== */

  const availableChapterParts = useMemo(() => {
    if (!book.uses_parts) {
      return [];
    }

    if (!chapterVolumeId) {
      return parts;
    }

    return parts.filter(
      (part) =>
        !part.volume_id ||
        Number(part.volume_id) ===
          Number(chapterVolumeId)
    );
  }, [
    book.uses_parts,
    chapterVolumeId,
    parts,
  ]);

  /* =====================================================
     DÍLY – PŘIDAT / UPRAVIT
  ===================================================== */

  async function handleVolumeSubmit(event) {
    event.preventDefault();

    try {
      const data = {
        title: volumeTitle,
        number:
          volumeNumber === ""
            ? null
            : Number(volumeNumber),
      };

      if (editingVolumeId) {
        await updateVolume(
          book.id,
          editingVolumeId,
          data
        );

        setMessage("Díl byl upraven.");
      } else {
        await addVolume(book.id, data);

        setMessage("Díl byl přidán.");
      }

      setVolumeNumber("");
      setVolumeTitle("");
      setEditingVolumeId(null);

      await loadStructure();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function editVolume(volume) {
    setEditingVolumeId(volume.id);
    setVolumeNumber(volume.number ?? "");
    setVolumeTitle(volume.title || "");
  }

  async function removeVolume(volume) {
    if (
      !window.confirm(
        `Opravdu smazat díl „${volume.title}“?`
      )
    ) {
      return;
    }

    try {
      await deleteVolume(book.id, volume.id);

      setMessage("Díl byl smazán.");

      if (
        editingVolumeId === volume.id
      ) {
        setEditingVolumeId(null);
        setVolumeNumber("");
        setVolumeTitle("");
      }

      await loadStructure();
    } catch (error) {
      setMessage(error.message);
    }
  }

  /* =====================================================
     ČÁSTI – PŘIDAT / UPRAVIT
  ===================================================== */

  async function handlePartSubmit(event) {
    event.preventDefault();

    try {
      const data = {
        title: partTitle,
        number:
          partNumber === ""
            ? null
            : Number(partNumber),

        volume_id:
          partVolumeId !== ""
            ? Number(partVolumeId)
            : (book.uses_volumes && selectedVolumeId
                ? Number(selectedVolumeId)
                : null),
      };

      if (editingPartId) {
        await updatePart(
          book.id,
          editingPartId,
          data
        );

        setMessage("Část byla upravena.");
      } else {
        await addPart(book.id, data);

        setMessage("Část byla přidána.");
      }

      setPartNumber("");
      setPartTitle("");
      setPartVolumeId("");
      setEditingPartId(null);

      await loadStructure();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function editPart(part) {
    setEditingPartId(part.id);
    setPartNumber(part.number ?? "");
    setPartTitle(part.title || "");
    setPartVolumeId(part.volume_id ?? "");
  }

  async function removePart(part) {
    if (
      !window.confirm(
        `Opravdu smazat část „${part.title}“?`
      )
    ) {
      return;
    }

    try {
      await deletePart(book.id, part.id);

      setMessage("Část byla smazána.");

      if (
        editingPartId === part.id
      ) {
        setEditingPartId(null);
        setPartNumber("");
        setPartTitle("");
        setPartVolumeId("");
      }

      await loadStructure();
    } catch (error) {
      setMessage(error.message);
    }
  }

  /* =====================================================
     KAPITOLA – NOVÁ
  ===================================================== */

  function resetChapterEditor() {
    setEditingChapterId(null);
    setSelectedChapterId(null);

    setChapterNumber("");
    setChapterTitle("");
    setChapterVolumeId("");
    setChapterPartId("");
    setChapterContent("");
    setChapterStatus("concept");
    setChapterListTab("concept");
    setChapterNarratorId("");
  }

  function handleNewChapter() {
    resetChapterEditor();

    setChapterVolumeId(
      book.uses_volumes ? selectedVolumeId || "" : ""
    );

    setChapterPartId(
      book.uses_parts ? selectedPartId || "" : ""
    );

    setMessage("");
  }

  /* =====================================================
     KAPITOLA – OTEVŘÍT
  ===================================================== */

  function openChapter(chapter) {
    setSelectedChapterId(chapter.id);
    setEditingChapterId(chapter.id);

    setChapterNumber(
      chapter.number ?? ""
    );

    setChapterTitle(
      chapter.title || ""
    );

    setChapterVolumeId(
      chapter.volume_id ?? selectedVolumeId ?? ""
    );

    setChapterPartId(
      chapter.part_id ?? selectedPartId ?? ""
    );

    setChapterContent(
      chapter.content_html || ""
    );

    setChapterStatus(
      chapter.status || "concept"
    );
    setChapterListTab(
      chapter.status === "published" ? "published" : "concept"
    );

    setChapterNarratorId("");

    if (Number(book.id) === 2) {
      getChapterNarrator(chapter.id)
        .then((narrator) => {
          setChapterNarratorId(
            narrator?.character_id ?? ""
          );
        })
        .catch((error) => {
          console.error(error);
          setChapterNarratorId("");
        });
    }

    setMessage("");
  }

  /* =====================================================
     KAPITOLA – ULOŽIT
  ===================================================== */

  async function handleChapterSubmit(event) {
    event.preventDefault();

    try {
      if (Number(book.id) === 2 && !chapterNarratorId) {
        setMessage(
          "Vyberte vypravěče kapitoly."
        );
        return;
      }

      const data = {
        number:
          chapterNumber === ""
            ? ""
            : Number(chapterNumber),

        title: chapterTitle,

        volume_id:
          book.uses_volumes &&
          chapterVolumeId !== ""
            ? Number(chapterVolumeId)
            : null,

        part_id:
          book.uses_parts &&
          chapterPartId !== ""
            ? Number(chapterPartId)
            : null,

        content_html: chapterContent,

        status: chapterStatus,
      };

      if (editingChapterId) {
        await updateChapter(
          book.id,
          editingChapterId,
          data
        );

        if (Number(book.id) === 2) {
          await setChapterNarrator(
            editingChapterId,
            Number(chapterNarratorId)
          );
        }

        setChapterListTab(chapterStatus === "published" ? "published" : "concept");
        setMessage("Kapitola byla uložena.");
      } else {
        const created = await addChapter(
          book.id,
          data
        );

        /*
         * Pokud backend vrátí vytvořenou kapitolu,
         * rovnou ji otevřeme.
         */
        if (created?.id) {
          setSelectedChapterId(created.id);
          setEditingChapterId(created.id);

          if (Number(book.id) === 2) {
            await setChapterNarrator(
              created.id,
              Number(chapterNarratorId)
            );
          }
        }

        setChapterListTab(chapterStatus === "published" ? "published" : "concept");
        setMessage("Kapitola byla přidána.");
      }

      await loadStructure();
    } catch (error) {
      console.error(error);
      setMessage(error.message);
    }
  }

  /* =====================================================
     KAPITOLA – SMAZAT
  ===================================================== */

  async function removeChapter(chapter) {
    if (
      !window.confirm(
        `Opravdu smazat kapitolu „${chapter.number}. ${chapter.title}“?`
      )
    ) {
      return;
    }

    try {
      await deleteChapter(
        book.id,
        chapter.id
      );

      setMessage("Kapitola byla smazána.");

      if (
        selectedChapterId === chapter.id
      ) {
        resetChapterEditor();
      }

      await loadStructure();
    } catch (error) {
      setMessage(error.message);
    }
  }

  /* =====================================================
     VYBRANÁ KAPITOLA
  ===================================================== */

  const selectedChapter =
    chapters.find(
      (chapter) =>
        Number(chapter.book_id) === Number(book.id) &&
        Number(chapter.id) === Number(selectedChapterId)
    ) || null;

  /* =====================================================
     DATUMY
  ===================================================== */

  function formatDate(value) {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString(
      "cs-CZ",
      {
        day: "numeric",
        month: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <section className="book-structure">
      <div
        className={`book-structure-columns ${
          !book.uses_volumes && !book.uses_parts
            ? "book-structure-columns--standalone"
            : ""
        }`}
      >

      {/* =================================================
          1. DÍLY
      ================================================= */}
      {showVolumesPanel && (
        <section className="structure-column volumes-column">
          <div className="structure-column-header">
            <div>
              <span className="structure-label">
                STRUKTURA
              </span>
              <h3>Díly</h3>
            </div>

            <span className="structure-count">
              {volumes.length}
            </span>
          </div>

          <div className="structure-items">
            {volumes.length === 0 && (
              <div className="structure-empty">
                Zatím žádné díly.
              </div>
            )}

            {volumes.map((volume) => (
              <div
                key={volume.id}
                className={`structure-item ${
                  Number(selectedVolumeId) === Number(volume.id)
                    ? "is-selected"
                    : ""
                }`}
                onClick={() => {
                  setSelectedVolumeId(volume.id);
                  setPartVolumeId(String(volume.id));
                  setSelectedPartId(null);
                  setSelectedChapterId(null);
                }}
                style={{ cursor: "pointer" }}
              >
                <div className="structure-item-name">
                  {volumeName(volume)}
                </div>

                <div className="structure-item-actions">
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
                    onClick={(event) => {
                      event.stopPropagation();
                      removeVolume(volume);
                    }}
                  >
                    Smazat
                  </button>
                </div>
              </div>
            ))}
          </div>

          <form
            className="structure-add-form"
            onSubmit={handleVolumeSubmit}
          >
            <div className="structure-form-heading">
              {editingVolumeId
                ? "Upravit díl"
                : "Nový díl"}
            </div>

            <input
              type="number"
              min="1"
              placeholder="Číslo"
              value={volumeNumber}
              onChange={(event) =>
                setVolumeNumber(event.target.value)
              }
            />

            <input
              type="text"
              placeholder="Název dílu"
              value={volumeTitle}
              onChange={(event) =>
                setVolumeTitle(event.target.value)
              }
              required
            />

            <div className="structure-form-actions">
              <button type="submit" >
                {editingVolumeId
                  ? "Uložit díl"
                  : "+ Přidat díl"}
              </button>

              {editingVolumeId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingVolumeId(null);
                    setVolumeNumber("");
                    setVolumeTitle("");
                  }}
                >
                  Zrušit
                </button>
              )}
            </div>
          </form>

          {!selectedVolumeId && volumes.length > 0 && (
            <p className="structure-hint">
              Klikni na díl. Teprve potom se zobrazí jeho části.
            </p>
          )}
        </section>
      )}

      {/* =================================================
          2. ČÁSTI
      ================================================= */}
      {showPartsPanel && (
        <section className="structure-column parts-column">
          <div className="structure-column-header">
            <div>
              <span className="structure-label">
                STRUKTURA
              </span>
              <h3>Části</h3>
            </div>
            {book.uses_volumes && (
              <button type="button" className="structure-back-link" onClick={() => {
                setSelectedVolumeId(null);
                setSelectedPartId(null);
                setSelectedChapterId(null);
              }}>← Díly</button>
            )}

            <span className="structure-count">
              {book.uses_volumes
                ? selectedVolumeId
                  ? visibleParts.length
                  : 0
                : parts.length}
            </span>
          </div>

          {book.uses_volumes && !selectedVolumeId ? (
            <div className="structure-locked">
              <span>02</span>
              <p>Nejdříve vyber díl.</p>
            </div>
          ) : (
            <div className="structure-items">
              {visibleParts.length === 0 && (
                <div className="structure-empty">
                  Zatím žádné části.
                </div>
              )}

              {visibleParts.map((part) => (
                <div
                  key={part.id}
                  className={`structure-item ${
                    Number(selectedPartId) === Number(part.id)
                      ? "is-selected"
                      : ""
                  }`}
                  onClick={() => {
                    setSelectedPartId(part.id);
                    setSelectedChapterId(null);
                    setChapterListTab("published");
                    }}
                  style={{ cursor: "pointer" }}
                >
                  <div>
                    <div className="structure-item-name">
                      {partName(part)}
                    </div>

                    {book.uses_volumes && part.volume_id && (
                      <div className="structure-item-sub">
                        {volumeName(
                          volumes.find(
                            (volume) =>
                              Number(volume.id) ===
                              Number(part.volume_id)
                          ) || {}
                        )}
                      </div>
                    )}
                  </div>

                  <div className="structure-item-actions">
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
                      onClick={(event) => {
                        event.stopPropagation();
                        removePart(part);
                      }}
                    >
                      Smazat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form
            className="structure-add-form"
            onSubmit={handlePartSubmit}
          >
            <div className="structure-form-heading">
              {editingPartId
                ? "Upravit část"
                : "Nová část"}
            </div>

            <input
              type="number"
              min="1"
              placeholder="Číslo"
              value={partNumber}
              onChange={(event) =>
                setPartNumber(event.target.value)
              }
            />

            <input
              type="text"
              placeholder="Název části"
              value={partTitle}
              onChange={(event) =>
                setPartTitle(event.target.value)
              }
              required
            />


            <div className="structure-form-actions">
              <button type="submit">
                {editingPartId
                  ? "Uložit část"
                  : "+ Přidat část"}
              </button>

              {editingPartId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingPartId(null);
                    setPartNumber("");
                    setPartTitle("");
                    setPartVolumeId("");
                  }}
                >
                  Zrušit
                </button>
              )}
            </div>
          </form>

          {visibleParts.length > 0 && !selectedPartId && (
            <p className="structure-hint">
              Klikni na část. Teprve potom se zobrazí kapitoly.
            </p>
          )}
        </section>
      )}

      {/* =================================================
          3. KAPITOLY
      ================================================= */}

      {canOpenChapters && <section className="structure-column chapters-column">

        <div className="structure-column-header">

          <div>
            <span className="structure-label">
              OBSAH
            </span>

            <h3>Kapitoly</h3>
          </div>

          <span className="structure-count">
            {visibleChapters.length}
          </span>

        </div>

        <div className="structure-breadcrumbs">
          {selectedVolume && (
            <button type="button" onClick={() => {
              setSelectedPartId(null);
              setSelectedChapterId(null);
            }}>{volumeName(selectedVolume)}</button>
          )}
          {selectedPart && (
            <button type="button" onClick={() => {
              setSelectedPartId(null);
              setSelectedChapterId(null);
            }}>{partName(selectedPart)}</button>
          )}
          <button type="button" onClick={() => {
            setSelectedPartId(null);
            setSelectedVolumeId(null);
            setSelectedChapterId(null);
          }}>Zpět na strukturu</button>
        </div>
        {canOpenChapters && (
          <div className="structure-context">
            {chaptersContext ||
              (book.uses_parts
                ? "Bez části"
                : "Samostatná kniha")}
          </div>

        )}

        <button
          type="button"
          className="new-chapter-button"
          onClick={handleNewChapter}
          disabled={!canOpenChapters}
        >
          + Nová kapitola
        </button>

        <div className="chapter-folder-tabs" role="tablist" aria-label="Složky kapitol">
          <button
            type="button"
            role="tab"
            aria-selected={chapterListTab === "published"}
            className={chapterListTab === "published" ? "chapter-folder-tab active" : "chapter-folder-tab"}
            onClick={() => setChapterListTab("published")}
          >
            Publikované <span>{publishedChapters.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={chapterListTab === "concept"}
            className={chapterListTab === "concept" ? "chapter-folder-tab active" : "chapter-folder-tab"}
            onClick={() => setChapterListTab("concept")}
          >
            Koncepty <span>{conceptChapters.length}</span>
          </button>
        </div>

        <div className="chapter-list">

          {!canOpenChapters ? (
            <div className="structure-locked">
              <span>03</span>
              <p>Nejdříve vyber část.</p>
            </div>
          ) : (
            <>
              {displayedChapters.length === 0 && (
                <div className="structure-empty">
                  {chapterListTab === "concept"
                    ? "Ve složce Koncepty zatím nejsou žádné kapitoly."
                    : "Zatím nejsou zveřejněné žádné kapitoly."}
                </div>
              )}

              {displayedChapters.map((chapter) => (
            <button
              key={chapter.id}
              type="button"
              className={
                Number(selectedChapterId) === Number(chapter.id)
                  ? "chapter-card active"
                  : "chapter-card"
              }
              onClick={() =>
                openChapter(chapter)
              }
            >
              <span className="chapter-card-number">
                {chapter.status === "published"
                  ? String(chapter.number ?? "").padStart(2, "0")
                  : "K"}
              </span>

              <span className="chapter-card-main">
                <strong>
                  {chapter.title}
                </strong>

                <small>
                  {chapter.status === "published"
                    ? "Zveřejněno"
                    : "Rozpracováno"}
                  {chapterLocation(chapter)
                    ? ` · ${chapterLocation(chapter)}`
                    : " · Bez přiřazení"}
                </small>
              </span>

              <span
                className="chapter-card-status"
                onClick={(event) => {
                  event.stopPropagation();
                  removeChapter(chapter);
                }}
                title="Smazat kapitolu"
              >
                ×
              </span>
            </button>
              ))}
            </>
          )}

        </div>

      </section>}

      {/* =================================================
          4. EDITOR – NEJVĚTŠÍ
      ================================================= */}

      {canOpenChapters && <section className="chapter-editor-column">

        <div className="chapter-editor-top">

          <div>
            <span className="structure-label">
              {selectedChapter
                ? "UPRAVIT KAPITOLU"
                : "NOVÁ KAPITOLA"}
            </span>

            <h2>
              {chapterTitle ||
                "Nová kapitola"}
            </h2>
          </div>

          {selectedChapter && (
            <button
              type="button"
              className="danger-button"
              onClick={() =>
                removeChapter(
                  selectedChapter
                )
              }
            >
              Smazat kapitolu
            </button>
          )}

        </div>

        <form
          className="chapter-editor-form"
          onSubmit={handleChapterSubmit}
        >

          <div className="chapter-main-fields">

            <label className="chapter-order-field">
              <span>
                {chapterStatus === "published" && selectedChapter?.status === "published"
                  ? "Pořadí v celé knize"
                  : "Číslování kapitoly"}
              </span>

              {chapterStatus === "published" && selectedChapter?.status === "published" ? (
                <>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={chapterNumber}
                    onChange={(event) => setChapterNumber(event.target.value)}
                    required
                    aria-label="Pořadí kapitoly v celé knize"
                  />
                  <small>Změnou pořadí se přečísluje celá kniha, nejen právě vybraný díl nebo část.</small>
                </>
              ) : (
                <div className="chapter-number-auto-hint">
                  {chapterStatus === "published"
                    ? "Po zveřejnění dostane kapitola další volné číslo na konci knihy."
                    : "Koncept nemá číslo. Číslo dostane automaticky až při zveřejnění."}
                </div>
              )}
            </label>

            <label className="chapter-title-field">
              <span>Název kapitoly</span>

              <input
                type="text"
                value={chapterTitle}
                onChange={(event) =>
                  setChapterTitle(
                    event.target.value
                  )
                }
                placeholder="Název kapitoly"
                required
              />
            </label>

          </div>

          <div className="publish-box chapter-editor-publish">
            <div>
              <span>Zveřejnění kapitoly</span>
              <small>
                {chapterStatus === "published"
                  ? "Kapitola bude po uložení viditelná na webu."
                  : "Kapitola zůstane konceptem a na veřejném webu se nezobrazí."}
              </small>
            </div>

            <label className="publish-switch">
              <input
                type="checkbox"
                checked={chapterStatus === "published"}
                onChange={(event) =>
                  setChapterStatus(
                    event.target.checked ? "published" : "concept"
                  )
                }
              />
              <span />
            </label>
          </div>

          {Number(book.id) === 2 && (
            <div className="chapter-location-fields">
              <label>
                <span>Vypravěč</span>

                <select
                  value={chapterNarratorId}
                  onChange={(event) =>
                    setChapterNarratorId(
                      event.target.value
                    )
                  }
                  required
                >
                  <option value="">
                    Vyberte vypravěče
                  </option>

                  {aeilCharacters.map(
                    (character) => (
                      <option
                        key={character.id}
                        value={character.id}
                      >
                        {character.name}
                      </option>
                    )
                  )}
                </select>
              </label>
            </div>
          )}

          <div className="chapter-editor-wrapper">

            <div className="chapter-editor-label">
              TEXT KAPITOLY
            </div>

            <ChapterEditor
              value={chapterContent}
              onChange={setChapterContent}
            />

          </div>

          <div className="chapter-editor-footer">

            {message && (
              <span className="chapter-message">
                {message}
              </span>
            )}

            <div>
              <button
                type="button"
                className="secondary-button"
                onClick={resetChapterEditor}
              >
                Zrušit
              </button>

              <button
                type="submit"
                className="save-chapter-button"
              >
                {editingChapterId
                  ? "Uložit kapitolu"
                  : "Přidat kapitolu"}
              </button>
            </div>

          </div>

        </form>

      </section>}


      </div>
    </section>
  );
}

export default BookStructure;