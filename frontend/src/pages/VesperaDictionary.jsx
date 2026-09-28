import React, { useState } from "react";
import "./VesperaDictionary.css";
import dictionaryBackground
  from "../assets/images/Vespera/words/back.webp";
  
// ============================================================
// OBRÁZKY
// ============================================================

// Pokud máš obrázky ve složce:
// src/assets/images/Vespera/words/
// můžeš je importovat takto:
//
// import glvr9 from "../assets/images/Vespera/words/glvr9.jpg";
//
// Níže je zatím cesta přes /images/vespera/words/
// Uprav ji podle toho, kde máš Vespera obrázky uložené.

const wordImages = import.meta.glob(
  "../assets/images/Vespera/words/*",
  {
    eager: true,
    query: "?url",
    import: "default",
  }
);

const getWordImage = (filename) => {
  const path = `../assets/images/Vespera/words/${filename}`;
  return wordImages[path];
};

// ============================================================
// SLOVNÍK
// ============================================================

const dictionary = [
  {
    term: "R.U.N.A",
    classification: "PROJEKT",
    definition:
      "Р.У.Н.А — Restrukturalizace posílených národních armádních sil.",
    note: null,
  },
  {
    term: "Vespera",
    classification: "PROJEKT",
    definition:
      "Vládní projekt R.U.N.Y. zaměřený na vývoj supervojáků pomocí biologických a psychogenních úprav.",
    note: {
      text: "Vespera = večernice, soumrak",
    },
  },
  {
    term: "GLVR-9",
    classification: "SÉRUM",
    definition:
      "Sérum deváté generace, které aktivuje latentní schopnosti v lidském genomu s rizikem mentální dezintegrace. Vyvíjeno v rámci Sektoru Vespera.",
    note: {
      label: "FOTODOKUMENTACE",
      image: getWordImage("glvr9.webp"),
    },
  },
  {
    term: "T-REX7",
    classification: "VIRUS",
    definition:
      "Rekombinantní retrovirus vyvinutý v rámci projektu VESPERA.",
    note: null,
  },
  {
    term: "Vesperin",
    classification: "SUBJEKT",
    definition:
      "Supervoják — výsledný produkt Vespery, číslo subjektu (I, II, III…) - tetováno.",
    note: {
      label: "FOTODOKUMENTACE",
      image: getWordImage("001.webp"),
    },
  },
  {
    term: "Glaver",
    classification: "SUBJEKT",
    definition:
      "Mutant vzniklý vlivem séra GLVR-9. Agresivní a nestabilní forma.",
    note: {
      label: "FOTODOKUMENTACE",
      image: getWordImage("glaver.webp"),
    },
  },
  {
    term: "Elevant",
    classification: "SCHOPNOST",
    definition:
      "Povýšit, pozvednout — člověk, který probudil schopnosti, tedy vyšší forma člověka.",
    note: null,
  },
  {
    term: "Neuronexus",
    classification: "ANATOMIE",
    definition:
      "Část mozku produkující nexis.",
     note: {
      label: "FOTODOKUMENTACE",
      image: getWordImage("neuronexis.webp"),
    },
  },
  {
    term: "Neuro-rezonanční fenomén",
    classification: "PROCES",
    definition:
      "Změny neurovegetativní regulace u dospělých jedinců.",
    note: null,
    },
  {
    term: "Nexis",
    classification: "ENERGIE",
    definition:
      "Uzel sil — síla nebo energie, která pohání schopnosti.",
    note: null,
  },
  {
    term: "Nex",
    classification: "JEDNOTKA",
    definition:
      "Jednotka měření Nexis.",
    note: null,
  },
  {
    term: "Étincelle",
    classification: "NÁBOŽENSTVÍ",
    definition:
      "Jiskra — náboženský směr rozšířený ve Francii.",
    note: {
      label: "FOTODOKUMENTACE",
      image: getWordImage("jiskra.webp"),
    },
  },
  {
    term: "Konduktor (Nexcor)",
    classification: "ZAŘÍZENÍ",
    definition:
      "Zařízení určené k usměrnění nebo zmírnění Nexis.",
    note: {
      label: "FOTODOKUMENTACE",
      image: getWordImage("nexcor.webp"),
    },
  },
  {
    term: "Helion Array",
    classification: "ZAŘÍZENÍ",
    definition:
      "Elektrárna na alternativní palivo - Heliorit.",
    note: null,
  },
  {
    term: "Heliorit",
    classification: "MINERÁL",
    definition:
      "krystal obsahující izotop Xenonu-119R",
    note: {
      label: "FOTODOKUMENTACE",
      image: getWordImage("heliorit.webp"),
    },
  },
  {
    term: "Izolant",
    classification: "STATUS",
    definition:
      "Člen komunity Anglie ve stavu prověřování - dočasná izolace, dokud není potvrzeno, že nepředstavuje hrozbu.",
    note: null,
  },
  {
    term: "Glaverifikace",
    classification: "PROCES",
    definition:
      "Proces vzniku glavera, označovaný také jako „vyhoření“.",
    note: null,
  },
  {
    term: "Phase Residuals (PR).",
    classification: "PROCES",
    definition:
      "Sekundární biologickou odezvu organismu na expozici helioritu.",
     note: null,
  },
   {
    term: "NTX-Geny",
    classification: "ANATOMIE",
    definition:
      "Transkripčně tichá genová sekvence. Aktivací pomocí PR aktivita neuronexus a produkce nexis.",
     note: null,
  },


  // ==========================================================
  // SCHOPNOSTI
  // ==========================================================

  {
    term: "Intangibilita",
    classification: "SCHOPNOST",
    definition: "Znehmotnění, prostupnost.",
    note: {
      text: "Potvrzena, nositel Nikalay Yevgeniv",
    },
  },
  {
    term: "Vitalizace",
    classification: "SCHOPNOST",
    definition: "Léčení, regenerace.",
    note: {
      text: "Potvrzena, nositel neznámý",
    },
  },
  {
    term: "Ferumorfóza",
    classification: "SCHOPNOST",
    definition: "Změna těla v ocel.",
    note: {
      text: "Potvrzena, nositel neznámý",
    },
  },
  {
    term: "Detonace",
    classification: "SCHOPNOST",
    definition: "Výbuch.",
    note: {
      text: "Potvrzena, nositel Onyx Blackwood",
    },
  },
  {
    term: "Telepatie",
    classification: "SCHOPNOST",
    definition: "Čtení myšlenek.",
    note: {
      text: "Potvrzena, nositel Lavrentiy Ilyin",
    },
  },
  {
    term: "Lumomantie",
    classification: "SCHOPNOST",
    definition: "Ovládání světla a stínů.",
    note: {
      text: "Potvrzena, nositel Julian Eldridge",
    },
  },
  {
    term: "Fulminace",
    classification: "SCHOPNOST",
    definition: "Ovládání hromu a blesku.",
    note: {
      text: "Potvrzena, nositel Mathias Mikkelen",
    },
  },
  {
    term: "Cryomantie",
    classification: "SCHOPNOST",
    definition: "Ovládání ledu.",
    note: {
      text: "Nepotvrzena, nositel neznámý",
    },
  },
  {
    term: "Steloformace",
    classification: "SCHOPNOST",
    definition: "Ovládání kovu.",
    note: {
      text: "Nepotvrzena, nositel neznámý",
    },
  },
  {
    term: "Osteokineze",
    classification: "SCHOPNOST",
    definition: "Ovládání kostí.",
    note: {
      text: "Potvrzena, Nicolas Roux",
    },
  },
  {
    term: "Telekineze",
    classification: "SCHOPNOST",
    definition: "Ovládání předmětů.",
    note: {
      label: "FOTODOKUMENTACE",
      image: getWordImage("ava.webp"),
    },
  },
  {
    term: "Resonance",
    classification: "SCHOPNOST",
    definition: "Ovládání zvuku.",
    note: {
      label: "FOTODOKUMENTACE",
      image: getWordImage("em.webp"),
    },
  },
  {
    term: "Nullifikace",
    classification: "SCHOPNOST",
    definition: "Vypnutí schopností.",
   note: {
      text: "Nepotvrzena, nositel neznámý",
    },
  },
  {
    term: "Venturgie",
    classification: "SCHOPNOST",
    definition: "Ovládání větru.",
    note: {
      
      label: "FOTODOKUMENTACE",
      image: getWordImage("charlie.webp"),
    },
  },
  {
    term: "Ignice",
    classification: "SCHOPNOST",
    definition: "Ovládání ohně.",
    note: {
      label: "FOTODOKUMENTACE",
      image: getWordImage("xavi.webp"),
    },
  },
  {
    term: "Sanguis",
    classification: "SCHOPNOST",
    definition: "Ovládání krve.",
    note: {
      text: "Nepotvrzena, nositel neznámý",
    },
  },
  {
    term: "Anamorfie",
    classification: "SCHOPNOST",
    definition: "Kopírování schopností.",
    note: {
      text: "Nepotvrzena, nositel neznámý",
    },
  },
  {
    term: "Chronokineze",
    classification: "SCHOPNOST",
    definition: "Ovládání času.",
    note: {
      text: "Potvrzena, nositel Hope Midford",
    },
  },
  {
    term: "Echomantie",
    classification: "SCHOPNOST",
    definition: "Hlasové příkazy.",
    note: {
      label: "FOTODOKUMENTACE",
      image: getWordImage("will.webp"),
    },
  },
  {
    term: "Venogeneze",
    classification: "SCHOPNOST",
    definition: "Produkce jedu.",
    note: {
      text: "Nepotvrzena, nositel neznámý",
    },
  },
  {
    term: "Dimenzionace",
    classification: "SCHOPNOST",
    definition: "Otevírání portálů.",
    note: {
      
      label: "FOTODOKUMENTACE",
      image: getWordImage("jake.webp"),
    },
  },
];

