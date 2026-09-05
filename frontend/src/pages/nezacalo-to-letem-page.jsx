import BackButton from "../components/BackButton";
import { Link } from "react-router-dom";
import "./nezacalo-to-letem-page.css";

import beachTexture from "../assets/images/Nezacalo-to/beach-texture.png";
import blueOrange from "../assets/images/Nezacalo-to/blue-orange.png";
import aquarel from "../assets/images/Nezacalo-to/aquarel.png";
import waves from "../assets/images/Nezacalo-to/waves.png";
import frameBlueOrange from "../assets/frames/frame-blue-orange.png";
import startRead from "../assets/images/Nezacalo-to/start-read.png";
import fourSeasons from "../assets/images/Nezacalo-to/four-seasons.png";
import charactersImage from "../assets/images/Nezacalo-to/charakters.png";
import chaptersImage from "../assets/images/Nezacalo-to/chapters.png";
import photoImage from "../assets/images/Nezacalo-to/photo.png";
import musicImage from "../assets/images/Nezacalo-to/music.png";

export default function NezacaloToLetemPage() {
    return (
        <main className="summer-page">

            {/* =====================================================
                POZADÍ – BEACH TEXTURE
            ===================================================== */}

            <img
                src={beachTexture}
                alt=""
                className="summer-beach-texture"
                aria-hidden="true"
            />


            {/* =====================================================
                BLUE / ORANGE AKVAREL
            ===================================================== */}

            <img
                src={blueOrange}
                alt=""
                className="summer-blue-orange"
                aria-hidden="true"
            />

            <img
                src={aquarel}
                alt=""
                className="summer-aquarel"
                aria-hidden="true"
            />

            <img
                src={waves}
                alt=""
                className="summer-waves"
                aria-hidden="true"
            />


            {/* =====================================================
                ZPĚT
            ===================================================== */}

            <div className="summer-back">

                <BackButton to="/books/nezacalo-series" />

            </div>


            {/* =====================================================
                HLAVNÍ HERO
            ===================================================== */}

            <section className="summer-hero">


                {/* =================================================
                    LEVÁ ČÁST – OBAL KNIHY
                ================================================= */}

                <div className="summer-cover-area">

                    <div className="summer-cover-wrapper">

                        <div className="summer-cover-circle">

                            <img
                                src={fourSeasons}
                                alt=""
                                className="summer-four-seasons"
                            />

                        </div>


                        <img
                            src={frameBlueOrange}
                            alt=""
                            className="summer-cover-frame"
                            aria-hidden="true"
                        />

                    </div>

                </div>


                {/* =================================================
                    PRAVÁ ČÁST – TEXT
                ================================================= */}

                <div className="summer-intro">

                    <h1>
                        (NE)ZAČALO TO LÉTEM
                    </h1>

                    <div className="summer-divider"></div>


                    {/* =================================================
                        ČTYŘI ŘÁDKY POD SEBOU
                    ================================================= */}

                    <div className="summer-description">

                        <p>Léto je pro začátky.</p>
                        <p>Podzim pro otázky.</p>
                        <p>Zima pro pravdu.</p>
                        <p>A jaro pro rozhodnutí.</p>

                    </div>


                    {/* =================================================
                        ZAČÍT ČÍST – PRVNÍ KAPITOLA
                    ================================================= */}

                    <Link
                        to="/books/nezacalo/chapters/1"
                        className="summer-read-button"
                    >

                        <img
                            src={startRead}
                            alt=""
                            className="summer-start-read"
                        />

                        <span className="summer-start-read-text">
                            ZAČÍT ČÍST
                        </span>

                    </Link>

                </div>

            </section>


            {/* =====================================================
                SPODNÍ ČTYŘI PANELY
            ===================================================== */}

            <section className="summer-panels">


                {/* =================================================
                    POSTAVY
                ================================================= */}

                <Link
                    to="/project/1/volume/1/characters"
                    className="summer-panel-wrapper"
                >

                    <div className="summer-panel">

                        <img
                            src={charactersImage}
                            alt=""
                            className="summer-panel-image"
                        />

                    </div>


                    <img
                        src={frameBlueOrange}
                        alt=""
                        className="summer-panel-frame"
                        aria-hidden="true"
                    />


                    <span className="summer-panel-label">
                        POSTAVY
                    </span>

                </Link>


                {/* =================================================
                    KAPITOLY
                ================================================= */}

                <Link
                    to="/books/nezacalo/chapters"
                    className="summer-panel-wrapper"
                >

                    <div className="summer-panel">

                        <img
                            src={chaptersImage}
                            alt=""
                            className="summer-panel-image"
                        />

                    </div>


                    <img
                        src={frameBlueOrange}
                        alt=""
                        className="summer-panel-frame"
                        aria-hidden="true"
                    />


                    <span className="summer-panel-label">
                        KAPITOLY
                    </span>

                </Link>


                {/* =================================================
                    VIDEA
                ================================================= */}

                <div className="summer-panel-wrapper">

                    <div className="summer-panel">

                        <img
                            src={photoImage}
                            alt=""
                            className="summer-panel-image"
                        />

                    </div>


                    <img
                        src={frameBlueOrange}
                        alt=""
                        className="summer-panel-frame"
                        aria-hidden="true"
                    />


                    <span className="summer-panel-label">
                        VIDEA
                    </span>

                </div>


                {/* =================================================
                    SOUNDTRACK
                ================================================= */}

                <div className="summer-panel-wrapper">

                    <div className="summer-panel">

                        <img
                            src={musicImage}
                            alt=""
                            className="summer-panel-image"
                        />

                    </div>


                    <img
                        src={frameBlueOrange}
                        alt=""
                        className="summer-panel-frame"
                        aria-hidden="true"
                    />


                    <span className="summer-panel-label">
                        SOUNDTRACK
                    </span>

                </div>

            </section>

        </main>
    );
}

