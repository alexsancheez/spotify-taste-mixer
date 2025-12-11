'use client'; // indica que este componente se ejecuta en el cliente (navegador)

// =====================================================
// auth/callback/page.js - pagina de callback de oauth
// spotify redirige aqui despues de que el usuario autoriza la app
// esta pagina intercambia el codigo por tokens y redirige al dashboard
// =====================================================

// importar hooks de react
import { useEffect, useState, Suspense } from 'react';
// importar hooks de next.js para navegacion y parametros de url
import { useRouter, useSearchParams } from 'next/navigation';
// importar funcion para guardar tokens
import { saveTokens } from '@/lib/auth';

// =====================================================
// componente principal que maneja el callback
// esta separado del export para poder usar suspense (requerido por next.js 16)
// =====================================================
function CallbackContent() {
  // hook para navegacion programatica
  const router = useRouter();
  // hook para obtener los parametros de la url (?code=xxx&state=yyy)
  const searchParams = useSearchParams();
  // estado para almacenar mensajes de error
  const [error, setError] = useState(null);

  // useeffect que se ejecuta al cargar la pagina
  useEffect(() => {
    // funcion asincrona para procesar el callback de spotify
    async function handleCallback() {
      // obtener parametros de la url
      const code = searchParams.get('code');   // codigo de autorizacion de spotify
      const state = searchParams.get('state'); // state para validar csrf
      const errorParam = searchParams.get('error'); // posible error de spotify

      // verificar si spotify devolvio un error (ej: usuario cancelo)
      if (errorParam) {
        console.error('spotify authorization error:', errorParam);
        setError('error al autorizar con spotify');
        // redirigir al login despues de 3 segundos
        setTimeout(() => router.push('/'), 3000);
        return;
      }

      // validar el state para prevenir ataques csrf
      // el state debe coincidir con el que guardamos antes de redirigir a spotify
      const savedState = localStorage.getItem('spotify_auth_state');
      if (state !== savedState) {
        console.error('state mismatch');
        setError('error de seguridad. intenta de nuevo.');
        setTimeout(() => router.push('/'), 3000);
        return;
      }

      // validar que se recibio el codigo de autorizacion
      if (!code) {
        setError('no se recibio codigo de autorizacion');
        setTimeout(() => router.push('/'), 3000);
        return;
      }

      try {
        // enviar el codigo a nuestro backend para intercambiarlo por tokens
        // esto se hace en el servidor porque necesita el client_secret (secreto)
        const response = await fetch("/api/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }), // enviar el codigo en el body
        });

        // verificar si la respuesta fue exitosa
        if (!response.ok) {
          console.error('token endpoint error:', await response.text());
          throw new Error('error al obtener tokens');
        }

        // parsear la respuesta json
        const data = await response.json();

        // guardar los tokens en localstorage
        // access_token: para hacer peticiones a spotify
        // refresh_token: para obtener un nuevo access_token cuando expire
        // expires_in: tiempo en segundos hasta que expire el token
        saveTokens(
          data.access_token,
          data.refresh_token,
          data.expires_in
        );

        // limpiar el state csrf ya que ya no es necesario
        localStorage.removeItem('spotify_auth_state');

        // redirigir al dashboard (usuario ya autenticado)
        router.push('/dashboard');

      } catch (err) {
        // si hay algun error, mostrarlo y redirigir al login
        console.error('error exchanging code for token:', err);
        setError('error al completar la autenticacion');
        setTimeout(() => router.push('/'), 3000);
      }
    }

    // ejecutar la funcion de callback
    handleCallback();
  }, [searchParams, router]); // dependencias del useeffect

  // renderizado del componente
  return (
    // contenedor a pantalla completa con fondo negro
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
      {/* mostrar error o estado de carga */}
      {error ? (
        // estado de error
        <>
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-2">error</h1>
          <p className="text-gray-400 mb-4">{error}</p>
          <p className="text-sm text-gray-500">redirigiendo...</p>
        </>
      ) : (
        // estado de carga (mientras se procesan los tokens)
        <>
          {/* spinner de carga */}
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mb-4"></div>
          <h1 className="text-2xl font-bold mb-2">conectando con spotify...</h1>
          <p className="text-gray-400">espera un momento</p>
        </>
      )}
    </div>
  );
}

// =====================================================
// componente fallback para el suspense
// se muestra mientras se carga el componente principal
// =====================================================
function LoadingFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
      {/* spinner de carga */}
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mb-4"></div>
      <h1 className="text-2xl font-bold mb-2">cargando...</h1>
    </div>
  );
}

// =====================================================
// componente exportado (page)
// envuelve el contenido en suspense porque usesearchparams lo requiere en next.js 16
// =====================================================
export default function CallbackPage() {
  return (
    // suspense boundary requerido por next.js 16 para usesearchparams
    // mientras carga, muestra loadingfallback
    <Suspense fallback={<LoadingFallback />}>
      <CallbackContent />
    </Suspense>
  );
}
