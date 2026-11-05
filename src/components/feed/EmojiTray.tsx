import React, { useState } from 'react';

interface EmojiTrayProps {
  onReact?: (emoji: string) => void;
}

export const EmojiTray: React.FC<EmojiTrayProps> = ({ onReact }) => {
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const emojis = ['🙏', '🦚', '🌸', '📿', '🌺'];

  const handleTap = (e: React.MouseEvent, emoji: string) => {
    e.stopPropagation();
    setSelectedEmoji(emoji);
    if (onReact) onReact(emoji);
  };

  return (
    <div className="flex items-center justify-around gap-1.5 sm:gap-2.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full glass-panel shadow-[0_4px_16px_rgba(0,0,0,0.08)] max-w-full">
      {emojis.map((emoji) => {
        const isSelected = selectedEmoji === emoji;
        return (
          <button
            key={emoji}
            type="button"
            aria-label={`Devotional reaction ${emoji}`}
            onClick={(e) => handleTap(e, emoji)}
            className={`text-base sm:text-xl p-1 rounded-full transition-colors pressable-sm ${
              isSelected ? 'bg-white shadow-xs animate-reaction-pop' : 'hover:bg-white/40'
            }`}
          >
            {emoji}
          </button>
        );
      })}
    </div>
  );
};
