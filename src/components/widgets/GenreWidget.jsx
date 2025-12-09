'use client';

import { useEffect, useState } from 'react';

const POPULAR_GENRES = [
  'pop', 'rock', 'hip-hop', 'electronic', 'indie', 'jazz',
  'classical', 'r-n-b', 'metal', 'country', 'reggae', 'latin',
  'funk', 'soul', 'blues', 'punk', 'folk', 'dance', 'house', 'techno'
];

const ALL_GENRES = [
  'acoustic', 'afrobeat', 'alt-rock', 'alternative', 'ambient', 'anime', 'black-metal', 
  'bluegrass', 'blues', 'bossanova', 'brazil', 'breakbeat', 'british', 'cantopop', 
  'chicago-house', 'children', 'chill', 'classical', 'club', 'comedy', 'country', 'dance', 
  'dancehall', 'death-metal', 'deep-house', 'detroit-techno', 'disco', 'disney', 
  'drum-and-bass', 'dub', 'dubstep', 'edm', 'electro', 'electronic', 'emo', 'folk', 
  'forro', 'french', 'funk', 'garage', 'german', 'gospel', 'goth', 'grindcore', 'groove', 
  'grunge', 'guitar', 'happy', 'hard-rock', 'hardcore', 'hardstyle', 'heavy-metal', 
  'hip-hop', 'house', 'idm', 'indian', 'indie', 'indie-pop', 'industrial', 'iranian', 
  'j-dance', 'j-idol', 'j-pop', 'j-rock', 'jazz', 'k-pop', 'kids', 'latin', 'latino', 
  'malay', 'mandopop', 'metal', 'metal-misc', 'metalcore', 'minimal-techno', 'movies', 
  'mpb', 'new-age', 'new-release', 'opera', 'pagode', 'party', 'philippines-opm', 'piano', 
  'pop', 'pop-film', 'post-dubstep', 'power-pop', 'progressive-house', 'psych-rock', 
  'punk', 'punk-rock', 'r-n-b', 'rainy-day', 'reggae', 'reggaeton', 'road-trip', 'rock', 
  'rock-n-roll', 'rockabilly', 'romance', 'sad', 'salsa', 'samba', 'sertanejo', 
  'show-tunes', 'singer-songwriter', 'ska', 'sleep', 'songwriter', 'soul', 'soundtracks', 
  'spanish', 'study', 'summer', 'swedish', 'synth-pop', 'tango', 'techno', 'trance', 
  'trip-hop', 'turkish', 'work-out', 'world-music'
];

export default function GenreWidget({ selectedGenres, onSelect }) {
  const [allGenres, setAllGenres] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Usar directamente los géneros hardcodeados (endpoint deprecado como dice nos dices en el github)
    setAllGenres(ALL_GENRES);
    setIsLoading(false);
  }, []);

  const toggleGenre = (genre) => {
    const updated = selectedGenres.includes(genre)
      ? selectedGenres.filter(g => g !== genre)
      : [...selectedGenres, genre];

    onSelect(updated);
  };

  const displayGenres = showAll
    ? allGenres.filter(g => g.toLowerCase().includes(searchQuery.toLowerCase()))
    : POPULAR_GENRES;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold text-white">géneros</h2>
        {selectedGenres.length > 0 && (
          <span className="text-xs bg-purple-500 px-2 py-1 rounded-full">
            {selectedGenres.length}
          </span>
        )}
      </div>

      {showAll && (
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="buscar género..."
          className="w-full p-2 mb-3 rounded bg-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      )}

      {isLoading ? (
        <div className="text-center py-6">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent"></div>
          <p className="text-sm text-gray-400 mt-2">cargando géneros...</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 max-h-72 overflow-y-auto mb-3 p-1">
            {displayGenres.map((genre) => {
              const isSelected = selectedGenres.includes(genre);

              return (
                <button
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={`px-3 py-1.5 rounded-full text-sm capitalize transition-all transform hover:scale-105 ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {genre.replace(/-/g, ' ')}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-700">
            <button
              onClick={() => {
                setShowAll(!showAll);
                setSearchQuery('');
              }}
              className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
            >
              {showAll ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                  </svg>
                  <span>ver populares</span>
                </>
              ) : (
                <>
                  <span>ver todos ({allGenres.length})</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>

            {selectedGenres.length > 0 && (
              <button
                onClick={() => onSelect([])}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                limpiar
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}