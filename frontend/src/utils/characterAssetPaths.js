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

export const BOOK_CHARACTER_ASSET_FOLDERS = {
  1: "Nezacalo-to",
  2: "AEIL",
  3: "Vespera",
};


/* =========================================================
   KNIHA → SLOŽKA
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
  const markerIndex = normalized.indexOf(marker);

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
   VYTAŽENÍ SLOŽKY KNIHY Z CESTY
   ========================================================= */

function getCharacterAssetBookFolder(sourcePath) {
  const normalized = normalize(sourcePath);

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

      return databasePath === target;
    });

  if (exact) {
    return exact[1];
  }


  /* =======================================================
     2. SHODA PODLE NÁZVU SOUBORU V AKTUÁLNÍ KNIZE

     Tohle je důležité pro starší záznamy v databázi,
     které mohou mít jinou cestu.
     ======================================================= */

  const fileName =
    getCharacterAssetFileName(value);

  if (!fileName) {
    return "";
  }

  const fileNameTarget =
    normalize(fileName);

  const folder =
    normalize(
      getBookCharacterAssetFolder(bookId)
    );


  const inBook =
    entries.find(([sourcePath]) => {
      const source =
        normalize(sourcePath);

      const sourceFolder =
        getCharacterAssetBookFolder(
          sourcePath
        );

      const sourceFileName =
        normalize(
          getCharacterAssetFileName(
            sourcePath
          )
        );

      return (
        sourceFolder === folder &&
        sourceFileName === fileNameTarget
      );
    });

  if (inBook) {
    return inBook[1];
  }


  /* =======================================================
     3. SHODA PODLE NÁZVU SOUBORU

     Použije se pouze tehdy, když je název souboru
     v celém globu unikátní.
     ======================================================= */

  const sameName =
    entries.filter(([sourcePath]) => {
      const sourceFileName =
        normalize(
          getCharacterAssetFileName(
            sourcePath
          )
        );

      return (
        sourceFileName === fileNameTarget
      );
    });

  if (sameName.length === 1) {
    return sameName[0][1];
  }


  /* =======================================================
     4. NIC SE NENAŠLO
     ======================================================= */

  return "";
}


/* =========================================================
   OVĚŘENÍ EXISTENCE ASSETU
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
        toCharacterDatabaseAssetPath(path)
      ) === target
    );
  });
}