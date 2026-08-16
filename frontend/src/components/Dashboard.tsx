import React from 'react';
import { CityState, District } from '../types';
import { 
  Droplets, 
  Wheat, 
  Coins, 
  Sprout, 
  Smile, 
  Factory, 
  AlertTriangle
} from 'lucide-react';

interface DashboardProps {
  cityState: CityState;
}

export const Dashboard: React.FC<DashboardProps> = ({ cityState }) => {
  const isWaterCritical = cityState.water < 30;
  const isFoodCritical = cityState.food < 30;
  const isCashTight = cityState.cash < 250;
  const isSoilDegraded = cityState.soilHealth < 35;

  const getDistrictStatusBadge = (d: District) => {
    switch (d.status) {
      case 'under_construction':
        return <span className="px-2 py-0.5 bg-postit-orange border border-pencil text-pencil text-[11px] font-body font-bold wobbly-tag shadow-sketch-xs rotate-[-1deg]">🔨 BUILDING</span>;
      case 'drought_stressed':
        return <span className="px-2 py-0.5 bg-postit-rose border border-pencil text-accent text-[11px] font-body font-bold wobbly-tag shadow-sketch-xs rotate-1">🏜️ PARCHED</span>;
      case 'pest_infested':
        return <span className="px-2 py-0.5 bg-postit-yellow border border-pencil text-pencil text-[11px] font-body font-bold wobbly-tag shadow-sketch-xs rotate-[-2deg]">🦗 PESTS</span>;
      case 'irrigating':
        return <span className="px-2 py-0.5 bg-postit-blue border border-pencil text-pen text-[11px] font-body font-bold wobbly-tag shadow-sketch-xs rotate-1">💧 IRRIGATING</span>;
      case 'growing':
        return <span className="px-2 py-0.5 bg-postit-green border border-pencil text-pencil text-[11px] font-body font-bold wobbly-tag shadow-sketch-xs rotate-[-1deg]">🌱 GROWING</span>;
      default:
        return <span className="px-2 py-0.5 bg-paper-darker border border-pencil text-pencil-light text-[11px] font-body font-bold wobbly-tag shadow-sketch-xs">IDLE</span>;
    }
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* 6-Metric Sticky Note Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Water Card */}
        <div className={`relative p-3.5 bg-white border-2 border-pencil shadow-sketch wobbly-md transition-all hover:rotate-1 ${
          isWaterCritical ? 'bg-postit-rose border-accent rotate-[-1deg]' : 'rotate-[-1deg]'
        }`}>
          <div className="thumbtack-pin-blue" />
          <div className="flex items-center justify-between mb-1 mt-1">
            <div className="flex items-center gap-1.5 text-sm font-heading font-bold text-pen">
              <Droplets className="w-4 h-4" strokeWidth={2.5} />
              <span>Water</span>
            </div>
            {isWaterCritical && <AlertTriangle className="w-4 h-4 text-accent animate-bounce" strokeWidth={2.5} />}
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-heading font-bold text-pencil">
              {Math.round(cityState.water)}%
            </span>
            <span className={`text-xs font-body font-bold ${cityState.weather === 'drought' ? 'text-accent' : 'text-pen'}`}>
              {cityState.weather === 'drought' ? '-1.5/t' : '+0.3/t'}
            </span>
          </div>
          {/* Hand-drawn progress bar */}
          <div className="w-full bg-paper-darker border-2 border-pencil rounded-full h-3 mt-2 overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isWaterCritical ? 'bg-accent' : 'bg-pen'}`}
              style={{ width: `${Math.min(100, cityState.water)}%` }}
            />
          </div>
        </div>

        {/* Food Card */}
        <div className={`relative p-3.5 bg-white border-2 border-pencil shadow-sketch wobbly-md transition-all hover:rotate-[-1deg] ${
          isFoodCritical ? 'bg-postit-rose border-accent rotate-1' : 'rotate-1'
        }`}>
          <div className="thumbtack-pin" />
          <div className="flex items-center justify-between mb-1 mt-1">
            <div className="flex items-center gap-1.5 text-sm font-heading font-bold text-pencil">
              <Wheat className="w-4 h-4 text-amber-700" strokeWidth={2.5} />
              <span>Food</span>
            </div>
            {isFoodCritical && <AlertTriangle className="w-4 h-4 text-accent animate-bounce" strokeWidth={2.5} />}
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-heading font-bold text-pencil">
              {Math.round(cityState.food)}%
            </span>
            <span className="text-xs font-body font-bold text-pencil-light">
              {cityState.food > 40 ? '+0.4/t' : '-0.2/t'}
            </span>
          </div>
          <div className="w-full bg-paper-darker border-2 border-pencil rounded-full h-3 mt-2 overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isFoodCritical ? 'bg-accent' : 'bg-amber-500'}`}
              style={{ width: `${Math.min(100, cityState.food)}%` }}
            />
          </div>
        </div>

        {/* Treasury Card */}
        <div className={`relative p-3.5 bg-postit-yellow border-2 border-pencil shadow-sketch wobbly-md transition-all hover:rotate-1 ${
          isCashTight ? 'border-accent rotate-[-1deg]' : 'rotate-[-1deg]'
        }`}>
          <div className="tape-corner-left" />
          <div className="flex items-center justify-between mb-1 mt-1">
            <div className="flex items-center gap-1.5 text-sm font-heading font-bold text-pencil">
              <Coins className="w-4 h-4 text-amber-800" strokeWidth={2.5} />
              <span>Treasury</span>
            </div>
            {isCashTight && <AlertTriangle className="w-4 h-4 text-accent" strokeWidth={2.5} />}
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-heading font-bold text-pencil">
              ${Math.round(cityState.cash)}
            </span>
            <span className="text-xs font-body font-bold text-pen">
              +${Math.round((cityState.population * (cityState.happiness / 100) * 0.008) * 10) / 10}/t
            </span>
          </div>
          <div className="w-full bg-paper-darker border-2 border-pencil rounded-full h-3 mt-2 overflow-hidden p-0.5">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (cityState.cash / 2000) * 100)}%` }}
            />
          </div>
        </div>

        {/* Soil Health Card */}
        <div className={`relative p-3.5 bg-white border-2 border-pencil shadow-sketch wobbly-md transition-all hover:rotate-[-1deg] ${
          isSoilDegraded ? 'bg-postit-orange border-accent rotate-1' : 'rotate-1'
        }`}>
          <div className="thumbtack-pin" />
          <div className="flex items-center justify-between mb-1 mt-1">
            <div className="flex items-center gap-1.5 text-sm font-heading font-bold text-amber-900">
              <Sprout className="w-4 h-4" strokeWidth={2.5} />
              <span>Soil Health</span>
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-heading font-bold text-pencil">
              {Math.round(cityState.soilHealth)}%
            </span>
            <span className="text-xs font-body font-bold text-pencil-light">
              Biomass
            </span>
          </div>
          <div className="w-full bg-paper-darker border-2 border-pencil rounded-full h-3 mt-2 overflow-hidden p-0.5">
            <div
              className="h-full bg-amber-700 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, cityState.soilHealth)}%` }}
            />
          </div>
        </div>

        {/* Happiness Card */}
        <div className="relative p-3.5 bg-postit-green border-2 border-pencil shadow-sketch wobbly-md rotate-[-1deg] transition-all hover:rotate-1">
          <div className="tape-corner-right" />
          <div className="flex items-center justify-between mb-1 mt-1">
            <div className="flex items-center gap-1.5 text-sm font-heading font-bold text-pencil">
              <Smile className="w-4 h-4 text-emerald-800" strokeWidth={2.5} />
              <span>Happiness</span>
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-heading font-bold text-pencil">
              {Math.round(cityState.happiness)}%
            </span>
            <span className="text-xs font-body font-bold text-pencil-light">
              {cityState.population.toLocaleString()} pop
            </span>
          </div>
          <div className="w-full bg-paper-darker border-2 border-pencil rounded-full h-3 mt-2 overflow-hidden p-0.5">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, cityState.happiness)}%` }}
            />
          </div>
        </div>

        {/* Pollution Card */}
        <div className="relative p-3.5 bg-postit-purple border-2 border-pencil shadow-sketch wobbly-md rotate-1 transition-all hover:rotate-[-1deg]">
          <div className="thumbtack-pin" />
          <div className="flex items-center justify-between mb-1 mt-1">
            <div className="flex items-center gap-1.5 text-sm font-heading font-bold text-purple-900">
              <Factory className="w-4 h-4" strokeWidth={2.5} />
              <span>Pollution</span>
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-heading font-bold text-pencil">
              {Math.round(cityState.pollution)}%
            </span>
            <span className="text-xs font-body font-bold text-pencil-light">
              Index
            </span>
          </div>
          <div className="w-full bg-paper-darker border-2 border-pencil rounded-full h-3 mt-2 overflow-hidden p-0.5">
            <div
              className="h-full bg-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, cityState.pollution)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Districts Sketch Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {cityState.districts.map((d, idx) => (
          <div
            key={d.id}
            className={`p-3 bg-white border-2 border-pencil shadow-sketch-xs wobbly flex items-center justify-between transition-all hover:rotate-1 ${
              idx % 2 === 0 ? 'rotate-[-0.5deg]' : 'rotate-[0.5deg]'
            }`}
          >
            <div>
              <div className="font-heading font-bold text-pencil text-sm truncate max-w-[130px]">
                {d.name}
              </div>
              <div className="text-xs text-pencil-light flex items-center gap-1.5 font-body">
                <span>Lv.{d.level} {d.type}</span>
                <span>•</span>
                <span className="text-pen font-bold">{d.moisture}% moist</span>
              </div>
            </div>
            <div>{getDistrictStatusBadge(d)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
