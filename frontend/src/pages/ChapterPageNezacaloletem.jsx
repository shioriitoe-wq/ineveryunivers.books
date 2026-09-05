import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
    getChapters,
    getParts,
} from "../services/booksService";

import "./ChapterPageNezacaloletem.css";

import libraryLogo from "../assets/images/library-logo.png";

import hotdog from "../assets/images/Nezacalo-to/hotdog.png";
import pumpkin from "../assets/images/Nezacalo-to/pumpkin.png";
import ice from "../assets/images/Nezacalo-to/ice.png";
import pills from "../assets/images/Nezacalo-to/pills.png";
import moto from "../assets/images/Nezacalo-to/moto.png";
import matcha from "../assets/images/Nezacalo-to/matcha.png";

const BOOK_ID = 1;

const ALLOWED_THEMES = [
    "summer",
    "autumn",
    "winter",
    "spring",
];

export default function ChapterPageNezacaloletem() {

    const { chapterId } = useParams();
    const navigate = useNavigate();

    const [chapter, setChapter] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [parts, setParts] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    useEffect(() => {

        async function loadChapter() {

            try {

                setLoading(true);
                setError("");

                const [chapterData, partsData] =
                    await Promise.all([
                        getChapters(BOOK_ID),
                        getParts(BOOK_ID),
                    ]);

                setChapters(chapterData);
                setParts(partsData);

                const foundChapter =
                    chapterData.find(
                        (item) =>
                            Number(item.id) ===
                            Number(chapterId)
                    );

                if (!foundChapter) {

                    setError(
                        "Kapitola nebyla nalezena."
                    );

                    setChapter(null);

                    return;
                }

                setChapter(foundChapter);

            } catch (err) {

                console.error(err);

                setError(
                    err.message ||
                    "Nepodařilo se načíst kapitolu."
                );

            } finally {

                setLoading(false);

            }

        }

        loadChapter();

    }, [chapterId]);


    if (loading) {

        return (
            <main className="chapter-page chapter-summer">

                <div className="chapter-loading">
                    Načítám kapitolu…
                </div>

            </main>
        );

    }


    if (error || !chapter) {

        return (
            <main className="chapter-page chapter-summer">

                <div className="chapter-error">

                    <h1>
                        {error ||
                            "Kapitola nebyla nalezena."}
                    </h1>

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/books/nezacalo/chapters"
                            )
                        }
                    >
                        ← Zpět na kapitoly
                    </button>

                </div>

            </main>
        );

    }


    /* =========================================================
       ČÁST, KE KTERÉ KAPITOLA PATŘÍ
    ========================================================= */

    const foundPart = parts.find(
        (part) =>
            Number(part.id) ===
            Number(chapter.part_id)
    );


    /* =========================================================
       DESIGN ČÁSTI
    ========================================================= */

    const partTheme =
        foundPart &&
        ALLOWED_THEMES.includes(foundPart.theme)
            ? foundPart.theme
            : "summer";


    /* =========================================================
       PŘEDCHOZÍ / DALŠÍ KAPITOLA
    ========================================================= */

    const currentIndex =
        chapters.findIndex(
            (item) =>
                Number(item.id) ===
                Number(chapterId)
        );


    const previousChapter =
        currentIndex > 0
            ? chapters[currentIndex - 1]
            : null;


    const nextChapter =
        currentIndex >= 0 &&
        currentIndex < chapters.length - 1
            ? chapters[currentIndex + 1]
            : null;


    /* =========================================================
       DEKORACE PODLE DESIGNU
    ========================================================= */

    const renderDecoration = () => {

        /* =====================================================
           LÉTO
           VOZÍK VLEVO DOLE
        ===================================================== */

        if (partTheme === "summer") {

            return (
                <img
                    src={hotdog}
                    alt=""
                    className="chapter-decoration-summer"
                    aria-hidden="true"
                />
            );

        }


        /* =====================================================
           PODZIM
           DÝNĚ VPRAVO DOLE
        ===================================================== */

        if (partTheme === "autumn") {

            return (
                <img
                    src={pumpkin}
                    alt=""
                    className="chapter-decoration-autumn"
                    aria-hidden="true"
                />
            );

        }


        /* =====================================================
           ZIMA
           MATCHA VLEVO DOLE
           ICE VPRAVO DOLE
        ===================================================== */

        if (partTheme === "winter") {

            return (
                <>
                    <img
                        src={matcha}
                        alt=""
                        className="chapter-decoration-winter-matcha"
                        aria-hidden="true"
                    />

                    <img
                        src={ice}
                        alt=""
                        className="chapter-decoration-winter"
                        aria-hidden="true"
                    />
                </>
            );

        }


        /* =====================================================
           JARO
           MOTORKA VLEVO DOLE
           PILULKY VPRAVO DOLE
        ===================================================== */

        if (partTheme === "spring") {

            return (
                <>
                    <img
                        src={moto}
                        alt=""
                        className="chapter-decoration-spring-moto"
                        aria-hidden="true"
                    />

                    <img
                        src={pills}
                        alt=""
                        className="chapter-decoration-spring-pills"
                        aria-hidden="true"
                    />
                </>
            );

        }


        return null;

    };


    return (

        <main
            className={`chapter-page chapter-${partTheme}`}
        >

            {/* =========================================
                DEKORACE PODLE DESIGNU ČÁSTI
            ========================================= */}

            {renderDecoration()}


            {/* =========================================
                HLAVIČKA
            ========================================= */}

            <header className="chapter-header">

                <img
                    src={libraryLogo}
                    alt=""
                    className="chapter-library-logo"
                    aria-hidden="true"
                />

                <button
                    type="button"
                    className="chapter-back"
                    onClick={() =>
                        navigate(
                            "/books/nezacalo/chapters"
                        )
                    }
                >
                    ← ZPĚT NA KAPITOLY
                </button>

            </header>


            {/* =========================================
                OBSAH KAPITOLY
            ========================================= */}

            <article className="chapter-content">

                <h1>
                    {chapter.title}
                </h1>


                {/* =====================================
                    SKUTEČNÝ TEXT Z EDITORU
                ===================================== */}

                <div
                    className="chapter-text"
                    dangerouslySetInnerHTML={{
                        __html:
                            chapter.content_html ||
                            "<p>Kapitola zatím nemá žádný text.</p>",
                    }}
                />

            </article>


            {/* =========================================
                SPODNÍ PANELY
            ========================================= */}

            <div className="chapter-tools">

                <button
                    type="button"
                    onClick={() =>
                        navigate("/books/nezacalo")
                    }
                >
                    KNIHA
                </button>

                <button
                    type="button"
                    onClick={() =>
                        navigate(
                            "/project/1/volume/1/characters"
                        )
                    }
                >
                    POSTAVY
                </button>

                <button
                    type="button"
                    onClick={() =>
                        navigate(
                            "/books/nezacalo/videos"
                        )
                    }
                >
                    VIDEA
                </button>

                <button
                    type="button"
                    onClick={() =>
                        navigate(
                            "/books/nezacalo/soundtracks"
                        )
                    }
                >
                    SOUNDTRACK
                </button>

            </div>


            {/* =========================================
                PŘEDCHOZÍ / DALŠÍ DÍL
            ========================================= */}

            <nav className="chapter-navigation">

                {previousChapter ? (

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                `/books/nezacalo/chapters/${previousChapter.id}`
                            )
                        }
                    >
                        ← PŘEDCHOZÍ DÍL
                    </button>

                ) : (

                    <span></span>

                )}


                {nextChapter ? (

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                `/books/nezacalo/chapters/${nextChapter.id}`
                            )
                        }
                    >
                        DALŠÍ DÍL →
                    </button>

                ) : (

                    <span></span>

                )}

            </nav>

        </main>
    );
}
