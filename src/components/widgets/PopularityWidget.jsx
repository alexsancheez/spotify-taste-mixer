'use client';

export default function PopularityWidget({ popularity, onSelect }) {
  const handleChange = (e) => {
    const value = Number(e.target.value);
    onSelect(value);
  };

  const getPopularityLabel = (value) => {
    if (value < 20) return { text: 'muy underground', emoji: '🎭', color: 'from-purple-600 to-indigo-600' };
    if (value < 40) return { text: 'indie / alternativo', emoji: '🎸', color: 'from-indigo-500 to-purple-500' };
    if (value < 60) return { text: 'equilibrado', emoji: '🎵', color: 'from-purple-500 to-pink-500' };
    if (value < 80) return { text: 'popular', emoji: '📻', color: 'from-pink-500 to-red-500' };
    return { text: 'muy mainstream', emoji: '🔥', color: 'from-red-500 to-orange-500' };
  };

  const label = getPopularityLabel(popularity);
  const percentage = popularity;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4 text-white">popularidad</h2>

      {/* indicador */}
      <div className="mb-4 text-center">
        <div className="text-4xl mb-2">{label.emoji}</div>
        <div className={`text-lg font-bold bg-gradient-to-r ${label.color} bg-clip-text text-transparent`}>
          {label.text}
        </div>
        <div className="text-3xl font-bold text-white mt-1">
          {popularity}
        </div>
      </div>

      {/* Slide */}
      <div className="relative mb-3">
        <input
          type="range"
          min="0"
          max="100"
          value={popularity}
          onChange={handleChange}
          className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
        
        {/* Progresso */}
        <div 
          className={`absolute top-0 left-0 h-3 rounded-lg bg-gradient-to-r ${label.color} pointer-events-none`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Scale etiquetas */}
      <div className="flex justify-between text-xs text-gray-500 mb-4">
        <span>underground</span>
        <span>mainstream</span>
      </div>

      {/* Info Box */}
      <div className="bg-gray-800 rounded-lg p-3">
        <div className="text-xs text-gray-400 leading-relaxed">
          {popularity < 30 && "Descubrirás música menos conocida y artistas emergentes"}
          {popularity >= 30 && popularity < 70 && "Mezcla equilibrada entre música conocida y joyas ocultas"}
          {popularity >= 70 && "Te enfocarás en los éxitos y artistas más populares del momento"}
        </div>
      </div>

      {/* Presets */}
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onSelect(15)}
          className={`flex-1 py-2 px-2 text-xs rounded transition-all ${
            popularity < 30 
              ? 'bg-purple-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          underground
        </button>
        <button
          onClick={() => onSelect(50)}
          className={`flex-1 py-2 px-2 text-xs rounded transition-all ${
            popularity >= 30 && popularity < 70 
              ? 'bg-purple-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          equilibrado
        </button>
        <button
          onClick={() => onSelect(85)}
          className={`flex-1 py-2 px-2 text-xs rounded transition-all ${
            popularity >= 70 
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