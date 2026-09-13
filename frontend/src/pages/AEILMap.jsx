import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./AEILMap.css";

import mapImage from "../assets/images/AEIL/Map/Map.png";
import arrowImage from "../assets/images/AEIL/Map/arrow.png";

import Vethor from "../assets/images/AEIL/Map/Vethor.png";
import Xalythar from "../assets/images/AEIL/Map/Xalythar.png";
import Corven from "../assets/images/AEIL/Map/Corven.png";
import Karagor from "../assets/images/AEIL/Map/Karagor.png";
import Ignisheim from "../assets/images/AEIL/Map/Ignisheim.png";
import Valmor from "../assets/images/AEIL/Map/Valmor.png";
import Arena from "../assets/images/AEIL/Map/Arena.png";


const locations = [

    {
        name: "Vethor",
        image: Vethor,

        top: "5%",
        left: "35%",

        text: `Vethor je největší a nejmocnější království světa. Jeho bohatství pochází především z Obscyru, vzácného černého krystalu, který se těží pouze na jeho území. Díky němu si Vethor vybudoval obrovskou armádu a získal vliv, před kterým se ostatní království jen těžko ubrání.

Vethor je známý také svou úrodnou půdou, která poskytuje dostatek jídla pro jeho obyvatele i armádu. Přestože je země bohatá, život v ní není snadný. Vethor je veden tvrdou rukou a zákony jsou přísné.

Jeho hlavním městem je Ravora, honosné město ukryté za mohutnými hradbami. Nikdy nebylo dobyto. Uprostřed města stojí velkolepý královský palác a Obscyrová síň, sídlo vethorské moci.

Na trůnu sedí král Atherion Nocteris, obávaný a respektovaný vládce Vethoru. Jeho dědicem je korunní princ Valen Theravian Nocteris, připravovaný od narození na převzetí království. Po jeho boku stojí princezna Lyssandra Elysea Nocteris, jediná dcera krále.

Vethor je země, kterou málokdo miluje.

Ale téměř každý se jí bojí.`
    },


    {
        name: "Xalythar",
        image: Xalythar,

        top: "55%",
        left: "8%",

        text: `Xalythar je drsné souostroví zmítané větrem a bouřemi. Jeho obyvatelé, známí jako Bouřliví, patří k nejtvrdším lidem světa. Žijí především z rybolovu, obchodu a lovu perel, které se ukrývají v okolních vodách.

Xalythar má největší flotilu na světě a na moři nemá téměř žádného soupeře. Jeho stovky lodí kontrolují obchodní cesty a téměř veškeré zboží, které prochází okolními vodami. Nejslavnější jsou Černopřídě, obávané bojové lodě s černými příděmi, které jsou symbolem xalytharské námořní síly.

Hlavním městem je Bouřný hrot, přístavní město vystavěné kolem hluboké zátoky, která poskytuje útočiště i těm největším lodím. Nad přístavem stojí palác z mušlí a lastur, jehož stěny jsou pokryté perlami, ulitami a poklady vylovenými z moře. Celá zátoka i přístav převzaly jméno města a mezi Bouřlivými se říká, že kdo ovládá Bouřný hrot, drží v rukou celé moře.

Bouřliví však nejsou pouze obchodníci. Často se chovají jako piráti, přepadávají lodě a berou si, co považují za své. Jen málokdo se jim odváží postavit na moři.

Společnost Xalytharu ovládají muži. Ženy mají podřízené postavení a jejich úlohou je především sloužit mužům a starat se o domácnost. Jejich postavení je o to zvláštnější, že Xalythar zároveň uctívá Nerei, bohyni bouří a paní moře.

Xalythar je krásný i nebezpečný zároveň — plný tropických ostrovů, perel, slaného vzduchu a nekonečného moře.

Na souši vládnou muži. Na moři vládne Xalythar.`
    },


    {
        name: "Corven",
        image: Corven,

        top: "14%",
        left: "88%",

        text: `Corven je vzdálená oáza uprostřed rozlehlé pouště, odříznutá od zbytku světa. Je známá svou exotikou, bohatstvím a vzácným zbožím, které se nikde jinde nevyskytuje. Z Corvenu pochází zlato, vzácné koření, drahé látky a černé kadidlo, ceněné po celém světě.

Uprostřed oázy stojí honosný Palác tisíce věží, kde žije místní smetánka obklopená přepychem. Pro vyvolenou vrstvu je Corven místem krásy, slavností a nekonečného bohatství.

Stačí však opustit palác a obraz se změní.

Kolem něj se rozkládají slumy a chudinské čtvrti, mezi chudinou nazývány Krysí prdel, kde žijí lidé v naprosté bídě. V ulicích žijí stovky sirotků, jejichž rodiče padli za oběť nemocem, válkám nebo otroctví. Rovnost v Corvenu neexistuje a otroctví je běžnou součástí života.

Corven si žije podle vlastních pravidel a od okolního světa zůstává téměř odříznutý. Cesta do něj je dlouhá a nebezpečná, a proto si zachovává vlastní kulturu, zvyky i tajemství.

Z dálky vypadá Corven jako ráj. Zblízka je těžké poznat, kde končí přepych a začíná bída.`
    },


    {
        name: "Karagor",
        image: Karagor,

        top: "13%",
        left: "57%",

        text: `Karagor je drsné a chudé království ukryté hluboko mezi horami. Jeho území je nehostinné, půda chudá a život v horách tvrdý. Celé království působí spíše jako obrovská pevnost než jako země.

Jeho hlavní sídlo je pevnost vytesaná přímo do skály, obklopená strmými horami, které Karagor chrání před okolním světem.

Karagor obývají především válečné kmeny, pro které jsou boj, síla a čest základem života. Království však nemá jediného skutečného vládce. Jednotlivé kmeny mají své náčelníky a vládce, kteří mezi sebou neustále soupeří o moc a území.

Karagor je proto roztříštěný a nejednotný. Když se kmeny spojí, představují nebezpečnou vojenskou sílu. Když však bojují mezi sebou, je Karagor zmítán neustálými konflikty.

V Karagoru nevládne koruna. Vládne ten, kdo si ji dokáže vzít.`
    },


    {
        name: "Ignisheim",
        image: Ignisheim,

        top: "74%",
        left: "82%",

        text: `Ignisheim není království. Je to strohá, chladná a téměř nedobytná vojenská pevnost stojící na místě, kde kdysi bývalo království Baelor. Z jedné strany ji chrání vysoké útesy a moře, z druhé mohutné hradby a nekonečné pláně, na kterých lze spatřit nepřítele na míle daleko.

Kdysi byla země kolem pevnosti úrodná. Pak se však půda změnila v mrtvou a nehostinnou krajinu a obyvatelé Baeloru odešli. Dnes se zde shromažďuje Kaelenova armáda, tvořená lidmi ze všech koutů světa — odpadlíky, bývalými otroky, žoldnéři, vojáky cizích zemí i obyvateli království, která Kaelen porazil.

Právě kvůli Kaelenovi se Ignisheimu začalo říkat Dračí hnízdo. Pevnost je jeho hlavním sídlem a místem, odkud se jeho vojska vydávají do světa. Říká se, že stejně jako drak shromažďuje svůj poklad, Kaelen zde shromažďuje své vojáky.

Pláně před pevností se staly dějištěm nespočtu bitev. Dnes se jim říká Pustina korouhví, protože mezi mrtvou trávou stále stojí staré praporce a pod zemí leží kosti padlých. Celé místo páchne smrtí a připomíná všechny války, které se zde odehrály.

Ignisheim je také domovem Runakharů, legendárních mistrů kovářů, kteří vyrábějí jedinečnou zbroj známou jako Kharův pancíř. Její výroba je tajemstvím, které si Runakharové pečlivě střeží.

Ignisheim není domov. Je to místo, kde se lidé připravují na válku.`
    },


    {
        name: "Valmor",
        image: Valmor,

        top: "70%",
        left: "46%",

        text: `Valmor je malé a nehostinné království známé především svými rozsáhlými železnými doly. Podnebí je drsné, půda neúrodná a život zde nikdy nebyl snadný. Přesto má Valmor pro ostatní království zásadní význam — jeho doly poskytují velkou část kovu, ze kterého se vyrábějí zbraně a zbroje.

V čele Valmoru stojí král Iskar, tvrdý vládce, pod jehož vládou se těžba nikdy nezastavuje. V dolech pracují otroci a další dělníci v nelidských podmínkách. Těžká práce a železo jsou základem celého království.

Král Iskar žije v paláci, kterému se posměšně říká Rudý. Nestojí v něm zlato ani drahé kameny a svou nádherou se nemůže rovnat palácům ostatních království. Stojí přímo na rudé železné rudě, nedaleko dolů, obklopený kouřem, prachem a neustálým hlukem těžby. Říká se, že Rudý není palác pro krále, ale pro železo, které král vlastní.

Iskar má jedinou dceru, princeznu Isidoru, která je jeho dědičkou. O princezně se však mezi lidmi šeptá, že kulhá a je ošklivá. Nikdo mimo královský dvůr ji téměř nevídá, a tak není jasné, co je pravda a co jen kruté řeči.

Valmor je chudý ve srovnání s ostatními královstvími, ale jeho železo potřebuje celý svět.

V jeho dolech se těží kov, ze kterého se vyrábějí války.`
    },

    {
        name: "Arenath",
        image: Arena,

        top: "35%",
        left: "80%",

        text: `Arenath byla nejstarší a nejproslulejší aréna světa. Po tisíce let se v ní scházeli nejmocnější lidé z království, aby sledovali své otroky bojovat na život a na smrt. Nikdo už neví, kdo Arenath založil ani proč vznikla. Její tradice však přežila nespočet generací.

Do Arenathu směli vstoupit pouze ti nejmocnější. Pozvání do jejích tribun bylo otázkou prestiže a kolem arény se točily obrovské částky zlata. Konaly se zde sázky, obchody, směny otroků i politická jednání. Válečníci byli drženi v celách hluboko pod arénou, kde byli cvičeni a připravováni na další souboje.

Nejcennější byli otroci s magickými schopnostmi. Byli nesmírně vzácní a jejich zápasy patřily k těm nejvyhledávanějším.

Právě v Arenathu měl kdysi bojovat Kaelen proti svému nejlepšímu příteli. Když měl zasadit poslední ránu, odmítl ho zabít. Jeho magie se vymkla kontrole a výbuch pohltil celou arénu. Zemřeli všichni uvnitř — otroci, páni, diváci i ti, kteří přišli obchodovat.

Dnes je na místě Arenathu popelavá pustina, kde už neroste tráva a země je zjizvená nekonečným žárem. Vítr zde dodnes roznáší popel tisíců mrtvých.

Od té doby se Kaelenovi říká Král na kostech.`
    }

];


