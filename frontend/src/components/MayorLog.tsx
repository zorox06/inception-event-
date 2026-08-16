import React, { useState } from 'react';
import { MayorLogEntry } from '../types';
import { 
  Bot, 
  Brain, 
  CheckCircle2, 
  Eye, 
  Hammer, 
  PauseCircle, 
  Sparkles, 
  TrendingUp, 
  AlertOctagon,
  MessageSquare
} from 'lucide-react';

interface MayorLogProps {
  logs: MayorLogEntry[];
  isThinking?: boolean;
}

export const MayorLog: React.FC<MayorLogProps> = ({ logs, isThinking = false }) => {
  const [filter, setFilter] = useState<'all' | 'decision' | 'hold' | 'vision' | 'event'>('all');

  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true;
    if (filter === 'decision') return log.type === 'decision' || log.type === 'construction_started' || log.type === 'construction_completed';
    if (filter === 'hold') return log.type === 'hold';
    if (filter === 'vision') return log.type === 'vision_inspection';
    if (filter === 'event') return log.type === 'event';
    return true;
  });

  const getLogIcon = (type: MayorLogEntry['type']) => {
    switch (type) {
      case 'construction_started':
      case 'decision':
        return <Hammer className="w-4 h-4 text-pencil" strokeWidth={2.5} />;
      case 'construction_completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-700" strokeWidth={2.5} />;
      case 'hold':
        return <PauseCircle className="w-4 h-4 text-amber-700" strokeWidth={2.5} />;
      case 'vision_inspection':
        return <Eye className="w-4 h-4 text-pen" strokeWidth={2.5} />;
      case 'event':
        return <AlertOctagon className="w-4 h-4 text-accent" strokeWidth={2.5} />;
      case 'citizen_reply':
        return <MessageSquare className="w-4 h-4 text-purple-700" strokeWidth={2.5} />;
      default:
        return <Bot className="w-4 h-4 text-pencil" strokeWidth={2.5} />;
    }
  };

  const getBadgeColor = (type: MayorLogEntry['type']) => {
    switch (type) {
      case 'construction_started':
      case 'decision':
      case 'construction_completed':
        return 'bg-postit-green text-pencil border-pencil';
      case 'hold':
        return 'bg-postit-yellow text-pencil border-pencil';
      case 'vision_inspection':
        return 'bg-postit-blue text-pen border-pencil';
      case 'event':
        return 'bg-postit-rose text-accent border-pencil';
      default:
        return 'bg-paper-darker text-pencil border-pencil';
    }
  };

  return (
    <div className="relative flex flex-col h-full bg-white border-[2.5px] border-pencil shadow-sketch wobbly-md overflow-hidden">
      {/* Top Header */}
      <div className="p-3.5 border-b-2 border-dashed border-pencil/40 flex items-center justify-between bg-paper-warm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-postit-yellow border-2 border-pencil wobbly-circle flex items-center justify-center text-pencil shadow-sketch-xs -rotate-2">
            <Brain className="w-5 h-5 text-accent" strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-heading font-bold text-pencil">
                Mayor's Journal & Log
              </h2>
              {isThinking && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-accent text-white text-xs font-body font-bold wobbly-tag animate-jiggle">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Thinking...</span>
                </span>
              )}
            </div>
            <p className="text-xs text-pencil-light font-body">
              Autonomous thoughts, trade-offs & tool traces
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-white p-1 border-2 border-pencil wobbly shadow-sketch-xs text-xs font-body font-bold">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-0.5 rounded transition-all ${filter === 'all' ? 'bg-postit-yellow text-pencil border border-pencil shadow-sketch-xs' : 'text-pencil-light hover:text-pencil'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('decision')}
            className={`px-2.5 py-0.5 rounded transition-all ${filter === 'decision' ? 'bg-postit-green text-pencil border border-pencil shadow-sketch-xs' : 'text-pencil-light hover:text-pencil'}`}
          >
            Decisions
          </button>
          <button
            onClick={() => setFilter('hold')}
            className={`px-2.5 py-0.5 rounded transition-all ${filter === 'hold' ? 'bg-postit-yellow text-pencil border border-pencil shadow-sketch-xs' : 'text-pencil-light hover:text-pencil'}`}
          >
            Holds
          </button>
          <button
            onClick={() => setFilter('vision')}
            className={`px-2.5 py-0.5 rounded transition-all ${filter === 'vision' ? 'bg-postit-blue text-pencil border border-pencil shadow-sketch-xs' : 'text-pencil-light hover:text-pencil'}`}
          >
            Vision
          </button>
        </div>
      </div>

      {/* Log Feed List */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 font-body">
        {filteredLogs.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-pencil-light text-sm">
            <Brain className="w-8 h-8 mb-2 opacity-40 text-pencil" strokeWidth={2.5} />
            <p>No journal entries in this category yet.</p>
          </div>
        ) : (
          filteredLogs.map((log, idx) => (
            <div
              key={log.id}
              className={`p-3.5 bg-paper-warm border-2 border-pencil shadow-sketch-xs wobbly-md transition-all hover:rotate-1 ${
                idx % 2 === 0 ? 'rotate-[-0.5deg]' : 'rotate-[0.5deg]'
              }`}
            >
              {/* Header: Title + Type Badge + Time */}
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-white border border-pencil wobbly-circle shadow-sketch-xs">
                    {getLogIcon(log.type)}
                  </div>
                  <h3 className="text-sm font-heading font-bold text-pencil">
                    {log.title}
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`px-2 py-0.5 text-xs font-body font-bold border wobbly-tag ${getBadgeColor(log.type)}`}>
                    {log.type.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-xs text-pencil-light font-mono font-bold">
                    T+{log.tick}
                  </span>
                </div>
              </div>

              {/* Main Content / Reason */}
              <p className="text-sm text-pencil leading-relaxed pl-7 font-body">
                {log.content}
              </p>

              {/* Trade-off Analysis Note */}
              {log.tradeoff && (
                <div className="mt-2.5 ml-7 p-2.5 bg-postit-yellow border-2 border-pencil wobbly text-xs text-pencil shadow-sketch-xs rotate-[-0.5deg]">
                  <div className="flex items-center gap-1 font-heading font-bold text-pen mb-0.5">
                    <TrendingUp className="w-3.5 h-3.5" strokeWidth={2.5} />
                    <span>Trade-Off Reasoning:</span>
                  </div>
                  <p className="text-pencil italic font-body text-xs">"{log.tradeoff}"</p>
                </div>
              )}

              {/* Vision Thumbnail if attached */}
              {log.visionThumbnail && (
                <div className="mt-2.5 ml-7 flex items-center gap-3 p-2 bg-white border-2 border-pencil wobbly-md shadow-sketch-xs">
                  <img
                    src={log.visionThumbnail}
                    alt="Frame snapshot"
                    className="w-16 h-10 object-cover rounded border border-pencil shrink-0"
                  />
                  <div className="text-xs text-pencil">
                    <span className="font-heading font-bold text-pen block">AERIAL SENSOR SNAPSHOT</span>
                    <span className="line-clamp-1">{log.visionSummary}</span>
                  </div>
                </div>
              )}

              {/* Footer: Model Telemetry */}
              <div className="mt-2 pl-7 flex items-center justify-between text-xs text-pencil-light font-body">
                <span>Model: {log.modelUsed || 'Autonomous Core'}</span>
                <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
