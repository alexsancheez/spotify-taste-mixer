// =====================================================
// spotify.js - modulo de interaccion con la api de spotify
// maneja: busquedas, generacion de playlists, cache, etc.
// =====================================================

// importar la funcion para obtener el token de acceso
import { getAccessToken } from './auth';

// =====================================================
// sistema de cache en memoria
// =====================================================

// mapa para almacenar resultados en cache (evita peticiones repetidas)
const cache = new Map();
// duracion del cache: 5 minutos
const CACHE_DURATION = 5 * 60 * 1000;

// funcion para generar una clave unica de cache
// combina el tipo de consulta con los parametros
function getCacheKey(type, query) {
  return `${type}:${JSON.stringify(query)}`;
}

// funcion para obtener un valor del cache si existe y no ha expirado
function getFromCache(key) {
  const cached = cache.get(key);
  // si no hay valor en cache, retornar null
  if (!cached) return null;

  // verificar si el cache ha expirado
  const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
  if (isExpired) {
    cache.delete(key); // eliminar entrada expirada
    return null;
  }

  return cached.data; // retornar datos cacheados
}

// funcion para guardar un valor en el cache
function setCache(key, data) {
  cache.set(key, {
    data,                    // los datos a cachear
    timestamp: Date.now()    // timestamp para calcular expiracion
  });
}

// =====================================================
// funcion auxiliar para peticiones a spotify
// =====================================================

