import React, { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import confetti from 'canvas-confetti';
import { 
  CityState, 
  MayorLogEntry, 
  ReactorPromptRecord, 
  ActiveConstruction,
  EffectDelta
} from './types';
import { Navbar } from './components/Navbar';
import { ReactorView } from './components/ReactorView';
import { BuildQueueBar } from './components/BuildQueueBar';
import { MayorLog } from './components/MayorLog';
import { Dashboard } from './components/Dashboard';
import { DemoControls } from './components/DemoControls';
import { SettingsModal } from './components/SettingsModal';

const SOCKET_URL = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '/';

export const App: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [hasReactorKey, setHasReactorKey] = useState(false);
  const [reactorToken, setReactorToken] = useState<string>('');
  const [activeModel, setActiveModel] = useState<string>('gemma-4-31b-it');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isScanningVision, setIsScanningVision] = useState(false);

  // Initial State Fallback
  const [cityState, setCityState] = useState<CityState>({
    tick: 1,
    season: 'summer',
    weather: 'drought',
    water: 28,
    food: 50,
    cash: 700,
    soilHealth: 42,
    happiness: 56,
    pollution: 25,
    population: 1450,
    recentEvents: ['Drought emergency active: Reservoir levels dropping critical'],
    lastVisualEvent: 'Dry cracked earth and low reservoir water in North Valley',
    districts: [
      { id: 'district_north', name: 'North Valley Farmlands', type: 'cropland', status: 'drought_stressed', level: 1, fertility: 45, moisture: 30 },
      { id: 'district_east', name: 'East River Reservoir', type: 'reservoir', status: 'drought_stressed', level: 1, fertility: 60, moisture: 28 },
      { id: 'district_south', name: 'South Delta Greenhouses', type: 'greenhouse', status: 'idle', level: 1, fertility: 50, moisture: 55 },
      { id: 'district_west', name: 'West Prairie Orchards', type: 'orchard', status: 'idle', level: 1, fertility: 42, moisture: 40 },
    ],
    activeConstructions: [],
    metricsHistory: [],
    gameSpeed: 1,
    isPaused: false,
  });

  const [mayorLogs, setMayorLogs] = useState<MayorLogEntry[]>([]);
  const [latestPrompt, setLatestPrompt] = useState<ReactorPromptRecord | undefined>(undefined);

  // Sound Synthesis helper (soft pleasant UI chimes)
  const playChime = useCallback((freq = 440, type: OscillatorType = 'sine') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      // Audio context might be restricted before user interaction
    }
  }, []);

  // Initialize Socket.io Connection
  useEffect(() => {
    const s = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });

    s.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to FarmState backend');
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.on('city_state_update', (state: CityState) => {
      setCityState(state);
    });

    s.on('agent_thinking', (data: { isThinking: boolean }) => {
      setIsThinking(data.isThinking);
    });

    s.on('mayor_log', (entry: MayorLogEntry) => {
      setMayorLogs((prev) => [entry, ...prev.slice(0, 49)]);
      if (entry.type === 'decision' || entry.type === 'construction_started') {
        playChime(523.25); // C5
      }
    });

    s.on('mayor_log_history', (history: MayorLogEntry[]) => {
      setMayorLogs(history);
    });


    s.on('construction_started', (data: { construction: ActiveConstruction; scenePrompt: string }) => {
      setLatestPrompt({
        id: `prompt_${Date.now()}`,
        timestamp: Date.now(),
        type: 'start',
        prompt: data.scenePrompt,
        constructionId: data.construction.id,
        cameraPerspective: 'Overhead 45°',
      });
      playChime(659.25); // E5
    });

    s.on('construction_completed', (data: { construction: ActiveConstruction; effects: EffectDelta; scenePrompt: string }) => {
      setLatestPrompt({
        id: `prompt_${Date.now()}`,
        timestamp: Date.now(),
        type: 'complete',
        prompt: data.scenePrompt,
        constructionId: data.construction.id,
        cameraPerspective: 'Overhead 45°',
      });

      // Trigger Celebration Confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10b981', '#38bdf8', '#f59e0b'],
      });

      playChime(783.99); // G5
    });

    s.on('event_triggered', (data: { eventType: string; prompt: string }) => {
      setLatestPrompt({
        id: `prompt_${Date.now()}`,
        timestamp: Date.now(),
        type: 'event',
        prompt: data.prompt,
        cameraPerspective: 'Overhead 45°',
      });
      playChime(349.23, 'sawtooth'); // F4 alert
    });

    setSocket(s);

    // Initial Fetch
    fetch('/api/state')
      .then((r) => r.json())
      .then((data) => {
        if (data.state) setCityState(data.state);
        if (data.mayorLogs) setMayorLogs(data.mayorLogs);
        if (data.reactorPrompts && data.reactorPrompts.length > 0) {
          setLatestPrompt(data.reactorPrompts[0]);
        }
        setHasApiKey(Boolean(data.hasApiKey));
        setHasReactorKey(Boolean(data.hasReactorKey));
        if (data.activeModel) setActiveModel(data.activeModel);
        if (data.reactorToken) setReactorToken(data.reactorToken);
      })
      .catch((e) => console.log('Backend initial poll:', e));

    return () => {
      s.disconnect();
    };
  }, [playChime]);

  // Frame Capture for AI Vision Tool
  const handleCaptureFrame = useCallback((base64: string) => {
    if (socket) {
      socket.emit('submit_frame', { frameBase64: base64 });
    }
  }, [socket]);

  // Handlers
  const handleSetSpeed = (speed: number) => {
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameSpeed: speed }),
    });
  };

  const handleSetPaused = (paused: boolean) => {
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPaused: paused }),
    });
  };

  const handleLoadScenario = (preset: "drought_crisis" | "pest_outbreak" | "balanced_heartland" | "boomtown") => {
    fetch('/api/scenario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preset }),
    });
  };

  const handleTriggerEvent = (eventType: "pest_outbreak" | "heatwave" | "sudden_rain" | "market_boom") => {
    fetch('/api/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType }),
    });
  };

  const handleForceAgentTick = () => {
    fetch('/api/agent/tick', { method: 'POST' });
  };



  const handleSaveSettings = (settings: { apiKey?: string; model?: string; reactorKey?: string }) => {
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
      .then((r) => r.json())
      .then((res) => {
        setHasApiKey(res.hasApiKey);
        setHasReactorKey(res.hasReactorKey);
        if (settings.model) setActiveModel(settings.model);
        if (settings.reactorKey) setReactorToken(settings.reactorKey);
      });
  };

  const activeConstruction = cityState.activeConstructions[0];

  return (
    <div className="min-h-screen w-full bg-paper text-pencil p-3 sm:p-5 flex flex-col gap-3 font-body">
      {/* 1. Header Navigation Bar */}
      <Navbar
        cityState={cityState}
        isConnected={isConnected}
        isThinking={isThinking}
        hasApiKey={hasApiKey}
        activeModel={activeModel}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* 2. Demo Controls & Scenario Bar */}
      <DemoControls
        gameSpeed={cityState.gameSpeed || 1}
        isPaused={cityState.isPaused}
        onSetSpeed={handleSetSpeed}
        onSetPaused={handleSetPaused}
        onLoadScenario={handleLoadScenario}
        onTriggerEvent={handleTriggerEvent}
        onForceAgentTick={handleForceAgentTick}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* 3. City Telemetry HUD Dashboard */}
      <Dashboard cityState={cityState} />

      {/* 4. The Three Main Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left: Viewport + Build Timer (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-2">
          <BuildQueueBar
            activeConstruction={activeConstruction}
            gameSpeed={cityState.gameSpeed || 1}
          />

          {/* Reactor Viewport — compact fixed landscape */}
          <ReactorView
            cityState={cityState}
            activeConstruction={activeConstruction}
            latestPrompt={latestPrompt}
            reactorToken={reactorToken}
            onCaptureFrame={handleCaptureFrame}
            isScanningVision={isScanningVision}
          />
        </div>

        {/* Right: Mayor's Journal (5 Cols) — full height */}
        <div className="lg:col-span-5">
          <MayorLog logs={mayorLogs} isThinking={isThinking} />
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        hasApiKey={hasApiKey}
        hasReactorKey={hasReactorKey}
        onSaveSettings={handleSaveSettings}
      />
    </div>
  );
};

export default App;
