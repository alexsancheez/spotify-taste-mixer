'use client';

import { useEffect, useState } from 'react';
import { getAccessToken } from '@/lib/auth';

const POPULAR_GENRES = [
  'pop', 'rock', 'hip-hop', 'electronic', 'indie', 'jazz',
  'r-n-b', 'metal', 'country', 'latin', 'reggae', 'blues'
];

export default function GenreWidget({ selectedGenres, onSelect }) {
  const [allGenres, setAllGenres] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Obtener géneros disponibles desde spotify
  useEffect(() => {
    const fetchGenres = async () => {
      const token = getAccessToken();
      if (!token) return;

      setIsLoading(true);
      try {
        const response = await fetch(
          'https://api.spotify.com/v1/recommendations/available-genre-seeds',
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await response.json();
        setAllGenres(data.genres || []);
      } catch (error) {
        console.error('Error fetching genres:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGenres();
  }, []);

  // Añadir o quitar género
  const toggleGenre = (genre) => {
    let updated;

    if (selectedGenres.includes(genre)) {
      updated = selectedGenres.filter(g => g !== genre);
    } else {
      updated = [...selectedGenres, genre];
    }

    onSelect(updated);
  };

  // Filtrar géneros según búsqueda
  const displayGenres = showAll
    ? allGenres.filter(g => g.toLowerCase().includes(searchQuery.toLowerCase()))
    : POPULAR_GENRES.filter(g => allGenres.includes(g));

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

      {/* Search (only when showing all) */}
      {showAll && (
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="buscar género..."
          className="w-full p-2 mb-3 rounded bg-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="text-center py-6">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent"></div>
          <p className="text-sm text-gray-400 mt-2">cargando géneros...</p>
        </div>
      ) : (
        <>
          {/* Genre Pills */}
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

          {/* Toggle Show All */}
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

          {/* No Results */}
          {showAll && searchQuery && displayGenres.length === 0 && (
            <div className="text-center py-4 text-gray-400 text-sm">
              no se encontraron géneros
            </div>
          )}
        </>
      )}
    </div>
  );
}