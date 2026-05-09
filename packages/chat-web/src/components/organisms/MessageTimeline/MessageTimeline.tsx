import type { ChannelId, WorkspaceDoc } from '@autodisco/chat-core'
import { MessageBubble } from '../../molecules/MessageBubble/index.js'

export interface MessageTimelineProps {
  workspace: WorkspaceDoc
  channelId: ChannelId
  localMemberId?: string
}

export function MessageTimeline({ workspace, channelId, localMemberId }: MessageTimelineProps) {
  const messages = workspace.messagesByChannel[channelId] ?? []
  return (
    <section data-widget="autodisco" data-part="message-timeline" data-state={messages.length ? 'ready' : 'empty'} aria-label="Messages">
      {messages.length ? messages.map((message) => {
        const author = workspace.members[String(message.authorId)]?.displayName ?? String(message.authorId)
        return <MessageBubble key={message.id} message={message} authorName={author} own={String(message.authorId) === localMemberId} />
      }) : <p data-part="empty-state">No messages yet. The channel is quiet like a fresh floppy.</p>}
    </section>
  )
}
