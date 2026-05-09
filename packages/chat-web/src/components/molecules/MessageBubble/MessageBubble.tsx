import type { MessageRecord } from '@autodisco/chat-core'

export interface MessageBubbleProps {
  message: MessageRecord
  authorName: string
  own?: boolean
}

export function MessageBubble({ message, authorName, own = false }: MessageBubbleProps) {
  return (
    <article data-widget="autodisco" data-part="message" data-own={own ? 'true' : 'false'}>
      <header data-part="message-meta">
        <strong data-role="author">{authorName}</strong>
        <time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
      </header>
      <p data-part="message-bubble">{message.deletedAt ? 'Deleted message' : message.body}</p>
      {Object.keys(message.reactions).length ? (
        <footer data-part="message-reactions">
          {Object.entries(message.reactions).map(([emoji, members]) => (
            <span key={emoji}>{emoji} {members.length}</span>
          ))}
        </footer>
      ) : null}
    </article>
  )
}
