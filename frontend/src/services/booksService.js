export async function getBooks() {
  const response = await fetch("http://127.0.0.1:5000/api/books");

  if (!response.ok) {
    throw new Error("Nepodařilo se načíst knihy.");
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
    throw new Error("Nepodařilo se přidat knihu.");
  }

  return await response.json();
}
export async function deleteBook(id) {
  const response = await fetch(`http://127.0.0.1:5000/api/books/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Nepodařilo se smazat knihu.");
  }

  return await response.json();
}