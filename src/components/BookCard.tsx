import { useEffect, useState } from 'react';
import { BookCardProps } from '../types/book';
import styles from './BookCard.module.css';

export function BookCard({ title, authors, coverImageBlob }: BookCardProps) {
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    const url = URL.createObjectURL(coverImageBlob);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [coverImageBlob]);

  return (
    <div className={styles.card}>
      <div className={styles.cover}>
        <img src={imageUrl} alt={title} />
      </div>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.authors}>{authors.join(', ')}</p>
    </div>
  );
}
