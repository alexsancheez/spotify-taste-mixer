// =====================================================
// auth.js - modulo de autenticacion con spotify oauth 2.0
// maneja: login, tokens, refresh automatico y logout
// =====================================================

// funcion para generar una cadena aleatoria de longitud especificada
// se usa para el parametro 'state' que previene ataques csrf
export function generateRandomString(length) {
  // caracteres posibles para la cadena aleatoria
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = ''; // inicializar cadena vacia
  // bucle para generar cada caracter
  for (let i = 0; i < length; i++) {
    // seleccionar un caracter aleatorio y anadirlo
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text; // devolver la cadena generada
}

// funcion que construye la url de autorizacion de spotify
// esta es la url a la que se redirige al usuario para que autorice la app
export function getSpotifyAuthUrl() {
  // obtener el client id de las variables de entorno (publicas en el cliente)
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || '';
  // obtener la uri de redireccion de las variables de entorno
  const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI || '';
  // generar un state aleatorio de 16 caracteres
  const state = generateRandomString(16);

  // guardar el state en localstorage para validarlo cuando spotify redirija de vuelta
  // esto previene ataques csrf (cross-site request forgery)
  if (typeof window !== 'undefined') {
    localStorage.setItem('spotify_auth_state', state);
  }

  // definir los scopes (permisos) que necesitamos de spotify
  // cada scope permite acceder a diferentes datos/funcionalidades
  const scope = [
    "user-read-private",      // leer perfil del usuario
    "user-read-email",        // leer email del usuario
    "user-top-read",          // leer top artistas y tracks
    "playlist-modify-public", // crear/modificar playlists publicas
    "playlist-modify-private",// crear/modificar playlists privadas
    "user-follow-read",       // leer artistas seguidos
    "user-library-read"       // leer biblioteca guardada
  ].join(" "); // unir con espacios (formato requerido por spotify)

  // construir los parametros de la url usando urlsearchparams
  const params = new URLSearchParams({
    client_id: clientId,      // id de la aplicacion
    response_type: 'code',    // tipo de respuesta (authorization code flow)
    redirect_uri: redirectUri,// url a donde spotify redirigira despues del login
    state: state,             // state para validacion csrf
    scope: scope              // permisos solicitados
  });

  // devolver la url completa de autorizacion de spotify
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

// funcion para guardar los tokens en localstorage
// recibe: token de acceso, token de refresco y tiempo de expiracion (en segundos)
export function saveTokens(accessToken, refreshToken, expiresIn) {
  // calcular el timestamp exacto de expiracion (tiempo actual + duracion)
  const expirationTime = Date.now() + expiresIn * 1000;
  // guardar cada valor en localstorage
  localStorage.setItem('spotify_token', accessToken);
  localStorage.setItem('spotify_refresh_token', refreshToken);
  localStorage.setItem('spotify_token_expiration', expirationTime.toString());
}

// variable para evitar multiples refreshes simultaneos (race condition)
let isRefreshing = false;
// variable para almacenar la promesa del refresh en curso
let refreshPromise = null;

// funcion asincrona para refrescar el token de acceso cuando expire
async function refreshAccessToken() {
  // si ya hay un refresh en progreso, esperar a esa promesa en vez de hacer otro
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  // marcar que estamos refrescando
  isRefreshing = true;

  // crear la promesa de refresh
  refreshPromise = (async () => {
    try {
      // obtener el refresh token de localstorage
      const refreshToken = localStorage.getItem('spotify_refresh_token');

      // si no hay refresh token, no podemos refrescar
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // hacer peticion al endpoint de nuestra api para refrescar el token
      // este endpoint se comunica con spotify usando el client secret (seguro en servidor)
      const response = await fetch('/api/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      // si la respuesta no es exitosa, lanzar error
      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      // parsear la respuesta json
      const data = await response.json();

      // guardar los nuevos tokens
      // nota: spotify a veces no devuelve un nuevo refresh_token, en ese caso usamos el anterior
      saveTokens(
        data.access_token,
        data.refresh_token || refreshToken,
        data.expires_in
      );

      // devolver el nuevo access token
      return data.access_token;
    } catch (error) {
      // si hay error en el refresh, hacer logout y forzar re-login
      console.error('Error refreshing token:', error);
      logout(); // limpiar todos los tokens
      throw error; // propagar el error
    } finally {
      // siempre limpiar las flags al terminar
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// funcion asincrona para obtener el token de acceso actual
// si el token esta proximo a expirar, lo refresca automaticamente
export async function getAccessToken() {
  // obtener token y expiracion de localstorage
  const token = localStorage.getItem('spotify_token');
  const expiration = localStorage.getItem('spotify_token_expiration');

  // si no existen, retornar null (usuario no logueado)
  if (!token || !expiration) return null;

  // convertir la expiracion a numero
  const expirationTime = parseInt(expiration);
  const now = Date.now();

  // umbral de refresh: 5 minutos antes de que expire
  // esto evita que el token expire durante una operacion
  const REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutos en milisegundos

  // si el token expira dentro del umbral, refrescarlo proactivamente
  if (now > expirationTime - REFRESH_THRESHOLD) {
    try {
      const newToken = await refreshAccessToken();
      return newToken;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return null; // si falla el refresh, retornar null
    }
  }

  // si el token aun es valido, devolverlo directamente
  return token;
}

// funcion sincrona para obtener el token (sin auto-refresh)
// util cuando no podemos usar async/await
export function getAccessTokenSync() {
  const token = localStorage.getItem('spotify_token');
  const expiration = localStorage.getItem('spotify_token_expiration');

  // si no existen, retornar null
  if (!token || !expiration) return null;

  // si el token ya expiro, retornar null
  if (Date.now() > parseInt(expiration)) {
    return null;
  }

  return token;
}

// funcion para verificar si el usuario esta autenticado
// devuelve true si hay un token valido, false si no
export function isAuthenticated() {
  const token = localStorage.getItem('spotify_token');
  const expiration = localStorage.getItem('spotify_token_expiration');

  // si no hay token o expiracion, no esta autenticado
  if (!token || !expiration) return false;

  // considerar autenticado si el token no ha expirado
  // (aunque este cerca de expirar, se refrescara automaticamente al usarlo)
  return Date.now() < parseInt(expiration);
}

// funcion para cerrar sesion
// elimina todos los tokens y datos de autenticacion de localstorage
export function logout() {
  localStorage.removeItem('spotify_token');
  localStorage.removeItem('spotify_refresh_token');
  localStorage.removeItem('spotify_token_expiration');
  localStorage.removeItem('spotify_auth_state');
}