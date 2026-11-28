import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Sun,
  Moon,
  Info,
  X,
  Send,
  Square,
  Copy,
  Check,
  ArrowRight,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { type BotAvatarState } from 'bot-avatars';
import { SANCTUARY_BOTS } from '../../data/botRoster';
import { SanctuaryBotAvatar } from '../../components/common/SanctuaryBotAvatar';
import { IOSSpinner } from '../../components/common/IOSActivityIndicator';
import { getIstParts } from '../../services/panchangService';
import {
  getBotHomeSection,
  streamBotReply,
  clearBotConversationCache,
  normalizeReplyLines,
  parseRichInlineSegments,
  navigateSpaRoute,
  type BotResponseSource,
  type BotSuggestedLink,
} from '../../services/botGroqEngine';
import './agent-hub.css';

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  steps?: string[];
  source?: BotResponseSource;
  suggestedLinks?: BotSuggestedLink[];
  done?: boolean;
  aborted?: boolean;
}

export interface AgentHubProps {
  initialAgentId?: string;
  initialPrompt?: string;
  onClose?: () => void;
  isModal?: boolean;
}

const RichBotMessageBody: React.FC<{
  text: string;
  onCloseModal?: () => void;
}> = ({ text, onCloseModal }) => {
  const lines = normalizeReplyLines(text);
  return (
    <div className="ag-rich-text">
      {lines.map((rawLine, lineIdx) => {
        const trimmed = rawLine.trim();
        if (!trimmed) {
          return <div key={lineIdx} className="ag-rich-gap" aria-hidden="true" />;
        }
        const isBullet = /^([•\-*]|\d+[.)])\s+/.test(trimmed);
        const contentLine = isBullet ? trimmed.replace(/^([•\-*]|\d+[.)])\s+/, '') : trimmed;
        const segments = parseRichInlineSegments(contentLine);

        return (
          <div key={lineIdx} className={isBullet ? 'ag-rich-li' : 'ag-rich-p'}>
            {isBullet && <span className="ag-rich-dot" aria-hidden="true">•</span>}
            <span>
              {segments.map((seg, segIdx) => {
                if (seg.type === 'bold') {
                  return <strong key={segIdx}>{seg.value}</strong>;
                }
                if (seg.type === 'italic') {
                  return <em key={segIdx}>{seg.value}</em>;
                }
                if (seg.type === 'link') {
                  return (
                    <a
                      key={segIdx}
                      href={seg.href}
                      className="ag-inline-route"
                      onClick={(e) => {
                        e.preventDefault();
                        navigateSpaRoute(seg.href, onCloseModal);
                      }}
                    >
                      {seg.value}
                    </a>
                  );
                }
                return <React.Fragment key={segIdx}>{seg.value}</React.Fragment>;
              })}
            </span>
          </div>
        );
      })}
    </div>
  );
};

function spawnRipple(e: React.PointerEvent<HTMLElement>) {
  const btn = e.currentTarget;
  if ((btn as HTMLButtonElement).disabled) return;
  const rect = btn.getBoundingClientRect();
  const d = Math.hypot(rect.width, rect.height) * 2;
  const span = document.createElement('span');
  span.className = 'ag-ripple';
  span.style.width = `${d}px`;
  span.style.height = `${d}px`;
  span.style.left = `${e.clientX - rect.left - d / 2}px`;
  span.style.top = `${e.clientY - rect.top - d / 2}px`;
  btn.appendChild(span);
  span.addEventListener('animationend', () => span.remove(), { once: true });
}

