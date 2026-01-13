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
    <div className="bg-[var(--color-surface-light)] p-4 rounded-lg space-y-4 border border-dashed border-[var(--color-border)]">
      <h3 className="text-2xl font-bold text-[var(--color-primary)] flex items-center gap-2">
        <span className="text-3xl">✨</span>
        AI Assistant
      </h3>
      
      <div>
        <label htmlFor="ai-prompt" className="block text-lg font-medium text-[var(--color-text-muted)] mb-2">Describe your ideal match:</label>
        <textarea
          id="ai-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., A high-stakes competitive game..."
          rows={2}
          className="w-full bg-gray-900 border border-[var(--color-border)] rounded-md p-3 text-[var(--color-text-base)] text-lg focus:ring-2 focus:ring-[var(--color-primary)] transition"
          disabled={isSuggesting}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={isSuggesting}
        className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold py-3 px-6 text-lg uppercase rounded-md transition-all transform hover:scale-105 active:scale-95 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSuggesting ? (
          <>
            <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
            <span>Thinking...</span>
          </>
        ) : (
          'Get Suggestion'
        )}
      </button>

      {error && (
        <p className="text-center text-red-500 text-lg">{error}</p>
      )}

      {suggestion && (
        <div className="bg-gray-900/50 p-3 rounded-lg border-l-4 border-[var(--color-primary)]">
          <p className="text-lg text-[var(--color-text-muted)] italic">
            <span className="font-bold text-lg not-italic text-[var(--color-primary)]">AI Suggestion: </span>
            {suggestion}
          </p>
        </div>
      )}
    </div>
  );
};

export default AISuggestionBox;