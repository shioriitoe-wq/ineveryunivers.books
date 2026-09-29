import { useEffect, useRef, useState } from "react";
import "./vespera-map.css";
import BackButton from "../components/BackButton";
/* =========================================================
   MAPA
========================================================= */

import mapBack
    from "../assets/images/Vespera/Maps/map-back.webp";


/* =========================================================
   BODY NA MAPĚ + ODPOVÍDAJÍCÍ SPISY
========================================================= */

import BjornaMap
    from "../assets/images/Vespera/Maps/BjornaMap.webp";

import BjornaDocument
    from "../assets/images/Vespera/Maps/Bjorna.webp";


import MorlaixMap
    from "../assets/images/Vespera/Maps/Morlaixmap.webp";

import MorlaixDocument
    from "../assets/images/Vespera/Maps/Morlaix.webp";


import OdbojMap
    from "../assets/images/Vespera/Maps/Odbojmap.webp";

import OdbojDocument
    from "../assets/images/Vespera/Maps/Odboj.webp";


import PalenciaMap
    from "../assets/images/Vespera/Maps/Palenciamap.webp";

import PalenciaDocument
    from "../assets/images/Vespera/Maps/Palencia.webp";


import RedfordMap
    from "../assets/images/Vespera/Maps/Redfordmap.webp";

import RedfordDocument
    from "../assets/images/Vespera/Maps/Redford.webp";


import RunaMap
    from "../assets/images/Vespera/Maps/Runamap.webp";

import RunaDocument
    from "../assets/images/Vespera/Maps/RUNA.webp";


/* =========================================================
   MÍSTA NA MAPĚ

   left / top jsou procenta vůči celé mapě.
   Pozice můžeš později jednoduše upravit.
========================================================= */

const locations = [
    {
        id: "bjorna",
        marker: BjornaMap,
        document: BjornaDocument,
        left: "57%",
        top: "9%",
    },

    {
        id: "morlaix",
        marker: MorlaixMap,
        document: MorlaixDocument,
        left: "35%",
        top: "59%",
    },

    {
        id: "odboj",
        marker: OdbojMap,
        document: OdbojDocument,
        left: "30%",
        top: "37%",
    },

    {
        id: "palencia",
        marker: PalenciaMap,
        document: PalenciaDocument,
        left: "17%",
        top: "64%",
    },

    {
        id: "redford",
        marker: RedfordMap,
        document: RedfordDocument,
        left: "35%",
        top: "38%",
    },

    {
        id: "runa",
        marker: RunaMap,
        document: RunaDocument,
        left: "78%",
        top: "32%",
    },
];


/* =========================================================
   KOMPONENTA
========================================================= */

