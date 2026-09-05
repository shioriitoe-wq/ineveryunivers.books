import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getBooks } from "../services/booksService";
import { getCharacters } from "../services/charactersService";

import "./AEILcharactersPage.css";

import characterFrame from "../assets/frames/aeil-character-info.png";
import aeilLine from "../assets/images/AEIL/aeil-line.png";
import aeilText from "../assets/images/AEIL/aeil-text.png";
import aeilBackground from "../assets/images/AEIL/aeil-lace.png";


function AEILcharactersPage() {

  const navigate = useNavigate();

  const [characters, setCharacters] = useState([]);
  const [aeilBookId, setAeilBookId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {

    let cancelled = false;


    async function loadCharacters() {

      setLoading(true);
      setError("");


      try {

        /* =====================================================
           NAČTENÍ KNIHY AEIL
        ===================================================== */

        const books = await getBooks();

        if (cancelled) {
          return;
        }


        const aeilBook = Array.isArray(books)
          ? books.find(
              (book) =>
                String(book.title || "")
                  .trim()
                  .toLowerCase() === "aeil"
            )
          : null;


        if (
          !aeilBook ||
          aeilBook.id === undefined ||
          aeilBook.id === null
        ) {
          throw new Error(
            "Nepodařilo se najít knihu AEIL."
          );
        }


        setAeilBookId(aeilBook.id);


        /* =====================================================
           NAČTENÍ POSTAV AEIL
        ===================================================== */

        const data = await getCharacters(
          aeilBook.id
        );


        if (cancelled) {
          return;
        }


        setCharacters(
          Array.isArray(data)
            ? data
            : []
        );


      } catch (err) {

        if (cancelled) {
          return;
        }


        console.error(err);


        setError(
          err?.message ||
          "Nepodařilo se načíst postavy."
        );


      } finally {

        if (!cancelled) {
          setLoading(false);
        }

      }

    }


    loadCharacters();


    return () => {
      cancelled = true;
    };

  }, []);


  /* =====================================================
     OTEVŘENÍ DETAILU POSTAVY
  ===================================================== */

  function openCharacter(characterId) {

    if (
      aeilBookId === undefined ||
      aeilBookId === null
    ) {
      return;
    }


    navigate(
      `/project/${aeilBookId}/characters/${characterId}`
    );

  }


  /* =====================================================
     NAČÍTÁNÍ
  ===================================================== */

  if (loading) {

    return (

      <main
        className="aeil-characters-page"
        style={{
          "--aeil-characters-background":
            `url(${aeilBackground})`,
        }}
      >

        <div className="aeil-characters-state">
          Načítám postavy...
        </div>

      </main>

    );

  }


  /* =====================================================
     CHYBA
  ===================================================== */

  if (error) {

    return (

      <main
        className="aeil-characters-page"
        style={{
          "--aeil-characters-background":
            `url(${aeilBackground})`,
        }}
      >

        <div className="aeil-characters-state aeil-characters-error">
          {error}
        </div>

      </main>

    );

  }


  return (

    <main
      className="aeil-characters-page"
      style={{
        "--aeil-characters-background":
          `url(${aeilBackground})`,
      }}
    >

      {/* =====================================================
          HLAVIČKA
      ===================================================== */}

      <header className="aeil-characters-header">

        <img
          src={aeilText}
          alt="AEIL"
          className="aeil-characters-logo"
        />


        <img
          src={aeilLine}
          alt=""
          className="aeil-characters-line"
        />

      </header>


      {/* =====================================================
          POSTAVY
      ===================================================== */}

      <section className="aeil-characters-grid">

        {characters.length === 0 ? (

          <div className="aeil-characters-empty">
            Zatím zde nejsou žádné postavy.
          </div>

        ) : (

          characters.map(
            (character) => (

              <button
                key={character.id}
                type="button"
                className="aeil-character-card"
                onClick={() =>
                  openCharacter(
                    character.id
                  )
                }
              >

                <span className="aeil-character-card-circle">

                  {/* HLAVNÍ OBRÁZEK */}

                  {character.main_image ? (

                    <img
                      src={character.main_image}
                      alt={character.name}
                      className="aeil-character-card-photo"
                    />

                  ) : (

                    <span className="aeil-character-card-empty">
                      ?
                    </span>

                  )}


                  {/* HOVER OBRÁZEK */}

                  {character.hover_image && (

                    <img
                      src={character.hover_image}
                      alt=""
                      className="aeil-character-card-photo-hover"
                    />

                  )}


                  {/* ZLATÝ RÁMEČEK */}

                  <img
                    src={characterFrame}
                    alt=""
                    className="aeil-character-card-frame"
                  />

                </span>


                {/* JMÉNO */}

                <span className="aeil-character-card-name">
                  {character.name}
                </span>

              </button>

            )

          )

        )}

      </section>

    </main>

  );

}


export default AEILcharactersPage;

