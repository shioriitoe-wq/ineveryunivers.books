import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./VesperaDocuments.css";

import vesperaDocumentsBack from "../assets/images/Vespera/vespera-documents-back.webp";

/* =========================================================
   JEDNOTLIVÉ DOKUMENTY
========================================================= */

import Severov from "../assets/images/Vespera/Documents/Severov.mp4";
import MatyKai from "../assets/images/Vespera/Documents/MatyKai.mp4";
import HopeWill from "../assets/images/Vespera/Documents/HopeWill.mp4";
import odboj from "../assets/images/Vespera/Documents/Odboj.MP3";

import vesperaTablet from "../assets/images/Vespera/Documents/vespera-tablet.webp";
import vesperaRunaNote from "../assets/images/Vespera/Documents/vespera-runa.webp";
import vesperaLetter from "../assets/images/Vespera/Documents/vespera-documents-letter.webp";
import vesperaPhone from "../assets/images/Vespera/Documents/vespera-documents-phone.webp";

import vesperaRedford from "../assets/images/Vespera/Documents/vespera-documents-redford.webp";
import vesperaPhotolab from "../assets/images/Vespera/Documents/vespera-documents-photolab.webp";
import vesperaPhotono1 from "../assets/images/Vespera/Documents/vespera-documents-photono1.webp";
import vesperaPhotoel from "../assets/images/Vespera/Documents/vespera-documents-photoel.webp";
import vesperaNews from "../assets/images/Vespera/Documents/vespera-documents-news.webp";
import vesperaRing from "../assets/images/Vespera/Documents/vespera-ring.webp";
import vesperaSeverov from "../assets/images/Vespera/Documents/vespera-severov.webp";
import vesperaBase from "../assets/images/Vespera/Documents/vespera-base.webp";
import vesperaNexcore from "../assets/images/Vespera/Documents/vespera-nexcore.webp";

/* =========================================================
   R.U.N.A.
   9 dokumentů + VESPERA-PERSONS
========================================================= */

import vesperaRuna from "../assets/images/Vespera/Documents/vespera-documents-runa.webp";
import vesperaRuna1 from "../assets/images/Vespera/Documents/vespera-documents-runa1.webp";
import vesperaRuna2 from "../assets/images/Vespera/Documents/vespera-documents-runa2.webp";
import vesperaRuna3 from "../assets/images/Vespera/Documents/vespera-documents-runa3.webp";
import vesperaRuna4 from "../assets/images/Vespera/Documents/vespera-documents-runa4.webp";
import vesperaRuna5 from "../assets/images/Vespera/Documents/vespera-documents-runa5.webp";
import vesperaRuna6 from "../assets/images/Vespera/Documents/vespera-documents-runa6.webp";
import vesperaRuna7 from "../assets/images/Vespera/Documents/vespera-documents-runa7.webp";
import vesperaRuna8 from "../assets/images/Vespera/Documents/vespera-documents-runa8.webp";
import vesperaPersons from "../assets/images/Vespera/Documents/vespera-persons.webp";


/* =========================================================
   POMOCNÁ FUNKCE
========================================================= */

const makeDocument = (url, name) => ({
    url,
    name,
});


/* =========================================================
   R.U.N.A. – POŘADÍ
========================================================= */

const runaDocuments = [
    makeDocument(
        vesperaRuna,
        "vespera-documents-runa.webp"
    ),

    makeDocument(
        vesperaRuna1,
        "vespera-documents-runa1.webp"
    ),

    makeDocument(
        vesperaRuna2,
        "vespera-documents-runa2.webp"
    ),

    makeDocument(
        vesperaRuna3,
        "vespera-documents-runa3.webp"
    ),

    makeDocument(
        vesperaRuna4,
        "vespera-documents-runa4.webp"
    ),

    makeDocument(
        vesperaRuna5,
        "vespera-documents-runa5.webp"
    ),

    makeDocument(
        vesperaRuna6,
        "vespera-documents-runa6.webp"
    ),

    makeDocument(
        vesperaRuna7,
        "vespera-documents-runa7.webp"
    ),

    makeDocument(
        vesperaRuna8,
        "vespera-documents-runa8.webp"
    ),

    makeDocument(
        vesperaPersons,
        "vespera-persons.webp"
    ),
];