// funcion que hace peticiones a la api de spotify con reintentos automaticos
// maneja rate limiting, errores de autenticacion y reintentos
async function fetchSpotify(url, options = {}, retries = 3) {
  // obtener token (se auto-refresca si expiro)
  const token = await getAccessToken();

  // si no hay token, lanzar error (usuario no autenticado)
  if (!token) {
    throw new Error('No access token available. Please log in again.');
  }

  try {
    // hacer la peticion fetch con el token de autorizacion
    const response = await fetch(url, {
      ...options, // mezclar opciones proporcionadas
      headers: {
        'Authorization': `Bearer ${token}`, // header de autorizacion
        ...options.headers // mezclar headers adicionales
      }
    });

    // manejar rate limiting (codigo 429: demasiadas peticiones)
    if (response.status === 429) {
      // obtener tiempo de espera del header o usar 1 segundo por defecto
      const retryAfter = response.headers.get('Retry-After') || 1;
      // esperar el tiempo indicado
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      // reintentar si quedan intentos
      if (retries > 0) return fetchSpotify(url, options, retries - 1);
    }

    // manejar token invalido o expirado (codigo 401)
    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }

    // manejar otros errores http
    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`);
    }

    // parsear y retornar respuesta json
    return await response.json();
  } catch (error) {
    // no reintentar errores 404 (recursos no encontrados, son esperados)
    if (error.message.includes('404')) {
      throw error;
    }
    // reintentar si quedan intentos y no es error de autenticacion
    if (retries > 0 && !error.message.includes('Authentication')) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // esperar 1 segundo
      return fetchSpotify(url, options, retries - 1);
    }
    throw error;
  }
}

// =====================================================
// funcion principal: generar playlist
// =====================================================

// genera una playlist basada en las preferencias del usuario
// recibe: artistas, generos, decadas, popularidad, etc.
export async function generatePlaylist(preferences) {
  // destructuring de las preferencias con valores por defecto
  const { artists, genres, decades, popularity, audioFeatures, excludeIds = [], forceRefresh = false } = preferences;
  let allTracks = []; // array para acumular todos los tracks
  const trackIds = new Set(excludeIds); // set para evitar duplicados

  try {
    // obtener el mercado (pais) del usuario desde su perfil
    let userMarket = 'ES'; // fallback: espana
    try {
      const userData = await fetchSpotify('https://api.spotify.com/v1/me');
      if (userData && userData.country) {
        userMarket = userData.country;
      }
    } catch (e) {
      console.warn('Could not get user market, using ES as fallback');
    }

    // =====================================================
    // paso 1: obtener tracks de artistas seleccionados
    // =====================================================
    if (artists && artists.length > 0) {
      // generar clave de cache para estos artistas
      const cacheKey = getCacheKey('artists', artists.map(a => a.id));
      const cached = getFromCache(cacheKey);

      if (cached) {
        // si hay cache valido, usarlo
        console.log('📦 Using cached artist tracks:', cached.length);
        allTracks.push(...cached);
      } else {
        // si no hay cache, hacer peticiones a la api
        console.log('🔍 Fetching top tracks for', artists.length, 'artists with market:', userMarket);

        // obtener top tracks de cada artista en paralelo
        const artistTracks = await Promise.all(
          artists.map(async (artist) => {
            try {
              console.log(`🎤 Fetching tracks for ${artist.name} (${artist.id})`);
              // endpoint: top tracks del artista
              const data = await fetchSpotify(
                `https://api.spotify.com/v1/artists/${artist.id}/top-tracks?market=${userMarket}`
              );
              console.log(`✅ Got ${data.tracks?.length || 0} tracks for ${artist.name}`, data);
              return data.tracks || [];
            } catch (err) {
              console.error(`❌ Error fetching tracks for ${artist.name}:`, err);
              return []; // retornar array vacio si hay error
            }
          })
        );

        // aplanar el array de arrays y cachear
        const tracks = artistTracks.flat();
        console.log('📊 Total artist tracks fetched:', tracks.length);
        setCache(cacheKey, tracks);
        allTracks.push(...tracks);
      }
    }

    // =====================================================
    // paso 2: buscar tracks por genero
    // =====================================================
    if (genres && genres.length > 0) {
      console.log('🎸 Searching tracks for', genres.length, 'genres');

      // buscar tracks para cada genero en paralelo
      const genreTracks = await Promise.all(
        genres.map(async (genre) => {
          const cacheKey = getCacheKey('genre', genre);
          const cached = getFromCache(cacheKey);

          if (cached) {
            console.log(`📦 Using cached tracks for genre: ${genre}`);
            return cached;
          }

          // intentar primero con formato genre: (mas preciso)
          const genreQuery = `genre:${encodeURIComponent(genre)}`;
          let data = await fetchSpotify(
            `https://api.spotify.com/v1/search?type=track&q=${genreQuery}&limit=50`
          );

          let tracks = data.tracks?.items || [];
          console.log(`🔍 Genre '${genre}' with genre: query returned ${tracks.length} tracks`);

          // si no hay resultados con genre:, intentar busqueda simple como fallback
          if (tracks.length === 0) {
            console.log(`⚠️ No results with genre:, trying simple search for '${genre}'`);
            data = await fetchSpotify(
              `https://api.spotify.com/v1/search?type=track&q=${encodeURIComponent(genre)}&limit=50`
            );
            tracks = data.tracks?.items || [];
            console.log(`🔍 Simple search for '${genre}' returned ${tracks.length} tracks`);
          }

          setCache(cacheKey, tracks);
          return tracks;
        })
      );

      // anadir todos los tracks de generos
      allTracks.push(...genreTracks.flat());
    }

    // si no hay artistas ni generos, buscar tracks populares recientes
    if (allTracks.length === 0) {
      const data = await fetchSpotify(
        'https://api.spotify.com/v1/search?type=track&q=year:2020-2024&limit=50'
      );
      allTracks = data.tracks?.items || [];
    }

    // =====================================================
    // paso 3: filtrar por decada
    // =====================================================
    if (decades && decades.length > 0) {
      allTracks = allTracks.filter(track => {
        // verificar que el track tenga fecha de lanzamiento
        if (!track.album?.release_date) return false;
        // extraer el ano del album
        const year = new Date(track.album.release_date).getFullYear();
        // verificar si el ano esta dentro de alguna de las decadas seleccionadas
        return decades.some(decade => {
          const decadeStart = parseInt(decade);
          return year >= decadeStart && year < decadeStart + 10;
        });
      });
    }

    // =====================================================
    // paso 4: filtrar por popularidad
    // =====================================================
    if (popularity && popularity.length === 2) {
      const [min, max] = popularity; // destructuring del rango
      allTracks = allTracks.filter(
        track => track.popularity >= min && track.popularity <= max
      );
    }

    // =====================================================
    // paso 5: eliminar duplicados
    // =====================================================
    const uniqueTracks = [];
    for (const track of allTracks) {
      // solo anadir si el id no esta en el set
      if (!trackIds.has(track.id)) {
        trackIds.add(track.id);
        uniqueTracks.push(track);
      }
    }

    // nota: el endpoint de audio features devuelve 403 para nuevas apps de spotify
    // por ahora saltamos el filtrado por mood y ordenamos por popularidad
    console.log(`📊 Returning ${Math.min(uniqueTracks.length, 50)} tracks (of ${uniqueTracks.length} unique)`);

    // =====================================================
    // paso 6: ordenar y limitar resultados
    // =====================================================
    return uniqueTracks
      .sort((a, b) => b.popularity - a.popularity) // ordenar por popularidad descendente
      .slice(0, 50); // limitar a 50 canciones

  } catch (error) {
    console.error('Error generating playlist:', error);
    throw error;
  }
}

