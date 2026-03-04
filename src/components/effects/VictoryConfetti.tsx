import { useEffect, useState } from 'react';
import { Trophy, Sparkles, Heart } from 'lucide-react';

interface ConfettiPiece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
}

interface VictoryConfettiProps {
  trigger?: boolean;
  onComplete?: () => void;
  teamName?: string;
}

export function VictoryConfetti({ trigger = false, onComplete, teamName }: VictoryConfettiProps) {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!trigger) return;

    setIsVisible(true);

    // Generate confetti pieces
    const pieces: ConfettiPiece[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.3,
      duration: 2 + Math.random() * 1,
      size: 4 + Math.random() * 8,
      color: ['#22C55E', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'][Math.floor(Math.random() * 5)],
    }));

    setConfetti(pieces);

    // Hide after animation completes
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 3500);

    return () => clearTimeout(timer);
  }, [trigger, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {/* Confetti pieces */}
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className="absolute animate-fall"
          style={{
            left: `${piece.left}%`,
            top: '-10px',
            animation: `fall ${piece.duration}s linear ${piece.delay}s forwards`,
            '--fall-distance': '100vh',
          } as React.CSSProperties}
        >
          <div
            style={{
              width: `${piece.size}px`,
              height: `${piece.size}px`,
              backgroundColor: piece.color,
              borderRadius: Math.random() > 0.5 ? '50%' : '0',
              opacity: 0.8,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        </div>
      ))}

      {/* Center trophy animation */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
        <div className="animate-bounce-scale">
          <Trophy className="w-24 h-24 text-primary drop-shadow-lg" />
        </div>
      </div>

      {/* Sparkles around trophy */}
      {[...Array(8)].map((_, i) => (
        <div
          key={`sparkle-${i}`}
          className="fixed animate-sparkle"
          style={{
            left: `calc(50% + ${Math.cos((i / 8) * Math.PI * 2) * 100}px)`,
            top: `calc(50% + ${Math.sin((i / 8) * Math.PI * 2) * 100}px)`,
            animation: `sparkle 1.5s ease-in-out ${(i / 8) * 0.2}s infinite`,
          }}
        >
          <Sparkles className="w-6 h-6 text-yellow-400" />
        </div>
      ))}

      {/* Team name celebration text */}
      {teamName && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center animate-scale-up">
            <h2 className="text-4xl font-bold text-primary mb-2 drop-shadow-lg">
              {teamName}
            </h2>
            <p className="text-2xl font-bold text-green-500 drop-shadow-lg flex items-center justify-center gap-2">
              <Heart className="w-6 h-6 animate-pulse" />
              بطل البطولة
              <Heart className="w-6 h-6 animate-pulse" />
            </p>
          </div>
        </div>
      )}

      {/* CSS animations */}
      <style>{`
        @keyframes fall {
          to {
            transform: translateY(var(--fall-distance)) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes bounce-scale {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.2);
          }
        }

        @keyframes sparkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes scale-up {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(1);
          }
        }

        .animate-fall {
          animation: fall 2s linear forwards;
        }

        .animate-bounce-scale {
          animation: bounce-scale 0.6s ease-in-out;
        }

        .animate-sparkle {
          animation: sparkle 1.5s ease-in-out infinite;
        }

        .animate-scale-up {
          animation: scale-up 3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
