export interface BootstrapWorkspaceResponse {
  workspaceId: string
  workspaceDocUrl: string
  syncUrl: string
  keyhive?: {
    workspaceGroupId: string
    workspaceDocumentId: string
  }
}

export async function createWorkspace(baseUrl: string, name: string): Promise<BootstrapWorkspaceResponse> {
  const response = await fetch(new URL('/api/bootstrap/workspaces', baseUrl), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!response.ok) throw new Error(`create workspace failed: ${response.status}`)
  return (await response.json()) as BootstrapWorkspaceResponse
}
