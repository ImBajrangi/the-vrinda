import React from 'react';
import { X, Flame, Music2, BookOpen, Plus, Minus, ChevronRight, Wind, Play, Pause } from 'lucide-react';
import type { SadhanaState, SacredPad } from '../../types/devotional';

export type PillarType = 'japa' | 'shravan' | 'svadhyaya';

interface SadhanaPillarModalProps {
  isOpen: boolean;
  pillarType: PillarType | null;
  onClose: () => void;
  sadhana: SadhanaState;
  onUpdateSadhana: (updated: SadhanaState) => void;
  onOpenFocusModal: () => void;
  onOpenPlayer: () => void;
  onOpenPadavaliReader: () => void;
  currentPad?: SacredPad | { titleDevanagari?: string; rag?: string; duration?: string } | null;
  isPlayingAudio?: boolean;
  onToggleAudio?: () => void;
}

export const SadhanaPillarModal: React.FC<SadhanaPillarModalProps> = ({
  isOpen,
  pillarType,
  onClose,
  sadhana,
  onUpdateSadhana,
  onOpenFocusModal,
  onOpenPlayer,
  onOpenPadavaliReader,
  currentPad,
  isPlayingAudio = false,
  onToggleAudio,
}) => {
  if (!isOpen || !pillarType) return null;

  const handleAddJapa = (malas: number) => {
    const newTotal = Math.max(0, sadhana.japaCompleted + malas);
    onUpdateSadhana({
      ...sadhana,
      japaCompleted: newTotal,
    });
  };

  const handleSetJapaTarget = (target: number) => {
    onUpdateSadhana({
      ...sadhana,
      japaTarget: target,
    });
  };

  const handleAddShravan = (minutes: number) => {
    const newTotal = Math.max(0, sadhana.shravanMinutes + minutes);
    onUpdateSadhana({
      ...sadhana,
      shravanMinutes: newTotal,
    });
  };

  const handleSetShravanTarget = (target: number) => {
    onUpdateSadhana({
      ...sadhana,
      shravanTarget: target,
    });
  };

  const handleAddSvadhyaya = (padas: number) => {
    const newTotal = Math.max(0, sadhana.svadhyayaPadas + padas);
    onUpdateSadhana({
      ...sadhana,
      svadhyayaPadas: newTotal,
    });
  };

  const handleSetSvadhyayaTarget = (target: number) => {
    onUpdateSadhana({
      ...sadhana,
      svadhyayaTarget: target,
    });
  };

  const renderContent = () => {
    switch (pillarType) {
      case 'japa': {
        const percent = Math.min(100, Math.round((sadhana.japaCompleted / Math.max(1, sadhana.japaTarget)) * 100));
        const totalMantras = sadhana.japaCompleted * 108;
        return (
          <div className="space-y-5">
            {/* Header Identity */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
                <Flame className="w-6 h-6 text-amber-600 fill-amber-600" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full font-mono">
                    Pillar 1 • Holy Chanting
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-800">{percent}% Complete</span>
                </div>
                <h3 className="font-serif font-bold text-lg text-[#18181B] mt-0.5">
                  Naam Japa Meditation (नाम जप)
                </h3>
              </div>
            </div>

            {/* Metric Status Card */}
            <div className="bg-[#FAFAFA] rounded-2xl p-4">
              <div className="flex items-baseline justify-between mb-2">
                <div>
                  <span className="font-doto font-light text-3xl sm:text-4xl text-[#18181B]">
                    {sadhana.japaCompleted}
                  </span>
                  <span className="text-sm font-semibold text-[#71717A] ml-1.5 font-sans">
                    / {sadhana.japaTarget} malas
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-bold text-amber-700">
                    {totalMantras.toLocaleString('en-IN')} mantras
                  </div>
                  <div className="text-[11px] text-[#71717A]">Constant Sacred Remembrance</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-neutral-200/60 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            {/* Quick Increment Controls */}
            <div>
              <span className="text-xs font-bold text-[#71717A] uppercase tracking-wider block mb-2 font-mono">
                Quick Log Chanting:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleAddJapa(1)}
                  className="py-2.5 px-3 rounded-xl bg-[#F4F4F5] text-[#18181B] text-xs font-bold hover:bg-neutral-200 transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-600" />
                  <span>+1 Mala (108)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddJapa(4)}
                  className="py-2.5 px-3 rounded-xl bg-[#F4F4F5] text-[#18181B] text-xs font-bold hover:bg-neutral-200 transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-600" />
                  <span>+4 Malas (432)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddJapa(-1)}
                  disabled={sadhana.japaCompleted <= 0}
                  className="py-2.5 px-3 rounded-xl bg-[#F4F4F5] text-[#71717A] text-xs font-bold hover:bg-neutral-200 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5 text-rose-500" />
                  <span>-1 Mala</span>
                </button>
              </div>
            </div>

            {/* Daily Target Setting */}
            <div>
              <span className="text-xs font-bold text-[#71717A] uppercase tracking-wider block mb-2 font-mono">
                Daily Goal Target (Malas):
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[8, 16, 32, 64, 108].map((target) => (
                  <button
                    key={target}
                    type="button"
                    onClick={() => handleSetJapaTarget(target)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold font-mono transition-colors cursor-pointer ${
                      sadhana.japaTarget === target
                        ? 'bg-[#18181B] text-white font-bold shadow-xs'
                        : 'bg-[#F4F4F5] text-[#71717A] hover:text-[#18181B]'
                    }`}
                  >
                    {target} malas
                  </button>
                ))}
              </div>
            </div>

            {/* Dhyana Sanctuary Gateway */}
            <div className="pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFocusModal();
                }}
                className="w-full py-3 rounded-full bg-[#18181B] hover:bg-[#27272A] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Wind className="w-4 h-4 text-purple-300" />
                <span>Enter Dhyāna Sanctuary (Full-screen Chanting)</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        );
      }

      case 'shravan': {
        const percent = Math.min(100, Math.round((sadhana.shravanMinutes / Math.max(1, sadhana.shravanTarget)) * 100));
        return (
          <div className="space-y-5">
            {/* Header Identity */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0">
                <Music2 className="w-6 h-6 text-[#7C3AED]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800 bg-purple-50 px-2.5 py-0.5 rounded-full font-mono">
                    Pillar 2 • Sacred Listening
                  </span>
                  <span className="text-xs font-mono font-bold text-purple-800">{percent}% Complete</span>
                </div>
                <h3 className="font-serif font-bold text-lg text-[#18181B] mt-0.5">
                  Pad Shravan Audio (पद श्रवण)
                </h3>
              </div>
            </div>

            {/* Metric Status Card */}
            <div className="bg-[#FAFAFA] rounded-2xl p-4">
              <div className="flex items-baseline justify-between mb-2">
                <div>
                  <span className="font-doto font-light text-3xl sm:text-4xl text-[#18181B]">
                    {sadhana.shravanMinutes}
                  </span>
                  <span className="text-sm font-semibold text-[#71717A] ml-1.5 font-sans">
                    / {sadhana.shravanTarget} minutes
                  </span>
                </div>
                <span className="text-[11px] font-bold text-purple-800 bg-purple-50 px-2.5 py-0.5 rounded-full font-mono">
                  Raga Stream
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-neutral-200/60 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#7C3AED] h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            {/* Active Track & Audio Controller */}
            <div className="p-3.5 rounded-2xl bg-[#18181B] text-white flex items-center justify-between gap-3 shadow-sm">
              <div className="min-w-0">
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block font-mono">
                  Featured Pad Today
                </span>
                <p className="font-devanagari font-bold text-xs sm:text-sm truncate text-white">
                  {currentPad?.titleDevanagari || 'जोई जोई प्यारो करे सोई मोहि भावै'}
                </p>
                <span className="text-[10px] text-neutral-400">
                  Raga {currentPad?.rag || 'Vibhas'} • {currentPad?.duration || '08:30'}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onToggleAudio}
                  className="w-10 h-10 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white flex items-center justify-center font-bold transition-colors shadow-xs cursor-pointer"
                  aria-label={isPlayingAudio ? 'Pause' : 'Play'}
                >
                  {isPlayingAudio ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Quick Increment Controls */}
            <div>
              <span className="text-xs font-bold text-[#71717A] uppercase tracking-wider block mb-2 font-mono">
                Log Listening Time:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleAddShravan(15)}
                  className="py-2.5 px-3 rounded-xl bg-[#F4F4F5] text-[#18181B] text-xs font-bold hover:bg-neutral-200 transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#7C3AED]" />
                  <span>+15 Mins</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddShravan(30)}
                  className="py-2.5 px-3 rounded-xl bg-[#F4F4F5] text-[#18181B] text-xs font-bold hover:bg-neutral-200 transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#7C3AED]" />
                  <span>+30 Mins</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddShravan(-15)}
                  disabled={sadhana.shravanMinutes <= 0}
                  className="py-2.5 px-3 rounded-xl bg-[#F4F4F5] text-[#71717A] text-xs font-bold hover:bg-neutral-200 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5 text-rose-500" />
                  <span>-15 Mins</span>
                </button>
              </div>
            </div>

            {/* Daily Target Setting */}
            <div>
              <span className="text-xs font-bold text-[#71717A] uppercase tracking-wider block mb-2 font-mono">
                Daily Goal Target (Minutes):
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[15, 30, 45, 60, 90].map((target) => (
                  <button
                    key={target}
                    type="button"
                    onClick={() => handleSetShravanTarget(target)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold font-mono transition-colors cursor-pointer ${
                      sadhana.shravanTarget === target
                        ? 'bg-[#18181B] text-white font-bold shadow-xs'
                        : 'bg-[#F4F4F5] text-[#71717A] hover:text-[#18181B]'
                    }`}
                  >
                    {target} mins
                  </button>
                ))}
              </div>
            </div>

            {/* Open Full Audio Player */}
            <div className="pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPlayer();
                }}
                className="w-full py-3 rounded-full bg-[#18181B] hover:bg-[#27272A] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Music2 className="w-4 h-4 text-purple-300" />
                <span>Open Ras Shravan Audio Deck</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        );
      }

      case 'svadhyaya': {
        const percent = Math.min(100, Math.round((sadhana.svadhyayaPadas / Math.max(1, sadhana.svadhyayaTarget)) * 100));
        return (
          <div className="space-y-5">
            {/* Header Identity */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
                <BookOpen className="w-6 h-6 text-orange-600" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-orange-800 bg-orange-50 px-2.5 py-0.5 rounded-full font-mono">
                    Pillar 3 • Scripture Study
                  </span>
                  <span className="text-xs font-mono font-bold text-orange-800">{percent}% Complete</span>
                </div>
                <h3 className="font-serif font-bold text-lg text-[#18181B] mt-0.5">
                  Grantha Svadhyaya (ग्रंथ स्वाध्याय)
                </h3>
              </div>
            </div>

            {/* Metric Status Card */}
            <div className="bg-[#FAFAFA] rounded-2xl p-4">
              <div className="flex items-baseline justify-between mb-2">
                <div>
                  <span className="font-doto font-light text-3xl sm:text-4xl text-[#18181B]">
                    {sadhana.svadhyayaPadas}
                  </span>
                  <span className="text-sm font-semibold text-[#71717A] ml-1.5 font-sans">
                    / {sadhana.svadhyayaTarget} padas
                  </span>
                </div>
                <span className="text-[11px] font-bold text-orange-800 bg-orange-50 px-2.5 py-0.5 rounded-full font-mono">
                  Sacred Vani
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-neutral-200/60 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-orange-500 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            {/* Quick Increment Controls */}
            <div>
              <span className="text-xs font-bold text-[#71717A] uppercase tracking-wider block mb-2 font-mono">
                Log Studied Verses:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleAddSvadhyaya(1)}
                  className="py-2.5 px-3 rounded-xl bg-[#F4F4F5] text-[#18181B] text-xs font-bold hover:bg-neutral-200 transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-orange-600" />
                  <span>+1 Pada Read</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddSvadhyaya(2)}
                  className="py-2.5 px-3 rounded-xl bg-[#F4F4F5] text-[#18181B] text-xs font-bold hover:bg-neutral-200 transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-orange-600" />
                  <span>+2 Padas Read</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddSvadhyaya(-1)}
                  disabled={sadhana.svadhyayaPadas <= 0}
                  className="py-2.5 px-3 rounded-xl bg-[#F4F4F5] text-[#71717A] text-xs font-bold hover:bg-neutral-200 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5 text-rose-500" />
                  <span>-1 Pada</span>
                </button>
              </div>
            </div>

            {/* Daily Target Setting */}
            <div>
              <span className="text-xs font-bold text-[#71717A] uppercase tracking-wider block mb-2 font-mono">
                Daily Goal Target (Padas):
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[3, 5, 8, 10, 21].map((target) => (
                  <button
                    key={target}
                    type="button"
                    onClick={() => handleSetSvadhyayaTarget(target)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold font-mono transition-colors cursor-pointer ${
                      sadhana.svadhyayaTarget === target
                        ? 'bg-[#18181B] text-white font-bold shadow-xs'
                        : 'bg-[#F4F4F5] text-[#71717A] hover:text-[#18181B]'
                    }`}
                  >
                    {target} padas
                  </button>
                ))}
              </div>
            </div>

            {/* Direct Deep Link to Padavali Reader */}
            <div className="pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPadavaliReader();
                }}
                className="w-full py-3 rounded-full bg-[#18181B] hover:bg-[#27272A] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-amber-300" />
                <span>Open Scripture Reader (Resume Reading)</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        );
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg bg-white rounded-[28px] p-5 sm:p-6 shadow-2xl border border-neutral-200/80 max-h-[90vh] overflow-y-auto no-scrollbar apple-sheet-enter text-[#18181B]"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#71717A] font-mono">
            Daily Sadhana Pillar Controls
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-[#71717A] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {renderContent()}
      </div>
    </div>
  );
};
