export interface Book {
  id: number;
  title: string;
  isbn: string | null;
  pageCount: number;
  authors: string[];
}

export interface BookCardProps {
  title: string;
  authors: string[];
  coverImageBlob: Blob;
}
