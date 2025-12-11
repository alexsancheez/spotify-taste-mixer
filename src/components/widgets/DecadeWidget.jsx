'use client'; // indica que este componente se ejecuta en el cliente (navegador)

// array constante con la configuracion de cada decada
// cada objeto tiene: value (ano de inicio), label (texto a mostrar), emoji y color de gradiente
const DECADES = [
  { value: "1950", label: "50s", emoji: "🎺", color: "from-yellow-500 to-orange-500" },
  { value: "1960", label: "60s", emoji: "☮️", color: "from-purple-500 to-pink-500" },
  { value: "1970", label: "70s", emoji: "🕺", color: "from-orange-500 to-red-500" },
  { value: "1980", label: "80s", emoji: "🎹", color: "from-pink-500 to-purple-500" },
  { value: "1990", label: "90s", emoji: "💿", color: "from-blue-500 to-cyan-500" },
  { value: "2000", label: "00s", emoji: "📱", color: "from-cyan-500 to-teal-500" },
  { value: "2010", label: "10s", emoji: "🎧", color: "from-teal-500 to-green-500" },
  { value: "2020", label: "20s", emoji: "🚀", color: "from-green-500 to-lime-500" },
];

// componente principal del widget de decadas
// props: selectedDecades (array de decadas seleccionadas), onSelect (callback para actualizar)
export default function DecadeWidget({ selectedDecades, onSelect }) {

  // funcion para seleccionar o deseleccionar una decada
  const toggleDecade = (dec) => {
    let updated; // variable para el nuevo array

    // si la decada ya esta seleccionada, quitarla
    if (selectedDecades.includes(dec)) {
      updated = selectedDecades.filter(d => d !== dec);
    } else {
      // si no esta seleccionada, anadirla
      updated = [...selectedDecades, dec];
    }

    onSelect(updated); // llamar al callback con el array actualizado
  };

  // funcion para seleccionar todas las decadas
  const selectAll = () => {
    // mapear el array DECADES para obtener solo los valores
    onSelect(DECADES.map(d => d.value));
  };

  // funcion para limpiar todas las selecciones
  const clearAll = () => {
    onSelect([]); // pasar array vacio al callback
  };

  // renderizado del componente
  return (
    // contenedor principal con padding
    <div className="p-4">
      {/* cabecera con titulo y contador */}
      <div className="flex items-center justify-between mb-3">
        {/* titulo del widget */}
        <h2 className="text-xl font-bold text-white">decadas</h2>
        {/* badge con contador (solo si hay seleccionadas) */}
        {selectedDecades.length > 0 && (
          <span className="text-xs bg-purple-500 px-2 py-1 rounded-full">
            {selectedDecades.length}
          </span>
        )}
      </div>

      {/* grid de decadas - 2 columnas */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* mapear cada decada del array DECADES */}
        {DECADES.map((decade) => {
          // verificar si esta decada esta seleccionada
          const isSelected = selectedDecades.includes(decade.value);

          return (
            <button
              key={decade.value} // key unica para react
              onClick={() => toggleDecade(decade.value)} // toggle al hacer click
              // estilos condicionales: si esta seleccionada, aplicar gradiente y sombra
              className={`relative p-3 rounded-lg transition-all transform hover:scale-105 ${isSelected
                  ? `bg-gradient-to-r ${decade.color} text-white shadow-lg`
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
            >
              {/* emoji representativo de la decada */}
              <div className="text-2xl mb-1">{decade.emoji}</div>
              {/* etiqueta de la decada (50s, 60s, etc) */}
              <div className="font-bold text-sm">{decade.label}</div>

              {/* icono de check (solo si esta seleccionada) */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* seccion de acciones rapidas */}
      <div className="flex gap-2 text-xs pt-2 border-t border-gray-700">
        {/* mostrar "limpiar" si todas estan seleccionadas, si no "seleccionar todas" */}
        {selectedDecades.length === DECADES.length ? (
          // boton para limpiar todas las selecciones
          <button
            onClick={clearAll}
            className="flex-1 py-2 text-red-400 hover:text-red-300 transition-colors"
          >
            limpiar
          </button>
        ) : (
          // boton para seleccionar todas las decadas
          <button
            onClick={selectAll}
            className="flex-1 py-2 text-purple-400 hover:text-purple-300 transition-colors"
          >
            seleccionar todas
          </button>
        )}
      </div>

      {/* mensaje informativo (solo si no hay selecciones) */}
      {selectedDecades.length === 0 && (
        <div className="text-center py-4 text-gray-500 text-sm">
          selecciona las decadas que prefieras
        </div>
      )}
    </div>
  );
}