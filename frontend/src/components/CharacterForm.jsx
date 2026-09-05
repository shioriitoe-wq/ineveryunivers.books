import { useEffect, useRef, useState } from "react";

import {
  getVolumes,
  addVolume,
} from "../services/booksService";

import {
  getBookCharacterAssetFolder,
  toCharacterDatabaseAssetPath,
  resolveCharacterAsset,
} from "../utils/characterAssetPaths";

import {
  getCharacters,
  addCharacter,
} from "../services/charactersService";


/* =========================================================
   POSTAVY – PUBLIC ASSETS
   =========================================================

   Postavy jsou v:

   public/characters/<KNIHA>/...

   Browser neumí z public složky automaticky vypsat soubory,
   proto picker používá lehký manifest:

   /characters/manifest.json

   Manifest obsahuje pouze seznam cest k souborům – samotné
   obrázky a videa se při otevření pickeru automaticky
   nestahují.

   Manifest vytvoříme po přesunu characters do public.
   ========================================================= */

async function loadCharacterManifest() {
  try {
    const response = await fetch(
      "/characters/manifest.json",
      { cache: "no-cache" }
    );

    if (!response.ok) {
      throw new Error(
        `Manifest characters se nepodařilo načíst (${response.status}).`
      );
    }

    const data = await response.json();

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(
      "Nepodařilo se načíst manifest characters:",
      error
    );

    return [];
  }
}


function getManifestFileName(path) {
  return path.split("/").pop() || "";
}


