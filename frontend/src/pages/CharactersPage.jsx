import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  getCharacters,
} from "../services/charactersService";

import {
  getBook,
  getVolumes,
} from "../services/booksService";

import BackButton from "../components/BackButton";

import frameBlueOrange from "../assets/frames/frame-blue-orange.png";
import libraryLogo from "../assets/images/library-logo.png";

import "./CharactersPage.css";


function CharactersPage() {

  const {
    bookId,
    volumeId,
  } = useParams();


  const [book, setBook] = useState(null);
  const [volume, setVolume] = useState(null);
  const [characters, setCharacters] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  /* =====================================================
     NAČTENÍ DAT
  ===================================================== */

  useEffect(() => {

    async function loadData() {

      setLoading(true);
      setError("");

      try {

        const [
          loadedBook,
          loadedCharacters,
          loadedVolumes,
        ] = await Promise.all([

          getBook(bookId),

          getCharacters(bookId),

          getVolumes(bookId),

        ]);


        setBook(loadedBook);


        /* =================================================
           KONKRÉTNÍ DÍL
        ================================================= */

        const selectedVolume =
          loadedVolumes.find(
            (item) =>
              Number(item.id) ===
              Number(volumeId)
          ) || null;


        setVolume(selectedVolume);


        /* =================================================
           POSTAVY PŘIŘAZENÉ K TOMUTO DÍLU
        ================================================= */

        const filteredCharacters =
          loadedCharacters.filter(
            (character) => {

              const ids =
                Array.isArray(
                  character.volume_ids
                )
                  ? character.volume_ids
                  : [];


              return ids.some(
                (id) =>
                  Number(id) ===
                  Number(volumeId)
              );

            }
          );


        setCharacters(
          filteredCharacters
        );


      } catch (error) {

        console.error(
          "CharactersPage:",
          error
        );

        setError(
          error?.message ||
          "Nepodařilo se načíst postavy."
        );

      } finally {

        setLoading(false);

      }

    }


    if (bookId && volumeId) {

      loadData();

    }

  }, [
    bookId,
    volumeId,
  ]);


  /* =====================================================
     SEŘAZENÍ POSTAV
  ===================================================== */

  const sortedCharacters =
    useMemo(() => {

      return [
        ...characters,
      ].sort(
        (a, b) =>
          Number(a.sort_order || 0) -
          Number(b.sort_order || 0)
      );

    }, [
      characters,
    ]);


  /* =====================================================
     NAČÍTÁNÍ
  ===================================================== */

  if (loading) {

    return (

      <main className="characters-page">

        <div
          className="characters-background"
          aria-hidden="true"
        />

        <div className="characters-page-back">

          <BackButton
            to="/books/nezacalo"
          />

        </div>

        <div className="characters-page-logo">

          <img
            src={libraryLogo}
            alt="ineveryunivers.books"
          />

        </div>

        <div className="characters-page-state">

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

      <main className="characters-page">

        <div
          className="characters-background"
          aria-hidden="true"
        />

        <div className="characters-page-back">

          <BackButton
            to="/books/nezacalo"
          />

        </div>

        <div className="characters-page-logo">

          <img
            src={libraryLogo}
            alt="ineveryunivers.books"
          />

        </div>

        <div className="characters-page-state characters-page-error">

          {error}

        </div>

      </main>

    );

  }


  /* =====================================================
     KNIHA NENALEZENA
  ===================================================== */

  if (!book) {

    return (

      <main className="characters-page">

        <div
          className="characters-background"
          aria-hidden="true"
        />

        <div className="characters-page-back">

          <BackButton
            to="/books/nezacalo"
          />

        </div>

        <div className="characters-page-logo">

          <img
            src={libraryLogo}
            alt="ineveryunivers.books"
          />

        </div>

        <div className="characters-page-state">

          Kniha nebyla nalezena.

        </div>

      </main>

    );

  }


  /* =====================================================
     HLAVNÍ STRÁNKA
  ===================================================== */

  return (

    <main className="characters-page">


      {/* =================================================
          POZADÍ
      ================================================= */}

      <div
        className="characters-background"
        aria-hidden="true"
      />


      {/* =================================================
          ZPĚT
      ================================================= */}

      <div className="characters-page-back">

        <BackButton
          to="/books/nezacalo"
        />

      </div>


      {/* =================================================
          LOGO S VÁŽKOU
      ================================================= */}

      <div className="characters-page-logo">

        <img
          src={libraryLogo}
          alt="ineveryunivers.books"
        />

      </div>


      {/* =================================================
          OBSAH
      ================================================= */}

      <section className="characters-content">


        {/* =================================================
            NADPIS
        ================================================= */}

        <header className="characters-header">

          <h1>
            {volume?.title || "(Ne)začalo to létem"}
          </h1>

        </header>


        {/* =================================================
            POSTAVY
        ================================================= */}

        {sortedCharacters.length === 0 ? (

          <div className="characters-empty">

            V tomto dílu zatím nejsou
            přiřazeny žádné postavy.

          </div>

        ) : (

          <div className="characters-grid">

            {sortedCharacters.map(
              (character) => (

                <Link
                  key={character.id}
                  to={`/project/${bookId}/characters/${character.id}`}
                  className="character-card"
                >


                  {/* ======================================
                      KOLEČKO + RÁMEČEK
                  ====================================== */}

                  <div className="character-card-circle">


                    {/* ==================================
                        FOTOGRAFIE
                    ================================== */}

                    <div className="character-card-photo">

                      {character.main_image ? (

                        <img
                          src={character.main_image}
                          alt={character.name}
                        />

                      ) : (

                        <div className="character-card-no-image">

                          {character.name}

                        </div>

                      )}

                    </div>


                    {/* ==================================
                        RÁMEČEK
                    ================================== */}

                    <img
                      src={frameBlueOrange}
                      alt=""
                      className="character-card-frame"
                      aria-hidden="true"
                    />

                  </div>


                  {/* ======================================
                      JMÉNO
                  ====================================== */}

                  <div className="character-card-info">

                    <h2>
                      {character.name}
                    </h2>

                  </div>


                </Link>

              )
            )}

          </div>

        )}

      </section>

    </main>

  );

}


export default CharactersPage;