import React from 'react';
import { ActiveConstruction } from '../types';
import { Hammer, Clock, MapPin } from 'lucide-react';

interface BuildQueueBarProps {
  activeConstruction?: ActiveConstruction;
  gameSpeed?: number;
}

export const BuildQueueBar: React.FC<BuildQueueBarProps> = ({
  activeConstruction,
  gameSpeed = 1,
}) => {
  if (!activeConstruction) {
    return (
      <div className="relative w-full bg-white border-2 border-pencil shadow-sketch p-3.5 wobbly-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-paper-darker border-2 border-pencil wobbly-circle flex items-center justify-center text-pencil shadow-sketch-xs">
            <Hammer className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-heading font-bold text-pencil">
                Single Construction Crew (1/1)
              </span>
              <span className="px-2 py-0.5 bg-postit-green border border-pencil text-pencil text-xs font-body font-bold wobbly-tag">
                Standby / Idle
              </span>
            </div>
            <p className="text-xs text-pencil-light font-body">
              Mayor evaluating city telemetry & citizen counsel for next deployment...
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono font-bold text-pencil-light">
          <span>Speed: {gameSpeed}x</span>
        </div>
      </div>
    );
  }

  const progress = activeConstruction.progressPercent || 0;
  const remainingSec = Math.max(0, Math.ceil((activeConstruction.remainingMs || 0) / 1000));
  const formattedAction = activeConstruction.action.replace('_', ' ').toUpperCase();

  return (
    <div className="relative w-full bg-postit-yellow border-[2.5px] border-pencil shadow-sketch p-4 wobbly-md rotate-[-0.5deg]">
      {/* Top Center Tape */}
      <div className="tape-strip" />

      {/* Top Details Row */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white border-2 border-pencil wobbly-circle flex items-center justify-center text-pencil shadow-sketch-xs animate-jiggle">
            <Hammer className="w-5 h-5 text-accent" strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-heading font-bold text-pencil">
                Construction In Progress
              </span>
              <span className="px-2 py-0.5 bg-accent text-white border border-pencil text-xs font-body font-bold wobbly-tag shadow-sketch-xs">
                {formattedAction}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-pencil font-body font-bold mt-0.5">
              <MapPin className="w-4 h-4 text-pen" strokeWidth={2.5} />
              <span>{activeConstruction.location}</span>
            </div>
          </div>
        </div>

        {/* Countdown Badge */}
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white border-2 border-pencil text-pencil font-body font-bold text-sm shadow-sketch-xs wobbly">
            <Clock className="w-4 h-4 text-accent" strokeWidth={2.5} />
            <span>{remainingSec}s remaining</span>
          </div>
          <span className="text-xs text-pencil-light font-body mt-0.5">
            {progress}% Completed
          </span>
        </div>
      </div>

      {/* Hand-Drawn Hatching Progress Bar */}
      <div className="relative w-full h-5 bg-white border-2 border-pencil rounded-full overflow-hidden p-0.5 shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-amber-400 via-emerald-400 to-emerald-500 sketch-progress-green rounded-full transition-all duration-300 ease-out border-r-2 border-pencil"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Mayor's Stated Justification */}
      <div className="mt-2.5 flex items-start gap-1.5 text-xs text-pencil font-body">
        <span className="text-pen font-bold font-heading">Mayor's Order:</span>
        <span className="italic line-clamp-1">"{activeConstruction.reason}"</span>
      </div>
    </div>
  );
};
