/* =========================================================
   SPOLEČNÉ CESTY K OBRÁZKŮM A VIDEÍM POSTAV

   Soubory zůstávají ve Vite assets:

   src/assets/images/characters/<KNIHA>/...

   Do databáze ukládáme stabilní logickou cestu:

   /src/assets/images/characters/<KNIHA>/soubor.png

   Při zobrazení resolver najde skutečnou Vite URL,
   např.:

   /assets/soubor-ABC123.png

   ========================================================= */


/* =========================================================
   KNIHA → SLOŽKA
   ========================================================= */

export const BOOK_CHARACTER_ASSET_FOLDERS = {
  1: "Nezacalo-to",
  2: "AEIL",
  3: "Vespera",
};


/* =========================================================
   KNIHA → NÁZEV SLOŽKY
   ========================================================= */

export function getBookCharacterAssetFolder(bookId) {
  return (
    BOOK_CHARACTER_ASSET_FOLDERS[Number(bookId)] ||
    `book-${bookId}`
  );
}


/* =========================================================
   NORMALIZACE CEST
   ========================================================= */

function decodePath(value) {
  const text = String(value || "")
    .replace(/\\/g, "/")
    .trim();

  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}


function normalize(value) {
  return decodePath(value)
    .replace(/\/+/g, "/")
    .replace(/^\.\//, "")
    .toLowerCase();
}


/* =========================================================
   VITE CESTA → STABILNÍ DB CESTA
   ========================================================= */

export function toCharacterDatabaseAssetPath(sourcePath) {
  const normalized = String(sourcePath || "")
    .replace(/\\/g, "/")
    .trim();

  const marker = "/assets/images/characters/";

  const markerIndex =
    normalized.indexOf(marker);

  if (markerIndex >= 0) {
    return `/src/assets/images/characters/${normalized.slice(
      markerIndex + marker.length
    )}`;
  }

  if (
    normalized.startsWith(
      "/src/assets/images/characters/"
    )
  ) {
    return normalized;
  }

  return normalized;
}


/* =========================================================
   NÁZEV SOUBORU
   ========================================================= */

export function getCharacterAssetFileName(value) {
  const normalized = decodePath(value);

  return (
    normalized.split("/").pop() || ""
  );
}


/* =========================================================
   ODSTRANĚNÍ VITE HASHU Z NÁZVU

   Například:

   Návrh bez názvu-2vKY2pAi.png
                    ↓
   Návrh bez názvu.png

   ChatGPT Image 25. 8. 2026 19_41_32-CRT-YDKg.png
   → ChatGPT Image 25. 8. 2026 19_41_32.png

   Vite přidává hash na konec názvu souboru
   při produkčním buildu.

   ========================================================= */

function removeViteHash(fileName) {
  const decoded = decodePath(fileName);

  const lastDot =
    decoded.lastIndexOf(".");

  if (lastDot <= 0) {
    return decoded;
  }

  const name =
    decoded.slice(0, lastDot);

  const extension =
    decoded.slice(lastDot);

  /*
   * Vite hash bývá krátký alfanumerický řetězec
   * oddělený pomlčkou.
   *
   * Například:
   *
   * obrazek-ABC12345.png
   *
   * Pokud takový konec najdeme, odstraníme ho.
   */
  const withoutHash =
    name.replace(
      /-[A-Za-z0-9]{8,}$/i,
      ""
    );

  return `${withoutHash}${extension}`;
}


/* =========================================================
   NORMALIZOVANÝ NÁZEV PRO POROVNÁVÁNÍ

   Umožní porovnat:

   /assets/obrazek-ABC12345.png

   s:

   src/assets/images/characters/Nezacalo-to/obrazek.png

   ========================================================= */

function getComparableFileName(value) {
  const fileName =
    getCharacterAssetFileName(value);

  if (!fileName) {
    return "";
  }

  return normalize(
    removeViteHash(fileName)
  );
}


/* =========================================================
   VYTAŽENÍ SLOŽKY KNIHY Z CESTY
   ========================================================= */

function getCharacterAssetBookFolder(sourcePath) {
  const normalized =
    normalize(sourcePath);

  const marker =
    "/assets/images/characters/";

  const index =
    normalized.indexOf(marker);

  if (index < 0) {
    return "";
  }

  const rest =
    normalized.slice(
      index + marker.length
    );

  return (
    rest.split("/")[0] || ""
  );
}


/* =========================================================
   RESOLVER

   value:
     hodnota uložená v databázi

   globMap:
     import.meta.glob(...)

   bookId:
     aktuální kniha

   Výsledek MUSÍ být skutečná Vite URL z globMap,
   nikoliv /src/assets/...

   ========================================================= */

export function resolveCharacterAsset(
  value,
  globMap,
  bookId
) {
  if (!value) {
    return "";
  }

  const entries =
    Object.entries(globMap || {});

  if (entries.length === 0) {
    return "";
  }


  /* =======================================================
     1. PŘESNÁ SHODA CELÉ DB CESTY
     ======================================================= */

  const target =
    normalize(
      toCharacterDatabaseAssetPath(value)
    );

  const exact =
    entries.find(([sourcePath]) => {
      const databasePath =
        normalize(
          toCharacterDatabaseAssetPath(
            sourcePath
          )
        );

      return (
        databasePath === target
      );
    });

  if (exact) {
    return exact[1];
  }


  /* =======================================================
     2. SHODA PODLE NÁZVU SOUBORU V AKTUÁLNÍ KNIZE

     Tohle řeší starší záznamy, například:

     DB:
     /assets/Návrh bez názvu-2vKY2pAi.png

     skutečný soubor:
     src/assets/images/characters/
     Nezacalo-to/Návrh bez názvu.png

     ======================================================= */

  const fileNameTarget =
    getComparableFileName(value);

  if (!fileNameTarget) {
    return "";
  }

  const folder =
    normalize(
      getBookCharacterAssetFolder(bookId)
    );


  const inBook =
    entries.find(([sourcePath]) => {
      const sourceFolder =
        normalize(
          getCharacterAssetBookFolder(
            sourcePath
          )
        );

      if (
        sourceFolder !== folder
      ) {
        return false;
      }

      const sourceFileName =
        getComparableFileName(
          sourcePath
        );

      return (
        sourceFileName ===
        fileNameTarget
      );
    });


  if (inBook) {
    return inBook[1];
  }


  /* =======================================================
     3. NIC SE NENAŠLO

     DŮLEŽITÉ:
     Už nehledáme globálně podle názvu.

     Jinak by se mohl vzít obrázek stejného názvu
     z jiné knihy.

     ======================================================= */

  return "";
}


/* =========================================================
   OVĚŘENÍ EXISTENCE ASSETU

   Tato funkce kontroluje přesnou stabilní DB cestu.

   ========================================================= */

export function characterAssetExists(
  sourcePath,
  globMap
) {
  if (!sourcePath) {
    return false;
  }

  const target =
    normalize(
      toCharacterDatabaseAssetPath(
        sourcePath
      )
    );

  return Object.keys(
    globMap || {}
  ).some((path) => {
    return (
      normalize(
        toCharacterDatabaseAssetPath(
          path
        )
      ) === target
    );
  });
}