/* =========================================================
   OSTATNÍ DOKUMENTY
========================================================= */

const documents = {

    recorder1: makeDocument(
        Severov,
        "Severov.mp4"
    ),

    tablet: makeDocument(
        vesperaTablet,
        "vespera-tablet.webp"
    ),

    paper: makeDocument(
        vesperaRunaNote,
        "vespera-runa.webp"
    ),

    letter: makeDocument(
        vesperaLetter,
        "vespera-documents-letter.webp"
    ),

    phone: makeDocument(
        vesperaPhone,
        "vespera-documents-phone.webp"
    ),

    recorder2: makeDocument(
        MatyKai,
        "MatyKai.mp4"
    ),

    walkieTalkie: {
        url: HopeWill,
        name: "HopeWill.mp4",
        sound: true,
    },

    redford: makeDocument(
        vesperaRedford,
        "vespera-documents-redford.webp"
    ),

    laboratory: makeDocument(
        vesperaPhotolab,
        "vespera-documents-photolab.webp"
    ),

    man: makeDocument(
        vesperaPhotono1,
        "vespera-documents-photono1.webp"
    ),

    powerplant: makeDocument(
        vesperaPhotoel,
        "vespera-documents-photoel.webp"
    ),

    newspaper: makeDocument(
        vesperaNews,
        "vespera-documents-news.webp"
    ),

    ring: makeDocument(
        vesperaRing,
        "vespera-ring.webp"
    ),

    severov: makeDocument(
        vesperaSeverov,
        "vespera-severov.webp"
    ),

    base: makeDocument(
        vesperaBase,
        "vespera-base.webp"
    ),

    nexcore: makeDocument(
        vesperaNexcore,
        "vespera-nexcore.webp"
    ),
};


/* =========================================================
   HLAVNÍ KOMPONENTA
========================================================= */

