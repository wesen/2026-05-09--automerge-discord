import { useState } from 'react'
import type { ChannelId, WorkspaceDoc } from '@autodisco/chat-core'
import { ChannelSidebar } from '../ChannelSidebar/index.js'
import { MessageTimeline } from '../MessageTimeline/index.js'
import { Composer } from '../../molecules/Composer/index.js'
import { StatusPill } from '../../atoms/StatusPill/index.js'

export interface ChatShellProps {
  workspace: WorkspaceDoc
  localMemberId?: string
  syncStatus?: 'idle' | 'ok' | 'warn' | 'error'
  onSendMessage?: (channelId: ChannelId, body: string) => void
}

export function ChatShell({ workspace, localMemberId, syncStatus = 'idle', onSendMessage }: ChatShellProps) {
  const firstChannel = Object.keys(workspace.channels)[0] as ChannelId | undefined
  const [activeChannelId, setActiveChannelId] = useState<ChannelId | undefined>(firstChannel)
  const activeChannel = activeChannelId ? workspace.channels[activeChannelId] : undefined

  return (
    <main data-widget="autodisco" data-part="chat-shell">
      {activeChannelId ? <ChannelSidebar workspace={workspace} activeChannelId={activeChannelId} onSelectChannel={setActiveChannelId} /> : null}
      <section data-part="chat-main">
        <header data-part="chat-header">
          <div>
            <p>#{activeChannel?.name ?? 'no-channel'}</p>
            <small>{activeChannel?.topic ?? 'Automerge relay prototype'}</small>
          </div>
          <StatusPill tone={syncStatus}>{syncStatus === 'ok' ? 'synced' : syncStatus}</StatusPill>
        </header>
        {activeChannelId ? <MessageTimeline workspace={workspace} channelId={activeChannelId} localMemberId={localMemberId} /> : <p data-part="empty-state">No channels.</p>}
        <Composer disabled={!activeChannelId} onSend={(body) => activeChannelId && onSendMessage?.(activeChannelId, body)} />
      </section>
    </main>
  )
}