// =====================================================
// funcion para filtrar por audio features (actualmente deshabilitada)
// =====================================================

// filtra tracks basandose en caracteristicas de audio (energia, felicidad, etc)
// nota: esta funcion no se usa actualmente porque spotify devuelve 403
async function filterByAudioFeatures(tracks, targetFeatures) {
  // si no hay features especificadas, retornar tracks sin filtrar
  if (!targetFeatures || Object.keys(targetFeatures).length === 0) {
    return tracks;
  }

  try {
    // obtener audio features en lotes de 50 (limite de spotify)
    const batchSize = 50;
    const batches = [];

    // dividir tracks en lotes
    for (let i = 0; i < tracks.length; i += batchSize) {
      const batch = tracks.slice(i, i + batchSize);
      batches.push(batch);
    }

    // obtener features de cada lote en paralelo
    const allFeatures = await Promise.all(
      batches.map(async (batch) => {
        try {
          const ids = batch.map(t => t.id).join(',');
          const data = await fetchSpotify(
            `https://api.spotify.com/v1/audio-features?ids=${ids}`
          );
          return data.audio_features || [];
        } catch (error) {
          console.warn('Failed to fetch audio features for batch:', error);
          return [];
        }
      })
    );

    // aplanar y filtrar nulls
    const features = allFeatures.flat().filter(f => f !== null);

    // si no pudimos obtener features, retornar tracks originales
    if (features.length === 0) {
      console.warn('No audio features available, returning original tracks');
      return tracks;
    }

    // calcular score para cada track basado en cercania a los targets
    const tracksWithScores = tracks.map((track, index) => {
      const feature = features[index];

      if (!feature) return { track, score: 0 };

      // calcular diferencia normalizada para cada caracteristica
      let score = 0;
      let count = 0;

      // energia: 0 = tranquilo, 1 = energetico
      if (targetFeatures.energy !== undefined && feature.energy !== null) {
        score += 1 - Math.abs(feature.energy - targetFeatures.energy);
        count++;
      }

      // valencia: 0 = triste, 1 = feliz
      if (targetFeatures.valence !== undefined && feature.valence !== null) {
        score += 1 - Math.abs(feature.valence - targetFeatures.valence);
        count++;
      }

      // bailabilidad: 0 = no bailable, 1 = muy bailable
      if (targetFeatures.danceability !== undefined && feature.danceability !== null) {
        score += 1 - Math.abs(feature.danceability - targetFeatures.danceability);
        count++;
      }

      // acusticidad: 0 = electronico, 1 = acustico
      if (targetFeatures.acousticness !== undefined && feature.acousticness !== null) {
        score += 1 - Math.abs(feature.acousticness - targetFeatures.acousticness);
        count++;
      }

      // calcular score promedio
      score = count > 0 ? score / count : 0;

      return { track, score, features: feature };
    });

    // ordenar por score y retornar los mejores matches
    const filtered = tracksWithScores
      .filter(item => item.score > 0.3) // umbral minimo de similitud
      .sort((a, b) => b.score - a.score)
      .map(item => item.track);

    // si el filtrado es muy agresivo, retornar al menos algunos tracks
    return filtered.length > 0 ? filtered : tracks.slice(0, 20);

  } catch (error) {
    console.error('Error filtering by audio features:', error);
    // si falla, retornar los tracks originales
    return tracks;
  }
}

// =====================================================
// buscar artistas
// =====================================================

