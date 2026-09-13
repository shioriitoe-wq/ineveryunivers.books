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

export function getChapterNarrator(chapterId) {
  return request(
    `${API}/aeil/chapters/${chapterId}/narrator`,
    {},
    "Nepodařilo se načíst vypravěče kapitoly."
  );
}

export function setChapterNarrator(
  chapterId,
  characterId
) {
  return request(
    `${API}/aeil/chapters/${chapterId}/narrator`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        character_id: characterId,
      }),
    },
    "Nepodařilo se uložit vypravěče kapitoly."
  );
}

export function deleteChapterNarrator(chapterId) {
  return request(
    `${API}/aeil/chapters/${chapterId}/narrator`,
    {
      method: "DELETE",
    },
    "Nepodařilo se odstranit vypravěče kapitoly."
  );
}

export function getCharacterChapters(characterId) {
  return request(
    `${API}/aeil/characters/${characterId}/chapters`,
    {},
    "Nepodařilo se načíst kapitoly postavy."
  );
}
