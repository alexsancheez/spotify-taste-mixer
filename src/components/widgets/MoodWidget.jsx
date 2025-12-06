'use client';

const MOOD_CONFIGS = {
  energy: {
    label: 'energía',
    emoji: '⚡',
    lowLabel: 'relajado',
    highLabel: 'intenso',
    color: 'from-blue-500 to-purple-500'
  },
  valence: {
    label: 'felicidad',
    emoji: '😊',
    lowLabel: 'melancólico',
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
    label: 'acústico',
    emoji: '🎸',
    lowLabel: 'electrónico',
    highLabel: 'acústico',
    color: 'from-green-500 to-teal-500'
  }
};

export default function MoodWidget({ mood, onSelect }) {
  const updateMood = (key, value) => {
    onSelect({
      ...mood,
      [key]: Number(value)
    });
  };

  const resetMood = () => {
    onSelect({
      energy: 50,
      valence: 50,
      danceability: 50,
      acousticness: 50
    });
  };

  const isDefaultMood = Object.values(mood).every(v => v === 50);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">mood</h2>
        {!isDefaultMood && (
          <button
            onClick={resetMood}
            className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
          >
            reset
          </button>
        )}
      </div>

      <div className="space-y-5">
        {Object.entries(MOOD_CONFIGS).map(([key, config]) => {
          const value = mood[key];
          const percentage = value;
          
          return (
            <div key={key} className="space-y-2">
              {/* Label and Value */}
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-300 flex items-center gap-2">
                  <span className="text-lg">{config.emoji}</span>
                  <span>{config.label}</span>
                </label>
                <span className={`text-sm font-bold bg-gradient-to-r ${config.color} bg-clip-text text-transparent`}>
                  {value}
                </span>
              </div>

              {/* Slider */}
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={value}
                  onChange={(e) => updateMood(key, e.target.value)}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                  style={{
                    background: `linear-gradient(to right, 
                      rgb(107, 114, 128) 0%, 
                      rgb(107, 114, 128) ${percentage}%, 
                      rgb(55, 65, 81) ${percentage}%, 
                      rgb(55, 65, 81) 100%)`
                  }}
                />
                
                {/* Progress Bar Overlay */}
                <div 
                  className={`absolute top-0 left-0 h-2 rounded-lg bg-gradient-to-r ${config.color} pointer-events-none`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Labels */}
              <div className="flex justify-between text-xs text-gray-500">
                <span>{config.lowLabel}</span>
                <span>{config.highLabel}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mood Description */}
      <div className="mt-4 p-3 bg-gray-800 rounded-lg">
        <div className="text-xs text-gray-400">
          {getMoodDescription(mood)}
        </div>
      </div>
    </div>
  );
}

function getMoodDescription(mood) {
  const { energy, valence, danceability, acousticness } = mood;
  
  if (energy > 70 && valence > 70 && danceability > 70) {
    return "🎉 Buscando música muy energética y alegre para bailar";
  } else if (energy < 30 && valence < 30 && acousticness > 70) {
    return "🌙 Buscando música tranquila, melancólica y acústica";
  } else if (danceability > 70 && energy > 60) {
    return "💃 Perfecto para una fiesta o sesión de baile";
  } else if (acousticness > 70 && energy < 40) {
    return "🎸 Ideal para un momento acústico y relajado";
  } else if (valence > 70) {
    return "😊 Buscando música positiva y alegre";
  } else if (valence < 30) {
    return "🎭 Buscando música más melancólica o emotiva";
  } else {
    return "🎵 Mood equilibrado - mezcla de diferentes estilos";
  }
}