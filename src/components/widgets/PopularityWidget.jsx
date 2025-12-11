'use client'; // indica que este componente se ejecuta en el cliente (navegador)

// componente principal del widget de popularidad
// props: popularity (valor numerico 0-100), onSelect (callback para actualizar)
export default function PopularityWidget({ popularity, onSelect }) {

  // funcion que maneja los cambios del slider
  const handleChange = (e) => {
    const value = Number(e.target.value); // convertir el valor a numero
    onSelect(value); // llamar al callback con el nuevo valor
  };

  // funcion que devuelve etiqueta, emoji y color segun el valor de popularidad
  const getPopularityLabel = (value) => {
    // diferentes rangos con diferentes estilos
    if (value < 20) return { text: 'muy underground', emoji: '🎭', color: 'from-purple-600 to-indigo-600' };
    if (value < 40) return { text: 'indie / alternativo', emoji: '🎸', color: 'from-indigo-500 to-purple-500' };
    if (value < 60) return { text: 'equilibrado', emoji: '🎵', color: 'from-purple-500 to-pink-500' };
    if (value < 80) return { text: 'popular', emoji: '📻', color: 'from-pink-500 to-red-500' };
    return { text: 'muy mainstream', emoji: '🔥', color: 'from-red-500 to-orange-500' };
  };

  // obtener la configuracion de etiqueta para el valor actual
  const label = getPopularityLabel(popularity);
  // el porcentaje es igual al valor de popularidad (ya esta en escala 0-100)
  const percentage = popularity;

  // renderizado del componente
  return (
    // contenedor principal con padding
    <div className="p-4">
      {/* titulo del widget */}
      <h2 className="text-xl font-bold mb-4 text-white">popularidad</h2>

      {/* seccion del indicador central */}
      <div className="mb-4 text-center">
        {/* emoji grande representativo */}
        <div className="text-4xl mb-2">{label.emoji}</div>
        {/* texto descriptivo con gradiente de color */}
        <div className={`text-lg font-bold bg-gradient-to-r ${label.color} bg-clip-text text-transparent`}>
          {label.text}
        </div>
        {/* valor numerico grande */}
        <div className="text-3xl font-bold text-white mt-1">
          {popularity}
        </div>
      </div>

      {/* seccion del slider */}
      <div className="relative mb-3">
        {/* input de tipo range (slider) */}
        <input
          type="range"
          min="0"           // valor minimo
          max="100"         // valor maximo
          value={popularity} // valor controlado por el estado
          onChange={handleChange} // handler para cambios
          className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />

        {/* barra de progreso superpuesta con gradiente */}
        <div
          className={`absolute top-0 left-0 h-3 rounded-lg bg-gradient-to-r ${label.color} pointer-events-none`}
          style={{ width: `${percentage}%` }} // ancho dinamico segun el valor
        />
      </div>

      {/* etiquetas de los extremos del slider */}
      <div className="flex justify-between text-xs text-gray-500 mb-4">
        <span>underground</span>
        <span>mainstream</span>
      </div>

      {/* caja informativa con descripcion */}
      <div className="bg-gray-800 rounded-lg p-3">
        <div className="text-xs text-gray-400 leading-relaxed">
          {/* texto condicional segun el rango de popularidad */}
          {popularity < 30 && "descubriras musica menos conocida y artistas emergentes"}
          {popularity >= 30 && popularity < 70 && "mezcla equilibrada entre musica conocida y joyas ocultas"}
          {popularity >= 70 && "te enfocaras en los exitos y artistas mas populares del momento"}
        </div>
      </div>

      {/* botones de presets rapidos */}
      <div className="mt-3 flex gap-2">
        {/* boton preset: underground (valor 15) */}
        <button
          onClick={() => onSelect(15)} // establecer valor a 15
          // estilos condicionales: resaltado si el valor actual esta en este rango
          className={`flex-1 py-2 px-2 text-xs rounded transition-all ${popularity < 30
              ? 'bg-purple-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
        >
          underground
        </button>
        {/* boton preset: equilibrado (valor 50) */}
        <button
          onClick={() => onSelect(50)} // establecer valor a 50
          className={`flex-1 py-2 px-2 text-xs rounded transition-all ${popularity >= 30 && popularity < 70
              ? 'bg-purple-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
        >
          equilibrado
        </button>
        {/* boton preset: mainstream (valor 85) */}
        <button
          onClick={() => onSelect(85)} // establecer valor a 85
          className={`flex-1 py-2 px-2 text-xs rounded transition-all ${popularity >= 70
              ? 'bg-purple-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
        >
          mainstream
        </button>
      </div>
    </div>
  );
}