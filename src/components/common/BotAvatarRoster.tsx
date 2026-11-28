import React, { useState } from 'react';
import {
  BotAvatar,
  type BotAvatarState,
  type BotAvatarShading,
} from 'bot-avatars';
import { Check, Sparkles, ChevronRight } from 'lucide-react';
import { SANCTUARY_BOTS, type SanctuaryBotAgent } from '../../data/botRoster';
import { queueAgentEvent } from '../../utils/agentQueue';

export { SANCTUARY_BOTS, type SanctuaryBotAgent };

interface BotAvatarRosterProps {
  selectedAgentId?: string;
  onSelectAgent?: (agent: SanctuaryBotAgent) => void;
  size?: number;
  shading?: BotAvatarShading;
  layout?: 'grid' | 'carousel';
}

export const BotAvatarRoster: React.FC<BotAvatarRosterProps> = ({
  selectedAgentId,
  onSelectAgent,
  size = 56,
  shading,
  layout = 'grid',
}) => {
  const [activeId, setActiveId] = useState<string>(selectedAgentId || SANCTUARY_BOTS[0].id);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [agentShadings, setAgentShadings] = useState<Record<string, BotAvatarShading>>(() => {
    const map: Record<string, BotAvatarShading> = {};
    SANCTUARY_BOTS.forEach((a) => {
      map[a.id] = a.shading;
    });
    return map;
  });

  const toggleShading = (agentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAgentShadings((prev) => ({
      ...prev,
      [agentId]: prev[agentId] === 'fabric' ? 'plastic' : 'fabric',
    }));
  };

  const handleSelect = (agent: SanctuaryBotAgent) => {
    setActiveId(agent.id);
    if (onSelectAgent) {
      onSelectAgent({ ...agent, shading: agentShadings[agent.id] || agent.shading });
    } else if (typeof window !== 'undefined') {
      queueAgentEvent('open-agent-hub', { agentId: agent.id });
      window.dispatchEvent(new CustomEvent('open-agent-hub', { detail: { agentId: agent.id } }));
    }
  };

  const containerClass =
    layout === 'carousel'
      ? 'flex md:grid md:grid-cols-4 lg:grid-cols-7 gap-2.5 overflow-x-auto no-scrollbar pb-1 snap-x'
      : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5';

  return (
    <div className={containerClass}>
      {SANCTUARY_BOTS.map((agent) => {
        const isSelected = activeId === agent.id;
        const isHovered = hoveredId === agent.id;
        const currentState: BotAvatarState = isHovered ? 'working' : 'default';
        const effectiveShading = shading || agentShadings[agent.id] || agent.shading;

        return (
          <div
            key={agent.id}
            role="button"
            tabIndex={0}
            onClick={() => handleSelect(agent)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSelect(agent)}
            onMouseEnter={() => setHoveredId(agent.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={`relative text-center p-2.5 rounded-[18px] transition-colors duration-150 cursor-pointer select-none flex flex-col items-center justify-between ${
              layout === 'carousel' ? 'w-[126px] md:w-auto shrink-0 snap-start' : ''
            } ${
              isSelected
                ? 'bg-[#FEFCE8] ring-2 ring-amber-400/80 shadow-xs'
                : 'bg-[#FAF8F4] hover:bg-[#F5EFE3]'
            }`}
          >
            {isSelected && (
              <span
                aria-hidden="true"
                className="absolute top-2 right-2 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center"
              >
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
            )}

            <div className="my-1">
              <BotAvatar
                type={agent.type}
                face={agent.face}
                state={currentState}
                hat={agent.hat}
                glasses={agent.glasses}
                headphones={agent.headphones}
                bowTie={agent.bowTie}
                shading={effectiveShading}
                size={size}
                depth={0.5}
                turn={0.75}
                jumpSquashEase="soft"
                jumpRiseEase="soft"
              />
            </div>

            <div className="w-full min-w-0 space-y-1">
              <div className="font-serif font-bold text-xs text-[#18181B] truncate">
                {agent.name}
              </div>

              <div className="flex items-center justify-center gap-1 flex-wrap">
                <span
                  className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full truncate max-w-[92px] ${
                    isSelected
                      ? 'bg-[#FEF08A] text-[#78350F]'
                      : 'bg-white text-neutral-600'
                  }`}
                >
                  {agent.tag}
                </span>

                <button
                  type="button"
                  onClick={(e) => toggleShading(agent.id, e)}
                  title="Toggle Plastic / Fabric bot shading"
                  className={`text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-[5px] cursor-pointer transition-colors ${
                    effectiveShading === 'fabric'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-sky-50 text-sky-800'
                  }`}
                >
                  {effectiveShading === 'fabric' ? 'Fabric' : 'Plastic'}
                </button>
              </div>

              <div className="text-[10px] text-neutral-500 line-clamp-1">
                {agent.role}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const BotFleetSection: React.FC = () => {
  const openHub = (agentId?: string) => {
    if (typeof window === 'undefined') return;
    queueAgentEvent('open-agent-hub', { agentId: agentId || SANCTUARY_BOTS[0].id });
    window.dispatchEvent(
      new CustomEvent('open-agent-hub', { detail: { agentId: agentId || SANCTUARY_BOTS[0].id } })
    );
  };

  return (
    <section
      aria-label="Autonomous Sanctuary & FarmDirect Bots Fleet"
      className="w-full bg-white rounded-[28px] sm:rounded-[32px] p-4 sm:p-6 shadow-[0_2px_16px_rgba(24,24,27,0.025)] mb-6 space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-rozha text-xl sm:text-2xl text-[#18181B] leading-tight">
              AI Sakha & Bot Fleet ({SANCTUARY_BOTS.length})
            </h3>
            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-[#FEF08A] text-[#78350F]">
              <Sparkles className="w-3 h-3" />
              <span>Interactive 2D Bots</span>
            </span>
          </div>
          <p className="text-xs text-[#71717A] font-laila mt-0.5">
            स्पर्श करें • Tap any bot for live Ashtayama timings, Panchang, scriptures, or FarmDirect assistant tools.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openHub()}
          className="self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-[#1C140D] hover:bg-[#2F2217] text-[#FEF08A] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
        >
          <span>Open Bots Hub</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <BotAvatarRoster
        size={52}
        layout="carousel"
        onSelectAgent={(agent) => openHub(agent.id)}
      />
    </section>
  );
};
