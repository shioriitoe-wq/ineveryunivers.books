import { Link } from "react-router-dom";

import BookAccessGate from "../components/BookAccessGate";
import "./NezacaloVolume3Page.css";


function NezacaloVolume3PageContent() {

    return (

        <main className="nezacalo-volume-3-page">

            <header>

                <Link to="/books/nezacalo-series">
                    ← (Ne)začalo to..
                </Link>

            </header>


            <section>

                <span>
                    DÍL 3
                </span>

                <h1>
                    (Ne)začalo to v temnotě
                </h1>


                <div>

                    <Link to="/books/nezacalo/volume/3/characters">
                        POSTAVY
                    </Link>

                </div>

            </section>

        </main>

    );

}

export default function NezacaloVolume3Page() {
    return (
        <BookAccessGate bookId={1} volumeId={3}>
            <NezacaloVolume3PageContent />
        </BookAccessGate>
    );
}
