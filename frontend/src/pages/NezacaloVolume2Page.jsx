import { Link } from "react-router-dom";

import BookAccessGate from "../components/BookAccessGate";
import "./NezacaloVolume2Page.css";


function NezacaloVolume2PageContent() {

    return (

        <main className="nezacalo-volume-2-page">

            <header>

                <Link to="/books/nezacalo-series">
                    ← (Ne)začalo to..
                </Link>

            </header>


            <section>

                <span>
                    DÍL 2
                </span>

                <h1>
                    (Ne)začalo to správně
                </h1>


                <div>

                    <Link to="/books/nezacalo/volume/2/characters">
                        POSTAVY
                    </Link>

                </div>

            </section>

        </main>

    );

}

export default function NezacaloVolume2Page() {
    return (
        <BookAccessGate bookId={1} volumeId={2}>
            <NezacaloVolume2PageContent />
        </BookAccessGate>
    );
}
