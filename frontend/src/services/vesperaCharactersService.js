const API =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "https://ineveryunivers-books-api.onrender.com/api";


async function request(
  url,
  options = {},
  errorMessage = "Nastala chyba."
) {
  const response = await fetch(
    url,
    options
  );

  if (!response.ok) {
    let message = errorMessage;

    try {
      const data =
        await response.json();

      message =
        data.message || message;
    } catch {
      // výchozí chyba
    }

    throw new Error(message);
  }

  return response.json();
}


/* =========================================================
   VESPERA – POSTAVY
========================================================= */

export function getVesperaCharacters() {
  return request(
    `${API}/vespera/characters`,
    {},
    "Nepodařilo se načíst postavy Vespery."
  );
}


/* =========================================================
   VESPERA – DETAIL
========================================================= */

export function getVesperaCharacter(
  characterId
) {
  return request(
    `${API}/vespera/characters/${characterId}`,
    {},
    "Nepodařilo se načíst postavu Vespery."
  );
}


/* =========================================================
   VESPERA – VYTVOŘIT
========================================================= */

export function addVesperaCharacter(
  character
) {
  return request(
    `${API}/vespera/characters`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(character),
    },

    "Nepodařilo se přidat postavu Vespery."
  );
}


/* =========================================================
   VESPERA – UPRAVIT
========================================================= */

export function updateVesperaCharacter(
  characterId,
  character
) {
  return request(
    `${API}/vespera/characters/${characterId}`,
    {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(character),
    },

    "Nepodařilo se upravit postavu Vespery."
  );
}


/* =========================================================
   VESPERA – SMAZAT
========================================================= */

export function deleteVesperaCharacter(
  characterId
) {
  return request(
    `${API}/vespera/characters/${characterId}`,
    {
      method: "DELETE",
    },

    "Nepodařilo se smazat postavu Vespery."
  );
}