import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getChapters } from "../services/booksService";
import { getChapterNarrator } from "../services/aeilService";

import aeilLace from "../assets/images/AEIL/aeil-lace.png";
import libraryLogo from "../assets/images/library-logo.png";

import "./AEILChapterPage.css";

const BOOK_ID = 2;

/* =========================================================
   AEIL – POZADÍ KAPITOL
========================================================= */

/*
 * Pozadí kapitol se načítají automaticky ze složky
 * src/assets/images/AEIL/backchapters.
 * Databáze ukládá stabilní zdrojovou cestu, zatímco Vite
 * při buildu vytvoří skutečnou URL obrázku.
 * Díky import.meta.glob není potřeba při přidání nového
 * obrázku upravovat tento soubor.
 */
const chapterBackgroundModules = import.meta.glob(
    "../assets/images/AEIL/backchapters/*.{png,jpg,jpeg,webp,avif,gif}",
    {
        eager: true,
        query: "?url",
        import: "default",
    }
);

const chapterBackgroundOptions = Object.entries(
    chapterBackgroundModules
).map(([sourcePath, url]) => {
    const fileName = sourcePath.split("/").pop() || sourcePath;
    const databasePath =
        `/src/assets/images/AEIL/backchapters/${fileName}`;

    return {
        sourcePath,
        databasePath,
        url,
    };
});

function resolveChapterBackground(value) {
    if (!value) return "";

    const normalizedValue = String(value)
        .replace(/\\/g, "/")
        .replace(/^\/+/, "");

    const match = chapterBackgroundOptions.find(
        (option) =>
            option.databasePath.replace(/^\/+/, "") ===
            normalizedValue
    );

    return match?.url || value;
}

