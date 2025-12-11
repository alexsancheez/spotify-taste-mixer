'use client'; // indica que este componente se ejecuta en el cliente (navegador)

// =====================================================
// page.js - pagina de inicio / login de la aplicacion
// es la primera pagina que ve el usuario al entrar
// =====================================================

// importar hook useeffect de react para efectos secundarios
import { useEffect } from 'react';
// importar hook userouter de next.js para navegacion programatica
import { useRouter } from 'next/navigation';
// importar funciones de autenticacion
import { isAuthenticated, getSpotifyAuthUrl } from '@/lib/auth';

// componente principal de la pagina de inicio
export default function Home() {
  // hook de next.js para manejar la navegacion
  const router = useRouter();

  // useeffect que se ejecuta al montar el componente
  // comprueba si el usuario ya esta autenticado
  useEffect(() => {
    // si ya hay sesion activa, redirigir al dashboard
    if (isAuthenticated()) {
      router.push('/dashboard');
    }
  }, [router]); // dependencia: router (aunque es estable)

  // funcion que maneja el click en el boton de login
  // redirige al usuario a spotify para autorizar la app
  const handleLogin = () => {
    // obtener la url de autorizacion de spotify y redirigir
    window.location.href = getSpotifyAuthUrl();
  };

  // renderizado del componente
  return (
    // contenedor principal: altura minima pantalla completa, centrado, fondo con gradiente
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white px-4">
      {/* decoraciones de fondo: circulos difuminados para efecto visual */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* circulo verde difuminado arriba a la izquierda */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"></div>
        {/* circulo purpura difuminado abajo a la derecha */}
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* contenido principal (z-10 para estar sobre las decoraciones) */}
      <div className="relative z-10 text-center max-w-md">
        {/* seccion del logo */}
        <div className="mb-8">
          {/* circulo con gradiente verde y sombra, contiene el icono de spotify */}
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-2xl spotify-glow">
            {/* icono svg de spotify */}
            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
          </div>
        </div>

        {/* titulo de la aplicacion */}
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="text-white">taste</span>
          <span className="text-green-500"> mixer</span>
        </h1>

        {/* subtitulo/descripcion */}
        <p className="text-gray-400 text-lg mb-8">
          mezcla tus gustos musicales y crea la playlist perfecta
        </p>

        {/* boton de login con spotify */}
        <button
          onClick={handleLogin} // handler para iniciar el flujo de oauth
          // estilos: fondo verde, hover verde claro, texto negro, bordes redondeados
          // animaciones: escala al hover, sombra con color
          className="group relative inline-flex items-center gap-3 bg-green-500 hover:bg-green-400 text-black font-bold px-8 py-4 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/25"
        >
          {/* icono de spotify dentro del boton */}
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
          conectar con spotify
        </button>

        {/* seccion de caracteristicas/features */}
        <div className="mt-12 grid grid-cols-3 gap-4 text-center text-sm">
          {/* feature 1: artistas */}
          <div className="text-gray-500">
            <div className="text-2xl mb-1">🎧</div>
            <span>artistas</span>
          </div>
          {/* feature 2: generos */}
          <div className="text-gray-500">
            <div className="text-2xl mb-1">🎵</div>
            <span>generos</span>
          </div>
          {/* feature 3: decadas */}
          <div className="text-gray-500">
            <div className="text-2xl mb-1">📅</div>
            <span>decadas</span>
          </div>
        </div>
      </div>
    </div>
  );
}
