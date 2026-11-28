import React, { useState, useEffect, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { popAnyAgentEvent } from '../../utils/agentQueue';
import { SANCTUARY_BOTS } from '../../data/botRoster';

const LazyAgentHub = lazy(() =>
  import('./AgentHub').then((m) => ({ default: m.AgentHub }))
);

export const AgentHubModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeAgentId, setActiveAgentId] = useState<string>(SANCTUARY_BOTS[0].id);

  useEffect(() => {
    const pending = popAnyAgentEvent(['open-sanctuary-assistant', 'open-agent-hub', 'open-agent-fleet']);
    if (pending) {
      if (pending.detail?.agentId) {
        setActiveAgentId(pending.detail.agentId);
      }
      setIsOpen(true);
    }

    const handleOpenHub = (e: Event) => {
      const customEvent = e as CustomEvent<{ agentId?: string }>;
      if (customEvent.detail?.agentId) {
        setActiveAgentId(customEvent.detail.agentId);
      }
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 text-white text-sm font-sans">
          Loading 14 Interactive Bots...
        </div>
      }
    >
      <LazyAgentHub
        isModal={true}
        initialAgentId={activeAgentId}
        onClose={() => setIsOpen(false)}
      />
    </Suspense>,
    document.body
  );
};
