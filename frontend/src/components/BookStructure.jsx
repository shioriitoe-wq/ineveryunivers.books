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
  const [chapterNarratorId, setChapterNarratorId] = useState("");

  const [message, setMessage] = useState("");

  /* =====================================================
     NAČTENÍ
  ===================================================== */

  async function loadStructure() {
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

        getChapters(book.id),

        Number(book.id) === 2
          ? getCharacters(book.id)
          : Promise.resolve([]),
      ]);

      setVolumes(loadedVolumes);
      setParts(loadedParts);
      setChapters(loadedChapters);

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
          (chapter) => chapter.id === selectedChapterId
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
      console.error(error);
      setMessage(error.message);
    }
  }

  useEffect(() => {
    setSelectedChapterId(null);
    resetChapterEditor();
    loadStructure();
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
      (item) => item.id === chapter.volume_id
    );

    const part = parts.find(
      (item) => item.id === chapter.part_id
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

  const visibleChapters = useMemo(() => {
    if (book.uses_volumes && !selectedVolumeId) {
      return [];
    }

    if (
      book.uses_parts &&
      selectedVolumeId &&
      visibleParts.length > 0 &&
      !selectedPartId
    ) {
      return [];
    }

    return chapters.filter((chapter) => {
      const belongsToVolume =
        !selectedVolumeId ||
        !chapter.volume_id ||
        Number(chapter.volume_id) === Number(selectedVolumeId);

      if (selectedPartId) {
        return (
          belongsToVolume &&
          (!chapter.part_id ||
            Number(chapter.part_id) === Number(selectedPartId))
        );
      }

      return belongsToVolume && !chapter.part_id;
    });
  }, [
    book.uses_volumes,
    book.uses_parts,
    chapters,
    selectedPartId,
    selectedVolumeId,
    visibleParts.length,
  ]);

  const canOpenChapters =
    (!book.uses_volumes || !!selectedVolumeId) &&
    (!book.uses_parts ||
      visibleParts.length === 0 ||
      !!selectedPartId);

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
          partVolumeId === ""
            ? null
            : Number(partVolumeId),
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
        chapter.id === selectedChapterId
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
      <div className="book-structure-columns">

      {/* =================================================
          1. DÍLY
      ================================================= */}
      {book.uses_volumes && (
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
                  setSelectedPartId(null);
                  setSelectedChapterId(null);
                  setShowChapterForm(false);
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
              <button type="submit">
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
      {book.uses_parts && (
        <section className="structure-column parts-column">
          <div className="structure-column-header">
            <div>
              <span className="structure-label">
                STRUKTURA
              </span>
              <h3>Části</h3>
            </div>

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
                    setShowChapterForm(false);
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

            {book.uses_volumes && (
              <select
                value={partVolumeId}
                onChange={(event) =>
                  setPartVolumeId(event.target.value)
                }
              >
                <option value="">
                  Bez přiřazeného dílu
                </option>

                {volumes.map((volume) => (
                  <option
                    key={volume.id}
                    value={volume.id}
                  >
                    {volumeName(volume)}
                  </option>
                ))}
              </select>
            )}

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

      <section
        className="structure-column chapters-column"
        style={
          Number(book.id) === 2
            ? { gridColumn: "3" }
            : undefined
        }
      >

        <div className="structure-column-header">

          <div>
            <span className="structure-label">
              OBSAH
            </span>

            <h3>Kapitoly</h3>
          </div>

          <span className="structure-count">
            {chapters.length}
          </span>

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

        <div className="chapter-list">

          {!canOpenChapters ? (
            <div className="structure-locked">
              <span>03</span>
              <p>Nejdříve vyber část.</p>
            </div>
          ) : (
            <>
              {visibleChapters.length === 0 && (
                <div className="structure-empty">
                  Zatím žádné kapitoly.
                </div>
              )}

              {visibleChapters.map((chapter) => (
            <button
              key={chapter.id}
              type="button"
              className={
                selectedChapterId === chapter.id
                  ? "chapter-list-item active"
                  : "chapter-list-item"
              }
              onClick={() =>
                openChapter(chapter)
              }
            >
              <span className="chapter-list-number">
                {String(
                  chapter.number ?? ""
                ).padStart(2, "0")}
              </span>

              <span className="chapter-list-main">
                <strong>
                  {chapter.title}
                </strong>

                <small>
                  {chapter.status ===
                  "published"
                    ? "Zveřejněno"
                    : "Rozpracováno"}
                </small>
              </span>

              <span
                className="chapter-list-status"
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

      </section>

      {/* =================================================
          4. EDITOR – NEJVĚTŠÍ
      ================================================= */}

      <section
        className="chapter-editor-column"
        style={
          Number(book.id) === 2
            ? { gridColumn: "4" }
            : undefined
        }
      >

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

            <label>
              <span>Číslo kapitoly</span>

              <input
                type="number"
                min="1"
                value={chapterNumber}
                onChange={(event) =>
                  setChapterNumber(
                    event.target.value
                  )
                }
                required
              />
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

          {(book.uses_volumes ||
            book.uses_parts) && (
            <div className="chapter-location-fields">

              {book.uses_volumes && (
                <label>
                  <span>Díl</span>

                  <select
                    value={chapterVolumeId}
                    onChange={(event) => {
                      setChapterVolumeId(
                        event.target.value
                      );

                      setChapterPartId("");
                    }}
                  >
                    <option value="">
                      Bez dílu
                    </option>

                    {volumes.map(
                      (volume) => (
                        <option
                          key={volume.id}
                          value={volume.id}
                        >
                          {volumeName(volume)}
                        </option>
                      )
                    )}
                  </select>
                </label>
              )}

              {book.uses_parts && (
                <label>
                  <span>Část</span>

                  <select
                    value={chapterPartId}
                    onChange={(event) =>
                      setChapterPartId(
                        event.target.value
                      )
                    }
                  >
                    <option value="">
                      Bez části
                    </option>

                    {availableChapterParts.map(
                      (part) => (
                        <option
                          key={part.id}
                          value={part.id}
                        >
                          {partName(part)}
                        </option>
                      )
                    )}
                  </select>
                </label>
              )}

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

      </section>

      {/* =================================================
          5. INFORMACE O KAPITOLE
      ================================================= */}

      <aside
        className="chapter-info-column"
        style={
          Number(book.id) === 2
            ? { gridColumn: "5" }
            : undefined
        }
      >

        <div className="chapter-info-header">
          <span className="info-icon">
            i
          </span>

          <h3>
            INFORMACE
          </h3>
        </div>

        {Number(book.id) === 2 ? (
          <div className="chapter-info-content">

            <div className="chapter-info-title">
              {selectedChapter?.title ||
                chapterTitle ||
                "Nová kapitola"}
            </div>

            <div className="chapter-info-row">
              <span>Číslo kapitoly</span>
              <strong>
                {selectedChapter?.number ??
                  (chapterNumber === ""
                    ? "—"
                    : chapterNumber)}
              </strong>
            </div>

            <div className="chapter-info-row">
              <span>Stav</span>
              <strong
                className={
                  chapterStatus === "published"
                    ? "status-published"
                    : "status-concept"
                }
              >
                {chapterStatus === "published"
                  ? "Zveřejněno"
                  : "Rozpracováno"}
              </strong>
            </div>

            {selectedChapter && (
              <>
                <div className="chapter-info-row">
                  <span>Pořadí</span>
                  <strong>
                    {selectedChapter.order ??
                      selectedChapter.position ??
                      selectedChapter.number ??
                      "—"}
                  </strong>
                </div>

                <div className="chapter-info-row">
                  <span>Datum vytvoření</span>
                  <strong>
                    {formatDate(
                      selectedChapter.created_at
                    )}
                  </strong>
                </div>

                <div className="chapter-info-row">
                  <span>Poslední úprava</span>
                  <strong>
                    {formatDate(
                      selectedChapter.updated_at ||
                        selectedChapter.modified_at
                    )}
                  </strong>
                </div>
              </>
            )}

            <div className="publish-box">

              <div>
                <span>Publikovat</span>

                <small>
                  {chapterStatus === "published"
                    ? "Kapitola je zveřejněná"
                    : "Kapitola zatím není zveřejněná"}
                </small>
              </div>

              <label className="publish-switch">
                <input
                  type="checkbox"
                  checked={
                    chapterStatus === "published"
                  }
                  onChange={(event) =>
                    setChapterStatus(
                      event.target.checked
                        ? "published"
                        : "concept"
                    )
                  }
                />

                <span />
              </label>

            </div>

          </div>
        ) : (
          <>
        {!selectedChapter && (
          <div className="chapter-info-empty">
            Vyber kapitolu ze seznamu.
          </div>
        )}

        {selectedChapter && (
          <div className="chapter-info-content">

            <div className="chapter-info-title">
              {selectedChapter.title}
            </div>

            <div className="chapter-info-row">
              <span>Číslo kapitoly</span>
              <strong>
                {selectedChapter.number ??
                  "—"}
              </strong>
            </div>

            <div className="chapter-info-row">
              <span>Stav</span>

              <strong
                className={
                  selectedChapter.status ===
                  "published"
                    ? "status-published"
                    : "status-concept"
                }
              >
                {selectedChapter.status ===
                "published"
                  ? "Zveřejněno"
                  : "Rozpracováno"}
              </strong>
            </div>

            <div className="chapter-info-row">
              <span>Pořadí</span>
              <strong>
                {selectedChapter.order ??
                  selectedChapter.position ??
                  selectedChapter.number ??
                  "—"}
              </strong>
            </div>

            <div className="chapter-info-row">
              <span>Datum vytvoření</span>
              <strong>
                {formatDate(
                  selectedChapter.created_at
                )}
              </strong>
            </div>

            <div className="chapter-info-row">
              <span>Poslední úprava</span>
              <strong>
                {formatDate(
                  selectedChapter.updated_at ||
                    selectedChapter.modified_at
                )}
              </strong>
            </div>

            <div className="publish-box">

              <div>
                <span>Publikovat</span>

                <small>
                  {selectedChapter.status ===
                  "published"
                    ? "Kapitola je zveřejněná"
                    : "Kapitola zatím není zveřejněná"}
                </small>
              </div>

              <label className="publish-switch">
                <input
                  type="checkbox"
                  checked={
                    chapterStatus ===
                    "published"
                  }
                  onChange={(event) =>
                    setChapterStatus(
                      event.target.checked
                        ? "published"
                        : "concept"
                    )
                  }
                />

                <span />
              </label>

            </div>

          </div>
        )}
          </>
        )}

      </aside>

      </div>
    </section>
  );
}

export default BookStructure;