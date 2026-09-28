import { useRef, useState } from "react";
import { Link } from "react-router-dom";

import BackButton from "../components/BackButton";
import "./vespera-page.css";

/* =========================================================
   HLAVNÍ OBRÁZKY VESPERA
========================================================= */

import vesperaBase
    from "../assets/images/Vespera/vespera.webp";

import vesperaStart
    from "../assets/images/Vespera/vespera-start.webp";

import vesperaBack
    from "../assets/images/Vespera/vespera-back.webp";




/* =========================================================
   SEDM PANELŮ
========================================================= */

import charactersImage
    from "../assets/images/Vespera/vespera-characters.webp";

import chaptersImage
    from "../assets/images/Vespera/vespera-chapters.webp";

import soundtrackImage
    from "../assets/images/Vespera/vespera-soundtrack.webp";

import videoImage
    from "../assets/images/Vespera/vespera-video.webp";

import mapImage
    from "../assets/images/Vespera/vespera-map.webp";

import wordsImage
    from "../assets/images/Vespera/vespera-words.webp";

import documentsImage
    from "../assets/images/Vespera/vespera-documents.webp";


/* =========================================================
   KOVOVÝ RÁMEČEK
========================================================= */

import vesperaFrame
    from "../assets/frames/vespera-frame.png";


export default function VesperaPage() {

    /* =====================================================
       VIDEO
    ===================================================== */

    const [videoActive, setVideoActive] = useState(false);
    const videoRef = useRef(null);

    const startVideo = () => {
        setVideoActive(true);

        const video = videoRef.current;

        if (video) {
            video.currentTime = 0;
            video.play().catch(() => {});
        }
    };

    const stopVideo = () => {
        setVideoActive(false);

        const video = videoRef.current;

        if (video) {
            video.pause();
            video.currentTime = 0;
        }
    };


    return (
        <main
            className="vespera-page"
            style={{
                "--vespera-background-image": `url(${vesperaBack})`
            }}
        >

            {/* =================================================
                SVĚTLUŠKY
            ================================================= */}

            <div
                className="vespera-fireflies"
                aria-hidden="true"
            >
                {Array.from({ length: 46 }, (_, index) => (
                    <span
                        key={index}
                        className={`vespera-firefly fly-${String(index + 1).padStart(2, "0")}`}
                    />
                ))}
            </div>


            {/* =================================================
                HLAVNÍ OBSAH
            ================================================= */}

            <div className="vespera-content">

                {/* =================================================
                    ZPĚT
                ================================================= */}

                <button
  className="dictionary-back"
  onClick={() => window.history.back()}
  aria-label="Zpět"
>
  ←
</button>


                {/* =================================================
                    HERO
                ================================================= */}

                <section className="vespera-hero">


                    {/* =================================================
                        PRAVÁ ČÁST – ZÁKAZ VSTUPU / ZAČÍT ČÍST
                    ================================================= */}

                    <div className="vespera-read-area">

                        <Link
                            to="/books/vespera/chapters/1"
                            className="vespera-read-button"
                        >
                            <img
                                src={vesperaStart}
                                alt="Začít číst"
                                className="vespera-start-image"
                            />
                        </Link>

                    </div>

                </section>


                {/* =================================================
                    SEDM PANELŮ
                ================================================= */}

                <section className="vespera-panels">

                    {/* =================================================
                        POSTAVY
                    ================================================= */}

                    <Link
                        to="/project/3/characters"
                        className="vespera-panel-wrapper"
                    >
                        <div className="vespera-panel">
                            <img
                                src={charactersImage}
                                alt=""
                                className="vespera-panel-image"
                            />
                        </div>

                        <img
                            src={vesperaFrame}
                            alt=""
                            className="vespera-panel-frame"
                            aria-hidden="true"
                        />

                        <span className="vespera-panel-label">
                            POSTAVY
                        </span>
                    </Link>


                    {/* =================================================
                        KAPITOLY
                    ================================================= */}

                    <Link
                        to="/books/vespera/chapters"
                        className="vespera-panel-wrapper"
                    >
                        <div className="vespera-panel">
                            <img
                                src={chaptersImage}
                                alt=""
                                className="vespera-panel-image"
                            />
                        </div>

                        <img
                            src={vesperaFrame}
                            alt=""
                            className="vespera-panel-frame"
                            aria-hidden="true"
                        />

                        <span className="vespera-panel-label">
                            KAPITOLY
                        </span>
                    </Link>


                    {/* =================================================
                        SOUNDTRACK
                    ================================================= */}

                    <div className="vespera-panel-wrapper">
                        <div className="vespera-panel">
                            <img
                                src={soundtrackImage}
                                alt=""
                                className="vespera-panel-image"
                            />
                        </div>

                        <img
                            src={vesperaFrame}
                            alt=""
                            className="vespera-panel-frame"
                            aria-hidden="true"
                        />

                        <span className="vespera-panel-label">
                            SOUNDTRACK
                        </span>
                    </div>


                    {/* =================================================
                        VIDEA
                    ================================================= */}

                    <div className="vespera-panel-wrapper">
                        <div className="vespera-panel">
                            <img
                                src={videoImage}
                                alt=""
                                className="vespera-panel-image"
                            />
                        </div>

                        <img
                            src={vesperaFrame}
                            alt=""
                            className="vespera-panel-frame"
                            aria-hidden="true"
                        />

                        <span className="vespera-panel-label">
                            VIDEA
                        </span>
                    </div>


                    {/* =================================================
                        MAPA
                    ================================================= */}

                    <Link
                        to="/books/vespera/map"
                        className="vespera-panel-wrapper"
                    >
                        <div className="vespera-panel">
                            <img
                                src={mapImage}
                                alt=""
                                className="vespera-panel-image"
                            />
                        </div>

                        <img
                            src={vesperaFrame}
                            alt=""
                            className="vespera-panel-frame"
                            aria-hidden="true"
                        />

                        <span className="vespera-panel-label">
                            MAPA
                        </span>
                    </Link>


                    {/* =================================================
                        SLOVNÍK
                    ================================================= */}

                    <Link
                        to="/books/vespera/word"
                        className="vespera-panel-wrapper"
                    >
                        <div className="vespera-panel">
                            <img
                                src={wordsImage}
                                alt=""
                                className="vespera-panel-image"
                            />
                        </div>

                        <img
                            src={vesperaFrame}
                            alt=""
                            className="vespera-panel-frame"
                            aria-hidden="true"
                        />

                        <span className="vespera-panel-label">
                            SLOVNÍK
                        </span>
                    </Link>


                    {/* =================================================
                        DOKUMENTY
                    ================================================= */}

                    <Link
                        to="/books/vespera/documents"
                        className="vespera-panel-wrapper"
                    >
                        <div className="vespera-panel">
                            <img
                                src={documentsImage}
                                alt=""
                                className="vespera-panel-image"
                            />
                        </div>

                        <img
                            src={vesperaFrame}
                            alt=""
                            className="vespera-panel-frame"
                            aria-hidden="true"
                        />

                        <span className="vespera-panel-label">
                            DOKUMENTY
                        </span>
                    </Link>

                </section>

            </div>

        </main>
    );
}