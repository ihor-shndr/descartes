import { Link } from 'react-router-dom';

const AUTHORS = [
  {
    name: 'René Descartes',
    years: '1596–1650',
    texts: [
      { title: 'Meditationes de Prima Philosophia', link: '/descartes/meditations' },
      { title: 'Discours de la méthode' },
      { title: 'Principia Philosophiae' },
      { title: 'Regulae ad directionem ingenii' },
    ],
  },
];

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-lg">
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
                  <li key={text.title} className="font-serif">
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
