import React, { useState } from 'react';
import { CitizenSuggestion } from '../types';
import { 
  MessageSquare, 
  Send, 
  ThumbsUp, 
  CheckCircle, 
  Sparkles, 
  UserCheck 
} from 'lucide-react';

interface CitizenSuggestionsProps {
  suggestions: CitizenSuggestion[];
  onSubmitSuggestion: (suggestion: {
    author: string;
    avatar: string;
    text: string;
    category: "food" | "water" | "economy" | "environment" | "general";
  }) => void;
  onUpvoteSuggestion: (id: string) => void;
}

export const CitizenSuggestions: React.FC<CitizenSuggestionsProps> = ({
  suggestions,
  onSubmitSuggestion,
  onUpvoteSuggestion,
}) => {
  const [text, setText] = useState('');
  const [author, setAuthor] = useState('Citizen Resident');
  const [category, setCategory] = useState<"food" | "water" | "economy" | "environment" | "general">('water');
  const [avatar, setAvatar] = useState('👨‍🌾');

  const avatarOptions = ['👨‍🌾', '👩‍💼', '🔬', '🧑‍🔧', '👩‍🌾', '🧔', '👵'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    onSubmitSuggestion({
      author: author.trim() || 'Citizen Resident',
      avatar,
      text: text.trim(),
      category,
    });

    setText('');
  };

  return (
    <div className="relative flex flex-col h-full bg-white border-[2.5px] border-pencil shadow-sketch wobbly-md overflow-hidden">
      {/* Header */}
      <div className="p-3.5 border-b-2 border-dashed border-pencil/40 bg-paper-warm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-postit-purple border-2 border-pencil wobbly-circle flex items-center justify-center text-pencil shadow-sketch-xs -rotate-2">
            <MessageSquare className="w-4 h-4 text-purple-700" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-base font-heading font-bold text-pencil">
              Citizen Town Hall & Voice
            </h2>
            <p className="text-xs text-pencil-light font-body">
              Pinned advice for the autonomous Mayor
            </p>
          </div>
        </div>

        <span className="px-2.5 py-0.5 bg-paper-darker border-2 border-pencil text-pencil text-xs font-body font-bold wobbly-tag shadow-sketch-xs">
          {suggestions.length} Petitions
        </span>
      </div>

      {/* Suggestion Feed */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 font-body">
        {suggestions.length === 0 ? (
          <div className="h-32 flex flex-col items-center justify-center text-pencil-light text-sm">
            <p>No citizen petitions pinned yet. Voice your counsel below!</p>
          </div>
        ) : (
          suggestions.map((sug, idx) => {
            const isAdopted = sug.status === 'adopted' || sug.mayorResponse?.includes('Adopted');
            const isConsidered = sug.status === 'considered';

            return (
              <div
                key={sug.id}
                className={`relative p-3.5 border-2 border-pencil shadow-sketch-xs wobbly-md transition-all hover:rotate-1 ${
                  isAdopted
                    ? 'bg-postit-green rotate-[-0.5deg]'
                    : isConsidered
                    ? 'bg-postit-blue rotate-[0.5deg]'
                    : idx % 2 === 0 ? 'bg-postit-yellow rotate-[-1deg]' : 'bg-paper-warm rotate-[1deg]'
                }`}
              >
                {/* Author row */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{sug.avatar}</span>
                    <div>
                      <span className="text-sm font-heading font-bold text-pencil">
                        {sug.author}
                      </span>
                      <span className="ml-2 px-1.5 py-0.2 bg-white border border-pencil text-pencil text-[10px] font-body font-bold uppercase wobbly-tag">
                        {sug.category}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  {isAdopted ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-white border border-pencil text-emerald-800 text-xs font-body font-bold wobbly-tag shadow-sketch-xs">
                      <CheckCircle className="w-3.5 h-3.5" strokeWidth={2.5} />
                      <span>ADOPTED</span>
                    </span>
                  ) : isConsidered ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-white border border-pencil text-pen text-xs font-body font-bold wobbly-tag shadow-sketch-xs">
                      <UserCheck className="w-3.5 h-3.5" strokeWidth={2.5} />
                      <span>REVIEWED</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-white border border-pencil text-pencil text-xs font-body font-bold wobbly-tag shadow-sketch-xs">
                      QUEUED
                    </span>
                  )}
                </div>

                {/* Text */}
                <p className="text-sm text-pencil leading-relaxed pl-7 mb-2 font-body">
                  "{sug.text}"
                </p>

                {/* Mayor Response if any */}
                {sug.mayorResponse && (
                  <div className="ml-7 p-2 bg-white border border-pencil wobbly text-xs text-pen flex items-start gap-1.5 mb-2 shadow-sketch-xs">
                    <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" strokeWidth={2.5} />
                    <span>
                      <strong className="font-heading font-bold text-pencil">Mayor:</strong> {sug.mayorResponse}
                    </span>
                  </div>
                )}

                {/* Upvote Footer */}
                <div className="flex items-center justify-between pl-7 text-xs text-pencil-light font-body">
                  <span>{new Date(sug.createdAt).toLocaleTimeString()}</span>
                  <button
                    onClick={() => onUpvoteSuggestion(sug.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-postit-yellow text-pencil border border-pencil rounded-lg shadow-sketch-xs transition-all active:translate-x-[1px] active:translate-y-[1px]"
                  >
                    <ThumbsUp className="w-3.5 h-3.5 text-pencil" strokeWidth={2.5} />
                    <span className="font-heading font-bold">{sug.votes}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="p-3.5 border-t-2 border-dashed border-pencil/40 bg-paper-warm space-y-2">
        <div className="flex items-center gap-2">
          {/* Avatar selector */}
          <div className="flex gap-1">
            {avatarOptions.slice(0, 4).map((av) => (
              <button
                key={av}
                type="button"
                onClick={() => setAvatar(av)}
                className={`w-7 h-7 text-sm flex items-center justify-center transition-all border border-pencil wobbly ${
                  avatar === av ? 'bg-postit-yellow scale-110 shadow-sketch-xs' : 'bg-white hover:bg-paper-darker'
                }`}
              >
                {av}
              </button>
            ))}
          </div>

          {/* Name input */}
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Citizen Name"
            className="flex-1 px-3 py-1 bg-white border-2 border-pencil rounded-lg text-sm text-pencil font-body placeholder-pencil-light focus:outline-none focus:border-pen"
          />

          {/* Category */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="px-2 py-1 bg-white border-2 border-pencil rounded-lg text-sm text-pencil font-body focus:outline-none focus:border-pen"
          >
            <option value="water">Water</option>
            <option value="food">Food</option>
            <option value="economy">Economy</option>
            <option value="environment">Ecology</option>
          </select>
        </div>

        {/* Suggestion Text & Send */}
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Voice advice to Mayor (e.g. prioritize drip irrigation)..."
            className="flex-1 px-3 py-1.5 bg-white border-2 border-pencil rounded-xl text-sm text-pencil font-body placeholder-pencil-light focus:outline-none focus:border-pen"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="sketch-btn px-4 py-1.5 text-sm font-bold flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" strokeWidth={2.5} />
            <span>Pin</span>
          </button>
        </div>
      </form>
    </div>
  );
};
