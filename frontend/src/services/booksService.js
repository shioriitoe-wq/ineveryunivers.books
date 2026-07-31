export async function getBooks() {
  const response = await fetch("http://127.0.0.1:5000/api/books");

  if (!response.ok) {
    throw new Error("Nepodařilo se načíst knihy.");
  }

  return await response.json();
}