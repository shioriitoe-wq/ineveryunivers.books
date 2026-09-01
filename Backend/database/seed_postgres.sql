-- PostgreSQL seed generated from seed(1).sql
BEGIN;

CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    status TEXT NOT NULL,
    type TEXT NOT NULL,
    parent_id INTEGER,
    uses_volumes INTEGER NOT NULL DEFAULT 0,
    uses_parts INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS volumes (
    id SERIAL PRIMARY KEY,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    number INTEGER,
    title TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS parts (
    id SERIAL PRIMARY KEY,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    volume_id INTEGER REFERENCES volumes(id) ON DELETE CASCADE,
    number INTEGER,
    title TEXT NOT NULL,
    theme TEXT NOT NULL DEFAULT 'summer'
);

CREATE TABLE IF NOT EXISTS characters (
    id SERIAL PRIMARY KEY,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quote TEXT NOT NULL DEFAULT '',
    content_html TEXT NOT NULL DEFAULT '',
    main_image TEXT,
    header_image TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    published INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    main_video TEXT
);

CREATE TABLE IF NOT EXISTS chapters (
    id SERIAL PRIMARY KEY,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    volume_id INTEGER REFERENCES volumes(id) ON DELETE SET NULL,
    part_id INTEGER REFERENCES parts(id) ON DELETE SET NULL,
    number INTEGER NOT NULL,
    title TEXT NOT NULL,
    content_html TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'concept',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS character_details (
    id SERIAL PRIMARY KEY,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    value TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS character_images (
    id SERIAL PRIMARY KEY,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    image TEXT NOT NULL,
    caption TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS character_quotes (
    id SERIAL PRIMARY KEY,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    quote TEXT NOT NULL,
    author TEXT NOT NULL DEFAULT '',
    volume_id INTEGER REFERENCES volumes(id) ON DELETE SET NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS character_relationships (
    id SERIAL PRIMARY KEY,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    related_character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL,
    UNIQUE(character_id, related_character_id)
);

CREATE TABLE IF NOT EXISTS character_volumes (
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    volume_id INTEGER NOT NULL REFERENCES volumes(id) ON DELETE CASCADE,
    PRIMARY KEY(character_id, volume_id)
);

-- books
INSERT INTO books
(id, title, status, type, parent_id, uses_volumes, uses_parts)
VALUES
(1, '(Ne)začalo to..', 'Rozpracováno', 'series', NULL, 1, 1)
ON CONFLICT DO NOTHING;

INSERT INTO books
(id, title, status, type, parent_id, uses_volumes, uses_parts)
VALUES
(2, 'AEIL', 'Rozpracováno', 'standalone', NULL, 0, 0)
ON CONFLICT DO NOTHING;

INSERT INTO books
(id, title, status, type, parent_id, uses_volumes, uses_parts)
VALUES
(3, 'Vespera', 'Rozpracováno', 'standalone', NULL, 0, 0)
ON CONFLICT DO NOTHING;

SELECT setval(
    pg_get_serial_sequence('books', 'id'),
    GREATEST((SELECT COALESCE(MAX(id), 1) FROM books), 1),
    true
);

-- volumes
INSERT INTO volumes
(id, book_id, number, title)
VALUES
(1, 1, 1, '(Ne)začalo to létem')
ON CONFLICT DO NOTHING;

INSERT INTO volumes
(id, book_id, number, title)
VALUES
(2, 1, 2, '(Ne)začalo to správně')
ON CONFLICT DO NOTHING;

INSERT INTO volumes
(id, book_id, number, title)
VALUES
(3, 1, 3, '(Ne)začalo to v temnotě')
ON CONFLICT DO NOTHING;

INSERT INTO volumes
(id, book_id, number, title)
VALUES
(4, 1, 4, '(Ne)začalo to tady')
ON CONFLICT DO NOTHING;

INSERT INTO volumes
(id, book_id, number, title)
VALUES
(5, 1, 5, '(Ne)začalo to naším příběhem')
ON CONFLICT DO NOTHING;

SELECT setval(
    pg_get_serial_sequence('volumes', 'id'),
    GREATEST((SELECT COALESCE(MAX(id), 1) FROM volumes), 1),
    true
);

-- parts
INSERT INTO parts
(id, book_id, volume_id, number, title, theme)
VALUES
(1, 1, 1, 1, 'Léto', 'summer')
ON CONFLICT DO NOTHING;

INSERT INTO parts
(id, book_id, volume_id, number, title, theme)
VALUES
(2, 1, 1, 2, 'Podzim', 'autumn')
ON CONFLICT DO NOTHING;

INSERT INTO parts
(id, book_id, volume_id, number, title, theme)
VALUES
(3, 1, 1, 3, 'Zima', 'winter')
ON CONFLICT DO NOTHING;

INSERT INTO parts
(id, book_id, volume_id, number, title, theme)
VALUES
(4, 1, 1, 4, 'Jaro', 'spring')
ON CONFLICT DO NOTHING;

INSERT INTO parts
(id, book_id, volume_id, number, title, theme)
VALUES
(5, 1, 2, 1, 'Zklamaný', 'summer')
ON CONFLICT DO NOTHING;

INSERT INTO parts
(id, book_id, volume_id, number, title, theme)
VALUES
(6, 1, 2, 2, 'Nedůvěřivý', 'summer')
ON CONFLICT DO NOTHING;

INSERT INTO parts
(id, book_id, volume_id, number, title, theme)
VALUES
(7, 1, 2, 3, 'Toxický', 'summer')
ON CONFLICT DO NOTHING;

INSERT INTO parts
(id, book_id, volume_id, number, title, theme)
VALUES
(8, 1, 2, 4, 'Nezkušený', 'summer')
ON CONFLICT DO NOTHING;

INSERT INTO parts
(id, book_id, volume_id, number, title, theme)
VALUES
(9, 1, 2, 5, 'Ztracený', 'summer')
ON CONFLICT DO NOTHING;

INSERT INTO parts
(id, book_id, volume_id, number, title, theme)
VALUES
(10, 1, 2, 6, 'Návykový', 'summer')
ON CONFLICT DO NOTHING;

SELECT setval(
    pg_get_serial_sequence('parts', 'id'),
    GREATEST((SELECT COALESCE(MAX(id), 1) FROM parts), 1),
    true
);

-- characters
INSERT INTO characters
(id, book_id, name, quote, content_html, main_image, header_image,
 sort_order, published, created_at, updated_at, main_video)
VALUES
(
1,
1,
'Alex Winkler',
'Paid to chase a piece of rubber.',
'Jestli mě chcete popsat jedním slovem, použijte „výjimečný“. Jestli dvěma, tak „nebezpečně výjimečný“.&nbsp;<div>Jsem Alex Winkler.&nbsp;</div><div>Hokejová megastar, kapitán Seattle Blazers, občasnej idiot a profesionální specialista na to, jak si zbytečně komplikovat život. V tom posledním jsem mimochodem fakt dobrej.&nbsp;</div><div>Lidi si myslí, že jsem arogantní. Nejsem arogantní. Jen mám pravdu o něco častěji než ostatní. To je rozdíl. Nikdy jsem úplně nechápal, proč by člověk měl být skromnej. Když jste dobrej, tak jste dobrej. Když jste hezkej, tak jste hezkej. A když jste obojí, je podle mě trochu pokrytecký dělat, že jste si toho nevšimli.

Takže jo. Vím, že dobře vypadám. Vím, že umím hrát hokej. Vím, že mě lidi sledujou. A taky vím, že jsem občas nesnesitelnej. Naštěstí mám dost charisma na to, aby mi to většina lidí odpustila.&nbsp;</div><div>Mám rád svoje Camaro, hlasitou hudbu, Love Island, vítězství a lidi, kteří mě umí pobavit. Nesnáším prohry, moralizování a věty začínající slovy „Alexi, musíme si promluvit“. To je většinou začátek nějakého průseru. Nebo vztahu. A upřímně, nevím, co z toho je horší.&nbsp;</div><div>Takže to jsem já - miláček publika, král instagramu a tak trochu kokot.&nbsp;</div><div>Někdo musí být nejlepší. Je hezké, že se na tom konečně všichni shodneme.&nbsp;</div><div>#win14

</div>',
'/src/assets/images/characters/alex.png',
'/src/assets/images/characters/alex-header.png',
0,
1,
'2026-08-22 15:37:28',
'2026-08-23 19:55:56',
'/src/assets/images/characters/Alex-gif.mp4'
)
ON CONFLICT DO NOTHING;

INSERT INTO characters
(id, book_id, name, quote, content_html, main_image, header_image,
 sort_order, published, created_at, updated_at, main_video)
VALUES
(
2,
1,
'Benjamin Fait',
'ii',
'ffff',
'/src/assets/images/characters/ChatGPT%20Image%2023.%208.%202026%2017_09_31.png',
'/src/assets/images/characters/ee2c6928-fa00-4360-ad11-e8e16e0cd77b.jpg',
0,
1,
'2026-08-23 14:58:19',
'2026-08-23 19:56:16',
'/src/assets/images/characters/ben.mp4'
)
ON CONFLICT DO NOTHING;

INSERT INTO characters
(id, book_id, name, quote, content_html, main_image, header_image,
 sort_order, published, created_at, updated_at, main_video)
VALUES
(
3,
1,
'Daniel Kraus',
'',
'',
NULL,
NULL,
0,
1,
'2026-08-23 15:39:51',
'2026-08-23 15:39:51',
NULL
)
ON CONFLICT DO NOTHING;

INSERT INTO characters
(id, book_id, name, quote, content_html, main_image, header_image,
 sort_order, published, created_at, updated_at, main_video)
VALUES
(
4,
1,
'Dominik Vácha',
'Správně, Chiq. Hodnej kluk..',
'Nik.&nbsp;<div>Co potřebuješ vědět?&nbsp;</div><div>Že většinou dostanu, co chci? To už asi zjistíš sám.&nbsp;</div><div>Že nerad prohrávám? To zjistíš pravděpodobně rychlejc.&nbsp;</div><div>A jestli čekáš nějakou milou uvítací řeč, tak… kurva, špatnej člověk.</div><div>Práva, osmadvacet, špatná pověst a příliš vysoký sebevědomí na to, aby mi někdo mohl říkat, že bych měl být skromnější. Pravděpodobně mě budeš buď milovat, nebo nenávidět, a upřímně… obojí je celkem lichotivý.&nbsp;</div><div>Takže klidně pokračuj, mí amor, já jsem zvědavej, kam až se dostaneš, než se začnu nudit.</div>',
'/src/assets/images/characters/ChatGPT%20Image%2023.%208.%202026%2020_21_13.png',
'/src/assets/images/characters/ChatGPT%20Image%2023.%208.%202026%2020_22_54.png',
0,
1,
'2026-08-23 18:58:36',
'2026-08-23 19:56:38',
'/src/assets/images/characters/Nik.mp4'
)
ON CONFLICT DO NOTHING;

INSERT INTO characters
(id, book_id, name, quote, content_html, main_image, header_image,
 sort_order, published, created_at, updated_at, main_video)
VALUES
(
5,
1,
'Theo Winkler',
'Nenávidím tě, zkurveně moc tě nenávidím, Niku.',
'Milujeme tě Theo, ale jsi fakt strašná drama queen! :D&nbsp;',
'/src/assets/images/characters/ChatGPT%20Image%2023.%208.%202026%2020_51_45.png',
'/src/assets/images/characters/ChatGPT%20Image%2023.%208.%202026%2020_50_09.png',
0,
1,
'2026-08-23 19:09:41',
'2026-08-23 20:55:25',
'/src/assets/images/characters/Theo(1).mp4'
)
ON CONFLICT DO NOTHING;

INSERT INTO characters
(id, book_id, name, quote, content_html, main_image, header_image,
 sort_order, published, created_at, updated_at, main_video)
VALUES
(
8,
1,
'Lukáš Zima',
'',
'',
NULL,
NULL,
0,
1,
'2026-08-23 20:54:54',
'2026-08-23 20:54:54',
NULL
)
ON CONFLICT DO NOTHING;

INSERT INTO characters
(id, book_id, name, quote, content_html, main_image, header_image,
 sort_order, published, created_at, updated_at, main_video)
VALUES
(
9,
1,
'David Kocáb',
'',
'',
NULL,
NULL,
0,
1,
'2026-08-23 20:55:06',
'2026-08-23 20:55:06',
NULL
)
ON CONFLICT DO NOTHING;

INSERT INTO characters
(id, book_id, name, quote, content_html, main_image, header_image,
 sort_order, published, created_at, updated_at, main_video)
VALUES
(
10,
1,
'Adrian Valenta',
'Mezi padesáti mentolovými bonbóny bez cukru je jedna tabletka',
'<p class="MsoNormal">Adri.<o:p></o:p></p>

<p class="MsoNormal">Jo, přesně ten Adri, o kterém ti máma řekne, abys s ním nikam nechodil. Kouřím, piju, občas dělám dost debilní rozhodnutí a mám zvláštní talent objevit se přesně tam, kde bych být neměl. Většinou mi to prochází. Když ne, improvizuju. Moje heslo je něco mezi „nějak to dopadne“ a „co nejhoršího se může stát“, přičemž ta druhá věta se v minulosti ukázala jako dost nebezpečná.<o:p></o:p></p>

<p class="MsoNormal">Občas dělám věci, které by moje máma označila za naprostou katastrofu, a já za celkem povedený čtvrtek. Mám za sebou pár věcí, o kterých se mi nechce mluvit. Nebo slyšet. Haha. Inside joke, chápeš? Nemám rád rána, rodinné dovolené a otázky typu „co budeš dělat za pět let“. Upřímně, nevím, co budu dělat příští úterý. Ale jestli chceš, můžeme předstírat, že mám nějaký plán. Lidi mají rádi, když člověk působí, že ví, kam jde.<o:p></o:p></p>

<p class="MsoNormal">Každopádně jestli ode mě čekáš nějakou hlubokou životní moudrost, přišel jsi za špatným člověkem. Jestli chceš cigáro, to už je lepší otázka.<o:p></o:p></p>',
'/src/assets/images/characters/ChatGPT%20Image%209.%201.%202026%2023_34_39.png',
'/src/assets/images/characters/ChatGPT%20Image%2023.%208.%202026%2022_08_30.png',
0,
1,
'2026-08-23 21:49:45',
'2026-08-23 21:49:45',
'/src/assets/images/characters/adri.mp4'
)
ON CONFLICT DO NOTHING;

SELECT setval(
    pg_get_serial_sequence('characters', 'id'),
    GREATEST((SELECT COALESCE(MAX(id), 1) FROM characters), 1),
    true
);

-- chapters
INSERT INTO chapters
(id, book_id, volume_id, part_id, number, title, content_html, status, created_at, updated_at)
VALUES
(
1,
1,
1,
1,
1,
'Theo',
'Cesta byla až příliš dlouhá a vyčerpávající a spolehlivě ze mě dokázala vysát i poslední zbytky nadšení, které jsem při nástupu do vlaku cítil. Neklimatizovaný vagón byl narvaný k prasknutí a já na to nebyl zvyklý. Dávno jsem byl rozmazlenej cestováním autem a dnešek pro mě znamenal jedno velké, bolestivé vystřízlivění. Upravil jsem si kostkovaný batoh s klíčenkou Eifellovky na rameni a zastavil se na křižovatce, abych se rozhlédl. Navigace v telefonu po nekonečném stoupání opět selhala a nutila mě znovu měnit směr. Věděl jsem, že pohár mé trpělivosti přetéká s každým dalším krokem. Neměl jsem daleko k tomu tenhle krám prostě vzít a zahodit. Zvedl jsem hlavu a zahleděl se do ulic. Už jsem tady byl, párkrát, na rychlé prohlídce. Jenže já si nedokázal zapamatovat ani ulice vedoucí k naší bývalé adrese a to vesnice o třech barácích měla k tomuhle bludišti daleko.&nbsp;<br>Měl jsem rád náš starý byt v Brně, který byl sice malý, ale věci v něm fungovaly jinak. Tísnili jsme se v malé garsonce, jenže tehdy mi to bylo fuk. Chtěl jsem jen být s ním. Miloval jsem pocit bezpečí, který mě obklopil pokaždé, co jsme spolu leželi na rozvrzaném gauči. Jenže to bylo tehdy. Předtím, než Viktor začal odjíždět na ty své nekonečné služebky a mě odložil k jeho prarodičům jak pětiletého smrada. Pár let. Pár let strávených v domě, kde se čas táhnul pomaleji než nekonečné fronty u pokladny v úterním letáku. Jeho prarodiče mi nikdy nevadili, ale nesnášel jsem, jak se tam čas neměřil hodinami, ale počtem vypitých turků, luštěním křížovek a sledováním odpolední chvilky poezie na Dvojce. Autobus do města jezdil co dvě hodiny a já byl obklopen tichem, nudou a samotou. Nekonečným čekáním na tebe a zíráním na praskliny ve stropě. Nenáviděl jsem samotu. A tys mě tam přesto nechal.&nbsp;&nbsp;<br>A teď tohle. Praha. Město nabité zábavou. Toužil jsem po tom zkusit všechno, o nabízí. Krok do neznáma, který jsem si vynutil. Myslel jsem si, že můžeme začít znovu. Jenže namísto toho jsem musel celé léto počkat, než dokončí výcvik. To všechno počká. Jasně, že počká. Vždycky to počkalo. Odfrknul jsem si a přimhouřil oči proti prudkému odpolednímu slunci. Má nálada klesala raketovou rychlostí a tropické horko tomu nepomáhalo. Roztopím se tu zaživa dřív, než ten byt vůbec najdu.<br>Pohled mi konečně padl na kavárnu na rohu s hezkou květnatou výlohou. Byla mi povědomá. Hned jsem si vzpomněl na okamžik, kdy jsem si při prohlídce pochvaloval, že to k ní budu mít doslova pár kroků. Věděl jsem, že tam bez tebe nepůjdu. Získal jsem zpátky ztracenou jistotu. A když jsem zabočil za roh, hora krabic navršená u vchodu – schopná brzy konkurovat Žižkovské věži – mě ujistila, že jsem na místě. Akorát ten detail, že tu měli čekat minimálně dva chlapi na stěhování do pátého patra, jaksi chyběl. Vjel jsem si rukou do světlých vlasů, vylovil klíče ze zadní kapsy roztrhaných džínů a moc dobře věděl, že mé utrpení pro dnešek teprve začíná.&nbsp;<br>O půl hodiny později jsem se snažil nacpat alespoň polovinu krabic do chatrně vyhlížejícího výtahu. Funěl jsem, sprostá slova ze mě lítala bez cenzury a jednou nohou jsem přišlapával černé čidlo, zatímco se kovové dveře dožadovaly nekompromisního zavření. Připadal jsem si jako akrobat a tetrisový mág v jednom. Někdo o patro výš nervózně zabušil na dveře. Polkl jsem další nadávku. Věř mi, já tady taky nechci bejt!<br>Bzukot v kapse mě upozornil na příchozí hovor. Vrazil jsem si menší krabici do podpaží, vytáhl telefon a přitiskl si ho ramenem k uchu, protože mé ruce byly plné nepotřebných krámů. Naštvaně jsem zafuněl. "Hm. Nejsou tady" Ten nadšený předstíraný tón mi vydržel tak vteřinu než se změnil v přehlídku otrávenosti a sarkasmu. Můj hlas zněl přesně tak podrážděně, jak jsem se cítil. Osoba na druhé straně začala něco horečně vysvětlovat. "Joo, já vím, že jsem přijel pozdě! Nemůžu za to, že ten blbej vlak měl dvě hodiny zpoždění a pak jsem se ještě musel táhnout metrem a… co?" Uhnul jsem tmavovlasému muži, který se snažil procpat na poslední volné místečko ve výtahu. Možná bych ho poslal do háje s tím, že nevidí, že je plno, ale na vteřinu jsem zvažoval, že na něj zkusím sladce zamrkat. Představa, že ty krabice táhnu do pátého patra sám, mě děsila do morku kostí. Jenže když jsem zachytil jeho intenzivní, zkoumavý pohled, raději jsem myšlenku vzdal. Vypadal, že mé utrpení bude raději pozorovat. Skvělý kámo!&nbsp;<br>"Cože? Jo, poslouchám tě, ježiš! Budu to muset odtáhnout sám, no výborný. Mohl bys mě přestat pořád poučovat?" Střelil jsem pohledem po tmavovlasém cizinci a ani jsem se nesnažil krotit tón hlasu. Nejspíš jsem si právě odradil jedinou naději na pomoc. Nasrat. Neznámý tiše zmáčkl tlačítko pátého patra – kam směřoval očividně taky – a já si přehodil krabici, abych ulevil ztuhlým prstům. Jediné, co mě konejšilo, byl fakt, že v bytě zůstal gauč a druhá várka nábytku přijede později. Radši bych spal na dlažbě, než tlačit nahoru postel.<br>Výtah cinknul. Zablokoval jsem dveře krabicí a začal věci vykládat. Rád bych zjistil, proč mi nenabídl pomoc, ale zaměstnával mě hlas v telefonu. Viktor si pořád udržoval ten svůj věčně klidný, vyrovnaný tón, který ten můj naopak rozpaloval doběla.<br>Uznávám, nikdy jsem nebyl klidný. Byl jsem výbušný. Ten typ, co v hádce po druhém hodí talíř, protože nemá pravdu, a za minutu se hluboce omlouvá. Neuměl jsem ovládat emoce. A nesnášel ticho. Naši mě kdysi dali na sporty v marné naději, že tam frustraci vybiju, jenže na pohyb jsem byl naprosté poleno. Takže mi nezbylo než to ventilovat jinak. A v tuhle chvíli bylo nejjednodušší vylít si to na člověku na druhé straně linky. Protože si za to stejně mohl sám. Měl tu bejt. „Jasně, takže je to vlastně všechno moje vina. Skvělý. Fakt skvělý, Viktore.“ Protočil jsem očima nad další salvou slov, která mluvila o mé neschopnosti. Prudce jsem třísknul krabicí o zem. Vzal jsem telefon do dlaně, opřel se o stěnu a začal ze svazku lovit ten správný klíč. Chodba byla rozlehlá – stará zástavba s vysokými stropy, obrovskými okny a balkóny do vnitrobloku. Měl bych se těšit na to, co mě čeká za dveřmi, ale nálada mi klesla na bod mrazu. Vztek vystřídalo hořké zklamání. Položil jsem tu samou otázku, na kterou jsem už dávno znal odpověď. „Přijedeš?“<br>Nenáviděl jsem ten tón. Vždycky jsem se ptal s až příliš velkou nadějí. Jedna má část pořád věřila, že řekne ano. Že zkrátka přijede a budeme moct fungovat normálně. Jenže jeho odpověď přinesla jen známou pachuť. Začalo vysvětlování, omluvy a obhajoby. Neříkal jsem nic. Típl jsem to a strčil telefon do kapsy. Opřel jsem si čelo o chladnou zeď a zkusil se zhluboka nadechnout, abych zažehl tu bodavou úzkost, která mě svírala u srdce. Jestli jsem něco na světě nenáviděl a z hloubi duše se toho bál, byla to samota. A po těch letech u jeho prarodičů jsem jí měl plné zuby.<br>Sevřel jsem ruce v pěst, napřímil se a bez přemýšlení nakopl nejbližší krabici. Doufal jsem, že odletí a mě se uleví, jenže nohou mi projela prudká, tepající bolest. Zamračil jsem se ještě víc. On si zabalil činky?! Přísahal jsem, že až toho blonďáka uvidím, uškrtím ho. Jestli ho vůbec v dohledné době uvidím...<br>Ze sebelítosti mě vytrhly hlasy. Dveře sousedního bytu byly pootevřené. Možná jsem mohl nasadit úsměv a zkusit zachránit sousedské vztahy, ale po tom výstupu do telefonu mi moc šancí nezbývalo. Namísto úsměvu jsem se zamračil. Výtah za mými zády stále protestně pípal, bušení z dolních pater neustávalo a já si v duchu jen otráveně řekl.&nbsp;<br>Tak vítej doma, Theo.<br><br>',
'published',
'2026-08-11 15:11:32',
'2026-08-11 19:52:40'
)
ON CONFLICT DO NOTHING;

INSERT INTO chapters
(id, book_id, volume_id, part_id, number, title, content_html, status, created_at, updated_at)
VALUES
(
6,
1,
1,
1,
2,
'Adri',
'Líně jsem scrolloval další nudné příspěvky na insta, ačkoliv uznávám, že vzhledem k rozmanitosti mých přátel se jednalo o zážitky nejspíš z opačných koutů vesmíru a stejně jako fotky roztomilých štěňátek na mě klidně vykoukla spící polonahá borka s rozmazaných make upem v posteli mého kámoše, který se s debilním úsměvem žáka učňovského oboru ptal, jestli náhodou někdo neví, kdo to je. Nuda. Krátil jsem si čas, než mě zabaví jiné, lepší aktivity, jenže měl zpoždění a já se nesnažil zakrývat své prohlubující se protivné zamračení. Rozhodně jsem na dnešní setkání nebyl tak natěšený jako borec, co mi celou noc vypisoval na Tinderu, ale byl hezkej, což zjevně stačilo. Trochu smutné, ale s tím jsem se už dávno smířil. Moc dobře jsem věděl, co by mi řekl můj terapeut na mé neotřelé metody zahánění frustrace, ale jemu se to kecalo, když mohl s tou děsně cool pomalou dikcí diktovat lidem životy.&nbsp;<br>Ten můj byl prázdný a nudný. Všichni kolem se radovali z prázdnin, všude na mě vyskakovali fotky z exotických dovolených zaobalené tisícovkou filtrů, takže pomalu nebylo poznat, kdo na nich vlastně je, ale já měl hypotetický diář naprosto prázdný. Naši sice několikrát nadhodili, že bychom si mohli udělat dovolenou někde u moře, ochutnat něco exotického a odvázat se, jak to nazval táta, ale s letmým úsměvem jsem odmítl, protože odvázat se pro mě znamenalo šňupnout si půl gramu pika a ne rodinnou dovolenou v Chorvatsku. Ale své názory jsem si nechával pro sebe, protože jim by to jen přidělalo další vrásky a mě sebralo naději.&nbsp;<br>Naděje, to slovo jsem nesnášel. Opakovali ho všichni pořád dokola jako nějakou zasranou ohranou písničku, nejdřív v nemocnici, kde jsem měl naději na plné uzdravení, pak naši, že mám naději dostat se na dobrou školu a mít skvělou budoucnost, pak psycholog, že je tu naděje se zbavit všech těch zasranejch pocitů. Naděje byla na hovno, protože to bylo jenom slovo, které mě nemohlo vytáhnout ze dna, kde jsem se právě nacházel. Ale konec sebelitování, tohle nebyl stav, který by mě překvapoval, protože jsem v něm fungoval už roky.&nbsp;<br>Mobil zapípal a zpráva mě upozornila, že týpek už dorazil. Jo, bylo mi v podstatě jedno, že si do bytu tahám úplně neznámé lidi, protože jsem dělával mnohem větší hlouposti, tenhle si chce prostě jenom zašukat. Navíc, řekněme si to na rovinu, nebyl zrovna nejostřejší tužka v penále, ale to mi dokonale vyhovovalo. Nechtěl jsem si povídat, nechtěl jsem s ním navazovat nic nezbytnějšího, než potřebuju, abych od něj dostal, proč koneckonců přišel. A to bylo všechno.&nbsp;<br>Schoval jsem mobil do kapsy, prohrábl si rukou světle fialové vlasy a rozešel se ke dveřím. Možná jsem si mohl alespoň zapamatovat jeho jméno, ale stejně bude beztak chtít, abych mu pochválil bicák nebo mu zvedal ego ódami na jeho mužství, takže na co jména, která stejně do rána zase zmizí. Otevřel jsem dveře, opřel se o jejich rám a čekal, když výtah konečně cinknul a ven vyšel borec jako z reklamy na fitko, rozhodně naplnil má očekávání do puntíku a to i ve chvíli, kdy se samolibě usmál a vyprsil tu hromadu svalů tvořící jeho rozložitou hruď. Měl jsem rád tyhle typy, zcela očividně jsem měl dost vyhraněný vkus a moc dobře věděl, odkud moje obsese pramení, ale nebylo to to, co jsem chtěl, ty vlasy měly příliš světlý odstín a házely odlesky spíš do tmavé než měděné, jeho oči byly do zelena a ta tvář byla dokonale opálená, snad bez jediné pihy. Zklamaně jsem mlaskl, ale mávl nad tím rukou, dokonalá kopie to nebyla, ale s originálem by stejně nevyhrál, i kdyby vypadal jako jeho dvojník, což jsem už ale za ty roky přijmul. Lepší ale něco než nic a tak jsem na své tváři vykouzlil ten jemný, provokativní úšklebek a pomalu si olízl spodní ret. Jestli ho nemá malýho, bude to ok.&nbsp;<br>Zatímco borec začal okamžitě valit, jak jsem ještě hezčí než na fotkách a sáhodlouze rozebíral, co se&nbsp; mnou chce dělat už ve chvíli, kdy si přede dveřmi sundával vyleštěné mokasíny, já mu nevěnoval pozornost a místo toho s lehkým pobavením zlomyslného sráče sledoval dveře výtahu, které se protestativně zavíraly a snažily se nejspíš zdemolovat krabici, kterou tam kdosi vrazil a teď se snažil přes ni přejít a odnést ven zbytek dalších, které se za ním jako neprostupná hradba rýsovaly z vnitřku plechové krabice.&nbsp;<br>Ten kluk byl asi tak v mém věku, vlastně jsme si dost odpovídali i výškově a nejspíš i tím libozvučným slovníkem, který z těch rozkošných úst vyrážel slova, za která by se moje máma nejspíš křižovala. Upřímně nebylo divu, jestli fakt musel odtahat všechny ty krámy, nejspíš by v mém případě už létaly oknem do vnitrobloku, ale já naštěstí na jeho místě nebyl, a možná proto jsem se tak dobře bavil.<br>"Tak stará Horáková pořád vyhrožovala, že sem přijede její sestra Heduš a nakonec je to čerstvé maso. Mám radost, další otravnou čarodějnici bych asi nepřežil." zcela okázale jsem svého prince na bílém koni, který zrovna popisoval, co všechno by mi chtěl kam strkat, obešel a zamířil k hnědovláskovi, který zrovna nakopnul obrovskou krabici s nápisem trénink a v jeho obličeji bylo znát, že podložky na jógu to asi nebudou. Prohlížel jsem si ho obezřetně, zvědavě, protože jsem pochopil, že se jedná o nového souseda. Alespoň jsem v to doufal, tenhle kluk rozhodně vypadal přístupnější poslouchat ve dvě ráno techno než ta babizna z patra pod námi, která měla v oblibě neustále tím svým koštětem, kterým se beztak dopravovala po Praze, neustále klepat do stropu a to obvykle v tom nejlepším, co jsem s podobnými známostmi ze seznamovacích aplikací prováděl. Pobaveně jsem sledoval ty hory krabic, ale nezdálo se, že by se najednou v záři reflektoru objevil někdo, kdo by mu s tím chtěl pomoc, což na mé tváři vykouzlilo zúčastněný výraz. "Jsem Adri, bydlím vedle. Páni, máš toho hodně." pokýval jsem hlavou při pohledu na dveře výtahu, které stále ještě zarputile vrážely do krabice, načež jsem vykouzlil úsměv na tváři a ukázal na toho vysvaleného borce za svými zády. "No, my máme nějakou práci, tak ať ti to uteče." usmál jsem se tím rádoby milým úsměvem a místo toho, abych čapnul nějakou z krabic, což snad fakt nečekal, že udělám, jsem se vrátil zase ke svým dveřím, mávnutím ruky umlčel toho pitomce, co zase rozjížděl tu sváděcí písničku a stáhnul ze sebe tu mikinu už v předsíni v marné snaze ho umlčet dřív, než se z těch keců unudím k smrti. Pravidelné bouchání dveří do krabice mě doprovázelo ještě nějakou dobu, ale sotva týpek sklapnul a vysadil mě na linku v kuchyni, upřímně jsem to přestal řešit.',
'published',
'2026-08-11 20:54:11',
'2026-08-11 20:54:11'
)
ON CONFLICT DO NOTHING;

INSERT INTO chapters
(id, book_id, volume_id, part_id, number, title, content_html, status, created_at, updated_at)
VALUES
(
7,
1,
1,
2,
3,
'Maty',
'Zkouška dessu.&nbsp;',
'published',
'2026-08-11 20:58:46',
'2026-08-12 09:42:37'
)
ON CONFLICT DO NOTHING;

INSERT INTO chapters
(id, book_id, volume_id, part_id, number, title, content_html, status, created_at, updated_at)
VALUES
(
8,
1,
1,
3,
4,
'Alex',
'Milujeme Bena navždy.&nbsp;',
'published',
'2026-08-12 18:12:59',
'2026-08-12 18:12:59'
)
ON CONFLICT DO NOTHING;

INSERT INTO chapters
(id, book_id, volume_id, part_id, number, title, content_html, status, created_at, updated_at)
VALUES
(
9,
1,
1,
4,
5,
'Adri',
'David vyhrál na plné čáře!&nbsp;',
'published',
'2026-08-12 18:13:33',
'2026-08-12 18:13:33'
)
ON CONFLICT DO NOTHING;

SELECT setval(
    pg_get_serial_sequence('chapters', 'id'),
    GREATEST((SELECT COALESCE(MAX(id), 1) FROM chapters), 1),
    true
);

-- character_details
INSERT INTO character_details
(id, character_id, label, value, sort_order)
VALUES
(53, 3, 'Umělecké jméno', 'lvlDK', 0)
ON CONFLICT DO NOTHING;

INSERT INTO character_details
(id, character_id, label, value, sort_order)
VALUES
(68, 1, 'Pozice', 'Centr', 0)
ON CONFLICT DO NOTHING;

INSERT INTO character_details
(id, character_id, label, value, sort_order)
VALUES
(69, 1, 'Věk', '25', 1)
ON CONFLICT DO NOTHING;

INSERT INTO character_details
(id, character_id, label, value, sort_order)
VALUES
(70, 1, 'Výška', '198 cm', 2)
ON CONFLICT DO NOTHING;

INSERT INTO character_details
(id, character_id, label, value, sort_order)
VALUES
(71, 1, 'Číslo dresu', '14', 3)
ON CONFLICT DO NOTHING;

INSERT INTO character_details
(id, character_id, label, value, sort_order)
VALUES
(72, 4, 'Titul', 'JUDr. Dominik Vácha. Ph.D.', 0)
ON CONFLICT DO NOTHING;

INSERT INTO character_details
(id, character_id, label, value, sort_order)
VALUES
(73, 4, 'Státní příslušnost', 'česká, španělská', 1)
ON CONFLICT DO NOTHING;

INSERT INTO character_details
(id, character_id, label, value, sort_order)
VALUES
(74, 4, 'Nesnáší', 'Melounové žvýkačky', 2)
ON CONFLICT DO NOTHING;

INSERT INTO character_details
(id, character_id, label, value, sort_order)
VALUES
(75, 4, 'Oblíbený tým', 'FC Barcelona', 3)
ON CONFLICT DO NOTHING;

INSERT INTO character_details
(id, character_id, label, value, sort_order)
VALUES
(80, 5, 'Pozice', 'Profesionální drama queen', 0)
ON CONFLICT DO NOTHING;

INSERT INTO character_details
(id, character_id, label, value, sort_order)
VALUES
(81, 5, 'Must have', 'Krém s SPF', 1)
ON CONFLICT DO NOTHING;

INSERT INTO character_details
(id, character_id, label, value, sort_order)
VALUES
(82, 5, 'Vůně', 'Šeřík', 2)
ON CONFLICT DO NOTHING;

INSERT INTO character_details
(id, character_id, label, value, sort_order)
VALUES
(83, 5, 'Obsese', 'Melounové žvýkačky', 3)
ON CONFLICT DO NOTHING;

INSERT INTO character_details
(id, character_id, label, value, sort_order)
VALUES
(84, 10, 'Cigarety', 'Bez filtru', 0)
ON CONFLICT DO NOTHING;

INSERT INTO character_details
(id, character_id, label, value, sort_order)
VALUES
(85, 10, 'Viktor Sheen', 'Další den', 1)
ON CONFLICT DO NOTHING;

SELECT setval(
    pg_get_serial_sequence('character_details', 'id'),
    GREATEST((SELECT COALESCE(MAX(id), 1) FROM character_details), 1),
    true
);

-- character_images
INSERT INTO character_images
(id, character_id, image, caption, sort_order)
VALUES
(
6,
1,
'/src/assets/images/characters/alex-header-gif.gif',
'Jsem nejlepší.',
0
)
ON CONFLICT DO NOTHING;

INSERT INTO character_images
(id, character_id, image, caption, sort_order)
VALUES
(
8,
5,
'/src/assets/images/characters/theo.gif',
'',
0
)
ON CONFLICT DO NOTHING;

INSERT INTO character_images
(id, character_id, image, caption, sort_order)
VALUES
(
9,
10,
'/src/assets/images/characters/ChatGPT%20Image%207.%206.%202026%2014_37_35.png',
'',
0
)
ON CONFLICT DO NOTHING;

SELECT setval(
    pg_get_serial_sequence('character_images', 'id'),
    GREATEST((SELECT COALESCE(MAX(id), 1) FROM character_images), 1),
    true
);

-- character_quotes
INSERT INTO character_quotes
(id, character_id, quote, author, volume_id, sort_order)
VALUES
(
10,
1,
'Ty víš, co chci.',
'Alex',
1,
0
)
ON CONFLICT DO NOTHING;

INSERT INTO character_quotes
(id, character_id, quote, author, volume_id, sort_order)
VALUES
(
11,
4,
'Netvař se takhle, nezkoušej se tvářit tak, že za to můžu já. To tys šel za mnou, to tys chtěl, abych tě ošukal, znovu a znovu, tak se teď netvař, jako bych tě nutil. Admítelo, amor.',
'Nik',
1,
0
)
ON CONFLICT DO NOTHING;

INSERT INTO character_quotes
(id, character_id, quote, author, volume_id, sort_order)
VALUES
(
13,
5,
'Ale chci tě. Potřebuju tě. Potřebuju tě cítit, potřebuju tě v sobě. Zatraceně, vraž ho do mě. Hluboko. Hned..',
'Theo',
1,
0
)
ON CONFLICT DO NOTHING;

INSERT INTO character_quotes
(id, character_id, quote, author, volume_id, sort_order)
VALUES
(
14,
10,
'Vedro mě zmáhalo. Vonělo přísliby a motorovým olejem.',
'Adri',
1,
0
)
ON CONFLICT DO NOTHING;

SELECT setval(
    pg_get_serial_sequence('character_quotes', 'id'),
    GREATEST((SELECT COALESCE(MAX(id), 1) FROM character_quotes), 1),
    true
);

-- character_relationships
INSERT INTO character_relationships
(id, character_id, related_character_id, relationship_type)
VALUES
(
8,
1,
2,
'["love", "ex"]'
)
ON CONFLICT DO NOTHING;

INSERT INTO character_relationships
(id, character_id, related_character_id, relationship_type)
VALUES
(
10,
1,
4,
'["acquaintance", "friend"]'
)
ON CONFLICT DO NOTHING;

INSERT INTO character_relationships
(id, character_id, related_character_id, relationship_type)
VALUES
(
15,
1,
5,
'["family", "enemy", "friend"]'
)
ON CONFLICT DO NOTHING;

INSERT INTO character_relationships
(id, character_id, related_character_id, relationship_type)
VALUES
(
16,
2,
5,
'["friend"]'
)
ON CONFLICT DO NOTHING;

INSERT INTO character_relationships
(id, character_id, related_character_id, relationship_type)
VALUES
(
17,
4,
5,
'["love", "enemy"]'
)
ON CONFLICT DO NOTHING;

INSERT INTO character_relationships
(id, character_id, related_character_id, relationship_type)
VALUES
(
18,
9,
10,
'["love", "ex", "enemy"]'
)
ON CONFLICT DO NOTHING;

INSERT INTO character_relationships
(id, character_id, related_character_id, relationship_type)
VALUES
(
19,
8,
10,
'["love", "ex"]'
)
ON CONFLICT DO NOTHING;

INSERT INTO character_relationships
(id, character_id, related_character_id, relationship_type)
VALUES
(
20,
5,
10,
'["friend"]'
)
ON CONFLICT DO NOTHING;

SELECT setval(
    pg_get_serial_sequence('character_relationships', 'id'),
    GREATEST((SELECT COALESCE(MAX(id), 1) FROM character_relationships), 1),
    true
);

-- character_volumes

INSERT INTO character_volumes
(character_id, volume_id)
VALUES
(3, 2)
ON CONFLICT DO NOTHING;

INSERT INTO character_volumes
(character_id, volume_id)
VALUES
(3, 5)
ON CONFLICT DO NOTHING;

INSERT INTO character_volumes
(character_id, volume_id)
VALUES
(1, 1)
ON CONFLICT DO NOTHING;

INSERT INTO character_volumes
(character_id, volume_id)
VALUES
(1, 2)
ON CONFLICT DO NOTHING;

INSERT INTO character_volumes
(character_id, volume_id)
VALUES
(1, 5)
ON CONFLICT DO NOTHING;

INSERT INTO character_volumes
(character_id, volume_id)
VALUES
(2, 1)
ON CONFLICT DO NOTHING;

INSERT INTO character_volumes
(character_id, volume_id)
VALUES
(2, 2)
ON CONFLICT DO NOTHING;

INSERT INTO character_volumes
(character_id, volume_id)
VALUES
(2, 5)
ON CONFLICT DO NOTHING;

INSERT INTO character_volumes
(character_id, volume_id)
VALUES
(4, 1)
ON CONFLICT DO NOTHING;

INSERT INTO character_volumes
(character_id, volume_id)
VALUES
(4, 2)
ON CONFLICT DO NOTHING;

INSERT INTO character_volumes
(character_id, volume_id)
VALUES
(4, 5)
ON CONFLICT DO NOTHING;

INSERT INTO character_volumes
(character_id, volume_id)
VALUES
(5, 1)
ON CONFLICT DO NOTHING;

INSERT INTO character_volumes
(character_id, volume_id)
VALUES
(5, 2)
ON CONFLICT DO NOTHING;

INSERT INTO character_volumes
(character_id, volume_id)
VALUES
(5, 5)
ON CONFLICT DO NOTHING;

INSERT INTO character_volumes
(character_id, volume_id)
VALUES
(10, 1)
ON CONFLICT DO NOTHING;

INSERT INTO character_volumes
(character_id, volume_id)
VALUES
(10, 2)
ON CONFLICT DO NOTHING;

INSERT INTO character_volumes
(character_id, volume_id)
VALUES
(10, 5)
ON CONFLICT DO NOTHING;

COMMIT;