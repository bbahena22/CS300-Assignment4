import { useState, useEffect } from "react";
import Rating from "./components/Rating";
import "./App.css";

const normalizeBookText = (value = "") => value.trim().toLowerCase();

const getBookIdentity = (book) =>
  [
    normalizeBookText(book.title),
    normalizeBookText(book.author_name?.[0]),
    book.first_publish_year || "unknown-year",
  ].join("|");

const hasCover = (book) => Boolean(book.cover_i);

const getUniqueBooks = (books) => {
  const uniqueBooks = new Map();

  books.forEach((book) => {
    const identity = getBookIdentity(book);
    const existingBook = uniqueBooks.get(identity);

    if (!existingBook || (!hasCover(existingBook) && hasCover(book))) {
      uniqueBooks.set(identity, book);
    }
  });

  return [...uniqueBooks.values()];
};

function App() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("The Hunger Games");
  const [ratings, setRatings] = useState({});
  const [ratedBooks, setRatedBooks] = useState({});
  const [activeTab, setActiveTab] = useState("browse");

  // Fetch books
  useEffect(() => {
    fetch(`https://openlibrary.org/search.json?q=${search}`)
      .then((res) => res.json())
      .then((data) => setBooks(getUniqueBooks(data.docs).slice(0, 12)));
  }, [search]);

  // Load saved ratings
  useEffect(() => {
    const saved = localStorage.getItem("ratings");
    if (saved) setRatings(JSON.parse(saved));

    const savedRatedBooks = localStorage.getItem("ratedBooks");
    if (savedRatedBooks) setRatedBooks(JSON.parse(savedRatedBooks));
  }, []);

  // Save ratings
  useEffect(() => {
    localStorage.setItem("ratings", JSON.stringify(ratings));
  }, [ratings]);

  // Save rated book records
  useEffect(() => {
    localStorage.setItem("ratedBooks", JSON.stringify(ratedBooks));
  }, [ratedBooks]);

  // Handle rating per book
  const handleRate = (book, value) => {
    const bookId = getBookIdentity(book);
    const bookTitle = book.title;

    setRatings((prev) => ({
      ...prev,
      [bookId]: value,
    }));

    setRatedBooks((prev) => ({
      ...prev,
      [bookId]: {
        id: bookId,
        title: bookTitle,
        author: book.author_name?.[0] || "Unknown author",
        year: book.first_publish_year,
        cover:
          book.cover ||
          (book.cover_i
            ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
            : "https://via.placeholder.com/128x180?text=No+Image"),
        rating: value,
      },
    }));
  };

  const handleRemoveRatedBook = (bookId) => {
    setRatings((prev) => {
      const next = { ...prev };
      delete next[bookId];
      return next;
    });

    setRatedBooks((prev) => {
      const next = { ...prev };
      delete next[bookId];
      return next;
    });
  };

  const handleRemoveAllRatedBooks = () => {
    setRatings({});
    setRatedBooks({});
  };

  const ratedBooksList = Object.values(ratedBooks).sort((a, b) =>
    a.title.localeCompare(b.title)
  );

  return (
    <div className="page">

      {/* Sticky Header */}
      <div className="sticky-header">
        <h1 className="title">📚 Brandon's Books Rating App</h1>
        <p>This is a simple book rating app where you can search for books and rate them.</p>
        <p>Welcome to my book rating app!</p>

        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === "browse" ? "active" : ""}`}
            onClick={() => setActiveTab("browse")}
          >
            Browse Books
          </button>
          <button
            className={`tab-btn ${activeTab === "rated" ? "active" : ""}`}
            onClick={() => setActiveTab("rated")}
          >
            Rated Books ({ratedBooksList.length})
          </button>
        </div>

        <div className="search-bar">
          {activeTab === "browse" && (
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search books..."
            />
          )}
        </div>
      </div>

      {activeTab === "browse" ? (
        <div className="grid">
          {books.map((book) => (
            <div key={getBookIdentity(book)} className="book-card">
              <img
                src={
                  book.cover_i
                    ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
                    : "https://via.placeholder.com/128x180?text=No+Image"
                }
                alt={book.title}
              />

              <h3>{book.title}</h3>
              <p>{book.author_name?.[0]}</p>

              <Rating
                totalStars={5}
                rating={ratings[getBookIdentity(book)] || 0}
                onRate={(value) => handleRate(book, value)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="rated-grid">
          <div className="rated-actions">
            <button
              className="remove-all-btn"
              onClick={handleRemoveAllRatedBooks}
              disabled={ratedBooksList.length === 0}
            >
              Remove All
            </button>
          </div>

          {ratedBooksList.length === 0 ? (
            <p className="empty-state">No rated books yet. Rate a book to save it here.</p>
          ) : (
            ratedBooksList.map((book) => (
              <div key={book.id || getBookIdentity(book)} className="book-card rated-card">
                <img src={book.cover} alt={book.title} />
                <h3>{book.title}</h3>
                <p>{book.author}</p>
                <Rating
                  totalStars={5}
                  rating={
                    ratings[book.id || getBookIdentity(book)] || book.rating || 0
                  }
                  onRate={(value) =>
                    handleRate(
                      {
                        title: book.title,
                        author_name: [book.author],
                        cover: book.cover,
                        first_publish_year: book.year,
                      },
                      value
                    )
                  }
                />
                <button
                  className="remove-btn"
                  onClick={() =>
                    handleRemoveRatedBook(book.id || getBookIdentity(book))
                  }
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default App;