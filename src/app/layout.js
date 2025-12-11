// =====================================================
// layout.js - layout raiz de la aplicacion next.js
// este archivo define la estructura html base de todas las paginas
// =====================================================

// importar fuentes de google fonts usando el sistema optimizado de next.js
import { Geist, Geist_Mono } from "next/font/google";
// importar los estilos globales de la aplicacion
import "./globals.css";

// configurar la fuente geist sans (fuente principal para texto)
// variable: nombre de la variable css para usar la fuente
// subsets: subconjuntos de caracteres a cargar (latin para espanol/ingles)
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// configurar la fuente geist mono (fuente monoespaciada para codigo)
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// metadatos de la aplicacion (seo, titulo de la pestana, etc)
// next.js usa estos metadatos para generar las etiquetas meta del html
export const metadata = {
  title: "Spotify Taste Mixer", // titulo que aparece en la pestana del navegador
  description: "Crea tu playlist personalizada basada en tus gustos musicales", // descripcion para seo
};

// componente del layout raiz
// este componente envuelve TODAS las paginas de la aplicacion
// children: el contenido de la pagina actual que se renderiza dentro del layout
export default function RootLayout({ children }) {
  return (
    // elemento html raiz con idioma ingles
    <html lang="en">
      {/* body con las clases de las fuentes y antialiased para mejor renderizado de texto */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* aqui se renderiza el contenido de cada pagina */}
        {children}
      </body>
    </html>
  );
}
