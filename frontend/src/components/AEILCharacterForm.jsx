import { useEffect, useRef, useState } from "react";

import {
  getVolumes,
  addVolume,
} from "../services/booksService";

import {
  getCharacters,
  addCharacter,
} from "../services/charactersService";

/* =========================================================
   AEIL – OBRÁZKY A VIDEA
========================================================= */

/*
 * Postavy jsou v public/characters.
 * Manifest se načítá až při otevření výběru, takže při běžném
 * načtení administrace se nepřipravují všechny assety postav.
 */

let characterManifestPromise = null;

function loadCharacterManifest() {
  if (!characterManifestPromise) {
    characterManifestPromise = fetch(
      "/characters/manifest.json",
      { cache: "no-cache" }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Manifest characters se nepodařilo načíst (${response.status}).`
          );
        }
        return response.json();
      })
      .then((data) => (Array.isArray(data) ? data : []))
      .catch((error) => {
        console.error(
          "Nepodařilo se načíst manifest characters:",
          error
        );
        return [];
      });
  }

  return characterManifestPromise;
}

function getBookCharacterAssetFolder(bookId) {
  const folders = {
    1: "Nezacalo-to",
    2: "AEIL",
    3: "Vespera",
  };

  return folders[Number(bookId)] || "";
}

function getManifestFileName(path) {
  return String(path || "").split("/").pop() || "";
}

function getManifestDatabasePath(path) {
  const normalized = String(path || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^characters\//i, "");

  return `/src/assets/images/characters/${normalized}`;
}

function normalizeManifestPath(path) {
  return String(path || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^characters\//i, "");
}

function isVideoFile(path) {
  return /\.(mp4|webm|mov|m4v)$/i.test(String(path || ""));
}

/* =========================================================
   POMOCNÉ STYLY
========================================================= */

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  border: "1px solid #3d463a",
  borderRadius: "5px",
  background: "#111411",
  color: "#d8ded5",
  fontSize: "15px",
};

const sectionStyle = {
  padding: "20px",
  border: "1px solid #30372f",
  borderRadius: "8px",
  background: "#101310",
};

const sectionTitleStyle = {
  margin: "0 0 16px",
  color: "#d6a84c",
  fontSize: "20px",
  fontWeight: 500,
};

const smallButtonStyle = {
  padding: "8px 12px",
  border: "1px solid #4d5949",
  borderRadius: "5px",
  background: "#171b17",
  color: "#d7dfd2",
  cursor: "pointer",
};

/* =========================================================
   VÝBĚR OBRÁZKU
========================================================= */

function ImagePicker({
  label,
  value,
  onChange,
  bookId,
  allowVideo = false,
}) {
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function loadImages() {
      setLoadingImages(true);
      try {
        const manifest = await loadCharacterManifest();
        if (cancelled) return;

        const bookFolder = getBookCharacterAssetFolder(bookId).toLowerCase();

        const loadedImages = manifest
          .map(normalizeManifestPath)
          .filter(Boolean)
          .filter((path) => {
            const extension = path.split(".").pop()?.toLowerCase();
            const isImage = [
              "png", "jpg", "jpeg", "webp", "gif", "avif",
            ].includes(extension);

            return (
              path.toLowerCase().startsWith(`${bookFolder}/`) &&
              (isImage || (allowVideo && isVideoFile(path)))
            );
          })
          .map((path) => ({
            path,
            url: `/characters/${path}`,
            databasePath: getManifestDatabasePath(path),
            name: getManifestFileName(path),
            isVideo: isVideoFile(path),
          }));

        setImages(loadedImages);
      } finally {
        if (!cancelled) setLoadingImages(false);
      }
    }

    loadImages();
    return () => { cancelled = true; };
  }, [open, bookId, allowVideo]);

  const valueIsVideo = isVideoFile(value);

  return (
    <div>
      <label>{label}</label>

      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          marginTop: "8px",
          flexWrap: "wrap",
        }}
      >
        {value ? (
          valueIsVideo ? (
            <video
              src={value}
              muted
              playsInline
              preload="metadata"
              controls
              style={{
                width: "140px",
                height: "90px",
                objectFit: "cover",
                borderRadius: "6px",
                border: "1px solid #4d5949",
              }}
            />
          ) : (
            <img
              src={value}
              alt=""
              loading="lazy"
              decoding="async"
              style={{
                width: "140px",
                height: "90px",
                objectFit: "cover",
                borderRadius: "6px",
                border: "1px solid #4d5949",
              }}
            />
          )
        ) : (
          <div
            style={{
              width: "140px",
              height: "90px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px dashed #4d5949",
              borderRadius: "6px",
              color: "#777d75",
              fontSize: "13px",
            }}
          >
            Bez obrázku
          </div>
        )}

        <button
          type="button"
          style={smallButtonStyle}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? "Zavřít výběr" : allowVideo ? "Vybrat obrázek nebo video" : "Vybrat obrázek"}
        </button>

        {value && (
          <button type="button" style={smallButtonStyle} onClick={() => onChange("")}>
            Odebrat
          </button>
        )}
      </div>

      {open && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: "10px",
            marginTop: "12px",
            padding: "12px",
            border: "1px solid #30372f",
            borderRadius: "6px",
            background: "#0b0d0b",
            maxHeight: "360px",
            overflowY: "auto",
          }}
        >
          {loadingImages ? (
            <span style={{ color: "#777d75" }}>
              {allowVideo ? "Načítám obrázky a videa..." : "Načítám obrázky..."}
            </span>
          ) : images.length === 0 ? (
            <span style={{ color: "#777d75" }}>
              {allowVideo
                ? "Ve složce characters nejsou žádné obrázky ani videa."
                : "Ve složce characters nejsou žádné obrázky."}
            </span>
          ) : (
            images.map((image) => (
              <button
                key={image.path}
                type="button"
                onClick={() => {
                  onChange(image.url);
                  setOpen(false);
                }}
                style={{
                  padding: "4px",
                  border:
                    value === image.url || value === image.databasePath
                      ? "2px solid #d6a84c"
                      : "1px solid #30372f",
                  borderRadius: "5px",
                  background: "#101310",
                  cursor: "pointer",
                }}
                title={image.name}
              >
                {image.isVideo ? (
                  <video
                    src={image.url}
                    muted
                    playsInline
                    preload="metadata"
                    style={{
                      width: "100%",
                      aspectRatio: "1 / 1",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  <img
                    src={image.url}
                    alt={image.name}
                    loading="lazy"
                    decoding="async"
                    style={{
                      width: "100%",
                      aspectRatio: "1 / 1",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   VÝBĚR VIDEA
========================================================= */

function VideoPicker({ label, value, onChange, bookId }) {
  const [open, setOpen] = useState(false);
  const [videos, setVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function loadVideos() {
      setLoadingVideos(true);

      try {
        const manifest = await loadCharacterManifest();
        if (cancelled) return;

        const bookFolder =
          getBookCharacterAssetFolder(bookId).toLowerCase();

        const loadedVideos = manifest
          .filter(
            (path) =>
              /\.(mp4|webm|mov|m4v)$/i.test(path) &&
              (!bookFolder ||
                String(path)
                  .toLowerCase()
                  .startsWith(`${bookFolder}/`))
          )
          .map((path) => ({
            path,
            url: `/characters/${String(path).replace(/^\/+/, "")}`,
            databasePath: getManifestDatabasePath(path),
            name: getManifestFileName(path),
          }));

        setVideos(loadedVideos);
      } finally {
        if (!cancelled) setLoadingVideos(false);
      }
    }

    loadVideos();

    return () => {
      cancelled = true;
    };
  }, [open, bookId]);

  return (
    <div>
      <label>{label}</label>

      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          flexWrap: "wrap",
          marginTop: "8px",
        }}
      >
        {value ? (
          <video
            src={value}
            controls
            muted
            preload="metadata"
            style={{
              width: "180px",
              maxHeight: "110px",
              background: "#000",
              borderRadius: "6px",
            }}
          />
        ) : (
          <div style={{ color: "#777d75" }}>
            Žádné video
          </div>
        )}

        <button
          type="button"
          style={smallButtonStyle}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? "Zavřít výběr" : "Vybrat video"}
        </button>

        {value && (
          <button
            type="button"
            style={smallButtonStyle}
            onClick={() => onChange("")}
          >
            Odebrat
          </button>
        )}
      </div>

      {open && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            marginTop: "12px",
            padding: "12px",
            border: "1px solid #30372f",
            borderRadius: "6px",
            background: "#0b0d0b",
            maxHeight: "250px",
            overflowY: "auto",
          }}
        >
          {loadingVideos ? (
            <span style={{ color: "#777d75" }}>
              Načítám videa...
            </span>
          ) : videos.length === 0 ? (
            <span style={{ color: "#777d75" }}>
              Ve složce characters nejsou žádná videa.
            </span>
          ) : (
            videos.map((video) => (
              <button
                key={video.path}
                type="button"
                onClick={() => {
                  onChange(video.url);
                  setOpen(false);
                }}
                style={{
                  ...smallButtonStyle,
                  textAlign: "left",
                  borderColor:
                    value === video.url ||
                    value === video.databasePath
                      ? "#d6a84c"
                      : "#4d5949",
                }}
              >
                {video.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   RICH TEXT EDITOR
========================================================= */

function RichTextEditor({ value, onChange }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (
      editorRef.current &&
      editorRef.current.innerHTML !== value
    ) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  function handleInput() {
    if (!editorRef.current) return;
    onChange(editorRef.current.innerHTML);
  }

  function executeCommand(command, commandValue = null) {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    handleInput();
  }

  function createLink() {
    editorRef.current?.focus();
    const url = window.prompt("Zadej adresu odkazu:");
    if (!url) return;
    document.execCommand("createLink", false, url);
    handleInput();
  }

  const buttonStyle = {
    minWidth: "36px",
    height: "34px",
    padding: "0 9px",
    border: "1px solid #3d463a",
    borderRadius: "5px",
    background: "#171b17",
    color: "#d7dfd2",
    cursor: "pointer",
    fontSize: "14px",
  };

  return (
    <div
      style={{
        width: "100%",
        border: "1px solid #3d463a",
        borderRadius: "7px",
        overflow: "hidden",
        background: "#101310",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "5px",
          padding: "8px",
          borderBottom: "1px solid #3d463a",
          background: "#171b17",
        }}
      >
        <button
          type="button"
          style={{ ...buttonStyle, fontWeight: 700 }}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => executeCommand("bold")}
        >
          B
        </button>

        <button
          type="button"
          style={{ ...buttonStyle, fontStyle: "italic" }}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => executeCommand("italic")}
        >
          I
        </button>

        <button
          type="button"
          style={buttonStyle}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => executeCommand("underline")}
        >
          U
        </button>

        <button
          type="button"
          style={buttonStyle}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => executeCommand("insertUnorderedList")}
        >
          •☰
        </button>

        <button
          type="button"
          style={buttonStyle}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => executeCommand("insertOrderedList")}
        >
          1.
        </button>

        <button
          type="button"
          style={buttonStyle}
          onMouseDown={(event) => event.preventDefault()}
          onClick={createLink}
        >
          🔗
        </button>

        <button
          type="button"
          style={buttonStyle}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => executeCommand("insertHorizontalRule")}
        >
          ―
        </button>

        <button
          type="button"
          style={buttonStyle}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => executeCommand("undo")}
        >
          ↶
        </button>

        <button
          type="button"
          style={buttonStyle}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => executeCommand("redo")}
        >
          ↷
        </button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        style={{
          minHeight: "320px",
          maxHeight: "600px",
          overflowY: "auto",
          padding: "18px 20px",
          color: "#d8ded5",
          background: "#111411",
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: "17px",
          lineHeight: "1.65",
          outline: "none",
        }}
      />
    </div>
  );
}

/* =========================================================
   FORMULÁŘ AEIL POSTAVY
========================================================= */

function AEILCharacterForm({
  bookId,
  character,
  volumes: passedVolumes = [],
  onSave,
  onCancel,
}) {
  const [name, setName] = useState(character?.name || "");
  const [quote, setQuote] = useState(character?.quote || "");
  const [contentHtml, setContentHtml] = useState(
    character?.content_html || ""
  );
  const [mainImage, setMainImage] = useState(
    character?.main_image || ""
  );
  const [hoverImage, setHoverImage] = useState(
    character?.hover_image || ""
  );
  const [mainVideo, setMainVideo] = useState(
    character?.main_video || ""
  );
  const [soundtrack, setSoundtrack] = useState(
    character?.soundtrack || ""
  );
  const [race, setRace] = useState(character?.race || "");
  const [selectedVolumes, setSelectedVolumes] = useState(
    character?.volume_ids || []
  );
  const [details, setDetails] = useState(
    character?.details || []
  );
  const [images, setImages] = useState(
    character?.images || []
  );
  const [quotes, setQuotes] = useState(
    character?.quotes || []
  );
  const [relationships, setRelationships] = useState(
    (character?.relationships || []).map((relationship) => ({
      ...relationship,
      relationship_types: Array.isArray(
        relationship.relationship_types
      )
        ? relationship.relationship_types
        : relationship.relationship_type
          ? (() => {
              try {
                const parsed = JSON.parse(
                  relationship.relationship_type
                );
                return Array.isArray(parsed)
                  ? parsed
                  : [relationship.relationship_type];
              } catch {
                return [relationship.relationship_type];
              }
            })()
          : [],
    }))
  );

  const [volumes, setVolumes] = useState(passedVolumes || []);
  const [characters, setCharacters] = useState([]);
  const [loadingVolumes, setLoadingVolumes] = useState(false);
  const [loadingCharacters, setLoadingCharacters] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(character?.name || "");
    setQuote(character?.quote || "");
    setContentHtml(character?.content_html || "");
    setMainImage(character?.main_image || "");
    setHoverImage(character?.hover_image || "");
    setMainVideo(character?.main_video || "");
    setSoundtrack(character?.soundtrack || "");
    setRace(character?.race || "");
    setSelectedVolumes(character?.volume_ids || []);
    setDetails(character?.details || []);
    setImages(character?.images || []);
    setQuotes(character?.quotes || []);
    setRelationships(
      (character?.relationships || []).map((relationship) => ({
        ...relationship,
        relationship_types: Array.isArray(
          relationship.relationship_types
        )
          ? relationship.relationship_types
          : relationship.relationship_type
            ? (() => {
                try {
                  const parsed = JSON.parse(
                    relationship.relationship_type
                  );
                  return Array.isArray(parsed)
                    ? parsed
                    : [relationship.relationship_type];
                } catch {
                  return [relationship.relationship_type];
                }
              })()
            : [],
      }))
    );
  }, [character]);

  useEffect(() => {
    setVolumes(passedVolumes || []);
  }, [passedVolumes]);

  useEffect(() => {
    async function loadVolumes() {
      if (!bookId) return;
      setLoadingVolumes(true);
      try {
        const data = await getVolumes(bookId);
        setVolumes(data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingVolumes(false);
      }
    }

    loadVolumes();
  }, [bookId]);

  useEffect(() => {
    async function loadCharacters() {
      if (!bookId) return;
      setLoadingCharacters(true);
      try {
        const data = await getCharacters(bookId);
        setCharacters(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingCharacters(false);
      }
    }

    loadCharacters();
  }, [bookId]);

  function toggleVolume(volumeId) {
    setSelectedVolumes((current) =>
      current.includes(volumeId)
        ? current.filter((id) => id !== volumeId)
        : [...current, volumeId]
    );
  }

  async function addNewVolume() {
    const title = window.prompt("Název nového dílu:");
    if (!title?.trim()) return;

    const numberValue = window.prompt(
      "Číslo dílu (volitelné):"
    );

    try {
      const created = await addVolume(bookId, {
        title: title.trim(),
        number: numberValue?.trim()
          ? Number(numberValue)
          : null,
      });

      const data = await getVolumes(bookId);
      setVolumes(data || []);

      if (created?.id) {
        setSelectedVolumes((current) => [
          ...current,
          created.id,
        ]);
      }
    } catch (error) {
      console.error(error);
      alert(
        error.message || "Nepodařilo se přidat díl."
      );
    }
  }

  function addDetail() {
    setDetails((current) => [
      ...current,
      { label: "", value: "" },
    ]);
  }

  function updateDetail(index, field, value) {
    setDetails((current) =>
      current.map((detail, detailIndex) =>
        detailIndex === index
          ? { ...detail, [field]: value }
          : detail
      )
    );
  }

  function removeDetail(index) {
    setDetails((current) =>
      current.filter((_, detailIndex) => detailIndex !== index)
    );
  }

  function addGalleryImage() {
    setImages((current) => [
      ...current,
      {
        image: "",
        caption: "",
        sort_order: current.length,
      },
    ]);
  }

  function updateGalleryImage(index, field, value) {
    setImages((current) =>
      current.map((image, imageIndex) =>
        imageIndex === index
          ? { ...image, [field]: value }
          : image
      )
    );
  }

  function removeGalleryImage(index) {
    setImages((current) =>
      current.filter((_, imageIndex) => imageIndex !== index)
    );
  }

  function addQuote() {
    setQuotes((current) => [
      ...current,
      {
        quote: "",
        author: "",
        volume_id: selectedVolumes[0] || "",
        sort_order: current.length,
      },
    ]);
  }

  function updateQuote(index, field, value) {
    setQuotes((current) =>
      current.map((quoteItem, quoteIndex) =>
        quoteIndex === index
          ? { ...quoteItem, [field]: value }
          : quoteItem
      )
    );
  }

  function removeQuote(index) {
    setQuotes((current) =>
      current.filter((_, quoteIndex) => quoteIndex !== index)
    );
  }

  const relationshipTypes = [
    { value: "love", icon: "❤️", label: "Láska" },
    { value: "friend", icon: "🤝", label: "Přátelství" },
    { value: "family", icon: "👨‍👩‍👧", label: "Rodina" },
    { value: "enemy", icon: "⚔️", label: "Nepřítel" },
    { value: "ex", icon: "💔", label: "Bývalý" },
    { value: "acquaintance", icon: "👤", label: "Známý" },
  ];

  function addRelationship() {
    setRelationships((current) => [
      ...current,
      {
        related_character_id: "",
        relationship_types: [],
      },
    ]);
  }

  function updateRelationship(index, field, value) {
    setRelationships((current) =>
      current.map((relationship, relationshipIndex) =>
        relationshipIndex === index
          ? { ...relationship, [field]: value }
          : relationship
      )
    );
  }

  function toggleRelationshipType(index, typeValue) {
    setRelationships((current) =>
      current.map((relationship, relationshipIndex) => {
        if (relationshipIndex !== index) return relationship;

        const currentTypes = Array.isArray(
          relationship.relationship_types
        )
          ? relationship.relationship_types
          : [];

        return {
          ...relationship,
          relationship_types: currentTypes.includes(typeValue)
            ? currentTypes.filter((type) => type !== typeValue)
            : [...currentTypes, typeValue],
        };
      })
    );
  }

  function removeRelationship(index) {
    setRelationships((current) =>
      current.filter((_, relationshipIndex) => relationshipIndex !== index)
    );
  }

  async function addNewCharacterForRelationship() {
    const newName = window.prompt("Jméno nové postavy:");
    if (!newName?.trim()) return;

    try {
      const created = await addCharacter(bookId, {
        name: newName.trim(),
        quote: "",
        content_html: "",
        main_image: null,
        hover_image: null,
        header_image: null,
        main_video: null,
        soundtrack: null,
        race: "",
        published: true,
        sort_order: 0,
        volume_ids: [],
        details: [],
        images: [],
        quotes: [],
        relationships: [],
      });

      const data = await getCharacters(bookId);
      setCharacters(Array.isArray(data) ? data : []);

      if (created?.id) {
        setRelationships((current) => [
          ...current,
          {
            related_character_id: created.id,
            relationship_types: [],
          },
        ]);
      }
    } catch (error) {
      console.error(error);
      alert(
        error.message ||
          "Nepodařilo se vytvořit novou postavu."
      );
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!name.trim()) {
      alert("Postava musí mít jméno.");
      return;
    }

    const characterData = {
      name: name.trim(),
      quote: quote.trim(),
      content_html: contentHtml,
      main_image: mainImage || null,
      hover_image: hoverImage || null,
      main_video: mainVideo || null,
      soundtrack: soundtrack.trim() || null,
      race: race.trim(),
      published: character?.published ?? true,
      sort_order: Number(character?.sort_order) || 0,
      volume_ids: selectedVolumes,

      details: details
        .filter(
          (detail) =>
            detail.label?.trim() || detail.value?.trim()
        )
        .map((detail) => ({
          label: detail.label?.trim() || "",
          value: detail.value?.trim() || "",
        })),

      images: images
        .filter((image) => image.image?.trim())
        .map((image, index) => ({
          image: image.image.trim(),
          caption: image.caption?.trim() || "",
          sort_order: index,
        })),

      quotes: quotes
        .filter((quoteItem) => quoteItem.quote?.trim())
        .map((quoteItem, index) => ({
          quote: quoteItem.quote.trim(),
          author: quoteItem.author?.trim() || "",
          volume_id: quoteItem.volume_id
            ? Number(quoteItem.volume_id)
            : null,
          sort_order: index,
        })),

      relationships: relationships
        .filter(
          (relationship) =>
            relationship.related_character_id &&
            Number(relationship.related_character_id) !==
              Number(character?.id) &&
            Array.isArray(relationship.relationship_types) &&
            relationship.relationship_types.length > 0
        )
        .map((relationship) => ({
          related_character_id: Number(
            relationship.related_character_id
          ),
          relationship_types: relationship.relationship_types,
        })),
    };

    setSaving(true);

    try {
      await onSave(characterData);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      {/* =====================================================
          ZÁKLADNÍ INFORMACE
      ===================================================== */}

      <section style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Základní informace</h3>

        <div
          style={{
            display: "grid",
            gap: "16px",
          }}
        >
          <div>
            <label htmlFor="aeil-character-name">Jméno</label>
            <input
              id="aeil-character-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="aeil-character-quote">Hláška</label>
            <input
              id="aeil-character-quote"
              type="text"
              value={quote}
              onChange={(event) => setQuote(event.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="aeil-character-race">Rasa</label>
            <input
              id="aeil-character-race"
              type="text"
              value={race}
              onChange={(event) => setRace(event.target.value)}
              placeholder="Např. Člověk, elf, démon..."
              style={inputStyle}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
              }}
            >
              Popis
            </label>
            <RichTextEditor
              value={contentHtml}
              onChange={setContentHtml}
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          OBRÁZKY A VIDEO
      ===================================================== */}

      <section style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Obrázky a video</h3>

        <div
          style={{
            display: "grid",
            gap: "20px",
          }}
        >
          <ImagePicker
            label="Hlavní obrázek"
            value={mainImage}
            onChange={setMainImage}
            bookId={bookId}
          />

          <ImagePicker
            label="Obrázek po najetí myší"
            value={hoverImage}
            onChange={setHoverImage}
            bookId={bookId}
          />

          <VideoPicker
            label="Video postavy"
            value={mainVideo}
            onChange={setMainVideo}
            bookId={bookId}
          />

          <div>
            <label htmlFor="aeil-character-soundtrack">
              Soundtrack – adresa souboru / URL
            </label>
            <input
              id="aeil-character-soundtrack"
              type="text"
              value={soundtrack}
              onChange={(event) =>
                setSoundtrack(event.target.value)
              }
              placeholder="https://... nebo /assets/..."
              style={inputStyle}
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          DÍLY
      ===================================================== */}

      <section style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Kapitoly / díly</h3>

        {loadingVolumes ? (
          <p>Načítám díly...</p>
        ) : volumes.length === 0 ? (
          <p>Tato kniha zatím nemá žádné díly.</p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {volumes.map((volume) => (
              <label
                key={volume.id}
                style={{
                  display: "flex",
                  gap: "8px",
                  alignItems: "center",
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedVolumes.includes(volume.id)}
                  onChange={() => toggleVolume(volume.id)}
                />
                <span>
                  {volume.number
                    ? `Díl ${volume.number} – `
                    : ""}
                  {volume.title}
                </span>
              </label>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={addNewVolume}
          style={{ ...smallButtonStyle, marginTop: "12px" }}
        >
          + Přidat nový díl
        </button>
      </section>

            {/* =====================================================
          DALŠÍ INFORMACE
      ===================================================== */}

      <section style={sectionStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            marginBottom: "12px",
          }}
        >
          <h3 style={{ ...sectionTitleStyle, margin: 0 }}>
            Další informace
          </h3>

          <button
            type="button"
            onClick={addDetail}
            style={smallButtonStyle}
          >
            + Přidat informaci
          </button>
        </div>

        {details.length === 0 ? (
          <p>Zatím nejsou přidané žádné informace.</p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {details.map((detail, index) => (
              <div
                key={detail.id || `detail-${index}`}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "minmax(160px, 1fr) minmax(220px, 2fr) auto",
                  gap: "10px",
                  alignItems: "center",
                }}
              >
                <input
                  type="text"
                  value={detail.label || ""}
                  placeholder="Název"
                  onChange={(event) =>
                    updateDetail(index, "label", event.target.value)
                  }
                  style={inputStyle}
                />

                <input
                  type="text"
                  value={detail.value || ""}
                  placeholder="Hodnota"
                  onChange={(event) =>
                    updateDetail(index, "value", event.target.value)
                  }
                  style={inputStyle}
                />

                <button
                  type="button"
                  onClick={() => removeDetail(index)}
                  style={smallButtonStyle}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* =====================================================
          GALERIE
      ===================================================== */}

      <section style={sectionStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            marginBottom: "12px",
          }}
        >
          <h3 style={{ ...sectionTitleStyle, margin: 0 }}>
            Galerie
          </h3>

          <button
            type="button"
            onClick={addGalleryImage}
            style={smallButtonStyle}
          >
            + Přidat obrázek
          </button>
        </div>

        {images.length === 0 ? (
          <p>Galerie zatím neobsahuje žádné obrázky.</p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            {images.map((image, index) => (
              <div
                key={image.id || `gallery-${index}`}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "minmax(280px, 1fr) 1fr auto",
                  gap: "14px",
                  alignItems: "end",
                  padding: "14px",
                  border: "1px solid #30372f",
                  borderRadius: "7px",
                  background: "#0b0d0b",
                }}
              >
                <ImagePicker
                  label="Obrázek"
                  value={image.image || ""}
                  onChange={(value) =>
                    updateGalleryImage(index, "image", value)
                  }
                  bookId={bookId}
                  allowVideo
                />

                <div>
                  <label>Popisek</label>
                  <input
                    type="text"
                    value={image.caption || ""}
                    onChange={(event) =>
                      updateGalleryImage(
                        index,
                        "caption",
                        event.target.value
                      )
                    }
                    placeholder="Krátký popisek"
                    style={inputStyle}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeGalleryImage(index)}
                  style={smallButtonStyle}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* =====================================================
          CITÁTY
      ===================================================== */}

      <section style={sectionStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            marginBottom: "12px",
          }}
        >
          <h3 style={{ ...sectionTitleStyle, margin: 0 }}>
            Citáty
          </h3>

          <button
            type="button"
            onClick={addQuote}
            style={smallButtonStyle}
          >
            + Přidat citát
          </button>
        </div>

        {quotes.length === 0 ? (
          <p>Zatím nejsou přidané žádné citáty.</p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            {quotes.map((quoteItem, index) => (
              <div
                key={quoteItem.id || `quote-${index}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr auto",
                  gap: "10px",
                  alignItems: "center",
                }}
              >
                <input
                  type="text"
                  value={quoteItem.quote || ""}
                  placeholder="Citát"
                  onChange={(event) =>
                    updateQuote(index, "quote", event.target.value)
                  }
                  style={inputStyle}
                />

                <input
                  type="text"
                  value={quoteItem.author || ""}
                  placeholder="Autor"
                  onChange={(event) =>
                    updateQuote(index, "author", event.target.value)
                  }
                  style={inputStyle}
                />

                <select
                  value={quoteItem.volume_id || ""}
                  onChange={(event) =>
                    updateQuote(index, "volume_id", event.target.value)
                  }
                  style={inputStyle}
                >
                  <option value="">Bez dílu</option>
                  {volumes.map((volume) => (
                    <option key={volume.id} value={volume.id}>
                      {volume.number
                        ? `Díl ${volume.number} – `
                        : ""}
                      {volume.title}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => removeQuote(index)}
                  style={smallButtonStyle}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* =====================================================
          VZTAHY
      ===================================================== */}

      <section style={sectionStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            marginBottom: "12px",
          }}
        >
          <h3 style={{ ...sectionTitleStyle, margin: 0 }}>
            Vztahy
          </h3>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={addRelationship}
              style={smallButtonStyle}
            >
              + Přidat vztah
            </button>

            <button
              type="button"
              onClick={addNewCharacterForRelationship}
              style={smallButtonStyle}
            >
              + Nová postava
            </button>
          </div>
        </div>

        {loadingCharacters ? (
          <p>Načítám postavy...</p>
        ) : relationships.length === 0 ? (
          <p>Zatím nejsou přidané žádné vztahy.</p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {relationships.map((relationship, index) => {
              const relatedId = Number(
                relationship.related_character_id
              );

              return (
                <div
                  key={`relationship-${index}`}
                  style={{
                    padding: "14px",
                    border: "1px solid #30372f",
                    borderRadius: "7px",
                    background: "#0b0d0b",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: "10px",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <select
                      value={
                        relationship.related_character_id || ""
                      }
                      onChange={(event) =>
                        updateRelationship(
                          index,
                          "related_character_id",
                          event.target.value
                        )
                      }
                      style={inputStyle}
                    >
                      <option value="">
                        Vyber postavu
                      </option>
                      {characters.map((item) => (
                        <option
                          key={item.id}
                          value={item.id}
                          disabled={
                            Number(item.id) ===
                            Number(character?.id)
                          }
                        >
                          {item.name}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => removeRelationship(index)}
                      style={smallButtonStyle}
                    >
                      ×
                    </button>
                  </div>

                  {relatedId > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "8px",
                      }}
                    >
                      {relationshipTypes.map((type) => {
                        const active =
                          relationship.relationship_types?.includes(
                            type.value
                          );

                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() =>
                              toggleRelationshipType(
                                index,
                                type.value
                              )
                            }
                            style={{
                              ...smallButtonStyle,
                              borderColor: active
                                ? "#d6a84c"
                                : "#4d5949",
                              color: active
                                ? "#f0d18b"
                                : "#d7dfd2",
                              boxShadow: active
                                ? "0 0 8px rgba(214,168,76,0.25)"
                                : "none",
                            }}
                          >
                            {type.icon} {type.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* =====================================================
          AKCE
      ===================================================== */}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "10px",
          paddingTop: "4px",
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          style={smallButtonStyle}
        >
          Zrušit
        </button>

        <button
          type="submit"
          disabled={saving}
          style={{
            ...smallButtonStyle,
            borderColor: "#b98a3c",
            color: "#f0d18b",
          }}
        >
          {saving ? "Ukládám..." : "Uložit postavu"}
        </button>
      </div>
    </form>
  );
}

export default AEILCharacterForm;