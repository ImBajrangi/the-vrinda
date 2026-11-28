import React, { useEffect, useState, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { SANCTUARY_BOTS } from '../../data/botRoster';
import { popAnyAgentEvent } from '../../utils/agentQueue';

const LazyAgentHub = lazy(() =>
  import('./AgentHub').then((m) => ({ default: m.AgentHub }))
);

export const AgentHubModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeAgentId, setActiveAgentId] = useState<string>(SANCTUARY_BOTS[0].id);
  const [initialPrompt, setInitialPrompt] = useState<string | undefined>(undefined);

  useEffect(() => {
    const pending = popAnyAgentEvent(['open-sanctuary-assistant', 'open-agent-hub', 'open-agent-fleet']);
    if (pending) {
      if (pending.detail?.agentId) setActiveAgentId(pending.detail.agentId);
      if (pending.detail?.prompt) setInitialPrompt(pending.detail.prompt);
      setIsOpen(true);
    }

    const handleOpenHub = (e: Event) => {
      const customEvent = e as CustomEvent<{ agentId?: string; prompt?: string }>;
      if (customEvent.detail?.agentId) {
        setActiveAgentId(customEvent.detail.agentId);
      }
      setInitialPrompt(customEvent.detail?.prompt);
      setIsOpen(true);
    };

    window.addEventListener('open-agent-hub', handleOpenHub);
    window.addEventListener('open-agent-fleet', handleOpenHub);

    return () => {
      window.removeEventListener('open-agent-hub', handleOpenHub);
      window.removeEventListener('open-agent-fleet', handleOpenHub);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <Suspense
      fallback={
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-6"
          aria-busy="true"
        >
          <div className="bg-white rounded-[24px] px-6 py-4 shadow-xl text-sm font-semibold text-[#1C140D]">
            Opening Sanctuary 14-Bot Workbench...
          </div>
        </div>
      }
    >
      <LazyAgentHub
        isModal={true}
        initialAgentId={activeAgentId}
        initialPrompt={initialPrompt}
        onClose={() => {
          setIsOpen(false);
          setInitialPrompt(undefined);
        }}
      />
    </Suspense>,
    document.body
  );
};
