import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./AEILRacesPage.css";

import aeilText from "../assets/images/AEIL/aeil-text.png";
import aeilLine from "../assets/images/AEIL/aeil-line.png";
import aeilBackground from "../assets/images/AEIL/aeil-lace.png";
import aeilCharactersBack from "../assets/images/AEIL/aeil-characters-back.png";

import raceFrame from "../assets/frames/aeil-character-info.png";

import Succubus from "../assets/images/AEIL/races/Succubus.png";
import Drakonos from "../assets/images/AEIL/races/Drakonos.png";
import Kostej from "../assets/images/AEIL/races/Kostej.png";
import Clovek from "../assets/images/AEIL/races/Clovek.png";
import Ssakar from "../assets/images/AEIL/races/Ssakar.png";
import Khessor from "../assets/images/AEIL/races/Khessor.png";
import Mora from "../assets/images/AEIL/races/Mora.png";
import Runakhar from "../assets/images/AEIL/races/Runakhar.png";
import Shaver from "../assets/images/AEIL/races/Shaver.png";
import Nerei from "../assets/images/AEIL/races/Nerei.png";

import SuccubusScroll from "../assets/images/AEIL/races/succubus-svitek.png";
import DrakonosScroll from "../assets/images/AEIL/races/Drakonos-svitek.png";
import KostejScroll from "../assets/images/AEIL/races/Kostej-svitek.png";
import ClovekScroll from "../assets/images/AEIL/races/Clovek-svitek.png";
import SsakarScroll from "../assets/images/AEIL/races/Ssakar-svitek.png";
import KhessorScroll from "../assets/images/AEIL/races/Khessor-svitek.png";
import MoraScroll from "../assets/images/AEIL/races/Mora-svitek.png";
import RunakharScroll from "../assets/images/AEIL/races/Runakhar-svitek.png";
import ShaverScroll from "../assets/images/AEIL/races/Shaver-svitek.png";
import NereiScroll from "../assets/images/AEIL/races/Nerei-svitek.png";


