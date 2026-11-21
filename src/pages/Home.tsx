import { Link } from 'react-router-dom';

const AUTHORS = [
  {
    name: 'Рене Декарт',
    years: '1596–1650',
    texts: [
      {
        title: 'Meditationes de Prima Philosophia',
        year: '1641',
        link: '/descartes/meditations',
      },
      {
        title: "Les Passions de l'âme",
        year: '1649',
      },
    ],
  },
];

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-xl">
        {AUTHORS.map((author) => (
          <div key={author.name} className="flex gap-8">
            <img
              src="/descartes/descartes.jpg"
              alt={author.name}
              className="w-40 object-cover opacity-80"
            />
            <div>
              <h1 className="text-2xl font-serif mb-1">{author.name}</h1>
              <p className="text-stone-400 text-sm mb-6">{author.years}</p>
              <ul className="space-y-3">
                {author.texts.map((text) => (
                  <li
                    key={text.title}
                    className="flex items-baseline gap-2 font-serif whitespace-nowrap"
                  >
                    <span className="text-stone-400" aria-hidden="true">
                      •
                    </span>
                    {text.link ? (
                      <Link
                        to={text.link}
                        className="text-stone-800 hover:text-stone-600 underline underline-offset-2"
                      >
                        {text.title}
                      </Link>
                    ) : (
                      <span className="text-stone-400">{text.title}</span>
                    )}
                    <span className="text-sm text-stone-400">· {text.year}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
