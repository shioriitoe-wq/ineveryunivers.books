import { Link } from "react-router-dom";
import BackButton from "../components/BackButton";
import "./BooksSeriesPage.css";

import libraryLogo from "../assets/images/library-logo.png";

import panelLetem from "../assets/images/panels/panel-nezacalo-letem.png";
import panelNami from "../assets/images/panels/panel-nezacalo-nami.png";
import panelSpravne from "../assets/images/panels/panel-nezacalo-spravne.png";
import panelTady from "../assets/images/panels/panel-nezacalo-tady.png";
import panelTemnotou from "../assets/images/panels/panel-nezacalo-v-temnote.png";

import texture from "../assets/images/texture.png";
import house from "../assets/images/house.png";
import threeStars from "../assets/images/threestars.png";
import motto from "../assets/images/motto.png";

export default function BooksSeriesPage() {
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


        {/* =========================================
            1. DÍL — LÉTO
            ========================================= */}

        <Link
          to="/books/nezacalo"
          className="series-panel panel-summer"
        >

          <img
            src={panelLetem}
            alt=""
            className="brush-panel"
          />

          <span className="panel-text panel-text-normal">
            (Ne)začalo to létem
          </span>

          <span className="panel-text panel-text-hover">
            Tady začíná problém.
          </span>

        </Link>


        {/* =========================================
            2. DÍL — SPRÁVNĚ
            ========================================= */}

        <Link
          to="/books/nezacalo/volume/2"
          className="series-panel panel-message"
        >

          <img
            src={panelSpravne}
            alt=""
            className="brush-panel"
          />

          <span className="panel-text panel-text-normal">
            (Ne)začalo to správně
          </span>

          <span className="panel-text panel-text-hover">
            Odvážná volba.
          </span>

        </Link>


        {/* =========================================
            3. DÍL — V TEMNOTĚ
            ========================================= */}

        <Link
          to="/books/nezacalo/volume/3"
          className="series-panel panel-dream"
        >

          <img
            src={panelTemnotou}
            alt=""
            className="brush-panel"
          />

          <span className="panel-text panel-text-normal">
            (Ne)začalo to v temnotě
          </span>

          <span className="panel-text panel-text-hover">
            Nebojíš se tmy?
          </span>

        </Link>


        {/* =========================================
            4. DÍL — TADY
            ========================================= */}

        <Link
          to="/books/nezacalo/volume/4"
          className="series-panel panel-story"
        >

          <img
            src={panelTady}
            alt=""
            className="brush-panel"
          />

          <span className="panel-text panel-text-normal">
            (Ne)začalo to tady
          </span>

          <span className="panel-text panel-text-hover">
            Co by se mohlo pokazit?
          </span>

        </Link>


        {/* =========================================
            5. DÍL — NAŠÍM PŘÍBĚHEM
            ========================================= */}

        <Link
          to="/books/nezacalo/volume/5"
          className="series-panel panel-story-blue"
        >

          <img
            src={panelNami}
            alt=""
            className="brush-panel"
          />

          <span className="panel-text panel-text-normal">
            (Ne)začalo to naším příběhem
          </span>

          <span className="panel-text panel-text-hover">
            Dobrá volba. Asi.
          </span>

        </Link>

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