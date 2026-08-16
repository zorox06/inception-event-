import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Flame, 
  Bug, 
  CloudRain, 
  TrendingUp, 
  Sparkles, 
  Tv, 
  Sliders
} from 'lucide-react';

interface DemoControlsProps {
  gameSpeed: number;
  isPaused: boolean;
  onSetSpeed: (speed: number) => void;
  onSetPaused: (paused: boolean) => void;
  onLoadScenario: (preset: "drought_crisis" | "pest_outbreak" | "balanced_heartland" | "boomtown") => void;
  onTriggerEvent: (eventType: "pest_outbreak" | "heatwave" | "sudden_rain" | "market_boom") => void;
  onForceAgentTick: () => void;
  onOpenSettings: () => void;
}

export const DemoControls: React.FC<DemoControlsProps> = ({
  gameSpeed,
  isPaused,
  onSetSpeed,
  onSetPaused,
  onLoadScenario,
  onTriggerEvent,
  onForceAgentTick,
  onOpenSettings,
}) => {
  const [showScriptGuide, setShowScriptGuide] = useState(false);

  const scriptSteps = [
    { step: 1, title: "Drought Crisis Seed", desc: "Start with parched fields, low reservoir (Water: 28%, Soil: 42%)." },
    { step: 2, title: "Mayor Queues Irrigation", desc: "Mayor notices critical water deficit & queues drip irrigation (12s)." },
    { step: 3, title: "Reactor Construction", desc: "Observe active cranes & Clash-of-Clans build progress bar." },
    { step: 4, title: "Resolution & Soil Recovery", desc: "Build finishes: irrigation turns on, water & soil metrics stabilize." },
    { step: 5, title: "Pest Outbreak Event", desc: "Inject locust swarm; Mayor evaluates pesticide vs. quarantine trade-off." },
    { step: 6, title: "Citizen Suggestion", desc: "Send citizen advice in town hall; observe Mayor reference it in log." },
  ];

  return (
    <div className="relative w-full bg-white border-[2.5px] border-pencil shadow-sketch p-3.5 wobbly-md flex flex-wrap items-center justify-between gap-3 z-10">
      {/* Left: Speed & Simulation Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onSetPaused(!isPaused)}
          className={`px-3.5 py-1.5 border-2 border-pencil font-body font-bold text-sm flex items-center gap-1.5 transition-all wobbly ${
            isPaused
              ? 'bg-accent text-white shadow-sketch hover:shadow-sketch-sm'
              : 'bg-paper-darker hover:bg-muted text-pencil shadow-sketch-sm'
          }`}
        >
          {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
          <span>{isPaused ? 'Resume' : 'Pause'}</span>
        </button>

        {/* Speed Multipliers */}
        <div className="flex items-center bg-paper-darker p-1 border-2 border-pencil wobbly shadow-sketch-xs">
          {[1, 2, 5, 10].map((s) => (
            <button
              key={s}
              onClick={() => onSetSpeed(s)}
              className={`px-2.5 py-0.5 text-xs font-mono font-bold transition-all wobbly ${
                gameSpeed === s
                  ? 'bg-postit-yellow text-pencil border-[1.5px] border-pencil shadow-sketch-xs -rotate-1'
                  : 'text-pencil-light hover:text-pencil'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        <button
          onClick={onForceAgentTick}
          title="Force Mayor to evaluate state immediately"
          className="sketch-btn px-3 py-1 text-sm font-bold flex items-center gap-1.5"
        >
          <Sparkles className="w-4 h-4 text-pen" strokeWidth={2.5} />
          <span>Think Now</span>
        </button>
      </div>

      {/* Middle: Scenario & Disaster Quick Injections */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-body font-bold uppercase tracking-wider text-pencil-light mr-0.5">
          Scenarios:
        </span>

        <button
          onClick={() => onLoadScenario('drought_crisis')}
          className="px-3 py-1 bg-postit-yellow hover:bg-postit border-2 border-pencil text-pencil font-body font-bold text-xs shadow-sketch-xs wobbly rotate-[-1deg] transition-all hover:rotate-1 active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
        >
          🏜️ §11 Drought
        </button>

        <button
          onClick={() => onLoadScenario('pest_outbreak')}
          className="px-3 py-1 bg-postit-rose hover:bg-postit border-2 border-pencil text-pencil font-body font-bold text-xs shadow-sketch-xs wobbly rotate-1 transition-all hover:-rotate-1 active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
        >
          🦗 Pest Outbreak
        </button>

        <button
          onClick={() => onLoadScenario('balanced_heartland')}
          className="px-3 py-1 bg-postit-green hover:bg-postit border-2 border-pencil text-pencil font-body font-bold text-xs shadow-sketch-xs wobbly rotate-[-1deg] transition-all hover:rotate-1 active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
        >
          🌾 Balanced
        </button>

        <div className="w-px h-5 bg-pencil/30 mx-1 hidden sm:block" />

        {/* Disaster triggers */}
        <button
          onClick={() => onTriggerEvent('pest_outbreak')}
          title="Inject Locust Pest Outbreak"
          className="p-1.5 bg-white hover:bg-postit-rose border-2 border-pencil shadow-sketch-xs wobbly-circle transition-all hover:rotate-6 active:translate-x-[2px] active:translate-y-[2px]"
        >
          <Bug className="w-4 h-4 text-accent" strokeWidth={2.5} />
        </button>
        <button
          onClick={() => onTriggerEvent('heatwave')}
          title="Inject Sudden Heatwave"
          className="p-1.5 bg-white hover:bg-postit-yellow border-2 border-pencil shadow-sketch-xs wobbly-circle transition-all hover:rotate-6 active:translate-x-[2px] active:translate-y-[2px]"
        >
          <Flame className="w-4 h-4 text-accent" strokeWidth={2.5} />
        </button>
        <button
          onClick={() => onTriggerEvent('sudden_rain')}
          title="Inject Sudden Rainstorm"
          className="p-1.5 bg-white hover:bg-postit-blue border-2 border-pencil shadow-sketch-xs wobbly-circle transition-all hover:rotate-6 active:translate-x-[2px] active:translate-y-[2px]"
        >
          <CloudRain className="w-4 h-4 text-pen" strokeWidth={2.5} />
        </button>
        <button
          onClick={() => onTriggerEvent('market_boom')}
          title="Inject Commodity Market Boom"
          className="p-1.5 bg-white hover:bg-postit-green border-2 border-pencil shadow-sketch-xs wobbly-circle transition-all hover:rotate-6 active:translate-x-[2px] active:translate-y-[2px]"
        >
          <TrendingUp className="w-4 h-4 text-pencil" strokeWidth={2.5} />
        </button>
      </div>

      {/* Right: Demo Guide & Settings Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowScriptGuide(!showScriptGuide)}
          className={`px-3 py-1.5 border-2 border-pencil text-xs font-body font-bold flex items-center gap-1.5 transition-all wobbly shadow-sketch-sm ${
            showScriptGuide
              ? 'bg-postit-purple text-pencil -rotate-1'
              : 'bg-white hover:bg-paper-darker text-pencil'
          }`}
        >
          <Tv className="w-4 h-4 text-pen" strokeWidth={2.5} />
          <span>Demo Playbook</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="sketch-btn-secondary px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow-sketch-sm"
        >
          <Sliders className="w-4 h-4 text-pencil" strokeWidth={2.5} />
          <span>AI Config</span>
        </button>
      </div>

      {/* Scripted Demo Guide Collapsible Drawer */}
      {showScriptGuide && (
        <div className="relative w-full mt-3 p-5 bg-paper-warm border-2 border-pencil shadow-sketch wobbly-md space-y-3">
          <div className="tape-strip" />

          <div className="flex items-center justify-between border-b-2 border-dashed border-pencil/40 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-accent animate-ping" />
              <h3 className="text-base font-heading font-bold text-pencil">
                Section 11: Scripted Live Demo Guide
              </h3>
            </div>
            <span className="text-xs text-pencil-light font-body">
              Follow these steps for an authentic hand-drawn live demo
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {scriptSteps.map((s, idx) => (
              <div
                key={s.step}
                className={`p-3.5 border-2 border-pencil shadow-sketch-xs wobbly-md space-y-1 ${
                  idx % 3 === 0 ? 'bg-postit-yellow rotate-[-1deg]' : idx % 3 === 1 ? 'bg-postit-green rotate-1' : 'bg-postit-blue rotate-[-1deg]'
                }`}
              >
                <div className="flex items-center justify-between text-pencil font-heading font-bold text-sm">
                  <span>Step {s.step}: {s.title}</span>
                </div>
                <p className="text-pencil-light text-xs font-body leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