// busca artistas en spotify por nombre
// retorna un array de artistas que coinciden con la query
export async function searchArtists(query) {
  // si la query es muy corta, no buscar
  if (!query || query.trim().length < 2) return [];

  // verificar cache
  const cacheKey = getCacheKey('search_artists', query);
  const cached = getFromCache(cacheKey);

  if (cached) return cached;

  try {
    // hacer busqueda en la api de spotify
    const data = await fetchSpotify(
      `https://api.spotify.com/v1/search?type=artist&q=${encodeURIComponent(query)}&limit=10`
    );

    const artists = data.artists?.items || [];
    setCache(cacheKey, artists); // cachear resultado
    return artists;
  } catch (error) {
    console.error('Error searching artists:', error);
    return [];
  }
}

// =====================================================
// obtener generos disponibles
// =====================================================

// obtiene la lista de generos disponibles en spotify
// nota: este endpoint esta deprecado, usamos generos hardcodeados en el widget
export async function getAvailableGenres() {
  const cacheKey = 'available_genres';
  const cached = getFromCache(cacheKey);

  if (cached) return cached;

  try {
    const data = await fetchSpotify(
      'https://api.spotify.com/v1/recommendations/available-genre-seeds'
    );

    const genres = data.genres || [];
    setCache(cacheKey, genres);
    return genres;
  } catch (error) {
    console.error('Error fetching genres:', error);
    return [];
  }
}

// =====================================================
// obtener caracteristicas de un track
// =====================================================

// obtiene las caracteristicas de audio de un track especifico
// (energia, tempo, bailabilidad, etc)
export async function getTrackFeatures(trackId) {
  try {
    const data = await fetchSpotify(
      `https://api.spotify.com/v1/audio-features/${trackId}`
    );
    return data;
  } catch (error) {
    console.error('Error fetching track features:', error);
    return null;
  }
}

// =====================================================
// crear playlist en spotify
// =====================================================

// crea una nueva playlist en la cuenta del usuario y anade los tracks
export async function createSpotifyPlaylist(userId, tracks, playlistName = 'Mi Playlist Personalizada') {
  try {
    // paso 1: crear la playlist vacia
    const createData = await fetchSpotify(
      `https://api.spotify.com/v1/users/${userId}/playlists`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: playlistName,
          description: 'Creada con Spotify Taste Mixer',
          public: false // playlist privada por defecto
        })
      }
    );

    // paso 2: anadir tracks a la playlist
    const trackUris = tracks.map(track => track.uri); // obtener uris de los tracks
    await fetchSpotify(
      `https://api.spotify.com/v1/playlists/${createData.id}/tracks`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: trackUris
        })
      }
    );

    // retornar datos de la playlist creada
    return createData;
  } catch (error) {
    console.error('Error creating playlist:', error);
    throw error;
  }
}

// =====================================================
// obtener usuario actual
// =====================================================

