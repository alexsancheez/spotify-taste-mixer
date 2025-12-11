'use client'; // indica que este componente se ejecuta en el cliente (navegador), no en el servidor

// importamos los hooks de react necesarios
import { useEffect, useState, useRef } from 'react';
// importamos la funcion para obtener el token de acceso de spotify
import { getAccessToken } from '@/lib/auth';

// componente principal del widget de artistas
// props: selectedArtists (array de artistas seleccionados), onSelect (funcion callback para actualizar seleccion)
export default function ArtistWidget({ selectedArtists, onSelect }) {
  // estado para almacenar el texto de busqueda del usuario
  const [query, setQuery] = useState('');
  // estado para almacenar los resultados de busqueda de la api de spotify
  const [results, setResults] = useState([]);
  // estado para indicar si se esta realizando una busqueda (muestra spinner)
  const [isSearching, setIsSearching] = useState(false);
  // referencia para almacenar el timer del debounce (evita busquedas excesivas)
  const debounceTimer = useRef(null);

  // funcion asincrona para buscar artistas en la api de spotify
  const searchArtists = async (q) => {
    // si la busqueda tiene menos de 2 caracteres, limpiar resultados y salir
    if (q.length < 2) {
      setResults([]); // limpiar resultados previos
      setIsSearching(false); // desactivar indicador de carga
      return; // salir de la funcion
    }

    setIsSearching(true); // activar indicador de carga (spinner)

    try {
      // obtener el token de acceso de spotify (se refresca automaticamente si expiro)
      const token = await getAccessToken();

      // si no hay token disponible, mostrar error y salir
      if (!token) {
        console.error('No token available'); // log de error en consola
        setResults([]); // limpiar resultados
        setIsSearching(false); // desactivar spinner
        return; // salir de la funcion
      }

      // realizar peticion a la api de spotify para buscar artistas
      const response = await fetch(
        // url de la api con parametros: tipo=artista, query codificado, limite=10 resultados
        `https://api.spotify.com/v1/search?type=artist&q=${encodeURIComponent(q)}&limit=10`,
        {
          headers: {
            // header de autorizacion con el token bearer
            Authorization: `Bearer ${token}`
          }
        }
      );

      // si la respuesta no es exitosa (codigo 4xx o 5xx), lanzar error
      if (!response.ok) {
        console.error('Search failed:', response.status); // log del codigo de error
        throw new Error('Search failed'); // lanzar excepcion
      }

      // convertir la respuesta a json
      const data = await response.json();
      // guardar los artistas encontrados en el estado (o array vacio si no hay)
      setResults(data.artists?.items || []);
    } catch (error) {
      // si hay cualquier error, mostrarlo en consola y limpiar resultados
      console.error('Error searching artists:', error);
      setResults([]);
    } finally {
      // siempre al finalizar (exito o error), desactivar el spinner
      setIsSearching(false);
    }
  };

  // funcion que maneja los cambios en el input de busqueda
  const handleInput = (e) => {
    const value = e.target.value; // obtener el valor actual del input
    setQuery(value); // actualizar el estado del query

    // si hay un timer de debounce activo, cancelarlo
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // si el texto tiene menos de 2 caracteres, limpiar resultados y no buscar
    if (value.length < 2) {
      setResults([]);
      return;
    }

    // crear un nuevo timer de debounce: esperar 500ms antes de buscar
    // esto evita hacer una peticion por cada tecla presionada
    debounceTimer.current = setTimeout(() => {
      searchArtists(value); // ejecutar la busqueda despues de 500ms de inactividad
    }, 500);
  };

  // funcion para seleccionar o deseleccionar un artista
  const toggleArtist = (artist) => {
    let updated; // variable para almacenar el nuevo array de artistas

    // verificar si el artista ya esta seleccionado (comparando por id)
    if (selectedArtists.some(a => a.id === artist.id)) {
      // si ya esta seleccionado, removerlo del array (filtrar)
      updated = selectedArtists.filter(a => a.id !== artist.id);
    } else {
      // si no esta seleccionado, anadirlo al array
      updated = [...selectedArtists, artist];
    }

    onSelect(updated); // llamar al callback del padre con el nuevo array
    setQuery(''); // limpiar el campo de busqueda
    setResults([]); // limpiar los resultados de busqueda
  };

  // useeffect para limpiar el timer cuando el componente se desmonta
  // esto previene memory leaks y errores de "can't update unmounted component"
  useEffect(() => {
    return () => { // esta funcion se ejecuta al desmontar el componente
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current); // cancelar el timer pendiente
      }
    };
  }, []); // array vacio = solo se ejecuta al montar/desmontar

  // renderizado del componente
  return (
    // contenedor principal con padding
    <div className="p-4">
      {/* titulo del widget */}
      <h2 className="text-xl font-bold mb-3 text-white">artistas</h2>

      {/* seccion: campo de busqueda */}
      <div className="relative mb-3">
        {/* input de busqueda */}
        <input
          type="text"
          value={query} // valor controlado por el estado
          onChange={handleInput} // handler para cambios
          placeholder="buscar artista..."
          // estilos: ancho completo, padding, bordes redondeados, fondo gris, texto blanco
          // focus: quitar outline por defecto, anadir ring purpura
          className="w-full p-2 pr-10 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
        />
        {/* icono a la derecha del input (spinner o lupa) */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isSearching ? (
            // si esta buscando, mostrar spinner animado
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-500 border-t-transparent"></div>
          ) : (
            // si no esta buscando, mostrar icono de lupa (svg)
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
      </div>

      {/* seccion: artistas seleccionados (solo si hay alguno) */}
      {selectedArtists.length > 0 && (
        <div className="mb-3">
          {/* contador de artistas seleccionados */}
          <div className="text-xs text-gray-400 mb-2">seleccionados ({selectedArtists.length}):</div>
          {/* contenedor flex con wrap para las "pills" de artistas */}
          <div className="flex flex-wrap gap-2">
            {/* mapear cada artista seleccionado a un boton/pill */}
            {selectedArtists.map((artist) => (
              <button
                key={artist.id} // key unica para react
                onClick={() => toggleArtist(artist)} // click para deseleccionar
                // estilos: gradiente purpura-rosa, bordes redondeados, sombra
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1.5 rounded-full text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
              >
                <span>{artist.name}</span>
                {/* icono x para indicar que se puede eliminar */}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* seccion: resultados de busqueda (solo si hay resultados) */}
      {results.length > 0 && (
        // contenedor con scroll vertical si hay muchos resultados
        <div className="space-y-2 max-h-80 overflow-y-auto">
          <div className="text-xs text-gray-400 mb-2">resultados:</div>
          {/* mapear cada resultado de busqueda */}
          {results.map((artist) => {
            // verificar si este artista ya esta seleccionado
            const isSelected = selectedArtists.some(a => a.id === artist.id);

            return (
              <div
                key={artist.id}
                // solo permitir click si no esta seleccionado
                onClick={() => !isSelected && toggleArtist(artist)}
                // estilos condicionales: si esta seleccionado, opacidad reducida
                className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-all ${isSelected
                    ? 'bg-gray-700 opacity-50 cursor-not-allowed'
                    : 'bg-gray-800 hover:bg-gray-700'
                  }`}
              >
                {/* imagen del artista (circular) */}
                <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-700">
                  {/* si el artista tiene imagen, mostrarla */}
                  {artist.images?.[0]?.url ? (
                    <img
                      src={artist.images[0].url}
                      alt={artist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    // si no tiene imagen, mostrar emoji de microfono
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      🎤
                    </div>
                  )}
                  {/* overlay con checkmark si esta seleccionado */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* informacion del artista */}
                <div className="flex-1 min-w-0">
                  {/* nombre del artista (truncado si es muy largo) */}
                  <div className="font-semibold text-white truncate">{artist.name}</div>
                  {/* generos del artista (maximo 2, separados por coma) */}
                  {artist.genres?.length > 0 && (
                    <div className="text-xs text-gray-400 truncate">
                      {artist.genres.slice(0, 2).join(', ')}
                    </div>
                  )}
                  {/* numero de seguidores formateado con separadores de miles */}
                  <div className="text-xs text-gray-500">
                    {artist.followers?.total?.toLocaleString()} seguidores
                  </div>
                </div>

                {/* icono + para indicar que se puede anadir (solo si no esta seleccionado) */}
                {!isSelected && (
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* seccion: estado vacio - no se encontraron artistas */}
      {/* se muestra cuando: hay busqueda (>=2 chars), no hay resultados, y no esta buscando */}
      {query.length >= 2 && results.length === 0 && !isSearching && (
        <div className="text-center py-6 text-gray-400 text-sm">
          no se encontraron artistas
        </div>
      )}

      {/* seccion: estado inicial - instrucciones para el usuario */}
      {/* se muestra cuando: no hay artistas seleccionados, no hay resultados, y no hay query */}
      {selectedArtists.length === 0 && results.length === 0 && !query && (
        <div className="text-center py-6 text-gray-500 text-sm">
          busca y selecciona tus artistas favoritos
        </div>
      )}
    </div>
  );
}