const API =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "https://ineveryunivers-books-api.onrender.com/api";


/* =========================================================
   OBECNÝ REQUEST
   ========================================================= */

async function request(
  url,
  options = {},
  errorMessage = "Nastala chyba."
) {
  const response = await fetch(url, options);

  if (!response.ok) {
    let message = errorMessage;

    try {
      const data = await response.json();

      message = data.message || message;
    } catch {
      // Použijeme výchozí zprávu.
    }

    throw new Error(message);
  }

  return response.json();
}


/* =========================================================
   KNIHY
   ========================================================= */

export function getBooks() {
  return request(
    `${API}/books`,
    {},
    "Nepodařilo se načíst knihy."
  );
}


export function getBook(id) {
  if (
    id === undefined ||
    id === null ||
    id === ""
  ) {
    return Promise.reject(
      new Error("Nelze načíst knihu: chybí ID knihy.")
    );
  }

  return request(
    `${API}/books/${id}`,
    {},
    "Nepodařilo se načíst knihu."
  );
}


export function addBook(book) {
  return request(
    `${API}/books`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(book),
    },

    "Nepodařilo se přidat knihu."
  );
}


export function updateBook(id, book) {

  /*
   * Ochrana proti:
   *
   * /api/books/undefined
   * /api/books/null
   * /api/books/
   */

  if (
    id === undefined ||
    id === null ||
    id === ""
  ) {
    return Promise.reject(
      new Error(
        "Nelze upravit knihu: chybí ID knihy."
      )
    );
  }

  return request(
    `${API}/books/${id}`,
    {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(book),
    },

    "Nepodařilo se upravit knihu."
  );
}


export function deleteBook(id) {

  if (
    id === undefined ||
    id === null ||
    id === ""
  ) {
    return Promise.reject(
      new Error(
        "Nelze smazat knihu: chybí ID knihy."
      )
    );
  }

  return request(
    `${API}/books/${id}`,
    {
      method: "DELETE",
    },

    "Nepodařilo se smazat knihu."
  );
}


/* =========================================================
   DÍLY
   ========================================================= */

export function getVolumes(bookId) {
  return request(
    `${API}/books/${bookId}/volumes`,
    {},
    "Nepodařilo se načíst díly."
  );
}


export function addVolume(bookId, volume) {
  return request(
    `${API}/books/${bookId}/volumes`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(volume),
    },

    "Nepodařilo se přidat díl."
  );
}


export function updateVolume(
  bookId,
  volumeId,
  volume
) {
  return request(
    `${API}/books/${bookId}/volumes/${volumeId}`,
    {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(volume),
    },

    "Nepodařilo se upravit díl."
  );
}


export function deleteVolume(
  bookId,
  volumeId
) {
  return request(
    `${API}/books/${bookId}/volumes/${volumeId}`,
    {
      method: "DELETE",
    },

    "Nepodařilo se smazat díl."
  );
}


/* =========================================================
   ČÁSTI
   ========================================================= */

export function getParts(bookId) {
  return request(
    `${API}/books/${bookId}/parts`,
    {},
    "Nepodařilo se načíst části."
  );
}


export function addPart(bookId, part) {
  return request(
    `${API}/books/${bookId}/parts`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(part),
    },

    "Nepodařilo se přidat část."
  );
}


export function updatePart(
  bookId,
  partId,
  part
) {
  return request(
    `${API}/books/${bookId}/parts/${partId}`,
    {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(part),
    },

    "Nepodařilo se upravit část."
  );
}


export function deletePart(
  bookId,
  partId
) {
  return request(
    `${API}/books/${bookId}/parts/${partId}`,
    {
      method: "DELETE",
    },

    "Nepodařilo se smazat část."
  );
}


/* =========================================================
   KAPITOLY
   ========================================================= */

export function getChapters(bookId) {
  return request(
    `${API}/books/${bookId}/chapters`,
    {},
    "Nepodařilo se načíst kapitoly."
  );
}


export function addChapter(
  bookId,
  chapter
) {
  return request(
    `${API}/books/${bookId}/chapters`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(chapter),
    },

    "Nepodařilo se přidat kapitolu."
  );
}


export function updateChapter(
  bookId,
  chapterId,
  chapter
) {
  return request(
    `${API}/books/${bookId}/chapters/${chapterId}`,
    {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(chapter),
    },

    "Nepodařilo se upravit kapitolu."
  );
}


export function deleteChapter(
  bookId,
  chapterId
) {
  return request(
    `${API}/books/${bookId}/chapters/${chapterId}`,
    {
      method: "DELETE",
    },

    "Nepodařilo se smazat kapitolu."
  );
}


/* =========================================================
   POSTAVY
   ========================================================= */

export function getCharacters(bookId) {
  return request(
    `${API}/books/${bookId}/characters`,
    {},
    "Nepodařilo se načíst postavy."
  );
}


export function getCharacter(
  bookId,
  characterId
) {
  return request(
    `${API}/books/${bookId}/characters/${characterId}`,
    {},
    "Nepodařilo se načíst postavu."
  );
}


export function addCharacter(
  bookId,
  character
) {
  return request(
    `${API}/books/${bookId}/characters`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(character),
    },

    "Nepodařilo se přidat postavu."
  );
}


export function updateCharacter(
  bookId,
  characterId,
  character
) {
  return request(
    `${API}/books/${bookId}/characters/${characterId}`,
    {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(character),
    },

    "Nepodařilo se upravit postavu."
  );
}


export function deleteCharacter(
  bookId,
  characterId
) {
  return request(
    `${API}/books/${bookId}/characters/${characterId}`,
    {
      method: "DELETE",
    },

    "Nepodařilo se smazat postavu."
  );
}