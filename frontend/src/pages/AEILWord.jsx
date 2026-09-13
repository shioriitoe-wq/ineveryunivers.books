import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./AEILWord.css";

import backgroundImage from "../assets/images/AEIL/aeil-characters-back.png";

import AEIL from "../assets/images/AEIL/word/AEIL.png";
import AEILScroll from "../assets/images/AEIL/word/AEIL-svitek.png";

import Ashkar from "../assets/images/AEIL/word/Ashkar.png";
import AshkarScroll from "../assets/images/AEIL/word/Ashkar-svitek.png";

import Obscyr from "../assets/images/AEIL/word/Obscyr.png";
import ObscyrScroll from "../assets/images/AEIL/word/Obscyr-svitek.png";


const words = [

    {
        name: "AEIL",
        image: AEIL,
        scroll: AEILScroll,

        text: `ÆIL je v dávných pověstech označována za první a původní bytost, z níž povstal veškerý svět. Nebyla bohem ani vládcem světa v lidském smyslu — byla světem samotným. V jejím nitru existovalo všechno, co kdy bylo, je i bude. Čas, prostor, život i smrt byly pouze částmi její vlastní podstaty.

Přesto jí něco chybělo.

ÆIL dokázala stvořit život, ale sama jej nikdy nemohla skutečně prožít. Neznala radost z obyčejného dne, strach, bolest, lásku ani touhu. Pozorovala lidstvo a začala toužit po něčem, co jí jako všehomíru připadalo nedosažitelné — chtěla být pouze jednou bytostí a cítit tak, jako cítí člověk.

Podle nejstarší pověsti se proto ÆIL rozhodla opustit svou původní podobu. Aby mohla vstoupit mezi lidi a poznat jejich svět zevnitř, rozpadla sama sebe. Její tělo, vědomí a síla se rozptýlily po světě a její jednotlivé části sestoupily mezi smrtelníky.

ÆIL tak přestala existovat jako jediná bytost.

Její síla však nezmizela.

Zůstala ve světě jako magie — neviditelná pozůstalost původní bytosti, která prostupuje živými tvory, zemí i samotným světem. Každý člověk, který kdy použije magii, se podle některých tradic dotýká nepatrného zlomku toho, čím ÆIL kdysi byla.

Říká se, že magie není dar od ÆIL. Magie je ÆIL.

A protože se její podstata rozpadla do nespočtu částí, nikdo dnes nedokáže říct, kde její vědomí skutečně skončilo. Některé legendy tvrdí, že přebývá ve všech živých bytostech. Jiné, že se její vědomí rozptýlilo spolu s magií a pomalu znovu hledá cestu k sobě.

A existuje i stará pověst, které se lidé bojí nejvíce:

ÆIL se nerozpadla proto, aby zemřela. Rozpadla se proto, aby mohla žít.

A pokud se všechny její části jednoho dne znovu spojí, svět možná zjistí, zda se původní bytost skutečně ztratila — nebo zda po celou dobu jen prožívala svůj život skrze všechny, kteří v ní žijí.`
    },


    {
        name: "Ashkar",
        image: Ashkar,
        scroll: AshkarScroll,

        text: `Aš'kar je dávný mýtický jazyk, o kterém se věří, že jím mluvila první bytost. Je považován za jeden z nejstarších jazyků, který kdy existoval.

Dodnes se zachovalo jen několik písemných pozůstatků, jejichž význam však nikdo nedokázal rozluštit. Nikdo Aš'karu nerozumí a nikdo jím neumí mluvit. Jeho znaky se objevují na několika starých předmětech a místech, jejichž původ sahá do dob dávno před vznikem dnešních království.

Učenci se po staletí snaží jeho písmo rozluštit. Bez úspěchu.

Někteří věří, že Aš'kar není pouze jazykem, ale něčím mnohem starším, co se nedá lidskými slovy skutečně pochopit.`
    },


    {
        name: "Obscyr",
        image: Obscyr,
        scroll: ObscyrScroll,

        text: `Obscyr je vzácný černý krystal, který se těží pouze ve Vethoru. Je nesmírně cenný a jeho těžba udělala z Vethoru nejbohatší a nejmocnější království světa.

Obscyr se nejčastěji využívá při výrobě zbraní a dalších cenných předmětů. Největší a nejčistší kusy jsou vzácné natolik, že se staly symbolem bohatství a moci.

Nikdo neví, kde se Obscyr vzal ani proč má své neobvyklé vlastnosti. Přesto po něm touží téměř každé království.

V Ravoře, hlavním městě Vethoru, stojí monumentální Obscyrová síň, kde sídlí vethorský král. Právě zde přijímá vládce ostatních zemí a rozhoduje o osudu království. Při nejvýznamnějších příležitostech nosí Obscyrovou korunu, symbol vethorské nadvlády.

Pro Vethor je Obscyr víc než nerost.

Je základem jeho moci.`
    }

];


export default function AEILWord() {

    const navigate = useNavigate();

    const [selectedWord, setSelectedWord] = useState(null);


    useEffect(() => {

        if (!selectedWord) {

            document.body.style.overflow = "";

            return;

        }

        document.body.style.overflow = "hidden";


        return () => {

            document.body.style.overflow = "";

        };

    }, [selectedWord]);


    const closeWord = () => {

        setSelectedWord(null);

    };


    return (

        <main
            className="aeil-word-page"
            style={{
                "--aeil-word-background": `url(${backgroundImage})`
            }}
        >


            {/* =====================================================
                ZPĚT
            ===================================================== */}

            <button
                type="button"
                className="aeil-word-back"
                onClick={() => navigate("/books/aeil")}
            >
                ← Zpět
            </button>


           


            {/* =====================================================
                PANELY
            ===================================================== */}

            <section className="aeil-word-grid">

                {words.map((word) => (

                    <button
                        key={word.name}
                        type="button"
                        className="aeil-word-card"
                        onClick={() => setSelectedWord(word)}
                        aria-label={`Otevřít ${word.name}`}
                    >

                        <div className="aeil-word-card-image">

                            <img
                                src={word.image}
                                alt={word.name}
                            />

                        </div>

                    </button>

                ))}

            </section>


            {/* =====================================================
                SVITEK
            ===================================================== */}

            {selectedWord && (

                <div
                    className="aeil-word-overlay"
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Informace o pojmu ${selectedWord.name}`}
                >


                    {/* =================================================
                        KŘÍŽEK
                    ================================================= */}

                    <button
                        type="button"
                        className="aeil-word-close"
                        onClick={closeWord}
                        aria-label="Zavřít"
                    >
                        ×
                    </button>


                    {/* =================================================
                        SVITEK
                    ================================================= */}

                    <div className="aeil-word-scroll">

                        <img
                            src={selectedWord.scroll}
                            alt={selectedWord.name}
                            className="aeil-word-scroll-image"
                        />


                        {/* =================================================
                            TEXT
                        ================================================= */}

                        <div className="aeil-word-scroll-text">

    <p>
        {selectedWord.text}
    </p>

</div>
                    </div>

                </div>

            )}

        </main>

    );

}