import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { getCharacter } from "../services/charactersService";
import { getBook, getVolumes } from "../services/booksService";

import frameMain from "../assets/frames/frame-character-main.png";
import frameHeader from "../assets/frames/frame-character.png";
import frameButton from "../assets/frames/frame-character-button.png";

import { resolveCharacterAsset } from "../utils/characterAssetPaths";

import "./CharacterPage.css";
import characterAllBackground from "../assets/images/characterall.png";
import aeilCharacterBackground from "../assets/images/aeil-character-back.png";

function getCharacterBackground(bookId) {
  switch (Number(bookId)) {
    case 1:
      // (Ne)začalo to.. – světlé pozadí s vlnou
      return characterAllBackground;

    case 2:
      // AEIL – tmavé vínové krajkové pozadí
      return aeilCharacterBackground;

    case 3:
      // Vespera zatím používá základní pozadí.
      return characterAllBackground;

    default:
      return characterAllBackground;
  }
}


const characterImages = import.meta.glob(
  "../assets/images/characters/**/*",
  {
    eager: true,
    query: "?url",
    import: "default",
  }
);

const characterVideos = import.meta.glob(
  "../assets/images/characters/**/*.{mp4,webm,mov,m4v}",
  {
    eager: true,
    query: "?url",
    import: "default",
  }
);


function getBookHomePath(bookId) {

  if (Number(bookId) === 1) {
    return "/books/nezacalo";
  }

  return `/project/${bookId}`;
}


