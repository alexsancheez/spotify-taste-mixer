# Spotify Taste Mixer 🎵

Una aplicacion web que te permite crear playlists personalizadas en Spotify basadas en tus gustos musicales.

## Descripcion

Spotify Taste Mixer es una aplicacion desarrollada con Next.js que se integra con la API de Spotify para generar playlists personalizadas. Los usuarios pueden seleccionar artistas, generos, decadas, nivel de popularidad y mood para crear la playlist perfecta.

## Tecnologias Utilizadas

- **Next.js 15** - Framework de React
- **React 19** - Libreria de UI
- **Tailwind CSS** - Framework de CSS
- **Spotify Web API** - API de Spotify para autenticacion y datos musicales
- **OAuth 2.0** - Autenticacion segura con Spotify

## Funcionalidades

### Obligatorias ✅
- [x] Autenticacion OAuth 2.0 con Spotify
- [x] Refresh automatico de tokens
- [x] 5 Widgets de configuracion:
  - Widget de Artistas (busqueda y seleccion)
  - Widget de Generos (populares y todos)
  - Widget de Decadas (50s - 20s)
  - Widget de Popularidad (underground a mainstream)
  - Widget de Mood (energia, felicidad, bailabilidad, acustico)
- [x] Generacion de playlist basada en filtros
- [x] Refrescar playlist (regenerar con nuevas canciones)
- [x] Añadir mas canciones a la playlist existente
- [x] Eliminar tracks individuales
- [x] Marcar canciones como favoritas
- [x] Diseño responsive (movil y desktop)

### Opcionales ✅
- [x] Guardar playlist directamente en Spotify
- [x] Preview de canciones (30 segundos)
- [x] Abrir cancion en Spotify
- [x] Ver detalles de cada track

## Instalacion

1. Clona el repositorio:
```bash
git clone https://github.com/tu-usuario/spotify-taste-mixer.git
cd spotify-taste-mixer
```

2. Instala las dependencias:
```bash
npm install
```

3. Crea un archivo `.env.local` en la raiz del proyecto con las siguientes variables:
```env
SPOTIFY_CLIENT_ID=tu_client_id
SPOTIFY_CLIENT_SECRET=tu_client_secret
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=tu_client_id
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000/auth/callback
```

4. Configura tu aplicacion en [Spotify Developer Dashboard](https://developer.spotify.com/dashboard):
   - Crea una nueva aplicacion
   - Añade `http://localhost:3000/auth/callback` como Redirect URI
   - Copia el Client ID y Client Secret

5. Ejecuta el servidor de desarrollo:
```bash
npm run dev
```

6. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Estructura del Proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── refresh/route.js    # Endpoint para refrescar tokens
│   │   └── token/route.js      # Endpoint para intercambiar codigo por tokens
│   ├── auth/
│   │   └── callback/page.js    # Pagina de callback de OAuth
│   ├── dashboard/
│   │   └── page.js             # Pagina principal del dashboard
│   ├── globals.css             # Estilos globales
│   ├── layout.js               # Layout raiz
│   └── page.js                 # Pagina de login
├── components/
│   ├── widgets/
│   │   ├── ArtistWidget.jsx    # Widget de seleccion de artistas
│   │   ├── DecadeWidget.jsx    # Widget de seleccion de decadas
│   │   ├── GenreWidget.jsx     # Widget de seleccion de generos
│   │   ├── MoodWidget.jsx      # Widget de configuracion de mood
│   │   └── PopularityWidget.jsx # Widget de popularidad
│   ├── Header.jsx              # Cabecera de la aplicacion
│   ├── PlaylistDisplay.jsx     # Componente que muestra la playlist
│   └── TrackCard.jsx           # Tarjeta individual de cancion
└── lib/
    ├── auth.js                 # Funciones de autenticacion
    └── spotify.js              # Funciones de interaccion con Spotify API
```

## Uso

1. **Inicia sesion** con tu cuenta de Spotify
2. **Selecciona artistas** buscando por nombre
3. **Elige generos** de la lista disponible
4. **Filtra por decadas** (opcional)
5. **Ajusta la popularidad** segun tus preferencias
6. **Configura el mood** (energia, felicidad, etc.)
7. La playlist se genera automaticamente
8. **Guarda en Spotify** para tenerla en tu cuenta

## Autor

Desarrollado para la asignatura de Programacion Web 1.

## Licencia

Este proyecto es solo para fines educativos.