const races = [
    {
        name: "Succubus",
        image: Succubus,
        scroll: SuccubusScroll,
        text: `Succubi jsou vzácná a tajemná stvoření, o jejichž původu a skutečné povaze se mezi lidmi vyprávějí nejrůznější legendy. Na první pohled se od ostatních humanoidních ras nemusí nijak výrazně lišit. Jejich skutečná podstata však zůstává skrytá za dokonale vytvořenou podobou a schopností přizpůsobit se prostředí i lidem kolem sebe.

Jsou mimořádně vnímaví k emocím a dokážou rozpoznat touhy, slabosti i obavy druhých. Přirozeně působí přitažlivě a jejich přítomnost může mít na okolí nezvyklý vliv. Nejde však pouze o vzhled – succubi dokážou pracovat s pozorností, emocemi a vnímáním druhých tak, že člověk často sám nepozná, kde končí jeho vlastní rozhodnutí.

Jejich největší předností je schopnost manipulace. Succubus nemusí druhého přinutit. Mnohem účinnější je přesvědčit ho, že to, co dělá, je jeho vlastní volba. Dokáže být okouzlující, laskavý, zranitelný i nebezpečný – podle toho, co od něj situace vyžaduje.

Succubi bývají trpěliví a málokdy jednají bezdůvodně. Dokážou dlouho pozorovat, čekat a postupně odhalovat slabá místa svého okolí. Jejich skutečná síla proto často nespočívá v přímém boji, ale v tom, jak snadno dokážou změnit člověka zevnitř.

O jejich schopnostech, historii i způsobu života se dochovalo jen málo spolehlivých záznamů. Většina znalostí pochází z pověstí, útržků starých kronik a příběhů lidí, kteří se s nimi údajně setkali.

A právě proto kolem nich dodnes existuje jediná jistota:

Nikdy není snadné poznat, kdy succubus ukazuje svou skutečnou tvář.`
    },
    {
        name: "Drakonoš",
        image: Drakonos,
        scroll: DrakonosScroll,
        text: `Drakonoši jsou pradávná rasa, o které se dodnes vyprávějí legendy. Podle pověstí má každý z nich uvnitř sebe ukrytého draka — prastarou sílu, která kdysi dokázala převzít jejich tělo a proměnit je v samotného draka.

Kdysi měli být Drakonoši považováni za nejsilnější rasu vůbec. Jejich síla spočívala v ničivé a agresivní moci, kterou dokázali rozpoutat. Dnes však z jejich dávné síly zůstaly jen slabé ozvěny. Jen u některých se objevují schopnosti ovládat oheň.

Jejich těla jsou přirozeně teplejší než těla ostatních lidí a často mají jantarové oči. O těch nejvzácnějších se říká, že jejich oči kdysi připomínaly tekuté zlato.

Stejně jako draci střeží své poklady, i Drakonoši mají pověst bytostí, které shromažďují bohatství. To, co považují za své, si chrání s téměř nepřirozenou posedlostí. Bývají majetničtí, sobečtí a jen neradi se dělí o to, co jim podle jejich názoru náleží. Říká se, že čím je pro ně něco cennější, tím zuřivěji to brání.

O tom, co se s jejich schopnostmi stalo, se vedou jen dohady. Drakonoši sami už možná ani nevědí, zda v nich jejich drak skutečně stále dřímá.

Kdysi v nich žili draci. Dnes v nich zůstává jen jejich ozvěna.`
    },
    {
        name: "Kostěj",
        image: Kostej,
        scroll: KostejScroll,
        text: `Kostějové jsou pradávná a dnes téměř vyhynulá rasa. Nikdy neměli vlastní zemi — od nepaměti byli ostatními rasami loveni pro své kosti, které jsou téměř nezničitelné a používají se k výrobě těch nejodolnějších zbraní.

Kostějové dokáží ovládat vlastní kosti, nechat je znovu dorůstat a měnit jejich podobu. Mohou z nich vytvářet čepele, hroty či jiné zbraně a jejich tělo se dokáže zotavit i ze zranění, která by jinou bytost zahubila. Jejich život se proto měří jinak než život ostatních a někteří z nich pamatují celé věky.

Kostějové jsou hluboce spojeni s přírodou a jejími cykly. Nevěří v bohy ani v božský soud. Věří v cyklus zrození a smrti, v němž nic skutečně nekončí. Smrt pro ně není zánikem, ale návratem domů.

Věří, že když jejich život skončí, Aureoly — nádherné, laskavé bytosti spojené s lesem — odvedou jejich duši zpět mezi stromy. Tělo se stane součástí země, kosti spočinou v půdě a to, co kdysi bylo jedním životem, dá vzniknout životům novým. Mrtví tak uvolňují své místo živým a vracejí světu to, co jim kdysi dal.

Maso zemi.
Dech větru.
Duši lesu.`
    },
    {
        name: "Člověk",
        image: Clovek,
        scroll: ClovekScroll,
        text: `Lidé jsou nejrozšířenější a zároveň nejméně předvídatelnou rasou tohoto světa.

Nemají vrozenou magii jako některé jiné národy, přesto dokázali vybudovat království, města i říše, které zasahují hluboko do historie tohoto světa.

Jejich největší silou je schopnost přizpůsobit se. Člověk může být učencem, válečníkem i vládcem — a často vším zároveň.`
    },
    {
        name: "Ssakar",
        image: Ssakar,
        scroll: SsakarScroll,
        text: `Ssakar jsou pradávná rasa magických bytostí, jejichž původ je dnes stejně nejasný jako jejich osud. Nemají vlastní zemi ani místo, které by mohli nazývat domovem. Jejich život je spojen s jedinou potřebou — energií.

Ssakarové se jí živí a dokáží ji vysávat ze všeho, co je obklopuje. Z magie, z lidí, ze zvířat i ze samotné přírody a země. Bez dostatku energie jejich těla slábnou a nakonec zemřou. Díky tomu však žijí neobyčejně dlouho a mohou přežít celé lidské generace.

Jejich symbolem je had požírající vlastní ocas — obraz nekonečného cyklu, v němž se energie spotřebovává, zaniká a znovu vzniká.

Ssakarové mají také schopnost předat svou magii člověku. Tak vznikají Khessarové, nepravé magické bytosti, které dokáží využívat sílu, jež jim byla předána. Tato síla má však své hranice. Lidské tělo ji nedokáže nést navždy. Čím déle a více magie Khessar používá, tím více z něj energie vysává samotný život. Nakonec jeho tělo začne kamenět, až z něj nezůstane nic než černý krystal.

Tímto způsobem vznikl Obscyr.

Tajemství, které dnes nikdo nezná.

Kdysi byli Ssakarové zotročeni Vethorem, který je nutil předávat svou magii lidem a vytvářet tak mocné vojáky. Ssakarové však svým pánům nikdy neprozradili cenu, kterou za tuto moc zaplatí. Když začali Khessarové jeden po druhém umírat a měnit se v kámen, Vethor většinu Ssakarů nechal vyvraždit.

Dnes jsou Ssakarové považováni za vyhynulé.

Přesto se šeptá, že kdesi hluboko v pustině stojí Chrám umírajících — zapomenuté místo, kde poslední Ssakarové stále čekají.

A možná stále čekají na návrat toho, co jim bylo ukradeno.`
    },
    {
        name: "Khessor",
        image: Khessor,
        scroll: KhessorScroll,
        text: `Khessarové jsou lidé, kterým byla Ssakarem předána magie. Nejsou přirozeně magickou rasou — jejich schopnosti vznikly umělým předáním síly, a proto se jim říká nepravé magické bytosti.

Magie jim propůjčuje schopnosti, které jsou pro obyčejného člověka nemožné. Jejich tělo však není uzpůsobeno k tomu, aby tuto sílu neslo neomezeně. Každé použití magie je přibližuje ke konci.

Na krku Khessarů se proto objevuje tetování hada, které znázorňuje jejich zbývající čas. Had obepíná krk a postupně požírá vlastní ocas. Čím více magie Khessar používá, tím více se had uzavírá. Když se had sám do sebe zakousne, začíná tělo svého nositele kamennět.

Magie postupně vysává jeho život, až se tělo promění v kámen.

Z kamene, který po Khessarovi zůstane, vzniká Obscyr.

Dnes však toto tajemství téměř nikdo nezná. Většina Khessarů vznikla v době, kdy byli Ssakarové zotročeni Vethorem a nuceni vytvářet z lidí magické vojáky. Velká část z nich zemřela právě na následky magie a z jejich zkamenělých těl zůstaly pouze černé krystaly.`
    },
    {
        name: "Mora",
        image: Mora,
        scroll: MoraScroll,
        text: `Mory jsou mýtické bytosti, které jsou dnes uctívány jako božstva. Jsou výhradně ženské, všechny mají bílé vlasy a zcela černé oči. Mora se však nerodí. Morou se dívka stává.

Vše začíná sny o Chrámu Mor. Dívka v nich postupně spatřuje místo, které nikdy předtím neznala. Jednoho dne se probudí s černýma očima a její osud je zpečetěn. Mory se poté objeví u její rodiny. Rodiče jim svou dceru dobrovolně předají — stát se Morou je považováno za velikou poctu a její proměnu slaví celá vesnice. Dívka se však už nikdy nevrátí.

Mory dokáží vstupovat do lidských vzpomínek, měnit je, odebírat i vkládat nové. Přicházejí k umírajícím, od nichž přijímají jejich vzpomínky, aby žádný prožitý život nebyl zapomenut. Člověk může Moru také vyhledat a požádat ji o změnu své minulosti. Za její službu však musí zaplatit — jednou ze svých vlastních vzpomínek.

Každá vzpomínka, kterou Mora vezme, má svou cenu. Pokaždé, když použije svou moc, sama zapomene něco ze svého života. Jako první ze všeho zapomene své vlastní jméno. V tu chvíli dostane nové jméno, inspirované hvězdami, a právě tehdy se její proměna dokončí. Od tohoto okamžiku už není člověkem. Je Morou.

S každým dalším použitím své moci ztrácí další části sebe sama. Zapomíná svou rodinu, své dětství, své touhy i důvod, proč kdy žila. V jejích černých očích se přitom objevují světlé body, jako hvězdy na noční obloze. Nad Morou začíná létat můra, která v sobě nese vzpomínku, jež byla odebrána.

Mory jsou však více než jen jednotlivé bytosti. Údajně tvoří jedno společné vědomí, propojené všemi vzpomínkami, které kdy uchovaly. Říká se, že díky tomu znají minulost, přítomnost i budoucnost a že žádné tajemství před nimi nezůstane skryté.

Nikdo ale neví, zda je to skutečně pravda.

Mory jsou uzavřené společenství, které s ostatními téměř nekomunikuje. Nikdo neví, co si mezi sebou říkají, co skutečně vědí ani zda vůbec vnímají čas stejně jako ostatní. Lidé mohou znát jejich příběhy, mohou se jich bát i uctívat je — ale nikdo nikdy skutečně nepoznal, co se skrývá za jejich černýma očima.

Nakonec Mora zapomene úplně všechno. Přestane být člověkem i bytostí, kterou kdysi byla, a vrací se do Chrámu Mor.

V jeho nitru se nachází Síň zapomenutých, kde sedí všechny Mory, které dospěly do této poslední fáze. Sedí tam nehybně, obklopené můrami, a sborově opakují stále stejná slova. Ael'sha va'ren, va'ren ael'sha. Nikdo neví, co říkají. Na nic nereagují, nikoho nevnímají. Pouze tam jsou.

A přesto jejich černé oči stále září hvězdami.

Protože i když Mora zapomene sama sebe, její vzpomínky nezmizí.`
    },
    {
        name: "Runakhar",
        image: Runakhar,
        scroll: RunakharScroll,
        text: `Runakhar jsou vzácná rasa legendárních mistrů kovářů, jejichž schopnosti nemají mezi ostatními obdoby. Jsou hluboce spojeni se zemí, kamenem a kovy a dokáží ovládat samotnou hmotu.

Dokážou přeměnit jeden materiál v jiný, tvarovat kámen holýma rukama a zpracovat téměř cokoliv, co jim země nabízí. To, co je pro běžného kováře nemožné, je pro Runakhara otázkou času a dovednosti.

Je jich jen málo a jejich tajemství si střeží po generace. Právě proto jsou nesmírně ceněni. Z jejich dílen pocházejí zbraně, zbroje a nástroje, které žádný obyčejný kovář nedokáže vytvořit.

Říká se, že Runakharové pocházejí z Karagoru, z míst hluboko pod povrchem země, kde se kámen taví žárem a hory ukrývají své nejstarší poklady. Nikdo však neví, zda je to skutečně jejich původ, nebo jen legenda.

Jejich moc spočívá v tom, co dokáží vytvořit z kusu kamene a kovu.`
    },
    {
        name: "Sha'ver",
        image: Shaver,
        scroll: ShaverScroll,
        text: `Sha'ver, známí jako Děti šepotu, jsou mýtická rasa, o které se říká, že vznikla v okamžiku, kdy první bytost poprvé promluvila. Z jejího hlasu údajně povstali první Sha'ver a s nimi i jejich prastará moc — Jazyk prvního slova.

Sha'ver jím dokázali vyslovit kletby a nezvratné příkazy, kterým ostatní nemohli vzdorovat. Jejich tváře a jazyky byly pokryté prastarými runami Aš'karu a jejich slova měla moc měnit samotný běh věcí.

Podle mýtů však každé jejich slovo mělo svůj protipól. Nic nemohlo být získáno bez náhrady — co bylo vzato, muselo být navráceno něčím jiným. Sha'ver tak údajně dokázali dokonce přivést mrtvého zpět k životu, ale za jeho život musel zemřít někdo jiný. Kdo zemře jako cena, však Sha'ver sami nemohli ovlivnit. Rovnováha si vždy vzala svou daň.

Podle legend povstali ze solné pouště. Měli špičaté uši, kterými dokázali vnímat ševelení větru, a byli obávanými manipulátory. Proti jejich slovům nebylo možné bojovat zbraněmi.

Dnes už téměř nikdo nevěří, že Sha'ver skutečně existovali. Jsou považováni za nejméně lidskou ze všech známých ras a jejich příběhy se dochovaly pouze v dávných pověstech.

Pro většinu světa jsou jen pohádkou.
Ale pokud první slovo skutečně vytvořilo život, kdo může říct, že jeho hlas už dávno umlkl?

Ael'sha va'ren, va'ren ael'sha.`
    },
    {
        name: "Nerei",
        image: Nerei,
        scroll: NereiScroll,
        text: `Nerei jsou pradávná rasa válečnic, o které dnes vyprávějí především mýty. Podle legendy všechny pocházely z jediné bohyně Nerei, paní bouře, která dokázala ovládat její ničivou sílu.

Nerei byly nepřirozeně rychlé a zrozené pro boj. Byly divoké, nespoutané a nezkrotné jako bouře sama. Jejich oči měly údajně zářit jako blesky na noční obloze a jejich síla byla stejně náhlá a ničivá jako úder hromu.

Byly hluboce spojeny s vodou. Dokázaly ji cítit na obrovské vzdálenosti a žádná jiná rasa se jim nevyrovnala v plavání. Moře, déšť i bouře pro ně nebyly překážkou, ale součástí jejich přirozenosti.

Dnes už Nerei neexistují a zůstaly pouze v legendách. Jejich jméno však nezmizelo. Bohyně Nerei je stále uctívána v mnoha chrámech a její kult je nejsilnější v Xalytharu, kde je považována za paní moře, bouří a ochránkyni Bouřlivých.

Nerei nezemřely. Jen se staly bouří, která nikdy nepřestala.`
    }
];


