import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CityState, ActiveConstruction, ReactorPromptRecord } from '../types';
import { 
  Camera, 
  Sparkles, 
  Layers, 
  Video, 
  Compass,
  Play,
  Pause,
  RotateCcw,
  ZoomIn, 
  ZoomOut,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Tv,
  Loader2,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { 
  HappyOysterProvider, 
  useHappyOyster, 
  HappyOysterVideo
} from '@reactor-models/happy-oyster/react';

// ─── Dynamic prompt builder for cartoon farming world ─────────────
function buildFarmPrompt(cityState: CityState, activeConstruction?: ActiveConstruction): string {
  const season = cityState.season || 'summer';
  const weather = cityState.weather || 'clear';
  const waterPct = Math.round(cityState.water);

  const seasonDesc: Record<string, string> = {
    spring: 'bright spring day with cherry blossoms and fresh green sprouts',
    summer: 'warm golden summer with tall wheat and sunflowers',
    fall: 'cozy autumn harvest with orange and red foliage, pumpkins',
    winter: 'snowy winter scene with frosted rooftops and bare trees',
  };

  const weatherDesc: Record<string, string> = {
    clear: 'clear blue sky with puffy white clouds',
    rain: 'gentle rain falling, puddles on dirt paths, overcast sky',
    drought: 'scorching dry heat, cracked earth, hazy orange sky, wilting crops',
    storm: 'storm clouds, lightning, heavy rain',
  };

  const waterDesc = waterPct < 30 ? 'nearly empty reservoir with dry cracked banks' :
                    waterPct < 60 ? 'half-filled reservoir with calm blue water' :
                    'full sparkling reservoir brimming with clear water';

  let constructionDesc = '';
  if (activeConstruction) {
    constructionDesc = `, an active construction site with wooden scaffolding and a cartoon crane near ${activeConstruction.location}`;
  }

  return `A colorful cartoon isometric farming village in the style of Clash of Clans and Farming Simulator. ${seasonDesc[season] || seasonDesc.summer}. ${weatherDesc[weather] || weatherDesc.clear}. Cute chunky buildings with orange rooftops, a red barn, windmill, ${waterDesc}, lush crop fields in neat rows, wooden fences, hay bales, dirt paths, happy cartoon farm animals${constructionDesc}. Wide panoramic landscape view, bright saturated colors, game-like 3D rendered look, no UI elements.`;
}

// ─── Happy Oyster Directing Studio (AI Mayor Steered) ─────────────
function HappyOysterDirectingStudio({ prompt }: { prompt: string }) {
  const { 
    model,
    createWorld, 
    startTravel, 
    instruct, 
    pause, 
    resume, 
    rewind, 
    phase, 
    worldState, 
    travelState, 
    streaming 
  } = useHappyOyster();

  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusNote, setStatusNote] = useState<string>('Connected to Reactor cloud. Initiating 3D world session...');
  const [lastModelMsg, setLastModelMsg] = useState<string>('');
  const isTriggeredRef = useRef(false);
  const lastInstructionTimeRef = useRef<number>(0);
  const lastInstructedPromptRef = useRef<string>('');

  const currentWorldPhase = worldState?.phase || 'no_world';

  // Listen to model messages for live debugging
  useEffect(() => {
    if (!model) return;
    const unsub = model.onMessage((msg: any) => {
      if (msg?.type) {
        setLastModelMsg(`${msg.type}${msg.status ? ` · ${msg.status}` : ''}${msg.phase ? ` · ${msg.phase}` : ''}`);
      }
    });
    return unsub;
  }, [model]);

  // Timer while generating
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (phase === 'connected' && !streaming) {
      interval = setInterval(() => {
        setElapsedSec((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedSec(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [phase, streaming]);

  // 1. Build world with timeout protection
  const handleBuildWorld = useCallback(async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setStatusNote('Synthesizing 3D cartoon world & first frame on Reactor GPU...');

    try {
      // Promise with 20s timeout so UI is never permanently blocked
      const buildPromise = createWorld({
        prompt,
        resolution: '720p',
        layout: 'Stable',
        narrative: 'Calm',
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('World synthesis in progress on GPU')), 20000)
      );

      await Promise.race([buildPromise, timeoutPromise]);
      setStatusNote('World built! Starting video stream...');
    } catch (err: any) {
      console.log('HappyOyster build status:', err?.message);
      setStatusNote(err?.message || 'Processing on cloud GPU...');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, createWorld, isGenerating]);

  // 2. Enter live stream
  const handleEnterWorld = useCallback(async () => {
    try {
      setStatusNote('Negotiating live WebRTC video travel stream...');
      await startTravel();
      setStatusNote('Live 720p stream running.');
    } catch (err: any) {
      console.warn('HappyOyster startTravel notice:', err);
      setStatusNote(`Stream notice: ${err?.message || 'Connecting...'}`);
    }
  }, [startTravel]);

  // Auto-progression
  useEffect(() => {
    if (phase === 'connected') {
      if (currentWorldPhase === 'no_world' && !isTriggeredRef.current && !isGenerating) {
        isTriggeredRef.current = true;
        handleBuildWorld();
      } else if (currentWorldPhase === 'ready' && !streaming) {
        handleEnterWorld();
      }
    }
  }, [phase, currentWorldPhase, streaming, isGenerating, handleBuildWorld, handleEnterWorld]);

  // 3. Dynamic Steering - Throttled to 1 scene update per 1 minute (60s)
  useEffect(() => {
    if (!streaming || !prompt) return;
    const now = Date.now();
    const timeSinceLast = now - lastInstructionTimeRef.current;

    // Send at most 1 scene instruction per 60 seconds
    if (prompt !== lastInstructedPromptRef.current && (timeSinceLast >= 60000 || lastInstructionTimeRef.current === 0)) {
      lastInstructedPromptRef.current = prompt;
      lastInstructionTimeRef.current = now;
      instruct(prompt).catch((err) => console.warn('HappyOyster instruct notice:', err));
    }
  }, [streaming, prompt, instruct]);

  const handleTogglePause = async () => {
    try {
      if (isPaused) {
        await resume();
        setIsPaused(false);
      } else {
        await pause();
        setIsPaused(true);
      }
    } catch (e) {
      console.warn('Pause toggle notice:', e);
    }
  };

  const handleRewind = async () => {
    try {
      await rewind(4);
      setIsPaused(false);
    } catch (e) {
      console.warn('Rewind notice:', e);
    }
  };

  const [isDismissed, setIsDismissed] = useState(false);

  const isLive = (streaming && phase === 'streaming') || isDismissed;

  return (
    <div className="relative w-full h-full bg-[#1a1206] flex items-center justify-center overflow-hidden rounded-lg select-none">
      {/* Primary Video Player */}
      <HappyOysterVideo 
        className="w-full h-full object-cover relative z-0 select-none" 
        onPlaying={() => setIsDismissed(true)}
      />

      {/* Loading & Status Overlay */}
      {!isLive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#2a1a0a]/92 text-amber-100 font-body text-sm gap-3 z-10 p-5 text-center">
          <div className="relative flex items-center justify-center">
            <span className="w-9 h-9 rounded-full bg-amber-400/30 animate-ping absolute" />
            <div className="w-12 h-12 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-300">
              {currentWorldPhase === 'ready' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              ) : (
                <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
              )}
            </div>
          </div>

          <div>
            <h3 className="font-heading font-bold text-lg text-amber-100 mb-1 flex items-center justify-center gap-2">
              <span>{currentWorldPhase === 'ready' ? 'Happy Oyster World Ready!' : 'Generating Happy Oyster World'}</span>
              {elapsedSec > 0 && (
                <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-full font-mono font-normal">
                  {elapsedSec}s
                </span>
              )}
            </h3>
            <p className="text-xs text-amber-200/75 max-w-md font-body leading-relaxed">
              {statusNote}
            </p>
            {lastModelMsg && (
              <p className="text-[10px] text-amber-400/60 font-mono mt-1">
                Event: {lastModelMsg}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className="px-2.5 py-0.5 bg-amber-900/60 border border-amber-600 text-amber-200 text-xs font-bold rounded">
              Phase: {phase}
            </span>
            <span className="px-2.5 py-0.5 bg-purple-900/60 border border-purple-600 text-purple-200 text-xs font-bold rounded">
              World: {currentWorldPhase}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleBuildWorld}
              disabled={isGenerating}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-heading font-bold text-xs rounded-lg shadow-sketch-xs transition-all active:scale-95 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Synthesizing...' : '🔨 Re-build World'}</span>
            </button>
            <button
              onClick={() => {
                handleEnterWorld();
                setIsDismissed(true);
              }}
              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-heading font-bold text-xs rounded-lg shadow-sketch-xs transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-black" />
              <span>Watch Live Stream</span>
            </button>
          </div>
        </div>
      )}

      {/* Directing HUD Controls */}
      {isLive && (
        <div className="absolute top-12 right-3 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-md p-1.5 border border-amber-500/40 rounded-lg text-white text-xs">
          <button
            onClick={handleTogglePause}
            className="p-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded transition-all flex items-center gap-1"
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>
          <button
            onClick={handleRewind}
            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-300 rounded transition-all flex items-center gap-1"
            title="Rewind 4 seconds"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Rewind 4s</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Happy Oyster Adventure Studio (WASD 3D Exploration) ──────────
function HappyOysterAdventureStudio({ prompt }: { prompt: string }) {
  const { 
    model,
    createWorld, 
    startTravel, 
    move, 
    stop, 
    interact, 
    phase, 
    worldState, 
    streaming 
  } = useHappyOyster();

  const [activeDirection, setActiveDirection] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const isTriggeredRef = useRef(false);
  const currentWorldPhase = worldState?.phase || 'no_world';

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (phase === 'connected' && !streaming) {
      interval = setInterval(() => {
        setElapsedSec((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedSec(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [phase, streaming]);

  // Initial World Creation
  useEffect(() => {
    if (phase === 'connected') {
      if (currentWorldPhase === 'no_world' && !isTriggeredRef.current) {
        isTriggeredRef.current = true;
        createWorld({
          prompt,
          perspective: 'third_person',
        }).catch((err) => console.warn('HappyOyster adventure createWorld notice:', err));
      } else if (currentWorldPhase === 'ready' && !streaming) {
        startTravel().catch((err) => console.warn('HappyOyster adventure startTravel notice:', err));
      }
    }
  }, [phase, currentWorldPhase, streaming, prompt, createWorld, startTravel]);

  // Keyboard Navigation (WASD)
  useEffect(() => {
    if (!streaming) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') {
        move('Front');
        setActiveDirection('Front');
      } else if (key === 's' || key === 'arrowdown') {
        move('Back');
        setActiveDirection('Back');
      } else if (key === 'a' || key === 'arrowleft') {
        move('Left');
        setActiveDirection('Left');
      } else if (key === 'd' || key === 'arrowright') {
        move('Right');
        setActiveDirection('Right');
      } else if (e.code === 'Space') {
        interact('Jump');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 's', 'a', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        stop();
        setActiveDirection(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [streaming, move, stop, interact]);

  const isLive = streaming && phase === 'streaming';

  return (
    <div className="relative w-full h-full bg-[#1a1206] flex items-center justify-center overflow-hidden rounded-lg select-none">
      <HappyOysterVideo className="w-full h-full object-cover relative z-0 pointer-events-none select-none" />

      {/* Loading Overlay */}
      {!isLive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#2a1a0a]/92 text-amber-100 font-body text-sm gap-3 z-10 p-5 text-center">
          <div className="relative flex items-center justify-center">
            <span className="w-9 h-9 rounded-full bg-emerald-400/30 animate-ping absolute" />
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-300">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg text-amber-100 mb-1 flex items-center justify-center gap-2">
              <span>Generating Adventure World</span>
              {elapsedSec > 0 && (
                <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full font-mono font-normal">
                  {elapsedSec}s
                </span>
              )}
            </h3>
            <p className="text-xs text-amber-200/75 max-w-md font-body leading-relaxed">
              Synthesizing 3D third-person playable world on Reactor GPU cluster...
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2.5 py-0.5 bg-emerald-900/60 border border-emerald-600 text-emerald-200 text-xs font-bold rounded">
              Mode: Adventure 3D
            </span>
            <span className="px-2.5 py-0.5 bg-amber-900/60 border border-amber-600 text-amber-200 text-xs font-bold rounded">
              Phase: {phase}
            </span>
          </div>
        </div>
      )}

      {/* On-Screen D-Pad */}
      {isLive && (
        <div className="absolute bottom-12 right-4 z-20 bg-black/60 backdrop-blur-md p-3 border border-amber-500/40 rounded-xl flex flex-col items-center gap-1">
          <button
            onMouseDown={() => { move('Front'); setActiveDirection('Front'); }}
            onMouseUp={() => { stop(); setActiveDirection(null); }}
            className={`p-2 rounded border border-pencil font-bold text-xs ${activeDirection === 'Front' ? 'bg-amber-400 text-black' : 'bg-neutral-800 text-white'}`}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <div className="flex gap-1">
            <button
              onMouseDown={() => { move('Left'); setActiveDirection('Left'); }}
              onMouseUp={() => { stop(); setActiveDirection(null); }}
              className={`p-2 rounded border border-pencil font-bold text-xs ${activeDirection === 'Left' ? 'bg-amber-400 text-black' : 'bg-neutral-800 text-white'}`}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onMouseDown={() => { move('Back'); setActiveDirection('Back'); }}
              onMouseUp={() => { stop(); setActiveDirection(null); }}
              className={`p-2 rounded border border-pencil font-bold text-xs ${activeDirection === 'Back' ? 'bg-amber-400 text-black' : 'bg-neutral-800 text-white'}`}
            >
              <ArrowDown className="w-4 h-4" />
            </button>
            <button
              onMouseDown={() => { move('Right'); setActiveDirection('Right'); }}
              onMouseUp={() => { stop(); setActiveDirection(null); }}
              className={`p-2 rounded border border-pencil font-bold text-xs ${activeDirection === 'Right' ? 'bg-amber-400 text-black' : 'bg-neutral-800 text-white'}`}
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-1 mt-1">
            <button
              onClick={() => interact('Jump')}
              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded"
            >
              Jump
            </button>
            <button
              onClick={() => interact('Sprint')}
              className="px-2 py-1 bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold rounded"
            >
              Sprint
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main ReactorView Component ───────────────────────────────────
interface ReactorViewProps {
  cityState: CityState;
  activeConstruction?: ActiveConstruction;
  latestPrompt?: ReactorPromptRecord;
  reactorToken?: string;
  onCaptureFrame?: (base64: string) => void;
  isScanningVision?: boolean;
}

export const ReactorView: React.FC<ReactorViewProps> = ({
  cityState,
  activeConstruction,
  latestPrompt,
  reactorToken,
  onCaptureFrame,
  isScanningVision = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Default to happy_oyster_direct
  const [viewMode, setViewMode] = useState<'happy_oyster_direct' | 'happy_oyster_adventure' | 'canvas'>('happy_oyster_direct');
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [flashEffect, setFlashEffect] = useState<boolean>(false);

  const animFrameRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; size: number; alpha: number }>>([]);

  useEffect(() => {
    const p: typeof particlesRef.current = [];
    for (let i = 0; i < 40; i++) {
      p.push({
        x: Math.random() * 1000,
        y: Math.random() * 500,
        vx: (Math.random() - 0.5) * 1.5,
        vy: Math.random() * 2 + 1,
        size: Math.random() * 3 + 1,
        alpha: Math.random() * 0.7 + 0.3,
      });
    }
    particlesRef.current = p;
  }, []);

  const captureFrame = useCallback(() => {
    if (!canvasRef.current) return;
    try {
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.85);
      setFlashEffect(true);
      setTimeout(() => setFlashEffect(false), 400);
      if (onCaptureFrame) onCaptureFrame(dataUrl);
    } catch (e) {
      console.error('Frame capture error:', e);
    }
  }, [onCaptureFrame]);

  useEffect(() => {
    if (isScanningVision) captureFrame();
  }, [isScanningVision, captureFrame]);

  // Dynamic Cartoon Prompt built from CityState
  const currentPrompt = buildFarmPrompt(cityState, activeConstruction);

  // ── Canvas Render Loop ──
  useEffect(() => {
    if (viewMode !== 'canvas') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const resizeCanvas = () => {
      if (containerRef.current && canvas) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          canvas.width = Math.round(rect.width);
          canvas.height = Math.round(rect.height);
        }
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const render = () => {
      if (!isRunning) return;
      timeRef.current += 0.03;
      const t = timeRef.current;
      const width = canvas.width || 800;
      const height = canvas.height || 500;

      const season = cityState.season || 'summer';
      const isDrought = cityState.weather === 'drought';
      const isRain = cityState.weather === 'rain';
      const isWinter = season === 'winter';
      const isFall = season === 'fall';

      // Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.5);
      if (isDrought) {
        skyGrad.addColorStop(0, '#ea580c');
        skyGrad.addColorStop(1, '#fef3c7');
      } else if (isRain) {
        skyGrad.addColorStop(0, '#475569');
        skyGrad.addColorStop(1, '#94a3b8');
      } else if (isWinter) {
        skyGrad.addColorStop(0, '#93c5fd');
        skyGrad.addColorStop(1, '#dbeafe');
      } else if (isFall) {
        skyGrad.addColorStop(0, '#f97316');
        skyGrad.addColorStop(0.5, '#fbbf24');
        skyGrad.addColorStop(1, '#fef9c3');
      } else {
        skyGrad.addColorStop(0, '#0ea5e9');
        skyGrad.addColorStop(1, '#bae6fd');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Sun/Moon
      if (!isRain) {
        const sunX = width * 0.82;
        const sunY = height * 0.12;
        ctx.beginPath();
        ctx.arc(sunX, sunY, isWinter ? 20 : 26, 0, Math.PI * 2);
        ctx.fillStyle = isDrought ? '#f97316' : isWinter ? '#e2e8f0' : '#fbbf24';
        ctx.fill();
        if (!isWinter) {
          ctx.strokeStyle = '#fcd34d';
          ctx.lineWidth = 2;
          for (let r = 0; r < 8; r++) {
            const angle = (r / 8) * Math.PI * 2 + t * 0.3;
            ctx.beginPath();
            ctx.moveTo(sunX + Math.cos(angle) * 30, sunY + Math.sin(angle) * 30);
            ctx.lineTo(sunX + Math.cos(angle) * 38, sunY + Math.sin(angle) * 38);
            ctx.stroke();
          }
        }
      }

      // Clouds
      const drawCloud = (cx: number, cy: number, s: number) => {
        ctx.fillStyle = isRain ? 'rgba(148,163,184,0.8)' : 'rgba(255,255,255,0.85)';
        ctx.beginPath();
        ctx.arc(cx, cy, s * 1.2, 0, Math.PI * 2);
        ctx.arc(cx + s, cy - s * 0.3, s, 0, Math.PI * 2);
        ctx.arc(cx - s * 0.8, cy - s * 0.2, s * 0.9, 0, Math.PI * 2);
        ctx.arc(cx + s * 0.5, cy + s * 0.1, s * 0.8, 0, Math.PI * 2);
        ctx.fill();
      };
      const cd = t * 8;
      drawCloud(((100 + cd) % (width + 120)) - 60, 45, 20);
      drawCloud(((380 + cd * 0.7) % (width + 120)) - 60, 60, 25);
      drawCloud(((650 + cd * 0.5) % (width + 120)) - 60, 38, 16);

      // Rolling hills background
      const hillY = height * 0.42;
      ctx.fillStyle = isWinter ? '#a7f3d0' : isFall ? '#84cc16' : isDrought ? '#a16207' : '#22c55e';
      ctx.beginPath();
      ctx.moveTo(0, hillY + 15);
      for (let x = 0; x <= width; x += 4) {
        const y = hillY + Math.sin(x * 0.008 + 1) * 18 + Math.sin(x * 0.02) * 6;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();

      // Ground
      const groundY = height * 0.48;
      const groundGrad = ctx.createLinearGradient(0, groundY, 0, height);
      if (isDrought) {
        groundGrad.addColorStop(0, '#d4a853');
        groundGrad.addColorStop(1, '#a16207');
      } else if (isWinter) {
        groundGrad.addColorStop(0, '#e2e8f0');
        groundGrad.addColorStop(1, '#cbd5e1');
      } else if (isFall) {
        groundGrad.addColorStop(0, '#65a30d');
        groundGrad.addColorStop(1, '#3f6212');
      } else {
        groundGrad.addColorStop(0, '#4ade80');
        groundGrad.addColorStop(1, '#15803d');
      }
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, groundY, width, height - groundY);

      // Isometric Grid
      const originX = width / 2;
      const originY = groundY + 15;
      const tileW = Math.min(72, width / 11);
      const tileH = tileW / 2;

      const toIso = (gx: number, gy: number) => ({
        x: originX + (gx - gy) * (tileW / 2),
        y: originY + (gx + gy) * (tileH / 2),
      });

      const drawIsoTile = (gx: number, gy: number, fill: string, stroke = '#16a34a') => {
        const { x, y } = toIso(gx, gy);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + tileW / 2, y + tileH / 2);
        ctx.lineTo(x, y + tileH);
        ctx.lineTo(x - tileW / 2, y + tileH / 2);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      };

      const grassA = isWinter ? '#e2e8f0' : isFall ? '#a3e635' : isDrought ? '#d4a853' : '#4ade80';
      const grassB = isWinter ? '#cbd5e1' : isFall ? '#84cc16' : isDrought ? '#c49a42' : '#22c55e';
      const grassStroke = isWinter ? '#94a3b8' : isDrought ? '#92400e' : '#15803d';

      for (let gx = -4; gx <= 4; gx++) {
        for (let gy = -3; gy <= 3; gy++) {
          drawIsoTile(gx, gy, (gx + gy) % 2 === 0 ? grassA : grassB, grassStroke);
        }
      }

      // Crop Fields
      for (let gx = -3; gx <= -1; gx++) {
        for (let gy = -2; gy <= 0; gy++) {
          const { x, y } = toIso(gx, gy);
          const cropColor = isDrought ? '#c49a42' : isWinter ? '#d1d5db' : isFall ? '#eab308' : '#a3e635';
          drawIsoTile(gx, gy, cropColor, isDrought ? '#8b6914' : '#65a30d');

          const stalkColor = isDrought ? '#92400e' : isWinter ? '#6b7280' : isFall ? '#a16207' : '#15803d';
          ctx.strokeStyle = stalkColor;
          ctx.lineWidth = 2;
          for (let row = -2; row <= 2; row++) {
            const cx = x + row * 8;
            const cy = y + tileH / 2 + row * 4;
            const sway = Math.sin(t * 2.5 + gx + gy + row) * 2;
            const sh = isDrought ? 5 : isWinter ? 3 : 12;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + sway, cy - sh);
            ctx.stroke();
            ctx.fillStyle = isDrought ? '#d97706' : isFall ? '#f59e0b' : isWinter ? '#9ca3af' : '#22c55e';
            ctx.beginPath();
            ctx.arc(cx + sway, cy - sh, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Water Reservoir
      const waterLevel = Math.max(0.15, cityState.water / 100);
      for (let gx = 1; gx <= 3; gx++) {
        for (let gy = -2; gy <= -1; gy++) {
          const { x, y } = toIso(gx, gy);
          drawIsoTile(gx, gy, '#7dd3fc', '#0369a1');
          ctx.beginPath();
          ctx.ellipse(x, y + tileH / 2, (tileW / 3) * waterLevel, (tileH / 3) * waterLevel, 0, 0, Math.PI * 2);
          ctx.fillStyle = '#38bdf8';
          ctx.fill();
          const ripple = ((t * 12) % 18);
          ctx.beginPath();
          ctx.ellipse(x, y + tileH / 2, ripple, ripple * 0.4, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(14,165,233,${Math.max(0, 1 - ripple / 18)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Barn + Silo
      {
        const { x: bx, y: by } = toIso(0, 0);
        ctx.fillStyle = '#dc2626';
        ctx.strokeStyle = '#7f1d1d';
        ctx.lineWidth = 2;
        ctx.fillRect(bx - 16, by - 26, 32, 28);
        ctx.strokeRect(bx - 16, by - 26, 32, 28);
        ctx.beginPath();
        ctx.moveTo(bx - 20, by - 26);
        ctx.lineTo(bx, by - 42);
        ctx.lineTo(bx + 20, by - 26);
        ctx.closePath();
        ctx.fillStyle = isWinter ? '#94a3b8' : '#92400e';
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#78350f';
        ctx.fillRect(bx - 5, by - 10, 10, 12);
        const sx = bx + 28;
        ctx.fillStyle = '#d1d5db';
        ctx.strokeStyle = '#6b7280';
        ctx.lineWidth = 1.5;
        ctx.fillRect(sx - 5, by - 28, 10, 30);
        ctx.strokeRect(sx - 5, by - 28, 10, 30);
        ctx.beginPath();
        ctx.arc(sx, by - 28, 5, Math.PI, 0);
        ctx.fillStyle = '#9ca3af';
        ctx.fill();
        ctx.stroke();
      }

      // Greenhouses
      for (let gx = -3; gx <= -2; gx++) {
        for (let gy = 1; gy <= 2; gy++) {
          const { x, y } = toIso(gx, gy);
          drawIsoTile(gx, gy, '#bbf7d0', '#15803d');
          const ghW = 20, ghH = 14;
          ctx.save();
          ctx.translate(x, y + 4);
          ctx.fillStyle = 'rgba(219,234,254,0.7)';
          ctx.strokeStyle = '#6b7280';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-ghW / 2, 0);
          ctx.lineTo(0, -ghH);
          ctx.lineTo(ghW / 2, 0);
          ctx.lineTo(0, ghH / 3);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      }

      // Orchards
      const isInfested = cityState.districts.find(d => d.id === 'district_west')?.status === 'pest_infested';
      for (let gx = 1; gx <= 3; gx++) {
        for (let gy = 1; gy <= 2; gy++) {
          const { x, y } = toIso(gx, gy);
          drawIsoTile(gx, gy, isInfested ? '#fef08a' : isFall ? '#fbbf24' : '#86efac', isInfested ? '#a16207' : '#15803d');
          ctx.save();
          ctx.translate(x, y);
          ctx.fillStyle = '#78350f';
          ctx.fillRect(-2, -8, 4, 10);
          ctx.beginPath();
          ctx.arc(0, -14, 9, 0, Math.PI * 2);
          ctx.fillStyle = isInfested ? '#eab308' : isFall ? '#ea580c' : isWinter ? '#9ca3af' : '#22c55e';
          ctx.fill();
          ctx.strokeStyle = '#15803d';
          ctx.lineWidth = 1.2;
          ctx.stroke();
          if (!isWinter) {
            ctx.fillStyle = isInfested ? '#92400e' : '#ef4444';
            for (const [fx, fy] of [[-3, -16], [3, -12], [0, -18]]) {
              ctx.beginPath();
              ctx.arc(fx, fy, 2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          ctx.restore();
        }
      }

      // Windmill
      {
        const { x: wx, y: wy } = toIso(0, -2);
        ctx.fillStyle = '#fef3c7';
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(wx - 7, wy + 2);
        ctx.lineTo(wx - 4, wy - 32);
        ctx.lineTo(wx + 4, wy - 32);
        ctx.lineTo(wx + 7, wy + 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(wx - 6, wy - 32);
        ctx.lineTo(wx, wy - 40);
        ctx.lineTo(wx + 6, wy - 32);
        ctx.closePath();
        ctx.fillStyle = '#dc2626';
        ctx.fill();
        ctx.stroke();
        ctx.save();
        ctx.translate(wx, wy - 32);
        ctx.rotate(t * 1.5);
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 2;
        for (let b = 0; b < 4; b++) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, -16);
          ctx.lineTo(2.5, -14);
          ctx.lineTo(0, 0);
          ctx.fillStyle = '#fef9c3';
          ctx.fill();
          ctx.stroke();
          ctx.rotate(Math.PI / 2);
        }
        ctx.restore();
      }

      // Fences
      {
        const f1 = toIso(-4, 0);
        const f2 = toIso(-1, 0);
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 1.5;
        const posts = 6;
        for (let i = 0; i <= posts; i++) {
          const px = f1.x + (f2.x - f1.x) * (i / posts);
          const py = f1.y + tileH / 2 + (f2.y - f1.y) * (i / posts);
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px, py - 7);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(f1.x, f1.y + tileH / 2 - 3);
        ctx.lineTo(f2.x, f2.y + tileH / 2 - 3);
        ctx.moveTo(f1.x, f1.y + tileH / 2 - 6);
        ctx.lineTo(f2.x, f2.y + tileH / 2 - 6);
        ctx.stroke();
      }

      // Weather Particles
      if (isWinter) {
        for (const p of particlesRef.current) {
          p.y += 0.8;
          p.x += Math.sin(t + p.x) * 0.3;
          if (p.y > height) { p.y = 0; p.x = Math.random() * width; }
          ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (isRain) {
        for (const p of particlesRef.current) {
          p.y += p.vy * 3;
          p.x += 0.8;
          if (p.y > height) { p.y = 0; p.x = Math.random() * width; }
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + 1.5, p.y + 7);
          ctx.stroke();
        }
      }
      if (isDrought) {
        for (const p of particlesRef.current) {
          p.x += p.vx;
          p.y -= 0.4;
          if (p.y < groundY) { p.y = height; p.x = Math.random() * width; }
          ctx.fillStyle = `rgba(217,119,6,${p.alpha * 0.4})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Construction Site
      if (activeConstruction) {
        let siteGx = 0, siteGy = 1;
        if (activeConstruction.location.includes('North')) { siteGx = -2; siteGy = -1; }
        else if (activeConstruction.location.includes('East')) { siteGx = 2; siteGy = -1; }
        else if (activeConstruction.location.includes('South')) { siteGx = -2; siteGy = 2; }
        else if (activeConstruction.location.includes('West')) { siteGx = 2; siteGy = 2; }

        const { x: cx, y: cy } = toIso(siteGx, siteGy);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 2;
        ctx.strokeRect(-16, -25, 32, 28);
        ctx.beginPath();
        ctx.moveTo(-16, -25); ctx.lineTo(16, 3);
        ctx.moveTo(16, -25); ctx.lineTo(-16, 3);
        ctx.stroke();
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, 3); ctx.lineTo(0, -38);
        ctx.stroke();
        const arm = Math.sin(t * 1.5) * 0.3;
        ctx.save();
        ctx.translate(0, -38);
        ctx.rotate(arm);
        ctx.beginPath();
        ctx.moveTo(-8, 0); ctx.lineTo(22, 0);
        ctx.stroke();
        const hookY = 15 + Math.sin(t * 3) * 4;
        ctx.beginPath();
        ctx.moveTo(16, 0); ctx.lineTo(16, hookY);
        ctx.stroke();
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(12, hookY, 8, 5);
        ctx.restore();
        const prog = activeConstruction.progressPercent || 0;
        const sec = Math.ceil((activeConstruction.remainingMs || 0) / 1000);
        ctx.fillStyle = '#fef08a';
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-35, -52, 70, 14, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#78350f';
        ctx.font = 'bold 9px "Patrick Hand", cursive';
        ctx.textAlign = 'center';
        ctx.fillText(`🔨 ${prog}% · ${sec}s`, 0, -42);
        ctx.restore();
      }

      // Scan overlay
      if (isScanningVision) {
        ctx.save();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        const scanY = ((t * 100) % height);
        ctx.beginPath();
        ctx.moveTo(0, scanY); ctx.lineTo(width, scanY);
        ctx.stroke();
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 11px "Patrick Hand", cursive';
        ctx.fillText(`SCAN: 💧${Math.round(cityState.water)}% 🌱${Math.round(cityState.soilHealth)}%`, 12, 20);
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      window.removeEventListener('resize', resizeCanvas);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [viewMode, cityState, activeConstruction, zoom, pan, isScanningVision]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => setIsDragging(false);

  const seasonEmoji: Record<string, string> = { spring: '🌸', summer: '☀️', fall: '🍂', winter: '❄️' };
  const weatherEmoji: Record<string, string> = { clear: '🌤', rain: '🌧', drought: '🔥', storm: '⛈' };

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden border-[2.5px] border-pencil shadow-sketch wobbly-md bg-paper select-none"
      style={{ height: '480px' }}
    >
      {/* Top HUD Bar */}
      <div className="absolute top-2 left-2 right-2 z-30 flex items-center justify-between pointer-events-none">
        {/* Mode Tabs + Season Badge */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center bg-white/90 backdrop-blur-sm p-0.5 border-2 border-pencil wobbly shadow-sketch-xs text-[11px] font-body font-bold">
            <button
              onClick={() => setViewMode('happy_oyster_direct')}
              className={`px-2.5 py-1 rounded transition-all flex items-center gap-1 ${
                viewMode === 'happy_oyster_direct' ? 'bg-postit-purple text-pencil border border-pencil shadow-sketch-xs rotate-1' : 'text-pencil-light hover:text-pencil'
              }`}
            >
              <Video className="w-3 h-3 text-purple-700" />
              Happy Oyster (Directing)
            </button>
            <button
              onClick={() => setViewMode('happy_oyster_adventure')}
              className={`px-2.5 py-1 rounded transition-all flex items-center gap-1 ${
                viewMode === 'happy_oyster_adventure' ? 'bg-emerald-200 text-pencil border border-pencil shadow-sketch-xs -rotate-1' : 'text-pencil-light hover:text-pencil'
              }`}
            >
              <Compass className="w-3 h-3 text-emerald-700" />
              Adventure 3D
            </button>
            <button
              onClick={() => setViewMode('canvas')}
              className={`px-2.5 py-1 rounded transition-all flex items-center gap-1 ${
                viewMode === 'canvas' ? 'bg-postit-yellow text-pencil border border-pencil shadow-sketch-xs -rotate-1' : 'text-pencil-light hover:text-pencil'
              }`}
            >
              <Layers className="w-3 h-3" />
              City Map (Canvas)
            </button>
          </div>
          {/* Season / Weather badge */}
          <div className="bg-white/80 backdrop-blur-sm px-2 py-0.5 border border-pencil rounded text-[10px] font-body font-bold text-pencil">
            {seasonEmoji[cityState.season] || '☀️'} {cityState.season} · {weatherEmoji[cityState.weather] || '🌤'} {cityState.weather}
          </div>
        </div>

        {/* Camera and Scan Controls */}
        <div className="flex items-center gap-1 pointer-events-auto bg-white/90 backdrop-blur-sm p-0.5 border-2 border-pencil wobbly shadow-sketch-xs text-pencil">
          {viewMode === 'canvas' && (
            <>
              <button onClick={() => setZoom(z => Math.min(2, z + 0.15))} className="p-1 hover:bg-postit-yellow rounded">
                <ZoomIn className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
              <button onClick={() => setZoom(z => Math.max(0.5, z - 0.15))} className="p-1 hover:bg-postit-yellow rounded">
                <ZoomOut className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
              <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="p-1 hover:bg-postit-yellow rounded">
                <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
              <div className="w-px h-3.5 bg-pencil/30 mx-0.5" />
            </>
          )}
          <button
            onClick={captureFrame}
            className="flex items-center gap-1 px-2 py-1 bg-postit-yellow hover:bg-postit border border-pencil text-pencil rounded text-[10px] font-body font-bold active:translate-x-[1px] active:translate-y-[1px]"
          >
            <Camera className="w-3.5 h-3.5" strokeWidth={2.5} />
            Scan
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div
        className="relative w-full h-full select-none overflow-hidden"
        onMouseDown={viewMode === 'canvas' ? handleMouseDown : undefined}
        onMouseMove={viewMode === 'canvas' ? handleMouseMove : undefined}
        onMouseUp={viewMode === 'canvas' ? handleMouseUp : undefined}
        onMouseLeave={viewMode === 'canvas' ? handleMouseUp : undefined}
      >
        {/* Persistent Directing Stream (Never disconnects on tab switch) */}
        {reactorToken && (
          <div className={`w-full h-full ${viewMode === 'happy_oyster_direct' ? 'block' : 'hidden'}`}>
            <HappyOysterProvider key="happy_oyster_direct" mode="directing" jwt={reactorToken} autoConnect>
              <HappyOysterDirectingStudio prompt={currentPrompt} />
            </HappyOysterProvider>
          </div>
        )}

        {/* Persistent Adventure Stream (Never disconnects on tab switch) */}
        {reactorToken && (
          <div className={`w-full h-full ${viewMode === 'happy_oyster_adventure' ? 'block' : 'hidden'}`}>
            <HappyOysterProvider key="happy_oyster_adventure" mode="adventure" jwt={reactorToken} autoConnect>
              <HappyOysterAdventureStudio prompt={currentPrompt} />
            </HappyOysterProvider>
          </div>
        )}

        {/* Persistent Canvas Map */}
        <canvas
          ref={canvasRef}
          className={`w-full h-full ${viewMode === 'canvas' ? 'block cursor-grab active:cursor-grabbing' : 'hidden'}`}
        />

        {flashEffect && (
          <div className="absolute inset-0 bg-white/50 pointer-events-none transition-opacity duration-300 z-40" />
        )}
      </div>

      {/* Bottom Prompt Ticker */}
      {latestPrompt && (
        <div className="absolute bottom-1.5 left-2 right-2 z-30 pointer-events-none">
          <div className="p-1.5 bg-postit-yellow/90 backdrop-blur-sm border border-pencil shadow-sketch-xs rounded text-[10px] text-pencil flex items-center gap-2 pointer-events-auto">
            <Sparkles className="w-3 h-3 text-amber-600 shrink-0" strokeWidth={2.5} />
            <span className="font-bold font-heading uppercase text-[10px] shrink-0">{latestPrompt.type}</span>
            <p className="font-body truncate italic flex-1">"{latestPrompt.prompt}"</p>
            <span className="text-[9px] text-pencil-light shrink-0">{new Date(latestPrompt.timestamp).toLocaleTimeString()}</span>
          </div>
        </div>
      )}
    </div>
  );
};