export default function VesperaDocuments() {

    const navigate = useNavigate();

    const [openedDocument, setOpenedDocument] = useState(null);

    const [currentIndex, setCurrentIndex] = useState(0);

    const [zoom, setZoom] = useState(1);

    const [pan, setPan] = useState({ x: 0, y: 0 });

    const [isDragging, setIsDragging] = useState(false);

    const dragStart = useRef({
        x: 0,
        y: 0,
        panX: 0,
        panY: 0,
    });

    const radioAudio = useRef(null);

    const [radioOn, setRadioOn] = useState(false);

    useEffect(() => {

        const audio = new Audio(odboj);

        audio.loop = true;
        audio.preload = "auto";

        radioAudio.current = audio;

        return () => {

            audio.pause();
            audio.currentTime = 0;
            radioAudio.current = null;
        };

    }, []);


    /* =====================================================
       OTEVŘÍT DOKUMENT
    ===================================================== */

    const openDocument = (
        type,
        documentList
    ) => {

        if (
            !documentList ||
            documentList.length === 0
        ) {
            return;
        }

        setOpenedDocument({
            type,
            documents: documentList,
        });

        setCurrentIndex(0);

        setZoom(1);
        setPan({ x: 0, y: 0 });

        document.body.classList.add(
            "vespera-documents-open"
        );
    };


    /* =====================================================
       ZAVŘÍT DOKUMENT
    ===================================================== */

    const closeDocument = () => {

        setOpenedDocument(null);

        setCurrentIndex(0);

        setZoom(1);
        setPan({ x: 0, y: 0 });

        document.body.classList.remove(
            "vespera-documents-open"
        );
    };


    /* =====================================================
       PŘEDCHOZÍ
    ===================================================== */

    const previousDocument = () => {

        if (
            !openedDocument ||
            openedDocument.documents.length <= 1
        ) {
            return;
        }

        setCurrentIndex(
            (previous) => {

                if (previous <= 0) {

                    return (
                        openedDocument
                            .documents
                            .length - 1
                    );
                }

                return previous - 1;
            }
        );

        setZoom(1);
        setPan({ x: 0, y: 0 });
    };


    /* =====================================================
       DALŠÍ
    ===================================================== */

    const nextDocument = () => {

        if (
            !openedDocument ||
            openedDocument.documents.length <= 1
        ) {
            return;
        }

        setCurrentIndex(
            (previous) => {

                if (
                    previous >=
                    openedDocument
                        .documents
                        .length - 1
                ) {

                    return 0;
                }

                return previous + 1;
            }
        );

        setZoom(1);
        setPan({ x: 0, y: 0 });
    };


    /* =====================================================
       ZOOM
    ===================================================== */

    const zoomIn = () => {

        setZoom(
            (previous) =>
                Math.min(
                    previous + 0.25,
                    3
                )
        );
    };


    const zoomOut = () => {

        setZoom(
            (previous) =>
                Math.max(
                    previous - 0.25,
                    0.5
                )
        );
    };


    const resetZoom = () => {

        setZoom(1);
        setPan({ x: 0, y: 0 });
    };


    /* =====================================================
       ZOOM KOLEČKEM MYŠI
    ===================================================== */

    const handleViewerWheel = (event) => {

        event.preventDefault();

        if (event.deltaY < 0) {
            zoomIn();
        } else if (event.deltaY > 0) {
            setZoom((previous) => {
                const nextZoom = Math.max(previous - 0.25, 0.5);

                if (nextZoom <= 1) {
                    setPan({ x: 0, y: 0 });
                }

                return nextZoom;
            });
        }
    };


    /* =====================================================
       POSUN ZVĚTŠENÉHO OBRÁZKU MYŠÍ
    ===================================================== */

    const handleDocumentPointerDown = (event) => {

        if (zoom <= 1) {
            return;
        }

        if (event.button !== 0) {
            return;
        }

        dragStart.current = {
            x: event.clientX,
            y: event.clientY,
            panX: pan.x,
            panY: pan.y,
        };

        setIsDragging(true);

        event.currentTarget.setPointerCapture?.(event.pointerId);
    };


    const handleDocumentPointerMove = (event) => {

        if (!isDragging || zoom <= 1) {
            return;
        }

        setPan({
            x: dragStart.current.panX +
                (event.clientX - dragStart.current.x),
            y: dragStart.current.panY +
                (event.clientY - dragStart.current.y),
        });
    };


    const handleDocumentPointerUp = (event) => {

        setIsDragging(false);

        event.currentTarget.releasePointerCapture?.(event.pointerId);
    };


    /* =====================================================
       RÁDIO ODVOJ
    ===================================================== */

    const toggleRadio = async () => {

    if (radioOn) {

        if (radioAudio.current) {
            radioAudio.current.pause();
            radioAudio.current.currentTime = 0;
        }

        setRadioOn(false);

        return;
    }

    try {

        if (!radioAudio.current) {

            const audio = new Audio(odboj);

            audio.loop = true;
            audio.preload = "auto";

            radioAudio.current = audio;
        }

        radioAudio.current.currentTime = 0;

        await radioAudio.current.play();

        setRadioOn(true);

    } catch (error) {

        console.error(
            "Rádio odboje se nepodařilo přehrát:",
            error
        );

        setRadioOn(false);
    }
};

    /* =====================================================
       KLÁVESNICE
    ===================================================== */

    useEffect(() => {

        const handleKeyDown = (event) => {

            if (!openedDocument) {
                return;
            }

            if (event.key === "Escape") {

                closeDocument();

                return;
            }

            if (event.key === "ArrowLeft") {

                previousDocument();

                return;
            }

            if (event.key === "ArrowRight") {

                nextDocument();

                return;
            }

            if (
                event.key === "+" ||
                event.key === "="
            ) {

                zoomIn();

                return;
            }

            if (event.key === "-") {

                zoomOut();

                return;
            }

            if (event.key === "0") {

                resetZoom();
            }
        };


        window.addEventListener(
            "keydown",
            handleKeyDown
        );


        return () => {

            window.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };

    }, [openedDocument]);


    /* =====================================================
       ÚKLID PO OPUŠTĚNÍ STRÁNKY
    ===================================================== */

    useEffect(() => {

        return () => {

            document.body.classList.remove(
                "vespera-documents-open"
            );
        };

    }, []);


    /* =====================================================
       KLIK NA POZADÍ VIEWERU
    ===================================================== */

    const handleOverlayClick = (event) => {

        if (
            event.target ===
            event.currentTarget
        ) {

            closeDocument();
        }
    };


    /* =====================================================
       AKTUÁLNÍ DOKUMENT
    ===================================================== */

    const currentDocument =
        openedDocument
            ?.documents
            ?.[currentIndex];


    /* =====================================================
       RENDER
    ===================================================== */

    return (

        <main
            className="vespera-documents-page"
            style={{
                "--documents-background":
                    `url(${vesperaDocumentsBack})`,
            }}
        >

            {/* POZADÍ */}

            <div
                className="vespera-documents-background"
                aria-hidden="true"
            />


            {/* PRACH */}

            <div
                className="vespera-dust"
                aria-hidden="true"
            >

                {Array.from(
                    {
                        length: 55,
                    },
                    (_, index) => (

                        <span
                            key={index}
                            className={
                                `dust dust-${index + 1}`
                            }
                        />

                    )
                )}

            </div>


            {/* ZPĚT */}

            <button
  className="dictionary-back"
  onClick={() => window.history.back()}
  aria-label="Zpět"
>
  ←
</button>


            {/* =================================================
                HOTSPOTY – 14 OBJEKTŮ
            ================================================= */}

            <div
                className="documents-hotspots"
            >

                {/* 1. ZÁZNAMNÍK 1 */}

                <button
                    type="button"
                    className="
                        document-hotspot
                        hotspot-recorder
                    "
                    onClick={() =>
                        openDocument(
                            "recorder1",
                            [
                                documents.recorder1,
                            ]
                        )
                    }
                    aria-label="Záznamník Severov"
                />


                {/* 2. TABLET */}

                <button
                    type="button"
                    className="
                        document-hotspot
                        hotspot-tablet
                    "
                    onClick={() =>
                        openDocument(
                            "tablet",
                            [
                                documents.tablet,
                            ]
                        )
                    }
                    aria-label="Tablet"
                />


                {/* 3. PAPÍREK */}

                <button
                    type="button"
                    className="
                        document-hotspot
                        hotspot-paper
                    "
                    onClick={() =>
                        openDocument(
                            "paper",
                            [
                                documents.paper,
                            ]
                        )
                    }
                    aria-label="Papírek"
                />


                {/* 4. DOPIS */}

                <button
                    type="button"
                    className="
                        document-hotspot
                        hotspot-letter
                    "
                    onClick={() =>
                        openDocument(
                            "letter",
                            [
                                documents.letter,
                            ]
                        )
                    }
                    aria-label="Dopis"
                />


                {/* 5. MOBIL */}

                <button
                    type="button"
                    className="
                        document-hotspot
                        hotspot-phone
                    "
                    onClick={() =>
                        openDocument(
                            "phone",
                            [
                                documents.phone,
                            ]
                        )
                    }
                    aria-label="Mobil"
                />


                {/* 6. ZÁZNAMNÍK 2 */}

                <button
                    type="button"
                    className="
                        document-hotspot
                        hotspot-recorder2
                    "
                    onClick={() =>
                        openDocument(
                            "recorder2",
                            [
                                documents.recorder2,
                            ]
                        )
                    }
                    aria-label="Záznamník Maty Kai"
                />


                {/* 7. R.U.N.A. */}

                <button
                    type="button"
                    className="
                        document-hotspot
                        hotspot-runa
                    "
                    onClick={() =>
                        openDocument(
                            "runa",
                            runaDocuments
                        )
                    }
                    aria-label="Spisy R.U.N.A."
                />


                {/* 8. REDFORD */}

                <button
                    type="button"
                    className="
                        document-hotspot
                        hotspot-redford
                    "
                    onClick={() =>
                        openDocument(
                            "redford",
                            [
                                documents.redford,
                            ]
                        )
                    }
                    aria-label="Spisy Redford"
                />


                {/* 9. LABORATOŘ */}

                <button
                    type="button"
                    className="
                        document-hotspot
                        hotspot-laboratory
                    "
                    onClick={() =>
                        openDocument(
                            "laboratory",
                            [
                                documents.laboratory,
                            ]
                        )
                    }
                    aria-label="Fotografie laboratoře"
                />


                {/* 10. MUŽ */}

                <button
                    type="button"
                    className="
                        document-hotspot
                        hotspot-man
                    "
                    onClick={() =>
                        openDocument(
                            "man",
                            [
                                documents.man,
                            ]
                        )
                    }
                    aria-label="Fotografie muže"
                />


                {/* 11. ELEKTRÁRNA */}

                <button
                    type="button"
                    className="
                        document-hotspot
                        hotspot-powerplant
                    "
                    onClick={() =>
                        openDocument(
                            "powerplant",
                            [
                                documents.powerplant,
                            ]
                        )
                    }
                    aria-label="Fotografie elektrárny"
                />


                {/* 12. NOVINY */}

                <button
                    type="button"
                    className="
                        document-hotspot
                        hotspot-newspaper
                    "
                    onClick={() =>
                        openDocument(
                            "newspaper",
                            [
                                documents.newspaper,
                            ]
                        )
                    }
                    aria-label="Noviny"
                />


                {/* 13. VYSÍLAČKA */}

                <button
                    type="button"
                    className="
                        document-hotspot
                        hotspot-walkie-talkie
                    "
                    onClick={() =>
                        openDocument(
                            "walkieTalkie",
                            [
                                documents.walkieTalkie,
                            ]
                        )
                    }
                    aria-label="Vysílačka Hope Will"
                />


                {/* 14. RÁDIO ODVOJE */}

                <button
                    type="button"
                    className="
                        document-hotspot
                        hotspot-radio
                    "
                    onClick={toggleRadio}
                    aria-label={
                        radioOn
                            ? "Vypnout rádio odboje"
                            : "Zapnout rádio odboje"
                    }
                />


                {/* 15. PRSTÝNEK */}

                <button
                    type="button"
                    className="
                        document-hotspot
                        hotspot-ring
                    "
                    onClick={() =>
                        openDocument(
                            "ring",
                            [
                                documents.ring,
                            ]
                        )
                    }
                    aria-label="Prstýnek"
                />


                {/* 16. POVOLÁVACÍ ROZKAZ */}

                <button
                    type="button"
                    className="
                        document-hotspot
                        hotspot-severov
                    "
                    onClick={() =>
                        openDocument(
                            "severov",
                            [
                                documents.severov,
                            ]
                        )
                    }
                    aria-label="Povolávací rozkaz"
                />


                {/* 17. MAPA ZÁKLADNY */}

                <button
                    type="button"
                    className="
                        document-hotspot
                        hotspot-base
                    "
                    onClick={() =>
                        openDocument(
                            "base",
                            [
                                documents.base,
                            ]
                        )
                    }
                    aria-label="Mapa základny"
                />


                {/* 18. HODINKY NEXCORE */}

                <button
                    type="button"
                    className="
                        document-hotspot
                        hotspot-nexcore
                    "
                    onClick={() =>
                        openDocument(
                            "nexcore",
                            [
                                documents.nexcore,
                            ]
                        )
                    }
                    aria-label="Hodinky Nexcore"
                />

            </div>


            {/* ZELENÁ DIODA RÁDIA */}

            {radioOn && (
                <span
                    className="radio-led"
                    aria-hidden="true"
                />
            )}


            {/* =================================================
                VIEWER
            ================================================= */}

            {
                openedDocument &&
                currentDocument && (

                    <div
                        className="document-viewer"
                        onClick={
                            handleOverlayClick
                        }
                        onWheel={
                            handleViewerWheel
                        }
                    >

                        {/* KŘÍŽEK */}

                        <div
                            className="
                                document-viewer-top
                            "
                        >

                            <button
                                type="button"
                                className="
                                    document-close
                                "
                                onClick={
                                    closeDocument
                                }
                                aria-label="Zavřít"
                            >
                                ×
                            </button>

                        </div>


                        {/* DOKUMENT */}

                        <div
                            className="
                                document-viewer-content
                            "
                        >

                            <div
                                className={`
                                    document-image-wrapper
                                    ${isDragging ? "is-dragging" : ""}
                                `}
                                onPointerDown={
                                    handleDocumentPointerDown
                                }
                                onPointerMove={
                                    handleDocumentPointerMove
                                }
                                onPointerUp={
                                    handleDocumentPointerUp
                                }
                                onPointerCancel={
                                    handleDocumentPointerUp
                                }
                                style={{
                                    transform:
                                        `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
                                }}
                            >

                                {
                                    /\.(mp4|webm)$/i.test(
                                        currentDocument.url
                                    )

                                        ? (

                                            <video
                                                src={
                                                    currentDocument.url
                                                }
                                                className="
                                                    document-media
                                                "
                                                controls
                                                autoPlay
                                                muted={false}
                                                playsInline
                                            />

                                        )

                                        : (

                                            <img
                                                src={
                                                    currentDocument.url
                                                }
                                                alt={
                                                    currentDocument.name
                                                }
                                                className="
                                                    document-media
                                                "
                                                draggable={
                                                    false
                                                }
                                            />

                                        )
                                }

                            </div>

                        </div>


                        {/* LEVÁ ŠIPKA */}

                        {
                            openedDocument
                                .documents
                                .length > 1 && (

                                <button
                                    type="button"
                                    className="
                                        document-navigation
                                        document-navigation-left
                                    "
                                    onClick={
                                        previousDocument
                                    }
                                    aria-label="Předchozí strana"
                                >
                                    ‹
                                </button>

                            )
                        }


                        {/* PRAVÁ ŠIPKA */}

                        {
                            openedDocument
                                .documents
                                .length > 1 && (

                                <button
                                    type="button"
                                    className="
                                        document-navigation
                                        document-navigation-right
                                    "
                                    onClick={
                                        nextDocument
                                    }
                                    aria-label="Další strana"
                                >
                                    ›
                                </button>

                            )
                        }


                        {/* ZOOM */}

                        <div
                            className="
                                document-zoom-controls
                            "
                        >

                            <button
                                type="button"
                                onClick={
                                    zoomOut
                                }
                                aria-label="Oddálit"
                            >
                                −
                            </button>


                            <button
                                type="button"
                                className="
                                    zoom-value
                                "
                                onClick={
                                    resetZoom
                                }
                                aria-label="Resetovat přiblížení"
                            >
                                {
                                    Math.round(
                                        zoom * 100
                                    )
                                }%
                            </button>


                            <button
                                type="button"
                                onClick={
                                    zoomIn
                                }
                                aria-label="Přiblížit"
                            >
                                +
                            </button>

                        </div>


                        {/* ČÍSLO STRANY */}

                        {
                            openedDocument
                                .documents
                                .length > 1 && (

                                <div
                                    className="
                                        document-counter
                                    "
                                >

                                    {
                                        currentIndex + 1
                                    }

                                    {" / "}

                                    {
                                        openedDocument
                                            .documents
                                            .length
                                    }

                                </div>

                            )
                        }

                    </div>

                )
            }

        </main>
    );
}