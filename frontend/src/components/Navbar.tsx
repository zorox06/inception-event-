import React from 'react';
import { CityState } from '../types';
import { 
  Sun, 
  CloudRain, 
  CloudSun, 
  Wifi, 
  Sliders,
  Activity,
  Flame
} from 'lucide-react';

interface NavbarProps {
  cityState: CityState;
  isConnected: boolean;
  isThinking: boolean;
  hasApiKey: boolean;
  activeModel?: string;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cityState,
  isConnected,
  isThinking,
  hasApiKey,
  activeModel = "gemma-4-31b-it",
  onOpenSettings,
}) => {
  const getWeatherIcon = (weather: CityState['weather']) => {
    switch (weather) {
      case 'drought':
        return <Sun className="w-4 h-4 text-[#ff4d4d]" />;
      case 'rain':
        return <CloudRain className="w-4 h-4 text-[#2d5da1]" />;
      default:
        return <CloudSun className="w-4 h-4 text-[#2d2d2d]" />;
    }
  };

  return (
    <header className="relative w-full bg-white border-[2.5px] border-pencil shadow-sketch px-5 py-3.5 wobbly-md flex items-center justify-between z-20">
      {/* Top Center Tape Strip */}
      <div className="tape-strip" />

      {/* Brand Title */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 bg-postit-yellow border-2 border-pencil shadow-sketch-sm wobbly-circle flex items-center justify-center text-2xl rotate-[-2deg]">
          🌾
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-pencil tracking-tight">
              FarmState
            </h1>
            <span className="px-2.5 py-0.5 bg-postit-green border-[1.5px] border-pencil text-pencil text-xs font-body font-bold wobbly-tag rotate-1 shadow-sketch-xs">
              Hand-Drawn v1.0
            </span>
          </div>
          <p className="text-sm text-pencil-light font-body -mt-1 hidden sm:block">
            Autonomous AI Mayor • Deterministic Engine • Reactor World
          </p>
        </div>
      </div>

      {/* Center Atmospheric Status Badges */}
      <div className="hidden md:flex items-center gap-3">
        {/* Season & Weather Note */}
        <div className="flex items-center gap-2 px-3 py-1 bg-paper-darker border-2 border-pencil text-pencil text-sm font-body font-bold wobbly shadow-sketch-xs rotate-[-1deg]">
          <div className="flex items-center gap-1.5 uppercase">
            {getWeatherIcon(cityState.weather)}
            <span>{cityState.season}</span>
          </div>
          <span className="text-pencil-light">/</span>
          <span className={`uppercase font-bold ${
            cityState.weather === 'drought' ? 'text-accent' : cityState.weather === 'rain' ? 'text-pen' : 'text-pencil'
          }`}>
            {cityState.weather}
          </span>
        </div>

        {/* Tick Counter Badge */}
        <div className="px-3 py-1 bg-postit-blue border-2 border-pencil text-pencil text-sm font-body font-bold wobbly shadow-sketch-xs rotate-1 flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-pen" strokeWidth={2.5} />
          <span>Tick #{cityState.tick}</span>
        </div>
      </div>

      {/* Right Controls & AI Model Pill */}
      <div className="flex items-center gap-2.5">
        {/* AI Model Tag */}
        <div className="flex items-center gap-2 px-3 py-1 bg-postit-rose border-2 border-pencil text-pencil text-sm font-body font-bold wobbly shadow-sketch-xs rotate-[-1deg]">
          <span className={`w-2.5 h-2.5 rounded-full border border-pencil block ${isThinking ? 'bg-accent animate-ping' : 'bg-pencil'}`} />
          <span className="hidden lg:inline">
            {hasApiKey ? activeModel : 'Autonomous Core'}
          </span>
        </div>

        {/* Socket Connection Pill */}
        <div 
          className={`flex items-center gap-1.5 px-2.5 py-1 border-2 border-pencil text-xs font-body font-bold wobbly-tag shadow-sketch-xs ${
            isConnected ? 'bg-postit-green text-pencil' : 'bg-accent text-white'
          }`}
          title={isConnected ? "WebSocket Live Connected" : "Reconnecting..."}
        >
          <Wifi className="w-3.5 h-3.5" strokeWidth={2.5} />
          <span className="hidden sm:inline">{isConnected ? 'ONLINE' : 'DISCONNECTED'}</span>
        </div>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="p-2 bg-white hover:bg-postit-yellow border-2 border-pencil shadow-sketch-xs wobbly transition-all active:translate-x-[2px] active:translate-y-[2px]"
          title="AI Settings & Gemini API Key"
        >
          <Sliders className="w-4 h-4 text-pencil" strokeWidth={2.5} />
        </button>
      </div>
    </header>
  );
};
