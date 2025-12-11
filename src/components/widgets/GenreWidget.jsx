'use client'; // indica que este componente se ejecuta en el cliente (navegador)

// importamos hooks de react
import { useEffect, useState } from 'react';

// array con los generos mas populares (se muestran por defecto)
const POPULAR_GENRES = [
  'pop', 'rock', 'hip-hop', 'electronic', 'indie', 'jazz',
  'classical', 'r-n-b', 'metal', 'country', 'reggae', 'latin',
  'funk', 'soul', 'blues', 'punk', 'folk', 'dance', 'house', 'techno'
];

// array completo con todos los generos disponibles en spotify
// nota: el endpoint de spotify para obtener generos esta deprecado, por eso estan hardcodeados
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

// componente principal del widget de generos
// props: selectedGenres (array de generos seleccionados), onSelect (callback para actualizar)
export default function GenreWidget({ selectedGenres, onSelect }) {
  // estado para almacenar todos los generos disponibles
  const [allGenres, setAllGenres] = useState([]);
  // estado para el texto de busqueda
  const [searchQuery, setSearchQuery] = useState('');
  // estado para mostrar todos los generos o solo los populares
  const [showAll, setShowAll] = useState(false);
  // estado de carga (aunque ahora es instantaneo porque estan hardcodeados)
  const [isLoading, setIsLoading] = useState(true);

  // useeffect que se ejecuta al montar el componente
  useEffect(() => {
    // usar directamente los generos hardcodeados (endpoint de spotify deprecado)
    setAllGenres(ALL_GENRES);
    setIsLoading(false); // desactivar estado de carga
  }, []); // array vacio = solo al montar

  // funcion para seleccionar o deseleccionar un genero
  const toggleGenre = (genre) => {
    // si el genero ya esta seleccionado, quitarlo; si no, anadirlo
    const updated = selectedGenres.includes(genre)
      ? selectedGenres.filter(g => g !== genre) // filtrar para quitar
      : [...selectedGenres, genre]; // spread para anadir

    onSelect(updated); // llamar al callback con el array actualizado
  };

  // determinar que generos mostrar segun el estado showAll y la busqueda
  const displayGenres = showAll
    ? allGenres.filter(g => g.toLowerCase().includes(searchQuery.toLowerCase())) // filtrar por busqueda
    : POPULAR_GENRES; // mostrar solo los populares

  // renderizado del componente
  return (
    // contenedor principal con padding
    <div className="p-4">
      {/* cabecera con titulo y contador */}
      <div className="flex items-center justify-between mb-3">
        {/* titulo del widget */}
        <h2 className="text-xl font-bold text-white">generos</h2>
        {/* badge con contador (solo si hay seleccionados) */}
        {selectedGenres.length > 0 && (
          <span className="text-xs bg-purple-500 px-2 py-1 rounded-full">
            {selectedGenres.length}
          </span>
        )}
      </div>

      {/* campo de busqueda (solo visible cuando showAll es true) */}
      {showAll && (
        <input
          type="text"
          value={searchQuery} // valor controlado
          onChange={(e) => setSearchQuery(e.target.value)} // actualizar estado
          placeholder="buscar genero..."
          // estilos: ancho completo, padding, fondo gris, focus con ring purpura
          className="w-full p-2 mb-3 rounded bg-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      )}

      {/* mostrar spinner mientras carga, o el contenido */}
      {isLoading ? (
        // estado de carga con spinner
        <div className="text-center py-6">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent"></div>
          <p className="text-sm text-gray-400 mt-2">cargando generos...</p>
        </div>
      ) : (
        // contenido principal cuando termina de cargar
        <>
          {/* contenedor de pills de generos con scroll */}
          <div className="flex flex-wrap gap-2 max-h-72 overflow-y-auto mb-3 p-1">
            {/* mapear cada genero a mostrar */}
            {displayGenres.map((genre) => {
              // verificar si este genero esta seleccionado
              const isSelected = selectedGenres.includes(genre);

              return (
                <button
                  key={genre} // key unica para react
                  onClick={() => toggleGenre(genre)} // toggle al hacer click
                  // estilos condicionales: gradiente si seleccionado, gris si no
                  className={`px-3 py-1.5 rounded-full text-sm capitalize transition-all transform hover:scale-105 ${isSelected
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                >
                  {/* reemplazar guiones por espacios para mejor legibilidad */}
                  {genre.replace(/-/g, ' ')}
                </button>
              );
            })}
          </div>

          {/* barra de acciones inferior */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-700">
            {/* boton para alternar entre ver todos o populares */}
            <button
              onClick={() => {
                setShowAll(!showAll); // toggle del estado
                setSearchQuery(''); // limpiar busqueda al cambiar
              }}
              className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
            >
              {/* contenido condicional segun el estado */}
              {showAll ? (
                // si esta mostrando todos, opcion para ver populares
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>ver populares</span>
                </>
              ) : (
                // si esta mostrando populares, opcion para ver todos
                <>
                  <span>ver todos ({allGenres.length})</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>

            {/* boton limpiar (solo si hay generos seleccionados) */}
            {selectedGenres.length > 0 && (
              <button
                onClick={() => onSelect([])} // limpiar pasando array vacio
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