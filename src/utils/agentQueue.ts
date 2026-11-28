export interface QueuedAgentEvent {
  type: string;
  detail?: { agentId?: string; prompt?: string };
  timestamp: number;
}

declare global {
  interface Window {
    __PENDING_AGENT_EVENTS__?: QueuedAgentEvent[];
  }
}

export function queueAgentEvent(type: string, detail?: QueuedAgentEvent['detail']): void {
  if (typeof window === 'undefined') return;
  if (!window.__PENDING_AGENT_EVENTS__) {
    window.__PENDING_AGENT_EVENTS__ = [];
  }
  window.__PENDING_AGENT_EVENTS__.push({
    type,
    detail,
    timestamp: Date.now(),
  });
}

export function popAgentEvent(type: string): QueuedAgentEvent | undefined {
  if (typeof window === 'undefined' || !window.__PENDING_AGENT_EVENTS__) return undefined;
  const idx = window.__PENDING_AGENT_EVENTS__.findIndex((e) => e.type === type);
  if (idx !== -1) {
    const [event] = window.__PENDING_AGENT_EVENTS__.splice(idx, 1);
    return event;
  }
  return undefined;
}

export function popAnyAgentEvent(types: string[]): QueuedAgentEvent | undefined {
  if (typeof window === 'undefined' || !window.__PENDING_AGENT_EVENTS__) return undefined;
  const idx = window.__PENDING_AGENT_EVENTS__.findIndex((e) => types.includes(e.type));
  if (idx !== -1) {
    const [event] = window.__PENDING_AGENT_EVENTS__.splice(idx, 1);
    return event;
  }
  return undefined;
}

export function clearAgentEvents(): void {
  if (typeof window !== 'undefined') {
    window.__PENDING_AGENT_EVENTS__ = [];
  }
}
