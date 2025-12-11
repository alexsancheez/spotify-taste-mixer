'use client'; // indica que este componente se ejecuta en el cliente (navegador)

// objeto de configuracion para cada parametro de mood
// cada propiedad define: etiqueta, emoji, texto para valor bajo/alto, y color del gradiente
const MOOD_CONFIGS = {
  energy: {
    label: 'energia',           // nombre del parametro
    emoji: '⚡',                 // emoji representativo
    lowLabel: 'relajado',       // texto cuando el valor es bajo
    highLabel: 'intenso',       // texto cuando el valor es alto
    color: 'from-blue-500 to-purple-500' // gradiente de tailwind
  },
  valence: {
    label: 'felicidad',
    emoji: '😊',
    lowLabel: 'melancolico',
    highLabel: 'alegre',
    color: 'from-yellow-500 to-orange-500'
  },
  danceability: {
    label: 'bailabilidad',
    emoji: '💃',
    lowLabel: 'calmado',
    highLabel: 'bailable',
    color: 'from-pink-500 to-red-500'
  },
  acousticness: {
    label: 'acustico',
    emoji: '🎸',
    lowLabel: 'electronico',
    highLabel: 'acustico',
    color: 'from-green-500 to-teal-500'
  }
};

// componente principal del widget de mood/estado de animo
// props: mood (objeto con valores de cada parametro), onSelect (callback para actualizar)
export default function MoodWidget({ mood, onSelect }) {

  // funcion para actualizar un parametro individual del mood
  const updateMood = (key, value) => {
    onSelect({
      ...mood,           // mantener los valores existentes
      [key]: Number(value) // actualizar solo el parametro especificado (convertir a numero)
    });
  };

  // funcion para resetear todos los valores a 50 (punto medio)
  const resetMood = () => {
    onSelect({
      energy: 50,
      valence: 50,
      danceability: 50,
      acousticness: 50
    });
  };

  // verificar si todos los valores estan en el valor por defecto (50)
  const isDefaultMood = Object.values(mood).every(v => v === 50);

  // renderizado del componente
  return (
    // contenedor principal con padding
    <div className="p-4">
      {/* cabecera con titulo y boton reset */}
      <div className="flex items-center justify-between mb-4">
        {/* titulo del widget */}
        <h2 className="text-xl font-bold text-white">mood</h2>
        {/* boton reset (solo visible si el mood no es el default) */}
        {!isDefaultMood && (
          <button
            onClick={resetMood}
            className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
          >
            reset
          </button>
        )}
      </div>

      {/* contenedor de los sliders con espacio vertical */}
      <div className="space-y-5">
        {/* mapear cada entrada del objeto MOOD_CONFIGS */}
        {Object.entries(MOOD_CONFIGS).map(([key, config]) => {
          const value = mood[key]; // obtener el valor actual de este parametro
          const percentage = value; // el valor ya es un porcentaje (0-100)

          return (
            // contenedor individual para cada slider
            <div key={key} className="space-y-2">
              {/* fila con etiqueta y valor numerico */}
              <div className="flex items-center justify-between">
                {/* etiqueta con emoji y nombre */}
                <label className="text-sm text-gray-300 flex items-center gap-2">
                  <span className="text-lg">{config.emoji}</span>
                  <span>{config.label}</span>
                </label>
                {/* valor numerico con gradiente de texto */}
                <span className={`text-sm font-bold bg-gradient-to-r ${config.color} bg-clip-text text-transparent`}>
                  {value}
                </span>
              </div>

              {/* contenedor del slider */}
              <div className="relative">
                {/* input de tipo range (slider) */}
                <input
                  type="range"
                  min="0"        // valor minimo
                  max="100"      // valor maximo
                  value={value}  // valor controlado
                  onChange={(e) => updateMood(key, e.target.value)} // actualizar al cambiar
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                  // estilo inline para el fondo del slider (parte recorrida vs no recorrida)
                  style={{
                    background: `linear-gradient(to right, 
                      rgb(107, 114, 128) 0%, 
                      rgb(107, 114, 128) ${percentage}%, 
                      rgb(55, 65, 81) ${percentage}%, 
                      rgb(55, 65, 81) 100%)`
                  }}
                />

                {/* barra de progreso superpuesta con gradiente de color */}
                <div
                  className={`absolute top-0 left-0 h-2 rounded-lg bg-gradient-to-r ${config.color} pointer-events-none`}
                  style={{ width: `${percentage}%` }} // ancho dinamico segun el valor
                />
              </div>

              {/* etiquetas de los extremos (bajo/alto) */}
              <div className="flex justify-between text-xs text-gray-500">
                <span>{config.lowLabel}</span>
                <span>{config.highLabel}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* caja con descripcion del mood actual */}
      <div className="mt-4 p-3 bg-gray-800 rounded-lg">
        <div className="text-xs text-gray-400">
          {/* llamar a la funcion que genera la descripcion basada en los valores */}
          {getMoodDescription(mood)}
        </div>
      </div>
    </div>
  );
}

// funcion auxiliar que genera una descripcion textual del mood actual
// analiza los valores y devuelve un mensaje descriptivo
function getMoodDescription(mood) {
  // destructuring de los valores del mood
  const { energy, valence, danceability, acousticness } = mood;

  // verificar diferentes combinaciones y devolver descripcion apropiada
  if (energy > 70 && valence > 70 && danceability > 70) {
    return "🎉 buscando musica muy energetica y alegre para bailar";
  } else if (energy < 30 && valence < 30 && acousticness > 70) {
    return "🌙 buscando musica tranquila, melancolica y acustica";
  } else if (danceability > 70 && energy > 60) {
    return "💃 perfecto para una fiesta o sesion de baile";
  } else if (acousticness > 70 && energy < 40) {
    return "🎸 ideal para un momento acustico y relajado";
  } else if (valence > 70) {
    return "😊 buscando musica positiva y alegre";
  } else if (valence < 30) {
    return "🎭 buscando musica mas melancolica o emotiva";
  } else {
    // caso por defecto cuando no hay ninguna combinacion especial
    return "🎵 mood equilibrado - mezcla de diferentes estilos";
  }
}