export default function VesperaMap() {

    const [selectedDocument, setSelectedDocument] = useState(null);

    const [zoom, setZoom] = useState(1);

    const [position, setPosition] = useState({
        x: 0,
        y: 0,
    });

    const [dragging, setDragging] = useState(false);

    const dragStart = useRef({
        x: 0,
        y: 0,
    });

    const positionStart = useRef({
        x: 0,
        y: 0,
    });


    /* =====================================================
       OTEVŘENÍ DOKUMENTU
    ===================================================== */

    const openDocument = (documentImage) => {

        setSelectedDocument(documentImage);

        setZoom(1);

        setPosition({
            x: 0,
            y: 0,
        });
    };


    /* =====================================================
       ZAVŘENÍ DOKUMENTU
    ===================================================== */

    const closeDocument = () => {

        setSelectedDocument(null);

        setZoom(1);

        setPosition({
            x: 0,
            y: 0,
        });

        setDragging(false);
    };


    /* =====================================================
       ESC
    ===================================================== */

    useEffect(() => {

        const handleKeyDown = (event) => {

            if (event.key === "Escape") {
                closeDocument();
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

    }, []);


    /* =====================================================
       ZOOM KOLEČKEM
    ===================================================== */

    const handleWheel = (event) => {

        if (!selectedDocument) {
            return;
        }

        event.preventDefault();


        const zoomDirection =
            event.deltaY < 0 ? 1 : -1;


        const zoomStep = 0.15;


        const newZoom = Math.min(
            4,
            Math.max(
                1,
                zoom + zoomDirection * zoomStep
            )
        );


        if (newZoom === zoom) {
            return;
        }


        /*
         * Přibližování je orientované
         * na místo, kde je kurzor.
         */

        const rect =
            event.currentTarget.getBoundingClientRect();


        const mouseX =
            event.clientX - rect.left - rect.width / 2;

        const mouseY =
            event.clientY - rect.top - rect.height / 2;


        const zoomRatio =
            newZoom / zoom;


        setPosition((current) => ({

            x:
                mouseX -
                (mouseX - current.x) * zoomRatio,

            y:
                mouseY -
                (mouseY - current.y) * zoomRatio,

        }));


        setZoom(newZoom);
    };


    /* =====================================================
       ZAČÁTEK TAŽENÍ
    ===================================================== */

    const handlePointerDown = (event) => {

        if (!selectedDocument) {
            return;
        }

        if (event.button !== 0) {
            return;
        }

        /*
         * Při zoomu 1 není potřeba dokument posouvat.
         */

        if (zoom <= 1) {
            return;
        }


        event.currentTarget.setPointerCapture(
            event.pointerId
        );


        setDragging(true);


        dragStart.current = {
            x: event.clientX,
            y: event.clientY,
        };


        positionStart.current = {
            x: position.x,
            y: position.y,
        };
    };


    /* =====================================================
       TAŽENÍ
    ===================================================== */

    const handlePointerMove = (event) => {

        if (!dragging) {
            return;
        }


        const deltaX =
            event.clientX - dragStart.current.x;

        const deltaY =
            event.clientY - dragStart.current.y;


        setPosition({

            x:
                positionStart.current.x +
                deltaX,

            y:
                positionStart.current.y +
                deltaY,

        });
    };


    /* =====================================================
       KONEC TAŽENÍ
    ===================================================== */

    const handlePointerUp = () => {

        setDragging(false);
    };


    /* =====================================================
       RENDER
    ===================================================== */

   return (

    <main
        className="vespera-map-page"
        style={{
            "--vespera-map-background": `url(${mapBack})`,
        }}
    >

        {/* =================================================
            ZPĚT NA VESPERU
        ================================================= */}

        <button
  className="dictionary-back"
  onClick={() => window.history.back()}
  aria-label="Zpět"
>
  ←
</button>



            {/* =================================================
                MAPA
            ================================================= */}

            <div className="vespera-map-background">


                {/* =================================================
                    BODY / MĚSTA
                ================================================= */}

                <div className="vespera-map-markers">

                    {locations.map((location) => (

                        <button
                            key={location.id}
                            type="button"
                            className="vespera-map-marker"
                            style={{
                                left: location.left,
                                top: location.top,
                            }}
                            onClick={() =>
                                openDocument(
                                    location.document
                                )
                            }
                            aria-label={
                                `Otevřít spis ${location.id}`
                            }
                        >

                            <img
                                src={location.marker}
                                alt=""
                                draggable="false"
                            />

                        </button>

                    ))}

                </div>

            </div>


            {/* =================================================
                DOKUMENT
            ================================================= */}

            {selectedDocument && (

                <div
                    className="vespera-map-document-overlay"
                    onWheel={handleWheel}
                >

                    {/* =================================================
                        KŘÍŽEK
                    ================================================= */}

                    <button
                        type="button"
                        className="vespera-map-close"
                        onClick={closeDocument}
                        aria-label="Zavřít dokument"
                    >
                        ×
                    </button>


                    {/* =================================================
                        PROSTOR PRO DOKUMENT
                    ================================================= */}

                    <div
                        className={[
                            "vespera-map-document-view",
                            dragging
                                ? "is-dragging"
                                : "",
                        ].join(" ")}
                        onPointerDown={
                            handlePointerDown
                        }
                        onPointerMove={
                            handlePointerMove
                        }
                        onPointerUp={
                            handlePointerUp
                        }
                        onPointerCancel={
                            handlePointerUp
                        }
                        onPointerLeave={
                            handlePointerUp
                        }
                    >

                        <img
                            src={selectedDocument}
                            alt="Dokument"
                            className="vespera-map-document-image"
                            draggable="false"
                            style={{
    transform:
        `translate3d(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px), 0) scale(${zoom})`,
}}
                        />

                    </div>


                    {/* =================================================
                        MALÁ NÁPOVĚDA
                    ================================================= */}

                    <div className="vespera-map-zoom-hint">
                        Kolečko – přiblížení &nbsp; • &nbsp;
                        Tažením myší – posun
                    </div>

                </div>

            )}

        </main>
    );
}