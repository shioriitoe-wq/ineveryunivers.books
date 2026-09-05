import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getCharacter } from "../services/charactersService";
import { getBook, getVolumes } from "../services/booksService";

import characterBackground from "../assets/images/AEIL/aeil-character-back.png";

import characterFrame from "../assets/frames/aeil-character.png";
import infoFrame from "../assets/frames/aeil-character-info.png";
import aeilLine from "../assets/images/AEIL/aeil-line.png";
import chaptersImage from "../assets/images/AEIL/aeil-character-chapters.png";
import raceImage from "../assets/images/AEIL/aeil-character-entita.png";
import relationshipsImage from "../assets/images/AEIL/aeil-character-ships.png";
import quotesImage from "../assets/images/AEIL/aeil-character-motto.png";
import galleryImage from "../assets/images/AEIL/aeil-character-galery.png";
import videosImage from "../assets/images/AEIL/aeil-character-video.png";
import soundtrackImage from "../assets/images/AEIL/aeil-character-soundtrack.png";

import "./AEILcharacterpage.css";


/* =========================================================
   AEIL CHARACTER PAGE
========================================================= */

function AEILcharacterpage() {

  const {
    bookId,
    characterId,
  } = useParams();

  const navigate = useNavigate();


  /* =========================================================
     DATA
  ========================================================= */

  const [character, setCharacter] = useState(null);
  const [book, setBook] = useState(null);
  const [volumes, setVolumes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activePanel, setActivePanel] = useState("");
  const [isPortraitHovered, setIsPortraitHovered] = useState(false);


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
     VZTAHY
  ========================================================= */

  const uniqueRelationships = useMemo(() => {

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


  /* =========================================================
     STAV – LOADING
  ========================================================= */

  if (loading) {

    return (

      <main className="aeil-character-page">

        <div className="aeil-character-state">
          Načítám postavu...
        </div>

      </main>

    );

  }


  /* =========================================================
     STAV – CHYBA
  ========================================================= */

  if (error) {

    return (

      <main className="aeil-character-page">

        <div className="aeil-character-state aeil-character-error">
          {error}
        </div>

      </main>

    );

  }


  /* =========================================================
     STAV – NENALEZENO
  ========================================================= */

  if (!character) {

    return (

      <main className="aeil-character-page">

        <div className="aeil-character-state">
          Postava nebyla nalezena.
        </div>

      </main>

    );

  }


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <main
      className="aeil-character-page"
      style={{
        "--aeil-character-background":
          `url(${characterBackground})`,
      }}
    >


      {/* =====================================================
          HLAVNÍ OBSAH
      ===================================================== */}

      <div className="aeil-character-main">


        {/* ===================================================
            LEVÁ STRANA – PORTRÉT
        =================================================== */}

        <section className="aeil-character-portrait-column">

          <div
            className="aeil-character-portrait"
            onMouseEnter={() => setIsPortraitHovered(true)}
            onMouseLeave={() => setIsPortraitHovered(false)}
          >


            {/* HLAVNÍ OBRÁZEK */}

            {character.main_image && (

              <img
                src={character.main_image}
                alt={character.name}
                className="aeil-character-photo"
                style={{
                  opacity: isPortraitHovered ? 0 : 1,
                }}
              />

            )}


            {/* OBRÁZEK PO NAJETÍ */}

            {character.hover_image && (

              <img
                src={character.hover_image}
                alt=""
                className="aeil-character-photo-hover"
                style={{
                  opacity: isPortraitHovered ? 1 : 0,
                }}
              />

            )}


            {/* ZLATÝ RÁMEČEK */}

            <img
              src={characterFrame}
              alt=""
              className="aeil-character-portrait-frame"
              aria-hidden="true"
            />


            {/* JEMNÁ ZÁŘ */}

            <div
              className="aeil-character-portrait-glow"
              aria-hidden="true"
            />

          </div>

        </section>


        {/* ===================================================
            PRAVÁ STRANA
        =================================================== */}

        <section className="aeil-character-right">


          {/* =================================================
              JMÉNO
          ================================================= */}

          <header className="aeil-character-header">

            <h1>
              {character.name}
            </h1>


            <img
              src={aeilLine}
              alt=""
              className="aeil-character-line"
              aria-hidden="true"
            />

          </header>


          {/* =================================================
              POPIS
          ================================================= */}

          {character.content_html && (

            <section className="aeil-character-description">

              <div
                className="aeil-character-description-scroll"
                dangerouslySetInnerHTML={{
                  __html:
                    character.content_html,
                }}
              />

            </section>

          )}


          {/* =================================================
              DALŠÍ INFORMACE
          ================================================= */}

          <section className="aeil-character-information">

           

            <div className="aeil-character-information-line" />

            <div className="aeil-character-details">

              {character.race && (

                <div className="aeil-character-detail">

                  <span>
                    Rasa
                  </span>

                  <strong>
                    {character.race}
                  </strong>

                </div>

              )}


              {Array.isArray(character.details) &&
                character.details.map(
                  (detail, index) => (

                    <div
                      key={
                        detail.id ||
                        index
                      }
                      className="aeil-character-detail"
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


        </section>

      </div>


      {/* =====================================================
          PANELY
      ===================================================== */}

      <nav className="aeil-character-panels">


        {/* ===================================================
            KAPITOLY
        =================================================== */}

        <button
          type="button"
          className={`aeil-character-panel ${
            activePanel === "chapters"
              ? "active"
              : ""
          }`}
          onClick={() =>
            togglePanel("chapters")
          }
        >

          <span className="aeil-character-panel-image">

            <img
              src={chaptersImage}
              alt=""
            />

            <img
              src={infoFrame}
              alt=""
              className="aeil-character-panel-frame"
            />

          </span>

          <span className="aeil-character-panel-label">
            Kapitoly
          </span>

        </button>


        {/* ===================================================
            RASA
        =================================================== */}

        {character.race && (

          <button
            type="button"
            className={`aeil-character-panel ${
              activePanel === "race"
                ? "active"
                : ""
            }`}
            onClick={() =>
              togglePanel("race")
            }
          >

            <span className="aeil-character-panel-image">

              <img
                src={raceImage}
                alt=""
              />

              <img
                src={infoFrame}
                alt=""
                className="aeil-character-panel-frame"
              />

            </span>

            <span className="aeil-character-panel-label">
              Rasa
            </span>

          </button>

        )}


        {/* ===================================================
            VZTAHY
        =================================================== */}

        {uniqueRelationships.length > 0 && (

          <button
            type="button"
            className={`aeil-character-panel ${
              activePanel === "relationships"
                ? "active"
                : ""
            }`}
            onClick={() =>
              togglePanel("relationships")
            }
          >

            <span className="aeil-character-panel-image">

              <img
                src={relationshipsImage}
                alt=""
              />

              <img
                src={infoFrame}
                alt=""
                className="aeil-character-panel-frame"
              />

            </span>

            <span className="aeil-character-panel-label">
              Vztahy
            </span>

          </button>

        )}


        {/* ===================================================
            CITÁTY
        =================================================== */}

        {character.quotes?.length > 0 && (

          <button
            type="button"
            className={`aeil-character-panel ${
              activePanel === "quotes"
                ? "active"
                : ""
            }`}
            onClick={() =>
              togglePanel("quotes")
            }
          >

            <span className="aeil-character-panel-image">

              <img
                src={quotesImage}
                alt=""
              />

              <img
                src={infoFrame}
                alt=""
                className="aeil-character-panel-frame"
              />

            </span>

            <span className="aeil-character-panel-label">
              Citaty
            </span>

          </button>

        )}


        {/* ===================================================
            GALERIE
        =================================================== */}

        <button
          type="button"
          className="aeil-character-panel"
          onClick={() =>
            navigate(
              `/project/${bookId}/characters/${characterId}/gallery`
            )
          }
        >

          <span className="aeil-character-panel-image">

            <img
              src={galleryImage}
              alt=""
            />

            <img
              src={infoFrame}
              alt=""
              className="aeil-character-panel-frame"
            />

          </span>

          <span className="aeil-character-panel-label">
            Galerie
          </span>

        </button>


        {/* ===================================================
            VIDEA
        =================================================== */}

        <button
          type="button"
          className={`aeil-character-panel ${
            activePanel === "videos"
              ? "active"
              : ""
          }`}
          onClick={() =>
            togglePanel("videos")
          }
        >

            <span className="aeil-character-panel-image">

              <img
                src={videosImage}
                alt=""
              />

              <img
                src={infoFrame}
                alt=""
                className="aeil-character-panel-frame"
              />

            </span>

            <span className="aeil-character-panel-label">
              Videa
            </span>

          </button>


        {/* ===================================================
            SOUNDTRACK
        =================================================== */}

        <button
          type="button"
          className={`aeil-character-panel ${
            activePanel === "soundtrack"
              ? "active"
              : ""
          }`}
          onClick={() =>
            togglePanel("soundtrack")
          }
        >

            <span className="aeil-character-panel-image">

              <img
                src={soundtrackImage}
                alt=""
              />

              <img
                src={infoFrame}
                alt=""
                className="aeil-character-panel-frame"
              />

            </span>

            <span className="aeil-character-panel-label">
              Soundtrack
            </span>

          </button>

      </nav>


      {/* =====================================================
          OTEVŘENÝ OBSAH PANELU
      ===================================================== */}

      {activePanel && (

        <section className="aeil-character-panel-content">


          {/* =================================================
              KAPITOLY
          ================================================= */}

          {activePanel === "chapters" && (

            <div className="aeil-character-open-panel">

              

              <div className="aeil-character-chapters-list">

                {(character.volume_ids || []).map(
                  (volumeId) => {

                    const volume =
                      volumes.find(
                        (item) =>
                          Number(item.id) ===
                          Number(volumeId)
                      );

                    if (!volume) {
                      return null;
                    }

                    return (

                      <div
                        key={volume.id}
                        className="aeil-character-chapter-item"
                      >

                        <span>
                          {volume.number
                            ? `Díl ${volume.number}`
                            : "Díl"}
                        </span>

                        <strong>
                          {volume.title}
                        </strong>

                      </div>

                    );

                  }
                )}

              </div>

            </div>

          )}


          {/* =================================================
              RASA
          ================================================= */}

          {activePanel === "race" &&
            character.race && (

            <div className="aeil-character-open-panel">

              <h2>
                Rasa
              </h2>

              <p className="aeil-character-race">
                {character.race}
              </p>

            </div>

          )}


          {/* =================================================
              VZTAHY
          ================================================= */}

          {activePanel === "relationships" && (

            <div className="aeil-character-open-panel">

              

              <div className="aeil-character-relationships">

                {uniqueRelationships.map(
                  (relationship) => (

                    <button
                      key={
                        relationship.related_character_id
                      }
                      type="button"
                      onClick={() =>
                        navigate(
                          `/project/${bookId}/characters/${relationship.related_character_id}`
                        )
                      }
                      className="aeil-character-relationship"
                    >

                      {relationship.related_character_name}

                    </button>

                  )
                )}

              </div>

            </div>

          )}


          {/* =================================================
              CITÁTY
          ================================================= */}

          {activePanel === "quotes" && (

            <div className="aeil-character-open-panel">

             

              <div className="aeil-character-quotes">

                {character.quotes?.map(
                  (item, index) => (

                    <blockquote
                      key={
                        item.id ||
                        index
                      }
                    >

                      „{item.quote}“

                    </blockquote>

                  )
                )}

              </div>

            </div>

          )}


          {/* =================================================
              VIDEA
          ================================================= */}

          {activePanel === "videos" && (

            <div className="aeil-character-open-panel">

             

              {character.main_video ? (
                <video
                  src={character.main_video}
                  controls
                  playsInline
                  preload="metadata"
                  className="aeil-character-video"
                />
              ) : (
                <p className="aeil-character-panel-empty">
                  Video zatím není k dispozici.
                </p>
              )}

            </div>

          )}


          {/* =================================================
              SOUNDTRACK
          ================================================= */}

          {activePanel === "soundtrack" && (

            <div className="aeil-character-open-panel">

             

              {character.soundtrack ? (
                <audio
                  src={character.soundtrack}
                  controls
                  className="aeil-character-audio"
                />
              ) : (
                <p className="aeil-character-panel-empty">
                  Soundtrack zatím není k dispozici.
                </p>
              )}

            </div>

          )}

        </section>

      )}

    </main>

  );

}


export default AEILcharacterpage;