function CharacterPage() {

  const {
    bookId,
    characterId,
  } = useParams();

  const navigate = useNavigate();


  const [character, setCharacter] = useState(null);
  const [book, setBook] = useState(null);
  const [volumes, setVolumes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activePanel, setActivePanel] = useState("");


  /* =========================================================
     HLAVNÍ VIDEO POSTAVY
  ========================================================= */

  const [showMainVideo, setShowMainVideo] = useState(false);
  const [mainVideoKey, setMainVideoKey] = useState(0);


  /* =========================================================
     NAČTENÍ POSTAVY
  ========================================================= */

  useEffect(() => {

    let cancelled = false;


    async function loadCharacter() {

      setLoading(true);
      setError("");


      try {

        const [
          data,
          loadedBook,
          loadedVolumes,
        ] = await Promise.all([

          getCharacter(
            bookId,
            characterId
          ),

          getBook(
            bookId
          ),

          getVolumes(
            bookId
          ),

        ]);


        if (cancelled) {
          return;
        }


        setCharacter(data);

        setBook(loadedBook);

        setVolumes(
          Array.isArray(loadedVolumes)
            ? loadedVolumes
            : []
        );


      } catch (err) {

        if (cancelled) {
          return;
        }


        console.error(err);


        setError(
          err?.message ||
          "Nepodařilo se načíst postavu."
        );


      } finally {

        if (!cancelled) {
          setLoading(false);
        }

      }

    }


    loadCharacter();


    return () => {
      cancelled = true;
    };

  }, [
    bookId,
    characterId,
  ]);


  /* =========================================================
     HLAVNÍ VIDEO POSTAVY
  ========================================================= */

  useEffect(() => {

    let mainHideTimer;
    let mainInterval;
    let mainRestartTimer;


    if (!character?.main_video) {

      setShowMainVideo(false);

      return undefined;
    }


    function startMainVideo() {

      setMainVideoKey(
        (key) => key + 1
      );

      setShowMainVideo(true);


      mainHideTimer =
        setTimeout(() => {

          setShowMainVideo(false);

        }, 3400);

    }


    const mainStartTimer =
      setTimeout(() => {

        startMainVideo();


        mainInterval =
          setInterval(() => {

            setShowMainVideo(false);


            mainRestartTimer =
              setTimeout(() => {

                startMainVideo();

              }, 22000);

          }, 30000);


      }, 3000);


    return () => {

      clearTimeout(
        mainStartTimer
      );

      clearTimeout(
        mainHideTimer
      );

      clearTimeout(
        mainRestartTimer
      );

      clearInterval(
        mainInterval
      );

    };

  }, [
    character?.main_video,
  ]);


  /* =========================================================
     JEDINEČNÉ VZTAHY
  ========================================================= */

  const uniqueRelationships =
    useMemo(() => {

      if (
        !Array.isArray(
          character?.relationships
        )
      ) {

        return [];

      }


      const grouped = new Map();


      character.relationships.forEach(
        (relationship) => {

          const relatedId =
            Number(
              relationship.related_character_id
            );


          if (
            !Number.isFinite(
              relatedId
            )
          ) {

            return;

          }


          let relationshipTypes =
            Array.isArray(
              relationship.relationship_types
            )
              ? relationship.relationship_types
              : [];


          /*
           * Starší data mohou mít
           * relationship_type jako JSON.
           */

          if (
            relationshipTypes.length === 0 &&
            relationship.relationship_type
          ) {

            try {

              const parsed =
                JSON.parse(
                  relationship.relationship_type
                );


              relationshipTypes =
                Array.isArray(parsed)
                  ? parsed
                  : [
                      relationship.relationship_type,
                    ];


            } catch {

              relationshipTypes = [
                relationship.relationship_type,
              ];

            }

          }


          if (!grouped.has(relatedId)) {

            grouped.set(
              relatedId,
              {
                ...relationship,
                relationship_types: [],
              }
            );

          }


          const current =
            grouped.get(
              relatedId
            );


          relationshipTypes.forEach(
            (type) => {

              if (
                !current.relationship_types.includes(
                  type
                )
              ) {

                current.relationship_types.push(
                  type
                );

              }

            }
          );

        }
      );


      return Array.from(
        grouped.values()
      );

    }, [
      character,
    ]);


  /* =========================================================
     NAČÍTÁNÍ
  ========================================================= */

  if (loading) {

    return (

      <main className="character-page">

        <div className="character-page-state">
          Načítám postavu...
        </div>

      </main>

    );

  }


  /* =========================================================
     CHYBA
  ========================================================= */

  if (error) {

    return (

      <main className="character-page">

        <div
          className="
            character-page-state
            character-page-error
          "
        >

          {error}

        </div>

      </main>

    );

  }


  /* =========================================================
     POSTAVA NENALEZENA
  ========================================================= */

  if (!character) {

    return (

      <main className="character-page">

        <div className="character-page-state">

          Postava nebyla nalezena.

        </div>

      </main>

    );

  }


  const bookHomePath =
    getBookHomePath(
      bookId
    );


  /* =========================================================
     PANELY
  ========================================================= */

  function togglePanel(panel) {

    setActivePanel(
      (current) =>
        current === panel
          ? ""
          : panel
    );

  }


  return (

    <main className="character-page">


      {/* =====================================================
          POZADÍ
      ===================================================== */}

      <div
        key={`character-background-${bookId}`}
        className={`character-background character-background-book-${Number(bookId)}`}
        style={{
          backgroundImage: `url(${getCharacterBackground(bookId)})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
        aria-hidden="true"
      />


      {/* =====================================================
          HLAVNÍ LEVÝ OBRÁZEK
      ===================================================== */}

      <div className="character-main-visual">

        <div
          className="character-main-frame"
          style={{
            backgroundImage:
              `url(${frameMain})`,
          }}
        />


        {character.main_image && (

          <div className="character-main-photo">

            <img
              src={
                resolveCharacterAsset(
                  character.main_image,
                  characterImages,
                  bookId
                )
              }
              alt={character.name}
            />

          </div>

        )}


        {/* =================================================
            HLAVNÍ VIDEO
        ================================================= */}

        {showMainVideo &&
          character.main_video && (

          <div className="character-main-gif">

            <video
              key={mainVideoKey}
              src={
                resolveCharacterAsset(
                  character.main_video,
                  characterVideos,
                  bookId
                )
              }
              autoPlay
              muted
              playsInline
              preload="auto"
              aria-hidden="true"
            />

          </div>

        )}

      </div>


      {/* =====================================================
          PRAVÁ ČÁST
      ===================================================== */}

      <section className="character-right">


        {/* =================================================
            HLAVIČKA
        ================================================= */}

        <div className="character-header-visual">

          <div
            className="character-header-frame"
            style={{
              backgroundImage:
                `url(${frameHeader})`,
            }}
          />


          {character.header_image && (

            <div className="character-header-photo">

              <img
                src={
                  resolveCharacterAsset(
                    character.header_image,
                    characterImages,
                    bookId
                  )
                }
                alt=""
              />

            </div>

          )}


          <div className="character-header-text">

            <h1>
              {character.name}
            </h1>


            {character.quote && (

              <div className="character-quote">

                {character.quote}

              </div>

            )}

          </div>

        </div>


        {/* =================================================
            ŠEST PANELŮ
        ================================================= */}

        <nav className="character-panels">


          {/* =================================================
              1. KNIHA
          ================================================= */}

          <button
            type="button"
            className="character-panel-button"
            style={{
              backgroundImage:
                `url(${frameButton})`,
            }}
            onClick={() =>
              togglePanel("book")
            }
          >

            Kniha

          </button>


          {/* =================================================
              2. CITÁTY
          ================================================= */}

          <button
            type="button"
            className="character-panel-button"
            style={{
              backgroundImage:
                `url(${frameButton})`,
            }}
            onClick={() =>
              togglePanel("quotes")
            }
          >

            Citáty

          </button>


          {/* =================================================
              3. VZTAHY
          ================================================= */}

          <button
            type="button"
            className="character-panel-button"
            style={{
              backgroundImage:
                `url(${frameButton})`,
            }}
            onClick={() =>
              togglePanel("relationships")
            }
          >

            Vztahy

          </button>


          {/* =================================================
              4. GALERIE
          ================================================= */}

          <button
            type="button"
            className="character-panel-button"
            style={{
              backgroundImage:
                `url(${frameButton})`,
            }}
            onClick={() =>
              navigate(
                `/project/${bookId}/characters/${characterId}/gallery`
              )
            }
          >

            Galerie

          </button>


          {/* =================================================
              5. VIDEA
          ================================================= */}

          <button
            type="button"
            className="character-panel-button"
            style={{
              backgroundImage:
                `url(${frameButton})`,
            }}
            onClick={() =>
              togglePanel("videos")
            }
          >

            Videa

          </button>


          {/* =================================================
              6. SOUNDTRACK
          ================================================= */}

          <button
            type="button"
            className="character-panel-button"
            style={{
              backgroundImage:
                `url(${frameButton})`,
            }}
            onClick={() =>
              togglePanel("soundtrack")
            }
          >

            Soundtrack

          </button>


        </nav>


        {/* =====================================================
            KNIHA / DÍLY
        ===================================================== */}

        {activePanel === "book" && (

          <section className="character-section">


            <div
              className="
                character-details
                character-volume-links
              "
            >

              {(character.volume_ids || [])
                .map((volumeId) => {

                  const volume =
                    volumes.find(
                      (item) =>
                        Number(item.id) ===
                        Number(volumeId)
                    );


                  if (!volume) {
                    return null;
                  }


                  let volumePath = "";


                  if (Number(volume.id) === 1) {

                    volumePath =
                      "/books/nezacalo";

                  } else if (Number(volume.id) === 2) {

                    volumePath =
                      "/books/nezacalo/volume/2";

                  } else if (Number(volume.id) === 3) {

                    volumePath =
                      "/books/nezacalo/volume/3";

                  } else if (Number(volume.id) === 4) {

                    volumePath =
                      "/books/nezacalo/volume/4";

                  } else if (Number(volume.id) === 5) {

                    volumePath =
                      "/books/nezacalo/volume/5";

                  } else {

                    volumePath =
                      bookHomePath;

                  }


                  return (

                    <Link
                      key={volume.id}
                      to={volumePath}
                      className="
                        character-detail
                        character-volume-link
                      "
                    >

                      <span>

                        {volume.number
                          ? `Díl ${volume.number}`
                          : "Díl"}

                      </span>


                      <strong>

                        {volume.title}

                      </strong>

                    </Link>

                  );

                })}

            </div>

          </section>

        )}


        {/* =====================================================
            CITÁTY
        ===================================================== */}

        {activePanel === "quotes" && (

          <section className="character-section">


            {character.quotes &&
              character.quotes.length > 0 ? (

              <div className="character-admin-quotes">

                {character.quotes.map(
                  (item, index) => {

                    const volume =
                      volumes.find(
                        (volumeItem) =>
                          Number(
                            volumeItem.id
                          ) ===
                          Number(
                            item.volume_id
                          )
                      );


                    return (

                      <div
                        key={
                          item.id ||
                          index
                        }
                        className="character-admin-quote"
                      >

                        <span className="character-admin-quote-text">

                          „{item.quote}“

                        </span>


                        <strong className="character-admin-quote-source">

                          {item.author ||
                            character.name}

                          {volume
                            ? `, ${volume.title}`
                            : ""}

                        </strong>

                      </div>

                    );

                  }
                )}

              </div>

            ) : (

              <p>

                Zatím zde nejsou
                žádné citáty.

              </p>

            )}

          </section>

        )}


        {/* =====================================================
            VZTAHY
        ===================================================== */}

        {activePanel === "relationships" && (

          <section className="character-section">


            {uniqueRelationships.length > 0 ? (

              <div className="character-relationships">

                {uniqueRelationships.map(
                  (relationship) => {

                    const icons = {

                      love:
                        "❤️",

                      family:
                        "👨‍👩‍👧",

                      friend:
                        "🤝",

                      enemy:
                        "⚔️",

                      ex:
                        "💔",

                      acquaintance:
                        "👤",

                    };


                    const relationshipTypes =
                      Array.isArray(
                        relationship.relationship_types
                      )
                        ? relationship.relationship_types
                        : [];


                    return (

                      <Link
                        key={
                          relationship.related_character_id
                        }
                        to={
                          `/project/${bookId}/characters/${relationship.related_character_id}`
                        }
                        className="
                          character-relationship-link
                        "
                      >

                        <span
                          className="
                            character-relationship-icons
                          "
                          aria-hidden="true"
                        >

                          {relationshipTypes.map(
                            (type) => (

                              <span
                                key={type}
                                className="
                                  character-relationship-icon
                                "
                              >

                                {icons[type] || "👤"}

                              </span>

                            )
                          )}

                        </span>


                        <span>

                          {
                            relationship
                              .related_character_name
                          }

                        </span>

                      </Link>

                    );

                  }
                )}

              </div>

            ) : (

              <p>

                Zatím zde nejsou
                žádné vztahy.

              </p>

            )}

          </section>

        )}


        {/* =====================================================
            VIDEA
        ===================================================== */}

        {activePanel === "videos" && (

          <section className="character-section">


            {character.main_video ? (

              <div className="character-video-panel">

                <video
                  src={
                    resolveCharacterAsset(
                      character.main_video,
                      characterVideos,
                      bookId
                    )
                  }
                  controls
                  playsInline
                  preload="metadata"
                />

              </div>

            ) : (

              <p>

                Zatím zde nejsou
                žádná videa.

              </p>

            )}

          </section>

        )}


        {/* =====================================================
            SOUNDTRACK
        ===================================================== */}

        {activePanel === "soundtrack" && (

          <section className="character-section">


            {character.soundtrack ? (

              <div className="character-soundtrack">

                <audio
                  src={
                    resolveCharacterAsset(
                      character.soundtrack,
                      characterImages,
                      bookId
                    )
                  }
                  controls
                />

              </div>

            ) : (

              <p>

                Zatím zde není
                žádný soundtrack.

              </p>

            )}

          </section>

        )}


        {/* =====================================================
            POPIS
        ===================================================== */}

        {character.content_html && (

          <section className="character-description">

            <div
              dangerouslySetInnerHTML={{
                __html:
                  character.content_html,
              }}
            />

          </section>

        )}


        {/* =====================================================
            DALŠÍ INFORMACE
        ===================================================== */}

        {character.details &&
          character.details.length > 0 && (

          <section className="character-section">

            <div className="character-details">

              {character.details.map(
                (detail, index) => (

                  <div
                    key={
                      detail.id ||
                      index
                    }
                    className="character-detail"
                  >

                    <span>
                      {detail.label}
                    </span>


                    <strong>
                      {detail.value}
                    </strong>

                  </div>

                )
              )}

            </div>

          </section>

        )}


        


      </section>

    </main>

  );

}


export default CharacterPage;