export const AgentHub: React.FC<AgentHubProps> = ({
  initialAgentId = SANCTUARY_BOTS[0].id,
  initialPrompt,
  onClose,
  isModal = false,
}) => {
  const [selectedId, setSelectedId] = useState<string>(() => {
    const found = SANCTUARY_BOTS.find((a) => a.id === initialAgentId);
    return found ? found.id : SANCTUARY_BOTS[0].id;
  });
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [searchQuery, setSearchQuery] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [streamingIds, setStreamingIds] = useState<Record<string, boolean>>({});
  const [typingStepsMap, setTypingStepsMap] = useState<Record<string, string[]>>({});
  const [streamingTextMap, setStreamingTextMap] = useState<Record<string, string>>({});
  const [inputQuery, setInputQuery] = useState('');
  const [isIdleSleep, setIsIdleSleep] = useState(false);
  const [isNightRest, setIsNightRest] = useState(false);
  const [isTabHidden, setIsTabHidden] = useState(false);

  const idleSleepTimerRef = useRef<number | null>(null);

  const wakeBotFromIdle = useCallback(() => {
    setIsIdleSleep(false);
    if (idleSleepTimerRef.current) window.clearTimeout(idleSleepTimerRef.current);
    idleSleepTimerRef.current = window.setTimeout(() => {
      setIsIdleSleep(true);
    }, 26000);
  }, []);

  useEffect(() => {
    const syncConditions = () => {
      const { minutesOfDay } = getIstParts(new Date());
      // Shayana Vishrama (Vrindavan rest hours: 22:00 - 03:30 IST)
      setIsNightRest(minutesOfDay >= 1320 || minutesOfDay < 210);
      setIsTabHidden(document.visibilityState === 'hidden');
    };
    syncConditions();
    wakeBotFromIdle();
    const tick = window.setInterval(syncConditions, 60000);
    document.addEventListener('visibilitychange', syncConditions);
    return () => {
      window.clearInterval(tick);
      document.removeEventListener('visibilitychange', syncConditions);
      if (idleSleepTimerRef.current) window.clearTimeout(idleSleepTimerRef.current);
    };
  }, [wakeBotFromIdle]);

  const [histories, setHistories] = useState<Record<string, ChatMessage[]>>(() => {
    const initial: Record<string, ChatMessage[]> = {};
    SANCTUARY_BOTS.forEach((agent) => {
      initial[agent.id] = [
        {
          id: `welcome-${agent.id}`,
          sender: 'agent',
          text: agent.greeting,
          done: false,
        },
      ];
    });
    return initial;
  });

  const listRef = useRef<HTMLDivElement | null>(null);
  const threadRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const closeSheetBtnRef = useRef<HTMLButtonElement | null>(null);
  const headerAvRef = useRef<HTMLSpanElement | null>(null);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const toastTimerRef = useRef<number | null>(null);
  const handledPromptRef = useRef<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMsg(null), 2200);
  }, []);

  useEffect(() => {
    if (initialAgentId && SANCTUARY_BOTS.some((a) => a.id === initialAgentId)) {
      setSelectedId(initialAgentId);
    }
  }, [initialAgentId]);

  const activeAgent = SANCTUARY_BOTS.find((a) => a.id === selectedId) || SANCTUARY_BOTS[0];
  const currentHistory = histories[selectedId] || [];
  const isCurrentStreaming = Boolean(streamingIds[selectedId]);
  const currentStreamingText = streamingTextMap[selectedId] || '';
  const currentTypingSteps = typingStepsMap[selectedId] || [];
  const activeSectionHome = getBotHomeSection(activeAgent.id);
  const handoffTarget = activeAgent.handoff
    ? SANCTUARY_BOTS.find((b) => b.id === activeAgent.handoff![0])
    : undefined;
  const isDark = theme === 'dark';

  const latestAgentMessage = [...currentHistory]
    .reverse()
    .find((m) => m.sender === 'agent');
  const activeBotState: BotAvatarState = isCurrentStreaming
    ? 'working'
    : isTabHidden || isIdleSleep || isNightRest || Boolean(latestAgentMessage?.aborted)
      ? 'sleeping'
      : 'default';

  const scrollThreadToEnd = useCallback((smooth = false) => {
    const el = threadRef.current;
    if (!el) return;
    const calm =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth && !calm ? 'smooth' : 'auto' });
  }, []);

  useEffect(() => {
    scrollThreadToEnd(isCurrentStreaming);
  }, [selectedId, currentHistory.length, isCurrentStreaming, currentStreamingText, scrollThreadToEnd]);

  useEffect(() => {
    const map = abortControllersRef.current;
    return () => {
      map.forEach((ctrl) => ctrl.abort());
      map.clear();
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!sheetOpen) return;
    closeSheetBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setSheetOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheetOpen]);

  const revealInList = useCallback((agentId: string) => {
    const list = listRef.current;
    if (!list) return;
    const item = list.querySelector<HTMLElement>(`[data-bot-id="${agentId}"]`);
    if (!item) return;
    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const behavior = calm ? 'auto' : 'smooth';
    if (list.scrollWidth > list.clientWidth + 1) {
      list.scrollTo({ left: item.offsetLeft - (list.clientWidth - item.offsetWidth) / 2, behavior });
    } else if (item.offsetTop < list.scrollTop) {
      list.scrollTo({ top: item.offsetTop - 8, behavior });
    } else if (item.offsetTop + item.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTo({ top: item.offsetTop + item.offsetHeight - list.clientHeight + 8, behavior });
    }
  }, []);

  const handleStopStream = useCallback((agentId: string) => {
    const ctrl = abortControllersRef.current.get(agentId);
    if (ctrl) {
      ctrl.abort();
      abortControllersRef.current.delete(agentId);
    }
  }, []);

  const selectAgent = useCallback(
    (nextId: string) => {
      if (nextId === selectedId || !SANCTUARY_BOTS.some((b) => b.id === nextId)) {
        setSheetOpen(false);
        return;
      }
      wakeBotFromIdle();
      if (streamingIds[selectedId]) {
        handleStopStream(selectedId);
      }

      const list = listRef.current;
      const srcAv = list?.querySelector<HTMLElement>(`[data-bot-id="${nextId}"] .ag-av`);
      const dstAv = headerAvRef.current;
      const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const docWithVt = document as Document & {
        startViewTransition?: (cb: () => void) => { finished: Promise<void> };
      };

      const applySwitch = () => {
        setSelectedId(nextId);
        setSheetOpen(false);
      };

      if (docWithVt.startViewTransition && srcAv && dstAv && !calm) {
        srcAv.style.viewTransitionName = 'agav';
        docWithVt
          .startViewTransition(() => {
            srcAv.style.viewTransitionName = '';
            dstAv.style.viewTransitionName = 'agav';
            applySwitch();
          })
          .finished.finally(() => {
            dstAv.style.viewTransitionName = '';
          });
      } else {
        applySwitch();
      }

      window.requestAnimationFrame(() => revealInList(nextId));
    },
    [selectedId, streamingIds, handleStopStream, revealInList]
  );

  const handleSend = useCallback(
    async (textToSend?: string, targetIdOverride?: string, options?: { skipCache?: boolean }) => {
      const targetId = targetIdOverride || selectedId;
      const agent = SANCTUARY_BOTS.find((a) => a.id === targetId) || activeAgent;
      const q = (textToSend ?? inputQuery).trim();
      if (!q || streamingIds[targetId]) return;
      wakeBotFromIdle();

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sender: 'user',
        text: q,
        done: true,
      };

      const prevHistory = histories[targetId] || [];
      const historyForPrompt = prevHistory
        .filter((m) => !m.id.startsWith('welcome-'))
        .map((m) => ({
          role: m.sender === 'agent' ? ('agent' as const) : ('user' as const),
          text: m.text,
        }));

      setHistories((prev) => ({
        ...prev,
        [targetId]: [...(prev[targetId] || []), userMsg],
      }));

      if (!textToSend) {
        setInputQuery('');
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }

      const controller = new AbortController();
      abortControllersRef.current.set(targetId, controller);
      setStreamingIds((prev) => ({ ...prev, [targetId]: true }));
      setStreamingTextMap((prev) => ({ ...prev, [targetId]: '' }));
      setTypingStepsMap((prev) => ({
        ...prev,
        [targetId]: ['Checking live Panchang & Mandirs'],
      }));

      try {
        const result = await streamBotReply(agent, q, historyForPrompt, {
          signal: controller.signal,
          skipCache: options?.skipCache,
          onSteps: (steps) => {
            setTypingStepsMap((prev) => ({ ...prev, [targetId]: steps }));
          },
          onToken: (partial) => {
            setStreamingTextMap((prev) => ({ ...prev, [targetId]: partial }));
          },
        });

        const replyMsg: ChatMessage = {
          id: `agent-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          sender: 'agent',
          text: result.text,
          steps: result.steps,
          source: result.source,
          suggestedLinks: result.suggestedLinks,
          done: true,
        };

        setHistories((prev) => ({
          ...prev,
          [targetId]: [...(prev[targetId] || []), replyMsg],
        }));
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') {
          const stoppedText = streamingTextMap[targetId]?.trim();
          setHistories((prev) => ({
            ...prev,
            [targetId]: [
              ...(prev[targetId] || []),
              {
                id: `agent-${Date.now()}`,
                sender: 'agent',
                text: stoppedText || 'Stopped for now — tap any prompt or ask again whenever you are ready.',
                done: Boolean(stoppedText),
                aborted: true,
              },
            ],
          }));
        }
      } finally {
        abortControllersRef.current.delete(targetId);
        setStreamingIds((prev) => ({ ...prev, [targetId]: false }));
        setStreamingTextMap((prev) => ({ ...prev, [targetId]: '' }));
        setTypingStepsMap((prev) => ({ ...prev, [targetId]: [] }));
      }
    },
    [selectedId, activeAgent, inputQuery, streamingIds, histories, streamingTextMap]
  );

  useEffect(() => {
    if (initialPrompt && initialPrompt !== handledPromptRef.current) {
      handledPromptRef.current = initialPrompt;
      void handleSend(initialPrompt, initialAgentId);
    }
  }, [initialPrompt, initialAgentId, handleSend]);

  const handleClearChat = () => {
    handleStopStream(selectedId);
    clearBotConversationCache(selectedId);
    setHistories((prev) => ({
      ...prev,
      [selectedId]: [
        {
          id: `welcome-${selectedId}-${Date.now()}`,
          sender: 'agent',
          text: activeAgent.greeting,
          done: false,
        },
      ],
    }));
    setSheetOpen(false);
    showToast('Conversation cleared');
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopiedId(id);
        showToast('Copied');
        window.setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1500);
      },
      () => showToast('Could not copy')
    );
  };

  const handleListKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const list = listRef.current;
    if (!list) return;
    const buttons = Array.from(list.querySelectorAll<HTMLButtonElement>('.ag-item'));
    const idx = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (idx === -1) return;
    let nextBtn: HTMLButtonElement | undefined;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      nextBtn = buttons[Math.min(buttons.length - 1, idx + 1)];
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      nextBtn = buttons[Math.max(0, idx - 1)];
    } else if (e.key === 'Home') {
      nextBtn = buttons[0];
    } else if (e.key === 'End') {
      nextBtn = buttons[buttons.length - 1];
    }
    if (nextBtn) {
      e.preventDefault();
      nextBtn.focus();
    }
  };

  const filteredAgents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return SANCTUARY_BOTS;
    return SANCTUARY_BOTS.filter((a) =>
      `${a.name} ${a.role} ${a.tag}`.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const content = (
    <div
      data-nosnippet
      className="ag-app"
      data-theme={theme}
      data-avatar="free"
      data-sheet={sheetOpen ? 'open' : 'closed'}
      data-bot-state={activeBotState}
      style={{ '--h': activeAgent.hue } as React.CSSProperties}
      onPointerMove={wakeBotFromIdle}
      onKeyDown={wakeBotFromIdle}
    >
      {/* 1. Material 3 Agents Directory Rail (becomes compact snap strip on <= 899px) */}
      <aside className="ag-pane ag-rail" aria-label="Sahayak Directory">
        <h1>Sahayak</h1>
        <label className="ag-search">
          <Search className="ic" size={18} aria-hidden="true" />
          <input
            type="search"
            placeholder="Find a sahayak"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Find a sahayak"
            autoComplete="off"
          />
          {searchQuery && (
            <button
              type="button"
              className="ag-search-clr"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </label>

        <div
          ref={listRef}
          className="ag-list"
          role="listbox"
          aria-label="Sahayak Roster"
          onKeyDown={handleListKeyDown}
        >
          {filteredAgents.length === 0 ? (
            <p className="ag-none">No sahayak match &ldquo;{searchQuery}&rdquo;.</p>
          ) : (
            filteredAgents.map((agent) => {
              const isSelected = agent.id === selectedId;
              const isBusy = Boolean(streamingIds[agent.id]);
              return (
                <button
                  key={agent.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={isSelected ? 0 : -1}
                  className="ag-item"
                  data-bot-id={agent.id}
                  style={{ '--ah': agent.hue } as React.CSSProperties}
                  onPointerDown={spawnRipple}
                  onClick={() => selectAgent(agent.id)}
                >
                  <span className="ag-av">
                    <SanctuaryBotAvatar
                      agent={agent}
                      size={40}
                      animated={isSelected}
                      working={isBusy}
                      state={isSelected ? activeBotState : 'default'}
                      dark={isDark}
                    />
                  </span>
                  <span className="ag-meta">
                    <b>{agent.name}</b>
                    <small>{agent.role}</small>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* 2. Center Conversation Pane */}
      <main className="ag-pane ag-stage" aria-label={`Conversation with ${activeAgent.name}`}>
        <header className="ag-bar">
          <span
            ref={headerAvRef}
            className="ag-av"
            data-bot-state={activeBotState}
            style={{ '--ah': activeAgent.hue } as React.CSSProperties}
          >
            <SanctuaryBotAvatar
              agent={activeAgent}
              size={44}
              animated={true}
              working={isCurrentStreaming}
              state={activeBotState}
              dark={isDark}
            />
          </span>
          <div className="ag-id">
            <h2>{activeAgent.name}</h2>
            <p>{activeAgent.role}</p>
          </div>
          <button
            type="button"
            className="ag-btn"
            onPointerDown={spawnRipple}
            onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? <Sun className="ic" size={18} /> : <Moon className="ic" size={18} />}
          </button>
          <button
            type="button"
            className="ag-btn info"
            onPointerDown={spawnRipple}
            onClick={() => setSheetOpen(true)}
            aria-label="Sahayak details"
            title="Details"
          >
            <Info className="ic" size={18} />
          </button>
          {onClose && (
            <button
              type="button"
              className="ag-btn"
              onPointerDown={spawnRipple}
              onClick={onClose}
              aria-label="Close AI Sakha Hub"
              title="Close (Esc)"
            >
              <X className="ic" size={19} />
            </button>
          )}
        </header>

        <div ref={threadRef} className="ag-thread" role="log" aria-live="polite" aria-label="Messages">
          {currentHistory.map((msg) => {
            const isUser = msg.sender === 'user';
            const isLatestAgentMsg = !isUser && latestAgentMessage?.id === msg.id;
            const msgState: BotAvatarState = msg.aborted
              ? 'sleeping'
              : isLatestAgentMsg && !isCurrentStreaming
                ? activeBotState
                : 'default';
            return (
              <div key={msg.id} className={`ag-msg ${isUser ? 'user' : 'agent'}`}>
                {!isUser ? (
                  <div className="ag-col">
                    {msg.steps && msg.steps.length > 0 && (
                      <details className="ag-steps">
                        <summary>
                          <Check className="ic" size={16} aria-hidden="true" />
                          <span>Verified in {msg.steps.length} steps</span>
                          <ChevronDown className="ic chev" size={16} aria-hidden="true" />
                        </summary>
                        <ol>
                          {msg.steps.map((s, idx) => (
                            <li key={idx}>
                              <Check className="ic" size={15} aria-hidden="true" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ol>
                      </details>
                    )}

                    <div className="ag-bub-row">
                      <span
                        className="ag-av"
                        data-bot-state={msgState}
                        style={{ '--ah': activeAgent.hue } as React.CSSProperties}
                      >
                        <SanctuaryBotAvatar
                          agent={activeAgent}
                          size={32}
                          animated={isLatestAgentMsg && !isCurrentStreaming}
                          state={msgState}
                          dark={isDark}
                        />
                      </span>
                      <div className="ag-bub">
                        <RichBotMessageBody text={msg.text} onCloseModal={onClose} />
                      </div>
                    </div>

                    {msg.done && (
                      <div className="ag-acts">
                        <button
                          type="button"
                          className="ag-btn"
                          onPointerDown={spawnRipple}
                          onClick={() => handleCopy(msg.id, msg.text)}
                          aria-label="Copy answer"
                          title="Copy"
                        >
                          {copiedId === msg.id ? <Check className="ic" size={16} /> : <Copy className="ic" size={16} />}
                        </button>

                        {msg.source && (
                          <span className="ag-source-tag" data-source={msg.source}>
                            {msg.source === 'cache'
                              ? 'Instant'
                              : msg.source === 'local'
                                ? 'Offline'
                                : ''}
                          </span>
                        )}

                        {msg.suggestedLinks?.map((link) => (
                          <a
                            key={link.href}
                            href={link.href}
                            className="ag-chipx hand"
                            onClick={(e) => {
                              e.preventDefault();
                              navigateSpaRoute(link.href, onClose);
                            }}
                          >
                            <span>{link.label}</span>
                            <ArrowRight className="ic" size={15} />
                          </a>
                        ))}

                        {handoffTarget && (
                          <button
                            type="button"
                            className="ag-chipx"
                            onPointerDown={spawnRipple}
                            onClick={() => selectAgent(handoffTarget.id)}
                          >
                            <span>Ask {handoffTarget.name}</span>
                            <ArrowRight className="ic" size={15} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="ag-col">
                    <div className="ag-bub">{msg.text}</div>
                  </div>
                )}
              </div>
            );
          })}

          {isCurrentStreaming && (
            <div className="ag-msg agent">
              <div className="ag-col">
                <details className="ag-steps" open>
                  <summary>
                    <IOSSpinner size="xs" theme={isDark ? 'white' : 'amber'} />
                    <span>Working on it…</span>
                    <ChevronDown className="ic chev" size={16} aria-hidden="true" />
                  </summary>
                  <ol>
                    {currentTypingSteps.map((s, idx) => (
                      <li key={idx}>
                        <IOSSpinner size="xs" theme={isDark ? 'white' : 'amber'} />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>
                </details>

                <div className="ag-bub-row">
                  <span
                    className="ag-av"
                    style={{ '--ah': activeAgent.hue } as React.CSSProperties}
                  >
                    <SanctuaryBotAvatar
                      agent={activeAgent}
                      size={32}
                      animated={true}
                      working={true}
                      dark={isDark}
                    />
                  </span>
                  <div className={`ag-bub${currentStreamingText ? ' live' : ''}`}>
                    {currentStreamingText ? (
                      <RichBotMessageBody
                        text={currentStreamingText}
                        onCloseModal={onClose}
                      />
                    ) : (
                      <span className="ag-typing" aria-label="Thinking">
                        <i />
                        <i />
                        <i />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="ag-composer">
          <div className="ag-chips" aria-label="Suggestions">
            {activeAgent.prompts.map((promptText, idx) => (
              <button
                key={idx}
                type="button"
                className="ag-chipx"
                disabled={isCurrentStreaming}
                onPointerDown={spawnRipple}
                onClick={() => void handleSend(promptText)}
              >
                <Sparkles className="ic" size={15} aria-hidden="true" />
                <span>{promptText}</span>
              </button>
            ))}
          </div>

          <div className="ag-field">
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder={`Message ${activeAgent.name}`}
              aria-label="Message"
              maxLength={2000}
              value={inputQuery}
              onChange={(e) => {
                setInputQuery(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
            />
            {isCurrentStreaming ? (
              <button
                type="button"
                className="ag-send stop"
                onPointerDown={spawnRipple}
                onClick={() => handleStopStream(selectedId)}
                aria-label="Stop response"
              >
                <Square className="ic" size={16} />
              </button>
            ) : (
              <button
                type="button"
                className={`ag-send${inputQuery.trim() ? ' ready' : ''}`}
                disabled={!inputQuery.trim() || isCurrentStreaming}
                aria-busy={isCurrentStreaming ? 'true' : 'false'}
                onPointerDown={spawnRipple}
                onClick={() => void handleSend()}
                aria-label="Send message"
              >
                <Send className="ic" size={18} />
              </button>
            )}
          </div>
          <p className="ag-hint">Enter to send · Shift+Enter for a new line</p>
        </div>
      </main>

      {/* 3. Right Profile / Bottom Sheet */}
      <aside className="ag-pane ag-profile" aria-label="Sahayak details">
        <button
          ref={closeSheetBtnRef}
          type="button"
          className="ag-btn ag-close"
          onPointerDown={spawnRipple}
          onClick={() => setSheetOpen(false)}
          aria-label="Close details"
        >
          <X className="ic" size={18} />
        </button>

        <div className="ag-hero">
          <span
            className="ag-av"
            data-bot-state={activeBotState}
            style={{ '--ah': activeAgent.hue } as React.CSSProperties}
          >
            <SanctuaryBotAvatar
              agent={activeAgent}
              size={68}
              animated={true}
              working={isCurrentStreaming}
              state={activeBotState}
              dark={isDark}
            />
          </span>
          <h2>{activeAgent.name}</h2>
          <p>{activeAgent.role}</p>
          <small className="ag-tip">{activeAgent.tip}</small>
        </div>

        <div className="ag-sec">
          <h3>Try asking</h3>
          <div className="ag-sec-list">
            {activeAgent.prompts.map((p, i) => (
              <button
                key={i}
                type="button"
                className="ag-chipx"
                disabled={isCurrentStreaming}
                onPointerDown={spawnRipple}
                onClick={() => {
                  setSheetOpen(false);
                  void handleSend(p);
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="ag-sec">
          <h3>Section</h3>
          <a
            href={activeSectionHome.href}
            className="ag-chipx hand"
            onClick={(e) => {
              e.preventDefault();
              navigateSpaRoute(activeSectionHome.href, onClose);
            }}
          >
            <span>Open {activeSectionHome.label}</span>
            <ArrowRight className="ic" size={16} />
          </a>
        </div>

        {handoffTarget && (
          <div className="ag-sec">
            <h3>Hands off to</h3>
            <button
              type="button"
              className="ag-chipx"
              onPointerDown={spawnRipple}
              onClick={() => selectAgent(handoffTarget.id)}
            >
              <span>{handoffTarget.name} · {handoffTarget.role}</span>
              <ArrowRight className="ic" size={16} />
            </button>
          </div>
        )}

        <div className="ag-sec">
          <h3>Conversation</h3>
          <button
            type="button"
            className="ag-chipx"
            onPointerDown={spawnRipple}
            onClick={handleClearChat}
          >
            Clear this conversation
          </button>
        </div>
      </aside>

      <div className="ag-scrim" onClick={() => setSheetOpen(false)} />
      <div className={`ag-toast${toastMsg ? ' on' : ''}`} role="status">
        {toastMsg || ''}
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="ag-modal-backdrop" onClick={onClose}>
        <div className="ag-modal-wrap" onClick={(e) => e.stopPropagation()}>
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default AgentHub;
