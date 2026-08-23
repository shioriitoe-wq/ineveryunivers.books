const API = "http://127.0.0.1:5000/api";


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

      message =
        data.message ||
        message;
    } catch {
      // Použijeme výchozí zprávu.
    }

    throw new Error(message);
  }

  return response.json();
}


/* =========================================================
   POSTAVY KNIHY
   ========================================================= */

export function getCharacters(bookId) {

  if (
    bookId === undefined ||
    bookId === null ||
    bookId === ""
  ) {
    return Promise.reject(
      new Error(
        "Nelze načíst postavy: chybí ID knihy."
      )
    );
  }

  return request(
    `${API}/books/${bookId}/characters`,
    {},
    "Nepodařilo se načíst postavy."
  );
}


/* =========================================================
   DETAIL POSTAVY
   ========================================================= */

export function getCharacter(
  bookId,
  characterId
) {

  if (
    bookId === undefined ||
    bookId === null ||
    bookId === ""
  ) {
    return Promise.reject(
      new Error(
        "Nelze načíst postavu: chybí ID knihy."
      )
    );
  }

  if (
    characterId === undefined ||
    characterId === null ||
    characterId === ""
  ) {
    return Promise.reject(
      new Error(
        "Nelze načíst postavu: chybí ID postavy."
      )
    );
  }

  return request(
    `${API}/books/${bookId}/characters/${characterId}`,
    {},
    "Nepodařilo se načíst postavu."
  );
}


/* =========================================================
   VYTVOŘENÍ POSTAVY
   ========================================================= */

export function addCharacter(
  bookId,
  character
) {

  return request(
    `${API}/books/${bookId}/characters`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify(character),
    },

    "Nepodařilo se přidat postavu."
  );
}


/* =========================================================
   ÚPRAVA POSTAVY
   ========================================================= */

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
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify(character),
    },

    "Nepodařilo se upravit postavu."
  );
}


/* =========================================================
   SMAZÁNÍ POSTAVY
   ========================================================= */

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