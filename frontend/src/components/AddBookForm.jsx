import { useState } from "react";

function AddBookForm({ onAddBook }) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("Rozpracováno");

  async function handleSubmit(event) {
    event.preventDefault();

    await onAddBook({
      title,
      status,
    });

    setTitle("");
    setStatus("Rozpracováno");
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="title">Název knihy</label>
        <br />
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <br />

      <div>
        <label htmlFor="status">Stav</label>
        <br />
        <select
          id="status"
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
  );
}

export default AddBookForm;