// ============================================================
// ROZDĚLENÍ NA LISTY
// Obrázek má 10 řádků.
// ============================================================

const ROWS_PER_PAGE = 10;

const pages = [];

for (let i = 0; i < dictionary.length; i += ROWS_PER_PAGE) {
  pages.push(dictionary.slice(i, i + ROWS_PER_PAGE));
}

// ============================================================
// KOMPONENTA
// ============================================================

export default function VesperaDictionary() {
  const [openedImage, setOpenedImage] = useState(null);

  return (
    <div className="vespera-dictionary-page">
{/* ATMOSFÉRA – PRACH A SVĚTLO */}
<div className="dictionary-atmosphere" aria-hidden="true">
  <div className="dictionary-side-light" />

  <div className="dictionary-dust">
    {Array.from({ length: 45 }).map((_, index) => (
      <span
        key={index}
        className="dictionary-dust-particle"
        style={{
          "--dust-x": `${Math.random() * 100}%`,
          "--dust-y": `${Math.random() * 100}%`,
          "--dust-size": `${1 + Math.random() * 3}px`,
          "--dust-duration": `${8 + Math.random() * 14}s`,
          "--dust-delay": `${Math.random() * -18}s`,
          "--dust-drift": `${-40 + Math.random() * 80}px`,
        }}
      />
    ))}
  </div>
</div>
      {/* ZPĚT */}
      <button
        className="dictionary-back"
        onClick={() => window.history.back()}
        aria-label="Zpět"
      >
        ←
      </button>

      <div className="dictionary-scroll">

        {pages.map((page, pageIndex) => (
          <section
  className="dictionary-paper"
  key={pageIndex}
  style={{
    backgroundImage: `url(${dictionaryBackground})`
  }}
>

           
            {/* =================================================
                TABULKA
            ================================================= */}

            <div className="dictionary-table">



              {/* ŘÁDKY */}
              {page.map((item, index) => (
                <div
                  className="dictionary-row"
                  key={`${pageIndex}-${index}`}
                >

                  

                  <div className="dictionary-term">
                    {item.term}
                  </div>

                  <div className="dictionary-classification">
                    {item.classification}
                  </div>

                  <div className="dictionary-definition">
                    {item.definition}
                  </div>

                  <div className="dictionary-note">
                    {item.note && (
                      item.note.image ? (
                        <button
                          className="dictionary-note-button"
                          onClick={() =>
                            setOpenedImage(item.note.image)
                          }
                        >
                          {item.note.label}
                        </button>
                      ) : (
                        <span className="dictionary-note-text">
                          {item.note.text || item.note.label}
                        </span>
                      )
                    )}
                  </div>

                </div>
              ))}

            </div>

            {/* ČÍSLO STRÁNKY */}
            <div className="dictionary-page-number">
              VESPERA / ARCHIV / {String(pageIndex + 1).padStart(2, "0")}
            </div>

          </section>
        ))}

      </div>

      {/* =====================================================
          MODAL S OBRÁZKEM
      ===================================================== */}

      {openedImage && (
        <div
          className="dictionary-image-overlay"
          onClick={() => setOpenedImage(null)}
        >

          <div
            className="dictionary-image-window"
            onClick={(e) => e.stopPropagation()}
          >

            <button
              className="dictionary-image-close"
              onClick={() => setOpenedImage(null)}
              aria-label="Zavřít"
            >
              ×
            </button>

            <img
              src={openedImage}
              alt="Archivní záznam"
            />

          </div>

        </div>
      )}

    </div>
  );
}
