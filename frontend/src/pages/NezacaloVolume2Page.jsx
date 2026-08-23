import { Link } from "react-router-dom";

import "./NezacaloVolume2Page.css";


export default function NezacaloVolume2Page() {

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