export default function AEILRacesPage() {

    const navigate = useNavigate();
    const [selectedRace, setSelectedRace] = useState(null);


    useEffect(() => {

        if (!selectedRace) {
            document.body.style.overflow = "";
            return;
        }

        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = "";
        };

    }, [selectedRace]);


    function closeRace() {
        setSelectedRace(null);
    }


    return (
        <main
            className="aeil-races-page"
            style={{
                "--aeil-races-background": `url(${aeilCharactersBack || aeilBackground})`
            }}
        >

            {/* =====================================================
                HLAVIČKA
            ===================================================== */}

            <header className="aeil-races-header">

                <button
                    type="button"
                    className="aeil-races-back"
                    onClick={() => navigate("/books/aeil")}
                >
                    ← ZPĚT KE KNIZE
                </button>


                <img
                    src={aeilText}
                    alt="AEIL"
                    className="aeil-races-logo"
                />


                <img
                    src={aeilLine}
                    alt=""
                    className="aeil-races-line"
                    aria-hidden="true"
                />

            </header>


            {/* =====================================================
                RASY
            ===================================================== */}

            <section className="aeil-races-grid">

                {races.map((race) => (

                    <button
                        key={race.name}
                        type="button"
                        className="aeil-race-card"
                        onClick={() => setSelectedRace(race)}
                    >

                        <span className="aeil-race-card-circle">

                            <img
                                src={race.image}
                                alt={race.name}
                                className="aeil-race-card-photo"
                            />

                            <img
                                src={raceFrame}
                                alt=""
                                className="aeil-race-card-frame"
                                aria-hidden="true"
                            />

                        </span>


                        <span className="aeil-race-card-name">
                            {race.name}
                        </span>

                    </button>

                ))}

            </section>


            {/* =====================================================
                DETAIL RASY – SVITEK
            ===================================================== */}

            {selectedRace && (

                <div
                    className="aeil-race-overlay"
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Informace o rase ${selectedRace.name}`}
                >

                    <button
                        type="button"
                        className="aeil-race-close"
                        onClick={closeRace}
                        aria-label="Zavřít"
                    >
                        ×
                    </button>


                    <div className="aeil-race-scroll-area">

                        <img
                            src={selectedRace.scroll}
                            alt=""
                            className="aeil-race-scroll-image"
                            aria-hidden="true"
                        />


                        <div className="aeil-race-scroll-content">

                            <p>
                                {selectedRace.text}
                            </p>

                        </div>

                    </div>

                </div>

            )}

        </main>
    );
}
