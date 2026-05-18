import { Link, useLocation } from 'react-router-dom';

type NotFoundPageProps = {
  title?: string;
  description?: string;
};

export function NotFoundPage({
  title = 'Страница не найдена',
  description = 'Проверьте адрес или вернитесь к списку документов.',
}: NotFoundPageProps) {
  const location = useLocation();

  return (
    <section className="content-panel empty-state">
      <p className="app-header-eyebrow">{location.pathname}</p>
      <h2>{title}</h2>
      <p>{description}</p>
      <Link className="primary-button link-button" to="/dashboard">
        Перейти к документам
      </Link>
    </section>
  );
}
