import React, { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { SANCTUARY_BOTS, type SanctuaryBotAgent } from '../../data/botRoster';
import {
  BOT_CATEGORIES,
  getBotCategory,
  getBotHomeSection,
  navigateSpaRoute,
  type BotCategoryId,
} from '../../services/botGroqEngine';
import { SanctuaryBotAvatar } from './SanctuaryBotAvatar';
import { queueAgentEvent } from '../../utils/agentQueue';

export { SANCTUARY_BOTS, type SanctuaryBotAgent };

interface BotAvatarRosterProps {
  bots?: SanctuaryBotAgent[];
  selectedAgentId?: string;
  onSelectAgent?: (agent: SanctuaryBotAgent) => void;
  size?: number;
  layout?: 'grid' | 'carousel';
}

export const BotAvatarRoster: React.FC<BotAvatarRosterProps> = ({
  bots = SANCTUARY_BOTS,
  selectedAgentId,
  onSelectAgent,
  size = 52,
  layout = 'grid',
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const activeId = selectedAgentId ?? bots[0]?.id;

  const handleCardClick = (agent: SanctuaryBotAgent) => {
    if (onSelectAgent) {
      onSelectAgent(agent);
    } else {
      queueAgentEvent('open-agent-hub', { agentId: agent.id });
      window.dispatchEvent(new CustomEvent('open-agent-hub', { detail: { agentId: agent.id } }));
    }
  };

  const containerClass =
    layout === 'carousel'
      ? 'flex md:grid md:grid-cols-4 lg:grid-cols-7 gap-2.5 overflow-x-auto no-scrollbar snap-x scroll-pl-1 pr-6 md:pr-0 [mask-image:linear-gradient(to_right,black_calc(100%-20px),transparent)] md:[mask-image:none]'
      : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5';

  return (
    <div className={containerClass}>
      {bots.map((agent) => {
        const isSelected = activeId === agent.id;
        const isHovered = hoveredId === agent.id;
        const homeSection = getBotHomeSection(agent.id);

        return (
          <div
            key={agent.id}
            role="button"
            tabIndex={0}
            aria-label={`Open ${agent.name} — ${agent.role}`}
            onClick={() => handleCardClick(agent)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCardClick(agent);
              }
            }}
            onMouseEnter={() => setHoveredId(agent.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{ cornerShape: 'squircle' } as React.CSSProperties}
            className={`group relative flex flex-col items-center text-center px-3 py-3.5 rounded-[14px] transition-all duration-150 active:scale-[0.97] cursor-pointer select-none ${
              layout === 'carousel' ? 'min-w-[146px] sm:min-w-[152px] md:min-w-0 snap-start shrink-0' : ''
            } ${
              isSelected
                ? 'bg-[#FEF9C3]/85 shadow-[inset_0_0_0_1px_rgba(217,119,6,0.22)]'
                : 'bg-[#FAF7F2] hover:bg-[#F3EDE2]'
            }`}
          >
            <div className="mb-2 flex items-center justify-center">
              <SanctuaryBotAvatar
                agent={agent}
                size={size}
                animated={isSelected || isHovered}
                working={isHovered}
              />
            </div>

            <div className="w-full flex flex-col items-center gap-0.5">
              <span className="text-[13.5px] font-bold text-[#1C140D] leading-tight">
                {agent.name}
              </span>
              <span className="text-[11px] text-[#6B5B4D] font-medium leading-[1.35] line-clamp-2 w-full px-0.5">
                {agent.role}
              </span>
              <a
                href={homeSection.href}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigateSpaRoute(homeSection.href);
                }}
                className="mt-1.5 text-[10.5px] font-semibold text-amber-800 hover:underline no-underline"
              >
                {homeSection.label} →
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Full-width Home Sanctuary showcase for the 14-Bot Interactive Fleet.
 */
export const BotFleetSection: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>(SANCTUARY_BOTS[0].id);
  const [activeCategory, setActiveCategory] = useState<BotCategoryId>('all');

  const visibleBots = useMemo(() => {
    if (activeCategory === 'all') return SANCTUARY_BOTS;
    return SANCTUARY_BOTS.filter((b) => getBotCategory(b.id) === activeCategory);
  }, [activeCategory]);

  const handleOpenHub = (agentId?: string) => {
    const targetId = agentId || selectedId || SANCTUARY_BOTS[0].id;
    queueAgentEvent('open-agent-hub', { agentId: targetId });
    window.dispatchEvent(new CustomEvent('open-agent-hub', { detail: { agentId: targetId } }));
  };

  return (
    <section
      data-nosnippet
      aria-label="Sanctuary 14-Bot Interactive Sahayak Fleet"
      style={{ cornerShape: 'squircle' } as React.CSSProperties}
      className="w-full bg-white rounded-[30px] sm:rounded-[34px] p-4 sm:p-5 shadow-[0_2px_18px_rgba(28,20,13,0.035)] mb-6 space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h3 className="font-rozha text-xl sm:text-2xl text-[#1C140D] leading-tight">
            AI Sakha &amp; Sahayak Fleet ({SANCTUARY_BOTS.length})
          </h3>
          <p className="text-xs sm:text-[13px] text-[#6B5B4D]">
            Tap any Sahayak for live Darshan timings, Panchang, Rasik Padavali, or jump directly to their section.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenHub(selectedId)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#1C140D] hover:bg-[#312419] text-[#FFFDF9] text-xs font-semibold transition-all active:scale-95 cursor-pointer shrink-0 self-start sm:self-center"
        >
          <span>Open Bots Hub</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Concentric Category Filter Strip */}
      <div
        className="flex items-center gap-1 p-1 rounded-full bg-[#FAF7F2] w-full sm:w-fit overflow-x-auto no-scrollbar pr-4 sm:pr-1 [mask-image:linear-gradient(to_right,black_calc(100%-16px),transparent)] sm:[mask-image:none]"
        role="tablist"
        aria-label="Filter bots by specialty"
      >
        {BOT_CATEGORIES.map((cat) => {
          const isCurrent = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isCurrent}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-[11.5px] font-semibold whitespace-nowrap transition-all active:scale-95 cursor-pointer shrink-0 ${
                isCurrent
                  ? 'bg-[#1C140D] text-[#FFFDF9] shadow-2xs'
                  : 'text-[#5C4B3B] hover:text-[#1C140D]'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      <BotAvatarRoster
        bots={visibleBots}
        selectedAgentId={selectedId}
        onSelectAgent={(bot) => {
          setSelectedId(bot.id);
          handleOpenHub(bot.id);
        }}
        size={48}
        layout="carousel"
      />
    </section>
  );
};