// obtiene la informacion del perfil del usuario autenticado
export async function getCurrentUser() {
  const cacheKey = 'current_user';
  const cached = getFromCache(cacheKey);

  if (cached) return cached;

  try {
    const data = await fetchSpotify('https://api.spotify.com/v1/me');
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}

// =====================================================
// generar mas tracks (para anadir a playlist existente)
// =====================================================

// genera tracks adicionales excluyendo los que ya estan en la playlist
// usa artistas relacionados y busquedas por genero con offset aleatorio
export async function generateMoreTracks(preferences, excludeIds = [], count = 10) {
  const { artists, genres, decades, popularity } = preferences;
  let allTracks = [];
  const trackIds = new Set(excludeIds); // tracks a excluir

  try {
    // obtener el mercado del usuario
    let userMarket = 'ES';
    try {
      const userData = await fetchSpotify('https://api.spotify.com/v1/me');
      if (userData && userData.country) {
        userMarket = userData.country;
      }
    } catch (e) {
      console.warn('Could not get user market, using ES as fallback');
    }

    // =====================================================
    // buscar tracks relacionados con los artistas
    // =====================================================
    if (artists && artists.length > 0) {
      const artistTracks = await Promise.all(
        artists.map(async (artist) => {
          let tracks = [];

          // estrategia 1: intentar obtener artistas relacionados
          try {
            const relatedData = await fetchSpotify(
              `https://api.spotify.com/v1/artists/${artist.id}/related-artists`
            );

            // tomar los primeros 3 artistas relacionados
            const relatedArtists = relatedData.artists?.slice(0, 3) || [];
            if (relatedArtists.length > 0) {
              // obtener top tracks de cada artista relacionado
              const relatedTracks = await Promise.all(
                relatedArtists.map(async (relatedArtist) => {
                  try {
                    const data = await fetchSpotify(
                      `https://api.spotify.com/v1/artists/${relatedArtist.id}/top-tracks?market=${userMarket}`
                    );
                    return data.tracks || [];
                  } catch (err) {
                    return [];
                  }
                })
              );
              tracks = relatedTracks.flat();
            }
          } catch (err) {
            // si falla related-artists (404 es comun), usar fallback
            console.warn(`Related artists not available for ${artist.name}, using search fallback`);
          }

          // estrategia 2 (fallback): buscar por nombre del artista con offset aleatorio
          if (tracks.length === 0) {
            try {
              // offset aleatorio para obtener resultados diferentes
              const randomOffset = Math.floor(Math.random() * 20);
              const searchQuery = encodeURIComponent(artist.name);
              const data = await fetchSpotify(
                `https://api.spotify.com/v1/search?type=track&q=artist:${searchQuery}&limit=30&offset=${randomOffset}`
              );
              tracks = data.tracks?.items || [];
              console.log(`🔍 Fallback search for artist "${artist.name}" returned ${tracks.length} tracks`);
            } catch (err) {
              console.error(`Fallback search failed for ${artist.name}:`, err);
            }
          }

          return tracks;
        })
      );

      allTracks.push(...artistTracks.flat());
    }

    // =====================================================
    // buscar por generos con offset aleatorio para variedad
    // =====================================================
    if (genres && genres.length > 0) {
      // offset aleatorio para no obtener siempre los mismos resultados
      const randomOffset = Math.floor(Math.random() * 30);

      const genreTracks = await Promise.all(
        genres.map(async (genre) => {
          // intentar con formato genre:
          const genreQuery = `genre:${encodeURIComponent(genre)}`;
          let data = await fetchSpotify(
            `https://api.spotify.com/v1/search?type=track&q=${genreQuery}&limit=30&offset=${randomOffset}`
          );

          let tracks = data.tracks?.items || [];

          // fallback: busqueda simple si genre: no devuelve resultados
          if (tracks.length === 0) {
            data = await fetchSpotify(
              `https://api.spotify.com/v1/search?type=track&q=${encodeURIComponent(genre)}&limit=30&offset=${randomOffset}`
            );
            tracks = data.tracks?.items || [];
          }

          return tracks;
        })
      );

      allTracks.push(...genreTracks.flat());
    }

    // =====================================================
    // aplicar filtros
    // =====================================================

    // filtrar por decada
    if (decades && decades.length > 0) {
      allTracks = allTracks.filter(track => {
        if (!track.album?.release_date) return false;
        const year = new Date(track.album.release_date).getFullYear();
        return decades.some(decade => {
          const decadeStart = parseInt(decade);
          return year >= decadeStart && year < decadeStart + 10;
        });
      });
    }

    // filtrar por popularidad
    if (popularity && popularity.length === 2) {
      const [min, max] = popularity;
      allTracks = allTracks.filter(
        track => track.popularity >= min && track.popularity <= max
      );
    }

    // =====================================================
    // eliminar duplicados y tracks ya en la playlist
    // =====================================================
    const uniqueTracks = [];
    for (const track of allTracks) {
      if (!trackIds.has(track.id)) {
        trackIds.add(track.id);
        uniqueTracks.push(track);
      }
    }

    // mezclar aleatoriamente para variedad
    const shuffled = uniqueTracks.sort(() => Math.random() - 0.5);
    // retornar la cantidad solicitada
    return shuffled.slice(0, count);

  } catch (error) {
    console.error('Error generating more tracks:', error);
    throw error;
  }
}

// =====================================================
// limpieza automatica del cache
// =====================================================

// configurar limpieza periodica del cache (solo en el navegador)
if (typeof window !== 'undefined') {
  // ejecutar cada 5 minutos (misma duracion que el cache)
  setInterval(() => {
    const now = Date.now();
    // iterar sobre todas las entradas del cache
    for (const [key, value] of cache.entries()) {
      // si ha expirado, eliminarla
      if (now - value.timestamp > CACHE_DURATION) {
        cache.delete(key);
      }
    }
  }, CACHE_DURATION);
}