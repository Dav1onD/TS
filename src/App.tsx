import { useEffect, useState } from 'react';
import { Book } from './types/book';
import { BookCard } from './components/BookCard';
import { fetchBooks, generateCoverPlaceholder } from './api/booksApi';
import styles from './App.module.css';

interface BookWithCover {
  book: Book;
  coverImageBlob: Blob;
}

export function App() {
  const [booksWithCovers, setBooksWithCovers] = useState<BookWithCover[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBooks() {
      try {
        const books = await fetchBooks();
        const booksWithCovers: BookWithCover[] = books.map((book) => ({
          book,
          coverImageBlob: generateCoverPlaceholder(book.title),
        }));
        setBooksWithCovers(booksWithCovers);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      } finally {
        setLoading(false);
      }
    }

    loadBooks();
  }, []);

  if (loading) {
    return <div className={styles.message}>Загрузка...</div>;
  }

  if (error) {
    return <div className={styles.message}>Ошибка: {error}</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Книги</h1>
      <div className={styles.grid}>
        {booksWithCovers.map(({ book, coverImageBlob }) => (
          <BookCard
            key={book.id}
            title={book.title}
            authors={book.authors}
            coverImageBlob={coverImageBlob}
          />
        ))}
      </div>
    </div>
  );
}
