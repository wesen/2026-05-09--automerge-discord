import { createBotRun, sendMessage, type BotId, type MessageRecord, type WorkspaceDoc } from '@autodisco/chat-core'

export interface BotResponder {
  complete(prompt: string, context: readonly MessageRecord[]): Promise<string>
}

export async function respondToMention(
  doc: WorkspaceDoc,
  input: {
    botId: BotId
    channelId: WorkspaceDoc['channels'][string]['id']
    messageId: MessageRecord['id']
    responseMessageId: MessageRecord['id']
    now: string
    responder: BotResponder
  },
): Promise<void> {
  const messages = doc.messagesByChannel[input.channelId] ?? []
  const prompt = messages.find((message: MessageRecord) => message.id === input.messageId)
  if (!prompt) return
  const run = createBotRun(doc, {
    botId: input.botId,
    channelId: input.channelId,
    promptMessageId: input.messageId,
    startedAt: input.now,
  })
  if (run.status === 'completed') return
  const answer = await input.responder.complete(prompt.body, messages)
  sendMessage(doc, {
    id: input.responseMessageId,
    channelId: input.channelId,
    authorId: input.botId,
    body: answer,
    createdAt: input.now,
    botRunId: run.id,
  })
}
