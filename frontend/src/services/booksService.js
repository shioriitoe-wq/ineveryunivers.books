export async function getBooks() {
  const response = await fetch("http://127.0.0.1:5000/api/books");

  if (!response.ok) {
    throw new Error("Nepodařilo se načíst projekty.");
  }

  return await response.json();
}

export async function getBook(id) {
  const response = await fetch(`http://127.0.0.1:5000/api/books/${id}`);

  if (!response.ok) {
    throw new Error("Nepodařilo se načíst projekt.");
  }

  return await response.json();
}

export async function addBook(book) {
  const response = await fetch("http://127.0.0.1:5000/api/books", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(book),
  });

  if (!response.ok) {
    throw new Error("Nepodařilo se přidat projekt.");
  }

  return await response.json();
}

export async function updateBook(id, book) {
  const response = await fetch(`http://127.0.0.1:5000/api/books/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(book),
  });

  if (!response.ok) {
    throw new Error("Nepodařilo se upravit projekt.");
  }

  return await response.json();
}

export async function deleteBook(id) {
  const response = await fetch(`http://127.0.0.1:5000/api/books/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Nepodařilo se smazat projekt.");
  }

  return await response.json();
}