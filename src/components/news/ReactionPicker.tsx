import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ThumbsUp } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad';

const REACTIONS: { type: ReactionType; emoji: string; colorClass: string }[] = [
  { type: 'like', emoji: '👍', colorClass: 'text-blue-500' },
  { type: 'love', emoji: '❤️', colorClass: 'text-rose-500' },
  { type: 'haha', emoji: '😂', colorClass: 'text-yellow-500' },
  { type: 'wow', emoji: '😮', colorClass: 'text-amber-500' },
  { type: 'sad', emoji: '😢', colorClass: 'text-sky-500' },
];

interface ReactionPickerProps {
  currentReaction: ReactionType | null;
  onReact: (reaction: ReactionType | null) => void;
  disabled?: boolean;
}

export function ReactionPicker({ currentReaction, onReact, disabled }: ReactionPickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const active = REACTIONS.find(r => r.type === currentReaction);
  const label = active
    ? t(`news.reactions.${active.type}`)
    : t('common.like');

  const handleClick = () => {
    // Toggle: if reacted, remove; if not, default to like
    if (currentReaction) onReact(null);
    else onReact('like');
  };

  const pick = (type: ReactionType) => {
    setOpen(false);
    onReact(currentReaction === type ? null : type);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative flex-1">
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={handleClick}
          onContextMenu={(e) => { e.preventDefault(); setOpen(true); }}
          className={cn(
            'gap-2 w-full transition-colors',
            active ? `${active.colorClass} font-semibold` : ''
          )}
        >
          {active ? <span className="text-base">{active.emoji}</span> : <ThumbsUp className="w-4 h-4" />}
          <span>{label}</span>
        </Button>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Open reactions"
            disabled={disabled}
            onClick={() => setOpen(true)}
            className="absolute inset-0 opacity-0 pointer-events-none"
          />
        </PopoverTrigger>
        {/* Long-press / hover trigger overlay */}
        <button
          type="button"
          disabled={disabled}
          onMouseEnter={() => setOpen(true)}
          onTouchStart={(e) => {
            const timer = setTimeout(() => setOpen(true), 350);
            const cancel = () => clearTimeout(timer);
            e.currentTarget.addEventListener('touchend', cancel, { once: true });
            e.currentTarget.addEventListener('touchmove', cancel, { once: true });
          }}
          className="absolute inset-0 opacity-0"
          aria-label="Hold for reactions"
        />
      </div>
      <PopoverContent
        side="top"
        align="center"
        className="w-auto p-2 rounded-full border shadow-lg bg-popover/95 backdrop-blur"
        onMouseLeave={() => setOpen(false)}
      >
        <div className="flex items-center gap-1">
          {REACTIONS.map((r) => (
            <button
              key={r.type}
              type="button"
              onClick={() => pick(r.type)}
              title={t(`news.reactions.${r.type}`)}
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-2xl transition-transform hover:scale-125 hover:-translate-y-1',
                currentReaction === r.type && 'bg-primary/10 ring-2 ring-primary'
              )}
            >
              {r.emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export const REACTION_EMOJIS: Record<string, string> = {
  like: '👍',
  love: '❤️',
  haha: '😂',
  wow: '😮',
  sad: '😢',
};