export default function AEILChapterPage() {
    const { chapterId } = useParams();
    const navigate = useNavigate();

    const [chapter, setChapter] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [narrator, setNarrator] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadChapter() {
            try {
                setLoading(true);
                setError("");

                const allChapters = await getChapters(BOOK_ID);

                if (cancelled) return;

                const chapterList = Array.isArray(allChapters)
                    ? allChapters
                    : [];

                const numericChapterId = Number(chapterId);

                let foundChapter =
                    chapterList.find(
                        (item) =>
                            Number(item.id) === numericChapterId
                    ) || null;

                if (!foundChapter) {
                    foundChapter =
                        chapterList.find(
                            (item) =>
                                Number(item.number) === numericChapterId
                        ) || null;
                }

                if (
                    !foundChapter &&
                    Number.isInteger(numericChapterId) &&
                    numericChapterId > 0 &&
                    numericChapterId <= chapterList.length
                ) {
                    foundChapter =
                        chapterList[numericChapterId - 1];
                }

                if (!foundChapter) {
                    setChapter(null);
                    setChapters(chapterList);
                    setNarrator(null);

                    setError(
                        `Kapitola ${chapterId} nebyla nalezena.`
                    );

                    return;
                }

                setChapter(foundChapter);
                setChapters(chapterList);

                try {
                    const narratorData =
                        await getChapterNarrator(
                            foundChapter.id
                        );

                    if (cancelled) return;

                    setNarrator(
                        narratorData?.character || null
                    );
                } catch (narratorError) {
                    console.warn(
                        "Nepodařilo se načíst vypravěče kapitoly:",
                        narratorError
                    );

                    if (!cancelled) {
                        setNarrator(null);
                    }
                }
            } catch (err) {
                if (cancelled) return;

                console.error(
                    "AEILChapterPage:",
                    err
                );

                setError(
                    err?.message ||
                        "Nepodařilo se načíst kapitolu."
                );
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadChapter();

        return () => {
            cancelled = true;
        };
    }, [chapterId]);

    const currentIndex = useMemo(
        () =>
            chapters.findIndex(
                (item) =>
                    Number(item.id) ===
                    Number(chapter?.id)
            ),
        [chapters, chapter]
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

    const backgroundImage =
        resolveChapterBackground(
            narrator?.chapter_background
        ) || null;

    /* =========================================================
       LOADING
       ========================================================= */

    if (loading) {
        return (
            <main className="aeil-chapter-page">

                <div className="aeil-chapter-background-placeholder" />

                <div className="aeil-chapter-overlay" />

                <img
                    src={aeilLace}
                    alt=""
                    className="aeil-chapter-lace"
                    aria-hidden="true"
                />

                <div className="aeil-chapter-loading">
                    Načítám kapitolu…
                </div>

            </main>
        );
    }

    /* =========================================================
       ERROR
       ========================================================= */

    if (error || !chapter) {
        return (
            <main className="aeil-chapter-page">

                <div className="aeil-chapter-background-placeholder" />

                <div className="aeil-chapter-overlay" />

                <img
                    src={aeilLace}
                    alt=""
                    className="aeil-chapter-lace"
                    aria-hidden="true"
                />

                <div className="aeil-chapter-error">

                    <h1>
                        {error ||
                            "Kapitola nebyla nalezena."}
                    </h1>

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/books/aeil/chapters"
                            )
                        }
                    >
                        ← ZPĚT NA KAPITOLY
                    </button>

                </div>

            </main>
        );
    }

    /* =========================================================
       HLAVNÍ STRÁNKA
       ========================================================= */

    return (
        <main className="aeil-chapter-page">

            {/* =================================================
               POZADÍ KAPITOLY
               ================================================= */}

            {backgroundImage ? (
                <div
                    className="aeil-chapter-character-background"
                    style={{
                        backgroundImage:
                            `url("${backgroundImage}")`,
                    }}
                    aria-hidden="true"
                />
            ) : (
                <div
                    className="aeil-chapter-background-placeholder"
                    aria-hidden="true"
                />
            )}

            {/* =================================================
               TMAVÝ PŘEKRYV
               ================================================= */}

            <div className="aeil-chapter-overlay" />

            {/* =================================================
               KRAJKA
               ================================================= */}

            <img
                src={aeilLace}
                alt=""
                className="aeil-chapter-lace"
                aria-hidden="true"
            />

            {/* =================================================
               HLAVIČKA
               ================================================= */}

            <header className="aeil-chapter-header">

                {/* ZPĚT NA KAPITOLY */}

                <button
                    type="button"
                    className="aeil-chapter-back"
                    onClick={() =>
                        navigate(
                            "/books/aeil/chapters"
                        )
                    }
                >
                    ← ZPĚT NA KAPITOLY
                </button>

                {/* LOGO S VÁŽKOU */}

                <div className="aeil-chapter-logo">
                    <img
                        src={libraryLogo}
                        alt="AEIL"
                    />
                </div>

            </header>

            {/* =================================================
               HLAVNÍ BLOK KAPITOLY
               ================================================= */}

            <article className="aeil-chapter-reader">

                {/* KAPITOLA */}

                <div className="aeil-chapter-number">
                    KAPITOLA{" "}
                    {String(
                        chapter.number ?? ""
                    ).padStart(2, "0")}
                </div>

                {/* NÁZEV */}

                <h1>
                    {chapter.title}
                </h1>

                {/* VYPRÁVÍ */}

                {narrator?.name && (
                    <div className="aeil-chapter-narrator">
                        Vypráví {narrator.name}
                    </div>
                )}

                {/* TEXT KAPITOLY */}

                <div
                    className="aeil-chapter-content"
                    dangerouslySetInnerHTML={{
                        __html:
                            chapter.content_html ||
                            "<p>Kapitola zatím nemá žádný text.</p>",
                    }}
                />

            </article>

            {/* =================================================
               4 SPODNÍ PANELY
               ================================================= */}

            <div className="aeil-chapter-tools">

                <button
                    type="button"
                    onClick={() =>
                        navigate("/books/aeil")
                    }
                >
                    Kniha
                </button>

                <button
                    type="button"
                    onClick={() =>
                        navigate(
                            "/books/aeil/characters"
                        )
                    }
                >
                    Postavy
                </button>

                <button
                    type="button"
                    onClick={() =>
                        navigate("/videos")
                    }
                >
                    Videa
                </button>

                <button
                    type="button"
                    onClick={() =>
                        navigate("/soundtracks")
                    }
                >
                    Soundtrack
                </button>

            </div>

            {/* =================================================
               NAVIGACE MEZI DÍLY
               PŘEDCHOZÍ VLEVO / DALŠÍ VPRAVO
               ================================================= */}

            <nav className="aeil-chapter-navigation">

                <button
                    type="button"
                    className="aeil-chapter-prev"
                    disabled={!previousChapter}
                    onClick={() =>
                        previousChapter &&
                        navigate(
                            `/books/aeil/chapters/${previousChapter.id}`
                        )
                    }
                >
                    ← PŘEDCHOZÍ DÍL
                </button>

                <button
                    type="button"
                    className="aeil-chapter-next"
                    disabled={!nextChapter}
                    onClick={() =>
                        nextChapter &&
                        navigate(
                            `/books/aeil/chapters/${nextChapter.id}`
                        )
                    }
                >
                    DALŠÍ DÍL →
                </button>

            </nav>

        </main>
    );
}