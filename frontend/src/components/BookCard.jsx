function BookCard({ book, onDelete }) {
  function handleDeleteClick() {
    const confirmed = window.confirm(
      `Opravdu chcete smazat knihu "${book.title}"?`
    );

    if (!confirmed) {
      return;
    }

    onDelete(book.id);
  }

  return (
    <div className="book-card">
      <h3>{book.title}</h3>

      <p>Status: {book.status}</p>

      <button onClick={handleDeleteClick}>
        🗑️ Smazat
      </button>
    </div>
  );
}

export default BookCard;