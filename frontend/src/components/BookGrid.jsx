import "./BookGrid.css";

import BookCircle from "./BookCircle";

/* ---------- knihy ---------- */

import nezacalo from "../assets/images/nezacalo-to.png";
import vespera from "../assets/images/Vespera/vespera.png";
import aeil from "../assets/images/AEIL/aeil.png";

/* ---------- hlavní štětcové rámečky ---------- */

import sageFrame from "../assets/frames/frame-sage.png";
import silverFrame from "../assets/frames/frame-ochre.png";
import redFrame from "../assets/frames/frame-red.png";

/* ---------- 2. vrstva (jemný akvarel) ---------- */

import sageWatercolor from "../assets/overlays/sage-watercolor.png";
import silverWatercolor from "../assets/overlays/silver-watercolor.png";
import redWatercolor from "../assets/overlays/red-watercolor.png";

/* ---------- 3. vrstva (silnější akvarel) ---------- */

import sageSplatter from "../assets/overlays/sage-splatter.png";
import silverSplatter from "../assets/overlays/silver-splatter.png";
import redSplatter from "../assets/overlays/red-splatter.png";

function BookGrid() {

    return (

        <section className="book-grid">

            <BookCircle
                title="(Ne)začalo to..."
                hoverTitle="Kluci, city a absolutní nedostatek zdravého rozumu."
                image={nezacalo}
                frame={sageFrame}
                watercolor={sageWatercolor}
                splatter={sageSplatter}
                titleClass="large"
                titleColor="#d7cfbb"
                link="/books/nezacalo-series"
            />

            <BookCircle
                title="Vespera"
                hoverTitle="Genetická apokalypsa. Nadpřirozené schopnosti. Běžná sobota."
                image={vespera}
                frame={silverFrame}
                watercolor={silverWatercolor}
                splatter={silverSplatter}
                titleColor="#d7d5d1"
                link="/books/vespera"
            />

            <BookCircle
                title="AEIL"
                hoverTitle="Magie existuje. Bohužel s ní přišly i následky."
                image={aeil}
                frame={redFrame}
                watercolor={redWatercolor}
                splatter={redSplatter}
                titleColor="#f1e5d1"
                link="/books/aeil"
            />

        </section>

    );

}

export default BookGrid;
