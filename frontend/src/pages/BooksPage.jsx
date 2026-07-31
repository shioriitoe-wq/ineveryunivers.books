import { useEffect, useState } from "react";
import { getBooks, addBook } from "../services/booksService";

function BooksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("Rozpracováno");

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

  useEffect(() => {
    loadBooks();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      await addBook({
        title,
        status,
      });

      setTitle("");
      setStatus("Rozpracováno");

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

  return (
    <main>
      <h2>Knihy</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Název knihy</label>
          <br />
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <br />

        <div>
          <label>Stav</label>
          <br />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option>Rozpracováno</option>
            <option>Plánováno</option>
            <option>Dokončeno</option>
          </select>
        </div>

        <br />

        <button type="submit">Přidat knihu</button>
      </form>

      <hr />

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