function getManifestDatabasePath(path) {
  const normalized = String(path || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^characters\//i, "");

  return toCharacterDatabaseAssetPath(
    `/characters/${normalized}`
  );
}

function normalizeManifestPath(path) {
  return String(path || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^characters\//i, "");
}

function isVideoFile(path) {
  return /\.(mp4|webm|mov|m4v)$/i.test(
    String(path || "")
  );
}


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
  const [manifest, setManifest] = useState([]);
  const [loadingManifest, setLoadingManifest] = useState(false);

  const bookFolder =
    getBookCharacterAssetFolder(bookId);

  useEffect(() => {
    if (!open || manifest.length > 0) {
      return;
    }

    let cancelled = false;
    setLoadingManifest(true);

    loadCharacterManifest()
      .then((data) => {
        if (!cancelled) setManifest(data);
      })
      .finally(() => {
        if (!cancelled) setLoadingManifest(false);
      });

    return () => { cancelled = true; };
  }, [open, manifest.length]);

  const images = manifest
    .map(normalizeManifestPath)
    .filter(Boolean)
    .filter((path) => {
      const parts = path.split("/");
      const folder = parts[0] || "";
      const extension = path.split(".").pop()?.toLowerCase();
      const isImage = [
        "png", "jpg", "jpeg", "webp", "gif", "avif",
      ].includes(extension);

      return (
        folder.toLowerCase() === bookFolder.toLowerCase() &&
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
        }}
      >
        {value ? (
          valueIsVideo ? (
            <video
              src={
                resolveCharacterAsset(value, null, bookId) || value
              }
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
              src={
                resolveCharacterAsset(value, null, bookId) || value
              }
              alt=""
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
          onClick={() => setOpen(!open)}
        >
          {allowVideo ? "Vybrat obrázek nebo video" : "Vybrat obrázek"}
        </button>

        {value && (
          <button type="button" onClick={() => onChange("")}>
            Odebrat
          </button>
        )}
      </div>

      {open && (
        <div
          style={{
            marginTop: "12px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: "10px",
            padding: "12px",
            border: "1px solid #30372f",
            borderRadius: "6px",
            background: "#0c0f0c",
          }}
        >
          {loadingManifest ? (
            <p style={{ color: "#777d75" }}>
              {allowVideo ? "Načítám obrázky a videa..." : "Načítám obrázky..."}
            </p>
          ) : images.length === 0 ? (
            <p style={{ color: "#777d75" }}>
              {allowVideo
                ? "Ve složce characters nejsou žádné obrázky ani videa."
                : "Ve složce characters nejsou žádné obrázky."}
            </p>
          ) : (
            images.map((image) => (
              <button
                key={image.path}
                type="button"
                onClick={() => {
                  onChange(image.databasePath);
                  setOpen(false);
                }}
                style={{
                  padding: "6px",
                  border:
                    value === image.databasePath
                      ? "2px solid #9caf8d"
                      : "1px solid #30372f",
                  borderRadius: "6px",
                  background: "#101310",
                  cursor: "pointer",
                }}
              >
                {image.isVideo ? (
                  <video
                    src={image.url}
                    muted
                    playsInline
                    preload="metadata"
                    style={{
                      width: "100%",
                      height: "100px",
                      objectFit: "cover",
                      display: "block",
                      borderRadius: "4px",
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
                      height: "100px",
                      objectFit: "cover",
                      display: "block",
                      borderRadius: "4px",
                    }}
                  />
                )}

                <span
                  style={{
                    display: "block",
                    marginTop: "6px",
                    color: "#cbd6c3",
                    fontSize: "12px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {image.name}
                  <br />
                  <small style={{ opacity: 0.65 }}>{bookFolder}</small>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}


/* =========================================================
   VÝBĚR VIDEA POSTAVY
   ========================================================= */

function VideoPicker({
  label,
  value,
  onChange,
  bookId,
}) {
  const [open, setOpen] = useState(false);
  const [manifest, setManifest] = useState([]);
  const [loadingManifest, setLoadingManifest] = useState(false);

  const bookFolder =
    getBookCharacterAssetFolder(bookId);

  useEffect(() => {
    if (!open || manifest.length > 0) {
      return;
    }

    let cancelled = false;

    setLoadingManifest(true);

    loadCharacterManifest()
      .then((data) => {
        if (!cancelled) {
          setManifest(data);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingManifest(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, manifest.length]);

  const videos = manifest
    .filter((path) => {
      const normalized = path
        .replace(/\\/g, "/")
        .replace(/^\/+/, "");

      const parts = normalized.split("/");
      const folder = parts[0] || "";
      const extension =
        normalized.split(".").pop()?.toLowerCase();

      return (
        folder.toLowerCase() ===
          bookFolder.toLowerCase() &&
        [
          "mp4",
          "webm",
          "mov",
          "m4v",
        ].includes(extension)
      );
    })
    .map((path) => {
      const normalized = path
        .replace(/\\/g, "/")
        .replace(/^\/+/, "");

      return {
        path: normalized,
        url: `/characters/${normalized}`,
        databasePath:
          getManifestDatabasePath(normalized),
        name:
          getManifestFileName(normalized),
      };
    });

  return (
    <div>
      <label>
        {label}
      </label>

      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          marginTop: "8px",
        }}
      >
        {value ? (
          <video
            src={
              resolveCharacterAsset(
                value,
                null,
                bookId
              ) || value
            }
            muted
            playsInline
            controls
            preload="metadata"
            style={{
              width: "180px",
              height: "100px",
              objectFit: "cover",
              borderRadius: "6px",
              border: "1px solid #4d5949",
              background: "#000",
            }}
          />
        ) : (
          <div
            style={{
              width: "180px",
              height: "100px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px dashed #4d5949",
              borderRadius: "6px",
              color: "#777d75",
              fontSize: "13px",
              textAlign: "center",
              padding: "10px",
              boxSizing: "border-box",
            }}
          >
            Bez videa
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "7px",
          }}
        >
          <button
            type="button"
            onClick={() =>
              setOpen(!open)
            }
          >
            Vybrat video
          </button>

          {value && (
            <button
              type="button"
              onClick={() =>
                onChange("")
              }
            >
              Odebrat
            </button>
          )}
        </div>
      </div>

      {open && (
        <div
          style={{
            marginTop: "12px",
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(190px, 1fr))",
            gap: "10px",
            padding: "12px",
            border: "1px solid #30372f",
            borderRadius: "6px",
            background: "#0c0f0c",
          }}
        >
          {loadingManifest ? (
            <p style={{ color: "#777d75" }}>
              Načítám videa...
            </p>
          ) : videos.length === 0 ? (
            <p style={{ color: "#777d75" }}>
              Ve složce characters nejsou žádná videa.
              <br />
              Podporováno: MP4, WebM, MOV, M4V.
            </p>
          ) : (
            videos.map((video) => (
              <button
                key={video.path}
                type="button"
                onClick={() => {
                  onChange(video.databasePath);
                  setOpen(false);
                }}
                style={{
                  padding: "6px",
                  border:
                    value === video.databasePath
                      ? "2px solid #9caf8d"
                      : "1px solid #30372f",
                  borderRadius: "6px",
                  background: "#101310",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <video
                  src={video.url}
                  muted
                  playsInline
                  preload="metadata"
                  style={{
                    width: "100%",
                    height: "110px",
                    objectFit: "cover",
                    display: "block",
                    borderRadius: "4px",
                  }}
                />

                <span
                  style={{
                    display: "block",
                    marginTop: "6px",
                    color: "#cbd6c3",
                    fontSize: "12px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {video.name}
                </span>
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

function RichTextEditor({
  value,
  onChange,
}) {

  const editorRef = useRef(null);


  useEffect(() => {

    if (
      editorRef.current &&
      editorRef.current.innerHTML !== value
    ) {

      editorRef.current.innerHTML =
        value || "";

    }

  }, [value]);


  function executeCommand(
    command,
    commandValue = null
  ) {

    editorRef.current?.focus();

    document.execCommand(
      command,
      false,
      commandValue
    );

    handleInput();

  }


  function handleInput() {

    if (!editorRef.current) {
      return;
    }

    onChange(
      editorRef.current.innerHTML
    );

  }


  function createLink() {

    editorRef.current?.focus();

    const url = window.prompt(
      "Zadej adresu odkazu:"
    );

    if (!url) {
      return;
    }

    document.execCommand(
      "createLink",
      false,
      url
    );

    handleInput();

  }


  function formatBlock(value) {

    executeCommand(
      "formatBlock",
      value
    );

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


  const separatorStyle = {
    width: "1px",
    height: "24px",
    background: "#3d463a",
    margin: "0 3px",
  };


  return (

    <div
      style={{
        width: "100%",
        border:
          "1px solid #3d463a",
        borderRadius: "7px",
        overflow: "hidden",
        background: "#101310",
      }}
    >

      {/* =================================================
          LIŠTA EDITORU
      ================================================= */}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "5px",
          padding: "8px",
          borderBottom:
            "1px solid #3d463a",
          background: "#171b17",
        }}
      >

        {/* Tučné */}

        <button
          type="button"
          title="Tučné"
          style={{
            ...buttonStyle,
            fontWeight: "700",
          }}
          onMouseDown={(event) =>
            event.preventDefault()
          }
          onClick={() =>
            executeCommand("bold")
          }
        >
          B
        </button>


        {/* Kurzíva */}

        <button
          type="button"
          title="Kurzíva"
          style={{
            ...buttonStyle,
            fontStyle: "italic",
          }}
          onMouseDown={(event) =>
            event.preventDefault()
          }
          onClick={() =>
            executeCommand("italic")
          }
        >
          I
        </button>


        {/* Podtržení */}

        <button
          type="button"
          title="Podtržení"
          style={{
            ...buttonStyle,
            textDecoration: "underline",
          }}
          onMouseDown={(event) =>
            event.preventDefault()
          }
          onClick={() =>
            executeCommand("underline")
          }
        >
          U
        </button>


        <span
          style={separatorStyle}
        />


        {/* Odstavec */}

        <button
          type="button"
          title="Normální odstavec"
          style={buttonStyle}
          onMouseDown={(event) =>
            event.preventDefault()
          }
          onClick={() =>
            formatBlock("p")
          }
        >
          ¶
        </button>


        {/* Nadpis 2 */}

        <button
          type="button"
          title="Nadpis"
          style={buttonStyle}
          onMouseDown={(event) =>
            event.preventDefault()
          }
          onClick={() =>
            formatBlock("h2")
          }
        >
          H2
        </button>


        {/* Nadpis 3 */}

        <button
          type="button"
          title="Menší nadpis"
          style={buttonStyle}
          onMouseDown={(event) =>
            event.preventDefault()
          }
          onClick={() =>
            formatBlock("h3")
          }
        >
          H3
        </button>


        <span
          style={separatorStyle}
        />


        {/* Zarovnání vlevo */}

        <button
          type="button"
          title="Zarovnat vlevo"
          style={buttonStyle}
          onMouseDown={(event) =>
            event.preventDefault()
          }
          onClick={() =>
            executeCommand(
              "justifyLeft"
            )
          }
        >
          ≡←
        </button>


        {/* Zarovnání na střed */}

        <button
          type="button"
          title="Zarovnat na střed"
          style={buttonStyle}
          onMouseDown={(event) =>
            event.preventDefault()
          }
          onClick={() =>
            executeCommand(
              "justifyCenter"
            )
          }
        >
          ≡
        </button>


        {/* Zarovnání vpravo */}

        <button
          type="button"
          title="Zarovnat vpravo"
          style={buttonStyle}
          onMouseDown={(event) =>
            event.preventDefault()
          }
          onClick={() =>
            executeCommand(
              "justifyRight"
            )
          }
        >
          →≡
        </button>


        <span
          style={separatorStyle}
        />


        {/* Odrážky */}

        <button
          type="button"
          title="Odrážkový seznam"
          style={buttonStyle}
          onMouseDown={(event) =>
            event.preventDefault()
          }
          onClick={() =>
            executeCommand(
              "insertUnorderedList"
            )
          }
        >
          •☰
        </button>


        {/* Číslovaný seznam */}

        <button
          type="button"
          title="Číslovaný seznam"
          style={buttonStyle}
          onMouseDown={(event) =>
            event.preventDefault()
          }
          onClick={() =>
            executeCommand(
              "insertOrderedList"
            )
          }
        >
          1.
        </button>


        <span
          style={separatorStyle}
        />


        {/* Odkaz */}

        <button
          type="button"
          title="Vložit odkaz"
          style={buttonStyle}
          onMouseDown={(event) =>
            event.preventDefault()
          }
          onClick={createLink}
        >
          🔗
        </button>


        {/* Oddělovací čára */}

        <button
          type="button"
          title="Oddělovací čára"
          style={buttonStyle}
          onMouseDown={(event) =>
            event.preventDefault()
          }
          onClick={() =>
            executeCommand(
              "insertHorizontalRule"
            )
          }
        >
          ―
        </button>


        <span
          style={separatorStyle}
        />


        {/* Zpět */}

        <button
          type="button"
          title="Zpět"
          style={buttonStyle}
          onMouseDown={(event) =>
            event.preventDefault()
          }
          onClick={() =>
            executeCommand("undo")
          }
        >
          ↶
        </button>


        {/* Znovu */}

        <button
          type="button"
          title="Znovu"
          style={buttonStyle}
          onMouseDown={(event) =>
            event.preventDefault()
          }
          onClick={() =>
            executeCommand("redo")
          }
        >
          ↷
        </button>

      </div>


      {/* =================================================
          EDITAČNÍ PLOCHA
      ================================================= */}

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
          fontFamily:
            "Georgia, 'Times New Roman', serif",
          fontSize: "17px",
          lineHeight: "1.65",
          outline: "none",
        }}
      />

    </div>

  );

}


/* =========================================================
   FORMULÁŘ POSTAVY
   ========================================================= */

function CharacterForm({
  bookId,
  character,
  onSave,
  onCancel,
}) {

  const [
    name,
    setName,
  ] = useState(
    character?.name || ""
  );


  const [
    quote,
    setQuote,
  ] = useState(
    character?.quote || ""
  );


  const [
    contentHtml,
    setContentHtml,
  ] = useState(
    character?.content_html || ""
  );


  const [
    mainImage,
    setMainImage,
  ] = useState(
    character?.main_image || ""
  );


  const [
    headerImage,
    setHeaderImage,
  ] = useState(
    character?.header_image || ""
  );


  const [
    mainVideo,
    setMainVideo,
  ] = useState(
    character?.main_video || ""
  );


  const [
    published,
    setPublished,
  ] = useState(
    character?.published ?? true
  );


  const [
    sortOrder,
    setSortOrder,
  ] = useState(
    character?.sort_order ?? 0
  );


  /*
   * DŮLEŽITÉ:
   * ID dílů držíme vždy jako čísla.
   * Backend/Neon tak dostane například [1, 2, 4]
   * místo kombinace ["1", 2, "4"].
   */
  const [
    selectedVolumes,
    setSelectedVolumes,
  ] = useState(
    (character?.volume_ids || [])
      .map(Number)
      .filter(Number.isFinite)
  );


  const [
    details,
    setDetails,
  ] = useState(
    character?.details || []
  );


  const [
    volumes,
    setVolumes,
  ] = useState([]);


  const [
    loadingVolumes,
    setLoadingVolumes,
  ] = useState(false);


  const [
    characters,
    setCharacters,
  ] = useState([]);


  const [
    loadingCharacters,
    setLoadingCharacters,
  ] = useState(false);


  const [
    images,
    setImages,
  ] = useState(
    character?.images || []
  );


  const [
    quotes,
    setQuotes,
  ] = useState(
    character?.quotes || []
  );


  const [
    relationships,
    setRelationships,
  ] = useState(
    character?.relationships || []
  );


  const [
    saving,
    setSaving,
  ] = useState(false);


  useEffect(() => {

    setName(
      character?.name || ""
    );

    setQuote(
      character?.quote || ""
    );

    setContentHtml(
      character?.content_html || ""
    );

    setMainImage(
      character?.main_image || ""
    );

    setHeaderImage(
      character?.header_image || ""
    );

    setMainVideo(
      character?.main_video || ""
    );

    setPublished(
      character?.published ?? true
    );

    setSortOrder(
      character?.sort_order ?? 0
    );

    /*
     * Při načtení existující postavy znovu
     * sjednotíme všechna ID dílů na čísla.
     */
    setSelectedVolumes(
      (character?.volume_ids || [])
        .map(Number)
        .filter(Number.isFinite)
    );

    setDetails(
      character?.details || []
    );

    setImages(
      character?.images || []
    );

    setQuotes(
      character?.quotes || []
    );

    setRelationships(
      (character?.relationships || []).map(
        (relationship) => ({
          ...relationship,
          relationship_types:
            Array.isArray(
              relationship.relationship_types
            )
              ? relationship.relationship_types
              : relationship.relationship_type
                ? (() => {
                    try {
                      const parsed =
                        JSON.parse(
                          relationship.relationship_type
                        );

                      return Array.isArray(parsed)
                        ? parsed
                        : [
                            relationship.relationship_type,
                          ];
                    } catch {
                      return [
                        relationship.relationship_type,
                      ];
                    }
                  })()
                : [],
        })
      )
    );

  }, [
    character,
  ]);


  /* =======================================================
     NAČTENÍ DÍLŮ
  ======================================================= */

  useEffect(() => {

    async function loadVolumes() {

      if (!bookId) {
        return;
      }

      setLoadingVolumes(true);

      try {

        const data =
          await getVolumes(
            bookId
          );

        setVolumes(
          data || []
        );

      } catch (error) {

        console.error(
          error
        );

      } finally {

        setLoadingVolumes(false);

      }

    }


    loadVolumes();

  }, [
    bookId,
  ]);


  /* =======================================================
     NAČTENÍ EXISTUJÍCÍCH POSTAV
  ======================================================= */

  useEffect(() => {

    async function loadCharacters() {

      if (!bookId) {
        return;
      }

      setLoadingCharacters(true);

      try {

        const data =
          await getCharacters(
            bookId
          );

        setCharacters(
          Array.isArray(data)
            ? data
            : []
        );

      } catch (error) {

        console.error(
          error
        );

      } finally {

        setLoadingCharacters(false);

      }

    }

    loadCharacters();

  }, [
    bookId,
  ]);


  /* =======================================================
     DÍLY
  ======================================================= */

  function toggleVolume(volumeId) {

    const numericVolumeId =
      Number(volumeId);

    if (!Number.isFinite(numericVolumeId)) {
      return;
    }

    setSelectedVolumes(
      (current) => {

        /*
         * Pojistka: i kdyby se do state nějak dostal
         * string, okamžitě ho převedeme na číslo.
         */
        const normalizedCurrent =
          current
            .map(Number)
            .filter(Number.isFinite);

        if (
          normalizedCurrent.includes(
            numericVolumeId
          )
        ) {

          return normalizedCurrent.filter(
            (id) =>
              id !== numericVolumeId
          );

        }

        return [
          ...normalizedCurrent,
          numericVolumeId,
        ];

      }
    );

  }


  async function addNewVolume() {

    const title =
      window.prompt(
        "Název nového dílu:"
      );

    if (!title?.trim()) {
      return;
    }

    const numberValue =
      window.prompt(
        "Číslo dílu (volitelné):"
      );

    try {

      const created =
        await addVolume(
          bookId,
          {
            title:
              title.trim(),
            number:
              numberValue?.trim()
                ? Number(numberValue)
                : null,
          }
        );

      const data =
        await getVolumes(
          bookId
        );

      setVolumes(
        data || []
      );

      if (created?.id) {

        const numericCreatedId =
          Number(created.id);

        if (Number.isFinite(numericCreatedId)) {

          setSelectedVolumes(
            (current) => [
              ...current
                .map(Number)
                .filter(Number.isFinite),
              numericCreatedId,
            ]
          );

        }

      }

    } catch (error) {

      console.error(error);

      alert(
        error.message ||
        "Nepodařilo se přidat díl."
      );

    }

  }


  /* =======================================================
     GALERIE
  ======================================================= */

  function addGalleryImage() {

    setImages(
      (current) => [
        ...current,
        {
          image: "",
          caption: "",
          sort_order:
            current.length,
        },
      ]
    );

  }


  function updateGalleryImage(
    index,
    field,
    value
  ) {

    setImages(
      (current) =>
        current.map(
          (image, imageIndex) =>
            imageIndex === index
              ? {
                  ...image,
                  [field]:
                    value,
                }
              : image
        )
    );

  }


  function removeGalleryImage(
    index
  ) {

    setImages(
      (current) =>
        current.filter(
          (_, imageIndex) =>
            imageIndex !== index
        )
    );

  }


  /* =======================================================
     CITÁTY
  ======================================================= */

  function addQuote() {

    setQuotes(
      (current) => [
        ...current,
        {
          quote: "",
          author: "",
          volume_id:
            selectedVolumes[0] ||
            "",
          sort_order:
            current.length,
        },
      ]
    );

  }


  function updateQuote(
    index,
    field,
    value
  ) {

    setQuotes(
      (current) =>
        current.map(
          (quoteItem, quoteIndex) =>
            quoteIndex === index
              ? {
                  ...quoteItem,
                  [field]:
                    value,
                }
              : quoteItem
        )
    );

  }


  function removeQuote(
    index
  ) {

    setQuotes(
      (current) =>
        current.filter(
          (_, quoteIndex) =>
            quoteIndex !== index
        )
    );

  }


  /* =======================================================
     VZTAHY
  ======================================================= */

  const relationshipTypes = [
    {
      value: "love",
      icon: "❤️",
      label: "Láska",
    },
    {
      value: "friend",
      icon: "🤝",
      label: "Přátelství",
    },
    {
      value: "family",
      icon: "👨‍👩‍👧",
      label: "Rodina",
    },
    {
      value: "enemy",
      icon: "⚔️",
      label: "Nepřítel",
    },
    {
      value: "ex",
      icon: "💔",
      label: "Bývalý",
    },
    {
      value: "acquaintance",
      icon: "👤",
      label: "Známý",
    },
  ];


  function addRelationship() {

    setRelationships(
      (current) => [
        ...current,
        {
          related_character_id:
            "",
          relationship_types: [],
        },
      ]
    );

  }


  function updateRelationship(
    index,
    field,
    value
  ) {

    setRelationships(
      (current) =>
        current.map(
          (
            relationship,
            relationshipIndex
          ) =>
            relationshipIndex === index
              ? {
                  ...relationship,
                  [field]:
                    value,
                }
              : relationship
        )
    );

  }


  function toggleRelationshipType(
    index,
    typeValue
  ) {

    setRelationships(
      (current) =>
        current.map(
          (
            relationship,
            relationshipIndex
          ) => {

            if (
              relationshipIndex !== index
            ) {
              return relationship;
            }

            const currentTypes =
              Array.isArray(
                relationship.relationship_types
              )
                ? relationship.relationship_types
                : [];

            const hasType =
              currentTypes.includes(
                typeValue
              );

            return {
              ...relationship,
              relationship_types:
                hasType
                  ? currentTypes.filter(
                      (type) =>
                        type !== typeValue
                    )
                  : [
                      ...currentTypes,
                      typeValue,
                    ],
            };

          }
        )
    );

  }


  function removeRelationship(
    index
  ) {

    setRelationships(
      (current) =>
        current.filter(
          (_, relationshipIndex) =>
            relationshipIndex !== index
        )
    );

  }


  async function addNewCharacterForRelationship() {

    const newName =
      window.prompt(
        "Jméno nové postavy:"
      );

    if (!newName?.trim()) {
      return;
    }

    try {

      const created =
        await addCharacter(
          bookId,
          {
            name:
              newName.trim(),
            quote: "",
            content_html: "",
            main_image: null,
            header_image: null,
            main_video: null,
            published: true,
            sort_order: 0,
            volume_ids: [],
            details: [],
            images: [],
            quotes: [],
            relationships: [],
          }
        );

      const data =
        await getCharacters(
          bookId
        );

      setCharacters(
        Array.isArray(data)
          ? data
          : []
      );

      if (created?.id) {

        setRelationships(
          (current) => [
            ...current,
            {
              related_character_id:
                created.id,
              relationship_types: [],
            },
          ]
        );

      }

    } catch (error) {

      console.error(error);

      alert(
        error.message ||
        "Nepodařilo se přidat postavu."
      );

    }

  }


  /* =======================================================
     DALŠÍ INFORMACE
  ======================================================= */

  function addDetail() {

    setDetails(
      (current) => [
        ...current,
        {
          label: "",
          value: "",
        },
      ]
    );

  }


  function updateDetail(
    index,
    field,
    value
  ) {

    setDetails(
      (current) =>
        current.map(
          (detail, detailIndex) =>
            detailIndex === index
              ? {
                  ...detail,
                  [field]:
                    value,
                }
              : detail
        )
    );

  }


  function removeDetail(
    index
  ) {

    setDetails(
      (current) =>
        current.filter(
          (_, detailIndex) =>
            detailIndex !== index
        )
    );

  }


  /* =======================================================
     ULOŽENÍ
  ======================================================= */

  async function handleSubmit(
    event
  ) {

    event.preventDefault();


    if (
      !name.trim()
    ) {

      alert(
        "Postava musí mít jméno."
      );

      return;

    }


    /*
     * Poslední pojistka před odesláním:
     * volume_ids budou vždy pouze čísla,
     * bez duplicit a bez neplatných hodnot.
     */
    const normalizedVolumeIds =
      [
        ...new Set(
          selectedVolumes
            .map(Number)
            .filter(Number.isFinite)
        ),
      ];


    const characterData = {

      name:
        name.trim(),

      quote:
        quote.trim(),

      content_html:
        contentHtml,

      main_image:
        mainImage || null,

      header_image:
        headerImage || null,

      main_video:
        mainVideo || null,

      published:
        Boolean(
          published
        ),

      sort_order:
        Number(
          sortOrder
        ) || 0,

      volume_ids:
        normalizedVolumeIds,

      details:
        details
          .filter(
            (detail) =>
              detail.label?.trim() ||
              detail.value?.trim()
          )
          .map(
            (detail) => ({
              label:
                detail.label?.trim() ||
                "",
              value:
                detail.value?.trim() ||
                "",
            })
          ),

      images:
        images
          .filter(
            (image) =>
              image.image?.trim()
          )
          .map(
            (image, index) => ({
              image:
                image.image.trim(),
              caption:
                image.caption?.trim() ||
                "",
              sort_order:
                index,
            })
          ),

      quotes:
        quotes
          .filter(
            (quoteItem) =>
              quoteItem.quote?.trim()
          )
          .map(
            (quoteItem, index) => ({
              quote:
                quoteItem.quote.trim(),
              author:
                quoteItem.author?.trim() ||
                "",
              volume_id:
                quoteItem.volume_id
                  ? Number(
                      quoteItem.volume_id
                    )
                  : null,
              sort_order:
                index,
            })
          ),

      relationships:
        relationships
          .filter(
            (relationship) =>
              relationship.related_character_id &&
              Number(
                relationship.related_character_id
              ) !== Number(
                character?.id
              ) &&
              Array.isArray(
                relationship.relationship_types
              ) &&
              relationship.relationship_types.length > 0
          )
          .map(
            (relationship) => ({
              related_character_id:
                Number(
                  relationship.related_character_id
                ),
              relationship_types:
                relationship.relationship_types,
            })
          ),

    };


    console.log(
      "=== ODESÍLÁM POSTAVU ==="
    );

    console.log(
      characterData
    );

    console.log(
      "volume_ids:",
      characterData.volume_ids
    );

    console.log(
      "volume_ids types:",
      characterData.volume_ids.map(
        (id) => typeof id
      )
    );

    console.log(
      "main_image:",
      characterData.main_image
    );

    console.log(
      "header_image:",
      characterData.header_image
    );


    setSaving(true);


    try {

      await onSave(
        characterData
      );

    } catch (error) {

      console.error(
        error
      );

    } finally {

      setSaving(false);

    }

  }


  /* =======================================================
     VYKRESLENÍ
  ======================================================= */

  return (

    <form
      onSubmit={
        handleSubmit
      }
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >


      {/* =================================================
          ZÁKLADNÍ INFORMACE
      ================================================= */}

      <section>

        <h3>
          Základní informace
        </h3>


        <div
          style={{
            display: "grid",
            gap: "16px",
          }}
        >

          <div>

            <label htmlFor="character-name">

              Jméno

            </label>


            <input
              id="character-name"
              type="text"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value
                )
              }
              required
            />

          </div>


          <div>

            <label htmlFor="character-quote">

              Hláška

            </label>


            <input
              id="character-quote"
              type="text"
              value={quote}
              onChange={(event) =>
                setQuote(
                  event.target.value
                )
              }
            />

          </div>


          {/* =================================================
              POPIS – RICH TEXT EDITOR
          ================================================= */}

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
              onChange={
                setContentHtml
              }
            />

          </div>

        </div>

      </section>


      {/* =================================================
          OBRÁZKY
      ================================================= */}

      <section>

        <h3>
          Obrázky
        </h3>


        <div
          style={{
            display: "grid",
            gap: "20px",
          }}
        >

          <ImagePicker
            label="Hlavní obrázek"
            value={mainImage}
            bookId={bookId}
            onChange={
              setMainImage
            }
          />


          <ImagePicker
            label="Horní obrázek"
            value={headerImage}
            bookId={bookId}
            onChange={
              setHeaderImage
            }
          />

          <VideoPicker
            label="Video postavy"
            value={mainVideo}
            bookId={bookId}
            onChange={setMainVideo}
          />

        </div>

      </section>


      {/* =================================================
          DÍLY
      ================================================= */}

      <section>

        <h3>
          Díly
        </h3>


        {loadingVolumes ? (

          <p>
            Načítám díly...
          </p>

        ) : volumes.length === 0 ? (

          <p>
            Tato kniha zatím nemá žádné díly.
          </p>

        ) : (

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >

            {volumes.map(
              (volume) => (

                <label
                  key={
                    volume.id
                  }
                  style={{
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                  }}
                >

                  <input
                    type="checkbox"
                    checked={
                      selectedVolumes.includes(
                        Number(volume.id)
                      )
                    }
                    onChange={() =>
                      toggleVolume(
                        volume.id
                      )
                    }
                  />


                  <span>

                    {volume.number
                      ? `Díl ${volume.number} – `
                      : ""}

                    {volume.title}

                  </span>

                </label>

              )
            )}

          </div>

        )}


        <button
          type="button"
          onClick={
            addNewVolume
          }
          style={{
            marginTop: "12px",
          }}
        >
          + Přidat nový díl
        </button>

      </section>


      {/* =================================================
          GALERIE
      ================================================= */}

      <section>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >

          <h3>
            Galerie
          </h3>

          <button
            type="button"
            onClick={addGalleryImage}
          >
            + Přidat obrázek
          </button>

        </div>


        {images.length === 0 ? (

          <p>
            Galerie zatím neobsahuje žádné obrázky.
          </p>

        ) : (

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >

            {images.map(
              (image, index) => (

                <div
                  key={
                    image.id ||
                    `gallery-${index}`
                  }
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(280px, 1fr) 1fr auto",
                    gap: "14px",
                    alignItems: "end",
                    padding: "14px",
                    border:
                      "1px solid #30372f",
                    borderRadius: "7px",
                    background:
                      "#101310",
                  }}
                >

                  <ImagePicker
                    label="Obrázek"
                    value={
                      image.image || ""
                    }
                    bookId={bookId}
                    allowVideo
                    onChange={(value) =>
                      updateGalleryImage(
                        index,
                        "image",
                        value
                      )
                    }
                  />

                  <div>

                    <label>
                      Popisek
                    </label>

                    <input
                      type="text"
                      value={
                        image.caption || ""
                      }
                      onChange={(event) =>
                        updateGalleryImage(
                          index,
                          "caption",
                          event.target.value
                        )
                      }
                      placeholder="Krátký popisek"
                    />

                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      removeGalleryImage(index)
                    }
                  >
                    ×
                  </button>

                </div>

              )
            )}

          </div>

        )}

      </section>


      {/* =================================================
          CITÁTY
      ================================================= */}

      <section>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >

          <h3>
            Citáty
          </h3>

          <button
            type="button"
            onClick={addQuote}
          >
            + Přidat citát
          </button>

        </div>


        {quotes.length === 0 ? (

          <p>
            Zatím nejsou přidané žádné citáty.
          </p>

        ) : (

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >

            {quotes.map(
              (quoteItem, index) => (

                <div
                  key={
                    quoteItem.id ||
                    `quote-${index}`
                  }
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "2fr 1fr 1fr auto",
                    gap: "10px",
                    alignItems: "end",
                    padding: "14px",
                    border:
                      "1px solid #30372f",
                    borderRadius: "7px",
                    background:
                      "#101310",
                  }}
                >

                  <div>

                    <label>
                      Citát
                    </label>

                    <textarea
                      value={
                        quoteItem.quote || ""
                      }
                      onChange={(event) =>
                        updateQuote(
                          index,
                          "quote",
                          event.target.value
                        )
                      }
                      rows="3"
                      placeholder="Jsem nejlepší."
                    />

                  </div>


                  <div>

                    <label>
                      Autor
                    </label>

                    <input
                      type="text"
                      value={
                        quoteItem.author || ""
                      }
                      onChange={(event) =>
                        updateQuote(
                          index,
                          "author",
                          event.target.value
                        )
                      }
                      placeholder={
                        character?.name ||
                        "Autor"
                      }
                    />

                  </div>


                  <div>

                    <label>
                      Kniha / díl
                    </label>

                    <select
                      value={
                        quoteItem.volume_id || ""
                      }
                      onChange={(event) =>
                        updateQuote(
                          index,
                          "volume_id",
                          event.target.value
                        )
                      }
                    >

                      <option value="">
                        Vyber díl
                      </option>

                      {volumes.map(
                        (volume) => (

                          <option
                            key={volume.id}
                            value={volume.id}
                          >

                            {volume.number
                              ? `Díl ${volume.number} – `
                              : ""}

                            {volume.title}

                          </option>

                        )
                      )}

                    </select>

                  </div>


                  <button
                    type="button"
                    onClick={() =>
                      removeQuote(index)
                    }
                  >
                    ×
                  </button>

                </div>

              )
            )}

          </div>

        )}

      </section>


      {/* =================================================
          VZTAHY
      ================================================= */}

      <section>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >

          <h3>
            Vztahy
          </h3>

          <div
            style={{
              display: "flex",
              gap: "8px",
            }}
          >

            <button
              type="button"
              onClick={
                addNewCharacterForRelationship
              }
            >
              + Přidat novou postavu
            </button>

            <button
              type="button"
              onClick={addRelationship}
            >
              + Přidat vztah
            </button>

          </div>

        </div>


        {loadingCharacters ? (

          <p>
            Načítám postavy...
          </p>

        ) : relationships.length === 0 ? (

          <p>
            Zatím nejsou přidané žádné vztahy.
          </p>

        ) : (

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >

            {relationships.map(
              (relationship, index) => {

                const selectedTypes =
                  Array.isArray(
                    relationship.relationship_types
                  )
                    ? relationship.relationship_types
                    : [];

                return (

                  <div
                    key={
                      relationship.id ||
                      `relationship-${index}`
                    }
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "1fr 2fr auto",
                      gap: "14px",
                      alignItems: "start",
                      padding: "12px",
                      border:
                        "1px solid #30372f",
                      borderRadius: "7px",
                      background:
                        "#101310",
                    }}
                  >

                    <select
                      value={
                        relationship.related_character_id ||
                        ""
                      }
                      onChange={(event) =>
                        updateRelationship(
                          index,
                          "related_character_id",
                          event.target.value
                        )
                      }
                    >

                      <option value="">
                        Vyber postavu
                      </option>

                      {characters
                        .filter(
                          (item) =>
                            Number(item.id) !==
                            Number(
                              character?.id
                            )
                        )
                        .map(
                          (item) => (

                            <option
                              key={item.id}
                              value={item.id}
                            >
                              {item.name}
                            </option>

                          )
                        )}

                    </select>


                    <div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(3, minmax(0, 1fr))",
                          gap: "7px",
                        }}
                      >

                        {relationshipTypes.map(
                          (type) => {

                            const checked =
                              selectedTypes.includes(
                                type.value
                              );

                            return (

                              <label
                                key={
                                  type.value
                                }
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  padding:
                                    "7px 8px",
                                  border:
                                    checked
                                      ? "1px solid #9caf8d"
                                      : "1px solid #30372f",
                                  borderRadius:
                                    "6px",
                                  background:
                                    checked
                                      ? "rgba(156,175,141,0.12)"
                                      : "#171b17",
                                  cursor: "pointer",
                                }}
                              >

                                <input
                                  type="checkbox"
                                  checked={
                                    checked
                                  }
                                  onChange={() =>
                                    toggleRelationshipType(
                                      index,
                                      type.value
                                    )
                                  }
                                />

                                <span>
                                  {type.icon}{" "}
                                  {type.label}
                                </span>

                              </label>

                            );

                          }
                        )}

                      </div>


                      {selectedTypes.length === 0 && (

                        <div
                          style={{
                            marginTop: "7px",
                            color: "#777d75",
                            fontSize: "12px",
                          }}
                        >
                          Vyber alespoň jeden typ vztahu.
                        </div>

                      )}

                    </div>


                    <button
                      type="button"
                      onClick={() =>
                        removeRelationship(
                          index
                        )
                      }
                    >
                      ×
                    </button>

                  </div>

                );

              }
            )}

          </div>

        )}

      </section>


      {/* =================================================
          DALŠÍ INFORMACE
      ================================================= */}

      <section>

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            marginBottom:
              "12px",
          }}
        >

          <h3>
            Další informace
          </h3>


          <button
            type="button"
            onClick={
              addDetail
            }
          >

            + Přidat

          </button>

        </div>


        {details.length === 0 ? (

          <p>
            Žádné další informace.
          </p>

        ) : (

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >

            {details.map(
              (
                detail,
                index
              ) => (

                <div
                  key={index}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "1fr 2fr auto",
                    gap: "10px",
                  }}
                >

                  <input
                    type="text"
                    placeholder="Název"
                    value={
                      detail.label ||
                      ""
                    }
                    onChange={(event) =>
                      updateDetail(
                        index,
                        "label",
                        event.target.value
                      )
                    }
                  />


                  <input
                    type="text"
                    placeholder="Hodnota"
                    value={
                      detail.value ||
                      ""
                    }
                    onChange={(event) =>
                      updateDetail(
                        index,
                        "value",
                        event.target.value
                      )
                    }
                  />


                  <button
                    type="button"
                    onClick={() =>
                      removeDetail(
                        index
                      )
                    }
                  >
                    ×
                  </button>

                </div>

              )
            )}

          </div>

        )}

      </section>


      {/* =================================================
          NASTAVENÍ
      ================================================= */}

      <section>

        <h3>
          Nastavení
        </h3>


        <div
          style={{
            display: "grid",
            gap: "12px",
          }}
        >

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >

            <input
              type="checkbox"
              checked={
                published
              }
              onChange={(event) =>
                setPublished(
                  event.target.checked
                )
              }
            />

            Publikovat postavu

          </label>


          <div>

            <label htmlFor="character-sort">

              Pořadí

            </label>


            <input
              id="character-sort"
              type="number"
              value={
                sortOrder
              }
              onChange={(event) =>
                setSortOrder(
                  event.target.value
                )
              }
            />

          </div>

        </div>

      </section>


      {/* =================================================
          TLAČÍTKA
      ================================================= */}

      <div
        style={{
          display: "flex",
          gap: "10px",
          justifyContent:
            "flex-end",
        }}
      >

        <button
          type="button"
          onClick={
            onCancel
          }
          disabled={
            saving
          }
        >
          Zrušit
        </button>


        <button
          type="submit"
          disabled={
            saving
          }
        >

          {saving
            ? "Ukládám..."
            : character?.id
              ? "Uložit změny"
              : "Přidat postavu"}

        </button>

      </div>


    </form>

  );

}


export default CharacterForm;