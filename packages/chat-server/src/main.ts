import { createChatServer } from './app.js'
import { loadConfig, syncUrl } from './config.js'

const config = loadConfig()
const server = createChatServer(config)
await server.listen()
console.log(`AUTODISCO chat server listening on http://${config.host}:${config.port}`)
console.log(`Automerge sync endpoint: ${syncUrl(config)}`)
