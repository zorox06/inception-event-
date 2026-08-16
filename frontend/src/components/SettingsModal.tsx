import React, { useState } from 'react';
import { X, Key, Cpu, Sparkles, CheckCircle2, Video, Info } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasApiKey: boolean;
  hasReactorKey?: boolean;
  onSaveSettings: (settings: { apiKey?: string; model?: string; reactorKey?: string }) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  hasApiKey,
  hasReactorKey = false,
  onSaveSettings,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [reactorKeyInput, setReactorKeyInput] = useState('');
  const [model, setModel] = useState('gemma-4-31B');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      apiKey: apiKeyInput.trim() ? apiKeyInput.trim() : undefined,
      reactorKey: reactorKeyInput.trim() ? reactorKeyInput.trim() : undefined,
      model,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-pencil/60 backdrop-blur-xs animate-in fade-in duration-150 font-body">
      <div className="relative w-full max-w-lg bg-white border-[3px] border-pencil shadow-sketch-lg p-6 wobbly-lg space-y-5">
        {/* Top Thumbtack */}
        <div className="thumbtack-pin" />

        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-dashed border-pencil/40 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-postit-yellow border-2 border-pencil wobbly-circle flex items-center justify-center text-pencil shadow-sketch-xs -rotate-2">
              <Cpu className="w-5 h-5 text-accent" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-heading font-bold text-pencil">
                Engine & Model Config
              </h2>
              <p className="text-xs text-pencil-light font-body">
                AI Agent Model & Reactor WebRTC Stream
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-paper-darker hover:bg-postit-rose border border-pencil wobbly transition-colors"
          >
            <X className="w-5 h-5 text-pencil" strokeWidth={2.5} />
          </button>
        </div>

        {/* Current Engine Status Badges */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-postit-yellow border-2 border-pencil wobbly shadow-sketch-xs rotate-[-1deg]">
            <div className="flex items-center gap-1.5 font-heading font-bold text-pencil text-sm mb-1">
              <Sparkles className="w-4 h-4 text-pen" strokeWidth={2.5} />
              <span>AI Agent Model</span>
            </div>
            <span className="px-2 py-0.5 bg-white border border-pencil text-pencil text-xs font-bold wobbly-tag">
              {hasApiKey ? 'LIVE API READY' : 'AUTONOMOUS CORE'}
            </span>
          </div>

          <div className="p-3 bg-postit-blue border-2 border-pencil wobbly shadow-sketch-xs rotate-1">
            <div className="flex items-center gap-1.5 font-heading font-bold text-pencil text-sm mb-1">
              <Video className="w-4 h-4 text-purple-700" strokeWidth={2.5} />
              <span>Reactor Helios</span>
            </div>
            <span className="px-2 py-0.5 bg-white border border-pencil text-pencil text-xs font-bold wobbly-tag">
              {hasReactorKey ? 'JWT CONNECTED' : 'CANVAS MODE'}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4 text-sm">
          {/* AI API Key */}
          <div className="space-y-1">
            <label className="font-heading font-bold text-pencil flex items-center gap-1.5 text-sm">
              <Key className="w-4 h-4 text-accent" strokeWidth={2.5} />
              <span>Google AI API Key</span>
            </label>
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder={hasApiKey ? "•••••••••••••••••••••••• (Configured)" : "AQ.Ab8... or AIzaSy..."}
              className="w-full px-3 py-2 bg-paper border-2 border-pencil rounded-xl text-pencil placeholder-pencil-light focus:outline-none focus:border-pen font-mono text-xs"
            />
          </div>

          {/* Reactor Token / Key */}
          <div className="space-y-1">
            <label className="font-heading font-bold text-pencil flex items-center gap-1.5 text-sm">
              <Video className="w-4 h-4 text-pen" strokeWidth={2.5} />
              <span>Reactor API Key / JWT Token</span>
            </label>
            <input
              type="password"
              value={reactorKeyInput}
              onChange={(e) => setReactorKeyInput(e.target.value)}
              placeholder={hasReactorKey ? "•••••••••••••••••••••••• (Configured)" : "rk_..."}
              className="w-full px-3 py-2 bg-paper border-2 border-pencil rounded-xl text-pencil placeholder-pencil-light focus:outline-none focus:border-pen font-mono text-xs"
            />
          </div>

          {/* Model Selection */}
          <div className="space-y-1">
            <label className="font-heading font-bold text-pencil flex items-center gap-1.5 text-sm">
              <Sparkles className="w-4 h-4 text-amber-600" strokeWidth={2.5} />
              <span>Active Model</span>
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 bg-paper border-2 border-pencil rounded-xl text-pencil focus:outline-none focus:border-pen font-body font-bold text-sm"
            >
              <option value="gemma-4-31b-it">gemma-4-31b-it (Gemma 4 31B — Active)</option>
              <option value="gemini-2.5-flash">gemini-2.5-flash (Fast & Multimodal)</option>
              <option value="gemini-2.5-pro">gemini-2.5-pro (Deep Strategic Reasoning)</option>
              <option value="gemini-3.7-flash">gemini-3.7-flash (Latest Flash)</option>
            </select>
          </div>

          {/* Ownership Split Reminder */}
          <div className="p-3 bg-postit-yellow border-2 border-pencil wobbly text-xs text-pencil leading-relaxed rotate-[-0.5deg]">
            <strong className="font-heading font-bold text-pencil">Architecture Split (§2):</strong> Sim Engine is the sole source of truth (numbers & Clash-of-Clans build queue). Gemma/Gemini directs mayoral strategy & vision inspection. Reactor renders the living visual world.
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t-2 border-dashed border-pencil/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border-2 border-pencil bg-paper-darker hover:bg-muted text-pencil font-bold wobbly transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="sketch-btn-accent px-5 py-2 text-sm font-bold flex items-center gap-1.5"
            >
              {savedSuccess ? <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} /> : null}
              <span>{savedSuccess ? 'Saved!' : 'Save Config'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
