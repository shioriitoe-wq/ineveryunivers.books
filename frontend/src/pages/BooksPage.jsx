import { useEffect, useState } from "react";
import {
  getBooks,
  addBook,
  deleteBook,
} from "../services/booksService";

import BookCard from "../components/BookCard";
import AddBookForm from "../components/AddBookForm";

function BooksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function loadBooks() {
    setLoading(true);
    setError(false);

    try {
      const data = await getBooks();
      setBooks(data);
    } catch (error) {
      console.error(error);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBooks();
  }, []);

  async function handleAddBook(book) {
    try {
      await addBook(book);
      await loadBooks();
    } catch (error) {
      console.error(error);
    }
  }

  async function handleDeleteBook(id) {
    try {
      await deleteBook(id);
      await loadBooks();
    } catch (error) {
      console.error(error);
    }
  }

  if (loading) {
    return (
      <main>
        <h2>Knihy</h2>
        <p>Načítám knihy...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <h2>Knihy</h2>
        <p>Nepodařilo se načíst knihy.</p>
        <button onClick={loadBooks}>Zkusit znovu</button>
      </main>
    );
  }

  return (
    <main>
      <h2>Knihy</h2>

      <AddBookForm onAddBook={handleAddBook} />

      <hr />

      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          onDelete={handleDeleteBook}
        />
      ))}
    </main>
  );
}

export default BooksPage;