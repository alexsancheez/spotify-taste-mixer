'use client';

import { useEffect, useState, useRef } from 'react';
import { getAccessToken } from '@/lib/auth';

export default function ArtistWidget({ selectedArtists, onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimer = useRef(null);

  // Buscar artistas en spotify con debounce
  const searchArtists = async (q) => {
    const token = getAccessToken();
    if (!token || q.length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?type=artist&q=${encodeURIComponent(q)}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();
      setResults(data.artists?.items || []);
    } catch (error) {
      console.error('Error searching artists:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Gestionar cambios en la búsqueda con debounce
  const handleInput = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (value.length < 2) {
      setResults([]);
      return;
    }

    debounceTimer.current = setTimeout(() => {
      searchArtists(value);
    }, 500);
  };

  // Seleccionar/deseleccionar artista
  const toggleArtist = (artist) => {
    let updated;

    if (selectedArtists.some(a => a.id === artist.id)) {
      updated = selectedArtists.filter(a => a.id !== artist.id);
    } else {
      updated = [...selectedArtists, artist];
    }

    onSelect(updated);
    setQuery('');
    setResults([]);
  };

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-3 text-white">artistas</h2>

      {/* Search Input */}
      <div className="relative mb-3">
        <input
          type="text"
          value={query}
          onChange={handleInput}
          placeholder="buscar artista..."
          className="w-full p-2 pr-10 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isSearching ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-500 border-t-transparent"></div>
          ) : (
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          )}
        </div>
      </div>

      {/* Selected Artists */}
      {selectedArtists.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-gray-400 mb-2">seleccionados ({selectedArtists.length}):</div>
          <div className="flex flex-wrap gap-2">
            {selectedArtists.map((artist) => (
              <button
                key={artist.id}
                onClick={() => toggleArtist(artist)}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1.5 rounded-full text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
              >
                <span>{artist.name}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          <div className="text-xs text-gray-400 mb-2">resultados:</div>
          {results.map((artist) => {
            const isSelected = selectedArtists.some(a => a.id === artist.id);
            
            return (
              <div
                key={artist.id}
                onClick={() => !isSelected && toggleArtist(artist)}
                className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-all ${
                  isSelected 
                    ? 'bg-gray-700 opacity-50 cursor-not-allowed' 
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-700">
                  {artist.images?.[0]?.url ? (
                    <img
                      src={artist.images[0].url}
                      alt={artist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      🎤
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white truncate">{artist.name}</div>
                  {artist.genres?.length > 0 && (
                    <div className="text-xs text-gray-400 truncate">
                      {artist.genres.slice(0, 2).join(', ')}
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    {artist.followers?.total?.toLocaleString()} seguidores
                  </div>
                </div>

                {!isSelected && (
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {query.length >= 2 && results.length === 0 && !isSearching && (
        <div className="text-center py-6 text-gray-400 text-sm">
          no se encontraron artistas
        </div>
      )}

      {selectedArtists.length === 0 && results.length === 0 && !query && (
        <div className="text-center py-6 text-gray-500 text-sm">
          busca y selecciona tus artistas favoritos
        </div>
      )}
    </div>
  );
}