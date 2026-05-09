import type { ChannelId, WorkspaceDoc } from '@autodisco/chat-core'

export interface ChannelSidebarProps {
  workspace: WorkspaceDoc
  activeChannelId: ChannelId
  onSelectChannel: (channelId: ChannelId) => void
}

export function ChannelSidebar({ workspace, activeChannelId, onSelectChannel }: ChannelSidebarProps) {
  const channels = Object.values(workspace.channels)
  return (
    <aside data-widget="autodisco" data-part="channel-sidebar" aria-label="Channels">
      <h2>{workspace.name}</h2>
      <nav>
        {channels.map((channel) => (
          <button key={channel.id} data-part="channel-item" data-active={channel.id === activeChannelId ? 'true' : 'false'} onClick={() => onSelectChannel(channel.id)}>
            <span>#</span>{channel.name}
          </button>
        ))}
      </nav>
    </aside>
  )
}
