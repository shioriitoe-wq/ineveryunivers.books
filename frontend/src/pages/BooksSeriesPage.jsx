import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getVolumes } from "../services/booksService";
import BackButton from "../components/BackButton";
import BookAccessGate from "../components/BookAccessGate";
import "./BooksSeriesPage.css";

import libraryLogo from "../assets/images/library-logo.png";

import panelLetem from "../assets/images/panels/panel-nezacalo-letem.png";
import panelNami from "../assets/images/panels/panel-nezacalo-nami.png";
import panelSpravne from "../assets/images/panels/panel-nezacalo-spravne.png";
import panelTady from "../assets/images/panels/panel-nezacalo-tady.png";
import panelTemnotou from "../assets/images/panels/panel-nezacalo-v-temnote.png";

import texture from "../assets/images/Nezacalo-to/texture.png";
import house from "../assets/images/Nezacalo-to/house.png";
import threeStars from "../assets/images/Nezacalo-to/threestars.png";
import motto from "../assets/images/Nezacalo-to/motto.png";

const VOLUME_PRESENTATION = {
  1: { title: "(Ne)začalo to létem", hover: "Tady začíná problém.", image: panelLetem, className: "panel-summer" },
  2: { title: "(Ne)začalo to správně", hover: "Odvážná volba.", image: panelSpravne, className: "panel-message" },
  3: { title: "(Ne)začalo to v temnotě", hover: "Nebojíš se tmy?", image: panelTemnotou, className: "panel-dream" },
  4: { title: "(Ne)začalo to tady", hover: "Co by se mohlo pokazit?", image: panelTady, className: "panel-story" },
  5: { title: "(Ne)začalo to naším příběhem", hover: "Dobrá volba. Asi.", image: panelNami, className: "panel-story-blue" },
};

function BooksSeriesPageContent() {
  const [volumes, setVolumes] = useState([]);
  const [loadingVolumes, setLoadingVolumes] = useState(true);
  const [volumesError, setVolumesError] = useState("");

  useEffect(() => {
    let active = true;
    getVolumes(1)
      .then((data) => {
        if (!active) return;
        setVolumes(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error("Nepodařilo se načíst veřejné svazky knihy.", error);
        if (active) {
          setVolumes([]);
          setVolumesError("Svazky se nepodařilo načíst.");
        }
      })
      .finally(() => {
        if (active) setLoadingVolumes(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <main
      className="books-series-page"
      style={{
        backgroundImage: `url(${texture})`,
      }}
    >

      {/* =========================================
          PAPÍROVÁ TEXTURA
          ========================================= */}

      <div className="paper-texture" aria-hidden="true" />


      {/* =========================================
          TŘPYTKY
          ========================================= */}

      <div className="series-sparkles" aria-hidden="true">

        <span className="sparkle tiny c-summer s1"></span>
        <span className="sparkle tiny c-message s2"></span>
        <span className="sparkle tiny c-dream s3"></span>
        <span className="sparkle tiny c-story s4"></span>
        <span className="sparkle tiny c-blue s5"></span>

        <span className="sparkle tiny c-summer s6"></span>
        <span className="sparkle tiny c-message s7"></span>
        <span className="sparkle tiny c-dream s8"></span>
        <span className="sparkle tiny c-story s9"></span>
        <span className="sparkle tiny c-blue s10"></span>

        <span className="sparkle tiny c-summer s11"></span>
        <span className="sparkle tiny c-message s12"></span>
        <span className="sparkle tiny c-dream s13"></span>
        <span className="sparkle tiny c-blue s14"></span>
        <span className="sparkle tiny c-story s15"></span>

        <span className="sparkle tiny c-summer s16"></span>
        <span className="sparkle tiny c-message s17"></span>
        <span className="sparkle tiny c-dream s18"></span>
        <span className="sparkle tiny c-blue s19"></span>
        <span className="sparkle tiny c-story s20"></span>


        <span className="sparkle medium c-summer s21"></span>
        <span className="sparkle medium c-message s22"></span>
        <span className="sparkle medium c-dream s23"></span>
        <span className="sparkle medium c-story s24"></span>
        <span className="sparkle medium c-blue s25"></span>

        <span className="sparkle medium c-summer s26"></span>
        <span className="sparkle medium c-message s27"></span>
        <span className="sparkle medium c-dream s28"></span>
        <span className="sparkle medium c-blue s29"></span>
        <span className="sparkle medium c-story s30"></span>

        <span className="sparkle medium c-summer s31"></span>
        <span className="sparkle medium c-message s32"></span>
        <span className="sparkle medium c-dream s33"></span>
        <span className="sparkle medium c-story s34"></span>
        <span className="sparkle medium c-blue s35"></span>


        <span className="sparkle large c-summer s36"></span>
        <span className="sparkle large c-message s37"></span>
        <span className="sparkle large c-dream s38"></span>
        <span className="sparkle large c-story s39"></span>
        <span className="sparkle large c-blue s40"></span>

      </div>


      {/* =========================================
          HLAVIČKA
          ========================================= */}

      <header className="series-header">

        <div className="series-top-row">

          <BackButton to="/books" />

          <div className="series-site-name">
            ineveryunivers.books
          </div>

        </div>


        <div className="series-logo-wrap">

          <img
            src={libraryLogo}
            alt=""
            className="series-logo"
          />

        </div>

      </header>


      {/* =========================================
          PANELY
          ========================================= */}

      <section className="series-panels">


        {/* DEKORACE */}

        <img
          src={house}
          alt=""
          className="series-house"
          aria-hidden="true"
        />

        <img
          src={threeStars}
          alt=""
          className="series-stars"
          aria-hidden="true"
        />

        <img
          src={motto}
          alt=""
          className="series-motto"
          aria-hidden="true"
        />


        {loadingVolumes ? (
          <div className="series-loading">Načítám svazky…</div>
        ) : volumesError ? (
          <div className="series-error">{volumesError}</div>
        ) : (
          volumes
            .slice()
            .sort((a, b) => Number(a.number || a.id) - Number(b.number || b.id))
            .map((volume) => {
              const number = Number(volume.number || volume.id);
              const presentation = VOLUME_PRESENTATION[number] || {};
              const title = presentation.title || volume.title || `Svazek ${number}`;
              const hover = presentation.hover || "Otevřít svazek.";
              const image = presentation.image || panelLetem;
              const className = presentation.className || "panel-summer";
              const to = number === 1
                ? "/books/nezacalo"
                : `/books/nezacalo/volume/${volume.id}`;

              return (
                <Link key={volume.id} to={to} className={`series-panel ${className}`}>
                  <img src={image} alt="" className="brush-panel" />
                  <span className="panel-text panel-text-normal">{title}</span>
                  <span className="panel-text panel-text-hover">{hover}</span>
                </Link>
              );
            })
        )}
      </section>


      {/* =========================================
          PATIČKA
          ========================================= */}

      <footer className="series-footer">

        <div className="series-footer-line"></div>

        <div className="series-footer-content">

          <span>
            Vyber si problém. Máme jich dost.
          </span>

          <span className="series-heart">
            ♡
          </span>

        </div>

      </footer>

    </main>
  );
}


export default function BooksSeriesPage() {
    return (
        <BookAccessGate bookId={1}>
            <BooksSeriesPageContent />
        </BookAccessGate>
    );
}
