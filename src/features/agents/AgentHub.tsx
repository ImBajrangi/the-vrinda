import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BotAvatar } from 'bot-avatars';
import { SANCTUARY_BOTS } from '../../data/botRoster';
import { assistantCache } from '../../services/assistantCache';
import { resolveBotReply } from '../../services/botBrain';
import './agent-hub.css';

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  steps?: string[];
  done?: boolean;
  handoff?: { id: string; label: string; prompt?: string } | null;
}

export interface AgentHubProps {
  initialAgentId?: string;
  onClose?: () => void;
  isModal?: boolean;
}

export const AgentHub: React.FC<AgentHubProps> = ({
  initialAgentId = SANCTUARY_BOTS[0].id,
  onClose,
  isModal = false,
}) => {
  const [selectedId, setSelectedId] = useState<string>(() => {
    const found = SANCTUARY_BOTS.find((a) => a.id === initialAgentId);
    return found ? found.id : SANCTUARY_BOTS[0].id;
  });
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [threads, setThreads] = useState<Record<string, ChatMessage[]>>(() => {
    const init: Record<string, ChatMessage[]> = {};
    SANCTUARY_BOTS.forEach((agent) => {
      init[agent.id] = [
        {
          id: `${agent.id}-welcome`,
          sender: 'agent',
          text: agent.greeting,
          done: true,
        },
      ];
    });
    return init;
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeAgent = SANCTUARY_BOTS.find((a) => a.id === selectedId) || SANCTUARY_BOTS[0];
  const handoffAgent = activeAgent.handoff
    ? SANCTUARY_BOTS.find((a) => a.id === activeAgent.handoff![0])
    : null;

  useEffect(() => {
    if (initialAgentId) {
      const match = SANCTUARY_BOTS.find((a) => a.id === initialAgentId);
      if (match) setSelectedId(match.id);
    }
  }, [initialAgentId]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 2200);
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    threadEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  const currentMessages = threads[selectedId] || [];

  useEffect(() => {
    scrollToBottom(false);
  }, [selectedId, scrollToBottom]);

  const selectAgent = (agentId: string) => {
    if (agentId === selectedId) return;
    if (isBusy && abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsBusy(false);
    }
    setSelectedId(agentId);
    setSheetOpen(false);
  };

  const clearConversation = () => {
    if (isBusy && abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsBusy(false);
    }
    setThreads((prev) => ({
      ...prev,
      [selectedId]: [
        {
          id: `${selectedId}-${Date.now()}`,
          sender: 'agent',
          text: activeAgent.greeting,
          done: true,
        },
      ],
    }));
    setSheetOpen(false);
    showToast('Conversation cleared');
  };

  const copyAnswer = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(
        () => showToast('Copied to clipboard'),
        () => showToast('Could not copy')
      );
    }
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText !== undefined ? queryText : inputText).trim();
    if (!textToSend || isBusy) return;

    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: textToSend,
    };

    setThreads((prev) => ({
      ...prev,
      [selectedId]: [...(prev[selectedId] || []), userMsg],
    }));

    setIsBusy(true);
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const cacheKey = `hub_${selectedId}_${textToSend}`;
    const cachedText = assistantCache.get<string>(cacheKey);
    const computed = resolveBotReply(activeAgent, textToSend);
    const responseText = cachedText || computed.text;
    const steps = computed.steps;

    if (!cachedText) {
      assistantCache.set(cacheKey, responseText);
    }

    const agentMsgId = `a-${Date.now()}`;
    setThreads((prev) => ({
      ...prev,
      [selectedId]: [
        ...(prev[selectedId] || []),
        { id: agentMsgId, sender: 'agent', text: '', done: false },
      ],
    }));

    scrollToBottom(true);

    try {
      await new Promise((r) => setTimeout(r, 180));
      if (signal.aborted) return;

      setThreads((prev) => {
        const list = [...(prev[selectedId] || [])];
        const idx = list.findIndex((m) => m.id === agentMsgId);
        if (idx !== -1) list[idx] = { ...list[idx], steps };
        return { ...prev, [selectedId]: list };
      });

      const words = responseText.split(/(?<=\s)/);
      let streamed = '';

      for (const word of words) {
        if (signal.aborted) break;
        streamed += word;
        setThreads((prev) => {
          const list = [...(prev[selectedId] || [])];
          const idx = list.findIndex((m) => m.id === agentMsgId);
          if (idx !== -1) list[idx] = { ...list[idx], text: streamed };
          return { ...prev, [selectedId]: list };
        });
        scrollToBottom(true);
        await new Promise((r) => setTimeout(r, 16));
      }

      setThreads((prev) => {
        const list = [...(prev[selectedId] || [])];
        const idx = list.findIndex((m) => m.id === agentMsgId);
        if (idx !== -1) {
          list[idx] = {
            ...list[idx],
            text: streamed || 'Stopped.',
            done: true,
            handoff: activeAgent.handoff
              ? { id: activeAgent.handoff[0], label: activeAgent.handoff[1], prompt: textToSend }
              : null,
          };
        }
        return { ...prev, [selectedId]: list };
      });
    } catch {
      if (!signal.aborted) {
        setThreads((prev) => {
          const list = [...(prev[selectedId] || [])];
          const idx = list.findIndex((m) => m.id === agentMsgId);
          if (idx !== -1) {
            list[idx] = {
              ...list[idx],
              text: 'Could not process request right now. Please try again.',
              done: true,
            };
          }
          return { ...prev, [selectedId]: list };
        });
      }
    } finally {
      setIsBusy(false);
      abortControllerRef.current = null;
      scrollToBottom(true);
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsBusy(false);
    }
  };

  const filteredAgents = SANCTUARY_BOTS.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      a.role.toLowerCase().includes(q) ||
      a.tag.toLowerCase().includes(q)
    );
  });

  const appContent = (
    <div
      className="ag-app"
      id="agent-hub-app"
      data-theme={theme}
      data-sheet={sheetOpen ? 'open' : 'closed'}
      data-avatar="free"
      style={{ '--h': activeAgent.hue } as React.CSSProperties}
    >
      {/* 1. Left Rail: All 14 FarmDirect & Vrindopnisad Bots */}
      <aside className="ag-pane ag-rail" aria-label="Bots">
        <h1>Bots ({SANCTUARY_BOTS.length})</h1>
        <label className="ag-search">
          <svg className="ic" aria-hidden="true" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            placeholder="Find a bot..."
            aria-label="Find a bot"
            autoComplete="off"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </label>
        <div className="ag-list" role="listbox" aria-label="Bot Directory">
          {filteredAgents.map((agent) => {
            const isSelected = agent.id === selectedId;
            return (
              <button
                key={agent.id}
                type="button"
                className="ag-item"
                role="option"
                style={{ '--ah': agent.hue } as React.CSSProperties}
                aria-selected={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => selectAgent(agent.id)}
              >
                <span className="ag-av">
                  <BotAvatar
                    type={agent.type}
                    face={agent.face}
                    hat={agent.hat}
                    glasses={agent.glasses}
                    headphones={agent.headphones}
                    bowTie={agent.bowTie}
                    size={38}
                    shading={agent.shading}
                    state={isSelected ? 'working' : 'default'}
                    depth={0.5}
                    turn={0.75}
                  />
                </span>
                <span className="ag-meta">
                  <b>{agent.name}</b>
                  <small>{agent.role}</small>
                </span>
              </button>
            );
          })}
          {filteredAgents.length === 0 && <p className="ag-none">No bots match.</p>}
        </div>
      </aside>

      {/* 2. Center Chat Workspace */}
      <main className="ag-pane" aria-label="Conversation">
        <header className="ag-bar">
          <span className="ag-av" style={{ '--ah': activeAgent.hue } as React.CSSProperties}>
            <BotAvatar
              type={activeAgent.type}
              face={activeAgent.face}
              hat={activeAgent.hat}
              glasses={activeAgent.glasses}
              headphones={activeAgent.headphones}
              bowTie={activeAgent.bowTie}
              size={42}
              shading={activeAgent.shading}
              state={isBusy ? 'working' : 'default'}
              depth={0.5}
              turn={0.75}
            />
          </span>
          <div className="ag-id">
            <h2>{activeAgent.name}</h2>
            <p>
              <span className="ag-live" aria-hidden="true" />
              <span>{activeAgent.role} · Online</span>
            </p>
          </div>
          <button
            type="button"
            className="ag-btn"
            aria-label={theme === 'dark' ? 'Light theme' : 'Dark theme'}
            onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
          >
            <svg className="ic" aria-hidden="true" viewBox="0 0 24 24">
              {theme === 'dark' ? (
                <>
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </>
              ) : (
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
              )}
            </svg>
          </button>
          <button
            type="button"
            className="ag-btn info"
            aria-label="Bot details"
            onClick={() => setSheetOpen(true)}
          >
            <svg className="ic" aria-hidden="true" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
          </button>
          {onClose && (
            <button
              type="button"
              className="ag-btn close-hub"
              aria-label="Close Bots Hub"
              onClick={onClose}
              title="Close"
            >
              <svg className="ic" aria-hidden="true" viewBox="0 0 24 24">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </header>

        <div className="ag-thread" role="log" aria-live="polite">
          {currentMessages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div key={m.id} className={`ag-msg ${isUser ? 'user' : 'agent'}`}>
                {!isUser && (
                  <span className="ag-av" style={{ '--ah': activeAgent.hue } as React.CSSProperties}>
                    <BotAvatar
                      type={activeAgent.type}
                      face={activeAgent.face}
                      hat={activeAgent.hat}
                      glasses={activeAgent.glasses}
                      headphones={activeAgent.headphones}
                      bowTie={activeAgent.bowTie}
                      size={28}
                      shading={activeAgent.shading}
                      state="default"
                    />
                  </span>
                )}
                <div className="ag-col">
                  {m.steps && m.steps.length > 0 && (
                    <details className="ag-steps" open={!m.done}>
                      <summary>
                        {!m.done ? (
                          <span className="ag-spin" />
                        ) : (
                          <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="m5 12 5 5 9-10" />
                          </svg>
                        )}
                        <span>{m.done ? `Done in ${m.steps.length} steps` : 'Working...'}</span>
                        <svg className="ic chev" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </summary>
                      <ol>
                        {m.steps.map((st, i) => (
                          <li key={i}>
                            <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
                              <path d="m5 12 5 5 9-10" />
                            </svg>
                            <span>{st}</span>
                          </li>
                        ))}
                      </ol>
                    </details>
                  )}

                  <div className={`ag-bub ${!m.done && isBusy ? 'live' : ''}`}>
                    {m.text ? (
                      m.text
                    ) : (
                      <span className="ag-typing" aria-label="Typing">
                        <i />
                        <i />
                        <i />
                      </span>
                    )}
                  </div>

                  {m.done && m.sender === 'agent' && m.text && (
                    <div className="ag-acts">
                      <button
                        type="button"
                        className="ag-btn"
                        aria-label="Copy answer"
                        onClick={() => copyAnswer(m.text)}
                        title="Copy"
                      >
                        <svg className="ic" aria-hidden="true" viewBox="0 0 24 24">
                          <rect x="9" y="9" width="13" height="13" rx="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      </button>
                      {m.handoff && (
                        <button
                          type="button"
                          className="ag-chipx hand"
                          onClick={() => {
                            selectAgent(m.handoff!.id);
                            if (m.handoff!.prompt) {
                              setTimeout(() => handleSend(m.handoff!.prompt), 260);
                            }
                          }}
                        >
                          <span>{m.handoff.label}</span>
                          <svg className="ic" aria-hidden="true" viewBox="0 0 24 24">
                            <path d="M5 12h14M13 6l6 6-6 6" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={threadEndRef} />
        </div>

        <div className="ag-composer">
          <div className="ag-chips" aria-label="Suggestions">
            {activeAgent.prompts.map((sug, i) => (
              <button
                key={i}
                type="button"
                className="ag-chipx"
                onClick={() => handleSend(sug)}
              >
                <span>{sug}</span>
              </button>
            ))}
          </div>

          <div className="ag-field">
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder={`Message ${activeAgent.name}...`}
              aria-label="Message"
              maxLength={2000}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                if (textareaRef.current) {
                  textareaRef.current.style.height = 'auto';
                  textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (isBusy) handleStop();
                  else handleSend();
                }
              }}
            />
            <button
              type="button"
              className={`ag-send ${isBusy ? 'stop' : inputText.trim() ? 'ready' : ''}`}
              aria-label={isBusy ? 'Stop' : 'Send'}
              disabled={!isBusy && !inputText.trim()}
              onClick={() => (isBusy ? handleStop() : handleSend())}
            >
              <svg className="ic" aria-hidden="true" viewBox="0 0 24 24">
                {isBusy ? (
                  <rect x="6" y="6" width="12" height="12" rx="2.5" />
                ) : (
                  <>
                    <path d="m22 2-7 20-4-9-9-4z" />
                    <path d="M22 2 11 13" />
                  </>
                )}
              </svg>
            </button>
          </div>
          <p className="ag-hint">Enter to send · Shift+Enter for new line</p>
        </div>
      </main>

      {/* 3. Right Profile Pane */}
      <aside className="ag-pane ag-profile" aria-label="Bot details">
        <button
          type="button"
          className="ag-btn ag-close"
          aria-label="Close details"
          onClick={() => setSheetOpen(false)}
        >
          <svg className="ic" aria-hidden="true" viewBox="0 0 24 24">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="ag-hero">
          <span className="ag-av" style={{ '--ah': activeAgent.hue } as React.CSSProperties}>
            <BotAvatar
              type={activeAgent.type}
              face={activeAgent.face}
              hat={activeAgent.hat}
              glasses={activeAgent.glasses}
              headphones={activeAgent.headphones}
              bowTie={activeAgent.bowTie}
              size={84}
              shading={activeAgent.shading}
              state="default"
              depth={0.5}
              turn={0.75}
            />
          </span>
          <h2>{activeAgent.name}</h2>
          <p>{activeAgent.role}</p>
          <span className="ag-tag">{activeAgent.tag}</span>
        </div>

        <div className="ag-sec">
          <h3>Try asking</h3>
          <div className="ag-sec">
            {activeAgent.prompts.map((sug, i) => (
              <button
                key={i}
                type="button"
                className="ag-chipx"
                onClick={() => {
                  setSheetOpen(false);
                  handleSend(sug);
                }}
              >
                {sug}
              </button>
            ))}
          </div>
        </div>

        {handoffAgent && (
          <div className="ag-sec">
            <h3>Hands off to</h3>
            <button
              type="button"
              className="ag-chipx hand"
              onClick={() => selectAgent(handoffAgent.id)}
            >
              <span>
                {handoffAgent.name} · {handoffAgent.tag}
              </span>
            </button>
          </div>
        )}

        <div className="ag-sec">
          <h3>Conversation</h3>
          <button type="button" className="ag-chipx" onClick={clearConversation}>
            Clear this conversation
          </button>
        </div>
      </aside>

      <div className="ag-scrim" onClick={() => setSheetOpen(false)} aria-hidden="true" />
      <div className={`ag-toast ${toastMessage ? 'on' : ''}`} role="status">
        {toastMessage}
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div
        className="ag-modal-wrap"
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) onClose();
        }}
      >
        {appContent}
      </div>
    );
  }

  return appContent;
};

export default AgentHub;
