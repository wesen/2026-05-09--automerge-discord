export interface ServerConfig {
  host: string
  port: number
  dataDir: string
  publicBaseUrl: string
  syncPath: string
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const port = Number.parseInt(env.PORT ?? '3030', 10)
  return {
    host: env.HOST ?? '0.0.0.0',
    port,
    dataDir: env.DATA_DIR ?? '.autodisco-data',
    publicBaseUrl: env.PUBLIC_BASE_URL ?? `http://localhost:${port}`,
    syncPath: env.SYNC_PATH ?? '/sync',
  }
}

export function syncUrl(config: ServerConfig): string {
  const base = new URL(config.publicBaseUrl)
  base.protocol = base.protocol === 'https:' ? 'wss:' : 'ws:'
  base.pathname = config.syncPath
  base.search = ''
  base.hash = ''
  return base.toString()
}
