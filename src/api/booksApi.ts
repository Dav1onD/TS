import { Book } from '../types/book';

const BOOKS_API_URL = 'https://fakeapi.extendsclass.com/books';

export async function fetchBooks(): Promise<Book[]> {
  const response = await fetch(BOOKS_API_URL);
  if (!response.ok) {
    throw new Error(`Ошибка при получении книг: ${response.status}`);
  }
  return response.json();
}

/**
 * Генерирует заглушку-обложку с названием книги.
 * Возвращает Blob в формате PNG.
 */
export function generateCoverPlaceholder(title: string): Blob {
  const canvas = document.createElement('canvas');
  const width = 200;
  const height = 280;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Фон — градиент
  const hue = (title.charCodeAt(0) * 37) % 360;
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, `hsl(${hue}, 50%, 65%)`);
  gradient.addColorStop(1, `hsl(${hue}, 50%, 45%)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Рамка
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, width - 20, height - 20);

  // Текст — название книги
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const fontSize = title.length > 25 ? 16 : title.length > 15 ? 20 : 24;
  ctx.font = `bold ${fontSize}px sans-serif`;

  // Перенос длинных названий
  const words = title.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  const maxWidth = width - 40;

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  const lineHeight = fontSize * 1.3;
  const totalHeight = lines.length * lineHeight;
  const startY = (height - totalHeight) / 2 + lineHeight / 2;

  lines.forEach((line, i) => {
    ctx.fillText(line, width / 2, startY + i * lineHeight);
  });

  return new Blob([canvas.toDataURL('image/png').split(',')[1]], { type: 'image/png' });
}
