export const BOOK_CHARACTER_ASSET_FOLDERS = {
  1: "Nezacalo-to",
  2: "AEIL",
  3: "Vespera",
};

export function getBookCharacterAssetFolder(bookId) {
  return (
    BOOK_CHARACTER_ASSET_FOLDERS[Number(bookId)] ||
    `book-${bookId}`
  );
}

function normalizeSlashes(value) {
  return String(value || "").replace(/\\/g, "/");
}

function normalizePath(value) {
  return normalizeSlashes(value)
    .replace(/\/+/g, "/")
    .replace(/^\.?\//, "")
    .trim();
}

function getCharacterAssetFileName(value) {
  const normalized = normalizePath(value);
  return normalized.split("/").pop() || "";
}

function removeViteHash(fileName) {
  return fileName.replace(
    /-([a-f0-9]{8,20})(?=\.[^.]+$)/i,
    (match, hash) => {
      // UUID části nesmíme považovat za Vite hash.
      if (hash.length === 12) {
        return match;
      }

      return "";
    }
  );
}

export function toCharacterDatabaseAssetPath(sourcePath) {
  const normalized = normalizePath(sourcePath);

  if (!normalized) {
    return "";
  }

  const databaseMarker = "/src/assets/images/characters/";
  const viteMarker = "/assets/images/characters/";
  const publicMarker = "/characters/";

  const databaseIndex = normalized.indexOf(databaseMarker);

  if (databaseIndex !== -1) {
    return `/src/assets/images/characters/${normalized
      .slice(databaseIndex + databaseMarker.length)
      .replace(/^\/+/, "")}`;
  }

  const viteIndex = normalized.indexOf(viteMarker);

  if (viteIndex !== -1) {
    return `/src/assets/images/characters/${normalized
      .slice(viteIndex + viteMarker.length)
      .replace(/^\/+/, "")}`;
  }

  const publicIndex = normalized.indexOf(publicMarker);

  if (publicIndex !== -1) {
    return `/src/assets/images/characters/${normalized
      .slice(publicIndex + publicMarker.length)
      .replace(/^\/+/, "")}`;
  }

  return normalized;
}

function getCharacterRelativePath(sourcePath) {
  const normalized = normalizePath(
    toCharacterDatabaseAssetPath(sourcePath)
  );

  const marker = "/src/assets/images/characters/";
  const index = normalized.indexOf(marker);

  if (index === -1) {
    return "";
  }

  return normalized
    .slice(index + marker.length)
    .replace(/^\/+/, "");
}

export function resolveCharacterAsset(value, globMap, bookId) {
  if (!value) {
    return "";
  }

  const entries = Object.entries(globMap || {});

  /*
   * Starší Vite způsob – ponecháváme kvůli kompatibilitě.
   */

  if (entries.length > 0) {
    const normalizedValue = normalizePath(value);
    const databasePath = toCharacterDatabaseAssetPath(value);

    // 1. Přesná shoda.

    for (const [sourcePath, resolvedUrl] of entries) {
      const normalizedSource = normalizePath(sourcePath);

      if (
        normalizedSource === normalizedValue ||
        toCharacterDatabaseAssetPath(normalizedSource) === databasePath
      ) {
        return resolvedUrl;
      }
    }

    // 2. Záložní hledání podle názvu souboru v aktuální knize.

    const fileName = getCharacterAssetFileName(value);
    const cleanFileName = removeViteHash(fileName);
    const bookFolder =
      getBookCharacterAssetFolder(bookId).toLowerCase();

    if (cleanFileName) {
      for (const [sourcePath, resolvedUrl] of entries) {
        const normalizedSource = normalizePath(sourcePath);

        const sourceFileName = removeViteHash(
          getCharacterAssetFileName(normalizedSource)
        );

        if (
          sourceFileName.toLowerCase() ===
            cleanFileName.toLowerCase() &&
          normalizedSource
            .toLowerCase()
            .includes(`/characters/${bookFolder}/`)
        ) {
          return resolvedUrl;
        }
      }
    }
  }

  /*
   * Nový způsob:
   *
   * DB:
   * /src/assets/images/characters/AEIL/postava.png
   *
   * Public:
   * /characters/AEIL/postava.png
   */

  const relativePath = getCharacterRelativePath(value);

  if (relativePath) {
    return `/characters/${relativePath}`;
  }

  /*
   * Kompatibilita se staršími hodnotami, kde je uložený
   * pouze název souboru nebo Vite název s hashem.
   */

  const fileName = getCharacterAssetFileName(value);

  if (fileName) {
    const cleanFileName = removeViteHash(fileName);
    const bookFolder = getBookCharacterAssetFolder(bookId);

    return `/characters/${bookFolder}/${cleanFileName}`;
  }

  return "";
}

export function characterAssetExists(sourcePath, globMap) {
  if (!sourcePath) {
    return false;
  }

  const entries = Object.entries(globMap || {});

  /*
   * Starší Vite glob.
   */

  if (entries.length > 0) {
    const databasePath =
      toCharacterDatabaseAssetPath(sourcePath);

    return entries.some(([sourcePathInMap]) => {
      return (
        normalizePath(sourcePathInMap) ===
          normalizePath(sourcePath) ||
        toCharacterDatabaseAssetPath(sourcePathInMap) ===
          databasePath
      );
    });
  }

  /*
   * U public/characters ověřujeme alespoň správný
   * stabilní formát cesty.
   */

  return Boolean(getCharacterRelativePath(sourcePath));
}