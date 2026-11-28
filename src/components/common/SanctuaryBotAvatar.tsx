import React from 'react';
import { BotAvatar } from 'bot-avatars';
import type { SanctuaryBotAgent } from '../../data/botRoster';

export interface SanctuaryBotAvatarProps {
  agent: SanctuaryBotAgent;
  size?: number;
  active?: boolean;
  dark?: boolean;
  className?: string;
}

/**
 * Renders the authentic `bot-avatars` character silhouette & expression with:
 * - Clean `crisp` vector-style shading (no heavy `fabric` fur or `plastic` shaders)
 * - Unnecessary clutter removed (`headphones={false}`, `glasses="none"`, `bowTie={false}`, `hat="none"`)
 * - Zero idle requestAnimationFrame loops (`paused={!active}`, `still={!active}`, `jumpEvery={0}`)
 *   so 14+ visible bots render instantaneously with zero mobile lag.
 */
export const SanctuaryBotAvatar: React.FC<SanctuaryBotAvatarProps> = ({
  agent,
  size = 40,
  active = false,
  dark = false,
  className = '',
}) => (
  <BotAvatar
    type={agent.type}
    face={agent.face}
    hat="none"
    glasses="none"
    headphones={false}
    bowTie={false}
    shading="crisp"
    state={active ? 'working' : 'default'}
    paused={!active}
    interactive={active}
    jumpEvery={0}
    turn={active ? 0.45 : 0}
    theme={dark ? 'dark' : 'light'}
    size={size}
    className={className}
    aria-label={agent.name}
  />
);
