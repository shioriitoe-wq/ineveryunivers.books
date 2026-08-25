import { useState } from "react";
import BackButton from "../components/BackButton";
import { Link } from "react-router-dom";
import "./aeil-page.css";

import aeilGif from "../assets/images/AEIL-gif.gif";
import aeilBase from "../assets/images/aeil.png";

import aeilLace from "../assets/images/aeil-lace.png";
import aeilText from "../assets/images/aeil-text.png";
import aeilLine from "../assets/images/aeil-line.png";

import charactersImage from "../assets/images/aeil-characters.png";
import chaptersImage from "../assets/images/aeil-chapters.png";
import videoImage from "../assets/images/aeil-video.png";
import soundtrackImage from "../assets/images/aeil-soundtrack.png";
import mapsImage from "../assets/images/aeil-maps.png";
import wordsImage from "../assets/images/aeil-words.png";

import startRead from "../assets/images/aeil-start-read.png";

import frameGold from "../assets/frames/frame-gold.png";
import frameSixPanels from "../assets/frames/frame-sixpanels.png";


export default function AeilPage() {

    const [gifActive, setGifActive] = useState(false);
    const [gifKey, setGifKey] = useState(0);


    const startGif = () => {

        setGifKey((previous) => previous + 1);

        setGifActive(true);

    };


    const stopGif = () => {

        setGifActive(false);

    };


    return (
        <main className="aeil-page">


            {/* =====================================================
                POZADÍ – KRAJKA
            ===================================================== */}

            <img
                src={aeilLace}
                alt=""
                className="aeil-lace"
                aria-hidden="true"
            />


            {/* =====================================================
                ZLATÉ JISKRY
            ===================================================== */}

            <div
                className="aeil-sparks aeil-sparks-one"
                aria-hidden="true"
            />

            <div
                className="aeil-sparks aeil-sparks-two"
                aria-hidden="true"
            />

            <div
                className="aeil-sparks aeil-sparks-three"
                aria-hidden="true"
            />


            {/* =====================================================
                ZPĚT
            ===================================================== */}

            <div className="aeil-back">

                <BackButton to="/books/aeil-series" />

            </div>


            {/* =====================================================
                HLAVNÍ HERO
            ===================================================== */}

            <section className="aeil-hero">


                {/* =================================================
                    HLAVNÍ KRUH
                ================================================= */}

                <div className="aeil-cover-area">

                    <div
                        className="aeil-cover-wrapper"
                        onMouseEnter={startGif}
                        onMouseLeave={stopGif}
                    >

                        <div className="aeil-cover-circle">


                            {/* =====================================
                                ZÁKLADNÍ OBRÁZEK
                            ===================================== */}

                            <img
                                src={aeilBase}
                                alt=""
                                className="aeil-cover-base"
                            />


                            {/* =====================================
                                GIF – POUZE PŘI HOVERU
                            ===================================== */}

                            {gifActive && (

                                <img
                                    key={gifKey}
                                    src={aeilGif}
                                    alt=""
                                    className="aeil-cover-gif"
                                />

                            )}

                        </div>


                        {/* =========================================
                            ZLATÝ RÁMEČEK
                        ========================================= */}

                        <img
                            src={frameGold}
                            alt=""
                            className="aeil-cover-frame"
                            aria-hidden="true"
                        />

                    </div>

                </div>


                {/* =================================================
                    PRAVÁ ČÁST
                ================================================= */}

                <div className="aeil-intro">


                    {/* =================================================
                        AEIL
                    ================================================= */}

                    <div className="aeil-title">

                        <img
                            src={aeilText}
                            alt="AEIL"
                            className="aeil-title-image"
                        />

                    </div>


                    {/* =================================================
                        LINKA
                    ================================================= */}

                    <div className="aeil-line-wrapper">

                        <img
                            src={aeilLine}
                            alt=""
                            className="aeil-line"
                            aria-hidden="true"
                        />

                    </div>


                    {/* =================================================
                        TEXT
                    ================================================= */}

                    <div className="aeil-description">

                        <p>
                            Ve světě, kde magie dýchá a stíny šeptají,
                        </p>

                        <p>
                            začíná příběh, který změní vše.
                        </p>

                        <p>
                            Prozkoumejte svět Aeilu, jeho bytosti,
                        </p>

                        <p>
                            pravidla i minulost.
                        </p>

                    </div>


                    {/* =================================================
                        ZAČÍT ČÍST
                    ================================================= */}

                    <Link
                        to="/books/aeil/chapters/1"
                        className="aeil-read-button"
                    >

                        <img
                            src={startRead}
                            alt=""
                            className="aeil-start-read"
                        />

                        <span className="aeil-start-read-text">
                            ZAČÍT ČÍST
                        </span>

                    </Link>


                </div>

            </section>


            {/* =====================================================
                SPODNÍCH ŠEST PANELŮ
            ===================================================== */}

            <section className="aeil-panels">


                {/* =================================================
                    POSTAVY
                ================================================= */}

                <Link
                    to="/project/1/volume/1/characters"
                    className="aeil-panel-wrapper"
                >

                    <div className="aeil-panel">

                        <img
                            src={charactersImage}
                            alt=""
                            className="aeil-panel-image"
                        />

                    </div>

                    <img
                        src={frameSixPanels}
                        alt=""
                        className="aeil-panel-frame"
                        aria-hidden="true"
                    />

                    <span className="aeil-panel-label">
                        POSTAVY
                    </span>

                </Link>


                {/* =================================================
                    KAPITOLY
                ================================================= */}

                <Link
                    to="/books/aeil/chapters"
                    className="aeil-panel-wrapper"
                >

                    <div className="aeil-panel">

                        <img
                            src={chaptersImage}
                            alt=""
                            className="aeil-panel-image"
                        />

                    </div>

                    <img
                        src={frameSixPanels}
                        alt=""
                        className="aeil-panel-frame"
                        aria-hidden="true"
                    />

                    <span className="aeil-panel-label">
                        KAPITOLY
                    </span>

                </Link>


                {/* =================================================
                    SOUNDTRACK
                ================================================= */}

                <div className="aeil-panel-wrapper">

                    <div className="aeil-panel">

                        <img
                            src={soundtrackImage}
                            alt=""
                            className="aeil-panel-image"
                        />

                    </div>

                    <img
                        src={frameSixPanels}
                        alt=""
                        className="aeil-panel-frame"
                        aria-hidden="true"
                    />

                    <span className="aeil-panel-label">
                        SOUNDTRACK
                    </span>

                </div>


                {/* =================================================
                    VIDEA
                ================================================= */}

                <div className="aeil-panel-wrapper">

                    <div className="aeil-panel">

                        <img
                            src={videoImage}
                            alt=""
                            className="aeil-panel-image"
                        />

                    </div>

                    <img
                        src={frameSixPanels}
                        alt=""
                        className="aeil-panel-frame"
                        aria-hidden="true"
                    />

                    <span className="aeil-panel-label">
                        VIDEA
                    </span>

                </div>


                {/* =================================================
                    MAPA
                ================================================= */}

                <div className="aeil-panel-wrapper">

                    <div className="aeil-panel">

                        <img
                            src={mapsImage}
                            alt=""
                            className="aeil-panel-image"
                        />

                    </div>

                    <img
                        src={frameSixPanels}
                        alt=""
                        className="aeil-panel-frame"
                        aria-hidden="true"
                    />

                    <span className="aeil-panel-label">
                        MAPA
                    </span>

                </div>


                {/* =================================================
                    SLOVNÍK
                ================================================= */}

                <div className="aeil-panel-wrapper">

                    <div className="aeil-panel">

                        <img
                            src={wordsImage}
                            alt=""
                            className="aeil-panel-image"
                        />

                    </div>

                    <img
                        src={frameSixPanels}
                        alt=""
                        className="aeil-panel-frame"
                        aria-hidden="true"
                    />

                    <span className="aeil-panel-label">
                        SLOVNÍK
                    </span>

                </div>


            </section>

        </main>
    );
}