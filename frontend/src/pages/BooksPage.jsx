import { useEffect, useState } from "react";
import { getBooks } from "../services/booksService";

function BooksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBooks() {
      try {
        const data = await getBooks();
        setBooks(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadBooks();
  }, []);

  if (loading) {
    return (
      <main>
        <h2>Knihy</h2>
        <p>Načítám knihy...</p>
      </main>
    );
  }

  return (
    <main>
      <h2>Knihy</h2>

      {books.map((book) => (
        <div key={book.id}>
          <h3>{book.title}</h3>
          <p>{book.status}</p>
        </div>
      ))}
    </main>
  );
}

export default BooksPage;