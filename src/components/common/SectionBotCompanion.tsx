import React from 'react';
import { ChevronRight, MessageCircle } from 'lucide-react';
import { SANCTUARY_BOTS } from '../../data/botRoster';
import { SanctuaryBotAvatar } from './SanctuaryBotAvatar';
import { queueAgentEvent } from '../../utils/agentQueue';

export interface SectionBotCompanionProps {
  agentId: string;
  heading?: string;
  subtitle?: string;
  quickPrompts?: string[];
  className?: string;
}

/**
 * Lightweight, zero-canvas contextual bot companion distributed across every major
 * Vrindopnisad section & reading view.
 * Marked with `data-nosnippet` so Googlebot / Bing keep search snippets strictly focused
 * on primary devotional text rather than assistant chrome.
 */
export const SectionBotCompanion: React.FC<SectionBotCompanionProps> = ({
  agentId,
  heading,
  subtitle,
  quickPrompts,
  className = '',
}) => {
  const agent = SANCTUARY_BOTS.find((b) => b.id === agentId) || SANCTUARY_BOTS[0];
  const prompts = (quickPrompts && quickPrompts.length > 0 ? quickPrompts : agent.prompts).slice(0, 2);

  const openAgent = (prompt?: string) => {
    queueAgentEvent('open-agent-hub', { agentId: agent.id, prompt });
    window.dispatchEvent(
      new CustomEvent('open-agent-hub', { detail: { agentId: agent.id, prompt } })
    );
  };

  return (
    <aside
      data-nosnippet
      aria-label={`${agent.name} — Section Guide`}
      style={{ cornerShape: 'squircle' } as React.CSSProperties}
      className={`w-full rounded-[24px] bg-white p-3.5 sm:p-4 shadow-[0_2px_14px_rgba(28,20,13,0.03)] border border-stone-200/70 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <SanctuaryBotAvatar agent={agent} size={42} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[13.5px] font-bold text-[#1C140D] leading-tight">
                {heading || `${agent.name} • ${agent.tag}`}
              </span>
              <span
                className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0"
                aria-hidden="true"
              />
            </div>
            <p className="text-[12px] text-[#6B5B4D] leading-snug line-clamp-1 mt-0.5">
              {subtitle || agent.role}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 sm:pb-0 shrink-0">
          {prompts.map((promptText, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => openAgent(promptText)}
              className="px-3 py-1.5 rounded-[12px] bg-[#FAF7F2] hover:bg-[#FEF08A] text-[#443528] hover:text-[#5C2D0C] text-[11.5px] font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0"
            >
              {promptText}
            </button>
          ))}

          <button
            type="button"
            onClick={() => openAgent()}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[12px] bg-[#1C140D] hover:bg-[#312419] text-[#FFFDF9] text-[11.5px] font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Ask {agent.name}</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-75" />
          </button>
        </div>
      </div>
    </aside>
  );
};
