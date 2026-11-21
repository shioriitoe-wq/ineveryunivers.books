import { Link } from "react-router-dom";

import BookAccessGate from "../components/BookAccessGate";
import "./NezacaloVolume4Page.css";


function NezacaloVolume4PageContent() {

    return (

        <main className="nezacalo-volume-4-page">

            <header>

                <Link to="/books/nezacalo-series">
                    ← (Ne)začalo to..
                </Link>

            </header>


            <section>

                <span>
                    DÍL 4
                </span>

                <h1>
                    (Ne)začalo to tady
                </h1>


                <div>

                    <Link to="/books/nezacalo/volume/4/characters">
                        POSTAVY
                    </Link>

                </div>

            </section>

        </main>

    );

}

export default function NezacaloVolume4Page() {
    return (
        <BookAccessGate bookId={1} volumeId={4}>
            <NezacaloVolume4PageContent />
        </BookAccessGate>
    );
}
