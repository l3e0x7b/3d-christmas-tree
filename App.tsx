import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import Scene from './components/Scene';
import { useProgress } from '@react-three/drei';
import { Snowflake } from 'lucide-react';

// Reusable Toggle Component
const ToggleSwitch: React.FC<{ 
    label: string; 
    checked: boolean; 
    onChange: (checked: boolean) => void 
}> = ({ label, checked, onChange }) => (
    <div className="flex items-center justify-between w-full mb-2 group">
        <span className="text-white/60 text-xs font-bold tracking-widest uppercase group-hover:text-white/90 transition-colors">{label}</span>
        <label className="relative inline-flex items-center cursor-pointer">
            <input 
                type="checkbox" 
                checked={checked} 
                onChange={(e) => onChange(e.target.checked)} 
                className="sr-only peer" 
            />
            <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/50 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500/80 peer-checked:after:bg-white"></div>
        </label>
    </div>
);

// Snowman Light Toggle Component
const SnowmanToggle: React.FC<{ active: boolean, onClick: () => void }> = ({ active, onClick }) => {
    return (
        <button 
            onClick={onClick}
            className="group relative flex flex-col items-center justify-center focus:outline-none transition-transform active:scale-95"
            title={active ? "Turn off lights to adjust settings" : "Turn on atmosphere mode"}
        >
            <div className={`relative transition-all duration-700 ease-in-out ${active ? 'filter drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]' : 'opacity-40 hover:opacity-70'}`}>
                <svg width="60" height="70" viewBox="0 0 60 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Glow effect container when active */}
                    <g className={`transition-colors duration-500 ${active ? 'stroke-cyan-200' : 'stroke-gray-500'}`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        
                        {/* Body Bottom */}
                        <circle cx="30" cy="52" r="16" className={`transition-all duration-500 ${active ? 'fill-cyan-900/40' : 'fill-transparent'}`} />
                        
                        {/* Body Middle */}
                        <circle cx="30" cy="28" r="11" className={`transition-all duration-500 ${active ? 'fill-cyan-900/40' : 'fill-transparent'}`} />
                        
                        {/* Hat */}
                        <path d="M22 18H38" />
                        <rect x="24" y="8" width="12" height="10" />

                        {/* Arms */}
                        <path d="M41 28L52 22" />
                        <path d="M19 28L8 22" />
                    </g>
                    
                    {/* Buttons/Eyes - Always visible but dimmer when off */}
                    <g className={`transition-colors duration-500 ${active ? 'fill-cyan-100' : 'fill-gray-600'}`}>
                        <circle cx="28" cy="26" r="1.5" />
                        <circle cx="32" cy="26" r="1.5" />
                        <circle cx="30" cy="48" r="1.5" />
                        <circle cx="30" cy="54" r="1.5" />
                    </g>

                    {/* Nose */}
                    <path d="M30 30L36 32L30 31" fill={active ? "#fb923c" : "#78350f"} className="transition-colors duration-500"/>
                </svg>
            </div>
            
            {/* Small Base for the 'Lamp' */}
            <div className={`mt-[-2px] w-8 h-1 rounded-full bg-black/50 blur-[1px] transition-all duration-500 ${active ? 'opacity-80' : 'opacity-30'}`}></div>
        </button>
    );
};

const App: React.FC = () => {
  // Speed multiplier: 0 to 1. Default is 0.2.
  const [speed, setSpeed] = useState(0.2);
  
  // Visibility States
  const [showGifts, setShowGifts] = useState(true);
  const [showStockings, setShowStockings] = useState(true);
  const [showBells, setShowBells] = useState(true);
  const [showSnow, setShowSnow] = useState(true);

  // Atmosphere Mode (Collapses Controls) - Default to true
  const [isAtmosphereMode, setIsAtmosphereMode] = useState(true);

  // Dynamic Year
  const currentYear = new Date().getFullYear();

  // Loading State Integration
  const { progress } = useProgress();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // When progress hits 100, wait a moment then transition
    if (progress === 100) {
        const timer = setTimeout(() => setLoaded(true), 800);
        return () => clearTimeout(timer);
    }
  }, [progress]);

  // Helper to generate dynamic lighting style during load
  const getLoadingStyle = (color: string) => {
    if (loaded) return {}; // Revert to CSS classes when loaded
    
    // Smooth easing for opacity/glow
    const p = Math.max(0, progress);
    const opacity = 0.2 + (p / 100) * 0.8; 
    const blurRadius = (p / 100) * 20; // 0 to 20px blur

    return {
        color: '#ffffff', // Start white-ish
        opacity: opacity,
        textShadow: `0 0 5px rgba(255,255,255,0.8), 0 0 ${blurRadius}px ${color}, 0 0 ${blurRadius*1.5}px ${color}`,
        transition: 'all 0.1s linear' // Fast updates for progress
    };
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden font-sans">
      <style>{`
        @keyframes flicker {
          0%, 18%, 22%, 25%, 53%, 57%, 100% {
            opacity: 1;
          }
          20%, 24%, 55% {
            opacity: 0.4;
          }
        }

        @keyframes wire-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 10px #00f3ff, 0 0 5px #fff; }
          50% { opacity: 0.7; box-shadow: 0 0 15px #00f3ff, 0 0 8px #fff; }
        }
        
        .font-christmas {
          font-family: 'Mountains of Christmas', cursive;
        }

        .neon-red {
          color: #fff;
          text-shadow:
            0 0 5px #fff,
            0 0 10px #ff0000,
            0 0 20px #ff0000,
            0 0 40px #ff0000,
            0 0 60px #ff0000;
          animation: flicker 3s infinite alternate;
        }

        .neon-green {
          color: #fff;
          text-shadow:
            0 0 5px #fff,
            0 0 10px #00ff00,
            0 0 20px #00ff00,
            0 0 40px #00ff00,
            0 0 60px #00ff00;
          animation: flicker 4s infinite alternate-reverse;
        }

        .neon-gold {
          color: #fff;
          text-shadow:
            0 0 5px #fff,
            0 0 10px #f59e0b,
            0 0 20px #f59e0b,
            0 0 40px #f59e0b,
            0 0 60px #f59e0b;
          animation: flicker 5s infinite alternate-reverse;
        }
        
        .neon-border {
            box-shadow: 
                0 0 10px #00f3ff,
                inset 0 0 10px #00f3ff;
            border-color: #a5f3fc;
        }

        .neon-wire {
            background: linear-gradient(to bottom, transparent, #00f3ff 20%, #fff 50%, #00f3ff 80%);
            animation: wire-pulse 4s infinite ease-in-out;
        }
      `}</style>

      {/* 
        Background: Deep Night Sky Gradient 
      */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b1026] via-[#050505] to-[#000000] pointer-events-none" />

      <Canvas 
        dpr={[1, 2]} 
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
            <Scene 
                speed={speed} 
                showGifts={showGifts}
                showStockings={showStockings}
                showBells={showBells}
                showSnow={showSnow}
            />
        </Suspense>
      </Canvas>

      {/* 
        UI Overlay - Neon Sign Title & Loading Screen Combined 
      */}
      <div 
        className="absolute top-0 left-0 z-50 transition-transform duration-1000 ease-in-out origin-center"
        style={{
            transform: loaded 
                ? 'translate(2rem, 2rem) scale(1)' 
                : 'translate(calc(50vw - 50%), calc(50vh - 50%)) scale(1.5)'
        }}
      >
        <div 
            className="relative p-6 rounded-3xl border-4 border-cyan-200/50 bg-black/70 backdrop-blur-md neon-border transform -rotate-2 shadow-2xl transition-all duration-700"
            style={{ opacity: 1 }}
        >
            {/* Hanging Neon Wires (Luminous Sources) */}
            <div className={`absolute -top-[100vh] left-10 w-0.5 h-[100vh] neon-wire transition-opacity duration-1000 ${loaded ? 'opacity-100' : 'opacity-0'}`}></div>
            <div className={`absolute -top-[100vh] right-10 w-0.5 h-[100vh] neon-wire transition-opacity duration-1000 ${loaded ? 'opacity-100' : 'opacity-0'}`}></div>

            <div className="flex flex-col items-center justify-center font-christmas font-bold tracking-wider leading-none">
                <div className="flex items-center gap-4">
                    <Snowflake 
                        className={`w-6 h-6 text-white ${loaded ? 'animate-pulse' : ''}`} 
                        style={{ opacity: loaded ? 1 : progress/100 }} 
                    />
                    <span 
                        className={`text-6xl ${loaded ? 'neon-red' : ''}`}
                        style={getLoadingStyle('#ff0000')}
                    >
                        Merry
                    </span>
                    <Snowflake 
                        className={`w-6 h-6 text-white ${loaded ? 'animate-pulse' : ''}`} 
                        style={{ opacity: loaded ? 1 : progress/100 }} 
                    />
                </div>
                <span 
                    className={`text-7xl mt-2 ${loaded ? 'neon-green' : ''}`}
                    style={getLoadingStyle('#00ff00')}
                >
                    Christmas
                </span>
                <span 
                    className={`text-5xl mt-1 drop-shadow-lg ${loaded ? 'neon-gold' : ''}`}
                    style={getLoadingStyle('#f59e0b')}
                >
                    {loaded ? currentYear : `${Math.round(progress)}%`}
                </span>
            </div>
            
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent rounded-t-2xl pointer-events-none"></div>
        </div>
      </div>

      {/* Control Center: Bottom Left */}
      <div className={`absolute bottom-8 left-8 z-30 pointer-events-auto flex flex-col items-start gap-3 transition-opacity duration-1000 ${loaded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        
        <div 
            className={`
                bg-black/30 backdrop-blur-md p-4 rounded-xl border border-white/10 w-64 
                transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] origin-bottom-left overflow-hidden
                ${isAtmosphereMode ? 'opacity-0 scale-90 max-h-0 py-0 mb-0 border-none' : 'opacity-100 scale-100 max-h-[500px] mb-2'}
            `}
        >
            <div className="mb-6 flex flex-col gap-1">
                <ToggleSwitch label="Let it Snow" checked={showSnow} onChange={setShowSnow} />
                <ToggleSwitch label="Gifts" checked={showGifts} onChange={setShowGifts} />
                <ToggleSwitch label="Christmas Stockings" checked={showStockings} onChange={setShowStockings} />
                <ToggleSwitch label="Golden Bells" checked={showBells} onChange={setShowBells} />
            </div>

            <div>
                <label className="text-white/50 text-xs font-bold tracking-widest uppercase mb-3 block">
                    Rotation Speed
                </label>
                <div className="flex items-center gap-4">
                    <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.01" 
                        value={speed}
                        onChange={(e) => setSpeed(parseFloat(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer outline-none 
                                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 
                                [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:rounded-full 
                                [&::-webkit-slider-thumb]:hover:bg-emerald-300 [&::-webkit-slider-thumb]:hover:scale-125
                                [&::-webkit-slider-thumb]:transition-all"
                    />
                </div>
            </div>
        </div>

        <div className="pl-2">
            <SnowmanToggle active={isAtmosphereMode} onClick={() => setIsAtmosphereMode(!isAtmosphereMode)} />
        </div>
      </div>

      {/* Hint Text */}
      <div className={`absolute bottom-8 right-8 pointer-events-none text-right transition-opacity duration-700 ${isAtmosphereMode || !loaded ? 'opacity-0' : 'opacity-100'}`}>
        <p className="text-white/30 text-xs tracking-widest uppercase">
          Drag to Rotate &bull; Scroll to Zoom
        </p>
      </div>
    </div>
  );
};

export default App;