export default function AEILMap() {

    const navigate = useNavigate();

    const [selectedLocation, setSelectedLocation] = useState(null);


    useEffect(() => {

        if (!selectedLocation) {

            document.body.style.overflow = "";

            return;

        }

        document.body.style.overflow = "hidden";


        return () => {

            document.body.style.overflow = "";

        };

    }, [selectedLocation]);


    const closeLocation = () => {

        setSelectedLocation(null);

    };


    return (

        <main
            className="aeil-map-page"
            style={{
                "--aeil-map-background": `url(${mapImage})`
            }}
        >


            {/* =====================================================
                ZPĚT
            ===================================================== */}

            <button
                type="button"
                className="aeil-map-back"
                onClick={() => navigate("/books/aeil")}
            >
                ← Zpět
            </button>


            {/* =====================================================
                ŠIPKY NA MAPĚ
            ===================================================== */}

            <section className="aeil-map-locations">

                {locations.map((location) => (

                    <button
                        key={location.name}
                        type="button"
                        className="aeil-map-marker"
                        style={{
                            top: location.top,
                            left: location.left
                        }}
                        onClick={() => setSelectedLocation(location)}
                        aria-label={`Otevřít ${location.name}`}
                    >

                        <img
                            src={arrowImage}
                            alt=""
                            className="aeil-map-arrow"
                            aria-hidden="true"
                        />

                    </button>

                ))}

            </section>


            {/* =====================================================
                DETAIL MÍSTA
            ===================================================== */}

            {selectedLocation && (

                <div
                    className="aeil-map-overlay"
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Informace o místě ${selectedLocation.name}`}
                >


                    {/* =================================================
                        KŘÍŽEK
                    ================================================= */}

                    <button
                        type="button"
                        className="aeil-map-close"
                        onClick={closeLocation}
                        aria-label="Zavřít"
                    >
                        ×
                    </button>


                    {/* =================================================
                        JEDEN SVITEK PŘES CELOU OBRAZOVKU
                    ================================================= */}

                    <div className="aeil-map-scroll">


                        {/* =================================================
                            CELÝ OBRÁZEK SVITKU
                        ================================================= */}

                        <img
                            src={selectedLocation.image}
                            alt={selectedLocation.name}
                            className="aeil-map-location-image"
                        />


                        {/* =================================================
                            TEXT V PRAVÉ POLOVINĚ OBRÁZKU
                        ================================================= */}

                        <div className="aeil-map-image-text">

                            <h2>
                                {selectedLocation.name}
                            </h2>

                            <p>
                                {selectedLocation.text}
                            </p>

                        </div>


                    </div>

                </div>

            )}

        </main>

    );

}
