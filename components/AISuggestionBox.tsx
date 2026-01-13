import React, { useState } from 'react';

interface AISuggestionBoxProps {
  onGetSuggestion: (prompt: string) => void;
  isSuggesting: boolean;
  suggestion: string;
  error: string;
}

const AISuggestionBox: React.FC<AISuggestionBoxProps> = ({ onGetSuggestion, isSuggesting, suggestion, error }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = () => {
    onGetSuggestion(prompt);
  };

  return (
    <div className="bg-[var(--color-surface-light)] p-5 rounded-lg space-y-4 border border-[var(--color-border)] shadow-inner">
      <div className="flex items-center gap-3 border-b border-[var(--color-border)] pb-2 mb-2">
        <div className="bg-[var(--color-primary)] p-2 rounded-full">
            <span className="text-2xl leading-none text-white">👔</span>
        </div>
        <div>
            <h3 className="text-xl font-bold text-white uppercase tracking-wide">
                Business Consultant
            </h3>
            <p className="text-sm text-[var(--color-text-muted)]">AI-Powered Strategy & Configuration</p>
        </div>
      </div>
      
      <div>
        <textarea
          id="ai-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask anything... e.g., 'How can I maximize profit?' or 'Set up a high-stakes Duo match on Miramar'"
          rows={2}
          className="w-full bg-gray-900/80 border border-[var(--color-border)] rounded-lg p-3 text-[var(--color-text-base)] text-lg focus:ring-2 focus:ring-[var(--color-primary)] transition resize-none placeholder-gray-600"
          disabled={isSuggesting}
          onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
              }
          }}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={isSuggesting || !prompt.trim()}
        className="w-full bg-gradient-to-r from-[var(--color-primary)] to-blue-600 hover:from-[var(--color-primary-hover)] hover:to-blue-500 text-white font-bold py-3 px-6 text-lg uppercase rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
      >
        {isSuggesting ? (
          <>
            <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
            <span>Analyzing Strategy...</span>
          </>
        ) : (
          <>
            <span>Consult & Configure</span>
            <span>⚡</span>
          </>
        )}
      </button>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 p-3 rounded text-center text-red-200">
            {error}
        </div>
      )}

      {suggestion && (
        <div className="mt-4 animate-fade-in">
             <div className="relative bg-gray-800/80 p-5 rounded-r-xl rounded-bl-xl border-l-4 border-[var(--color-success)] ml-4">
                <div className="absolute -left-3 -top-3 bg-[var(--color-success)] text-black text-xs font-bold px-2 py-1 rounded shadow">ADVICE</div>
                <p className="text-xl text-gray-200 leading-relaxed font-medium">
                    "{suggestion}"
                </p>
             </div>
             <p className="text-right text-xs text-[var(--color-text-muted)] mt-2 italic">
                *Calculator settings have been auto-updated based on this advice.
             </p>
        </div>
      )}
    </div>
  );
};

export default AISuggestionBox;